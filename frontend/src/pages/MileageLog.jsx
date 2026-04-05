import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CurrencyContext } from '../context/CurrencyContext';
import api from '../utils/api';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

function MileageLog() {
  const { user, logout } = useContext(AuthContext);
  const { currency, setCurrency, convert, formatPrice, symbol, availableCurrencies, currencyNames } = useContext(CurrencyContext);
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [records, setRecords] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editFormData, setEditFormData] = useState({ fuelCost: '', pricePerLitre: '', odometer: '', isFullTank: true });

  useEffect(() => {
    if (user) fetchCars();
  }, [user]);

  const fetchCars = async () => {
    try {
      const res = await api.get('/cars');
      setCars(res.data);
      if (res.data.length > 0) {
        handleSelectCar(res.data[0].id, res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectCar = async (carId, carList) => {
    const list = carList || cars;
    const car = list.find(c => c.id === parseInt(carId));
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

  const openEditModal = (record) => {
    setEditingRecord(record);
    setEditFormData({
      fuelCost: convert(record.fuelCost)?.toFixed(2) || record.fuelCost,
      pricePerLitre: convert(record.pricePerLitre)?.toFixed(2) || record.pricePerLitre,
      odometer: record.odometer,
      isFullTank: record.isFullTank
    });
    document.getElementById('edit_modal').showModal();
  };

  const handleUpdateRecord = async (e) => {
    e.preventDefault();
    if (!editingRecord || !selectedCar) return;
    try {
      const rate = convert(1);
      const toTHB = (val) => rate ? val / rate : val;

      const payload = {
        fuelCost: toTHB(parseFloat(editFormData.fuelCost)),
        pricePerLitre: toTHB(parseFloat(editFormData.pricePerLitre)),
        odometer: parseFloat(editFormData.odometer),
        isFullTank: editFormData.isFullTank
      };
      await api.put(`/cars/${selectedCar.id}/records/${editingRecord.id}`, payload);
      document.getElementById('edit_modal').close();
      setEditingRecord(null);
      Swal.fire('Success', 'Record updated and history recalculated!', 'success');
      fetchRecords(selectedCar.id);
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Update failed', 'error');
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!selectedCar) return;
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: "This will delete the record and recalculate your history!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    });
    if (confirm.isConfirmed) {
      try {
        await api.delete(`/cars/${selectedCar.id}/records/${recordId}`);
        Swal.fire('Deleted!', 'Record removed successfully.', 'success');
        fetchRecords(selectedCar.id);
      } catch (err) {
        Swal.fire('Error', 'Deletion failed', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-base-200 p-4 font-sans">
      {/* Navbar */}
      <div className="navbar bg-base-100 shadow-xl rounded-box mb-6 px-6">
        <div className="flex-1">
          <Link to="/" className="text-2xl font-bold text-primary tracking-wide">LuxeFuel</Link>
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
                  <button className={`flex justify-between ${currency === code ? 'active' : ''}`} onClick={() => setCurrency(code)}>
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

      <div className="max-w-5xl mx-auto">
        {/* Car Selector */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body py-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <h2 className="font-bold text-lg whitespace-nowrap text-secondary">Select Car</h2>
              <select
                className="select select-bordered w-full sm:flex-1"
                value={selectedCar?.id || ''}
                onChange={(e) => handleSelectCar(e.target.value)}
              >
                <option disabled value="">Select a car</option>
                {cars.map(c => <option key={c.id} value={c.id}>{c.name} ({c.brand})</option>)}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Mileage Log */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl border-b border-base-300 pb-2">
              📋 Mileage Log {selectedCar && <span className="text-base opacity-50 font-normal">— {selectedCar.name}</span>}
            </h2>
            <div className="flex flex-col gap-4 mt-2">
              {!selectedCar ? (
                <div className="opacity-50 text-center py-8">Please select a car to view its mileage log.</div>
              ) : records.length === 0 ? (
                <div className="opacity-50 text-center py-8">No logs generated yet.</div>
              ) : (
                [...records].reverse().map(record => (
                  <div key={record.id} className="p-4 bg-base-200 rounded-xl relative group">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold opacity-80">{record.displayDate}</div>
                        <div className="text-xl font-bold mt-1 text-primary">{formatPrice(record.fuelCost)}</div>
                        <div className="opacity-70 mt-1 flex gap-2 items-center">
                          <span>💧 {record.litresRefueled.toFixed(2)} L</span>
                          <span>→</span>
                          <span>{formatPrice(record.pricePerLitre)} / L</span>
                        </div>
                        <div className="mt-2 text-secondary font-medium">
                          {record.isFullTank && record.consumptionRate !== null
                            ? `📈 ${record.consumptionRate.toFixed(2)} km/L`
                            : `〰️ Partially Filled`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{record.odometer} km</div>
                        {record.distanceTraveled > 0 && <div className="text-sm opacity-60">+{record.distanceTraveled} km</div>}

                        <div className="flex gap-2 justify-end mt-4">
                          <button onClick={() => openEditModal(record)} className="btn btn-xs btn-outline btn-info">Edit</button>
                          <button onClick={() => handleDeleteRecord(record.id)} className="btn btn-xs btn-outline btn-error">Delete</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Edit Modal */}
      <dialog id="edit_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-xl text-secondary">Edit Fuel Record</h3>
          {editingRecord && (
            <form onSubmit={handleUpdateRecord} className="flex flex-col gap-3 mt-4">
              <label className="text-sm opacity-70">Price of Gas ({currency})</label>
              <input required type="number" step="0.01" className="input input-sm input-bordered" value={editFormData.fuelCost} onChange={e => setEditFormData({ ...editFormData, fuelCost: e.target.value })} />

              <label className="text-sm opacity-70">Gas Price per Litre ({currency})</label>
              <input required type="number" step="0.01" className="input input-sm input-bordered" value={editFormData.pricePerLitre} onChange={e => setEditFormData({ ...editFormData, pricePerLitre: e.target.value })} />

              <label className="text-sm opacity-70">Odometer (km)</label>
              <input required type="number" step="0.1" className="input input-sm input-bordered" value={editFormData.odometer} onChange={e => setEditFormData({ ...editFormData, odometer: e.target.value })} />

              <label className="label cursor-pointer justify-start gap-4 mt-2">
                <span className="label-text opacity-80 font-medium">Full tank</span>
                <input type="checkbox" className="toggle toggle-accent" checked={editFormData.isFullTank} onChange={e => setEditFormData({ ...editFormData, isFullTank: e.target.checked })} />
              </label>

              <div className="modal-action mt-4">
                <button type="submit" className="btn btn-primary">Save Changes</button>
                <button type="button" onClick={() => document.getElementById('edit_modal').close()} className="btn">Cancel</button>
              </div>
            </form>
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}

export default MileageLog;
