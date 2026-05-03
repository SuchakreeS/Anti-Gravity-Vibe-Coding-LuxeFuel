import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding vehicles for Luxe Logistics Enterprise...');

  // 1. Create or find the Organization
  let org = await prisma.organization.findUnique({
    where: { name: 'Luxe Logistics Enterprise' }
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'Luxe Logistics Enterprise',
        plan: 'ENTERPRISE'
      }
    });
    console.log('Created organization:', org.name);
  } else {
    console.log('Found organization:', org.name);
  }

  // 2. Create an Admin User if not exists
  let admin = await prisma.user.findUnique({
    where: { email: 'admin@luxelogistics.com' }
  });

  if (!admin) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    admin = await prisma.user.create({
      data: {
        email: 'admin@luxelogistics.com',
        name: 'Luxe Admin',
        password: hashedPassword,
        role: 'ADMIN',
        plan: 'ENTERPRISE',
        organizationId: org.id
      }
    });
    console.log('Created admin user: admin@luxelogistics.com (password: password123)');
  }

  // 3. Define the vehicles
  const vehicles = [
    // ICE Vehicles (Internal Combustion Engine)
    {
      name: 'LOG-TRUCK-01',
      brand: 'Isuzu',
      model: 'D-Max',
      licensePlate: 'ICE-1001',
      tankSize: 76,
      engineType: 'ICE',
      organizationId: org.id,
      userId: admin.id,
    },
    {
      name: 'EXEC-CAR-01',
      brand: 'Mercedes-Benz',
      model: 'S-Class',
      licensePlate: 'ICE-1002',
      tankSize: 70,
      engineType: 'ICE',
      organizationId: org.id,
      userId: admin.id,
    },
    
    // HEV Vehicles (Hybrid Electric Vehicle)
    {
      name: 'SALES-HYB-01',
      brand: 'Toyota',
      model: 'Camry Hybrid',
      licensePlate: 'HEV-2001',
      tankSize: 50,
      engineType: 'HEV',
      organizationId: org.id,
      userId: admin.id,
    },
    {
      name: 'SALES-HYB-02',
      brand: 'Honda',
      model: 'Accord e:HEV',
      licensePlate: 'HEV-2002',
      tankSize: 48,
      engineType: 'HEV',
      organizationId: org.id,
      userId: admin.id,
    },

    // PHEV Vehicles (Plug-in Hybrid Electric Vehicle)
    {
      name: 'EXEC-PHEV-01',
      brand: 'BMW',
      model: 'X5 xDrive50e',
      licensePlate: 'PHV-3001',
      tankSize: 69,
      batteryCapacity: 25.7,
      engineType: 'PHEV',
      organizationId: org.id,
      userId: admin.id,
    },
    {
      name: 'MGMT-PHEV-02',
      brand: 'Volvo',
      model: 'XC90 Recharge',
      licensePlate: 'PHV-3002',
      tankSize: 71,
      batteryCapacity: 18.8,
      engineType: 'PHEV',
      organizationId: org.id,
      userId: admin.id,
    },

    // EV Vehicles (Electric Vehicle)
    {
      name: 'DELIVERY-EV-01',
      brand: 'Tesla',
      model: 'Model Y',
      licensePlate: 'EV-4001',
      batteryCapacity: 75,
      engineType: 'EV',
      organizationId: org.id,
      userId: admin.id,
    },
    {
      name: 'DELIVERY-EV-02',
      brand: 'BYD',
      model: 'Atto 3',
      licensePlate: 'EV-4002',
      batteryCapacity: 60.48,
      engineType: 'EV',
      organizationId: org.id,
      userId: admin.id,
    },
    {
      name: 'EXEC-EV-01',
      brand: 'Porsche',
      model: 'Taycan',
      licensePlate: 'EV-4003',
      batteryCapacity: 93.4,
      engineType: 'EV',
      organizationId: org.id,
      userId: admin.id,
    }
  ];

  let createdCount = 0;
  for (const v of vehicles) {
    const exists = await prisma.car.findFirst({
      where: { licensePlate: v.licensePlate }
    });

    if (!exists) {
      await prisma.car.create({ data: v });
      createdCount++;
      console.log(`Created ${v.engineType}: ${v.name} (${v.brand} ${v.model})`);
    }
  }

  console.log(`\nSeed completed! Added ${createdCount} new vehicles to Luxe Logistics Enterprise.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
