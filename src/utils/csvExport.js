const escapeCsvCell = (value) => {
  const stringValue = value === null || value === undefined ? '' : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
};

const formatAppliedFilters = (appliedFilters) => {
  if (Array.isArray(appliedFilters)) {
    return appliedFilters.length > 0 ? appliedFilters.join(', ') : 'None';
  }

  if (appliedFilters && typeof appliedFilters === 'object') {
    const entries = Object.entries(appliedFilters)
      .filter(([, value]) => value !== null && value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0));

    if (entries.length === 0) {
      return 'None';
    }

    return entries
      .map(([key, value]) => {
        const formattedValue = Array.isArray(value) ? value.join(', ') : String(value);
        return `${key}: ${formattedValue}`;
      })
      .join(' | ');
  }

  if (typeof appliedFilters === 'string' && appliedFilters.trim()) {
    return appliedFilters;
  }

  return 'None';
};

export const exportToProfessionalCSV = ({
  data,
  reportTitle,
  appliedFilters = 'None',
  fileNamePrefix,
  columns,
}) => {
  if (!data || data.length === 0) {
    return null;
  }

  const currentDate = new Date().toLocaleString();
  const totalRecords = data.length;
  const title = reportTitle || 'Report';
  const safeTitle = (fileNamePrefix || title).replace(/[^a-zA-Z0-9]/g, '_');
  const dateString = new Date().toISOString().split('T')[0];
  const resolvedColumns = columns || Object.keys(data[0]).map((key) => ({ key, label: key }));

  let csvString = '';
  csvString += `${escapeCsvCell('Report Title')},${escapeCsvCell(title)}\n`;
  csvString += `${escapeCsvCell('Export Date')},${escapeCsvCell(currentDate)}\n`;
  csvString += `${escapeCsvCell('Filters Applied')},${escapeCsvCell(formatAppliedFilters(appliedFilters))}\n`;
  csvString += `${escapeCsvCell('Total Count')},${escapeCsvCell(totalRecords)}\n`;
  csvString += '\n';

  csvString += resolvedColumns.map((column) => escapeCsvCell(column.label || column.key)).join(',') + '\n';

  data.forEach((row) => {
    const rowValues = resolvedColumns.map((column) => {
      const rawValue = typeof column.value === 'function'
        ? column.value(row)
        : row[column.key];
      return escapeCsvCell(rawValue);
    });

    csvString += rowValues.join(',') + '\n';
  });

  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${safeTitle}_${dateString}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
};
