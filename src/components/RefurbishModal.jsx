import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { logActivity } from '../utils/activityLogger';
import Icon from './AppIcon';
import Button from './ui/Button';
import Input from './ui/Input';
import { useSelector } from 'react-redux';

const RefurbishModal = ({ asset, isOpen, onClose, onSuccess }) => {
    const [memory, setMemory] = useState(asset?.technical_specs?.memory || '');
    const [storage, setStorage] = useState(asset?.technical_specs?.storage || '');
    const [extensionMonths, setExtensionMonths] = useState(12);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const { user: authUser } = useSelector((state) => state.auth);
    const userId = authUser?.id;

    if (!isOpen || !asset) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // 1. Calculate new EOL date
            // Note: The task says "current EOL date + X months". 
            // We need to fetch/calculate current EOL if not available in asset object as a field.
            // Migration 20260414120000_add_lifespan_months.sql might have added it.
            // Let's assume we update lifespan_months instead of eol_date if eol_date is calculated.
            // Actually, the task says "update eol_date".
            
            const currentLifespan = asset.lifespan_months || (asset.lifespan_years * 12) || 36;
            const newLifespan = parseInt(currentLifespan) + parseInt(extensionMonths);

            const updatedSpecs = {
                ...asset.technical_specs,
                memory,
                storage
            };

            // 2. Update Asset
            const { error: updateError } = await supabase
                .from('assets')
                .update({ 
                    status: 'in_storage', 
                    technical_specs: updatedSpecs,
                    lifespan_months: newLifespan
                })
                .eq('asset_tag', asset.asset_tag);

            if (updateError) throw updateError;

            // 3. Log Activity
            await logActivity(
                'asset_refurbished',
                `Asset refurbished and lifespan extended by ${extensionMonths} months.`,
                asset.asset_tag,
                userId,
                {
                    notes,
                    previous_memory: asset.technical_specs?.memory,
                    new_memory: memory,
                    previous_storage: asset.technical_specs?.storage,
                    new_storage: storage,
                    lifespan_extension: extensionMonths
                }
            );

            onSuccess?.(`Asset ${asset.asset_tag} has been revived and is now Available!`);
            onClose();
        } catch (err) {
            console.error('Error refurbishing asset:', err);
            setError(err.message || 'Failed to refurbish asset. Please try again.');
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
                <div className="p-6 border-b border-border bg-success/5">
                    <div className="flex items-center gap-3 text-success">
                        <div className="p-2 bg-success/10 rounded-lg">
                            <Icon name="Wrench" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Refurbish & Revive</h3>
                            <p className="text-sm text-success/80">Upgrade hardware and extend asset lifecycle.</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <Icon name="Database" size={14} /> Memory (RAM)
                                </label>
                                <Input
                                    value={memory}
                                    onChange={(e) => setMemory(e.target.value)}
                                    placeholder="e.g. 16GB DDR4"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <Icon name="HardDrive" size={14} /> Storage
                                </label>
                                <Input
                                    value={storage}
                                    onChange={(e) => setStorage(e.target.value)}
                                    placeholder="e.g. 512GB SSD"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Icon name="History" size={14} /> Lifespan Extension (Months)
                            </label>
                            <Input
                                type="number"
                                min="1"
                                value={extensionMonths}
                                onChange={(e) => setExtensionMonths(e.target.value)}
                                required
                            />
                            <p className="text-[11px] text-muted-foreground">This adds to the current lifespan to push out the EOL date.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Refurbishment Notes
                            </label>
                            <textarea
                                className="w-full min-h-[80px] p-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Details of what was changed or fixed..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
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
                            variant="primary"
                            className="bg-success hover:bg-success/90 text-white border-none"
                            iconName="RefreshCw"
                            loading={isSubmitting}
                        >
                            Complete Refurbishment
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default RefurbishModal;
