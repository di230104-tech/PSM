import React, { useState, useMemo } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import AppIcon from '../../../components/AppIcon';
import { cn } from '../../../utils/cn';

const AssetSelectionModal = ({ assets, onAssetSelect, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // Filter assets based on search and filters
  const filteredAssets = useMemo(() => {
    let filtered = assets || [];

    if (searchQuery) {
      filtered = filtered?.filter(asset =>
        asset?.product_name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
        asset?.serialNumber?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
        asset?.category?.toLowerCase()?.includes(searchQuery?.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered?.filter(asset => asset?.category === selectedCategory);
    }

    if (selectedLocation) {
      filtered = filtered?.filter(asset => (asset?.locations?.name || asset?.location) === selectedLocation);
    }

    return filtered;
  }, [assets, searchQuery, selectedCategory, selectedLocation]);

  // Get unique categories and locations
  const categories = [...new Set(assets?.map(asset => asset?.category).filter(Boolean))]?.sort();
  const locations = [...new Set(assets?.map(asset => asset?.locations?.name || asset?.location).filter(Boolean))]?.sort();

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Select Asset for Checkout</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Choose an asset from the in storage inventory
            </p>
          </div>
          <Button variant="ghost" size="sm" iconName="X" onClick={onClose} />
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e?.target?.value)}
                className="pr-10"
              />
              <AppIcon 
                name="Search" 
                size={16} 
                className="absolute right-3 top-3 text-muted-foreground" 
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e?.target?.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option key="all-categories" value="">All Categories</option>
              {categories?.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Location Filter */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e?.target?.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option key="all-locations" value="">All Locations</option>
              {locations?.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Assets Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredAssets?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssets?.map(asset => (
                <div
                  key={asset?.id}
                  className="bg-background rounded-lg border border-border p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/30"
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

                  {/* Asset Details */}
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-medium text-foreground line-clamp-1">{asset?.product_name}</h3>
                      <p className="text-sm text-muted-foreground">{asset?.category}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AppIcon name="Hash" size={14} />
                        <span>{asset?.serialNumber}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AppIcon name="MapPin" size={14} />
                        <span>{asset?.location}</span>
                      </div>
                    </div>

                    {/* Select Button */}
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        fullWidth
                        iconName="Check"
                        iconPosition="left"
                        onClick={(e) => {
                          e?.stopPropagation();
                          onAssetSelect?.(asset);
                        }}
                      >
                        Select Asset
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AppIcon name="Search" size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Assets Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory || selectedLocation 
                  ? 'Try adjusting your search criteria or filters.' :'No assets are currently in storage for checkout.'
                }
              </p>
              {(searchQuery || selectedCategory || selectedLocation) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('');
                    setSelectedLocation('');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {filteredAssets?.length} of {assets?.length} assets shown
          </p>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AssetSelectionModal;