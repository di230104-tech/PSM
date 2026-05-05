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

const DetailsTab = ({ asset, assignmentHistory = [], maintenanceHistory = [], tabId, ...props }) => {
  const formatSafeDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area (Left/Top) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Icon name="Package" size={16} className="text-blue-600" />
                Asset Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Product Name</label>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{asset?.product_name}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Category</label>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{asset?.category}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Serial Number</label>
                  <p className="text-sm font-mono font-bold text-gray-700 mt-0.5">{asset?.serial_number}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Asset Tag</label>
                  <p className="text-sm font-mono font-bold text-blue-600 mt-0.5">{asset?.asset_tag}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Icon name="MapPin" size={16} className="text-blue-600" />
                Current Assignment
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Location</label>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{asset?.location_name || 'Unassigned'}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Assigned To</label>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{asset?.assigned_to_name || 'Unassigned'}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Assign Date</label>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">
                    {asset?.assignment_date ? formatDate(asset?.assignment_date) : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Owner Email</label>
                  <p className="text-sm font-medium text-gray-500 mt-0.5 truncate" title={asset?.assigned_to_email}>
                    {asset?.assigned_to_email || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Settings size={18} className="text-blue-600" />
              Technical Specifications
            </h3>
            
            {asset?.technical_specs && Object.values(asset.technical_specs).some(v => v) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {asset.technical_specs.processor && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                      <Cpu size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Processor</p>
                      <p className="text-sm font-bold text-gray-900">{asset.technical_specs.processor}</p>
                    </div>
                  </div>
                )}
                
                {asset.technical_specs.memory && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                      <Database size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Memory</p>
                      <p className="text-sm font-bold text-gray-900">{asset.technical_specs.memory}</p>
                    </div>
                  </div>
                )}

                {asset.technical_specs.storage && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                      <HardDrive size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Storage</p>
                      <p className="text-sm font-bold text-gray-900">{asset.technical_specs.storage}</p>
                    </div>
                  </div>
                )}

                {asset.technical_specs.os && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                      <Globe size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">OS</p>
                      <p className="text-sm font-bold text-gray-900">{asset.technical_specs.os}</p>
                    </div>
                  </div>
                )}

                {asset.technical_specs.graphics && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                      <Monitor size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Graphics</p>
                      <p className="text-sm font-bold text-gray-900">{asset.technical_specs.graphics}</p>
                    </div>
                  </div>
                )}

                {asset.technical_specs.ports && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                      <Icon name="Settings" size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Ports</p>
                      <p className="text-sm font-bold text-gray-900">{asset.technical_specs.ports}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-xl">
                <p className="text-sm text-gray-400 italic font-medium">No technical specifications recorded.</p>
              </div>
            )}
          </div>

          {/* Assignment History */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-2">
              <Icon name="History" size={18} className="text-blue-600" />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Assignment History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">User/Dept</th>
                    <th scope="col" className="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assigned</th>
                    <th scope="col" className="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Returned</th>
                    <th scope="col" className="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {assignmentHistory && assignmentHistory.length > 0 ? (
                    assignmentHistory.map((loan) => (
                      <tr key={loan.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">
                            {loan.employees?.full_name || loan.departments?.name || 'Unassigned'}
                          </div>
                          <div className="text-[11px] font-medium text-gray-400 mt-0.5">
                            {loan.employees?.departments?.name || loan.departments?.name || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-600">
                          {formatSafeDate(loan.checkout_date) || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          {loan.actual_return_date 
                            ? <span className="text-gray-600">{formatSafeDate(loan.actual_return_date)}</span>
                            : <span className="text-green-600 font-bold text-[10px] uppercase tracking-wider bg-green-50 px-2 py-1 rounded-md border border-green-100">Currently Assigned</span>
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            loan.status === 'active' 
                              ? 'bg-blue-50 text-blue-700 border-blue-100' 
                              : 'bg-gray-100 text-gray-500 border-gray-200'
                          }`}>
                            {loan.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-400 font-medium italic">
                        No previous assignments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar (Right/Bottom) */}
        <div className="space-y-6">
          {/* Financial Overview */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Icon name="DollarSign" size={16} className="text-blue-600" />
                Financials
              </h3>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${healthStatus.color}`}>
                <Icon name={healthStatus.icon} size={12} />
                {healthStatus.status}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-xs font-bold text-gray-400 uppercase">Purchase Price</span>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(asset?.purchase_price)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-xs font-bold text-gray-400 uppercase">Current Value</span>
                <span className="text-sm font-bold text-green-600">{formatCurrency(currentValue)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-xs font-bold text-gray-400 uppercase">Maintenance</span>
                <span className="text-sm font-bold text-red-600">{formatCurrency(totalMaintenanceCost)}</span>
              </div>
              <div className="pt-2">
                <div className="flex justify-between items-center bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                  <span className="text-xs font-bold text-blue-900 uppercase">Total TCO</span>
                  <span className="text-lg font-black text-blue-600">{formatCurrency(tco)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lifecycle & Warranty */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Icon name="RefreshCw" size={16} className="text-blue-600" />
              Lifecycle
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase">EOL Status</span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${eolStatus.color}`}>
                  {eolStatus.status}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">Purchase Date</span>
                <span className="text-sm font-bold text-gray-900">{formatDate(asset?.purchase_date)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">EOL Date</span>
                <span className="text-sm font-bold text-gray-900">
                  {eolDate ? formatDate(eolDate.toISOString().split('T')[0]) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">Lifespan</span>
                <span className="text-sm font-bold text-gray-900">
                  {asset?.lifespan_months ? `${asset.lifespan_months} Months` : (asset?.lifespan_years ? `${asset.lifespan_years} Years` : 'N/A')}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Icon name="Shield" size={16} className="text-blue-600" />
              Warranty
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase">Status</span>
                <span className={`text-xs font-bold ${warrantyInfo?.color}`}>
                  {warrantyInfo?.status}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">Expiry</span>
                <span className="text-sm font-bold text-gray-900">
                  {warrantyInfo?.expiryDate ? formatDate(warrantyInfo.expiryDate.toISOString().split('T')[0]) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">Timeline</span>
                <span className={`text-xs font-bold ${warrantyInfo?.color}`}>
                  {warrantyInfo?.status === 'Expired' 
                    ? `Expired ${warrantyInfo?.days}d ago`
                    : warrantyInfo?.status === 'No Warranty' ? 'N/A' : `${warrantyInfo?.days} days left`
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