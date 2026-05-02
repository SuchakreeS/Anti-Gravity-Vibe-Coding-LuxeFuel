import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Zap, Wind } from 'lucide-react';

const EcoPulseCard = ({ records = [], car }) => {
  const pulseStats = useMemo(() => {
    if (records.length === 0) return { score: 0, totalCO2: 0, trees: 0, trend: [] };

    // 1. Calculate Total CO2 (Tons)
    const totalCO2Kg = records.reduce((sum, r) => sum + (r.carbonEmitted || 0), 0);
    const totalCO2Tons = totalCO2Kg / 1000;

    // 2. Tree Equivalent (1 tree = ~22kg/year)
    const treesOffset = Math.floor(totalCO2Kg / 22);

    // 3. Calculate Eco-Pulse Score (0-100)
    // Formula: Combination of Fuel Type usage + Efficiency vs Baseline
    const latest = records[records.length - 1];
    const fuelBonus = latest.fuelType === 'E85' ? 30 : latest.fuelType === 'E20' ? 15 : 0;
    
    // Efficiency Factor: how good is the km/L
    const efficiencyFactor = Math.min(70, (latest.consumptionRate || 10) * 4); 
    const rawScore = efficiencyFactor + fuelBonus;
    const score = Math.round(Math.min(100, Math.max(10, rawScore)));

    // 4. Trend Data for the Sparkline
    const trend = records.slice(-10).map(r => ({
      val: r.consumptionRate || 0,
      carbon: r.carbonEmitted || 0
    }));

    return { score, totalCO2: totalCO2Tons, trees: treesOffset, trend };
  }, [records]);

  const { score, totalCO2, trees, trend } = pulseStats;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card bg-carbon border border-industrial-border shadow-2xl overflow-hidden relative"
    >
      {/* Scanline Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent h-[2px] animate-scanline pointer-events-none" />

      <div className="card-body p-5 font-['Rajdhani']">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
              Environmental Telemetry // Active
            </h3>
            <h2 className="text-white text-2xl font-black italic tracking-tighter uppercase">Eco-Pulse</h2>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black italic text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
              {score}<span className="text-sm opacity-50 ml-1">/100</span>
            </div>
          </div>
        </div>

        {/* Pulse Heartbeat Visual */}
        <div className="h-16 w-full flex items-end gap-1 mb-6 px-1">
          {trend.map((t, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${(t.val / 20) * 100}%` }}
              className={`flex-1 rounded-t-sm ${score > 70 ? 'bg-emerald-500' : 'bg-turbo-orange'} opacity-60 shadow-neon`}
            />
          ))}
          {trend.length < 10 && Array(10 - trend.length).fill(0).map((_, i) => (
            <div key={`pad-${i}`} className="flex-1 h-[2px] bg-white/5 rounded-t-sm" />
          ))}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-asphalt/50 border border-industrial-border p-3 rounded-sm">
            <div className="flex items-center gap-2 mb-1">
              <Wind className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-bold text-text-secondary uppercase">CO2 Purged</span>
            </div>
            <div className="text-xl font-black text-white italic">
              {totalCO2.toFixed(3)} <span className="text-[10px] opacity-40">TONS</span>
            </div>
          </div>

          <div className="bg-asphalt/50 border border-industrial-border p-3 rounded-sm">
            <div className="flex items-center gap-2 mb-1">
              <Leaf className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-bold text-text-secondary uppercase">Forest Impact</span>
            </div>
            <div className="text-xl font-black text-white italic">
              {trees} <span className="text-[10px] opacity-40">TREES</span>
            </div>
          </div>
        </div>

        {/* Dynamic Status Label */}
        <div className="mt-4 pt-4 border-t border-industrial-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-ping ${score > 80 ? 'bg-emerald-500' : 'bg-turbo-orange'}`} />
            <span className="text-[10px] text-text-secondary font-black uppercase tracking-widest">
              {score > 85 ? 'Elite Operator' : score > 60 ? 'Optimal Burn' : 'Heavy Carbon Load'}
            </span>
          </div>
          <Zap className={`w-4 h-4 ${score > 80 ? 'text-emerald-400' : 'opacity-20'}`} />
        </div>
      </div>
    </motion.div>
  );
};

export default EcoPulseCard;
