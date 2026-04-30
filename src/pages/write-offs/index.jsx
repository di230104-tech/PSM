import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';
import { LoadingSpinner } from '../../components/ui/LoadingState';
import { formatCurrency } from '../../utils/formatters';
import { NotificationContainer } from '../../components/ui/NotificationToast';
import { logActivity } from '../../utils/activityLogger';
import { cn } from '../../utils/cn';
import WriteOffModal from '../../components/WriteOffModal';
import WriteOffReviewPanel from './components/WriteOffReviewPanel';
import { useSelector } from 'react-redux';

const WriteOffsPage = () => {
    const [activeTab, setActiveTab] = useState('pending');
    const [isLoading, setIsLoading] = useState(true);
    const [disposedAssets, setDisposedAssets] = useState([]);
    const [pendingAssets, setPendingAssets] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [reasonFilter, setReasonFilter] = useState('');
    const [methodFilter, setMethodFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedAssetIds, setSelectedAssetIds] = useState([]);
    const [isBulkApproving, setIsBulkApproving] = useState(false);

    // Modal & Panel state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [isReviewPanelOpen, setIsReviewPanelOpen] = useState(false);
    const [reviewAsset, setReviewAsset] = useState(null);

    const addNotification = (message, type = 'info') => {
        setNotifications(prev => [...prev, { id: Date.now(), message, type }]);
    };

    useEffect(() => {
        fetchData();
        setSelectedAssetIds([]);
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

    const handleReviewAsset = (asset) => {
        setReviewAsset(asset);
        setIsReviewPanelOpen(true);
    };

    const handleSuccess = (message) => {
        addNotification(message, 'success');
        fetchData();
    };

    const filteredDisposed = useMemo(() => {
        const filtered = disposedAssets.filter(asset => {
            const matchesSearch = asset.asset_tag.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 asset.product_name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesReason = !reasonFilter || asset.reason === reasonFilter;
            const matchesMethod = !methodFilter || asset.disposal_method === methodFilter;
            
            // Date Range Filtering
            let matchesDateRange = true;
            if (startDate || endDate) {
                const assetDate = new Date(asset.write_off_date);
                if (startDate) {
                    matchesDateRange = matchesDateRange && assetDate >= new Date(startDate);
                }
                if (endDate) {
                    // Set end date to the end of the day
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    matchesDateRange = matchesDateRange && assetDate <= end;
                }
            }

            return matchesSearch && matchesReason && matchesMethod && matchesDateRange;
        });

        return filtered.sort((a, b) => {
            const dateA = new Date(a.write_off_date).getTime();
            const dateB = new Date(b.write_off_date).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
    }, [disposedAssets, searchQuery, reasonFilter, methodFilter, sortOrder, startDate, endDate]);

    const filteredPending = useMemo(() => {
        return pendingAssets.filter(asset => {
            const matchesSearch = asset.asset_tag.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 asset.product_name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = !categoryFilter || asset.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [pendingAssets, searchQuery, categoryFilter]);

    // Selection Handlers
    const toggleSelectAll = () => {
        if (selectedAssetIds.length === filteredPending.length) {
            setSelectedAssetIds([]);
        } else {
            setSelectedAssetIds(filteredPending.map(a => a.asset_tag));
        }
    };

    const toggleSelectRow = (assetTag) => {
        setSelectedAssetIds(prev => 
            prev.includes(assetTag) 
                ? prev.filter(id => id !== assetTag) 
                : [...prev, assetTag]
        );
    };

    const handleBulkApprove = async () => {
        if (selectedAssetIds.length === 0) return;
        
        setIsBulkApproving(true);
        try {
            // 1. Bulk Update Status
            const { error: updateError } = await supabase
                .from('assets')
                .update({ 
                    status: 'Written Off', 
                    is_archived: true 
                })
                .in('asset_tag', selectedAssetIds);

            if (updateError) throw updateError;

            // 2. Log Activity for each (in parallel)
            await Promise.all(selectedAssetIds.map(tag => 
                logActivity(
                    'asset_written_off',
                    `Asset bulk approved for disposal`,
                    tag,
                    userId,
                    {
                        reason: 'Bulk Approval',
                        disposal_method: 'Pending Batch Disposal',
                        justification: 'Approved via bulk action in IT Management dashboard',
                        authorized_by: authUser?.email || userId
                    }
                )
            ));

            addNotification(`Successfully approved ${selectedAssetIds.length} assets for disposal.`, 'success');
            setSelectedAssetIds([]);
            fetchData();
        } catch (error) {
            console.error('Bulk Approval Error:', error);
            addNotification(`Bulk approval failed: ${error.message}`, 'error');
        } finally {
            setIsBulkApproving(false);
        }
    };

    const selectionSummary = useMemo(() => {
        const selected = pendingAssets.filter(a => selectedAssetIds.includes(a.asset_tag));
        return {
            count: selected.length,
            totalValue: selected.reduce((sum, a) => sum + (Number(a.purchase_price) || 0), 0)
        };
    }, [pendingAssets, selectedAssetIds]);

    const disposedMetrics = useMemo(() => {
        return {
            count: filteredDisposed.length,
            totalValue: filteredDisposed.reduce((sum, a) => sum + (Number(a.purchase_price) || 0), 0)
        };
    }, [filteredDisposed]);

    // KPI Calculations
    const pendingCount = pendingAssets.length;

    // Filter Options
    const reasonOptions = Array.from(new Set(disposedAssets.map(a => a.reason)))
        .filter(r => r !== 'N/A')
        .map(r => ({ value: r, label: r }));
    
    const methodOptions = Array.from(new Set(disposedAssets.map(a => a.disposal_method)))
        .filter(m => m !== 'N/A')
        .map(m => ({ value: m, label: m }));

    const categoryOptions = useMemo(() => {
        const categories = Array.from(new Set(pendingAssets.map(a => a.category))).filter(Boolean);
        return categories.map(c => ({ value: c, label: c }));
    }, [pendingAssets]);

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
                <div className="flex gap-3">
                    {activeTab === 'pending' && selectedAssetIds.length > 0 && (
                        <div className="flex items-center gap-4 px-4 py-1.5 bg-muted/50 border border-border rounded-lg animate-in fade-in slide-in-from-right-4 duration-200">
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-bold text-foreground">
                                    {selectionSummary.count} Assets Selected
                                </span>
                                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-tight">
                                    Total Value: {formatCurrency(selectionSummary.totalValue)}
                                </span>
                            </div>
                            <div className="w-px h-8 bg-border" />
                            <Button 
                                variant="primary" 
                                className="bg-success hover:bg-success/90 border-none shadow-lg shadow-success/20"
                                iconName="CheckCircle"
                                onClick={handleBulkApprove}
                                loading={isBulkApproving}
                            >
                                Approve {selectionSummary.count} for Disposal
                            </Button>
                        </div>
                    )}
                    <Button variant="outline" iconName="Download" onClick={exportToCSV}>Export {activeTab === 'pending' ? 'Queue' : 'Audit Log'} (CSV)</Button>
                </div>
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
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                            {activeTab === 'disposed' ? 'Visible Disposals' : 'Total Disposals'}
                        </p>
                        <h2 className="text-2xl font-bold">
                            {activeTab === 'disposed' ? disposedMetrics.count : disposedAssets.length}
                        </h2>
                    </div>
                </div>
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-warning/10 rounded-lg text-warning">
                        <Icon name="DollarSign" size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                            {activeTab === 'disposed' ? 'Visible Value' : 'Total Value Disposed'}
                        </p>
                        <h2 className="text-2xl font-bold">
                            {activeTab === 'disposed' ? formatCurrency(disposedMetrics.totalValue) : formatCurrency(disposedAssets.reduce((sum, a) => sum + (Number(a.purchase_price) || 0), 0))}
                        </h2>
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
                <div className="w-full md:w-48">
                    {activeTab === 'pending' ? (
                        <Select
                            label="Category"
                            options={categoryOptions}
                            value={categoryFilter}
                            onChange={setCategoryFilter}
                            placeholder="All Categories"
                            clearable
                        />
                    ) : (
                        <Select
                            label="Reason"
                            options={reasonOptions}
                            value={reasonFilter}
                            onChange={setReasonFilter}
                            placeholder="All Reasons"
                            clearable
                        />
                    )}
                </div>
                {activeTab === 'disposed' && (
                    <>
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
                        <div className="w-full md:w-40">
                            <Input
                                label="From"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="w-full md:w-40">
                            <Input
                                label="To"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        {(startDate || endDate) && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-10 mb-0.5 text-muted-foreground hover:text-foreground"
                                iconName="X"
                                onClick={() => {
                                    setStartDate('');
                                    setEndDate('');
                                }}
                            >
                                Clear
                            </Button>
                        )}
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
                                        <th className="px-6 py-4 w-12">
                                            <Checkbox 
                                                checked={filteredPending.length > 0 && selectedAssetIds.length === filteredPending.length}
                                                indeterminate={selectedAssetIds.length > 0 && selectedAssetIds.length < filteredPending.length}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                        <th className="px-6 py-4 font-semibold text-foreground">Asset Tag</th>
                                        <th className="px-6 py-4 font-semibold text-foreground">Product Name</th>
                                        <th className="px-6 py-4 font-semibold text-foreground">Category</th>
                                        <th className="px-6 py-4 font-semibold text-foreground">Status</th>
                                        <th className="px-6 py-4 font-semibold text-foreground">Purchase Price</th>
                                        <th className="px-6 py-4 font-semibold text-foreground text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredPending.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-12 text-center text-muted-foreground">
                                                <Icon name="Inbox" size={48} className="mx-auto mb-4 opacity-20" />
                                                <p>No assets pending write-off.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPending.map((asset) => (
                                            <tr 
                                                key={asset.asset_tag} 
                                                className={cn(
                                                    "hover:bg-muted/30 transition-colors cursor-pointer",
                                                    (selectedAssetIds.includes(asset.asset_tag) || reviewAsset?.asset_tag === asset.asset_tag) && "bg-primary/5"
                                                )}
                                                onClick={() => handleReviewAsset(asset)}
                                            >
                                                <td className="px-6 py-4" onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleSelectRow(asset.asset_tag);
                                                }}>
                                                    <Checkbox 
                                                        checked={selectedAssetIds.includes(asset.asset_tag)}
                                                        onChange={() => toggleSelectRow(asset.asset_tag)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 font-mono font-medium text-primary">
                                                    {asset.asset_tag}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-foreground">
                                                    {asset.product_name}
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {asset.category}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                        asset.status === 'broken' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'
                                                    }`}>
                                                        {asset.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-medium">
                                                    {formatCurrency(asset.purchase_price)}
                                                </td>
                                                <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
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
                                        <th 
                                            className={cn(
                                                "px-6 py-4 font-semibold text-foreground cursor-pointer hover:bg-muted transition-colors select-none group",
                                                "flex items-center gap-1"
                                            )}
                                            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                                        >
                                            Write-Off Date
                                            <div className="text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity">
                                                {sortOrder === 'desc' ? (
                                                    <Icon name="ChevronDown" size={14} />
                                                ) : (
                                                    <Icon name="ChevronUp" size={14} />
                                                )}
                                            </div>
                                        </th>
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
                                                <p>
                                                    {(startDate || endDate) 
                                                        ? "No assets were disposed of during this date range." 
                                                        : "No disposal records found."}
                                                </p>
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

            <WriteOffReviewPanel
                asset={reviewAsset}
                isOpen={isReviewPanelOpen}
                onClose={() => {
                    setIsReviewPanelOpen(false);
                    setReviewAsset(null);
                }}
                onSuccess={handleSuccess}
            />

            <NotificationContainer 
                notifications={notifications} 
                onRemove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} 
            />
        </div>
    );
};

export default WriteOffsPage;