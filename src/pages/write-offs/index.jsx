import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { LoadingSpinner } from '../../components/ui/LoadingState';
import { formatCurrency } from '../../utils/formatters';
import { NotificationContainer } from '../../components/ui/NotificationToast';

const WriteOffsPage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [assets, setAssets] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [reasonFilter, setReasonFilter] = useState('');
    const [methodFilter, setMethodFilter] = useState('');

    const addNotification = (message, type = 'info') => {
        setNotifications(prev => [...prev, { id: Date.now(), message, type }]);
    };

    useEffect(() => {
        fetchWriteOffs();
    }, []);

    const fetchWriteOffs = async () => {
        setIsLoading(true);
        try {
            // Fetch assets with Written Off status or is_archived flag
            // Also fetch activities to get the write-off details
            const { data, error } = await supabase
                .from('assets')
                .select(`
                    *,
                    activities!activities_asset_tag_fkey (
                        type,
                        created_at,
                        details
                    )
                `)
                .or('status.eq.Written Off,is_archived.eq.true')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Map assets and extract write-off details from activities
            const mappedAssets = data.map(asset => {
                const writeOffActivity = asset.activities?.find(act => act.type === 'asset_written_off');
                return {
                    ...asset,
                    write_off_date: writeOffActivity?.created_at || asset.updated_at,
                    reason: writeOffActivity?.details?.reason || 'N/A',
                    disposal_method: writeOffActivity?.details?.disposal_method || 'N/A',
                    justification: writeOffActivity?.details?.justification || 'N/A'
                };
            });

            setAssets(mappedAssets);
        } catch (error) {
            console.error('Error fetching write-offs:', error);
            addNotification(`Failed to load write-offs: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredAssets = assets.filter(asset => {
        const matchesSearch = asset.asset_tag.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             asset.product_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesReason = !reasonFilter || asset.reason === reasonFilter;
        const matchesMethod = !methodFilter || asset.disposal_method === methodFilter;
        return matchesSearch && matchesReason && matchesMethod;
    });

    // KPI Calculations
    const totalDisposals = assets.length;
    const totalValue = assets.reduce((sum, asset) => sum + (Number(asset.purchase_price) || 0), 0);
    const eWasteCount = assets.filter(asset => asset.disposal_method === 'E-Waste Recycling').length;

    // Filter Options
    const reasonOptions = Array.from(new Set(assets.map(a => a.reason)))
        .filter(r => r !== 'N/A')
        .map(r => ({ value: r, label: r }));
    
    const methodOptions = Array.from(new Set(assets.map(a => a.disposal_method)))
        .filter(m => m !== 'N/A')
        .map(m => ({ value: m, label: m }));

    const exportToCSV = () => {
        if (filteredAssets.length === 0) {
            addNotification('No data to export', 'warning');
            return;
        }

        const headers = ['Asset Tag', 'Product Name', 'Write-Off Date', 'Reason', 'Disposal Method', 'Original Price', 'Justification'];
        const rows = filteredAssets.map(asset => [
            asset.asset_tag,
            asset.product_name,
            new Date(asset.write_off_date).toLocaleDateString(),
            asset.reason,
            asset.disposal_method,
            asset.purchase_price,
            `"${asset.justification.replace(/"/g, '""')}"`
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Asset_WriteOffs_Export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addNotification('Export successful', 'success');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="xl" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Write-Offs & Disposals</h1>
                    <p className="text-muted-foreground">Historical audit log of decommissioned assets.</p>
                </div>
                <Button iconName="Download" onClick={exportToCSV}>Export Audit Log (CSV)</Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg text-primary">
                        <Icon name="Trash2" size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Disposals</p>
                        <h2 className="text-2xl font-bold">{totalDisposals}</h2>
                    </div>
                </div>
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-success/10 rounded-lg text-success">
                        <Icon name="DollarSign" size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Value Written Off</p>
                        <h2 className="text-2xl font-bold">{formatCurrency(totalValue)}</h2>
                    </div>
                </div>
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-warning/10 rounded-lg text-warning">
                        <Icon name="Recycle" size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">E-Waste Recycled</p>
                        <h2 className="text-2xl font-bold">{eWasteCount}</h2>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                    <Input
                        label="Search Assets"
                        placeholder="Search by tag or name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        iconName="Search"
                    />
                </div>
                <Select
                    label="Reason"
                    options={reasonOptions}
                    value={reasonFilter}
                    onChange={setReasonFilter}
                    placeholder="All Reasons"
                    clearable
                />
                <Select
                    label="Disposal Method"
                    options={methodOptions}
                    value={methodFilter}
                    onChange={setMethodFilter}
                    placeholder="All Methods"
                    clearable
                />
            </div>

            {/* Audit Table */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-foreground">Asset Tag</th>
                                <th className="px-6 py-4 font-semibold text-foreground">Product Name</th>
                                <th className="px-6 py-4 font-semibold text-foreground">Write-Off Date</th>
                                <th className="px-6 py-4 font-semibold text-foreground">Reason</th>
                                <th className="px-6 py-4 font-semibold text-foreground">Disposal Method</th>
                                <th className="px-6 py-4 font-semibold text-foreground text-right">Original Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredAssets.length === 0 ? (
                                <tr key="empty-state">
                                    <td colSpan="6" className="px-6 py-12 text-center text-muted-foreground">
                                        <Icon name="Inbox" size={48} className="mx-auto mb-4 opacity-20" />
                                        <p>No written-off assets found matching your criteria.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredAssets.map((asset) => (
                                    <tr key={asset.asset_tag} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 font-mono font-medium text-primary">
                                            {asset.asset_tag}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            {asset.product_name}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {new Date(asset.write_off_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded bg-muted text-xs font-medium">
                                                {asset.reason}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {asset.disposal_method}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium">
                                            {formatCurrency(asset.purchase_price)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <NotificationContainer 
                notifications={notifications} 
                onRemove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} 
            />
        </div>
    );
};

export default WriteOffsPage;
