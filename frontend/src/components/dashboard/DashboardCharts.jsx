import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

function DashboardCharts({ records }) {
  return (
    <>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">1. Consumption Rate / Time</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={records}>
                <defs>
                  <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dx={-10} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--b3))', borderColor: 'transparent', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Area type="linear" connectNulls={true} dataKey="consumptionRate" name="km/L" stroke="#22c55e" fillOpacity={1} fill="url(#colorConsumption)" strokeWidth={6} dot={{ r: 4, fill: "#22c55e", strokeWidth: 0 }} activeDot={{ r: 10, strokeWidth: 4, stroke: "hsl(var(--b1))" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">2. Gas Price Refueled / Time</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={records}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dx={-10} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--b3))', borderColor: 'transparent', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Area type="linear" dataKey="fuelCost" name="Total Cost (THB)" stroke="#22c55e" fillOpacity={1} fill="url(#colorCost)" strokeWidth={6} dot={{ r: 4, fill: "#22c55e", strokeWidth: 0 }} activeDot={{ r: 10, strokeWidth: 4, stroke: "hsl(var(--b1))" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">3. Current Gas Price (Per Litre)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={records}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dx={-10} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--b3))', borderColor: 'transparent', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Area type="linear" dataKey="pricePerLitre" name="THB / L" stroke="#22c55e" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={6} dot={{ r: 4, fill: "#22c55e", strokeWidth: 0 }} activeDot={{ r: 10, strokeWidth: 4, stroke: "hsl(var(--b1))" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default DashboardCharts;
