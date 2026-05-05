import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Settings, Clock, ExternalLink, Pencil, Printer, Package, Cpu, Database, HardDrive } from 'lucide-react';
import QRCode from 'react-qr-code';
import { supabase } from '../../../lib/supabaseClient';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import AppImage from '../../../components/AppImage';
import PrintableAssetLabel from '../../../components/PrintableAssetLabel';

import { formatAssetStatus } from '../../../utils/formatters';

const AssetQuickViewPanel = ({ isOpen, onClose, asset }) => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!asset?.asset_tag || !isOpen) return;

      setIsLoadingActivities(true);
      try {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .eq('asset_tag', asset.asset_tag)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setActivities(data || []);
      } catch (err) {
        console.error('Error fetching asset activities:', err);
      } finally {
        setIsLoadingActivities(false);
      }
    };

    fetchActivities();
  }, [asset?.asset_tag, isOpen]);

  if (!isOpen) return null;

  const handleViewFullDetails = () => {
    if (asset?.asset_tag) {
      navigate(`/assets/${asset.asset_tag}`);
      onClose();
    }
  };

  const handleEditAsset = () => {
    if (asset?.asset_tag) {
      navigate(`/asset-registration?tag=${asset.asset_tag}`);
      onClose();
    }
  };

  const handlePrintQR = () => {
    window.print();
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'bg-success/10 text-success border-success/20';
      case 'in use':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'in repair':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'broken':
        return 'bg-error/10 text-error border-error/20';
      case 'written off':
      case 'written_off':
        return 'bg-muted/10 text-muted-foreground border-border';
      case 'lost':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Sticker layout for physical printing - only visible during print */}
          <PrintableAssetLabel asset={asset} />

          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[100] print:hidden"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-card shadow-xl flex flex-col z-[101] border-l border-border print:hidden"
          >
            {/* Header (Sticky) */}
            <div className="sticky top-0 z-10 bg-card border-b border-border p-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Asset Details</h2>
                <p className="text-sm text-muted-foreground">Quick view</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Asset Image */}
              <div className="aspect-video bg-muted rounded-xl overflow-hidden flex items-center justify-center border border-border">
                {asset?.image_url ? (
                  <AppImage
                    src={asset.image_url}
                    alt={asset.product_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground opacity-20">
                    <Package size={48} />
                    <span className="text-xs mt-2">No image available</span>
                  </div>
                )}
              </div>

              {/* Title Block */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-bold text-lg text-foreground leading-tight">
                    {asset?.product_name || 'Unnamed Asset'}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusBadgeClass(asset?.status)}`}>
                    {formatAssetStatus(asset?.status)}
                  </span>
                </div>
                <div className="flex flex-col text-sm">
                  <button 
                    onClick={handleViewFullDetails}
                    className="text-primary font-medium hover:underline text-left mt-1"
                  >
                    {asset?.asset_tag}
                  </button>
                </div>
              </div>

              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                {[
                  { label: 'Category', value: asset?.category || '-' },
                  { label: 'Serial Number', value: asset?.serial_number || '-' },
                  { label: 'Location', value: asset?.locations?.name || '-' },
                  { label: 'Purchase Date', value: formatDate(asset?.purchase_date) },
                  { label: 'Purchase Cost', value: formatCurrency(asset?.purchase_price) },
                  { label: 'Warranty', value: asset?.warranty_months ? `${asset.warranty_months} Months` : '-' },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider">{item.label}</p>
                    <p className="font-medium text-foreground text-sm">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Current Assignment Section */}
              <div className="pt-2">
                <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
                  <User size={18} className="text-primary" />
                  Current Assignment
                </h4>
                {(() => {
                  const activeLoan = asset?.loans?.find(l => l.status === 'active');
                  const assigneeName = activeLoan?.employees?.full_name || (activeLoan?.departments?.name ? `Dept: ${activeLoan.departments.name}` : null);
                  
                  if (assigneeName) {
                    return (
                      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">{assigneeName}</p>
                          <p className="text-xs text-muted-foreground">
                            {activeLoan.employees?.departments?.name || activeLoan.departments?.name || 'No Department'}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-border/50 space-y-1">
                          {activeLoan.employees?.email && (
                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                              <span className="font-medium">Email:</span> {activeLoan.employees.email}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Assigned:</span> {formatDate(asset.last_assignment_date || asset.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="bg-muted/30 rounded-lg p-4 border border-dashed border-border text-center">
                      <p className="text-sm text-muted-foreground">Unassigned</p>
                    </div>
                  );
                })()}
              </div>

              {/* Quick Specs Section */}
              <div className="pt-2">
                <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
                  <Settings size={18} className="text-primary" />
                  Quick Specs
                </h4>
                {asset?.technical_specs && (asset.technical_specs.processor || asset.technical_specs.memory || asset.technical_specs.storage) ? (
                  <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                    <p className="text-sm text-foreground flex flex-wrap gap-x-2 gap-y-1">
                      {asset.technical_specs.processor && (
                        <span className="flex items-center gap-1">
                          <Cpu size={14} className="text-muted-foreground" />
                          {asset.technical_specs.processor}
                        </span>
                      )}
                      {(asset.technical_specs.processor && (asset.technical_specs.memory || asset.technical_specs.storage)) && <span className="text-border">•</span>}
                      {asset.technical_specs.memory && (
                        <span className="flex items-center gap-1">
                          <Database size={14} className="text-muted-foreground" />
                          {asset.technical_specs.memory}
                        </span>
                      )}
                      {(asset.technical_specs.memory && asset.technical_specs.storage) && <span className="text-border">•</span>}
                      {asset.technical_specs.storage && (
                        <span className="flex items-center gap-1">
                          <HardDrive size={14} className="text-muted-foreground" />
                          {asset.technical_specs.storage}
                        </span>
                      )}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No quick specs available.</p>
                )}
              </div>

              {/* Recent Activity Section */}
              <div className="pt-2">
                <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
                  <Clock size={18} className="text-primary" />
                  Recent Activity
                </h4>
                {isLoadingActivities ? (
                  <div className="flex justify-center p-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  </div>
                ) : activities.length > 0 ? (
                  <div className="relative pl-4 space-y-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
                    {activities.map((activity) => (
                      <div key={activity.id} className="relative">
                        <div className="absolute -left-[13px] top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-card" />
                        <p className="text-sm text-foreground leading-tight font-bold">
                          {activity.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {activity.description}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                          {formatDateTime(activity.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No recent activity recorded.</p>
                )}
              </div>
            </div>

            {/* Footer (Sticky) */}
            <div className="sticky bottom-0 bg-card border-t border-border p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleEditAsset}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Pencil size={16} />
                  Edit Asset
                </Button>
                <Button 
                  variant="outline"
                  onClick={handlePrintQR}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Printer size={16} />
                  Print QR
                </Button>
              </div>
              <Button 
                onClick={handleViewFullDetails}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                View Full Details
                <ExternalLink size={16} />
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AssetQuickViewPanel;
