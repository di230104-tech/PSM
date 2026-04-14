import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import { formatAssetStatus } from '../../../utils/formatters';

const SearchResultItem = ({ asset, searchQuery, onAddToFavorites }) => {
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_use':
      case 'checked_out':
        return 'bg-success/10 text-success border-success/20';
      case 'in_storage':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'in_repair':
        return 'bg-error/10 text-error border-error/20';
      case 'retired':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text?.split(regex);
    
    return parts?.map((part, index) => 
      regex?.test(part) ? (
        <mark key={index} className="bg-accent/20 text-accent font-medium">
          {part}
        </mark>
      ) : part
    );
  };

  const handleViewDetails = () => {
    if (asset.url) {
      navigate(asset.url);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'asset': return 'Package';
      case 'employee': return 'User';
      case 'department': return 'Building';
      case 'supplier': return 'Truck';
      default: return 'Search';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-subtle transition-shadow">
      <div className="flex items-start space-x-4">
        {/* Icon / Image */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            {asset.result_type === 'asset' && asset.image ? (
              <Image src={asset.image} alt={asset.image_alt} className="w-full h-full object-cover" />
            ) : (
              <Icon name={getIconForType(asset.result_type)} size={32} className="text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Information */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {highlightSearchTerm(asset.title, searchQuery)}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {highlightSearchTerm(asset.subtitle, searchQuery)}
              </p>
              
              {asset.result_type === 'asset' && (
                <div className="flex items-center space-x-4 mb-3">
                  {asset.status && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(asset.status)}`}>
                      {formatAssetStatus(asset.status)}
                    </span>
                  )}
                  {asset.location && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Icon name="MapPin" size={14} className="mr-1" />
                      {asset.location}
                    </div>
                  )}
                  {asset.category && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Icon name="Tag" size={14} className="mr-1" />
                      {asset.category}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2 ml-4">
              {asset.result_type === 'asset' && (
                <Button
                  variant="ghost"
                  size="icon"
                  iconName={asset.is_favorite ? "Heart" : "Heart"}
                  onClick={() => onAddToFavorites(asset.result_id)}
                  className={asset.is_favorite ? "text-error" : "text-muted-foreground hover:text-error"}
                />
              )}
              <Button
                variant="outline"
                size="sm"
                iconName="Eye"
                iconPosition="left"
                onClick={handleViewDetails}
              >
                View
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default SearchResultItem;