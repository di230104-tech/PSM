/**
 * Asset Lifecycle Utility Functions
 */

/**
 * Calculates the End of Life (EOL) date based on purchase date and lifespan.
 * 
 * @param {string|Date} purchaseDate - The date the asset was purchased (YYYY-MM-DD or Date object)
 * @param {number} lifespanMonths - The expected lifespan in months
 * @returns {Date|null} The calculated EOL date
 */
export const calculateEOLDate = (purchaseDate, lifespanMonths) => {
  if (!purchaseDate || lifespanMonths === undefined || lifespanMonths === null) return null;

  let date;
  if (typeof purchaseDate === 'string') {
    // To avoid timezone shifts where "2023-01-01" might become "2022-12-31" in some timezones,
    // we parse the YYYY-MM-DD parts and create a local date.
    const [year, month, day] = purchaseDate.split('-').map(Number);
    // month is 0-indexed in JS Date constructor
    date = new Date(year, month - 1, day);
  } else {
    date = new Date(purchaseDate);
  }

  if (isNaN(date.getTime())) return null;

  // Add the lifespan months
  date.setMonth(date.getMonth() + parseInt(lifespanMonths));
  
  return date;
};

/**
 * Determines the EOL status based on the EOL date compared to today.
 * 
 * @param {Date|string} eolDate - The calculated EOL date
 * @returns {Object} { status: string, color: string }
 */
export const getEOLStatus = (eolDate) => {
  if (!eolDate) return { status: 'Unknown', color: 'text-muted-foreground bg-muted' };

  const date = new Date(eolDate);
  if (isNaN(date.getTime())) return { status: 'Unknown', color: 'text-muted-foreground bg-muted' };

  const today = new Date();
  // Set today to midnight for comparison
  today.setHours(0, 0, 0, 0);
  
  const comparisonDate = new Date(date);
  comparisonDate.setHours(0, 0, 0, 0);

  // Calculate difference in days
  const diffTime = comparisonDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'Expired', color: 'text-error bg-error/10 border-error/20' };
  } else if (diffDays <= 90) {
    return { status: 'Expiring Soon', color: 'text-warning bg-warning/10 border-warning/20' };
  } else {
    return { status: 'Active', color: 'text-success bg-success/10 border-success/20' };
  }
};
