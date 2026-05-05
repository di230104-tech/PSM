import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';
import { formatAssetStatus } from '../../../utils/formatters';


export function FilterToolbar({ 
  filters: propFilters, // Use propFilters to avoid state conflict
  onFilterChange, 
  onBulkAction, 
  selectedCount = 0, 
  totalCount = 0,
  onExport,
  departments = [], // New prop
  suppliers = [],    // New prop
  locations = []     // New prop
}) {
  // Use local state for internal management of filters if propFilters is not immediately available,
  // but prioritize propFilters for controlled component behavior.
  const [localFilters, setLocalFilters] = useState(propFilters || {
    searchQuery: '',
    category: '',
    status: [],
    department: '',
    supplier: '',
    location: '',
    dateRange: { start: '', end: '' }
  });

  // Keep local state in sync with propFilters
  React.useEffect(() => {
    if (propFilters) {
      setLocalFilters(propFilters);
    }
  }, [propFilters]);


  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'laptop', label: 'Laptops' },
    { value: 'desktop', label: 'Desktops' },
    { value: 'monitor', label: 'Monitors' },
    { value: 'printer', label: 'Printers' },
    { value: 'mobile', label: 'Mobile Devices' },
    { value: 'tablet', label: 'Tablets' },
    { value: 'server', label: 'Servers' },
    { value: 'network', label: 'Network Equipment' }
  ];

  const statusOptions = [
    { value: 'Available', label: formatAssetStatus('Available') },
    { value: 'In Use', label: formatAssetStatus('In Use') },
    { value: 'In Repair', label: formatAssetStatus('In Repair') },
    { value: 'Broken', label: formatAssetStatus('Broken') },
    { value: 'Written-Off', label: formatAssetStatus('Written-Off') },
    { value: 'Lost/Stolen', label: formatAssetStatus('Lost/Stolen') }
  ];

  const locationOptions = [
    { value: '', label: 'All Locations' },
    ...locations
  ];

  const bulkActionOptions = [
    { value: 'update_status', label: 'Update Status' },
    { value: 'transfer_location', label: 'Transfer Location' },
    { value: 'assign_user', label: 'Assign to User' },
    { value: 'generate_qr', label: 'Generate QR Codes' },
    { value: 'export_selected', label: 'Export Selected' }
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters); // Propagate change to parent
  };

  const handleDateRangeChange = (field, value) => {
    const newDateRange = { ...localFilters?.dateRange, [field]: value };
    const newFilters = { ...localFilters, dateRange: newDateRange };
    setLocalFilters(newFilters);
    onFilterChange(newFilters); // Propagate change to parent
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      searchQuery: '',
      category: '',
      status: [],
      department: '',
      supplier: '',
      location: '',
      dateRange: { start: '', end: '' }
    };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters); // Propagate change to parent
  };

  // Check if any filter is active for conditional rendering of "Clear Filters" button
  const hasActiveFilters = localFilters?.searchQuery || localFilters?.category || localFilters?.status?.length > 0 || 
                           localFilters?.department || localFilters?.supplier || localFilters?.location || 
                           localFilters?.dateRange?.start || localFilters?.dateRange?.end;

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      {/* Search Input */}
      <div className="relative mb-4">
        <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by Tag, Name, or Serial..."
          className="w-full pl-10 pr-4 py-2"
          value={localFilters?.searchQuery || ''}
          onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
        />
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Select
          label="Category"
          options={categoryOptions}
          value={localFilters?.category}
          onChange={(value) => handleFilterChange('category', value)}
          placeholder="Select category"
        />

        <Select
          label="Status"
          options={statusOptions}
          value={localFilters?.status}
          onChange={(value) => handleFilterChange('status', value)}
          multiple
          searchable
          placeholder="Select status"
        />

        {/* New Department Filter */}
        <Select
          label="Department"
          options={[{ value: '', label: 'All Departments' }, ...departments]}
          value={localFilters?.department}
          onChange={(value) => handleFilterChange('department', value)}
          placeholder="Select department"
        />

        {/* New Supplier Filter */}
        <Select
          label="Supplier"
          options={[{ value: '', label: 'All Suppliers' }, ...suppliers]}
          value={localFilters?.supplier}
          onChange={(value) => handleFilterChange('supplier', value)}
          placeholder="Select supplier"
        />

        <Select
          label="Location"
          options={locationOptions}
          value={localFilters?.location}
          onChange={(value) => handleFilterChange('location', value)}
          placeholder="Select location"
        />

        <div className="space-y-2 md:col-span-2 lg:col-span-1">
          <label className="text-sm font-medium text-foreground">Date Registered</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col flex-1 min-w-[140px]">
              <label htmlFor="start-date" className="text-[10px] font-bold text-gray-400 uppercase mb-1 px-1">Start Date</label>
              <Input
                id="start-date"
                type="date"
                className="w-full min-w-[140px]"
                value={localFilters?.dateRange?.start || ''}
                onChange={(e) => handleDateRangeChange('start', e?.target?.value)}
              />
            </div>
            <div className="flex flex-col flex-1 min-w-[140px]">
              <label htmlFor="end-date" className="text-[10px] font-bold text-gray-400 uppercase mb-1 px-1">End Date</label>
              <Input
                id="end-date"
                type="date"
                className="w-full min-w-[140px]"
                value={localFilters?.dateRange?.end || ''}
                onChange={(e) => handleDateRangeChange('end', e?.target?.value)}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-border">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            Showing {totalCount} assets
            {hasActiveFilters && (
              <span className="ml-2 text-accent">
                (filtered)
              </span>
            )}
          </div>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              iconName="X"
              onClick={clearAllFilters}
            >
              Clear Filters
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {selectedCount > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedCount} selected
              </span>
              
              <Select
                options={bulkActionOptions}
                value="" // This should be controlled by parent or have internal state if not directly used for filtering
                onChange={(value) => onBulkAction(value)}
                placeholder="Bulk Actions"
                className="w-40"
              />
            </>
          )}

          <Button
            variant="outline"
            iconName="Download"
            onClick={onExport}
          >
            Export CSV
          </Button>

          <Button
            variant="default"
            iconName="Plus"
            onClick={() => window.location.href = '/asset-registration'}
          >
            Add Asset
          </Button>
        </div>
      </div>
    </div>
  );
}

export default FilterToolbar;
