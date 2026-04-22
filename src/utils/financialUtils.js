/**
 * Financial Utility Functions for Asset Management
 */

/**
 * Calculates the total cost of all maintenance records.
 * 
 * @param {Array} maintenanceRecords - Array of maintenance objects with a 'cost' field
 * @returns {number} Sum of all maintenance costs
 */
export const calculateTotalMaintenanceCost = (maintenanceRecords) => {
  if (!Array.isArray(maintenanceRecords) || maintenanceRecords.length === 0) return 0;
  return maintenanceRecords.reduce((sum, record) => sum + (Number(record.cost) || 0), 0);
};

/**
 * Calculates Total Cost of Ownership (TCO).
 * 
 * @param {number} purchasePrice 
 * @param {number} totalMaintenanceCost 
 * @returns {number}
 */
export const calculateTCO = (purchasePrice, totalMaintenanceCost) => {
  return (Number(purchasePrice) || 0) + (Number(totalMaintenanceCost) || 0);
};

/**
 * Determines asset health based on maintenance cost vs purchase price.
 * 
 * @param {number} purchasePrice 
 * @param {number} totalMaintenanceCost 
 * @returns {Object} { status, color, icon }
 */
export const getAssetHealthStatus = (purchasePrice, totalMaintenanceCost) => {
  const price = Number(purchasePrice) || 0;
  const maintenance = Number(totalMaintenanceCost) || 0;

  // Handle edge case where purchase price is 0 to avoid division by zero or infinity
  if (price === 0) {
    if (maintenance > 0) return { status: 'Lemon / Critical', color: 'bg-error/10 text-error border-error/20', icon: 'AlertOctagon' };
    return { status: 'Healthy', color: 'bg-success/10 text-success border-success/20', icon: 'CheckCircle' };
  }

  const ratio = maintenance / price;

  if (ratio > 0.8) {
    return { status: 'Lemon / Critical', color: 'bg-error/10 text-error border-error/20', icon: 'AlertOctagon' };
  } else if (ratio > 0.5) {
    return { status: 'High Maintenance', color: 'bg-warning/10 text-warning border-warning/20', icon: 'AlertTriangle' };
  } else {
    return { status: 'Healthy', color: 'bg-success/10 text-success border-success/20', icon: 'CheckCircle' };
  }
};

/**
 * Calculates monthly run rate (average monthly cost).
 * 
 * @param {number} tco 
 * @param {string|Date} purchaseDate 
 * @returns {number} Monthly average cost
 */
export const calculateMonthlyRunRate = (tco, purchaseDate) => {
  if (!purchaseDate) return 0;
  
  const pDate = new Date(purchaseDate);
  const today = new Date();
  
  if (isNaN(pDate.getTime())) return 0;

  // Calculate difference in months
  let months = (today.getFullYear() - pDate.getFullYear()) * 12;
  months += today.getMonth() - pDate.getMonth();
  
  // Ensure at least 1 month to avoid division by zero
  const effectiveMonths = Math.max(1, months);
  
  return tco / effectiveMonths;
};
