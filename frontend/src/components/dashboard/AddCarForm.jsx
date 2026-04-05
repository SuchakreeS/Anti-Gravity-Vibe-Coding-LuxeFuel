import React, { useState } from 'react';

function AddCarForm({ onAddCar }) {
  const [carFormData, setCarFormData] = useState({ name: '', brand: '', model: '', otherSpecs: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddCar(carFormData);
    setCarFormData({ name: '', brand: '', model: '', otherSpecs: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input required placeholder="Name" className="input input-sm input-bordered" value={carFormData.name} onChange={e => setCarFormData({ ...carFormData, name: e.target.value })} />
      <input required placeholder="Brand" className="input input-sm input-bordered" value={carFormData.brand} onChange={e => setCarFormData({ ...carFormData, brand: e.target.value })} />
      <input required placeholder="Model" className="input input-sm input-bordered" value={carFormData.model} onChange={e => setCarFormData({ ...carFormData, model: e.target.value })} />
      <input placeholder="Other Specs" className="input input-sm input-bordered" value={carFormData.otherSpecs} onChange={e => setCarFormData({ ...carFormData, otherSpecs: e.target.value })} />
      <button className="btn btn-secondary btn-sm mt-2">Add Car</button>
    </form>
  );
}

export default AddCarForm;
