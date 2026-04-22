import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { LoadingSpinner } from '../../components/ui/LoadingState';
import { formatCurrency } from '../../utils/formatters';
import { NotificationContainer } from '../../components/ui/NotificationToast';
import WriteOffModal from '../../components/WriteOffModal';

const WriteOffsPage = () => {
    const [activeTab, setActiveTab] = useState('pending');
    const [isLoading, setIsLoading] = useState(true);
    const [disposedAssets, setDisposedAssets] = useState([]);
    const [pendingAssets, setPendingAssets] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [reasonFilter, setReasonFilter] = useState('');
    const [methodFilter, setMethodFilter] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);

    const addNotification = (message, type = 'info') => {
        setNotifications(prev => [...prev, { id: Date.now(), message, type }]);
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'disposed') {
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
                setDisposedAssets(mappedAssets);
            } else {
                const { data, error } = await supabase
                    .from('assets')
                    .select('*')
                    .eq('is_archived', false)
                    .in('status', ['broken', 'Expired'])
                    .order('updated_at', { ascending: false });

                if (error) throw error;
                setPendingAssets(data || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            addNotification(`Failed to load data: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleProcessDisposal = (asset) => {
        setSelectedAsset(asset);
        setIsModalOpen(true);
    };

    const handleSuccess = (message) => {
        addNotification(message, 'success');
        fetchData();
    };

    const filteredDisposed = disposedAssets.filter(asset => {
        const matchesSearch = asset.asset_tag.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             asset.product_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesReason = !reasonFilter || asset.reason === reasonFilter;
        const matchesMethod = !methodFilter || asset.disposal_method === methodFilter;
        return matchesSearch && matchesReason && matchesMethod;
    });

    const filteredPending = pendingAssets.filter(asset => {
        return asset.asset_tag.toLowerCase().includes(searchQuery.toLowerCase()) || 
               asset.product_name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // KPI Calculations
    const totalDisposals = disposedAssets.length;
    const totalValue = disposedAssets.reduce((sum, asset) => sum + (Number(asset.purchase_price) || 0), 0);
    const pendingCount = pendingAssets.length;

    // Filter Options
    const reasonOptions = Array.from(new Set(disposedAssets.map(a => a.reason)))
        .filter(r => r !== 'N/A')
        .map(r => ({ value: r, label: r }));
    
    const methodOptions = Array.from(new Set(disposedAssets.map(a => a.disposal_method)))
        .filter(m => m !== 'N/A')
        .map(m => ({ value: m, label: m }));

    const exportToCSV = () => {
        const dataToExport = activeTab === 'disposed' ? filteredDisposed : filteredPending;
        if (dataToExport.length === 0) {
            addNotification('No data to export', 'warning');
            return;
        }

        let headers, rows;
        if (activeTab === 'disposed') {
            headers = ['Asset Tag', 'Product Name', 'Write-Off Date', 'Reason', 'Disposal Method', 'Original Price', 'Justification'];
            rows = dataToExport.map(asset => [
                asset.asset_tag,
                asset.product_name,
                new Date(asset.write_off_date).toLocaleDateString(),
                asset.reason,
                asset.disposal_method,
                asset.purchase_price,
                `"${asset.justification.replace(/"/g, '""')}"`
            ]);
        } else {
            headers = ['Asset Tag', 'Product Name', 'Status', 'Purchase Price', 'Purchase Date'];
            rows = dataToExport.map(asset => [
                asset.asset_tag,
                asset.product_name,
                asset.status,
                asset.purchase_price,
                asset.purchase_date
            ]);
        }

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Asset_${activeTab}_Export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addNotification('Export successful', 'success');
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Write-Offs & Disposals</h1>
                    <p className="text-muted-foreground">Manage decommissioning pipeline and disposal audit logs.</p>
                </div>
                <Button iconName="Download" onClick={exportToCSV}>Export {activeTab === 'pending' ? 'Queue' : 'Audit Log'} (CSV)</Button>
            </div>

            {/* Tab Buttons */}
            <div className="flex space-x-2 border-b border-border">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'pending' 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Pending Write-Offs
                    {pendingCount > 0 && (
                        <span className="ml-2 bg-warning/20 text-warning px-2 py-0.5 rounded-full text-xs font-bold">
                            {pendingCount}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('disposed')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'disposed' 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Disposed Assets (Audit Log)
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg text-primary">
                        <Icon name="Clock" size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Pending Write-Offs</p>
                        <h2 className="text-2xl font-bold">{pendingCount}</h2>
                    </div>
                </div>
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-success/10 rounded-lg text-success">
                        <Icon name="Trash2" size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Disposals</p>
                        <h2 className="text-2xl font-bold">{totalDisposals}</h2>
                    </div>
                </div>
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-warning/10 rounded-lg text-warning">
                        <Icon name="DollarSign" size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Value Disposed</p>
                        <h2 className="text-2xl font-bold">{formatCurrency(totalValue)}</h2>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                    <Input
                        label="Search Assets"
                        placeholder="Search by tag or name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        iconName="Search"
                    />
                </div>
                {activeTab === 'disposed' && (
                    <>
                        <div className="w-full md:w-48">
                            <Select
                                label="Reason"
                                options={reasonOptions}
                                value={reasonFilter}
                                onChange={setReasonFilter}
                                placeholder="All Reasons"
                                clearable
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <Select
                                label="Disposal Method"
                                options={methodOptions}
                                value={methodFilter}
                                onChange={setMethodFilter}
                                placeholder="All Methods"
                                clearable
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Content Tables */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="flex items-center justify-center h-[400px]">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        {activeTab === 'pending' ? (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-foreground">Asset Tag</th>
                                        <th className="px-6 py-4 font-semibold text-foreground">Product Name</th>
                                        <th className="px-6 py-4 font-semibold text-foreground">Status</th>
                                        <th className="px-6 py-4 font-semibold text-foreground">Purchase Price</th>
                                        <th className="px-6 py-4 font-semibold text-foreground text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredPending.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                                                <Icon name="Inbox" size={48} className="mx-auto mb-4 opacity-20" />
                                                <p>No assets pending write-off.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPending.map((asset) => (
                                            <tr key={asset.asset_tag} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-6 py-4 font-mono font-medium text-primary">
                                                    {asset.asset_tag}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-foreground">
                                                    {asset.product_name}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                        asset.status === 'broken' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'
                                                    }`}>
                                                        {asset.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {formatCurrency(asset.purchase_price)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="text-error hover:bg-error/10"
                                                        onClick={() => handleProcessDisposal(asset)}
                                                    >
                                                        Process Disposal
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-foreground">Asset Tag</th>
                                        <th className="px-6 py-4 font-semibold text-foreground">Product Name</th>
                                        <th className="px-6 py-4 font-semibold text-foreground">Write-Off Date</th>
                                        <th className="px-6 py-4 font-semibold text-foreground">Reason</th>
                                        <th className="px-6 py-4 font-semibold text-foreground">Method</th>
                                        <th className="px-6 py-4 font-semibold text-foreground text-right">Original Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredDisposed.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-muted-foreground">
                                                <Icon name="Inbox" size={48} className="mx-auto mb-4 opacity-20" />
                                                <p>No disposal records found.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredDisposed.map((asset) => (
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
                        )}
                    </div>
                )}
            </div>

            {isModalOpen && selectedAsset && (
                <WriteOffModal
                    asset={selectedAsset}
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedAsset(null);
                    }}
                    onSuccess={handleSuccess}
                />
            )}

            <NotificationContainer 
                notifications={notifications} 
                onRemove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} 
            />
        </div>
    );
};

export default WriteOffsPage;