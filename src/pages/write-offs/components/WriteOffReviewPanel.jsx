import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  AlertTriangle, 
  CheckCircle, 
  Cpu, 
  Database, 
  HardDrive, 
  ChevronRight,
  Clock,
  Calendar,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { logActivity } from '../../../utils/activityLogger';
import { calculateEOLDate, getEOLStatus } from '../../../utils/assetUtils';
import { formatCurrency } from '../../../utils/formatters';
import Button from '../../../components/ui/Button';
import { useSelector } from 'react-redux';

const WriteOffReviewPanel = ({ asset, isOpen, onClose, onSuccess }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const { user: authUser } = useSelector((state) => state.auth);
    const userId = authUser?.id;

    if (!asset) return null;

    const eolDate = calculateEOLDate(asset.purchase_date, asset.lifespan_months || (asset.lifespan_years * 12));
    const eolStatus = getEOLStatus(eolDate);
    const isExpired = eolStatus.status === 'Expired';

    const handleApprove = async () => {
        setIsProcessing(true);
        try {
            const { error: updateError } = await supabase
                .from('assets')
                .update({ 
                    status: 'Written Off', 
                    is_archived: true 
                })
                .eq('asset_tag', asset.asset_tag);

            if (updateError) throw updateError;

            await logActivity(
                'asset_written_off',
                `Write-off approved for disposal via review panel`,
                asset.asset_tag,
                userId,
                {
                    reason: asset.status === 'broken' ? 'Hardware Failure' : 'Life-cycle Expiry',
                    disposal_method: 'Pending Disposal',
                    authorized_by: authUser?.email || userId,
                    reviewed_via: 'Review Panel'
                }
            );

            onSuccess?.(`Asset ${asset.asset_tag} approved for disposal.`);
            onClose();
        } catch (error) {
            console.error('Approval Error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        setIsProcessing(true);
        try {
            const { error: updateError } = await supabase
                .from('assets')
                .update({ 
                    status: 'in_storage'
                })
                .eq('asset_tag', asset.asset_tag);

            if (updateError) throw updateError;

            await logActivity(
                'asset_restored',
                `Write-off rejected; asset returned to inventory`,
                asset.asset_tag,
                userId,
                {
                    reason: 'Reviewer rejected disposal request',
                    previous_status: asset.status,
                    authorized_by: authUser?.email || userId
                }
            );

            onSuccess?.(`Asset ${asset.asset_tag} returned to available inventory.`);
            onClose();
        } catch (error) {
            console.error('Rejection Error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]"
                    />

                    {/* Side Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl z-[120] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-xl font-bold text-foreground">{asset.asset_tag}</h2>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning/10 text-warning border border-warning/20 uppercase tracking-widest">
                                        Pending Review
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{asset.product_name}</p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-muted rounded-full transition-colors"
                            >
                                <X className="h-5 w-5 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Section 1: Justification */}
                            <section className="space-y-4">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <AlertTriangle className="h-3 w-3" /> Disposal Justification
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Reason for Review</span>
                                            <span className="text-sm font-bold text-error">
                                                {asset.status === 'broken' ? 'Hardware Failure' : 'EOL Expired'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                                                <Calendar className="h-4 w-4" /> Expected EOL Date
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">
                                                    {eolDate ? eolDate.toLocaleDateString() : 'N/A'}
                                                </span>
                                                {isExpired && (
                                                    <div className="p-1 bg-success/10 text-success rounded-full" title="Eligible for retirement">
                                                        <CheckCircle className="h-4 w-4" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section 2: Hardware Profile */}
                            <section className="space-y-4">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Cpu className="h-3 w-3" /> Hardware Profile
                                </h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {asset.technical_specs?.processor && (
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                                            <div className="p-2 bg-background rounded-md shadow-sm">
                                                <Cpu className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Processor</p>
                                                <p className="text-sm font-medium">{asset.technical_specs.processor}</p>
                                            </div>
                                        </div>
                                    )}
                                    {asset.technical_specs?.memory && (
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                                            <div className="p-2 bg-background rounded-md shadow-sm">
                                                <Database className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Memory</p>
                                                <p className="text-sm font-medium">{asset.technical_specs.memory}</p>
                                            </div>
                                        </div>
                                    )}
                                    {asset.technical_specs?.storage && (
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                                            <div className="p-2 bg-background rounded-md shadow-sm">
                                                <HardDrive className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Storage</p>
                                                <p className="text-sm font-medium">{asset.technical_specs.storage}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Info Callout */}
                            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                                <div className="flex gap-3">
                                    <Clock className="h-5 w-5 text-blue-500 shrink-0" />
                                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                        Reviewing this asset will either move it to the Scrapped audit log or restore it to Available inventory for refurbishing.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-border grid grid-cols-1 gap-3 bg-muted/10">
                            <Button 
                                variant="primary" 
                                className="w-full bg-success hover:bg-success/90 border-none h-12 text-base shadow-lg shadow-success/20"
                                iconName="Trash2"
                                onClick={handleApprove}
                                loading={isProcessing}
                            >
                                Approve Disposal
                            </Button>
                            <Button 
                                variant="outline" 
                                className="w-full border-error/20 text-error hover:bg-error/5 h-12 text-base"
                                iconName="RotateCcw"
                                onClick={handleReject}
                                loading={isProcessing}
                                disabled={isProcessing}
                            >
                                Reject & Return to Inventory
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default WriteOffReviewPanel;
