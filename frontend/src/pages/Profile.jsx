import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CurrencyContext } from '../context/CurrencyContext';
import api from '../utils/api';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

function Profile() {
  const { user, logout } = useContext(AuthContext);
  const { currency, setCurrency, symbol, availableCurrencies, currencyNames } = useContext(CurrencyContext);

  const [profile, setProfile] = useState(null);
  const [cars, setCars] = useState([]);
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [editingCar, setEditingCar] = useState(null);
  const [carForm, setCarForm] = useState({ name: '', brand: '', model: '', otherSpecs: '' });
  const [addingCar, setAddingCar] = useState(false);
  const [newCarForm, setNewCarForm] = useState({ name: '', brand: '', model: '', otherSpecs: '' });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchCars();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/profile');
      setProfile(res.data);
      setProfileForm({ name: res.data.name, email: res.data.email });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCars = async () => {
    try {
      const res = await api.get('/cars');
      setCars(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/users/profile', profileForm);
      setProfile(res.data);
      // Update localStorage so navbar reflects change
      const stored = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem('user', JSON.stringify({ ...stored, name: res.data.name, email: res.data.email }));
      Swal.fire('Success', 'Profile updated!', 'success');
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to update profile', 'error');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return Swal.fire('Error', 'Passwords do not match', 'error');
    }
    try {
      await api.put('/users/profile', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      Swal.fire('Success', 'Password changed successfully!', 'success');
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to change password', 'error');
    }
  };

  const openEditCar = (car) => {
    setEditingCar(car);
    setCarForm({ name: car.name, brand: car.brand, model: car.model, otherSpecs: car.otherSpecs || '' });
  };

  const handleUpdateCar = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/cars/${editingCar.id}`, carForm);
      setCars(cars.map(c => c.id === editingCar.id ? res.data : c));
      setEditingCar(null);
      Swal.fire('Success', 'Car updated!', 'success');
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to update car', 'error');
    }
  };

  const handleDeleteCar = async (carId) => {
    const confirm = await Swal.fire({
      title: 'Delete Car?',
      text: 'This will permanently delete the car and ALL its fuel records!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      confirmButtonColor: '#ef4444'
    });
    if (confirm.isConfirmed) {
      try {
        await api.delete(`/cars/${carId}`);
        setCars(cars.filter(c => c.id !== carId));
        Swal.fire('Deleted!', 'Car and records removed.', 'success');
      } catch (err) {
        Swal.fire('Error', 'Failed to delete car', 'error');
      }
    }
  };

  const handleAddCar = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/cars', newCarForm);
      setCars([res.data, ...cars]);
      setNewCarForm({ name: '', brand: '', model: '', otherSpecs: '' });
      setAddingCar(false);
      Swal.fire('Success', 'Car added!', 'success');
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to add car', 'error');
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

      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        {/* Profile Info + Change Password side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl text-primary border-b border-base-300 pb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Profile Information
              </h2>
              <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4 mt-4">
                <div className="form-control">
                  <label className="label"><span className="label-text font-medium">Name</span></label>
                  <input required type="text" className="input input-bordered" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-medium">Email</span></label>
                  <input required type="email" className="input input-bordered" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} />
                </div>
                {profile && (
                  <div className="text-sm opacity-50 mt-1">
                    Member since {new Date(profile.createdAt).toLocaleDateString()}
                  </div>
                )}
                <button className="btn btn-primary btn-sm w-fit mt-2">Save Changes</button>
              </form>
            </div>
          </motion.div>

          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-xl text-secondary border-b border-base-300 pb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Change Password
              </h2>
              <form onSubmit={handleChangePassword} className="flex flex-col gap-4 mt-4">
                <div className="form-control">
                  <label className="label"><span className="label-text font-medium">Current Password</span></label>
                  <input required type="password" className="input input-bordered" value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-medium">New Password</span></label>
                  <input required type="password" minLength={6} className="input input-bordered" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-medium">Confirm New Password</span></label>
                  <input required type="password" minLength={6} className="input input-bordered" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
                </div>
                <button className="btn btn-secondary btn-sm w-fit mt-2">Update Password</button>
              </form>
            </div>
          </motion.div>
        </div>

        {/* My Cars */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center border-b border-base-300 pb-3">
              <h2 className="card-title text-xl text-accent">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                My Cars ({cars.length})
              </h2>
              <button className="btn btn-accent btn-sm gap-1" onClick={() => setAddingCar(!addingCar)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Car
              </button>
            </div>

            {/* Add Car Form */}
            {addingCar && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-4 p-4 bg-base-200 rounded-xl">
                <h3 className="font-bold mb-3 text-accent">New Car</h3>
                <form onSubmit={handleAddCar} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input required placeholder="Name (e.g. My Daily)" className="input input-sm input-bordered" value={newCarForm.name} onChange={e => setNewCarForm({ ...newCarForm, name: e.target.value })} />
                  <input required placeholder="Brand (e.g. Toyota)" className="input input-sm input-bordered" value={newCarForm.brand} onChange={e => setNewCarForm({ ...newCarForm, brand: e.target.value })} />
                  <input required placeholder="Model (e.g. Camry)" className="input input-sm input-bordered" value={newCarForm.model} onChange={e => setNewCarForm({ ...newCarForm, model: e.target.value })} />
                  <input placeholder="Other Specs (optional)" className="input input-sm input-bordered" value={newCarForm.otherSpecs} onChange={e => setNewCarForm({ ...newCarForm, otherSpecs: e.target.value })} />
                  <div className="md:col-span-2 flex gap-2">
                    <button type="submit" className="btn btn-accent btn-sm">Save</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAddingCar(false)}>Cancel</button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Car List */}
            <div className="flex flex-col gap-4 mt-4">
              {cars.length === 0 && (
                <div className="text-center opacity-50 py-8">
                  No cars yet. Add your first car above!
                </div>
              )}
              {cars.map(car => (
                <div key={car.id} className="p-4 bg-base-200 rounded-xl">
                  {editingCar?.id === car.id ? (
                    <form onSubmit={handleUpdateCar} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input required placeholder="Name" className="input input-sm input-bordered" value={carForm.name} onChange={e => setCarForm({ ...carForm, name: e.target.value })} />
                      <input required placeholder="Brand" className="input input-sm input-bordered" value={carForm.brand} onChange={e => setCarForm({ ...carForm, brand: e.target.value })} />
                      <input required placeholder="Model" className="input input-sm input-bordered" value={carForm.model} onChange={e => setCarForm({ ...carForm, model: e.target.value })} />
                      <input placeholder="Other Specs" className="input input-sm input-bordered" value={carForm.otherSpecs} onChange={e => setCarForm({ ...carForm, otherSpecs: e.target.value })} />
                      <div className="md:col-span-2 flex gap-2">
                        <button type="submit" className="btn btn-primary btn-sm">Save</button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingCar(null)}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-lg">{car.name}</div>
                        <div className="opacity-70">{car.brand} {car.model}</div>
                        {car.otherSpecs && <div className="text-sm opacity-50 mt-1">{car.otherSpecs}</div>}
                      </div>
                      <div className="flex gap-2">
                        <button className="btn btn-xs btn-outline btn-info" onClick={() => openEditCar(car)}>Edit</button>
                        <button className="btn btn-xs btn-outline btn-error" onClick={() => handleDeleteCar(car.id)}>Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Profile;
