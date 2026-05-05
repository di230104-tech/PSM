import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
import RefurbishModal from '../../components/RefurbishModal';
import AssignAssetModal from './components/AssignAssetModal';
import ReturnAssetModal from '../checkout-management/components/CheckInModal'; // Reusing CheckInModal as ReturnAssetModal
import { calculateEOLDate, getEOLStatus } from '../../utils/assetUtils';
import { useSelector } from 'react-redux';
import { logActivity } from '../../utils/activityLogger';

const AssetDetails = () => {
  const { asset_tag } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State Management
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'details');
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showWriteOffModal, setShowWriteOffModal] = useState(false);
  const [showRefurbishModal, setShowRefurbishModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Data Payloads
  const [assetData, setAssetData] = useState(null);
  const [activeLoan, setActiveLoan] = useState(null);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [maintenanceData, setMaintenanceData] = useState([]);
  const [attachmentsData, setAttachmentsData] = useState([]);
  const [auditData, setAuditData] = useState([]);

  const { user } = useSelector((state) => state.auth);
  const userId = user?.id;

  // Fetch all required data for the asset
  const fetchAllData = async () => {
    if (!asset_tag) return;

    setIsLoading(true);
    try {
      // 1. Fetch main asset record with supplier and location info
      const { data: asset, error: assetError } = await supabase
        .from('assets')
        .select('*, suppliers(company_name), locations(name)')
        .eq('asset_tag', asset_tag)
        .single();

      if (assetError) throw assetError;

      // 2. Fetch Assignment History (All Loans)
      const { data: allLoans, error: historyError } = await supabase
        .from('loans')
        .select('*, employees(full_name, email, departments(name)), departments(name)')
        .eq('asset_tag', asset_tag)
        .order('checkout_date', { ascending: false });

      if (historyError) throw historyError;

      // Detect active loan (Unreturned assignment)
      const active = allLoans?.find(l => !l.actual_return_date);

      if (asset) {
        if (active) {
          setActiveLoan({
            id: active.id,
            assetId: asset.asset_tag,
            assetName: asset.product_name,
            assetCategory: asset.category,
            checkoutDate: active.checkout_date,
            expectedReturnDate: active.expected_return_date,
            employee: active.employees ? {
              full_name: active.employees.full_name,
              department: active.employees.departments?.name
            } : null,
            assignedTo: active.departments ? {
              name: active.departments.name,
              department: active.departments.name
            } : null
          });
        } else {
          setActiveLoan(null);
        }

        setAssignmentHistory(allLoans || []);

        // Flatten/Format data for easier use in components
        const formattedAsset = {
          ...asset,
          supplier_name: asset.suppliers?.company_name || 'N/A',
          assigned_to_name: active?.employees?.full_name || (active?.departments?.name ? `Dept: ${active.departments.name}` : 'Unassigned'),
          assigned_to_email: active?.employees?.email || 'N/A',
          location_name: asset.locations?.name || 'Unassigned'
        };
        setAssetData(formattedAsset);

        // 3. Fetch Activities for Audit Trail
        const { data: activities, error: auditError } = await supabase
          .from('activities')
          .select('*')
          .eq('asset_tag', asset_tag)
          .order('created_at', { ascending: false });

        if (!auditError) {
          const formattedAudit = activities.map(act => ({
            id: act.id,
            action: act.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            timestamp: act.created_at,
            user: 'System User', // Fallback as join is removed
            userRole: '',
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

        // 4. Fetch Attachments from DB
        const { data: attachments, error: attachError } = await supabase
          .from('asset_attachments')
          .select('*')
          .eq('asset_tag', asset_tag)
          .order('created_at', { ascending: false });

        if (!attachError) {
          setAttachmentsData(attachments);
        } else {
          console.error('Error fetching attachments:', attachError);
        }
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

  useEffect(() => {
    fetchAllData();
  }, [asset_tag]);

  const handleMaintenanceSuccess = (message) => {
    addNotification(message, 'success');
    fetchAllData();
  };

  const addNotification = (message, type = 'info') => {
    setNotifications(prev => [...prev, { id: Date.now(), message, type }]);
  };

  const handleEdit = () => {
    navigate(`/asset-registration?tag=${assetData.asset_tag}`);
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
    
    // Explicit Rule: Active assets cannot be written off
    if (assetData.status === 'In Use') return true;
    
    // Existing Rule: status === 'Broken' OR EOL passed
    const isBroken = assetData.status === 'Broken';
    const eolDate = calculateEOLDate(assetData.purchase_date, assetData.lifespan_months || (assetData.lifespan_years * 12));
    const eolStatus = getEOLStatus(eolDate);
    const isExpired = eolStatus.status === 'Expired';
    
    return !(isBroken || isExpired);
  };

  const canBeRefurbished = () => {
    if (!assetData) return false;
    const isBroken = assetData.status === 'Broken';
    const isWrittenOff = assetData.status === 'Written Off';
    const eolDate = calculateEOLDate(assetData.purchase_date, assetData.lifespan_months || (assetData.lifespan_years * 12));
    const eolStatus = getEOLStatus(eolDate);
    const isExpired = eolStatus.status === 'Expired';
    
    return isBroken || isWrittenOff || isExpired;
  };

  const getWriteOffTooltip = () => {
    if (!assetData) return '';
    if (assetData.status === 'In Use') return 'Asset must be returned before write-off';
    if (!isWriteOffDisabled()) return 'Decommission this asset from inventory';
    return 'Only broken or expired (EOL) assets can be written off';
  };

  const handleStatusAction = async (e) => {
    const isInUse = ['In Use', 'overdue'].includes(assetData?.status);
    console.log("Status action triggered. Current status:", assetData?.status, "Is in use:", isInUse);
    
    if (isInUse) {
      if (!activeLoan) {
        console.warn("Ghost state detected! Auto-healing asset...");
        addNotification("Fixing ghost data mismatch...", "info");

        try {
          const { error } = await supabase
            .from('assets')
            .update({ status: 'Available' }) // Force back to Available
            .eq('asset_tag', assetData.asset_tag);

          if (error) throw error;

          addNotification("Asset auto-fixed and is now Available!", "success");
          fetchAllData(); // Refresh the page data
        } catch (error) {
          console.error("Failed to auto-heal:", error);
          addNotification(`Failed to fix asset status: ${error.message}`, "error");
        }
        return; // Stop execution so the modal doesn't open
      }
      
      console.log("Opening Return Modal. activeLoan is:", activeLoan);
      setShowReturnModal(true);
    } else {
      console.log("Opening Assign Modal");
      setShowAssignModal(true);
    }
  };

  const handleReturnSuccess = async (loanId, condition, notes) => {
    try {
      const { error: loanError } = await supabase
        .from('loans')
        .update({
          status: 'returned',
          actual_return_date: new Date().toISOString(),
          notes: notes,
        })
        .eq('id', loanId);

      if (loanError) throw loanError;

      // 1. Strictly map the condition to the approved status
      let safeStatus = 'Available'; 
      if (condition === 'Damaged') {
        safeStatus = 'In Repair';
      } else if (condition === 'Broken') {
        safeStatus = 'Broken';
      } else if (condition === 'Good') {
        safeStatus = 'Available';
      }

      console.log("SENDING TO SUPABASE -> Status:", safeStatus);

      // 2. Execute the Supabase update using the mapped status
      const { error: assetError } = await supabase
        .from('assets')
        .update({ 
          status: safeStatus,  // CRITICAL: Use safeStatus, NOT the raw condition
          condition: condition,      // Update condition column as well
          current_department_id: null 
        })
        .eq('asset_tag', assetData.asset_tag);

      if (assetError) throw assetError;

      // Log activity
      await logActivity(
        'asset_returned',
        `Asset ${assetData.product_name} (${assetData.asset_tag}) returned with condition: ${condition}`,
        assetData.asset_tag,
        userId,
        { condition: condition, notes: notes, status: safeStatus }
      );

      addNotification('Asset successfully returned', 'success');
      setShowReturnModal(false);
      fetchAllData();
    } catch (error) {
      console.error('Return error:', error);
      addNotification(`Failed to return asset: ${error.message}`, 'error');
      throw error; // Re-throw so the modal can handle it
    }
  };

  const handleRefurbishSuccess = (message) => {
    addNotification(message, 'success');
    fetchAllData();
  };

  const handleRefurbish = async () => {
    const confirmRevive = window.confirm("Are you sure you want to mark this broken asset as fully repaired and Available?");
    if (!confirmRevive) return;

    addNotification('Reviving asset...', 'info');
    try {
      const { error } = await supabase
        .from('assets')
        .update({ status: 'Available' })
        .eq('asset_tag', assetData.asset_tag);

      if (error) throw error;

      await logActivity(
        'asset_refurbished',
        `Asset ${assetData.product_name} (${assetData.asset_tag}) refurbished and set to Available`,
        assetData.asset_tag,
        userId,
        {}
      );

      addNotification('Asset successfully refurbished and is now Available!', 'success');
      fetchAllData();
    } catch (error) {
      console.error('Failed to revive asset:', error);
      addNotification('Failed to refurbish the asset.', 'error');
    }
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
    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="px-1">
        <Breadcrumb asset={assetData} />
      </div>

      {/* Asset Title Row / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
            <Icon name="Package" size={32} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{assetData.product_name}</h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                assetData.status === 'Available' ? 'bg-green-50 text-green-700 border-green-200' :
                assetData.status === 'In Use' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                'bg-gray-50 text-gray-600 border-gray-200'
              }`}>
                {assetData.status?.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-gray-500 mt-1 font-medium flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-gray-400">Asset Tag:</span>
              <span className="font-mono text-gray-700">{assetData.asset_tag}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" iconName="Printer" onClick={handlePrintQR} className="rounded-lg">Print QR</Button>
          <Button variant="outline" iconName="Edit" onClick={handleEdit} className="rounded-lg">Edit Asset</Button>
          
          {assetData?.status === 'Broken' && (
            <Button
              variant="outline"
              className="border-amber-200 text-amber-700 hover:bg-amber-50 rounded-lg"
              iconName="Wrench"
              onClick={handleRefurbish}
            >
              Refurbish
            </Button>
          )}
          <Button 
            variant="outline" 
            className={`border-red-200 text-red-600 hover:bg-red-50 rounded-lg ${isWriteOffDisabled() ? 'opacity-50 cursor-not-allowed' : ''}`}
            iconName="Trash2" 
            onClick={() => !isWriteOffDisabled() && setShowWriteOffModal(true)}
            title={getWriteOffTooltip()}
          >
            Write Off
          </Button>

          {assetData?.status === 'Available' ? (
            <Button
              variant="primary"
              iconName="UserPlus"
              onClick={() => setShowAssignModal(true)}
              className="rounded-lg shadow-lg shadow-blue-500/20"
            >
              Assign Asset
            </Button>
          ) : assetData?.status === 'In Use' ? (
            <Button
              variant="default"
              iconName="UserMinus"
              onClick={() => setShowReturnModal(true)}
              className="rounded-lg"
            >
              Return Asset
            </Button>
          ) : null}
        </div>
      </div>

      {/* Tabbed Interface */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Tab Navigation Bar */}
        <div className="border-b border-gray-100 bg-gray-50/50">
          <nav className="flex overflow-x-auto no-scrollbar">
            {[
              { id: 'details', label: 'Overview', icon: 'Info' },
              { id: 'maintenance', label: 'Maintenance', icon: 'Wrench' },
              { id: 'attachments', label: 'Attachments', icon: 'Paperclip' },
              { id: 'audit', label: 'History', icon: 'History' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-8 py-5 text-sm font-bold border-b-2 transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'border-blue-600 text-blue-600 bg-white' 
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                }`}
              >
                <Icon name={tab.icon} size={18} className={activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content Area */}
        <div className="p-0">
          <div className="p-6 md:p-8">
            {activeTab === 'details' && <DetailsTab asset={assetData} assignmentHistory={assignmentHistory} maintenanceHistory={maintenanceData} />}
            {activeTab === 'maintenance' && (
              <MaintenanceTab 
                assetTag={asset_tag} 
                maintenanceHistory={maintenanceData} 
                onSuccess={handleMaintenanceSuccess} 
              />
            )}
            {activeTab === 'attachments' && (
              <AttachmentsTab 
                assetTag={asset_tag}
                attachments={attachmentsData} 
                onSuccess={() => handleMaintenanceSuccess('Attachments updated successfully')}
              />
            )}
            {activeTab === 'audit' && <AuditTab auditTrail={auditData} />}
          </div>
        </div>
      </div>

      {/* Modals & Notifications */}
      {showQRModal && (
        <QRCodeModal
          asset={assetData}
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

      {showRefurbishModal && (
        <RefurbishModal
          asset={assetData}
          isOpen={showRefurbishModal}
          onClose={() => setShowRefurbishModal(false)}
          onSuccess={handleRefurbishSuccess}
        />
      )}

      {showAssignModal && (
        <AssignAssetModal
          asset={assetData}
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          onSuccess={(msg) => {
            addNotification(msg, 'success');
            fetchAllData();
          }}
        />
      )}

      {showReturnModal && activeLoan && (
        <ReturnAssetModal
          loan={activeLoan}
          onCheckIn={handleReturnSuccess}
          onClose={() => setShowReturnModal(false)}
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

