import { useState, useCallback, useEffect, useMemo } from 'react';
import api from '../utils/api';
import { format } from 'date-fns';
import { useCurrencyStore } from '../store/useCurrencyStore';

import { useCyberToast } from '../components/CyberToast';

export function useFuelRecords(selectedCarId) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const { convert, currency } = useCurrencyStore();
  const cyberToast = useCyberToast();

  const fetchRecords = useCallback(async (carId) => {
    if (!carId) return;
    setLoading(true);
    try {
      const res = await api.get(`/cars/${carId}/records`);
      const rawData = Array.isArray(res.data) ? res.data : [];
      const formatted = rawData.map(r => ({
        ...r,
        displayDate: format(new Date(r.date), "dd MMM ''yy"),
        displayTime: format(new Date(r.date), 'HH:mm'),
        xAxisLabel: format(new Date(r.date), 'MMM dd'),
      }));
      setRecords(formatted);
    } catch (err) {
      console.error('Failed to fetch records', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addRecord = useCallback(async (carId, payload) => {
    try {
      await api.post(`/cars/${carId}/records`, payload);
      cyberToast.success('Fuel Logged // Data Synchronized');
      fetchRecords(carId);
    } catch (err) {
      cyberToast.error(err.response?.data?.message || 'Logging failed');
      throw err;
    }
  }, [fetchRecords, cyberToast]);

  const updateRecord = useCallback(async (carId, recordId, payload) => {
    try {
      await api.put(`/cars/${carId}/records/${recordId}`, payload);
      cyberToast.success('Record Updated // Calibration Complete');
      fetchRecords(carId);
    } catch (err) {
      cyberToast.error(err.response?.data?.message || 'Update failed');
      throw err;
    }
  }, [fetchRecords, cyberToast]);

  const deleteRecord = useCallback(async (carId, recordId) => {
    try {
      await api.delete(`/cars/${carId}/records/${recordId}`);
      cyberToast.warning('Record Purged // Memory Cleared');
      fetchRecords(carId);
    } catch (err) {
      cyberToast.error('Declassification failed');
      throw err;
    }
  }, [fetchRecords, cyberToast]);

  useEffect(() => {
    if (selectedCarId) {
      fetchRecords(selectedCarId);
    } else {
      setRecords([]);
    }
  }, [selectedCarId, fetchRecords]);

  const convertedRecords = useMemo(() => {
    return records.map(r => ({
      ...r,
      convertedFuelCost: convert(r.fuelCost),
      convertedPricePerLitre: convert(r.pricePerLitre),
      costPerKm: (r.distanceTraveled > 0) ? (convert(r.fuelCost) / r.distanceTraveled) : null,
    }));
  }, [records, convert, currency]);

  const stats = useMemo(() => {
    if (records.length === 0) return null;
    
    const latest = records[records.length - 1];
    const fullTankRecords = records.filter(r => r.isFullTank && r.consumptionRate !== null);
    const avgConsumption = fullTankRecords.length > 0
      ? fullTankRecords.reduce((sum, r) => sum + r.consumptionRate, 0) / fullTankRecords.length
      : null;

    let comparison = null;
    if (latest.isFullTank && latest.consumptionRate !== null) {
      const previousFullFills = records.filter(r => r.isFullTank && r.consumptionRate !== null && r.id !== latest.id);
      const previous = previousFullFills.length > 0 ? previousFullFills[previousFullFills.length - 1] : null;
      
      if (previous) {
        comparison = {
          latest: latest.consumptionRate,
          previous: previous.consumptionRate,
          diff: latest.consumptionRate - previous.consumptionRate,
          isEfficiencyImproved: (latest.consumptionRate - previous.consumptionRate) > 0
        };
      }
    }

    const totalSpentTHB = records.reduce((sum, r) => sum + (r.fuelCost || 0), 0);
    const totalLiters = records.reduce((sum, r) => sum + (r.litresRefueled || 0), 0);
    const totalDistance = records.reduce((sum, r) => sum + (r.distanceTraveled || 0), 0);
    
    const totalSpent = convert(totalSpentTHB);
    const avgCostPerKm = totalDistance > 0 ? totalSpent / totalDistance : null;

    return {
      latest,
      avgConsumption,
      fullTankCount: fullTankRecords.length,
      comparison,
      totalSpent,
      totalLiters,
      totalDistance,
      avgCostPerKm,
      currency
    };
  }, [records, convert, currency]);

  return {
    records,
    convertedRecords,
    loading,
    fetchRecords,
    addRecord,
    updateRecord,
    deleteRecord,
    stats
  };
}
