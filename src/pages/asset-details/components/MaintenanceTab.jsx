import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import AddMaintenanceModal from './AddMaintenanceModal';

/**
 * Maintenance History Tab Component
 * Displays a timeline of maintenance activities for a specific asset.
 * 
 * @param {Object} props
 * @param {string} props.assetTag - The tag of the asset
 * @param {Array} props.maintenanceHistory - List of maintenance records from DB
 * @param {Function} props.onSuccess - Callback to refresh data after adding a record
 */
const MaintenanceTab = ({ assetTag, maintenanceHistory, onSuccess }) => {
  const [showAddModal, setShowAddModal] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    })?.format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString)?.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getMaintenanceTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'repair':
        return 'bg-error/10 text-error border-error/20';
      case 'routine service':
        return 'bg-success/10 text-success border-success/20';
      case 'hardware upgrade':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'software patch':
        return 'bg-info/10 text-info border-info/20';
      default:
        return 'bg-accent/10 text-accent border-accent/20';
    }
  };

  const totalMaintenanceCost = maintenanceHistory?.reduce((sum, record) => sum + (parseFloat(record?.cost) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Maintenance History</h3>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Icon name="ClipboardList" size={14} />
              Total Records: {maintenanceHistory?.length || 0}
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="DollarSign" size={14} />
              Total Investment: {formatCurrency(totalMaintenanceCost)}
            </span>
          </div>
        </div>
        <Button
          variant="primary"
          iconName="Plus"
          iconPosition="left"
          onClick={() => setShowAddModal(true)}
          className="mt-4 sm:mt-0"
        >
          Log Maintenance
        </Button>
      </div>

      {/* Maintenance Timeline */}
      <div className="space-y-4">
        {!maintenanceHistory || maintenanceHistory.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="Wrench" size={32} className="text-muted-foreground" />
            </div>
            <h4 className="text-lg font-medium text-foreground mb-2">No Maintenance Records</h4>
            <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
              This asset has no maintenance history recorded yet. Start tracking repairs and upgrades today.
            </p>
            <Button
              variant="outline"
              iconName="Plus"
              iconPosition="left"
              onClick={() => setShowAddModal(true)}
            >
              Add First Record
            </Button>
          </div>
        ) : (
          maintenanceHistory?.map((record, index) => (
            <div key={record?.id} className="relative">
              {/* Timeline Line */}
              {index !== maintenanceHistory?.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-full bg-border" />
              )}
              
              {/* Maintenance Record Card */}
              <div className="flex space-x-4">
                {/* Timeline Dot */}
                <div className="flex-shrink-0 w-12 h-12 bg-card border-2 border-primary rounded-full flex items-center justify-center relative z-10 shadow-sm">
                  <Icon 
                    name={record?.type === 'Repair' ? 'AlertTriangle' : 'Wrench'} 
                    size={20} 
                    className="text-primary" 
                  />
                </div>
                
                {/* Record Content */}
                <div className="flex-1 bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-foreground mb-1">{record?.title || `${record?.type} - ${record?.vendor}`}</h4>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Icon name="Calendar" size={14} />
                          {formatDate(record?.maintenance_date)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getMaintenanceTypeColor(record?.type)}`}>
                          {record?.type || 'Standard'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right mt-2 sm:mt-0">
                      <div className="text-lg font-bold text-foreground">
                        {formatCurrency(record?.cost)}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center justify-end gap-1.5">
                        <Icon name="User" size={14} />
                        by {record?.vendor || record?.performed_by || 'Unknown'}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded border border-border/50">
                    {record?.description || 'No description provided.'}
                  </p>
                  
                  {/* Additional info could go here, like parts replaced if we add that later */}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Maintenance Form Modal */}
      <AddMaintenanceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        assetTag={assetTag}
        onSuccess={onSuccess}
      />
    </div>
  );
};

export default MaintenanceTab;
