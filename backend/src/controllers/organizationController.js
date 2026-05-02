import prisma from '../prismaClient.js';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const createMemberSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

export const getOrganization = async (req, res) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.user.organizationId },
      include: {
        _count: { select: { users: true, cars: true } }
      }
    });
    if (!org) return res.status(404).json({ message: 'Organization not found' });
    res.json(org);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMembers = async (req, res) => {
  try {
    const members = await prisma.user.findMany({
      where: { organizationId: req.user.organizationId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' }
    });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createMember = async (req, res) => {
  try {
    const { email, password, name } = createMemberSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const member = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'USER',
        organizationId: req.user.organizationId
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    res.status(201).json(member);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: error.message });
  }
};

export const removeMember = async (req, res) => {
// ... existing logic ...
};

export const getLeaderboard = async (req, res) => {
  try {
    const orgId = req.user.organizationId;

    // Get all users in org with their records
    const users = await prisma.user.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        name: true,
        role: true,
        fuelRecords: {
          include: { car: { select: { name: true, brand: true } } },
          orderBy: { date: 'desc' }
        }
      }
    });

    const leaderboard = users.map(user => {
      const records = user.fuelRecords;
      const totalCO2 = records.reduce((sum, r) => sum + (r.carbonEmitted || 0), 0);
      const totalDist = records.reduce((sum, r) => sum + (r.distanceTraveled || 0), 0);
      
      // Calculate Avg Eco-Pulse (Simplified for leaderboard)
      const avgEfficiency = records.length > 0 
        ? records.reduce((sum, r) => sum + (r.consumptionRate || 0), 0) / records.length
        : 0;
      
      // E85/E20 adoption %
      const greenLogs = records.filter(r => ['E20', 'E85'].includes(r.fuelType)).length;
      const greenAdoption = records.length > 0 ? (greenLogs / records.length) * 100 : 0;

      // Final Rank Score (0-100)
      const pulseScore = Math.round(Math.min(100, (avgEfficiency * 4) + (greenAdoption * 0.3)));

      return {
        id: user.id,
        name: user.name,
        role: user.role,
        pulseScore,
        totalCO2: totalCO2 / 1000, // convert to tons
        totalDist,
        logCount: records.length,
        greenAdoption: Math.round(greenAdoption),
        recentLogs: records.slice(0, 5).map(r => ({
          id: r.id,
          date: r.date,
          carName: r.car.name,
          distance: r.distanceTraveled,
          consumption: r.consumptionRate,
          fuelType: r.fuelType,
          co2: r.carbonEmitted
        }))
      };
    }).sort((a, b) => b.pulseScore - a.pulseScore);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
