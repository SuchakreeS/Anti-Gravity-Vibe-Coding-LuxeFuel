const prisma = require('../prismaClient');
const { z } = require('zod');

const fuelRecordSchema = z.object({
  fuelCost: z.number().positive(),
  pricePerLitre: z.number().positive(),
  odometer: z.number().positive(),
  isFullTank: z.boolean().default(true),
});

exports.addFuelRecord = async (req, res) => {
  try {
    const carId = parseInt(req.params.carId);
    
    // Verify car belongs to user
    const car = await prisma.car.findFirst({ where: { id: carId, userId: req.user.id } });
    if (!car) return res.status(404).json({ message: 'Car not found' });

    const { fuelCost, pricePerLitre, odometer, isFullTank } = fuelRecordSchema.parse(req.body);

    const litresRefueled = fuelCost / pricePerLitre;

    // Get the most recent fuel record to calculate distance & consumption
    const previousRecord = await prisma.fuelRecord.findFirst({
      where: { carId },
      orderBy: { odometer: 'desc' },
    });

    let distanceTraveled = 0;
    if (previousRecord) {
      if (odometer <= previousRecord.odometer) {
        return res.status(400).json({ message: 'Odometer must be greater than previous reading (' + previousRecord.odometer + ')' });
      }
      distanceTraveled = odometer - previousRecord.odometer;
    }

    let consumptionRate = null;

    if (isFullTank && previousRecord) {
      // Find the deeply preceding full tank
      const lastFullTank = await prisma.fuelRecord.findFirst({
        where: { carId, isFullTank: true, odometer: { lt: odometer } },
        orderBy: { odometer: 'desc' }
      });

      if (lastFullTank) {
        // Find all partial fills between the last full tank and the current reading
        const partialFills = await prisma.fuelRecord.findMany({
          where: { 
             carId, 
             odometer: { gt: lastFullTank.odometer, lt: odometer }
          }
        });

        const totalPartialLitres = partialFills.reduce((sum, f) => sum + f.litresRefueled, 0);
        const totalLitresConsumed = totalPartialLitres + litresRefueled;
        const totalDistance = odometer - lastFullTank.odometer;

        consumptionRate = totalDistance / totalLitresConsumed;
      }
    }

    const record = await prisma.fuelRecord.create({
      data: {
        carId,
        fuelCost,
        pricePerLitre,
        odometer,
        litresRefueled,
        distanceTraveled,
        consumptionRate,
        isFullTank
      }
    });

    res.status(201).json(record);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
    res.status(500).json({ message: error.message });
  }
};

exports.getFuelRecords = async (req, res) => {
  try {
    const carId = parseInt(req.params.carId);
    
    // Verify car belongs to user
    const car = await prisma.car.findFirst({ where: { id: carId, userId: req.user.id } });
    if (!car) return res.status(404).json({ message: 'Car not found' });

    const records = await prisma.fuelRecord.findMany({
      where: { carId },
      orderBy: { date: 'asc' } // chronological order for graphs
    });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const recalculateCarHistory = async (carId) => {
  const records = await prisma.fuelRecord.findMany({
    where: { carId },
    orderBy: { odometer: 'asc' }
  });

  if (records.length === 0) return;

  for (let i = 0; i < records.length; i++) {
    const current = records[i];
    const previous = i > 0 ? records[i - 1] : null;

    let distanceTraveled = 0;
    let consumptionRate = null;

    if (previous) {
      distanceTraveled = current.odometer - previous.odometer;
    }

    if (current.isFullTank && previous) {
      const lastFullTankIndex = records.slice(0, i).findLastIndex(r => r.isFullTank);
      const lastFullTank = lastFullTankIndex !== -1 ? records[lastFullTankIndex] : null;

      if (lastFullTank) {
        const partialFills = records.slice(lastFullTankIndex + 1, i);
        const totalPartialLitres = partialFills.reduce((sum, f) => sum + f.litresRefueled, 0);
        const totalLitresConsumed = totalPartialLitres + current.litresRefueled;
        const totalDistance = current.odometer - lastFullTank.odometer;

        consumptionRate = totalDistance / totalLitresConsumed;
      }
    }

    await prisma.fuelRecord.update({
      where: { id: current.id },
      data: { distanceTraveled, consumptionRate }
    });
  }
};

exports.updateFuelRecord = async (req, res) => {
  try {
    const carId = parseInt(req.params.carId);
    const recordId = parseInt(req.params.recordId);

    const car = await prisma.car.findFirst({ where: { id: carId, userId: req.user.id } });
    if (!car) return res.status(404).json({ message: 'Car not found' });

    const { fuelCost, pricePerLitre, odometer, isFullTank } = fuelRecordSchema.partial().parse(req.body);

    const existingRecord = await prisma.fuelRecord.findUnique({ where: { id: recordId } });
    if (!existingRecord) return res.status(404).json({ message: 'Record not found' });

    const updateData = {};
    if (fuelCost !== undefined && pricePerLitre !== undefined) {
       updateData.fuelCost = fuelCost;
       updateData.pricePerLitre = pricePerLitre;
       updateData.litresRefueled = fuelCost / pricePerLitre;
    } else if (fuelCost !== undefined) {
       updateData.fuelCost = fuelCost;
       updateData.litresRefueled = fuelCost / existingRecord.pricePerLitre;
    } else if (pricePerLitre !== undefined) {
       updateData.pricePerLitre = pricePerLitre;
       updateData.litresRefueled = existingRecord.fuelCost / pricePerLitre;
    }

    if (odometer !== undefined) updateData.odometer = odometer;
    if (isFullTank !== undefined) updateData.isFullTank = isFullTank;

    await prisma.fuelRecord.update({
      where: { id: recordId },
      data: updateData
    });

    await recalculateCarHistory(carId);
    res.json({ message: 'Record updated' });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
    res.status(500).json({ message: error.message });
  }
};

exports.deleteFuelRecord = async (req, res) => {
  try {
    const carId = parseInt(req.params.carId);
    const recordId = parseInt(req.params.recordId);

    const car = await prisma.car.findFirst({ where: { id: carId, userId: req.user.id } });
    if (!car) return res.status(404).json({ message: 'Car not found' });

    await prisma.fuelRecord.delete({ where: { id: recordId } });
    await recalculateCarHistory(carId);

    res.json({ message: 'Record deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
