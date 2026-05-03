import { PrismaClient } from '@prisma/client';
import { recalculateCarHistory } from '../src/controllers/fuelRecordController.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding EV & Hybrid fuel records...');

  const user = await prisma.user.findUnique({
    where: { email: 'admin@luxelogistics.com' }
  });

  if (!user) {
    console.error('Admin user not found. Please run seedVehicles.js first.');
    return;
  }

  // Find target cars
  const licensePlates = [
    'HEV-2001', 'HEV-2002', 
    'PHV-3001', 'PHV-3002', 
    'EV-4001', 'EV-4002', 'EV-4003'
  ];

  const cars = await prisma.car.findMany({
    where: { licensePlate: { in: licensePlates } }
  });

  if (cars.length === 0) {
    console.error('No EV/Hybrid vehicles found.');
    return;
  }

  let totalRecordsCreated = 0;

  for (const car of cars) {
    console.log(`Generating logs for ${car.licensePlate} (${car.engineType})...`);
    
    // Clear existing records for this car to avoid messy overlaps during seed
    await prisma.fuelRecord.deleteMany({ where: { carId: car.id } });

    let currentOdo = 5000;
    let baseDate = new Date();
    baseDate.setMonth(baseDate.getMonth() - 2); // Start 2 months ago

    const recordsToCreate = [];

    // Generate 6 records per car
    for (let i = 0; i < 6; i++) {
      currentOdo += Math.floor(Math.random() * 300) + 200; // Drive 200-500 km
      baseDate.setDate(baseDate.getDate() + Math.floor(Math.random() * 5) + 3); // 3-8 days later
      
      const isFull = i === 0 || i % 2 === 0 || i === 5; // Ensures multiple full tanks for stats
      
      let fuelCost, pricePerLitre, pricePerKwh, litresRefueled, kwhAdded, fuelType;

      if (car.engineType === 'EV') {
        fuelType = 'ELECTRICITY';
        kwhAdded = (car.batteryCapacity || 60) * (isFull ? 0.8 : 0.4); 
        pricePerKwh = 7.5; // THB/kWh
        fuelCost = kwhAdded * pricePerKwh;
        pricePerLitre = null;
        litresRefueled = null;
      } else if (car.engineType === 'HEV') {
        fuelType = 'E20';
        litresRefueled = (car.tankSize || 50) * (isFull ? 0.8 : 0.4);
        pricePerLitre = 35.5; // THB/L
        fuelCost = litresRefueled * pricePerLitre;
        pricePerKwh = null;
        kwhAdded = null;
      } else if (car.engineType === 'PHEV') {
        // Alternate between Gas and Electricity for PHEV
        if (i % 2 === 0) {
          fuelType = 'GASOLINE';
          litresRefueled = (car.tankSize || 50) * (isFull ? 0.7 : 0.3);
          pricePerLitre = 40.0;
          fuelCost = litresRefueled * pricePerLitre;
          pricePerKwh = null;
          kwhAdded = null;
        } else {
          fuelType = 'ELECTRICITY';
          kwhAdded = (car.batteryCapacity || 20) * (isFull ? 0.9 : 0.5);
          pricePerKwh = 7.5;
          fuelCost = kwhAdded * pricePerKwh;
          pricePerLitre = null;
          litresRefueled = null;
        }
      }

      recordsToCreate.push({
        carId: car.id,
        submittedById: user.id,
        date: new Date(baseDate),
        fuelCost,
        pricePerLitre,
        pricePerKwh,
        odometer: currentOdo,
        litresRefueled,
        kwhAdded,
        fuelType,
        isFullTank: isFull,
        distanceTraveled: 0,
        consumptionRate: null,
      });
    }

    // Insert records sequentially
    for (const data of recordsToCreate) {
      await prisma.fuelRecord.create({ data });
      totalRecordsCreated++;
    }

    // Recalculate stats using the controller's robust logic
    await recalculateCarHistory(car.id);
    console.log(`Recalculated stats for ${car.licensePlate}`);
  }

  console.log(`\nSuccessfully seeded ${totalRecordsCreated} fuel logs for ${cars.length} vehicles!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
