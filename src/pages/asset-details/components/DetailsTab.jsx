import React from 'react';
import Icon from '../../../components/AppIcon';
import { calculateEOLDate, getEOLStatus } from '../../../utils/assetUtils';

const DetailsTab = ({ asset }) => {
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'RM 0.00';
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR'
    })?.format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Handle YYYY-MM-DD to avoid timezone shift
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day)?.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return new Date(dateString)?.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const calculateDepreciation = () => {
    if (!asset.purchase_date || !asset.purchase_price) return 0;
    const purchaseDate = new Date(asset.purchase_date);
    const currentDate = new Date();
    const yearsOwned = (currentDate - purchaseDate) / (1000 * 60 * 60 * 24 * 365);
    const annualDepreciation = asset.purchase_price * 0.2; // 20% per year
    const totalDepreciation = Math.max(0, Math.min(annualDepreciation * yearsOwned, asset.purchase_price * 0.8));
    return asset.purchase_price - totalDepreciation;
  };

  const getWarrantyStatus = () => {
    if (!asset.purchase_date || !asset.warranty_months) {
      return { status: 'No Warranty', color: 'text-muted-foreground', days: 0 };
    }
    
    const purchaseDate = new Date(asset.purchase_date);
    const warrantyEnd = new Date(purchaseDate);
    warrantyEnd.setMonth(warrantyEnd.getMonth() + parseInt(asset.warranty_months));
    
    const today = new Date();
    const daysRemaining = Math.ceil((warrantyEnd - today) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining > 90) {
      return { status: 'Active', color: 'text-success', days: daysRemaining, expiryDate: warrantyEnd };
    } else if (daysRemaining > 0) {
      return { status: 'Expiring Soon', color: 'text-warning', days: daysRemaining, expiryDate: warrantyEnd };
    } else {
      return { status: 'Expired', color: 'text-error', days: Math.abs(daysRemaining), expiryDate: warrantyEnd };
    }
  };

  const warrantyInfo = getWarrantyStatus();
  const currentValue = calculateDepreciation();
  
  // Calculate EOL using the new utility
  const eolDate = calculateEOLDate(asset.purchase_date, asset.lifespan_months || (asset.lifespan_years * 12));
  const eolStatus = getEOLStatus(eolDate);

  return (
    <div tabId="details">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Information */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <Icon name="Package" size={20} className="mr-2" />
              Basic Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Asset Name</span>
                <span className="font-medium text-foreground">{asset?.product_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium text-foreground">{asset?.category}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Brand</span>
                <span className="font-medium text-foreground">{asset?.brand || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Model</span>
                <span className="font-medium text-foreground">{asset?.model || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Serial Number</span>
                <span className="font-medium text-foreground font-mono">{asset?.serial_number}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Asset Tag</span>
                <span className="font-medium text-foreground font-mono">{asset?.asset_tag}</span>
              </div>
            </div>
          </div>

          {/* Location & Assignment */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <Icon name="MapPin" size={20} className="mr-2" />
              Location & Assignment
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Current Location</span>
                <span className="font-medium text-foreground">{asset?.location_name || asset?.location || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Assigned To</span>
                <span className="font-medium text-foreground">{asset?.assigned_to_name || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Assignment Date</span>
                <span className="font-medium text-foreground">
                  {asset?.assignment_date ? formatDate(asset?.assignment_date) : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Lifecycle Information */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <Icon name="RefreshCw" size={20} className="mr-2" />
              Lifecycle Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">EOL Status</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${eolStatus.color}`}>
                  {eolStatus.status}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Expected EOL Date</span>
                <span className="font-medium text-foreground">
                  {eolDate ? formatDate(eolDate.toISOString().split('T')[0]) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Lifespan</span>
                <span className="font-medium text-foreground">
                  {asset?.lifespan_months ? `${asset.lifespan_months} Months` : (asset?.lifespan_years ? `${asset.lifespan_years} Years` : 'N/A')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <Icon name="DollarSign" size={20} className="mr-2" />
              Financial Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Purchase Price</span>
                <span className="font-medium text-foreground">{formatCurrency(asset?.purchase_price)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Current Value</span>
                <span className="font-medium text-foreground">{formatCurrency(currentValue)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Purchase Date</span>
                <span className="font-medium text-foreground">{formatDate(asset?.purchase_date)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Supplier</span>
                <span className="font-medium text-foreground">{asset?.supplier_name || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Warranty Information */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <Icon name="Shield" size={20} className="mr-2" />
              Warranty Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Warranty Status</span>
                <span className={`font-medium ${warrantyInfo?.color}`}>
                  {warrantyInfo?.status}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Warranty Expiry</span>
                <span className="font-medium text-foreground">
                  {warrantyInfo?.expiryDate ? formatDate(warrantyInfo.expiryDate.toISOString().split('T')[0]) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Days Remaining</span>
                <span className={`font-medium ${warrantyInfo?.color}`}>
                  {warrantyInfo?.status === 'Expired' 
                    ? `Expired ${warrantyInfo?.days} days ago`
                    : warrantyInfo?.status === 'No Warranty' ? 'N/A' : `${warrantyInfo?.days} days`
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsTab;