import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import AppIcon from '../../../components/AppIcon';

const ActiveLoansPanel = ({ loans, filters, onCheckIn }) => {
  const [sortBy, setSortBy] = useState('checkoutDate');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filter and sort loans
  const filteredLoans = (loans || [])?.filter(loan => {
    if (filters?.employee && !(
      loan?.assignedTo?.name?.toLowerCase()?.includes(filters.employee.toLowerCase()) ||
      loan?.assignedTo?.email?.toLowerCase()?.includes(filters.employee.toLowerCase())
    )) {
      return false;
    }

    if (filters?.department && loan?.assignedTo?.department?.toLowerCase() !== filters.department.toLowerCase()) {
      return false;
    }

    if (filters?.category && loan?.assetCategory?.toLowerCase() !== filters.category.toLowerCase()) {
      return false;
    }

    if (filters?.status && filters?.status !== 'all' && loan?.status !== filters.status) {
      return false;
    }

    return true;
  })?.sort((a, b) => {
      let aValue = a?.[sortBy];
      let bValue = b?.[sortBy];

      if (sortBy === 'employee') {
        aValue = a?.assignedTo?.name;
        bValue = b?.assignedTo?.name;
      } else if (sortBy === 'assetName') {
        aValue = a?.assetName;
        bValue = b?.assetName;
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue?.localeCompare(bValue)
          : bValue?.localeCompare(aValue);
      }

      return 0;
    });

  const formatDate = (date) => {
    return new Date(date)?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };


  const SortButton = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-primary transition-colors"
    >
      {children}
      <AppIcon
        name={sortBy === field ? (sortOrder === 'asc' ? 'ChevronUp' : 'ChevronDown') : 'ChevronsUpDown'}
        size={14}
      />
    </button>
  );

  if (!filteredLoans?.length) {
    return (
      <div className="text-center py-12">
        <AppIcon name="Package" size={48} className="mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Active Assignments</h3>
        <p className="text-muted-foreground mb-6">
          {loans?.length ? 'No assignments match your current filters.' : 'All assets are currently in storage.'}
        </p>
        {loans?.length && (
          <Button variant="outline">
            Clear Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">


      {/* Table Header */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-muted-foreground">
          <div className="col-span-3">
            <SortButton field="assetName">Asset</SortButton>
          </div>
          <div className="col-span-3">
            <SortButton field="employee">Assigned To</SortButton>
          </div>
          <div className="col-span-2">
            <SortButton field="department">Department</SortButton>
          </div>
          <div className="col-span-2">
            <SortButton field="checkoutDate">Assigned On</SortButton>
          </div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Actions</div>
        </div>
      </div>

      {/* Loans List */}
      <div className="space-y-2">
        {filteredLoans?.map((loan) => {
          return (
            <div
              key={loan?.id}
              className="bg-card rounded-lg border border-border p-4 transition-all duration-200 hover:shadow-md"
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Asset Info */}
                <div className="col-span-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                      <AppIcon name="Package" size={20} className="text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{loan?.assetName}</h4>
                      <p className="text-sm text-muted-foreground">{loan?.assetId}</p>
                    </div>
                  </div>
                </div>

                {/* Assigned To Info */}
                <div className="col-span-3">
                  {loan?.assignedTo?.type === 'employee' ? (
                    <div>
                      <p className="font-medium text-foreground text-sm">{loan.assignedTo.name}</p>
                      <p className="text-xs text-muted-foreground">{loan.assignedTo.email}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">-</p>
                  )}
                </div>

                {/* Department Info */}
                <div className="col-span-2">
                  <p className="text-sm text-foreground">{loan?.assignedTo?.type === 'department' ? loan.assignedTo.name : loan?.assignedTo?.department || 'N/A'}</p>
                </div>

                {/* Checkout Date */}
                <div className="col-span-2">
                  <p className="text-sm text-foreground">{formatDate(loan?.checkoutDate)}</p>
                </div>

                {/* Status */}
                <div className="col-span-1">
                  <p className="text-sm capitalize">{loan?.status}</p>
                </div>

                {/* Actions */}
                <div className="col-span-1">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="ArrowLeftCircle"
                      onClick={() => onCheckIn?.(loan)}
                      title="Return Asset"
                      className="text-primary hover:text-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              {loan?.notes && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    <AppIcon name="MessageSquare" size={14} className="inline mr-1" />
                    {loan?.notes}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="text-center text-sm text-muted-foreground pt-4">
        Showing {filteredLoans?.length} of {loans?.length} active assignments
      </div>
    </div>
  );
};

export default ActiveLoansPanel;