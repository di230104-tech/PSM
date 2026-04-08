import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { DashboardSkeleton } from '../components/ui/LoadingState';
import Icon from '../components/AppIcon';
import { NotificationContainer } from '../components/ui/NotificationToast';
import { format } from 'date-fns';

const AllActivities = () => {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [filterType, setFilterType] = useState('all'); // State for filtering by activity type

  const addNotification = (message, type) => {
    setNotifications(prev => [...prev, { id: Date.now(), message, type }]);
  };

  useEffect(() => {
    const fetchAllActivities = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('activities')
          .select(`
            *,
            assets ( product_name, asset_tag )
          `)
          .order('created_at', { ascending: false });

        if (filterType !== 'all') {
          query = query.eq('type', filterType);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Get user IDs from activities
        const userIds = [...new Set(data.map(a => a.user_id).filter(Boolean))];

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

        const formattedActivities = data.map(activity => ({
          id: activity.id,
          type: activity.type,
          description: activity.description,
          user: profilesMap[activity.user_id] ? (profilesMap[activity.user_id].full_name || profilesMap[activity.user_id].email) : 'Unknown User',
          timestamp: new Date(activity.created_at),
          assetId: activity.assets?.asset_tag || activity.asset_tag,
        }));
        setActivities(formattedActivities);
      } catch (error) {
        console.error('Error fetching all activities:', error);
        addNotification(`Error fetching activities: ${error.message}`, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllActivities();
  }, [filterType]); // Refetch when filterType changes

  const getActivityIcon = (type) => {
    switch (type) {
      case 'asset_added':
        return 'Plus';
      case 'asset_updated':
        return 'Edit';
      case 'asset_deleted':
        return 'Trash';
      case 'asset_assigned':
        return 'ArrowRight';
      case 'asset_image_updated':
        return 'Image';
      case 'maintenance_logged':
        return 'Wrench';
      case 'asset_checked_out':
        return 'ArrowRight';
      case 'asset_checked_in':
        return 'ArrowLeft';
      case 'asset_retired':
        return 'Archive';
      default:
        return 'Activity';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'asset_added':
        return 'text-success';
      case 'asset_updated':
        return 'text-accent';
      case 'asset_deleted':
        return 'text-destructive';
      case 'asset_assigned':
        return 'text-indigo-500';
      case 'asset_image_updated':
        return 'text-blue-500';
      case 'maintenance_logged':
        return 'text-primary';
      case 'asset_checked_out':
        return 'text-warning';
      case 'asset_checked_in':
        return 'text-success';
      case 'asset_retired':
        return 'text-muted-foreground';
      default:
        return 'text-foreground';
    }
  };

  const activityTypes = [
    { value: 'all', label: 'All Activities' },
    { value: 'asset_added', label: 'Asset Added' },
    { value: 'asset_updated', label: 'Asset Updated' },
    { value: 'asset_deleted', label: 'Asset Deleted' },
    { value: 'asset_assigned', label: 'Asset Assigned' },
    { value: 'asset_image_updated', label: 'Image Updated' },
    { value: 'maintenance_logged', label: 'Maintenance Logged' },
    { value: 'asset_checked_out', label: 'Asset Checked Out' },
    { value: 'asset_checked_in', label: 'Asset Checked In' },
    { value: 'asset_retired', label: 'Asset Retired' },
  ];


  if (isLoading) {
    return (
      <div className="p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">All Activities</h1>
      <p className="text-muted-foreground">Comprehensive log of all system actions.</p>

      {/* Filter by Type */}
      <div className="flex items-center gap-2">
        <label htmlFor="activityTypeFilter" className="text-sm font-medium text-muted-foreground">Filter by Type:</label>
        <select
          id="activityTypeFilter"
          className="px-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          {activityTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        {activities.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Icon name="SearchX" size={48} className="mx-auto mb-4 opacity-20" />
            <p>No activities found matching your criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-4 hover:bg-muted/50 transition-colors">
                <div className={`p-2 rounded-full bg-muted ${getActivityColor(activity.type)}`}>
                  <Icon name={getActivityIcon(activity.type)} size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{activity.description}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-muted-foreground">by {activity.user}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{format(activity.timestamp, 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                  {activity.assetId && (
                    <p className="text-xs text-accent mt-1">Asset ID: {activity.assetId}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <NotificationContainer notifications={notifications} onRemove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />
    </div>
  );
};

export default AllActivities;
