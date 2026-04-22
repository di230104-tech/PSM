import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { LoadingSpinner } from '../../../components/ui/LoadingState';

const AssignSeatModal = ({ software, isOpen, onClose, onSuccess }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const isAtCapacity = software.used_seats >= software.total_seats;

    useEffect(() => {
        if (isOpen) {
            fetchEmployees();
        }
    }, [isOpen]);

    const fetchEmployees = async () => {
        setIsLoading(true);
        try {
            // Fetch employees and their current assignments for THIS software
            const { data, error } = await supabase
                .from('employees')
                .select(`
                    id,
                    full_name,
                    email,
                    employee_number,
                    departments ( name ),
                    software_assignments!left ( software_id )
                `);

            if (error) throw error;

            const formattedEmployees = data.map(emp => ({
                ...emp,
                is_assigned: emp.software_assignments?.some(a => a.software_id === software.id)
            }));

            setEmployees(formattedEmployees);
        } catch (err) {
            console.error('Error fetching employees:', err);
            setError('Failed to load employees.');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => 
            (emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.employee_number?.toLowerCase().includes(searchQuery.toLowerCase())) &&
            !emp.is_assigned // Only show unassigned employees
        );
    }, [employees, searchQuery]);

    const handleAssign = async (employeeId) => {
        if (isAtCapacity) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const { error: assignError } = await supabase
                .from('software_assignments')
                .insert([{
                    software_id: software.id,
                    employee_id: employeeId
                }]);

            if (assignError) throw assignError;

            onSuccess?.(`Seat assigned successfully to employee.`);
            onClose();
        } catch (err) {
            console.error('Error assigning seat:', err);
            setError(err.message || 'Failed to assign seat.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-card border border-border rounded-xl shadow-2xl max-w-2xl w-full relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Assign Software Seat</h2>
                        <p className="text-sm text-muted-foreground">{software.name} ({software.used_seats}/{software.total_seats} used)</p>
                    </div>
                    <Button variant="ghost" size="icon" iconName="X" onClick={onClose} />
                </div>

                <div className="p-6 border-b border-border space-y-4">
                    {isAtCapacity ? (
                        <div className="p-4 bg-error/10 border border-error/20 rounded-lg flex items-start gap-3 text-error">
                            <Icon name="AlertOctagon" size={20} className="mt-0.5" />
                            <div>
                                <p className="font-bold">No available seats.</p>
                                <p className="text-sm opacity-90">Please revoke an existing license or upgrade your subscription to assign more seats.</p>
                            </div>
                        </div>
                    ) : (
                        <Input
                            placeholder="Search employees by name, email, or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            iconName="Search"
                        />
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex justify-center py-8"><LoadingSpinner /></div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Icon name="Users" size={48} className="mx-auto mb-4 opacity-20" />
                            <p>{searchQuery ? 'No matching unassigned employees found.' : 'No available employees to assign.'}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredEmployees.map(emp => (
                                <div key={emp.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-medium text-foreground truncate">{emp.full_name}</h3>
                                        <p className="text-xs text-muted-foreground truncate">{emp.email} • {emp.departments?.name || 'No Dept'}</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        disabled={isAtCapacity || isSubmitting}
                                        onClick={() => handleAssign(emp.id)}
                                        loading={isSubmitting}
                                    >
                                        Assign Seat
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {error && (
                    <div className="px-6 py-3 bg-error/10 text-error text-sm border-t border-error/20">
                        {error}
                    </div>
                )}

                <div className="p-6 border-t border-border flex justify-end">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                </div>
            </motion.div>
        </div>
    );
};

export default AssignSeatModal;
