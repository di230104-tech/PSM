import React from 'react';
import Icon from '../../../components/AppIcon';
import { Cpu, HardDrive, Database, Monitor, Globe, Network, Settings } from 'lucide-react';
import { calculateEOLDate, getEOLStatus, calculateDepreciation } from '../../../utils/assetUtils';
import { formatCurrency } from '../../../utils/formatters';
import { 
  calculateTotalMaintenanceCost, 
  calculateTCO, 
  getAssetHealthStatus, 
  calculateMonthlyRunRate 
} from '../../../utils/financialUtils';

const DetailsTab = ({ asset, maintenanceHistory = [], tabId, ...props }) => {
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
  const currentValue = calculateDepreciation(asset.purchase_date, asset.purchase_price);
  
  // Financial Calculations
  const totalMaintenanceCost = calculateTotalMaintenanceCost(maintenanceHistory);
  const tco = calculateTCO(asset.purchase_price, totalMaintenanceCost);
  const healthStatus = getAssetHealthStatus(asset.purchase_price, totalMaintenanceCost);
  const monthlyRunRate = calculateMonthlyRunRate(tco, asset.purchase_date);

  // Calculate EOL using the new utility
  const eolDate = calculateEOLDate(asset.purchase_date, asset.lifespan_months || (asset.lifespan_years * 12));
  const eolStatus = getEOLStatus(eolDate);

  return (
    <div {...props}>
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
                <span className="font-medium text-foreground">{asset?.location_name || 'Unassigned'}</span>
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <Icon name="DollarSign" size={20} className="mr-2" />
                Financial Information
              </h3>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${healthStatus.color}`}>
                <Icon name={healthStatus.icon} size={14} />
                {healthStatus.status}
              </div>
            </div>
            
            <div className="space-y-3 bg-muted/20 p-4 rounded-lg border border-border/50">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Purchase Price</span>
                <span className="font-medium text-foreground">{formatCurrency(asset?.purchase_price)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Maintenance Cost</span>
                <span className="font-medium text-error">{formatCurrency(totalMaintenanceCost)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground font-bold text-foreground">Total Cost (TCO)</span>
                <span className="font-bold text-foreground text-lg">{formatCurrency(tco)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Monthly Run Rate</span>
                <span className="font-medium text-foreground">{formatCurrency(monthlyRunRate)} / month</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground font-medium">Estimated Current Value</span>
                <span className="font-medium text-success">{formatCurrency(currentValue)}</span>
              </div>
            </div>

            <div className="mt-4 space-y-3 px-1">
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

      {/* Technical Specifications */}
      <div className="mt-12">
        <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center">
          <Settings size={20} className="mr-2 text-primary" />
          Technical Specifications
        </h3>
        
        {asset?.technical_specs && Object.values(asset.technical_specs).some(v => v) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {asset.technical_specs.processor && (
              <div className="p-4 bg-muted/20 border border-border/50 rounded-xl flex items-center gap-4">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Cpu size={24} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Processor</p>
                  <p className="text-sm font-semibold text-foreground">{asset.technical_specs.processor}</p>
                </div>
              </div>
            )}
            
            {asset.technical_specs.memory && (
              <div className="p-4 bg-muted/20 border border-border/50 rounded-xl flex items-center gap-4">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Database size={24} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Memory (RAM)</p>
                  <p className="text-sm font-semibold text-foreground">{asset.technical_specs.memory}</p>
                </div>
              </div>
            )}

            {asset.technical_specs.storage && (
              <div className="p-4 bg-muted/20 border border-border/50 rounded-xl flex items-center gap-4">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <HardDrive size={24} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Storage</p>
                  <p className="text-sm font-semibold text-foreground">{asset.technical_specs.storage}</p>
                </div>
              </div>
            )}

            {asset.technical_specs.graphics && (
              <div className="p-4 bg-muted/20 border border-border/50 rounded-xl flex items-center gap-4">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Monitor size={24} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Graphics</p>
                  <p className="text-sm font-semibold text-foreground">{asset.technical_specs.graphics}</p>
                </div>
              </div>
            )}

            {asset.technical_specs.os && (
              <div className="p-4 bg-muted/20 border border-border/50 rounded-xl flex items-center gap-4">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Globe size={24} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">OS</p>
                  <p className="text-sm font-semibold text-foreground">{asset.technical_specs.os}</p>
                </div>
              </div>
            )}

            {asset.technical_specs.network_card && (
              <div className="p-4 bg-muted/20 border border-border/50 rounded-xl flex items-center gap-4">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Network size={24} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Network</p>
                  <p className="text-sm font-semibold text-foreground">{asset.technical_specs.network_card}</p>
                </div>
              </div>
            )}

            {asset.technical_specs.ports && (
              <div className="p-4 bg-muted/20 border border-border/50 rounded-xl flex items-center gap-4 md:col-span-2 lg:col-span-2">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Icon name="Settings" size={24} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Ports</p>
                  <p className="text-sm font-semibold text-foreground">{asset.technical_specs.ports}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 border border-dashed border-border rounded-xl text-center">
            <p className="text-muted-foreground italic">No technical specifications recorded for this asset.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailsTab;