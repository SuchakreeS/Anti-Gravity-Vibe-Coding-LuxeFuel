import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useCurrencyStore } from '../../../store/useCurrencyStore';

const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '' }) => {
  if (active && payload && payload.length && payload[0].value != null && payload[0].payload) {
    const { displayDate, displayTime } = payload[0].payload;
    return (
      <div className="bg-carbon p-4 shadow-2xl rounded-xl border border-industrial-border flex flex-col items-center min-w-[150px] relative z-[9999]">
        <p className="text-2xl font-black text-white leading-none italic">
          {prefix}{payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <div className="mt-3 flex flex-col items-center gap-1">
          <p className="text-sm font-medium text-text-secondary">{displayDate || label}</p>
          <p className="text-[10px] font-bold text-text-secondary/50 tracking-widest uppercase">
            {displayTime || '??:??'} UTC+7
          </p>
        </div>
      </div>
    );
  }
  return null;
};

function DashboardCharts({ records, convertedRecords }) {
  const { currency, symbol } = useCurrencyStore();

  return (
    <div className="lg:col-span-2 flex flex-col gap-6">
      {/* 1. Consumption Rate */}
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card bg-carbon border border-industrial-border shadow-2xl">
        <div className="card-body">
          <h2 className="card-title text-text-secondary text-xs uppercase tracking-widest mb-4">1. Consumption Rate / Time</h2>
          <div className="h-64 overflow-visible">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={records} margin={{ top: 20, right: 50, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="id"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }}
                  dy={10}
                  tickFormatter={(id) => {
                    const record = records.find(r => r.id === id);
                    return record ? record.xAxisLabel : '';
                  }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} dx={-10} />
                <Tooltip
                  content={<CustomTooltip suffix="km/L" />}
                  cursor={false}
                  wrapperStyle={{ zIndex: 1000 }}
                  allowEscapeViewBox={{ x: false, y: true }}
                />
                <Area isAnimationActive={false} type="monotone" connectNulls={true} dataKey="consumptionRate" name="km/L" stroke="#A855F7" fillOpacity={1} fill="url(#colorConsumption)" strokeWidth={4} dot={{ r: 3, fill: "#A855F7", strokeWidth: 0, opacity: 1 }} activeDot={{ r: 6, strokeWidth: 0, fill: "#A855F7" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* 2. Cost per Kilometer (Formerly #3) */}
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="card bg-carbon border border-industrial-border shadow-2xl">
        <div className="card-body">
          <h2 className="card-title text-text-secondary text-xs uppercase tracking-widest mb-4">2. Cost per Kilometer ({currency})</h2>
          <div className="h-64 overflow-visible">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={convertedRecords} margin={{ top: 20, right: 50, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCostKm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="id"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }}
                  dy={10}
                  tickFormatter={(id) => {
                    const record = convertedRecords.find(r => r.id === id);
                    return record ? record.xAxisLabel : '';
                  }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} dx={-10} />
                <Tooltip
                  content={<CustomTooltip prefix={symbol()} suffix={`${currency} / km`} />}
                  cursor={false}
                  wrapperStyle={{ zIndex: 1000 }}
                  allowEscapeViewBox={{ x: false, y: true }}
                />
                <Area isAnimationActive={false} type="monotone" connectNulls={true} dataKey="costPerKm" name={`${currency} / km`} stroke="#F97316" fillOpacity={1} fill="url(#colorCostKm)" strokeWidth={4} dot={{ r: 3, fill: "#F97316", strokeWidth: 0, opacity: 1 }} activeDot={{ r: 6, strokeWidth: 0, fill: "#F97316" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* 3. Gas Price Refueled (Formerly #2) */}
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="card bg-carbon border border-industrial-border shadow-2xl">
        <div className="card-body">
          <h2 className="card-title text-text-secondary text-xs uppercase tracking-widest mb-4">3. Gas Price Refueled / Time ({currency})</h2>
          <div className="h-64 overflow-visible">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={convertedRecords} margin={{ top: 20, right: 50, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="id"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }}
                  dy={10}
                  tickFormatter={(id) => {
                    const record = convertedRecords.find(r => r.id === id);
                    return record ? record.xAxisLabel : '';
                  }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} dx={-10} />
                <Tooltip
                  content={<CustomTooltip prefix={symbol()} suffix={currency} />}
                  cursor={false}
                  wrapperStyle={{ zIndex: 1000 }}
                  allowEscapeViewBox={{ x: false, y: true }}
                />
                <Area isAnimationActive={false} type="monotone" dataKey="convertedFuelCost" name={`Total Cost (${currency})`} stroke="#F97316" fillOpacity={1} fill="url(#colorCost)" strokeWidth={4} dot={{ r: 3, fill: "#F97316", strokeWidth: 0, opacity: 1 }} activeDot={{ r: 6, strokeWidth: 0, fill: "#F97316" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default DashboardCharts;
