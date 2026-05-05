import React from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import { formatAssetStatus } from '../../../utils/formatters';
import { calculateEOLDate, getEOLStatus } from '../../../utils/assetUtils';
import { calculateTotalMaintenanceCost, getAssetHealthStatus } from '../../../utils/financialUtils';

const AssetTable = ({
    assets,
    sortConfig,
    onSort,
    onAssetClick,
    onOpenQrModal,
    onDeleteAsset
}) => {
    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return 'ArrowUpDown';
        return sortConfig.direction === 'asc' ? 'ArrowUp' : 'ArrowDown';
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'In Use':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'Available':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'In Repair':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'Broken':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'retired': 
                return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'Written-Off':
            case 'Written Off': 
                return 'bg-red-100 text-red-800 border-red-200';
            default: 
                return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    return (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Asset Tag</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product Details</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <button onClick={() => onSort('category')} className="flex items-center gap-2 hover:text-gray-700 transition-colors">
                                Category
                                <Icon name={getSortIcon('category')} size={14} />
                            </button>
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <button onClick={() => onSort('departments.name')} className="flex items-center gap-2 hover:text-gray-700 transition-colors">
                                Department
                                <Icon name={getSortIcon('departments.name')} size={14} />
                            </button>
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <button onClick={() => onSort('suppliers.company_name')} className="flex items-center gap-2 hover:text-gray-700 transition-colors">
                                Supplier
                                <Icon name={getSortIcon('suppliers.company_name')} size={14} />
                            </button>
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <button onClick={() => onSort('status')} className="flex items-center gap-2 hover:text-gray-700 transition-colors">
                                Status
                                <Icon name={getSortIcon('status')} size={14} />
                            </button>
                        </th>
                        <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Health</th>
                        <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">EOL Status</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <button onClick={() => onSort('locations.name')} className="flex items-center gap-2 hover:text-gray-700 transition-colors">
                                Location
                                <Icon name={getSortIcon('locations.name')} size={14} />
                            </button>
                        </th>
                        <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                        <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                    {assets.map((asset) => {
                        const eolDate = calculateEOLDate(asset.purchase_date, asset.lifespan_months || (asset.lifespan_years * 12));
                        const eolStatus = getEOLStatus(eolDate);
                        
                        const totalMaint = calculateTotalMaintenanceCost(asset.maintenance);
                        const health = getAssetHealthStatus(asset.purchase_price, totalMaint);
                        
                        // Fallback logic for Department: Direct Assignment > Employee's Department > N/A
                        const activeLoan = asset.loans?.find(l => l.status === 'active');
                        const departmentName = 
                            asset.departments?.name || 
                            activeLoan?.employees?.departments?.name || 
                            activeLoan?.departments?.name ||
                            'N/A';
                        
                        return (
                            <tr 
                                key={asset.asset_tag} 
                                className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                                onClick={() => onAssetClick(asset)}
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="font-bold text-blue-600 group-hover:text-blue-700">
                                        {asset.asset_tag}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <div className="font-bold text-gray-900">{asset.product_name}</div>
                                        {health.status !== 'Healthy' && (
                                            <div title={health.status} className={health.status.includes('Lemon') ? 'text-red-500' : 'text-amber-500'}>
                                                <Icon name={health.icon} size={16} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-[11px] font-medium text-gray-400">{asset.serial_number}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{asset.category}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{departmentName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.suppliers?.company_name || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusColor(asset.status)}`}>
                                        {formatAssetStatus(asset.status)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <div className="flex justify-center" title={health.status}>
                                        <div className={`p-1 flex items-center justify-center rounded-lg border ${health.color}`}>
                                            <Icon name={health.icon} size={14} />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${eolStatus.color}`}>
                                        {eolStatus.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{asset.locations?.name || 'Unassigned'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-gray-900">
                                    {asset.purchase_price ? `RM ${asset.purchase_price.toLocaleString()}` : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={(e) => { e.stopPropagation(); onAssetClick(asset); }} 
                                            className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                        >
                                            <Icon name="Eye" size={16} />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={(e) => { e.stopPropagation(); onOpenQrModal(asset); }} 
                                            className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                        >
                                            <Icon name="QrCode" size={16} />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={(e) => { e.stopPropagation(); onDeleteAsset(asset); }} 
                                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Icon name="Trash" size={16} />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default AssetTable;
