import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase } from '../../lib/supabaseClient'; // 1. Import Supabase
import { NotificationContainer } from '../../components/ui/NotificationToast';
import { DashboardSkeleton } from '../../components/ui/LoadingState';
import KPICard from './components/KPICard';
import AssetStatusChart from './components/AssetStatusChart';
import AssetCategoryChart from './components/AssetCategoryChart';
import AssetTrendChart from './components/AssetTrendChart';
import RecentActivityFeed from './components/RecentActivityFeed';
import QuickActions from './components/QuickActions';
import GlobalSearchBar from './components/GlobalSearchBar';
import Button from '../../components/ui/Button';

import { formatAssetStatus } from '../../utils/formatters';

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  
  // 2. New State for Real Data
  const [realStats, setRealStats] = useState({
      totalAssets: 0,
      inUseCount: 0,
      inStorageCount: 0,
      expiringCount: 0,
      assetsByStatus: [],
      assetsByCategory: [],
      recentAssets: []
  });

  const navigate = useNavigate();
  
  const { user: authUser } = useSelector((state) => state.auth);

  const user = {
    id: authUser?.id || 'guest',
    name: authUser?.full_name || authUser?.email?.split('@')[0] || "User", // Use full_name from profile if available
    email: authUser?.email || "user@panasonic.com",
    role: authUser?.role || "it_staff",
    avatar: null,
    avatarAlt: "User Avatar"
  };

  // 3. FETCH REAL DATA FROM SUPABASE
  useEffect(() => {
    const fetchDashboardData = async () => {
        try {
            // Fetch all assets
            const { data: assets, error } = await supabase
                .from('assets')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // --- CALCULATIONS ---
            const totalAssets = assets.length;
            const inUseCount = assets.filter(a => a.status === 'In Use').length;
            const inStorageCount = assets.filter(a => a.status === 'Available').length;
            
            // Dummy logic for "Expiring Soon" (since we might not have warranty dates set perfectly yet)
            // In a real scenario, compare 'warranty_months' + 'purchase_date' vs Today
            const expiringCount = 0; 

            // Group for Status Chart
            const statusMap = assets.reduce((acc, curr) => {
                acc[curr.status] = (acc[curr.status] || 0) + 1;
                return acc;
            }, {});
            const assetsByStatus = Object.keys(statusMap).map(key => ({ 
                name: formatAssetStatus(key), 
                value: statusMap[key],
                total: totalAssets // Keep your component's expected format
            }));

            // Group for Category Chart
            const categoryMap = assets.reduce((acc, curr) => {
                acc[curr.category] = (acc[curr.category] || 0) + 1;
                return acc;
            }, {});
            const assetsByCategory = Object.keys(categoryMap).map(key => ({ 
                category: key, 
                count: categoryMap[key] 
            }));

            // --- Generate Trend Data for the Last 6 Months ---
            const trendData = ((assets) => {
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const today = new Date();
                const monthlyCounts = new Map();

                // Initialize the map with the last 6 months
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                    const monthKey = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
                    monthlyCounts.set(monthKey, 0);
                }

                // Populate the map with asset counts
                assets.forEach(asset => {
                    const assetDate = new Date(asset.created_at);
                    // Check if the asset's creation date is within the last 6 months
                    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
                    if (assetDate >= sixMonthsAgo) {
                        const monthKey = `${monthNames[assetDate.getMonth()]} ${assetDate.getFullYear()}`;
                        if (monthlyCounts.has(monthKey)) {
                            monthlyCounts.set(monthKey, monthlyCounts.get(monthKey) + 1);
                        }
                    }
                });

                // Convert map to array for the chart
                return Array.from(monthlyCounts, ([month, count]) => ({ month, count }));
            })(assets);

            // Fetch recent activities
            const { data: activitiesData, error: activitiesError } = await supabase
              .from('activities')
              .select(`
                *,
                assets ( product_name, asset_tag )
              `)
              .order('created_at', { ascending: false })
              .limit(5);

            if (activitiesError) throw activitiesError;

            // Get user IDs from activities
            const userIds = [...new Set(activitiesData.map(a => a.user_id).filter(Boolean))];

            // Fetch profiles for the user IDs
            const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('id, full_name, email')
              .in('id', userIds);
            
            if (profilesError) throw profilesError;

            const profilesMap = profilesData.reduce((acc, profile) => {
              acc[profile.id] = profile;
              return acc;
            }, {});

            // Map Recent Activity
            const recentActivities = activitiesData.map(activity => ({
              id: activity.id,
              type: activity.type,
              description: activity.description,
              user: profilesMap[activity.user_id] ? (profilesMap[activity.user_id].full_name || profilesMap[activity.user_id].email) : 'Unknown User',
              timestamp: new Date(activity.created_at),
              assetId: activity.assets?.asset_tag || activity.asset_tag,
            }));
            setRealStats({
                totalAssets,
                inUseCount,
                inStorageCount,
                expiringCount,
                assetsByStatus,
                assetsByCategory,
                recentAssets: recentActivities,
                trendData,
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            // Optionally set a notification error here
        } finally {
            setIsLoading(false);
        }
    };

    fetchDashboardData();
  }, []);


  // 4. MAP REAL DATA TO YOUR UI PROPS

  // Replaced Mock KPI Data with Real Stats
  const kpiData = [
    {
      title: "Total Assets",
      value: realStats.totalAssets.toLocaleString(),
      subtitle: "Active inventory",
      icon: "Package",
      trend: "up", // Logic for trends requires historical data, keeping static for now
      trendValue: "+0%",
      color: "primary"
    },
    {
      title: "Asset In Use",
      value: realStats.inUseCount.toLocaleString(),
      subtitle: "Currently deployed",
      icon: "CheckCircle",
      trend: "up",
      trendValue: "+0%",
      color: "success"
    },
    {
      title: "In Storage",
      value: realStats.inStorageCount.toLocaleString(),
      subtitle: "In storage and ready for deployment",
      icon: "Archive",
      trend: "down",
      trendValue: "-0%",
      color: "warning"
    },
    {
      title: "Expiring Soon",
      value: realStats.expiringCount.toLocaleString(),
      subtitle: "Within 90 days",
      icon: "AlertTriangle",
      trend: "up",
      trendValue: "+0%",
      color: "error"
    }
  ];

  const handleSearch = (query) => {
    navigate(`/search-results?q=${encodeURIComponent(query)}`);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev?.filter((notification) => notification?.id !== id));
  };

  const handleAddAsset = () => navigate('/asset-registration');
  const handleBulkImport = () => navigate('/asset-registration?mode=bulk');

  if (isLoading) {
    return (
      <div className="p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Asset Management Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage your IT assets efficiently</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" iconName="Upload" onClick={handleBulkImport}>
            Bulk Import
          </Button>
          <Button variant="default" iconName="Plus" onClick={handleAddAsset}>
            Add Asset
          </Button>
        </div>
      </div>

      <div className="flex justify-center">
        <GlobalSearchBar onSearch={handleSearch} />
      </div>

      {/* KPI Cards using Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData?.map((kpi, index) =>
          <KPICard key={index} {...kpi} />
        )}
      </div>

      {/* Charts using Real Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AssetStatusChart data={realStats.assetsByStatus} />
        <AssetCategoryChart data={realStats.assetsByCategory} />
        <AssetTrendChart data={realStats.trendData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Recent Activity using Real Data */}
          <RecentActivityFeed activities={realStats.recentAssets} />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
      
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification} 
      />
    </div>
  );
};

export default Dashboard;