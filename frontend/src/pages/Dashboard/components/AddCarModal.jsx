import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CyberUploader from '../../../components/CyberUploader';
import { uploadCarPhoto } from '../../../utils/upload';

function AddCarModal({ onAddCar, makes, models, fetchModels, loadingMakes, loadingModels, userRole = 'individual' }) {
  const [newCarForm, setNewCarForm] = useState({ name: '', brand: '', model: '', licensePlate: '', tankSize: '', otherSpecs: '', photoUrl: '' });
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [useOwnCar, setUseOwnCar] = useState(userRole === 'user' || userRole === 'USER' || userRole === 'DRIVER');

  const handleImageUpload = async (file) => {
    // We pass a temporary ID for the photo upload or handle it after creation if needed
    // For now, we upload immediately and store the URL
    const url = await uploadCarPhoto('temp', file); // Adjust to get actual carId if possible or handle on backend
    setNewCarForm(prev => ({ ...prev, photoUrl: url }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const carData = { ...newCarForm };
    
    if (userRole === 'user' || userRole === 'USER' || userRole === 'DRIVER') {
      carData.isPersonal = true;
    } else if (userRole === 'admin' || userRole === 'ADMIN') {
      carData.isPersonal = useOwnCar;
    }
    
    onAddCar(carData);
  };

  const isOrgMember = ['admin', 'user', 'ADMIN', 'USER', 'DRIVER'].includes(userRole);

  return (
    <div className="fixed inset-0 bg-asphalt/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 font-['Rajdhani']">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="card bg-carbon shadow-2xl max-w-md w-full border border-industrial-border overflow-hidden"
      >
        <div className="h-1.5 bg-neon-violet shadow-neon" />
        <div className="card-body p-8">
          <h2 className="text-3xl font-black italic uppercase text-white mb-1 tracking-tighter">Initialize Vehicle</h2>
          <p className="text-text-secondary font-medium uppercase tracking-widest text-xs mb-6">System calibration required for first deployment</p>

          {(userRole === 'user' || userRole === 'USER' || userRole === 'DRIVER') && (
            <div className="bg-neon-violet/10 border border-neon-violet/20 rounded-sm p-3 mb-4 flex items-start gap-3">
              <span className="text-neon-violet text-xl">ℹ</span>
              <p className="text-[10px] font-bold text-neon-violet uppercase tracking-widest leading-relaxed">
                Personal Vehicle profile detected. Fleet assets are managed by regional command.
              </p>
            </div>
          )}

          {(userRole === 'admin' || userRole === 'ADMIN') && (
            <div className="bg-carbon border border-industrial-border rounded-sm p-4 mb-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-white">Individual Ownership</span>
                  <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-1">
                    {useOwnCar ? 'Marking as personal vehicle' : 'Adding to fleet inventory'}
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  className="toggle toggle-secondary border-industrial-border" 
                  checked={useOwnCar}
                  onChange={e => setUseOwnCar(e.target.checked)} 
                />
              </label>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex justify-center mb-2">
              <CyberUploader onUpload={handleImageUpload} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Vehicle Callsign (Name)</label>
              <input 
                required 
                placeholder="E.G. GHOST-01" 
                className="w-full bg-asphalt border border-industrial-border rounded-sm px-4 py-3 text-white placeholder:text-slate-700 focus:outline-none focus:border-neon-violet transition-all duration-300 uppercase font-bold italic"
                value={newCarForm.name} 
                onChange={e => setNewCarForm({ ...newCarForm, name: e.target.value })} 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">License Identifier</label>
                <input 
                  placeholder="E.G. SKY-LINE-34" 
                  className="w-full bg-asphalt border border-industrial-border rounded-sm px-4 py-3 text-white placeholder:text-slate-700 focus:outline-none focus:border-neon-violet transition-all duration-300 uppercase font-bold italic"
                  required={isOrgMember}
                  value={newCarForm.licensePlate} 
                  onChange={e => setNewCarForm({ ...newCarForm, licensePlate: e.target.value })} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Tank Capacity (L)</label>
                <input 
                  type="number"
                  placeholder="E.G. 50" 
                  className="w-full bg-asphalt border border-industrial-border rounded-sm px-4 py-3 text-white placeholder:text-slate-700 focus:outline-none focus:border-neon-violet transition-all duration-300 uppercase font-bold italic"
                  value={newCarForm.tankSize} 
                  onChange={e => setNewCarForm({ ...newCarForm, tankSize: parseFloat(e.target.value) || 0 })} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Manufacturer Data</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">Manual Entry</span>
                  <input type="checkbox" className="checkbox checkbox-xs border-industrial-border" checked={isManualEntry} onChange={e => setIsManualEntry(e.target.checked)} />
                </label>
              </div>

              {!isManualEntry ? (
                <div className="grid grid-cols-2 gap-3">
                  <select 
                    required 
                    className="bg-asphalt border border-industrial-border rounded-sm px-3 py-2.5 text-white focus:outline-none focus:border-neon-violet uppercase font-bold text-xs"
                    value={newCarForm.brand}
                    onChange={e => {
                      const val = e.target.value;
                      setNewCarForm({ ...newCarForm, brand: val, model: '' });
                      fetchModels(val);
                    }}
                  >
                    <option value="">Brand</option>
                    {makes.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                  </select>

                  <select 
                    required 
                    className="bg-asphalt border border-industrial-border rounded-sm px-3 py-2.5 text-white focus:outline-none focus:border-neon-violet uppercase font-bold text-xs"
                    disabled={!newCarForm.brand || loadingModels}
                    value={newCarForm.model}
                    onChange={e => setNewCarForm({ ...newCarForm, model: e.target.value })}
                  >
                    <option value="">{loadingModels ? 'SYNCING...' : 'Model'}</option>
                    {models.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <input required placeholder="BRAND" className="w-full bg-asphalt border border-industrial-border rounded-sm px-4 py-2.5 text-white placeholder:text-slate-700 focus:outline-none focus:border-neon-violet transition-all duration-300 uppercase font-bold text-xs" value={newCarForm.brand} onChange={e => setNewCarForm({ ...newCarForm, brand: e.target.value })} />
                  <input required placeholder="MODEL" className="w-full bg-asphalt border border-industrial-border rounded-sm px-4 py-2.5 text-white placeholder:text-slate-700 focus:outline-none focus:border-neon-violet transition-all duration-300 uppercase font-bold text-xs" value={newCarForm.model} onChange={e => setNewCarForm({ ...newCarForm, model: e.target.value })} />
                </div>
              )}
            </div>

            <button className="w-full bg-neon-violet hover:bg-white hover:text-asphalt text-white py-4 rounded-sm font-black text-xl uppercase tracking-tighter shadow-neon transition-all duration-300 mt-2">
              Sync Vehicle // START
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default AddCarModal;
