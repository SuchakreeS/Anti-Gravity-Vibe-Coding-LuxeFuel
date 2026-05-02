import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('111111', 10);

  console.log('--- Initializing Seed with Fleet Data ---');

  // 1. Organizations
  const freeOrg = await prisma.organization.upsert({
    where: { name: 'Free Tier Fleet' },
    update: {},
    create: { name: 'Free Tier Fleet', plan: 'FREE' },
  });

  const enterpriseOrg = await prisma.organization.upsert({
    where: { name: 'Luxe Logistics Enterprise' },
    update: {},
    create: { name: 'Luxe Logistics Enterprise', plan: 'ENTERPRISE' },
  });

  // Helper to generate a car and logs
  const seedUserAssets = async (userId, userName, isOrgCar = false, orgId = null) => {
    const carCount = Math.floor(Math.random() * 2) + 1; // 1 or 2 cars
    
    for (let c = 1; c <= carCount; c++) {
      const fuelTypeChoices = ['GASOLINE', 'DIESEL', 'E20', 'E85'];
      const chosenFuel = fuelTypeChoices[Math.floor(Math.random() * fuelTypeChoices.length)];
      
      const car = await prisma.car.create({
        data: {
          name: isOrgCar ? `Fleet Unit ${Math.floor(Math.random() * 100)}` : `${userName}'s ${c === 1 ? 'Daily' : 'Backup'}`,
          brand: ['Toyota', 'Honda', 'Mazda', 'BMW', 'Tesla'][Math.floor(Math.random() * 5)],
          model: ['Corolla', 'Civic', 'CX-5', '3 Series', 'Model 3'][Math.floor(Math.random() * 5)],
          licensePlate: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(1000 + Math.random() * 9000)}`,
          userId: userId,
          organizationId: isOrgCar ? orgId : null,
          isPersonal: !isOrgCar,
          tankSize: 50,
          currentCarbonFactor: 2.31
        }
      });

      // Create 5-8 logs per car for more "realistic" leaderboard
      let currentOdo = 10000 + Math.floor(Math.random() * 50000);
      const recordCount = 8;

      for (let r = 1; r <= recordCount; r++) {
        const distance = 350 + Math.floor(Math.random() * 200);
        const pricePerLitre = 35 + (Math.random() * 8); 
        const efficiency = 12 + (Math.random() * 6); // 12-18 km/L
        const litres = distance / efficiency;
        const fuelCost = pricePerLitre * litres;
        currentOdo += distance;

        // Realistic emission factors
        const EMISSION_FACTORS = { GASOLINE: 2.31, DIESEL: 2.68, E20: 1.85, E85: 1.51 };
        const carbonEmitted = litres * (EMISSION_FACTORS[chosenFuel] || 2.31);

        await prisma.fuelRecord.create({
          data: {
            carId: car.id,
            submittedById: userId,
            date: new Date(Date.now() - (recordCount - r) * 3 * 24 * 60 * 60 * 1000), // Every 3 days
            fuelCost,
            pricePerLitre,
            odometer: currentOdo,
            litresRefueled: litres,
            distanceTraveled: distance,
            consumptionRate: efficiency,
            fuelType: chosenFuel,
            carbonEmitted,
            isFullTank: true,
            fuelLevel: 100
          }
        });
      }
    }
  };

  // 2. Individual Users (FREE & PRO)
  const userSpecs = [
    ...Array(5).fill({ plan: 'FREE', prefix: 'user' }),
    ...Array(3).fill({ plan: 'PRO', prefix: 'pro' })
  ];

  for (const [idx, spec] of userSpecs.entries()) {
    const email = `${spec.prefix}${idx + 1}@example.com`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: `${spec.plan} User ${idx + 1}`,
        password: passwordHash,
        role: 'INDIVIDUAL',
        plan: spec.plan,
      },
    });
    console.log(`Seeding assets for ${email}...`);
    await seedUserAssets(user.id, user.name);
  }

  // 3. Organization Admins
  const admins = [
    { email: 'admin@freefleet.com', name: 'Free Admin', org: freeOrg, plan: 'FREE' },
    { email: 'admin@luxelogistics.com', name: 'Enterprise Admin', org: enterpriseOrg, plan: 'ENTERPRISE' }
  ];

  for (const adminData of admins) {
    const admin = await prisma.user.upsert({
      where: { email: adminData.email },
      update: {},
      create: {
        email: adminData.email,
        name: adminData.name,
        password: passwordHash,
        role: 'ADMIN',
        plan: adminData.plan,
        organizationId: adminData.org.id,
      },
    });
    console.log(`Seeding fleet assets for ${adminData.org.name}...`);
    await seedUserAssets(admin.id, adminData.org.name, true, adminData.org.id);
  }

  // 4. Enterprise Employees (The Leaderboard participants)
  console.log('Seeding Enterprise Employees...');
  const employees = [
    { name: 'Takumi Fujiwara', email: 'takumi@luxelogistics.com', role: 'DRIVER' },
    { name: 'Keisuke Takahashi', email: 'keisuke@luxelogistics.com', role: 'DRIVER' },
    { name: 'Ryosuke Takahashi', email: 'ryosuke@luxelogistics.com', role: 'DRIVER' },
    { name: 'Kenji Speedstars', email: 'kenji@luxelogistics.com', role: 'USER' },
    { name: 'Itsuki Takeuchi', email: 'itsuki@luxelogistics.com', role: 'USER' },
  ];

  for (const emp of employees) {
    const user = await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        email: emp.email,
        name: emp.name,
        password: passwordHash,
        role: emp.role,
        plan: 'ENTERPRISE', // Inherit org plan
        organizationId: enterpriseOrg.id,
      },
    });
    console.log(`Seeding telemetry for operator: ${emp.name}...`);
    await seedUserAssets(user.id, emp.name, true, enterpriseOrg.id);
  }

  console.log('--- Seed Completed Successfully with Full Fleet Activity ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
