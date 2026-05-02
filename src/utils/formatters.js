export const formatAssetStatus = (status) => {
  if (!status) return 'N/A';
  
  // Normalize for comparison
  const normalized = status.toLowerCase();
  
  switch (normalized) {
    case 'in_storage':
    case 'available':
      return 'Available';
    case 'checked_out':
    case 'in use':
      return 'In Use';
    case 'in_repair':
    case 'in repair':
      return 'In Repair';
    case 'retired':
      return 'Retired';
    case 'broken':
      return 'Broken';
    case 'written off':
    case 'written_off':
    case 'written-off':
      return 'Written-Off';
    case 'lost':
    case 'lost/stolen':
      return 'Lost/Stolen';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  }
};

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return 'RM 0.00';
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR'
  }).format(amount);
};
