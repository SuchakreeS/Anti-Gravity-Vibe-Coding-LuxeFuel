/**
 * LuxeFuel Achievement & Ranking System
 */

export const BADGES = [
  {
    id: 'tree-planter',
    name: 'Tree Planter',
    description: 'Offset at least 60kg of CO2 (1 tree equivalent)',
    icon: '🌳',
    check: (records) => {
      const totalCO2 = records.reduce((sum, r) => sum + (r.carbonEmitted || 0), 0);
      return totalCO2 >= 60;
    }
  },
  {
    id: 'ethanol-alchemist',
    name: 'Ethanol Alchemist',
    description: 'Use E85 fuel for the first time',
    icon: '🧪',
    check: (records) => records.some(r => r.fuelType === 'E85')
  },
  {
    id: 'ghost-driver',
    name: 'Ghost Driver',
    description: 'Achieve an efficiency over 18 km/L',
    icon: '👻',
    check: (records) => records.some(r => r.consumptionRate >= 18)
  },
  {
    id: 'full-tank-settlement',
    name: 'Logistics Master',
    description: 'Complete 5 consecutive full-tank refuels',
    icon: '📦',
    check: (records) => {
        let count = 0;
        for(let r of [...records].reverse()) {
            if(r.isFullTank) count++;
            else break;
        }
        return count >= 5;
    }
  },
  {
    id: 'night-rider',
    name: 'Night Rider',
    description: 'Refuel between 00:00 and 04:00',
    icon: '🌃',
    check: (records) => records.some(r => {
        const hour = new Date(r.date).getHours();
        return hour >= 0 && hour <= 4;
    })
  }
];

export const getRank = (score, totalRecords) => {
  if (totalRecords < 3) return { title: 'Initiate Pilot', level: 1, color: 'text-slate-400' };
  if (score > 90) return { title: 'Machine Master', level: 5, color: 'text-emerald-400 shadow-neon' };
  if (score > 75) return { title: 'Eco-Elite', level: 4, color: 'text-neon-violet' };
  if (score > 50) return { title: 'Street Tech', level: 3, color: 'text-turbo-orange' };
  return { title: 'Rookie Operator', level: 2, color: 'text-text-secondary' };
};
