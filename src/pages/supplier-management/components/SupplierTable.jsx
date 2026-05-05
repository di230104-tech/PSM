import React, { useState, useMemo } from 'react';
import { Edit, Trash2, Phone, Mail, Globe, Star } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';

const SupplierTable = ({ suppliers, selectedSupplier, onSupplierSelect, onSupplierEdit, onSupplierDelete }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-success/10 text-success border-success/20',
      pending: 'bg-warning/10 text-warning border-warning/20',
      inactive: 'bg-muted text-muted-foreground border-muted'
    };
    return colors?.[status] || colors?.inactive;
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig?.key === key && sortConfig?.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedSuppliers = React.useMemo(() => {
    let sortableSuppliers = [...suppliers];
    if (sortConfig?.key) {
      sortableSuppliers?.sort((a, b) => {
        if (a?.[sortConfig?.key] < b?.[sortConfig?.key]) {
          return sortConfig?.direction === 'asc' ? -1 : 1;
        }
        if (a?.[sortConfig?.key] > b?.[sortConfig?.key]) {
          return sortConfig?.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableSuppliers;
  }, [suppliers, sortConfig]);

  const formatCurrency = (value) => {
    if (!value) return '$0';
    return value;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString)?.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderRating = (rating) => {
    const stars = Array?.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={cn(
          "w-3 h-3",
          index < Math?.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
        )}
      />
    ));
    return (
      <div className="flex items-center gap-1">
        {stars}
        <span className="text-xs text-muted-foreground ml-1">({rating})</span>
      </div>
    );
  };

  if (!suppliers || suppliers?.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Suppliers Found</h3>
          <p className="text-muted-foreground mb-4">
            No suppliers match your current filters. Try adjusting your search criteria.
          </p>
          <Button variant="outline" onClick={() => window?.location?.reload()}>
            Reset Filters
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('company_name')}
                  className="flex items-center gap-2 hover:text-gray-700 transition-colors"
                >
                  Company
                  {sortConfig?.key === 'company_name' && (
                    <span className="text-xs">
                      {sortConfig?.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Contact Person
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-2 hover:text-gray-700 transition-colors"
                >
                  Status
                  {sortConfig?.key === 'status' && (
                    <span className="text-xs">
                      {sortConfig?.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('rating')}
                  className="flex items-center gap-2 hover:text-gray-700 transition-colors"
                >
                  Rating
                  {sortConfig?.key === 'rating' && (
                    <span className="text-xs">
                      {sortConfig?.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('total_value')}
                  className="flex items-center gap-2 hover:text-gray-700 transition-colors"
                >
                  Total Value
                  {sortConfig?.key === 'total_value' && (
                    <span className="text-xs">
                      {sortConfig?.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              </th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {sortedSuppliers?.map((supplier) => (
              <tr
                key={supplier?.id}
                className={cn(
                  "hover:bg-gray-50/80 transition-colors cursor-pointer group",
                  selectedSupplier?.id === supplier?.id && "bg-blue-50/50"
                )}
                onClick={() => onSupplierSelect(supplier)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    {supplier?.image_url ? (
                      <img
                        src={supplier?.image_url}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover border border-gray-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                        <Globe className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        {supplier?.company_name}
                        {supplier?.preferred_vendor && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full" title="Preferred Vendor" />
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-bold text-gray-900">{supplier?.contact_person}</div>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 mt-0.5">
                      <Mail className="w-3 h-3" />
                      {supplier?.email}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={cn(
                      "inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border capitalize",
                      getStatusColor(supplier?.status)
                    )}
                  >
                    {supplier?.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {renderRating(supplier?.rating)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-bold text-gray-900">
                      {formatCurrency(supplier?.total_value)}
                    </div>
                    <div className="text-xs text-gray-400 font-medium">
                      {supplier?.total_orders} orders
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e?.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onSupplierEdit(supplier)}
                      className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onSupplierDelete(supplier?.id)}
                      className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplierTable;