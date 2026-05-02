import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

import { formatAssetStatus } from '../../../utils/formatters';

const FilterSidebar = ({ 
  isOpen, 
  onClose, 
  filters, 
  onFilterChange, 
  onClearFilters 
}) => {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    status: true,
    location: true,
    dateRange: false
  });

  const categoryOptions = [
    { value: 'laptop', label: 'Laptops' },
    { value: 'desktop', label: 'Desktops' },
    { value: 'monitor', label: 'Monitors' },
    { value: 'printer', label: 'Printers' },
    { value: 'phone', label: 'Phones' },
    { value: 'tablet', label: 'Tablets' }
  ];

  const statusOptions = [
    { value: 'In Use', label: formatAssetStatus('In Use') },
    { value: 'Available', label: formatAssetStatus('Available') },
    { value: 'In Repair', label: formatAssetStatus('In Repair') },
    { value: 'Broken', label: formatAssetStatus('Broken') },
    { value: 'Written-Off', label: formatAssetStatus('Written-Off') }
  ];

  const locationOptions = [
    { value: 'hq_floor_1', label: 'HQ - Floor 1' },
    { value: 'hq_floor_2', label: 'HQ - Floor 2' },
    { value: 'branch_tokyo', label: 'Tokyo Branch' },
    { value: 'branch_osaka', label: 'Osaka Branch' },
    { value: 'warehouse', label: 'Warehouse' }
  ];

  const dateRangeOptions = [
    { value: 'last_week', label: 'Last Week' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'last_quarter', label: 'Last Quarter' },
    { value: 'last_year', label: 'Last Year' }
  ];

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev?.[section]
    }));
  };

  const handleFilterChange = (filterType, value, checked) => {
    onFilterChange(filterType, value, checked);
  };

  const FilterSection = ({ title, isExpanded, onToggle, children }) => (
    <div className="border-b border-border pb-4 mb-4">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left"
      >
        <h3 className="font-medium text-foreground">{title}</h3>
        <Icon 
          name={isExpanded ? "ChevronUp" : "ChevronDown"} 
          size={16} 
          className="text-muted-foreground"
        />
      </button>
      {isExpanded && (
        <div className="mt-3 space-y-2">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-200 lg:hidden"
          onClick={onClose}
        />
      )}
      {/* Sidebar */}
      <div className={`
        fixed lg:sticky top-0 left-0 h-full lg:h-auto bg-card border-r border-border z-250 lg:z-auto
        w-80 lg:w-72 transition-transform duration-300 ease-in-out overflow-y-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">Filters</h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear All
              </Button>
              <Button
                variant="ghost"
                size="icon"
                iconName="X"
                onClick={onClose}
                className="lg:hidden"
              />
            </div>
          </div>

          {/* Category Filter */}
          <FilterSection
            title="Category"
            isExpanded={expandedSections?.category}
            onToggle={() => toggleSection('category')}
          >
            {categoryOptions?.map((option) => (
              <Checkbox
                key={option?.value}
                label={option?.label}
                checked={filters?.categories?.includes(option?.value) || false}
                onChange={(e) => handleFilterChange('categories', option?.value, e?.target?.checked)}
              />
            ))}
          </FilterSection>

          {/* Status Filter */}
          <FilterSection
            title="Status"
            isExpanded={expandedSections?.status}
            onToggle={() => toggleSection('status')}
          >
            {statusOptions?.map((option) => (
              <Checkbox
                key={option?.value}
                label={option?.label}
                checked={filters?.statuses?.includes(option?.value) || false}
                onChange={(e) => handleFilterChange('statuses', option?.value, e?.target?.checked)}
              />
            ))}
          </FilterSection>

          {/* Location Filter */}
          <FilterSection
            title="Location"
            isExpanded={expandedSections?.location}
            onToggle={() => toggleSection('location')}
          >
            {locationOptions?.map((option) => (
              <Checkbox
                key={option?.value}
                label={option?.label}
                checked={filters?.locations?.includes(option?.value) || false}
                onChange={(e) => handleFilterChange('locations', option?.value, e?.target?.checked)}
              />
            ))}
          </FilterSection>

          {/* Date Range Filter */}
          <FilterSection
            title="Date Added"
            isExpanded={expandedSections?.dateRange}
            onToggle={() => toggleSection('dateRange')}
          >
            <Select
              placeholder="Select date range"
              options={dateRangeOptions}
              value={filters?.dateRange || ''}
              onChange={(value) => handleFilterChange('dateRange', value)}
            />
          </FilterSection>

          {/* Active Filters Count */}
          {Object.values(filters)?.some(filter => 
            Array.isArray(filter) ? filter?.length > 0 : filter
          ) && (
            <div className="mt-6 p-3 bg-accent/10 rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon name="Filter" size={16} className="text-accent" />
                <span className="text-sm font-medium text-accent">
                  {Object.values(filters)?.reduce((count, filter) => 
                    count + (Array.isArray(filter) ? filter?.length : filter ? 1 : 0), 0
                  )} filters active
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FilterSidebar;