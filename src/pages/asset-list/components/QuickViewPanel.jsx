import React from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const QuickViewPanel = ({ asset, isOpen, onClose, onEdit, onPrintQR }) => {
  if (!isOpen || !asset) return null;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'checked_out':
        return 'bg-success/10 text-success border-success/20';
      case 'in_storage':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'in_repair':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'broken':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'retired':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'checked_out':
        return 'Checked Out';
      case 'in_storage':
        return 'In Storage';
      case 'in_repair':
        return 'In Repair';
      case 'broken':
        return 'Broken';
      case 'retired':
        return 'Retired';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    })?.format(amount);
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-300"
        onClick={onClose}
      />
      {/* Slide-over Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border z-400 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Asset Details</h2>
            <p className="text-sm text-muted-foreground">Quick view</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            iconName="X"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Asset Image */}
          {asset?.image && (
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <Image
                src={asset?.image}
                alt={asset?.imageAlt}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{asset?.product_name}</h3>
                <p className="text-sm text-muted-foreground">{asset?.model}</p>
                <p className="font-mono text-sm text-primary font-medium mt-1">
                  {asset?.assetId}
                </p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(asset?.status)}`}>
                {getStatusLabel(asset?.status)}
              </span>
            </div>

            {/* Key Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Category</span>
                <p className="font-medium text-foreground capitalize">
                  {asset?.category?.replace('_', ' ')}
                </p>
              </div>
              
              <div>
                <span className="text-muted-foreground">Serial Number</span>
                <p className="font-medium text-foreground font-mono">
                  {asset?.serialNumber}
                </p>
              </div>
              
              <div>
                <span className="text-muted-foreground">Location</span>
                <p className="font-medium text-foreground">
                  {asset?.location}
                </p>
              </div>
              
              <div>
                <span className="text-muted-foreground">Purchase Date</span>
                <p className="font-medium text-foreground">
                  {formatDate(asset?.purchaseDate)}
                </p>
              </div>
              
              <div>
                <span className="text-muted-foreground">Purchase Cost</span>
                <p className="font-medium text-foreground">
                  {formatCurrency(asset?.purchaseCost)}
                </p>
              </div>
              
              <div>
                <span className="text-muted-foreground">Warranty</span>
                <p className="font-medium text-foreground">
                  {formatDate(asset?.warrantyExpiry)}
                </p>
              </div>
            </div>
          </div>

          {/* Current Assignment */}
          {asset?.assignedTo && (
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-2 flex items-center">
                <Icon name="User" size={16} className="mr-2" />
                Current Assignment
              </h4>
              <div className="space-y-1 text-sm">
                <p className="font-medium text-foreground">{asset?.assignedTo?.full_name}</p>
                <p className="text-muted-foreground">{asset?.assignedTo?.department}</p>
                <p className="text-muted-foreground">{asset?.assignedTo?.email}</p>
                <p className="text-xs text-muted-foreground">
                  Assigned: {formatDate(asset?.assignedTo?.assignedDate)}
                </p>
              </div>
            </div>
          )}

          {/* Specifications */}
          {asset?.specifications && (
            <div>
              <h4 className="font-medium text-foreground mb-3 flex items-center">
                <Icon name="Settings" size={16} className="mr-2" />
                Specifications
              </h4>
              <div className="space-y-2 text-sm">
                {Object.entries(asset?.specifications)?.map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground capitalize">
                      {key?.replace(/([A-Z])/g, ' $1')?.trim()}:
                    </span>
                    <span className="font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {asset?.recentActivity && asset?.recentActivity?.length > 0 && (
            <div>
              <h4 className="font-medium text-foreground mb-3 flex items-center">
                <Icon name="Clock" size={16} className="mr-2" />
                Recent Activity
              </h4>
              <div className="space-y-3">
                {asset?.recentActivity?.slice(0, 3)?.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{activity?.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(activity?.date)} by {activity?.user}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border p-6">
          <div className="flex space-x-3">
            <Button
              variant="outline"
              iconName="Edit"
              onClick={() => onEdit(asset)}
              className="flex-1"
            >
              Edit Asset
            </Button>
            <Button
              variant="outline"
              iconName="QrCode"
              onClick={() => onPrintQR(asset)}
              className="flex-1"
            >
              Print QR
            </Button>
          </div>
          <Button
            variant="default"
            iconName="ExternalLink"
            onClick={() => window.location.href = `/asset-details/${asset?.asset_tag}`}
            className="w-full mt-3"
          >
            View Full Details
          </Button>
        </div>
      </div>
    </>
  );
};

export default QuickViewPanel;