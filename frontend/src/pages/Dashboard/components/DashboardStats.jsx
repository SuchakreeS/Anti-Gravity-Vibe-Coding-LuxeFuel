import React from 'react';
import { useCurrencyStore } from '../../../store/useCurrencyStore';

function DashboardStats({ stats, car }) {
  const unit = car?.engineType === 'EV' ? 'km/kWh' : 'km/L';
  const { symbol } = useCurrencyStore();
  if (!stats) return null;
  const { latest, avgConsumption, fullTankCount, comparison, totalSpent, avgCostPerKm } = stats;

  return (
    <div className="flex flex-col gap-3">
      {/* Financial Stats Summary */}
      <div className="stats shadow-2xl w-full bg-carbon border border-industrial-border text-text-primary">
        <div className="stat px-4 py-3">
          <div className="stat-title text-text-secondary text-[10px] font-black uppercase tracking-widest">Total Spent</div>
          <div className="stat-value text-2xl font-black italic text-turbo-orange drop-shadow-[0_0_10px_rgba(249,115,22,0.3)]">
            {symbol()}{totalSpent?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
          </div>
        </div>
        <div className="stat px-4 py-3 border-l border-industrial-border">
          <div className="stat-title text-text-secondary text-[10px] font-black uppercase tracking-widest">Avg Cost/km</div>
          <div className="stat-value text-xl font-bold font-mono">
            {avgCostPerKm ? `${symbol()}${avgCostPerKm.toFixed(2)}` : 'N/A'}
          </div>
        </div>
      </div>

      {(!latest.isFullTank || latest.consumptionRate === null) ? (
        <div className="flex flex-col gap-3">
          <div className="stats shadow-2xl w-full bg-carbon border border-industrial-border text-text-primary">
            <div className="stat">
              <div className="stat-title text-text-secondary">Partially Filled</div>
              <div className="stat-value text-xl text-neon-violet">Waiting for next Full Tank</div>
              <div className="stat-desc text-text-secondary">Distance added: +{latest.distanceTraveled} km</div>
            </div>
          </div>
          {avgConsumption !== null && (
            <div className="stats shadow-2xl w-full bg-carbon border border-industrial-border">
              <div className="stat">
                <div className="stat-title text-text-secondary">Avg. Consumption</div>
                <div className="stat-value text-lg text-text-primary">{avgConsumption.toFixed(2)} {unit}</div>
                <div className="stat-desc text-text-secondary">From {fullTankCount} full fill-ups</div>
              </div>
            </div>
          )}
        </div>
      ) : !comparison ? (
        <div className="flex flex-col gap-3">
          <div className="stats shadow-2xl w-full bg-neon-violet text-white">
            <div className="stat">
              <div className="stat-title text-white/80">First Full Fill-up</div>
              <div className="stat-value text-white">{latest.consumptionRate.toFixed(2)} {unit}</div>
              <div className="stat-desc text-white/90">Baseline established</div>
            </div>
          </div>
          <div className="stats shadow-2xl w-full bg-carbon border border-industrial-border">
            <div className="stat">
              <div className="stat-title text-text-secondary">Avg. Consumption</div>
              <div className="stat-value text-lg text-text-primary">{latest.consumptionRate.toFixed(2)} {unit}</div>
              <div className="stat-desc text-text-secondary">From 1 full fill-up</div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={`stats shadow-2xl w-full stats-vertical sm:stats-horizontal border border-industrial-border ${comparison.isEfficiencyImproved ? 'bg-emerald-950/30 text-emerald-400' : 'bg-rose-950/30 text-rose-400'}`}>
            <div className="stat">
              <div className="stat-title text-current opacity-80 uppercase text-[10px] font-bold tracking-widest">Latest</div>
              <div className="stat-value">{comparison.latest.toFixed(2)}</div>
              <div className="stat-desc text-current opacity-70 font-medium tracking-widest">{unit}</div>
            </div>
            <div className="stat border-l border-industrial-border">
              <div className="stat-title text-current opacity-80 uppercase text-[10px] font-bold tracking-widest">Previous</div>
              <div className="stat-value">{comparison.previous.toFixed(2)}</div>
              <div className="stat-desc text-current opacity-70 font-medium tracking-widest">{unit}</div>
            </div>
          </div>

          <div className={`stats shadow-2xl w-full border border-industrial-border ${comparison.isEfficiencyImproved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            <div className="stat py-2 items-center text-center">
              <div className="stat-title text-current opacity-80 text-xs uppercase font-bold tracking-wider">Difference</div>
              <div className="stat-value text-2xl font-bold flex items-center justify-center gap-2">
                {comparison.isEfficiencyImproved ? '📉' : '📈'} {comparison.isEfficiencyImproved ? '+' : ''}{comparison.diff.toFixed(2)}
              </div>
              <div className="stat-desc text-current opacity-80 text-sm font-medium">
                {comparison.isEfficiencyImproved ? 'Lower' : 'Higher'} Consumption
              </div>
            </div>
          </div>
          
          {avgConsumption !== null && (
            <div className="stats shadow-2xl w-full bg-carbon border border-industrial-border">
              <div className="stat">
                <div className="stat-title text-text-secondary">Avg. Consumption</div>
                <div className="stat-value text-lg text-text-primary">{avgConsumption.toFixed(2)} {unit}</div>
                <div className="stat-desc text-text-secondary">From {fullTankCount} full fill-ups</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DashboardStats;
