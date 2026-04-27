import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { useCars } from '../hooks/useCars';
import { useFuelRecords } from '../hooks/useFuelRecords';
import Layout from '../components/Layout';
import FuelEntryForm from './Dashboard/components/FuelEntryForm';
import DashboardCharts from './Dashboard/components/DashboardCharts';
import AddCarModal from './Dashboard/components/AddCarModal';
import DashboardStats from './Dashboard/components/DashboardStats';
import MaintenanceCard from '../components/dashboard/MaintenanceCard';
import { estimateCurrentMileage } from '../utils/maintenance';
import { useVehicleStore } from '../store/useVehicleStore';
import MaintenanceForm from '../components/MaintenanceForm';

function Dashboard() {
  const { user } = useAuthStore();
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const isOrgUser = useAuthStore((state) => state.isOrgUser);
  const canAccessMaintenance = useAuthStore((state) => state.canAccessMaintenance);

  const { 
    cars, 
    selectedCar, 
    setSelectedCar, 
    fetchCars,
    loading: loadingCars
  } = useVehicleStore();

  const { 
    makes, 
    models, 
    loadingMakes, 
    loadingModels, 
    fetchModels, 
    addCar 
  } = useCars(user);

  const { 
    records, 
    convertedRecords, 
    addRecord, 
    stats 
  } = useFuelRecords(selectedCar?.id);

  const [showAddCarModal, setShowAddCarModal] = useState(false);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  useEffect(() => {
    if (cars.length === 0 && user) {
      fetchCars().then(data => {
        if (data && data.length === 0) setShowAddCarModal(true);
      });
    } else if (cars.length > 0) {
      if (!selectedCar) setSelectedCar(cars[0]);
      setShowAddCarModal(false);
    }
  }, [cars.length, user, selectedCar, setSelectedCar, fetchCars]);

  const handleAddFuel = async (payload) => {
    if (!selectedCar) return;
    await addRecord(selectedCar.id, payload);
  };

  const handleAddOnboardingCar = async (carData) => {
    const newCar = await addCar(carData);
    if (newCar) {
      setShowAddCarModal(false);
      fetchCars(); // Refresh store
      setSelectedCar(newCar);
    }
  };

  // Check if user can add cars
  const canAddCar = isAdmin() || !isOrgUser(); // admin or individual, not regular org user
  const userRole = user?.role || 'individual';

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Controls */}
        <div className="flex flex-col gap-6">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-primary border-b border-base-300 pb-2">Select Car</h2>
              
              {/* Org cars group */}
              {cars.filter(c => !c.isPersonal).length > 0 && (
                <div className="mb-2">
                  <label className="text-xs font-bold uppercase opacity-40 mb-1 block">Organization Fleet</label>
                  {cars.filter(c => !c.isPersonal).map(c => (
                    <button
                      key={c.id}
                      className={`w-full text-left p-2 rounded-lg mb-1 transition-all text-sm ${
                        selectedCar?.id === c.id 
                          ? 'bg-primary/20 border border-primary/40' 
                          : 'bg-base-200 hover:bg-base-300'
                      }`}
                      onClick={() => setSelectedCar(c)}
                    >
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs opacity-60">{c.brand} {c.model} {c.licensePlate ? `• ${c.licensePlate}` : ''}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Personal cars group */}
              {cars.filter(c => c.isPersonal).length > 0 && (
                <div>
                  {cars.filter(c => !c.isPersonal).length > 0 && (
                    <label className="text-xs font-bold uppercase opacity-40 mb-1 block">Personal Cars</label>
                  )}
                  {cars.filter(c => c.isPersonal).map(c => (
                    <button
                      key={c.id}
                      className={`w-full text-left p-2 rounded-lg mb-1 transition-all text-sm ${
                        selectedCar?.id === c.id 
                          ? 'bg-primary/20 border border-primary/40' 
                          : 'bg-base-200 hover:bg-base-300'
                      }`}
                      onClick={() => setSelectedCar(c)}
                    >
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs opacity-60">{c.brand} {c.model} {c.licensePlate ? `• ${c.licensePlate}` : ''}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Fallback select for simple case */}
              {cars.length === 0 && (
                <div className="text-center opacity-50 py-2 text-sm">No cars available</div>
              )}
            </div>
          </motion.div>

          {selectedCar && (
            <div className="card bg-base-100 shadow-xl border border-primary/10">
              <div className="card-body items-center text-center">
                <h3 className="font-bold opacity-60 text-sm uppercase">Add Fuel Record</h3>
                <button 
                  onClick={() => setShowFuelModal(true)}
                  className="btn btn-circle btn-primary btn-lg mt-2 shadow-lg hover:scale-110 transition-transform"
                >
                  <span className="text-3xl">+</span>
                </button>
              </div>
            </div>
          )}

          {/* Dashboard Stats */}
          {selectedCar && stats && (
             <DashboardStats stats={stats} />
          )}

          {/* Maintenance Card (Gated) */}
          {selectedCar && canAccessMaintenance() && (
            <MaintenanceCard 
              car={selectedCar} 
              currentMileage={estimateCurrentMileage(records[records.length - 1])} 
              onOpenService={() => setShowMaintenanceModal(true)}
            />
          )}
        </div>

        {/* Graphs Area */}
        {!selectedCar ? (
          <div className="lg:col-span-2 flex h-[500px] items-center justify-center opacity-50 text-xl text-center">
            Please select or add a car to view tracking data.
          </div>
        ) : (
          <DashboardCharts 
            records={records} 
            convertedRecords={convertedRecords} 
          />
        )}
      </div>

      {showAddCarModal && (
        <AddCarModal 
          onAddCar={handleAddOnboardingCar}
          makes={makes}
          models={models}
          fetchModels={fetchModels}
          loadingMakes={loadingMakes}
          loadingModels={loadingModels}
          userRole={userRole}
        />
      )}

      {showFuelModal && selectedCar && (
        <FuelEntryForm 
          selectedCar={selectedCar} 
          onAddFuel={handleAddFuel} 
          stats={stats}
          onClose={() => setShowFuelModal(false)}
        />
      )}
      {showMaintenanceModal && selectedCar && (
        <MaintenanceForm 
          isOpen={showMaintenanceModal}
          onClose={() => setShowMaintenanceModal(false)}
          carId={selectedCar.id}
          currentOdometer={estimateCurrentMileage(records[records.length - 1])}
        />
      )}
    </Layout>
  );
}

export default Dashboard;
