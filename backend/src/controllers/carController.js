const prisma = require('../prismaClient');
const { z } = require('zod');

const carSchema = z.object({
  name: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  otherSpecs: z.string().optional(),
});

exports.createCar = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = carSchema.parse(req.body);
    const car = await prisma.car.create({
      data: {
        ...data,
        userId
      }
    });
    res.status(201).json(car);
  } catch (error) {
     if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
     res.status(500).json({ message: error.message });
  }
};

exports.getCars = async (req, res) => {
  try {
    const userId = req.user.id;
    const cars = await prisma.car.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    res.json(cars);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const car = await prisma.car.findFirst({
        where: { id, userId: req.user.id },
        include: { fuelRecords: { orderBy: { date: 'desc' } } }
    });
    if (!car) return res.status(404).json({ message: 'Car not found' });
    res.json(car);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.car.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ message: 'Car not found' });

    const data = carSchema.parse(req.body);
    const car = await prisma.car.update({
      where: { id },
      data
    });
    res.json(car);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.car.findFirst({ where: { id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ message: 'Car not found' });

    // Delete all fuel records first, then the car
    await prisma.fuelRecord.deleteMany({ where: { carId: id } });
    await prisma.car.delete({ where: { id } });
    res.json({ message: 'Car deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

