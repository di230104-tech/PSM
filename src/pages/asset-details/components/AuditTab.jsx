import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import SafeHTMLViewer from '../../../components/ui/SafeHTMLViewer';

const AuditTab = ({ auditTrail }) => {
  const [filter, setFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action) => {
    switch (action?.toLowerCase()) {
      case 'created':
        return 'Plus';
      case 'updated':
        return 'Edit';
      case 'deleted':
        return 'Trash2';
      case 'assigned':
        return 'UserPlus';
      case 'unassigned':
        return 'UserMinus';
      case 'checked out':
        return 'LogOut';
      case 'checked in':
        return 'LogIn';
      case 'maintenance':
        return 'Wrench';
      case 'status changed':
        return 'RefreshCw';
      default:
        return 'Activity';
    }
  };

  const getActionColor = (action) => {
    switch (action?.toLowerCase()) {
      case 'created':
        return 'text-success';
      case 'updated':
        return 'text-accent';
      case 'deleted':
        return 'text-error';
      case 'assigned': case'checked out':
        return 'text-warning';
      case 'unassigned': case'checked in':
        return 'text-success';
      case 'maintenance':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  const filteredAuditTrail = auditTrail?.filter(entry => filter === 'all' || entry?.action?.toLowerCase()?.includes(filter))?.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const actionTypes = ['all', 'created', 'updated', 'assigned', 'maintenance', 'status changed'];

  return (
    <div tabId="audit">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Audit Trail</h3>
          <p className="text-sm text-muted-foreground">
            Complete history of all changes and activities for this asset
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          {/* Filter Dropdown */}
          <select
            value={filter}
            onChange={(e) => setFilter(e?.target?.value)}
            className="px-3 py-2 border border-border rounded-md text-sm bg-background text-foreground"
          >
            {actionTypes?.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Actions' : type?.charAt(0)?.toUpperCase() + type?.slice(1)}
              </option>
            ))}
          </select>
          
          {/* Sort Order */}
          <Button
            variant="outline"
            size="sm"
            iconName={sortOrder === 'desc' ? 'ArrowDown' : 'ArrowUp'}
            iconPosition="left"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          >
            {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
          </Button>
        </div>
      </div>
      {/* Audit Trail Timeline */}
      <div className="space-y-4">
        {filteredAuditTrail?.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="History" size={48} className="mx-auto text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">No Audit Records</h4>
            <p className="text-muted-foreground">
              {filter === 'all' ?'No activity has been recorded for this asset yet.'
                : `No ${filter} activities found for this asset.`
              }
            </p>
          </div>
        ) : (
          filteredAuditTrail?.map((entry, index) => (
            <div key={entry?.id} className="relative">
              {/* Timeline Line */}
              {index !== filteredAuditTrail?.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-full bg-border" />
              )}
              
              {/* Audit Entry */}
              <div className="flex space-x-4">
                {/* Timeline Icon */}
                <div className="flex-shrink-0 w-12 h-12 bg-card border-2 border-border rounded-full flex items-center justify-center">
                  <Icon 
                    name={getActionIcon(entry?.action)} 
                    size={20} 
                    className={getActionColor(entry?.action)}
                  />
                </div>
                
                {/* Entry Content */}
                <div className="flex-1 bg-card border border-border rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-foreground mb-1">
                        {entry?.action}
                      </h4>
                      <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                        <span>{formatDate(entry?.timestamp)}</span>
                        <span>•</span>
                        <span>by {entry?.user}</span>
                        {entry?.userRole && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{entry?.userRole}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {entry?.ipAddress && (
                      <div className="text-xs text-muted-foreground font-mono mt-2 sm:mt-0">
                        IP: {entry?.ipAddress}
                      </div>
                    )}
                  </div>
                  
                  <SafeHTMLViewer htmlContent={entry?.description} />
                  
                  {/* Changes Details */}
                  {entry?.changes && entry?.changes?.length > 0 && (
                    <div className="border-t border-border pt-3">
                      <h5 className="text-sm font-medium text-foreground mb-2">Changes Made:</h5>
                      <div className="space-y-2">
                        {entry?.changes?.map((change, changeIndex) => (
                          <div key={changeIndex} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground font-medium">
                              {change?.field}:
                            </span>
                            <div className="flex items-center space-x-2">
                              {change?.oldValue && (
                                <>
                                  <span className="px-2 py-1 bg-error/10 text-error rounded text-xs">
                                    {change?.oldValue}
                                  </span>
                                  <Icon name="ArrowRight" size={12} className="text-muted-foreground" />
                                </>
                              )}
                              <span className="px-2 py-1 bg-success/10 text-success rounded text-xs">
                                {change?.newValue}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Additional Metadata */}
                  {(entry?.sessionId || entry?.deviceInfo) && (
                    <div className="border-t border-border pt-3 mt-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                        {entry?.sessionId && (
                          <div>
                            <span className="font-medium">Session ID:</span>
                            <span className="ml-1 font-mono">{entry?.sessionId}</span>
                          </div>
                        )}
                        {entry?.deviceInfo && (
                          <div>
                            <span className="font-medium">Device:</span>
                            <span className="ml-1">{entry?.deviceInfo}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Export Options */}
      {filteredAuditTrail?.length > 0 && (
        <div className="flex justify-center mt-8 pt-6 border-t border-border">
          <Button
            variant="outline"
            iconName="Download"
            iconPosition="left"
            onClick={() => console.log('Export audit trail')}
          >
            Export Audit Trail
          </Button>
        </div>
      )}
    </div>
  );
};

export default AuditTab;