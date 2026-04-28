import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MAINTENANCE_CATEGORIES } from '../utils/maintenance';
import { useVehicleStore } from '../store/useVehicleStore';
import { useFuelRecords } from '../hooks/useFuelRecords';
import { useCurrencyStore } from '../store/useCurrencyStore';

const MaintenanceForm = ({ isOpen, onClose, carId, currentOdometer }) => {
  const { currency, symbol, convert } = useCurrencyStore();
  const [selectedCategory, setSelectedCategory] = useState('engineOil');
  const [formData, setFormData] = useState({
    odometer: currentOdometer || '',
    serviceDate: new Date().toISOString().split('T')[0],
    cost: '',
  });

  const { updateCarMaintenance, updateOdometer } = useVehicleStore();
  const { addRecord } = useFuelRecords(carId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const rate = convert(1);
    const toTHB = (val) => rate ? val / rate : val;

    const servicePayload = {
      odometer: parseFloat(formData.odometer),
      serviceDate: formData.serviceDate,
      cost: toTHB(parseFloat(formData.cost)),
    };

    // 1. Update maintenance object in store/backend
    await updateCarMaintenance(carId, selectedCategory, servicePayload);

    // 2. Automatically append cost to transaction history (FuelRecord)
    // We use isFullTank: false so it doesn't mess up consumption rate
    await addRecord(carId, {
      fuelCost: servicePayload.cost,
      pricePerLitre: servicePayload.cost, // arbitrary, but cost / price = 1 litre (or we can use 0)
      odometer: servicePayload.odometer,
      isFullTank: false,
      date: servicePayload.serviceDate
    });

    // 3. Update vehicle currentOdometer if needed
    if (servicePayload.odometer > currentOdometer) {
      await updateOdometer(carId, servicePayload.odometer);
    }

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
          />

          {/* Slide-over */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-950 border-l border-slate-800 z-[101] shadow-2xl overflow-y-auto"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-white text-2xl font-black italic tracking-tight uppercase">
                    Log Service
                  </h2>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                    Maintenance Entry
                  </p>
                </div>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Category Selector */}
                <div>
                  <label className="text-slate-500 text-[10px] uppercase font-black tracking-tighter mb-3 block">
                    Select Category
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(MAINTENANCE_CATEGORIES).map(([key, cat]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedCategory(key)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedCategory === key
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                            : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        <p className="text-xs font-bold uppercase">{cat.label}</p>
                        <p className="text-[10px] opacity-60 mt-0.5">
                          {cat.intervalKm > 0 ? `${cat.intervalKm.toLocaleString()}km / ` : ''}{cat.intervalMonths}mo
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Fields */}
                <div className="space-y-6">
                  <div className="group">
                    <label className="text-slate-500 text-[10px] uppercase font-black tracking-tighter mb-2 block group-focus-within:text-emerald-500 transition-colors">
                      Service Odometer (km)
                    </label>
                    <input
                      required
                      type="number"
                      value={formData.odometer}
                      onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-4 text-white font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      placeholder="e.g. 45000"
                    />
                  </div>

                  <div className="group">
                    <label className="text-slate-500 text-[10px] uppercase font-black tracking-tighter mb-2 block group-focus-within:text-emerald-500 transition-colors">
                      Service Date
                    </label>
                    <input
                      required
                      type="date"
                      value={formData.serviceDate}
                      onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-4 text-white focus:outline-none focus:border-emerald-500 transition-all [color-scheme:dark]"
                    />
                  </div>

                  <div className="group">
                    <label className="text-slate-500 text-[10px] uppercase font-black tracking-tighter mb-2 block group-focus-within:text-emerald-500 transition-colors">
                      Total Cost ({currency})
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold">{symbol()}</span>
                      <input
                        required
                        type="number"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-4 pl-10 text-white font-mono focus:outline-none focus:border-emerald-500 transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-lg uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-[0.98]"
                  >
                    Submit Service Record
                  </button>
                  <p className="text-[10px] text-slate-600 text-center mt-4 uppercase font-bold tracking-widest">
                    Secure Luxury Infrastructure • Luxe Fuel v2.0
                  </p>
                </div>
              </form>
            </div>
            
            {/* Industrial Accent */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0 opacity-30" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MaintenanceForm;
