import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { LoadingSpinner } from '../../components/ui/LoadingState';
import { NotificationContainer } from '../../components/ui/NotificationToast';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

// Import sub-components
import Breadcrumb from './components/Breadcrumb';
import DetailsTab from './components/DetailsTab';
import MaintenanceTab from './components/MaintenanceTab';
import AttachmentsTab from './components/AttachmentsTab';
import AuditTab from './components/AuditTab';
import QRCodeModal from './components/QRCodeModal';
import WriteOffModal from '../../components/WriteOffModal';
import { calculateEOLDate, getEOLStatus } from '../../utils/assetUtils';

const AssetDetails = () => {
  const { asset_tag } = useParams();
  const navigate = useNavigate();

  // State Management
  const [activeTab, setActiveTab] = useState('details');
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showWriteOffModal, setShowWriteOffModal] = useState(false);

  // Data Payloads
  const [assetData, setAssetData] = useState(null);
  const [maintenanceData, setMaintenanceData] = useState([]);
  const [attachmentsData, setAttachmentsData] = useState([]);
  const [auditData, setAuditData] = useState([]);

  // Fetch all required data for the asset
  useEffect(() => {
    const fetchAllData = async () => {
      if (!asset_tag) return;

      setIsLoading(true);
      try {
        // 1. Fetch main asset record with supplier info
        const { data: asset, error: assetError } = await supabase
          .from('assets')
          .select('*, suppliers(company_name)')
          .eq('asset_tag', asset_tag)
          .single();

        if (assetError) throw assetError;

        // 2. Fetch Active Loan (Assignment Data)
        const { data: activeLoan } = await supabase
          .from('loans')
          .select('employees(full_name, email, departments(name)), departments(name)')
          .eq('asset_tag', asset_tag)
          .eq('status', 'active')
          .maybeSingle();

        if (asset) {
          // Flatten/Format data for easier use in components
          const formattedAsset = {
            ...asset,
            supplier_name: asset.suppliers?.company_name || 'N/A',
            assigned_to_name: activeLoan?.employees?.full_name || (activeLoan?.departments?.name ? `Dept: ${activeLoan.departments.name}` : 'Unassigned'),
            assigned_to_email: activeLoan?.employees?.email || 'N/A',
            location_name: activeLoan?.employees?.departments?.name || activeLoan?.departments?.name || asset.location || 'N/A'
          };
          setAssetData(formattedAsset);

          // 3. Fetch Activities for Audit Trail
          const { data: activities, error: auditError } = await supabase
            .from('activities')
            .select('*, user:profiles(full_name, role)')
            .eq('asset_tag', asset_tag)
            .order('created_at', { ascending: false });

          if (!auditError) {
            const formattedAudit = activities.map(act => ({
              id: act.id,
              action: act.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              timestamp: act.created_at,
              user: act.user?.full_name || 'System',
              userRole: act.user?.role || '',
              description: act.description,
              details: act.details
            }));
            setAuditData(formattedAudit);
          }

          // 3. Fetch Maintenance records
          const { data: maintenance, error: maintError } = await supabase
            .from('maintenance')
            .select('*')
            .eq('asset_tag', asset_tag)
            .order('maintenance_date', { ascending: false });

          if (!maintError) {
            setMaintenanceData(maintenance);
          } else {
            console.error('Error fetching maintenance records:', maintError);
          }

          // 4. Attachments (Mocked or fetched from storage/assets table if applicable)
          setAttachmentsData([]); 
        } else {
          addNotification('Asset not found', 'error');
        }
      } catch (error) {
        console.error('Error fetching asset detail:', error);
        addNotification(`Failed to load asset: ${error.message}`, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [asset_tag]);

  const addNotification = (message, type = 'info') => {
    setNotifications(prev => [...prev, { id: Date.now(), message, type }]);
  };

  const handleEdit = () => {
    navigate('/asset-registration', { state: { editMode: true, asset: assetData } });
  };

  const handlePrintQR = () => {
    setShowQRModal(true);
  };

  const handleWriteOffSuccess = (message) => {
    // Show success notification and redirect back to list
    navigate('/asset-list', { state: { message, type: 'success' } });
  };

  const isWriteOffDisabled = () => {
    if (!assetData) return true;
    
    // Rule: status === 'broken' OR EOL passed
    const isBroken = assetData.status === 'broken';
    const eolDate = calculateEOLDate(assetData.purchase_date, assetData.lifespan_months || (assetData.lifespan_years * 12));
    const eolStatus = getEOLStatus(eolDate);
    const isExpired = eolStatus.status === 'Expired';
    
    return !(isBroken || isExpired);
  };

  const getWriteOffTooltip = () => {
    if (!assetData) return '';
    if (!isWriteOffDisabled()) return 'Decommission this asset from inventory';
    return 'Only broken or expired (EOL) assets can be written off';
  };

  const handleStatusAction = () => {
    const action = assetData?.status === 'checked_out' ? 'Check In' : 'Check Out';
    addNotification(`Redirecting to ${action} process...`, 'info');
    // For now, redirect to checkout management
    navigate('/checkout-management');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!assetData) {
    return (
      <div className="p-12 text-center">
        <Icon name="AlertCircle" size={48} className="mx-auto text-error mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Asset Not Found</h2>
        <p className="text-muted-foreground mb-6">The asset tag "{asset_tag}" does not exist in our records.</p>
        <Button onClick={() => navigate('/asset-list')}>Back to Asset List</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <Breadcrumb asset={assetData} />

      {/* Asset Title Row / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            <Icon name="Package" size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{assetData.product_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {assetData.asset_tag}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                assetData.status === 'in_storage' ? 'bg-success/10 text-success border-success/20' :
                assetData.status === 'checked_out' ? 'bg-primary/10 text-primary border-primary/20' :
                'bg-muted text-muted-foreground border-border'
              }`}>
                {assetData.status?.replace(/_/g, ' ')?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" iconName="Printer" onClick={handlePrintQR}>Print QR</Button>
          <Button variant="outline" iconName="Edit" onClick={handleEdit}>Edit Asset</Button>
          <Button 
            variant="outline" 
            className={`border-error/30 text-error hover:bg-error/10 ${isWriteOffDisabled() ? 'opacity-50 cursor-not-allowed' : ''}`}
            iconName="Trash2" 
            onClick={() => !isWriteOffDisabled() && setShowWriteOffModal(true)}
            title={getWriteOffTooltip()}
          >
            Write Off
          </Button>
          <Button 
            variant={assetData.status === 'checked_out' ? 'default' : 'primary'}
            iconName={assetData.status === 'checked_out' ? 'LogIn' : 'LogOut'}
            onClick={handleStatusAction}
          >
            {assetData.status === 'checked_out' ? 'Check In' : 'Check Out'}
          </Button>
        </div>
      </div>

      {/* Tabbed Interface */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Tab Navigation Bar */}
        <div className="border-b border-border bg-muted/30">
          <nav className="flex overflow-x-auto">
            {[
              { id: 'details', label: 'Details', icon: 'Info' },
              { id: 'maintenance', label: 'Maintenance History', icon: 'Wrench' },
              { id: 'attachments', label: 'Attachments', icon: 'Paperclip' },
              { id: 'audit', label: 'Audit Trail', icon: 'History' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'border-primary text-primary bg-background' 
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon name={tab.icon} size={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content Area */}
        <div className="p-6">
          {activeTab === 'details' && <DetailsTab asset={assetData} maintenanceHistory={maintenanceData} />}
          {activeTab === 'maintenance' && <MaintenanceTab maintenanceHistory={maintenanceData} />}
          {activeTab === 'attachments' && <AttachmentsTab attachments={attachmentsData} />}
          {activeTab === 'audit' && <AuditTab auditTrail={auditData} />}
        </div>
      </div>

      {/* Modals & Notifications */}
      {showQRModal && (
        <QRCodeModal
          asset={assetData}
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
        />
      )}

      {showWriteOffModal && (
        <WriteOffModal
          asset={assetData}
          isOpen={showWriteOffModal}
          onClose={() => setShowWriteOffModal(false)}
          onSuccess={handleWriteOffSuccess}
        />
      )}

      <NotificationContainer 
        notifications={notifications} 
        onRemove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} 
      />
    </div>
  );
};

export default AssetDetails;
