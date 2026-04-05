import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CurrencyContext } from '../context/CurrencyContext';
import api from '../utils/api';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const { currency, setCurrency, convert, formatPrice, symbol, availableCurrencies, currencyNames } = useContext(CurrencyContext);
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [records, setRecords] = useState([]);
  const [fuelFormData, setFuelFormData] = useState({ fuelCost: '', pricePerLitre: '', odometer: '', isFullTank: true });

  const fetchCars = async () => {
    try {
      const res = await api.get('/cars');
      setCars(res.data);
      if (res.data.length > 0 && !selectedCar) {
        handleSelectCar(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) fetchCars();
  }, [user]);

  const handleSelectCar = async (carId) => {
    const car = cars.find(c => c.id === parseInt(carId));
    setSelectedCar(car);
    fetchRecords(carId);
  };

  const fetchRecords = async (carId) => {
    try {
      const res = await api.get(`/cars/${carId}/records`);
      const formatted = res.data.map(r => ({
        ...r,
        displayDate: format(new Date(r.date), 'MMM dd, yyyy HH:mm'),
      }));
      setRecords(formatted);
    } catch (err) {
      console.error(err);
    }
  };

  // Records with currency-converted values for charts
  const convertedRecords = useMemo(() => {
    return records.map(r => ({
      ...r,
      convertedFuelCost: convert(r.fuelCost),
      convertedPricePerLitre: convert(r.pricePerLitre),
    }));
  }, [records, convert]);

  const handleAddFuel = async (e) => {
    e.preventDefault();
    if (!selectedCar) return;
    try {
      // User enters values in the selected currency — convert back to THB for storage
      const rate = convert(1); // 1 THB → selected currency
      const toTHB = (val) => rate ? val / rate : val;

      const payload = {
        fuelCost: toTHB(parseFloat(fuelFormData.fuelCost)),
        pricePerLitre: toTHB(parseFloat(fuelFormData.pricePerLitre)),
        odometer: parseFloat(fuelFormData.odometer),
        isFullTank: fuelFormData.isFullTank
      };
      await api.post(`/cars/${selectedCar.id}/records`, payload);
      setFuelFormData({ fuelCost: '', pricePerLitre: '', odometer: '', isFullTank: true });
      Swal.fire('Success', 'Fuel record added!', 'success');
      fetchRecords(selectedCar.id);
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to add record', 'error');
    }
  };

  const getConsumptionComparison = () => {
    if (records.length < 1) return null;
    const latest = records[records.length - 1];

    // Calculate average from all full-tank records with valid consumption
    const fullTankRecords = records.filter(r => r.isFullTank && r.consumptionRate !== null);
    const avgConsumption = fullTankRecords.length > 0
      ? fullTankRecords.reduce((sum, r) => sum + r.consumptionRate, 0) / fullTankRecords.length
      : null;

    if (!latest.isFullTank || latest.consumptionRate === null) {
      return (
        <div className="flex flex-col gap-3 mt-4">
          <div className="stats shadow w-full bg-base-300 text-base-content">
            <div className="stat">
              <div className="stat-title opacity-80">Partially Filled</div>
              <div className="stat-value text-xl">Waiting for next Full Tank</div>
              <div className="stat-desc opacity-90">Distance added: +{latest.distanceTraveled} km</div>
            </div>
          </div>
          {avgConsumption !== null && (
            <div className="stats shadow w-full bg-base-100">
              <div className="stat">
                <div className="stat-title opacity-80">Avg. Consumption</div>
                <div className="stat-value text-lg">{avgConsumption.toFixed(2)} km/L</div>
                <div className="stat-desc opacity-70">From {fullTankRecords.length} full fill-ups</div>
              </div>
            </div>
          )}
        </div>
      );
    }

    const previousFullFills = records.filter(r => r.isFullTank && r.consumptionRate !== null && r.id !== latest.id);
    const previous = previousFullFills.length > 0 ? previousFullFills[previousFullFills.length - 1] : null;

    if (!previous) {
      return (
        <div className="flex flex-col gap-3 mt-4">
          <div className="stats shadow w-full bg-info text-info-content">
            <div className="stat">
              <div className="stat-title opacity-80 text-info-content">First Full Fill-up</div>
              <div className="stat-value text-info-content">{latest.consumptionRate.toFixed(2)} km/L</div>
              <div className="stat-desc opacity-90 text-info-content">Baseline established</div>
            </div>
          </div>
          <div className="stats shadow w-full bg-base-100">
            <div className="stat">
              <div className="stat-title opacity-80">Avg. Consumption</div>
              <div className="stat-value text-lg">{latest.consumptionRate.toFixed(2)} km/L</div>
              <div className="stat-desc opacity-70">From 1 full fill-up</div>
            </div>
          </div>
        </div>
      );
    }

    const diff = latest.consumptionRate - previous.consumptionRate;
    const isEfficiencyImproved = diff > 0;

    return (
      <div className="flex flex-col gap-3 mt-4">
        {/* Latest and Previous Stats Row */}
        <div className={`stats shadow w-full stats-vertical sm:stats-horizontal ${isEfficiencyImproved ? 'bg-success text-success-content' : 'bg-error text-error-content'}`}>
          <div className="stat">
            <div className="stat-title text-current opacity-80">Latest</div>
            <div className="stat-value">{latest.consumptionRate.toFixed(2)}</div>
            <div className="stat-desc text-current opacity-70 font-medium">km/L</div>
          </div>
          <div className="stat border-l border-current/10">
            <div className="stat-title text-current opacity-80">Previous</div>
            <div className="stat-value">{previous.consumptionRate.toFixed(2)}</div>
            <div className="stat-desc text-current opacity-70 font-medium">km/L</div>
          </div>
        </div>

        {/* Smaller Difference Card */}
        <div className={`stats shadow w-full ${isEfficiencyImproved ? 'bg-success text-success-content' : 'bg-error text-error-content'}`}>
          <div className="stat py-2 items-center text-center">
            <div className="stat-title text-current opacity-80 text-xs uppercase font-bold tracking-wider">Difference</div>
            <div className="stat-value text-2xl font-bold flex items-center justify-center gap-2">
              {isEfficiencyImproved ? '📉' : '📈'} {isEfficiencyImproved ? '+' : ''}{diff.toFixed(2)}
            </div>
            <div className="stat-desc text-current opacity-80 text-sm font-medium">
              {isEfficiencyImproved ? 'Lower' : 'Higher'} Consumption
            </div>
          </div>
        </div>
        {/* Average */}
        {avgConsumption !== null && (
          <div className="stats shadow w-full bg-base-100">
            <div className="stat">
              <div className="stat-title opacity-80">Avg. Consumption</div>
              <div className="stat-value text-lg">{avgConsumption.toFixed(2)} km/L</div>
              <div className="stat-desc opacity-70">From {fullTankRecords.length} full fill-ups</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-base-200 p-4 font-sans">
      <div className="navbar bg-base-100 shadow-xl rounded-box mb-6 px-6">
        <div className="flex-1">
          <a className="text-2xl font-bold text-primary tracking-wide">LuxeFuel</a>
        </div>
        <div className="flex-none gap-4 items-center">
          {/* Currency Selector */}
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-sm gap-2">
              <span className="text-lg">{symbol}</span>
              <span className="font-semibold">{currency}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </label>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box w-56 z-50">
              {availableCurrencies.map(code => (
                <li key={code}>
                  <button
                    className={`flex justify-between ${currency === code ? 'active' : ''}`}
                    onClick={() => setCurrency(code)}
                  >
                    <span className="font-medium">{code}</span>
                    <span className="opacity-60 text-sm">{currencyNames[code]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {/* User Menu */}
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-sm gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <span className="font-semibold">{user?.name}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </label>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box w-48 z-50">
              <li><Link to="/">📊 Dashboard</Link></li>
              <li><Link to="/mileage-log">📋 Mileage Log</Link></li>
              <li><Link to="/profile">👤 Profile</Link></li>
              <li><button onClick={logout}>🚪 Logout</button></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Controls */}
        <div className="flex flex-col gap-6">

          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-primary border-b border-base-300 pb-2">Select Car</h2>
              <select
                className="select select-bordered w-full"
                value={selectedCar?.id || ''}
                onChange={(e) => handleSelectCar(e.target.value)}
              >
                <option disabled value="">Select a car</option>
                {cars.map(c => <option key={c.id} value={c.id}>{c.name} ({c.brand})</option>)}
              </select>
            </div>
          </motion.div>

          {selectedCar && (
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="card bg-base-100 shadow-xl border border-primary/20">
              <div className="card-body">
                <h2 className="card-title text-accent border-b border-base-300 pb-2">Add Fuel Record</h2>
                <form onSubmit={handleAddFuel} className="flex flex-col gap-2">
                  <label className="text-sm opacity-70">Price of Gas ({currency})</label>
                  <input required type="number" step="0.01" className="input input-sm input-bordered" value={fuelFormData.fuelCost} onChange={e => setFuelFormData({ ...fuelFormData, fuelCost: e.target.value })} />

                  <label className="text-sm opacity-70 mt-2">Gas Price per Litre ({currency})</label>
                  <input required type="number" step="0.01" className="input input-sm input-bordered" value={fuelFormData.pricePerLitre} onChange={e => setFuelFormData({ ...fuelFormData, pricePerLitre: e.target.value })} />

                  <label className="text-sm opacity-70 mt-2">Current Mileage (km)</label>
                  <input required type="number" step="0.1" className="input input-sm input-bordered" value={fuelFormData.odometer} onChange={e => setFuelFormData({ ...fuelFormData, odometer: e.target.value })} />

                  <label className="label cursor-pointer mt-2 justify-start gap-4">
                    <span className="label-text opacity-80 font-medium">Full tank</span>
                    <input type="checkbox" className="toggle toggle-accent" checked={fuelFormData.isFullTank} onChange={e => setFuelFormData({ ...fuelFormData, isFullTank: e.target.checked })} />
                  </label>

                  <button className="btn btn-accent btn-sm mt-4">Refuel</button>
                </form>

                {getConsumptionComparison()}
              </div>
            </motion.div>
          )}
        </div>

        {/* Graphs Area */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {!selectedCar ? (
            <div className="flex h-full items-center justify-center opacity-50 text-xl text-center">
              Please select or add a car to view tracking data.
            </div>
          ) : (
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
                  <h2 className="card-title mb-4">2. Gas Price Refueled / Time ({currency})</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={convertedRecords}>
                        <defs>
                          <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dx={-10} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--b3))', borderColor: 'transparent', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} formatter={(value) => [`${symbol}${value.toFixed(2)}`, `Total Cost (${currency})`]} />
                        <Area type="linear" dataKey="convertedFuelCost" name={`Total Cost (${currency})`} stroke="#22c55e" fillOpacity={1} fill="url(#colorCost)" strokeWidth={6} dot={{ r: 4, fill: "#22c55e", strokeWidth: 0 }} activeDot={{ r: 10, strokeWidth: 4, stroke: "hsl(var(--b1))" }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title mb-4">3. Gas Price Per Litre ({currency})</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={convertedRecords}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dx={-10} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--b3))', borderColor: 'transparent', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} formatter={(value) => [`${symbol}${value.toFixed(2)}`, `${currency} / L`]} />
                        <Area type="linear" dataKey="convertedPricePerLitre" name={`${currency} / L`} stroke="#22c55e" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={6} dot={{ r: 4, fill: "#22c55e", strokeWidth: 0 }} activeDot={{ r: 10, strokeWidth: 4, stroke: "hsl(var(--b1))" }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>

            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
