import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LoadingSpinner } from '../../components/ui/LoadingState';
import { NotificationContainer } from '../../components/ui/NotificationToast';

// Import components
import Breadcrumb from './components/Breadcrumb';
import AssetHeader from './components/AssetHeader';
import AssetTabs from './components/AssetTabs';
import DetailsTab from './components/DetailsTab';
import MaintenanceTab from './components/MaintenanceTab';
import AttachmentsTab from './components/AttachmentsTab';
import AuditTab from './components/AuditTab';
import QRCodeModal from './components/QRCodeModal';
import { supabase } from 'lib/supabaseClient';

const AssetDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showQRModal, setShowQRModal] = useState(false);

  const [asset, setAsset] = useState(null);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);

  useEffect(() => {
    const fetchAsset = async () => {
      if (!id) {
        setIsLoading(false);
        addNotification({ type: 'error', message: 'No asset Tag provided.' });
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('assets')
          .select('*, department:departments(name), supplier:suppliers(company_name), assigned_to:employees(full_name)')
          .eq('asset_tag', id)
          .single();

        if (error) throw error;
        
        if (data) {
          const formattedAsset = {
            ...data,
            location_name: data.department?.name || 'N/A',
            supplier_name: data.supplier?.company_name || 'N/A',
            assigned_to_name: data.assigned_to?.full_name || 'Unassigned',
          };
          setAsset(formattedAsset);
        } else {
          addNotification({ type: 'error', message: `Asset with Tag ${id} not found.` });
        }
      } catch (error) {
        console.error("Error fetching asset details:", error);
        addNotification({ type: 'error', message: 'Failed to fetch asset details.' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAsset();
  }, [id]);

  const addNotification = (notification) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { ...notification, id }]);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev?.filter((notification) => notification?.id !== id));
  };

  const handleEdit = () => {
    addNotification({
      type: 'info',
      message: 'Redirecting to asset edit form...'
    });
    setTimeout(() => {
      navigate('/asset-registration', { state: { editMode: true, asset } });
    }, 1000);
  };

  const handlePrintQR = () => {
    setShowQRModal(true);
  };

  const handleCheckOut = () => {
    const action = asset?.status === 'checked_out' ? 'checked in' : 'checked out';
    addNotification({
      type: 'success',
      message: `Asset ${action} successfully!`
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" className="mx-auto mb-4" />
          <p className="text-muted-foreground">Loading asset details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Breadcrumb asset={asset} />
      
      <AssetHeader
        asset={asset}
        onEdit={handleEdit}
        onPrintQR={handlePrintQR}
        onCheckOut={handleCheckOut}
      />

      <AssetTabs defaultTab="details">
        <DetailsTab tabId="details" asset={asset} />
        <MaintenanceTab tabId="maintenance" maintenanceHistory={maintenanceHistory} />
        <AttachmentsTab tabId="attachments" attachments={attachments} />
        <AuditTab tabId="audit" auditTrail={auditTrail} />
      </AssetTabs>

      <QRCodeModal
        asset={asset}
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
      />

      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
};

export default AssetDetails;