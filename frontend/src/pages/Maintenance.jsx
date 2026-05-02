import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { useVehicleStore } from '../store/useVehicleStore';
import { useFuelRecords } from '../hooks/useFuelRecords';
import Layout from '../components/Layout';
import MaintenanceCard from '../components/dashboard/MaintenanceCard';
import ServiceTimeline from '../components/dashboard/ServiceTimeline';
import MaintenanceForm from '../components/MaintenanceForm';
import PremiumGuard from '../components/PremiumGuard';
import { estimateCurrentMileage } from '../utils/maintenance';

function Maintenance() {
  const { user } = useAuthStore();
  const { cars, selectedCar, setSelectedCar } = useVehicleStore();
  const { records } = useFuelRecords(selectedCar?.id);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <motion.div 
          initial={{ y: -20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          className="mb-8"
        >
          <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase mb-2">
            Fleet <span className="text-emerald-500">Maintenance</span>
          </h1>
          <p className="text-text-secondary uppercase tracking-[0.2em] font-bold text-sm">
            Predictive Health & Service History
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar: Car Selection */}
          <div className="flex flex-col gap-6">
            <div className="card bg-carbon border border-industrial-border shadow-2xl">
              <div className="card-body">
                <h2 className="card-title text-emerald-500 text-xs uppercase font-black tracking-widest border-b border-industrial-border pb-2 mb-4">
                  Target Vehicle
                </h2>
                <div className="space-y-2">
                  {cars.map(c => (
                    <button
                      key={c.id}
                      className={`w-full text-left p-3 rounded-sm transition-all border ${
                        selectedCar?.id === c.id 
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-neon' 
                          : 'bg-asphalt border-industrial-border hover:border-emerald-500/30'
                      }`}
                      onClick={() => setSelectedCar(c)}
                    >
                      <div className="font-black italic uppercase text-sm">{c.name}</div>
                      <div className="text-[10px] opacity-60 uppercase font-bold">
                        {c.brand} {c.model} {c.licensePlate ? `// ${c.licensePlate}` : ''}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {selectedCar && (
              <PremiumGuard planRequired="PRO">
                <MaintenanceCard 
                  car={selectedCar} 
                  currentMileage={estimateCurrentMileage(records[records.length - 1])} 
                  onOpenService={() => setShowMaintenanceModal(true)}
                />
              </PremiumGuard>
            )}
          </div>

          {/* Main: Timeline */}
          <div className="lg:col-span-2">
            {!selectedCar ? (
              <div className="h-64 flex items-center justify-center bg-carbon border border-industrial-border border-dashed opacity-50 rounded-sm">
                <p className="font-black uppercase tracking-widest italic">Initialize vehicle selection to view telemetry</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <ServiceTimeline
                  records={records}
                  car={selectedCar}
                  onOpenMaintenance={() => setShowMaintenanceModal(true)}
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>

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

export default Maintenance;
