import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingState';
import { formatCurrency } from '../../utils/formatters';
import { NotificationContainer } from '../../components/ui/NotificationToast';
import AssignSeatModal from './components/AssignSeatModal';
import EditSoftwareModal from './components/EditSoftwareModal';

const SoftwareDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [isLoading, setIsLoading] = useState(true);
    const [software, setSoftware] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isRevoking, setIsRevoking] = useState(null);

    useEffect(() => {
        if (id) {
            fetchSoftwareData();
        }
    }, [id]);

    const fetchSoftwareData = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch software license info
            const { data: license, error: licenseError } = await supabase
                .from('software_licenses')
                .select('*')
                .eq('id', id)
                .single();

            if (licenseError) throw licenseError;

            // 2. Fetch assignments
            const { data: assigned, error: assignedError } = await supabase
                .from('software_assignments')
                .select(`
                    id,
                    assigned_date,
                    employee:employees (
                        id,
                        full_name,
                        email,
                        employee_number,
                        departments ( name )
                    )
                `)
                .eq('software_id', id);

            if (assignedError) throw assignedError;

            setSoftware({
                ...license,
                used_seats: assigned.length
            });
            setAssignments(assigned);
        } catch (error) {
            console.error('Error fetching software detail:', error);
            addNotification(`Failed to load software detail: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const addNotification = (message, type = 'info') => {
        setNotifications(prev => [...prev, { id: Date.now(), message, type }]);
    };

    const handleSoftwareUpdated = (message, type) => {
        addNotification(message, type);
        fetchSoftwareData();
    };

    const handleRevoke = async (assignmentId) => {
        if (!window.confirm('Are you sure you want to revoke this license seat?')) return;

        setIsRevoking(assignmentId);
        try {
            const { error } = await supabase
                .from('software_assignments')
                .delete()
                .eq('id', assignmentId);

            if (error) throw error;

            addNotification('License seat revoked successfully.', 'success');
            fetchSoftwareData(); // Refresh data
        } catch (error) {
            console.error('Error revoking license:', error);
            addNotification(`Failed to revoke license: ${error.message}`, 'error');
        } finally {
            setIsRevoking(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="xl" />
            </div>
        );
    }

    if (!software) {
        return (
            <div className="p-12 text-center">
                <Icon name="AlertCircle" size={48} className="mx-auto text-error mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">Software Not Found</h2>
                <Button onClick={() => navigate('/software')}>Back to Software List</Button>
            </div>
        );
    }

    const utilizationPercentage = Math.min(100, (software.used_seats / software.total_seats) * 100);
    const costPerSeat = software.total_seats > 0 ? (software.annual_cost / software.total_seats) : 0;

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <Icon name="Cloud" size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{software.name}</h1>
                        <p className="text-muted-foreground">{software.vendor}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" iconName="Edit" onClick={() => setShowEditModal(true)}>Edit Software</Button>
                    <Button 
                        iconName="UserPlus" 
                        onClick={() => setShowAssignModal(true)}
                        disabled={software.used_seats >= software.total_seats}
                    >
                        Assign Seat
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="border-b border-border bg-muted/30">
                    <nav className="flex">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('assignments')}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'assignments' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Assignments ({software.used_seats})
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'overview' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Seat Utilization</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Used Seats</span>
                                            <span className="font-medium">{software.used_seats} / {software.total_seats}</span>
                                        </div>
                                        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-500 ${utilizationPercentage > 90 ? 'bg-error' : utilizationPercentage > 75 ? 'bg-warning' : 'bg-success'}`}
                                                style={{ width: `${utilizationPercentage}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground italic">
                                            {software.total_seats - software.used_seats} seats remaining.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                        <Icon name="Key" size={16} />
                                        License Keys / Access Details
                                    </h4>
                                    <code className="block p-3 bg-background border border-border rounded text-sm font-mono break-all">
                                        {software.license_key || 'No static key provided (SaaS/SSO managed)'}
                                    </code>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Icon name="DollarSign" size={20} />
                                    Financials & Contract
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between py-2 border-b border-border">
                                        <span className="text-muted-foreground">Annual Contract Cost</span>
                                        <span className="font-medium text-foreground">{formatCurrency(software.annual_cost)}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-border">
                                        <span className="text-muted-foreground">Cost per Seat (Estimated)</span>
                                        <span className="font-medium text-foreground">{formatCurrency(costPerSeat)} / year</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-border">
                                        <span className="text-muted-foreground">Renewal Date</span>
                                        <span className={`font-medium ${new Date(software.renewal_date) < new Date() ? 'text-error' : 'text-foreground'}`}>
                                            {software.renewal_date ? new Date(software.renewal_date).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Employee</th>
                                        <th className="px-6 py-4 font-semibold">Department</th>
                                        <th className="px-6 py-4 font-semibold">Assigned Date</th>
                                        <th className="px-6 py-4 font-semibold text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {assignments.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-muted-foreground">
                                                No employees assigned to this license.
                                            </td>
                                        </tr>
                                    ) : (
                                        assignments.map((asgn) => (
                                            <tr key={asgn.id} className="hover:bg-muted/30">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-foreground">{asgn.employee?.full_name}</div>
                                                    <div className="text-xs text-muted-foreground">{asgn.employee?.email}</div>
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {asgn.employee?.departments?.name || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {new Date(asgn.assigned_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="text-error hover:text-error hover:bg-error/10"
                                                        onClick={() => handleRevoke(asgn.id)}
                                                        loading={isRevoking === asgn.id}
                                                        iconName="UserMinus"
                                                    >
                                                        Revoke
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {showAssignModal && (
                <AssignSeatModal 
                    software={software}
                    isOpen={showAssignModal}
                    onClose={() => setShowAssignModal(false)}
                    onSuccess={(msg) => {
                        addNotification(msg, 'success');
                        fetchSoftwareData();
                    }}
                />
            )}

            {showEditModal && (
                <EditSoftwareModal
                    software={software}
                    onClose={() => setShowEditModal(false)}
                    onSoftwareUpdated={handleSoftwareUpdated}
                />
            )}

            <NotificationContainer 
                notifications={notifications} 
                onRemove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} 
            />
        </div>
    );
};

export default SoftwareDetail;
