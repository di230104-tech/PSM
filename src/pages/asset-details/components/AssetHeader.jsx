import React from 'react';

import Button from '../../../components/ui/Button';
import AppImage from '../../../components/AppImage'; // Assuming you have an AppImage component
import { formatAssetStatus } from '../../../utils/formatters';

const AssetHeader = ({ asset, onEdit, onPrintQR, onCheckOut }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'in use':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'available':
        return 'bg-success/10 text-success border-success/20';
      case 'in repair':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'broken':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'written-off':
      case 'written off':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-accent/10 text-accent border-accent/20';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        
        {/* Asset Image */}
        <div className="w-full lg:w-1/4 xl:w-1/5">
          <AppImage 
            src={asset?.image_url} 
            alt={asset?.product_name}
            className="rounded-lg object-cover w-full h-48 lg:h-full"
          />
        </div>

        {/* Asset Info */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <h1 className="text-2xl font-semibold text-foreground">
              {asset?.product_name}
            </h1>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(asset?.status)}`}>
              {formatAssetStatus(asset?.status)}
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Asset Tag:</span>
              <span className="ml-2 font-medium text-foreground">{asset?.asset_tag}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Category:</span>
              <span className="ml-2 font-medium text-foreground">{asset?.category}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Location:</span>
              <span className="ml-2 font-medium text-foreground">{asset?.location_name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Serial Number:</span>
              <span className="ml-2 font-medium text-foreground">{asset?.serial_number}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Model:</span>
              <span className="ml-2 font-medium text-foreground">{asset?.model || 'N/A'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Assigned To:</span>
              <span className="ml-2 font-medium text-foreground">{asset?.assigned_to_name || 'Unassigned'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 lg:flex-col lg:w-auto">
          <Button
            variant="default"
            iconName="Edit"
            iconPosition="left"
            onClick={onEdit}
            className="w-full sm:w-auto"
          >
            Edit Asset
          </Button>
          <Button
            variant="outline"
            iconName="QrCode"
            iconPosition="left"
            onClick={onPrintQR}
            className="w-full sm:w-auto"
          >
            Print QR Code
          </Button>
          <Button
            variant={asset?.status === 'In Use' ? 'secondary' : 'success'}
            iconName={asset?.status === 'In Use' ? 'LogIn' : 'LogOut'}
            iconPosition="left"
            onClick={onCheckOut}
            className="w-full sm:w-auto"
          >
            {asset?.status === 'In Use' ? 'Check In' : 'Check Out'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AssetHeader;