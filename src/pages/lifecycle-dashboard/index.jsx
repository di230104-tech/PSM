import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { calculateEOLDate } from '../../utils/assetUtils';
import { LoadingSpinner } from '../../components/ui/LoadingState';
import { NotificationContainer } from '../../components/ui/NotificationToast';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import KPICard from '../dashboard/components/KPICard';
import { exportToProfessionalCSV } from '../../utils/csvExport';
import SecurityAuditReport from '../reports/components/SecurityAuditReport';
import EOLBudgetReport from '../reports/components/EOLBudgetReport';

const LifecycleDashboard = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [allAssets, setAllAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [forecastPeriod, setForecastPeriod] = useState('12_months');
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]);

  // Fetch active assets
  useEffect(() => {
    const fetchAssets = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('assets')
          .select('asset_tag, product_name, category, purchase_date, lifespan_months, purchase_price, status')
          .in('status', ['In Use', 'Available', 'checked_out', 'in_storage']); // Inclusive search for active assets

        if (error) throw error;

        // Process assets with EOL dates
        const processedAssets = data.map(asset => ({
          ...asset,
          eolDate: calculateEOLDate(asset.purchase_date, asset.lifespan_months)
        }));

        setAssets(processedAssets);
        setAllAssets(data);
      } catch (error) {
        console.error('Error fetching assets:', error);
        addNotification('Failed to load forecast data', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssets();
  }, []);

  const addNotification = (message, type = 'info') => {
    setNotifications(prev => [...prev, { id: Date.now(), message, type }]);
  };

  // Filter assets based on forecast period
  const expiringAssets = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate = new Date(today);
    let endDate = new Date(today);

    if (forecastPeriod === 'custom') {
      const [sYear, sMonth, sDay] = customStartDate.split('-').map(Number);
      const [eYear, eMonth, eDay] = customEndDate.split('-').map(Number);
      startDate = new Date(sYear, sMonth - 1, sDay);
      endDate = new Date(eYear, eMonth - 1, eDay);
    } else {
      if (forecastPeriod === '3_months') endDate.setMonth(today.getMonth() + 3);
      else if (forecastPeriod === '6_months') endDate.setMonth(today.getMonth() + 6);
      else if (forecastPeriod === '12_months') endDate.setMonth(today.getMonth() + 12);
      else if (forecastPeriod === '1_year') endDate.setFullYear(today.getFullYear() + 1);
      else if (forecastPeriod === '2_years') endDate.setFullYear(today.getFullYear() + 2);
      else if (forecastPeriod === '5_years') endDate.setFullYear(today.getFullYear() + 5);
      else if (forecastPeriod === 'all_expiring') endDate = new Date('2100-01-01');
    }

    // Set endDate to end of day
    endDate.setHours(23, 59, 59, 999);

    return assets
      .filter(asset => {
        if (!asset.eolDate) return false;
        return asset.eolDate >= startDate && asset.eolDate <= endDate;
      })
      .sort((a, b) => a.eolDate - b.eolDate);
  }, [assets, forecastPeriod, customStartDate, customEndDate]);

  // KPI Calculations
  const totalReplacementBudget = expiringAssets.reduce((sum, asset) => sum + (asset.purchase_price || 0), 0);
  const assetsToReplaceCount = expiringAssets.length;
  const criticalReplacementsCount = expiringAssets.filter(asset => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return asset.eolDate <= thirtyDaysFromNow;
  }).length;

  // Analytical Data: Budget by Category
  const budgetByCategory = useMemo(() => {
    const summary = expiringAssets.reduce((acc, asset) => {
      const cat = asset.category || 'Other';
      acc[cat] = (acc[cat] || 0) + (asset.purchase_price || 0);
      return acc;
    }, {});

    return Object.entries(summary)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expiringAssets]);

  // Analytical Data: Monthly/Yearly Burn Rate
  const burnRateData = useMemo(() => {
    if (expiringAssets.length === 0) return [];

    // Determine if we should group by Year (range > 24 months)
    const firstDate = expiringAssets[0].eolDate;
    const lastDate = expiringAssets[expiringAssets.length - 1].eolDate;
    const diffMonths = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + (lastDate.getMonth() - firstDate.getMonth());
    const useYearlyGrouping = diffMonths > 24;

    const summary = expiringAssets.reduce((acc, asset) => {
      if (!asset.eolDate) return acc;
      const key = useYearlyGrouping 
        ? asset.eolDate.getFullYear().toString()
        : asset.eolDate.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      acc[key] = (acc[key] || 0) + (asset.purchase_price || 0);
      return acc;
    }, {});

    return Object.entries(summary).map(([label, budget]) => ({ label, budget }));
  }, [expiringAssets]);

  // Export to CSV
  const handleExportCSV = () => {
    if (expiringAssets.length === 0) {
      addNotification('No data to export', 'warning');
      return;
    }

    exportToProfessionalCSV({
      data: expiringAssets,
      reportTitle: 'Lifecycle & Budget Forecast',
      appliedFilters: {
        ForecastPeriod: forecastPeriod,
        StartDate: forecastPeriod === 'custom' ? customStartDate : 'N/A',
        EndDate: forecastPeriod === 'custom' ? customEndDate : 'N/A',
      },
      fileNamePrefix: `lifecycle_forecast_${forecastPeriod}`,
      columns: [
        { key: 'asset_tag', label: 'Asset Tag' },
        { key: 'product_name', label: 'Product Name' },
        { key: 'category', label: 'Category' },
        { key: 'eolDate', label: 'EOL Date', value: (asset) => asset.eolDate?.toISOString().split('T')[0] || '' },
        { key: 'purchase_price', label: 'Replacement Cost (RM)', value: (asset) => asset.purchase_price?.toFixed(2) || '0.00' },
      ],
    });

    addNotification('Forecast exported successfully', 'success');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lifecycle & Budget Forecast</h1>
          <p className="text-muted-foreground">Replacement planning and financial projections based on asset EOL.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {forecastPeriod === 'custom' && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-background border border-input rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
              <span className="text-muted-foreground text-xs uppercase font-bold">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-background border border-input rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          )}
          <select
            value={forecastPeriod}
            onChange={(e) => setForecastPeriod(e.target.value)}
            className="bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="3_months">Next 3 Months</option>
            <option value="6_months">Next 6 Months</option>
            <option value="12_months">Next 12 Months</option>
            <option value="1_year">Next 1 Year</option>
            <option value="2_years">Next 2 Years</option>
            <option value="5_years">Next 5 Years</option>
            <option value="all_expiring">All Expiring Assets</option>
            <option value="custom">Custom Range</option>
          </select>
          <Button variant="outline" iconName="Download" onClick={handleExportCSV}>
            Export Forecast (CSV)
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Total Replacement Budget"
          value={formatCurrency(totalReplacementBudget)}
          subtitle={forecastPeriod === 'custom' ? `From ${customStartDate} to ${customEndDate}` : `Forecast for ${forecastPeriod.replace('_', ' ')}`}
          icon="TrendingUp"
          color="primary"
        />
        <KPICard
          title="Assets to Replace"
          value={assetsToReplaceCount}
          subtitle="Total units reaching EOL"
          icon="Package"
          color="warning"
        />
        <KPICard
          title="Critical Replacements"
          value={criticalReplacementsCount}
          subtitle="EOL passed or within 30 days"
          icon="AlertCircle"
          color="error"
        />
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget by Category */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Icon name="PieChart" size={20} className="text-primary" />
            <h3 className="font-semibold text-foreground">Budget by Category</h3>
          </div>
          <div className="space-y-4">
            {budgetByCategory.length > 0 ? (
              budgetByCategory.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground">{formatCurrency(item.value)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${totalReplacementBudget > 0 ? (item.value / totalReplacementBudget) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No category data for this period.</p>
            )}
          </div>
        </div>

        {/* Forecasted Burn Rate */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Icon name="TrendingUp" size={20} className="text-primary" />
            <h3 className="font-semibold text-foreground">
              {burnRateData.length > 0 && burnRateData[0].label.length === 4 ? 'Yearly Burn Rate' : 'Monthly Burn Rate'}
            </h3>
          </div>
          <div className="space-y-4">
            {burnRateData.length > 0 ? (
              burnRateData.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm font-medium">{item.label}</span>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-bold text-foreground">{formatCurrency(item.budget)}</div>
                    <div className="w-24 bg-muted rounded-full h-1.5 hidden sm:block">
                      <div
                        className="bg-accent h-1.5 rounded-full"
                        style={{ width: `${(item.budget / Math.max(...burnRateData.map(m => m.budget))) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No projections available.</p>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Icon name="List" size={20} className="text-primary" />
            Detailed Expiring Assets
          </h3>
          <span className="text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground font-medium">
            {expiringAssets.length} Assets Found
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Asset Tag</th>
                <th className="px-6 py-4 font-medium">Product Name</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">EOL Date</th>
                <th className="px-6 py-4 font-medium text-right">Replacement Cost</th>
                <th className="px-6 py-4 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {expiringAssets.length > 0 ? (
                expiringAssets.map((asset) => (
                  <tr key={asset.asset_tag} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-primary">{asset.asset_tag}</td>
                    <td className="px-6 py-4">{asset.product_name}</td>
                    <td className="px-6 py-4">{asset.category}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        asset.eolDate < new Date() ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'
                      }`}>
                        {asset.eolDate.toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold">
                      {formatCurrency(asset.purchase_price)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Eye"
                        onClick={() => navigate(`/assets/${asset.asset_tag}`)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-muted-foreground">
                    No assets matching the current forecast window.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reports: Security Audit + EOL Budget Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SecurityAuditReport assets={allAssets} />
        <EOLBudgetReport assets={allAssets} />
      </div>

      <NotificationContainer
        notifications={notifications}
        onRemove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
      />
    </div>
  );
};

export default LifecycleDashboard;
