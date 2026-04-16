import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';
import { logActivity } from '../../../utils/activityLogger';
import { formatCurrency } from '../../../utils/formatters';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import { useSelector } from 'react-redux';

/**
 * Modal component for logging new maintenance records.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {Function} props.onClose - Callback to close the modal
 * @param {string} props.assetTag - The tag of the asset being serviced
 * @param {Function} props.onSuccess - Callback triggered after successful submission
 */
const AddMaintenanceModal = ({ isOpen, onClose, assetTag, onSuccess }) => {
    const [maintenanceDate, setMaintenanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState('');
    const [vendor, setVendor] = useState('');
    const [cost, setCost] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const { user: authUser } = useSelector((state) => state.auth);
    const userId = authUser?.id;

    const maintenanceTypes = [
        { value: 'Repair', label: 'Repair' },
        { value: 'Routine Service', label: 'Routine Service' },
        { value: 'Hardware Upgrade', label: 'Hardware Upgrade' },
        { value: 'Software Patch', label: 'Software Patch' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!type || !maintenanceDate || !vendor || !cost || !description.trim()) {
            setError('Please fill in all required fields.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // 1. Insert Maintenance Record
            // Note: type and vendor are new columns that should be added to the maintenance table
            const { error: insertError } = await supabase
                .from('maintenance')
                .insert([{ 
                    asset_tag: assetTag, 
                    maintenance_date: maintenanceDate, 
                    cost: parseFloat(cost), 
                    description, 
                    type, 
                    vendor,
                    title: `${type} - ${vendor}`, // Default title for existing schema
                    performed_by: vendor // Sync with existing column
                }]);

            if (insertError) throw insertError;

            // 2. Log Activity
            await logActivity(
                'maintenance_logged',
                `Logged ${type} maintenance by ${vendor}. Cost: ${formatCurrency(cost)}`,
                assetTag,
                userId,
                {
                    type,
                    vendor,
                    cost: parseFloat(cost),
                    maintenance_date: maintenanceDate
                }
            );

            // 3. Trigger success callback with message
            onSuccess?.(`Maintenance record for ${assetTag} has been successfully logged.`);
            
            // 4. Reset form and close
            setMaintenanceDate(new Date().toISOString().split('T')[0]);
            setType('');
            setVendor('');
            setCost('');
            setDescription('');
            onClose();
        } catch (err) {
            console.error('Error logging maintenance:', err);
            setError(err.message || 'Failed to log maintenance. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
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
                        <div className="p-6 border-b border-border bg-primary/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-primary">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Icon name="Wrench" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground">Log Maintenance</h3>
                                        <p className="text-sm text-muted-foreground">Add a new maintenance or repair record for {assetTag}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    iconName="X"
                                    onClick={onClose}
                                />
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Maintenance Date"
                                    type="date"
                                    value={maintenanceDate}
                                    onChange={(e) => setMaintenanceDate(e.target.value)}
                                    required
                                />
                                <Select
                                    label="Maintenance Type"
                                    options={maintenanceTypes}
                                    value={type}
                                    onChange={setType}
                                    placeholder="Select type"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Vendor / Technician"
                                    placeholder="Who did the work?"
                                    value={vendor}
                                    onChange={(e) => setVendor(e.target.value)}
                                    required
                                />
                                <Input
                                    label="Cost"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={cost}
                                    onChange={(e) => setCost(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Description of Work <span className="text-error">*</span>
                                </label>
                                <textarea
                                    className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                                    placeholder="Describe what was fixed, upgraded, or serviced..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
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
                                    iconName="Save"
                                    loading={isSubmitting}
                                >
                                    Log Maintenance
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AddMaintenanceModal;
