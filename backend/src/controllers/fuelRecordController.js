import prisma from '../prismaClient.js';
import { z } from 'zod';

const fuelRecordSchema = z.object({
  fuelCost: z.number().nonnegative(),
  pricePerLitre: z.number().nonnegative().optional(),
  pricePerKwh: z.number().nonnegative().optional(),
  odometer: z.number().nonnegative(),
  isFullTank: z.boolean().default(true),
  fuelLevel: z.number().min(0).max(100).optional(),
  fuelType: z.enum(['GASOLINE', 'DIESEL', 'E20', 'E85', 'ELECTRICITY']).optional(),
  date: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
});

/**
 * Helper: create an audit log entry (only for org users)
 */
const createAuditLog = async (action, entityType, entityId, userId, organizationId, details) => {
  if (!organizationId) return; // no audit for individual users
  await prisma.auditLog.create({
    data: {
      action,
      entityType,
      entityId,
      userId,
      organizationId,
      details: details ? JSON.stringify(details) : null
    }
  });
};

/**
 * Check if user has access to a car (org car or personal car)
 */
const findAccessibleCar = async (carId, user) => {
  const orgId = user.organizationId;
  if (orgId) {
    return prisma.car.findFirst({
      where: {
        id: carId,
        OR: [
          { organizationId: orgId, isPersonal: false },
          { userId: user.id, isPersonal: true }
        ]
      }
    });
  }
  return prisma.car.findFirst({ where: { id: carId, userId: user.id } });
};

export const addFuelRecord = async (req, res) => {
  try {
    const carId = parseInt(req.params.carId);

    const car = await findAccessibleCar(carId, req.user);
    if (!car) return res.status(404).json({ message: 'Car not found' });

    const { fuelCost, pricePerLitre, pricePerKwh, odometer, isFullTank, fuelLevel, fuelType, date } = fuelRecordSchema.parse(req.body);
    const litresRefueled = (pricePerLitre && pricePerLitre > 0) ? (fuelCost / pricePerLitre) : null;
    const kwhAdded = (pricePerKwh && pricePerKwh > 0) ? (fuelCost / pricePerKwh) : null;

    const record = await prisma.fuelRecord.create({
      data: {
        carId,
        fuelCost,
        pricePerLitre,
        pricePerKwh,
        odometer,
        litresRefueled,
        kwhAdded,
        fuelType: fuelType || (kwhAdded ? 'ELECTRICITY' : 'GASOLINE'),
        distanceTraveled: 0, // Will be recalculated
        consumptionRate: null, // Will be recalculated
        isFullTank,
        fuelLevel: isFullTank ? 100 : fuelLevel,
        submittedById: req.user.id,
        date: date ? new Date(date) : undefined
      }
    });

    // Recalculate everything in correct order
    await recalculateCarHistory(carId);

    // Audit log
    await createAuditLog('CREATE', 'FuelRecord', record.id, req.user.id, req.user.organizationId, {
      carId,
      fuelCost,
      pricePerLitre,
      pricePerKwh,
      odometer,
      litresRefueled,
      kwhAdded,
      fuelType: record.fuelType,
      isFullTank,
      date: date || new Date().toISOString()
    });

    res.status(201).json(record);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
    res.status(500).json({ message: error.message });
  }
};

export const getFuelRecords = async (req, res) => {
  try {
    const carId = parseInt(req.params.carId);

    const car = await findAccessibleCar(carId, req.user);
    if (!car) return res.status(404).json({ message: 'Car not found' });

    const records = await prisma.fuelRecord.findMany({
      where: { carId },
      include: {
        submittedBy: { select: { id: true, name: true } }
      },
      orderBy: [
        { odometer: 'asc' },
        { date: 'asc' },
        { id: 'asc' }
      ]
    });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const EMISSION_FACTORS = {
  GASOLINE: 2.31,
  DIESEL: 2.68,
  E20: 1.85,
  E85: 1.51,
  ELECTRICITY: 0.40,
};

const calculateGlobalAvgConsumption = (records, engineType) => {
  const fullTankRecords = records.filter(r => r.isFullTank);
  if (fullTankRecords.length < 2) return null;

  const firstFT = fullTankRecords[0];
  const lastFT = fullTankRecords[fullTankRecords.length - 1];
  const totalDist = lastFT.odometer - firstFT.odometer;
  
  const midRecords = records.slice(records.indexOf(firstFT) + 1, records.indexOf(lastFT) + 1);
  const totalEnergy = midRecords.reduce((sum, r) => {
    const litres = r.litresRefueled || 0;
    const kwh = r.kwhAdded || 0;
    if (engineType === 'EV') return sum + kwh;
    if (engineType === 'ICE' || engineType === 'HEV') return sum + litres;
    return sum + litres + (kwh / 8.9);
  }, 0);
  
  return totalEnergy > 0 ? totalDist / totalEnergy : null;
};

const calculateNewBlendFactor = (carTankSize, runningFuelLevel, fuelUsed, addedLitres, addedFactor, currentBlendFactor) => {
  if (carTankSize <= 0) return currentBlendFactor;
  
  const remainingLitres = Math.max(0, ((runningFuelLevel / 100) * carTankSize) - fuelUsed);
  const newTotalLitres = remainingLitres + addedLitres;
  
  if (newTotalLitres > 0) {
    return ((remainingLitres * currentBlendFactor) + (addedLitres * addedFactor)) / newTotalLitres;
  }
  return currentBlendFactor;
};

export const recalculateCarHistory = async (carId) => {
  const car = await prisma.car.findUnique({ where: { id: carId } });
  const records = await prisma.fuelRecord.findMany({
    where: { carId },
    orderBy: [
      { odometer: 'asc' },
      { date: 'asc' },
      { id: 'asc' }
    ]
  });

  if (records.length === 0) return;

  const globalAvgConsumption = calculateGlobalAvgConsumption(records, car.engineType);
  
  let lastFullTankIdx = -1;
  let runningFuelLevel = 100; // Starting assumption
  let currentBlendFactor = car.currentCarbonFactor || 2.31;
  
  // Track updates in memory to avoid N+1 queries and excessive DB writes
  const recordUpdates = records.map(r => ({ ...r }));

  for (let i = 0; i < recordUpdates.length; i++) {
    const current = recordUpdates[i];
    const previous = i > 0 ? recordUpdates[i - 1] : null;
    
    current.distanceTraveled = previous ? current.odometer - previous.odometer : 0;
    
    const segmentConsumption = globalAvgConsumption || 10;
    const fuelUsed = current.distanceTraveled / segmentConsumption;
    current.carbonEmitted = fuelUsed * currentBlendFactor;

    const addedFactor = EMISSION_FACTORS[current.fuelType] || (car.engineType === 'EV' ? 0.40 : 2.31);
    const addedLitres = current.litresRefueled || 0; // For PHEV/ICE tank mixing
    
    currentBlendFactor = calculateNewBlendFactor(
      car.tankSize, 
      runningFuelLevel, 
      fuelUsed, 
      addedLitres, 
      addedFactor, 
      currentBlendFactor
    );

    if (current.isFullTank) {
      current.fuelLevel = 100;
      if (lastFullTankIdx !== -1) {
        const segmentRecords = recordUpdates.slice(lastFullTankIdx + 1, i + 1);
        const segmentEnergy = segmentRecords.reduce((sum, r) => {
          const litres = r.litresRefueled || 0;
          const kwh = r.kwhAdded || 0;
          if (car.engineType === 'EV') return sum + kwh;
          if (car.engineType === 'ICE' || car.engineType === 'HEV') return sum + litres;
          return sum + litres + (kwh / 8.9);
        }, 0);
        const segmentDist = current.odometer - recordUpdates[lastFullTankIdx].odometer;
        
        if (segmentEnergy > 0) {
          const segmentAvg = segmentDist / segmentEnergy;
          for (let j = lastFullTankIdx + 1; j <= i; j++) {
            recordUpdates[j].consumptionRate = segmentAvg;
          }
        }
      }
      lastFullTankIdx = i;
      runningFuelLevel = 100;
    } else {
      current.consumptionRate = globalAvgConsumption;
      if (car.tankSize > 0 && car.engineType !== 'EV') {
        const remainingAfterUsage = ((runningFuelLevel / 100) * car.tankSize) - fuelUsed;
        const totalAfterRefill = remainingAfterUsage + addedLitres;
        current.fuelLevel = Math.min(100, Math.max(0, (totalAfterRefill / car.tankSize) * 100));
        runningFuelLevel = current.fuelLevel;
      } else {
        current.fuelLevel = null;
      }
    }
  }

  // Execute all updates in a single transaction
  const transactionOperations = recordUpdates.map(update => 
    prisma.fuelRecord.update({
      where: { id: update.id },
      data: {
        distanceTraveled: update.distanceTraveled,
        consumptionRate: update.consumptionRate,
        fuelLevel: update.fuelLevel,
        carbonEmitted: update.carbonEmitted,
      }
    })
  );

  transactionOperations.push(
    prisma.car.update({
      where: { id: carId },
      data: { currentCarbonFactor: currentBlendFactor }
    })
  );

  await prisma.$transaction(transactionOperations);
};

export const updateFuelRecord = async (req, res) => {
  try {
    const carId = parseInt(req.params.carId);
    const recordId = parseInt(req.params.recordId);

    const car = await findAccessibleCar(carId, req.user);
    if (!car) return res.status(404).json({ message: 'Car not found' });

    const { fuelCost, pricePerLitre, odometer, isFullTank, fuelLevel, date } = fuelRecordSchema.partial().parse(req.body);

    const existingRecord = await prisma.fuelRecord.findUnique({ where: { id: recordId } });
    if (!existingRecord) return res.status(404).json({ message: 'Record not found' });

    // Org users can only edit records they submitted
    if (req.user.role === 'USER' && existingRecord.submittedById !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit records you submitted' });
    }

    // Save before-state for audit
    const beforeState = {
      carId: existingRecord.carId,
      fuelCost: existingRecord.fuelCost,
      pricePerLitre: existingRecord.pricePerLitre,
      odometer: existingRecord.odometer,
      isFullTank: existingRecord.isFullTank,
      fuelLevel: existingRecord.fuelLevel,
      date: existingRecord.date
    };

    const updateData = {};
    if (fuelCost !== undefined && pricePerLitre !== undefined) {
      updateData.fuelCost = fuelCost;
      updateData.pricePerLitre = pricePerLitre;
      updateData.litresRefueled = pricePerLitre > 0 ? (fuelCost / pricePerLitre) : 0;
    } else if (fuelCost !== undefined) {
      updateData.fuelCost = fuelCost;
      updateData.litresRefueled = existingRecord.pricePerLitre > 0 ? (fuelCost / existingRecord.pricePerLitre) : 0;
    } else if (pricePerLitre !== undefined) {
      updateData.pricePerLitre = pricePerLitre;
      updateData.litresRefueled = pricePerLitre > 0 ? (existingRecord.fuelCost / pricePerLitre) : 0;
    }

    if (odometer !== undefined) updateData.odometer = odometer;
    if (isFullTank !== undefined) {
      updateData.isFullTank = isFullTank;
      if (isFullTank) updateData.fuelLevel = 100;
    }
    if (fuelLevel !== undefined) updateData.fuelLevel = fuelLevel;
    if (date !== undefined) updateData.date = new Date(date);

    await prisma.fuelRecord.update({
      where: { id: recordId },
      data: updateData
    });

    await recalculateCarHistory(carId);

    // Audit log with before/after
    await createAuditLog('UPDATE', 'FuelRecord', recordId, req.user.id, req.user.organizationId, {
      before: beforeState,
      after: {
        carId: beforeState.carId,
        fuelCost: updateData.fuelCost ?? beforeState.fuelCost,
        pricePerLitre: updateData.pricePerLitre ?? beforeState.pricePerLitre,
        odometer: updateData.odometer ?? beforeState.odometer,
        isFullTank: updateData.isFullTank ?? beforeState.isFullTank,
        fuelLevel: updateData.fuelLevel ?? beforeState.fuelLevel,
        date: updateData.date ?? beforeState.date
      }
    });

    res.json({ message: 'Record updated' });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
    res.status(500).json({ message: error.message });
  }
};

export const deleteFuelRecord = async (req, res) => {
  try {
    const carId = parseInt(req.params.carId);
    const recordId = parseInt(req.params.recordId);

    const car = await findAccessibleCar(carId, req.user);
    if (!car) return res.status(404).json({ message: 'Car not found' });

    // Org users (role === 'user') cannot delete records
    if (req.user.role === 'USER') {
      return res.status(403).json({ message: 'You do not have permission to delete records' });
    }

    const record = await prisma.fuelRecord.findUnique({ where: { id: recordId } });
    if (!record) return res.status(404).json({ message: 'Record not found' });

    // Audit log before deletion
    await createAuditLog('DELETE', 'FuelRecord', recordId, req.user.id, req.user.organizationId, {
      carId: record.carId,
      fuelCost: record.fuelCost,
      pricePerLitre: record.pricePerLitre,
      odometer: record.odometer,
      isFullTank: record.isFullTank,
      date: record.date
    });

    await prisma.fuelRecord.delete({ where: { id: recordId } });
    await recalculateCarHistory(carId);

    res.json({ message: 'Record deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
