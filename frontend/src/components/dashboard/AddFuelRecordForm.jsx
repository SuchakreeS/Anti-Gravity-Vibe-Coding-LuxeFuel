import React, { useState } from 'react';

function AddFuelRecordForm({ selectedCar, records, onAddFuel }) {
  const [fuelFormData, setFuelFormData] = useState({ fuelCost: '', pricePerLitre: '', odometer: '', isFullTank: true });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCar) return;
    onAddFuel({
      fuelCost: parseFloat(fuelFormData.fuelCost),
      pricePerLitre: parseFloat(fuelFormData.pricePerLitre),
      odometer: parseFloat(fuelFormData.odometer),
      isFullTank: fuelFormData.isFullTank
    });
    setFuelFormData({ fuelCost: '', pricePerLitre: '', odometer: '', isFullTank: true });
  };

  const getConsumptionComparison = () => {
    if (records.length < 1) return null;
    const latest = records[records.length - 1];

    if (!latest.isFullTank || latest.consumptionRate === null) {
      return (
        <div className="stats shadow mt-4 w-full bg-base-300 text-base-content">
          <div className="stat">
            <div className="stat-title opacity-80">Partially Filled</div>
            <div className="stat-value text-xl">Waiting for next Full Tank</div>
            <div className="stat-desc opacity-90">Distance added: +{latest.distanceTraveled} km</div>
          </div>
        </div>
      );
    }
    // Need to find the PREVIOUS full tank to compare against
    const previousFullFills = records.filter(r => r.isFullTank && r.consumptionRate !== null && r.id !== latest.id);
    const previous = previousFullFills.length > 0 ? previousFullFills[previousFullFills.length - 1] : null;

    if (!previous) {
      return (
        <div className="stats shadow mt-4 w-full bg-info text-info-content">
          <div className="stat">
            <div className="stat-title opacity-80 text-info-content">First Full Fill-up</div>
            <div className="stat-value text-info-content">{latest.consumptionRate.toFixed(2)} km/L</div>
            <div className="stat-desc opacity-90 text-info-content">Baseline established</div>
          </div>
        </div>
      );
    }

    const diff = latest.consumptionRate - previous.consumptionRate;
    const isHigher = diff > 0;

    return (
      <div className={`stats shadow mt-4 w-full ${isHigher ? 'bg-error text-error-content' : 'bg-success text-success-content'}`}>
        <div className="stat">
          <div className="stat-title text-current opacity-80">Consumption Comparison</div>
          <div className="stat-value">{latest.consumptionRate.toFixed(2)} km/L</div>
          <div className="stat-desc text-current opacity-90">
            {isHigher ? 'Higher' : 'Lower'} than last time ({Math.abs(diff).toFixed(2)} km/L)
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label className="text-sm opacity-70">Price of Gas (THB)</label>
        <input required type="number" step="0.01" className="input input-sm input-bordered" value={fuelFormData.fuelCost} onChange={e => setFuelFormData({ ...fuelFormData, fuelCost: e.target.value })} />

        <label className="text-sm opacity-70 mt-2">Gas Price per Litre (THB)</label>
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
    </>
  );
}

export default AddFuelRecordForm;
