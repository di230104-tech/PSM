import React, { useState, useMemo } from 'react';
import Button from '../../../components/ui/Button';

import AppIcon from '../../../components/AppIcon';
import { cn } from '../../../utils/cn';

const CheckoutPanel = ({ assets, filters, onAssetSelect, onBulkOperation }) => {
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Filter and sort assets
  const filteredAssets = useMemo(() => {
    let filtered = assets || [];

    // Apply category filter
    if (filters?.category) {
      filtered = filtered?.filter(asset =>
        asset?.category?.toLowerCase() === filters?.category?.toLowerCase()
      );
    }

    // Apply search filter (could be used for asset name search)
    if (filters?.employee) { // Reusing employee filter as general search
      filtered = filtered?.filter(asset =>
        asset?.product_name?.toLowerCase()?.includes(filters?.employee?.toLowerCase()) ||
        asset?.serialNumber?.toLowerCase()?.includes(filters?.employee?.toLowerCase()) ||
        asset?.location?.toLowerCase()?.includes(filters?.employee?.toLowerCase())
      );
    }

    // Sort assets
    filtered?.sort((a, b) => {
      let aValue = a?.[sortBy];
      let bValue = b?.[sortBy];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue?.localeCompare(bValue)
          : bValue?.localeCompare(aValue);
      }

      return 0;
    });

    return filtered;
  }, [assets, filters, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAsset = (assetId) => {
    setSelectedAssets(prev =>
      prev?.includes(assetId)
        ? prev?.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAssets?.length === filteredAssets?.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(filteredAssets?.map(asset => asset?.asset_tag));
    }
  };

  const handleBulkCheckout = () => {
    onBulkOperation?.('bulk-checkout', selectedAssets);
    setSelectedAssets([]);
  };

  const getConditionColor = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'excellent':
        return 'text-success bg-success/10 border-success/20';
      case 'good':
        return 'text-primary bg-primary/10 border-primary/20';
      case 'fair':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'poor':
        return 'text-error bg-error/10 border-error/20';
      default:
        return 'text-muted-foreground bg-muted/10 border-border';
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

  if (!filteredAssets?.length) {
    return (
      <div className="text-center py-12">
        <AppIcon name="Package" size={48} className="mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Assets In Storage</h3>
        <p className="text-muted-foreground mb-6">
          {assets?.length ? 'No assets match your current filters.' : 'All assets are currently checked out.'}
        </p>
        {assets?.length && (
          <Button variant="outline" onClick={() => onBulkOperation?.('clear-filters', [])}>
            Clear Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {filteredAssets?.length} asset{filteredAssets?.length !== 1 ? 's' : ''} in storage
          </span>
          
          {selectedAssets?.length > 0 && (
            <span className="text-sm font-medium text-primary">
              {selectedAssets?.length} selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Bulk Actions */}
          {selectedAssets?.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              iconName="UserPlus"
              iconPosition="left"
              onClick={handleBulkCheckout}
            >
              Assign Selected ({selectedAssets?.length})
            </Button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center border border-border rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded transition-colors",
                viewMode === 'grid' ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <AppIcon name="Grid3X3" size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded transition-colors",
                viewMode === 'list' ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <AppIcon name="List" size={16} />
            </button>
          </div>
        </div>
      </div>
      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssets?.map((asset) => (
            <div
              key={asset?.asset_tag}
              className={cn(
                "bg-card rounded-lg border border-border p-4 transition-all duration-200 hover:shadow-lg cursor-pointer",
                selectedAssets?.includes(asset?.asset_tag) && "ring-2 ring-primary/20 border-primary/30"
              )}
              onClick={() => onAssetSelect?.(asset)}
            >
              {/* Asset Image */}
              <div className="aspect-video bg-muted rounded-lg mb-3 overflow-hidden relative">
                {asset?.image ? (
                  <img
                    src={asset?.image}
                    alt={asset?.imageAlt || `${asset?.product_name} asset image`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <AppIcon name="Package" size={32} className="text-muted-foreground" />
                  </div>
                )}
                
                {/* Selection Checkbox */}
                <div className="absolute top-2 left-2">
                  <input
                    type="checkbox"
                    checked={selectedAssets?.includes(asset?.asset_tag)}
                    onChange={(e) => {
                      e?.stopPropagation();
                      handleSelectAsset(asset?.asset_tag);
                    }}
                    onClick={(e) => e?.stopPropagation()}
                    className="w-4 h-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                </div>

                {/* Condition Badge */}
                <div className="absolute top-2 right-2">
                  <span className={cn(
                    "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border",
                    getConditionColor(asset?.condition)
                  )}>
                    {asset?.condition}
                  </span>
                </div>
              </div>

              {/* Asset Info */}
              <div className="space-y-2">
                <div>
                  <h3 className="font-medium text-foreground line-clamp-1">{asset?.product_name}</h3>
                  <p className="text-sm text-muted-foreground">{asset?.category}</p>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AppIcon name="Hash" size={14} />
                  <span>{asset?.serialNumber}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AppIcon name="MapPin" size={14} />
                  <span>{asset?.location}</span>
                </div>
              </div>

              {/* Quick Action */}
              <div className="mt-4 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  iconName="UserPlus"
                  iconPosition="left"
                  onClick={(e) => {
                    e?.stopPropagation();
                    onAssetSelect?.(asset);
                  }}
                >
                  Assign Asset
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {/* Table Header */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-muted-foreground">
              <div className="col-span-1">
                <input
                  type="checkbox"
                  checked={selectedAssets?.length === filteredAssets?.length && filteredAssets?.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>
              <div className="col-span-4">
                <SortButton field="name">Asset</SortButton>
              </div>
              <div className="col-span-2">
                <SortButton field="category">Category</SortButton>
              </div>
              <div className="col-span-2">
                <SortButton field="location">Location</SortButton>
              </div>
              <div className="col-span-2">
                <SortButton field="condition">Condition</SortButton>
              </div>
              <div className="col-span-1">Action</div>
            </div>
          </div>

          {/* Assets List */}
          {filteredAssets?.map((asset) => (
            <div
              key={asset?.asset_tag}
              className={cn(
                "bg-card rounded-lg border border-border p-4 transition-all duration-200 hover:shadow-md",
                selectedAssets?.includes(asset?.asset_tag) && "ring-2 ring-primary/20 border-primary/30"
              )}
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Checkbox */}
                <div className="col-span-1">
                  <input
                    type="checkbox"
                    checked={selectedAssets?.includes(asset?.asset_tag)}
                    onChange={() => handleSelectAsset(asset?.asset_tag)}
                    className="w-4 h-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                </div>

                {/* Asset Info */}
                <div className="col-span-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      {asset?.image ? (
                        <img
                          src={asset?.image}
                          alt={asset?.imageAlt || `${asset?.product_name} asset image`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <AppIcon name="Package" size={20} className="text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{asset?.product_name}</h4>
                      <p className="text-sm text-muted-foreground">{asset?.serialNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div className="col-span-2">
                  <p className="text-sm text-foreground">{asset?.category}</p>
                </div>

                {/* Location */}
                <div className="col-span-2">
                  <div className="flex items-center gap-1">
                    <AppIcon name="MapPin" size={14} className="text-muted-foreground" />
                    <p className="text-sm text-foreground">{asset?.location}</p>
                  </div>
                </div>

                {/* Condition */}
                <div className="col-span-2">
                  <span className={cn(
                    "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border",
                    getConditionColor(asset?.condition)
                  )}>
                    {asset?.condition}
                  </span>
                </div>

                {/* Action */}
                <div className="col-span-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    iconName="UserPlus"
                    onClick={() => onAssetSelect?.(asset)}
                    title="Assign Asset"
                    className="text-primary hover:text-primary"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CheckoutPanel;