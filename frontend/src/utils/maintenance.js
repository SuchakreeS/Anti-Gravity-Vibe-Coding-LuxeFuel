/**
 * Maintenance Utilities for LuxeFuel
 */

/**
 * Category-specific maintenance intervals
 */
export const MAINTENANCE_CATEGORIES = {
  engineOil: { label: 'Engine Oil', intervalKm: 10000, intervalMonths: 6 },
  brakeFluid: { label: 'Brake System', intervalKm: 40000, intervalMonths: 24 },
  airFilter: { label: 'Air Filter', intervalKm: 20000, intervalMonths: 12 },
  battery: { label: 'Battery', intervalKm: 0, intervalMonths: 24 }, // Time-only
  tires: { label: 'Tires', intervalKm: 50000, intervalMonths: 36 },
};

/**
 * Calculates health based on Distance vs Time (Lower value wins).
 */
export const calculateHealth = (lastKm, lastDate, intKm, intMonths, currentKm) => {
  if (!lastDate) return 100;
  
  const kmsSince = Math.max(0, currentKm - lastKm);
  const daysSince = (new Date() - new Date(lastDate)) / (1000 * 60 * 60 * 24);
  const daysInterval = (intMonths || 0) * 30;

  const kmHealth = intKm ? Math.max(0, 100 - (kmsSince / intKm) * 100) : 100;
  const timeHealth = intMonths ? Math.max(0, 100 - (daysSince / daysInterval) * 100) : 100;

  return Math.round(Math.min(kmHealth, timeHealth));
};

/**
 * Legacy wrapper or simplified version
 */
export const calculateHealthScore = (currentMileage, lastServiceMileage, interval = 10000) => {
  return calculateHealth(lastServiceMileage, new Date(), interval, 0, currentMileage);
};

/**
 * Estimates "Current Mileage" if the last log is old.
 */
export const estimateCurrentMileage = (lastLog, averageDailyDistance = 50) => {
  if (!lastLog || !lastLog.date || !lastLog.odometer) return 0;
  
  const lastLogDate = new Date(lastLog.date);
  const now = new Date();
  
  const diffTime = Math.abs(now - lastLogDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return lastLog.odometer;
  return lastLog.odometer + (diffDays * averageDailyDistance);
};

/**
 * Gets the color for a health score.
 */
export const getHealthColor = (score) => {
  if (score >= 80) return '#10b981'; // Emerald-500
  if (score >= 30) return '#f59e0b'; // Amber-500
  return '#ef4444'; // Red-500
};
