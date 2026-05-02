import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { cyberToast } from '../components/CyberToast';

export function useCars(user) {
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  const fetchCars = useCallback(async () => {
    try {
      const res = await api.get('/cars');
      const carsArray = Array.isArray(res.data) ? res.data : [];
      setCars(carsArray);
      return carsArray;
    } catch (err) {
      console.error('Failed to fetch cars', err);
      return [];
    }
  }, []);

  const fetchMakes = useCallback(async () => {
    setLoadingMakes(true);
    try {
      const res = await api.get('/cars/makes');
      setMakes(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch makes', err);
    } finally {
      setLoadingMakes(false);
    }
  }, []);

  const fetchModels = useCallback(async (makeName) => {
    if (!makeName) return;
    setLoadingModels(true);
    try {
      const make = makes.find(m => m.name === makeName);
      if (make) {
        const res = await api.get(`/cars/models?make_id=${make.id}`);
        setModels(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch models', err);
    } finally {
      setLoadingModels(false);
    }
  }, [makes]);

  const addCar = useCallback(async (carData) => {
    try {
      const res = await api.post('/cars', carData);
      setCars(prev => [res.data, ...prev]);
      setSelectedCar(res.data);
      cyberToast.success('Vehicle Synced // Added to Fleet');
      return res.data;
    } catch (err) {
      cyberToast.error(err.response?.data?.message || 'Vehicle sync failed');
      throw err;
    }
  }, []);

  const updateCar = useCallback(async (carId, carData) => {
    try {
      const res = await api.put(`/cars/${carId}`, carData);
      setCars(prev => prev.map(c => c.id === carId ? res.data : c));
      cyberToast.success('Vehicle Updated // Config Saved');
      return res.data;
    } catch (err) {
      cyberToast.error(err.response?.data?.message || 'Failed to update car');
      throw err;
    }
  }, []);

  const deleteCar = useCallback(async (carId) => {
    try {
      await api.delete(`/cars/${carId}`);
      setCars(prev => prev.filter(c => c.id !== carId));
      cyberToast.warning('Vehicle Purged // Records Cleared');
    } catch (err) {
      cyberToast.error(err.response?.data?.message || 'Failed to delete car');
      throw err;
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchCars();
    }
  }, [user, fetchCars]);

  // Separate org cars from personal cars
  const safeCars = Array.isArray(cars) ? cars : [];
  const orgCars = safeCars.filter(c => !c.isPersonal);
  const personalCars = safeCars.filter(c => c.isPersonal);

  return {
    cars,
    orgCars,
    personalCars,
    setCars,
    selectedCar,
    setSelectedCar,
    makes,
    models,
    loadingMakes,
    loadingModels,
    fetchCars,
    fetchMakes,
    fetchModels,
    addCar,
    updateCar,
    deleteCar
  };
}
