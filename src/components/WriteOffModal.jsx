import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { logActivity } from '../utils/activityLogger';
import { calculateDepreciation } from '../utils/assetUtils';
import { formatCurrency } from '../utils/formatters';
import Icon from './AppIcon';
import Button from './ui/Button';
import Select from './ui/Select';
import { useSelector } from 'react-redux';

const WriteOffModal = ({ asset, isOpen, onClose, onSuccess }) => {
    const [reason, setReason] = useState('');
    const [disposalMethod, setDisposalMethod] = useState('');
    const [justification, setJustification] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const { user: authUser } = useSelector((state) => state.auth);
    const userId = authUser?.id;

    if (!isOpen || !asset) return null;

    const currentValue = calculateDepreciation(asset.purchase_date, asset.purchase_price);

    const reasons = [
        { value: 'Beyond Economic Repair', label: 'Beyond Economic Repair' },
        { value: 'Obsolete', label: 'Obsolete' },
        { value: 'Lost/Stolen', label: 'Lost/Stolen' },
        { value: 'Destroyed', label: 'Destroyed' }
    ];

    const disposalMethods = [
        { value: 'E-Waste Recycling', label: 'E-Waste Recycling' },
        { value: 'Donated', label: 'Donated' },
        { value: 'Scrapped', label: 'Scrapped' },
        { value: 'Returned to Vendor', label: 'Returned to Vendor' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!justification.trim()) {
            setError('Justification is required.');
            return;
        }
        if (!reason || !disposalMethod) {
            setError('Please select a reason and disposal method.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // 1. Update Asset Status and Archive Flag
            const { error: updateError } = await supabase
                .from('assets')
                .update({ 
                    status: 'Written Off', 
                    is_archived: true 
                })
                .eq('asset_tag', asset.asset_tag);

            if (updateError) throw updateError;

            // 2. Log Activity
            await logActivity(
                'asset_written_off',
                `Asset written off due to: ${reason}`,
                asset.asset_tag,
                userId,
                {
                    reason,
                    disposal_method: disposalMethod,
                    justification,
                    original_price: asset.purchase_price,
                    estimated_value_at_write_off: currentValue,
                    authorized_by: authUser?.email || userId
                }
            );

            onSuccess?.(`Asset ${asset.asset_tag} has been successfully written off.`);
            onClose();
        } catch (err) {
            console.error('Error writing off asset:', err);
            setError(err.message || 'Failed to write off asset. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-card border border-border rounded-xl shadow-2xl max-w-lg w-full relative z-10 overflow-hidden"
            >
                {/* Header */}
                <div className="p-6 border-b border-border bg-error/5">
                    <div className="flex items-center gap-3 text-error">
                        <div className="p-2 bg-error/10 rounded-lg">
                            <Icon name="AlertTriangle" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Confirm Asset Write-Off</h3>
                            <p className="text-sm text-error/80">This action is permanent and removes the asset from active circulation.</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Financial Context Block */}
                    <div className="bg-muted/50 rounded-lg p-4 border border-border grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-xs text-muted-foreground block uppercase font-semibold">Original Price</span>
                            <span className="text-lg font-bold text-foreground">{formatCurrency(asset.purchase_price)}</span>
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground block uppercase font-semibold">Estimated Current Value</span>
                            <span className="text-lg font-bold text-foreground">{formatCurrency(currentValue)}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Select
                            label="Reason for Write-Off"
                            options={reasons}
                            value={reason}
                            onChange={setReason}
                            placeholder="Select a reason"
                            required
                        />

                        <Select
                            label="Disposal Method"
                            options={disposalMethods}
                            value={disposalMethod}
                            onChange={setDisposalMethod}
                            placeholder="Select disposal method"
                            required
                        />

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Justification / Audit Notes <span className="text-error">*</span>
                            </label>
                            <textarea
                                className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Provide detailed justification for auditing purposes..."
                                value={justification}
                                onChange={(e) => setJustification(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-error/10 border border-error/20 rounded-md flex items-center gap-2 text-error text-sm">
                            <Icon name="AlertCircle" size={16} />
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="default" // Will style this as danger in the page if needed, or I can use a custom class
                            className="bg-error hover:bg-error/90 text-white border-none"
                            iconName="Trash2"
                            loading={isSubmitting}
                        >
                            Confirm Write-Off
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default WriteOffModal;
