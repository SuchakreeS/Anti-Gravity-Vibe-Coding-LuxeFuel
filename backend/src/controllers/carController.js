import prisma from '../prismaClient.js';
import { z } from 'zod';
import axios from 'axios';

const carSchema = z.object({
  name: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  licensePlate: z.string().nullable().optional(),
  tankSize: z.number().nonnegative().nullable().optional(),
  otherSpecs: z.string().nullable().optional(),
  maintenanceData: z.string().nullable().optional(),
  isPersonal: z.boolean().optional().default(false),
});

const getAccessibleCarWhereClause = (id, user, action) => {
  const { id: userId, role, organizationId: orgId } = user;
  
  if (action === 'read') {
    if (orgId) {
      return { id, OR: [{ organizationId: orgId, isPersonal: false }, { userId, isPersonal: true }] };
    }
    return { id, userId };
  }
  
  if (action === 'update') {
    if (role === 'ADMIN' && orgId) {
      return { id, OR: [{ organizationId: orgId, isPersonal: false }, { userId, isPersonal: true }] };
    }
    return { id, userId };
  }

  if (action === 'delete') {
    if (role === 'ADMIN' && orgId) {
      return { id, OR: [{ organizationId: orgId, isPersonal: false }, { userId, isPersonal: true }] };
    }
    if (role === 'USER') {
      return { id, userId, isPersonal: true };
    }
    return { id, userId };
  }
};

export const createCar = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = carSchema.parse(req.body);
    const role = req.user.role;
    const orgId = req.user.organizationId;

    let carData = {
      name: data.name,
      brand: data.brand,
      model: data.model,
      licensePlate: data.licensePlate || null,
      tankSize: data.tankSize,
      otherSpecs: data.otherSpecs || null,
      maintenanceData: data.maintenanceData || null,
    };

    if (role === 'ADMIN') {
      if (data.isPersonal) {
        // Admin adding their own personal car
        carData.isPersonal = true;
        carData.userId = userId;
      } else {
        // Admin adding an org car
        carData.isPersonal = false;
        carData.organizationId = orgId;
        if (!data.licensePlate) {
          return res.status(400).json({ message: 'License plate is required for organization cars' });
        }
      }
    } else if (role === 'USER') {
      // Org user can only create personal cars
      carData.isPersonal = true;
      carData.userId = userId;
      if (!data.licensePlate) {
        return res.status(400).json({ message: 'License plate is required' });
      }
    } else {
      // individual user — current behavior
      carData.isPersonal = true;
      carData.userId = userId;
    }

    const car = await prisma.car.create({ data: carData });
    res.status(201).json(car);
  } catch (error) {
     if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
     res.status(500).json({ message: error.message });
  }
};

export const getCars = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const orgId = req.user.organizationId;

    let cars;
    if (orgId && (role === 'ADMIN' || role === 'USER')) {
      // Return org cars + user's personal cars
      cars = await prisma.car.findMany({
        where: {
          OR: [
            { organizationId: orgId, isPersonal: false },
            { userId: userId, isPersonal: true }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Individual user — their own cars
      cars = await prisma.car.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
    }

    res.json(cars);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const whereClause = getAccessibleCarWhereClause(id, req.user, 'read');

    const car = await prisma.car.findFirst({
      where: whereClause,
      include: { fuelRecords: { orderBy: { date: 'desc' } } }
    });
    if (!car) return res.status(404).json({ message: 'Car not found' });
    res.json(car);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const whereClause = getAccessibleCarWhereClause(id, req.user, 'update');

    const existing = await prisma.car.findFirst({ where: whereClause });

    if (!existing) return res.status(404).json({ message: 'Car not found' });

    const data = carSchema.parse(req.body);
    const car = await prisma.car.update({
      where: { id },
      data: {
        name: data.name,
        brand: data.brand,
        model: data.model,
        licensePlate: data.licensePlate || existing.licensePlate,
        tankSize: data.tankSize ?? existing.tankSize,
        otherSpecs: data.otherSpecs || null,
        maintenanceData: data.maintenanceData || existing.maintenanceData,
      }
    });
    res.json(car);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
    res.status(500).json({ message: error.message });
  }
};

export const deleteCar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const whereClause = getAccessibleCarWhereClause(id, req.user, 'delete');

    const existing = await prisma.car.findFirst({ where: whereClause });

    if (!existing) return res.status(404).json({ message: 'Car not found' });

    await prisma.$transaction([
      prisma.fuelRecord.deleteMany({ where: { carId: id } }),
      prisma.car.delete({ where: { id } })
    ]);
    res.json({ message: 'Car deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProxyMakes = async (req, res) => {
  try {
    const response = await axios.get('https://carapi.app/api/makes');
    res.json(response.data);
  } catch (error) {
    console.error('CarAPI Makes Proxy Error:', error.message);
    res.status(error.response?.status || 500).json({ message: error.message });
  }
};

export const getProxyModels = async (req, res) => {
  try {
    const { make_id } = req.query;
    if (!make_id) return res.status(400).json({ message: 'make_id is required' });
    const response = await axios.get(`https://carapi.app/api/models/v2?make_id=${make_id}`);
    res.json(response.data);
  } catch (error) {
    console.error('CarAPI Models Proxy Error:', error.message);
    res.status(error.response?.status || 500).json({ message: error.message });
  }
};
