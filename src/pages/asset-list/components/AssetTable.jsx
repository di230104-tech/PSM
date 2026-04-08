import React from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import { formatAssetStatus } from '../../../utils/formatters';

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
            case 'checked_out': return 'bg-green-100 text-green-800 border-green-200';
            case 'in_storage': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'in_repair': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'broken': return 'bg-red-100 text-red-800 border-red-200';
            case 'retired': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };



    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                    <tr>

                        <th className="px-6 py-4 font-medium">Asset Tag</th>
                        <th className="px-6 py-4 font-medium">Product Details</th>
                        <th className="px-6 py-4 font-medium">
                            <button onClick={() => onSort('category')} className="flex items-center gap-2">
                                Category
                                <Icon name={getSortIcon('category')} size={14} />
                            </button>
                        </th>
                        <th className="px-6 py-4 font-medium">
                            <button onClick={() => onSort('departments.name')} className="flex items-center gap-2">
                                Department
                                <Icon name={getSortIcon('departments.name')} size={14} />
                            </button>
                        </th>
                        <th className="px-6 py-4 font-medium">
                            <button onClick={() => onSort('suppliers.company_name')} className="flex items-center gap-2">
                                Supplier
                                <Icon name={getSortIcon('suppliers.company_name')} size={14} />
                            </button>
                        </th>
                        <th className="px-6 py-4 font-medium">
                            <button onClick={() => onSort('status')} className="flex items-center gap-2">
                                Status
                                <Icon name={getSortIcon('status')} size={14} />
                            </button>
                        </th>
                        <th className="px-6 py-4 font-medium text-right">Price</th>
                        <th className="px-6 py-4 font-medium text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {assets.map((asset) => (
                        <tr key={asset.asset_tag} className="hover:bg-muted/30 transition-colors">

                            <td className="px-6 py-4">
                                <button onClick={() => onAssetClick(asset)} className="font-medium text-primary hover:underline">
                                    {asset.asset_tag}
                                </button>
                            </td>
                            <td className="px-6 py-4">
                                <div className="font-medium text-foreground">{asset.product_name}</div>
                                <div className="text-xs text-muted-foreground">{asset.serial_number}</div>
                            </td>
                            <td className="px-6 py-4">{asset.category}</td>
                            <td className="px-6 py-4">{asset.departments?.name || 'Unknown'}</td>
                            <td className="px-6 py-4 text-muted-foreground">{asset.suppliers?.company_name || 'Unknown'}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(asset.status)}`}>
                                    {formatAssetStatus(asset.status)}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right font-medium">
                                {asset.purchase_price ? `RM ${asset.purchase_price.toLocaleString()}` : '-'}
                            </td>
                            <td className="px-6 py-4 text-center">
                                <Button variant="ghost" size="icon" onClick={() => onAssetClick(asset)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                                    <Icon name="Eye" size={16} />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => onOpenQrModal(asset)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                                    <Icon name="QrCode" size={16} />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => onDeleteAsset(asset)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                    <Icon name="Trash" size={16} />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AssetTable;
