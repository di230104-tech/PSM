import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import AppIcon from '../../../components/AppIcon';

const FilterToolbar = ({ filters, onFilterChange, onBulkOperation }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const departments = [
    { value: '', label: 'All Departments' },
    { value: 'engineering', label: 'Engineering' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'finance', label: 'Finance' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'operations', label: 'Operations' }
  ];

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'laptops', label: 'Laptops' },
    { value: 'monitors', label: 'Monitors' },
    { value: 'accessories', label: 'Accessories' },
    { value: 'network', label: 'Network Equipment' },
    { value: 'printers', label: 'Printers' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'due-soon', label: 'Due Soon' }
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    onFilterChange?.(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      employee: '',
      department: '',
      category: '',
      status: 'all',
      overdue: false
    };
    onFilterChange?.(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters)?.some(value => 
    value && value !== 'all' && value !== false
  );

  const handleBulkAction = (action) => {
    onBulkOperation?.(action, selectedItems);
    setSelectedItems([]);
    setShowBulkActions(false);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search and Filters */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Assignee Search */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search assignee..."
              value={filters?.employee || ''}
              onChange={(e) => handleFilterChange('employee', e?.target?.value)}
              className="pr-10"
            />
            <AppIcon 
              name="Search" 
              size={16} 
              className="absolute right-3 top-3 text-muted-foreground" 
            />
          </div>

          {/* Department Filter */}
          <Select
            value={filters?.department || ''}
            onChange={(value) => handleFilterChange('department', value)}
            options={departments}
            placeholder="Department"
          />

          {/* Category Filter */}
          <Select
            value={filters?.category || ''}
            onChange={(value) => handleFilterChange('category', value)}
            options={categories}
            placeholder="Category"
          />

          {/* Status Filter */}
          <Select
            value={filters?.status || 'all'}
            onChange={(value) => handleFilterChange('status', value)}
            options={statusOptions}
            placeholder="Status"
          />

          {/* Overdue Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="overdue-filter"
              checked={filters?.overdue || false}
              onChange={(e) => handleFilterChange('overdue', e?.target?.checked)}
              className="w-4 h-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            <label htmlFor="overdue-filter" className="text-sm font-medium text-foreground cursor-pointer">
              Overdue Only
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              iconName="X"
              iconPosition="left"
              onClick={handleClearFilters}
            >
              Clear
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            iconName="Download"
            iconPosition="left"
            onClick={() => handleBulkAction('export')}
          >
            Export
          </Button>

          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              iconName="MoreVertical"
              onClick={() => setShowBulkActions(!showBulkActions)}
            />
            
            {showBulkActions && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-popover rounded-lg border border-border shadow-lg z-50">
                <div className="py-2">
                  <button
                    onClick={() => handleBulkAction('send-reminders')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2"
                  >
                    <AppIcon name="Mail" size={16} />
                    Send Reminders
                  </button>
                  <button
                    onClick={() => handleBulkAction('mark-overdue')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2"
                  >
                    <AppIcon name="AlertTriangle" size={16} />
                    Mark Overdue
                  </button>
                  <button
                    onClick={() => handleBulkAction('extend-due-date')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2"
                  >
                    <AppIcon name="Calendar" size={16} />
                    Extend Due Date
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AppIcon name="Filter" size={16} />
            <span>Active filters:</span>
            <div className="flex items-center gap-2">
              {filters?.employee && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md">
                  Assignee: {filters?.employee}
                  <button onClick={() => handleFilterChange('employee', '')}>
                    <AppIcon name="X" size={12} />
                  </button>
                </span>
              )}
              {filters?.department && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md">
                  Dept: {departments?.find(d => d?.value === filters?.department)?.label}
                  <button onClick={() => handleFilterChange('department', '')}>
                    <AppIcon name="X" size={12} />
                  </button>
                </span>
              )}
              {filters?.category && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md">
                  Category: {categories?.find(c => c?.value === filters?.category)?.label}
                  <button onClick={() => handleFilterChange('category', '')}>
                    <AppIcon name="X" size={12} />
                  </button>
                </span>
              )}
              {filters?.status && filters?.status !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md">
                  Status: {statusOptions?.find(s => s?.value === filters?.status)?.label}
                  <button onClick={() => handleFilterChange('status', 'all')}>
                    <AppIcon name="X" size={12} />
                  </button>
                </span>
              )}
              {filters?.overdue && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-error/10 text-error rounded-md">
                  Overdue Only
                  <button onClick={() => handleFilterChange('overdue', false)}>
                    <AppIcon name="X" size={12} />
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterToolbar;