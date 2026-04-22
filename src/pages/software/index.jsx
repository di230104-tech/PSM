import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingState';
import { formatCurrency } from '../../utils/formatters';
import { NotificationContainer } from '../../components/ui/NotificationToast';
import AddSoftwareModal from './components/AddSoftwareModal';
import EditSoftwareModal from './components/EditSoftwareModal';

const SoftwareDashboard = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [licenses, setLicenses] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingSoftware, setEditingSoftware] = useState(null);

    useEffect(() => {
        fetchSoftwareLicenses();
    }, []);

    const fetchSoftwareLicenses = async () => {
        setIsLoading(true);
        try {
            // Fetch licenses and join with assignments count
            const { data, error } = await supabase
                .from('software_licenses')
                .select(`
                    *,
                    software_assignments(count)
                `)
                .order('name');

            if (error) throw error;

            const mappedLicenses = data.map(license => ({
                ...license,
                used_seats: license.software_assignments?.[0]?.count || 0
            }));

            setLicenses(mappedLicenses);
        } catch (error) {
            console.error('Error fetching software licenses:', error);
            addNotification(`Failed to load software licenses: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const addNotification = (message, type = 'info') => {
        setNotifications(prev => [...prev, { id: Date.now(), message, type }]);
    };

    const handleSoftwareAdded = (message, type) => {
        addNotification(message, type);
        fetchSoftwareLicenses();
    };

    const handleSoftwareUpdated = (message, type) => {
        addNotification(message, type);
        fetchSoftwareLicenses();
    };

    // KPI Calculations
    const totalAnnualSpend = licenses.reduce((sum, lic) => sum + (Number(lic.annual_cost) || 0), 0);
    
    const totalWastedSeatsCost = licenses.reduce((sum, lic) => {
        const unused = Math.max(0, lic.total_seats - lic.used_seats);
        const costPerSeat = lic.total_seats > 0 ? (lic.annual_cost / lic.total_seats) : 0;
        return sum + (unused * costPerSeat);
    }, 0);

    const upcomingRenewalsCount = licenses.filter(lic => {
        if (!lic.renewal_date) return false;
        const renewalDate = new Date(lic.renewal_date);
        const today = new Date();
        const sixtyDaysFromNow = new Date();
        sixtyDaysFromNow.setDate(today.getDate() + 60);
        return renewalDate >= today && renewalDate <= sixtyDaysFromNow;
    }).length;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="xl" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Software License Management</h1>
                    <p className="text-muted-foreground">Track subscriptions, assignments, and compliance.</p>
                </div>
                <Button iconName="Plus" onClick={() => setIsAddModalOpen(true)}>Add New Software</Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg text-primary">
                        <Icon name="Cloud" size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Annual SaaS Spend</p>
                        <h2 className="text-2xl font-bold">{formatCurrency(totalAnnualSpend)}</h2>
                    </div>
                </div>
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center gap-4 text-error">
                    <div className="p-3 bg-error/10 rounded-lg">
                        <Icon name="TrendingDown" size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Wasted Seats (Annual)</p>
                        <h2 className="text-2xl font-bold">{formatCurrency(totalWastedSeatsCost)}</h2>
                    </div>
                </div>
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-warning/10 rounded-lg text-warning">
                        <Icon name="Calendar" size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Upcoming Renewals (60d)</p>
                        <h2 className="text-2xl font-bold">{upcomingRenewalsCount}</h2>
                    </div>
                </div>
            </div>

            {/* Software Table */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-foreground">Software Name</th>
                                <th className="px-6 py-4 font-semibold text-foreground">Vendor</th>
                                <th className="px-6 py-4 font-semibold text-foreground text-center">Utilization</th>
                                <th className="px-6 py-4 font-semibold text-foreground">Compliance</th>
                                <th className="px-6 py-4 font-semibold text-foreground text-right">Annual Cost</th>
                                <th className="px-6 py-4 font-semibold text-foreground">Renewal Date</th>
                                <th className="px-6 py-4 font-semibold text-foreground text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {licenses.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-muted-foreground">
                                        <Icon name="FileCode" size={48} className="mx-auto mb-4 opacity-20" />
                                        <p>No software licenses found.</p>
                                        <Button 
                                            variant="outline" 
                                            className="mt-4"
                                            onClick={() => setIsAddModalOpen(true)}
                                        >
                                            Add Your First Subscription
                                        </Button>
                                    </td>
                                </tr>
                            ) : (
                                licenses.map((lic) => (
                                    <tr 
                                        key={lic.id} 
                                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                                        onClick={() => navigate(`/software/${lic.id}`)}
                                    >
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            {lic.name}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {lic.vendor}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="font-medium">{lic.used_seats} / {lic.total_seats}</span>
                                                <div className="w-20 h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                                                    <div 
                                                        className={`h-full ${lic.used_seats > lic.total_seats ? 'bg-error' : 'bg-primary'}`} 
                                                        style={{ width: `${Math.min(100, (lic.used_seats / lic.total_seats) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {lic.used_seats > lic.total_seats ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error/10 text-error border border-error/20">
                                                    Over-Deployed!
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                                                    Compliant
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium">
                                            {formatCurrency(lic.annual_cost)}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {lic.renewal_date ? new Date(lic.renewal_date).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingSoftware(lic);
                                                    }}
                                                    title="Edit Software"
                                                >
                                                    <Icon name="Pencil" size={16} />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/software/${lic.id}`);
                                                    }}
                                                    title="View Details"
                                                >
                                                    <Icon name="ArrowRight" size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isAddModalOpen && (
                <AddSoftwareModal 
                    onClose={() => setIsAddModalOpen(false)} 
                    onSoftwareAdded={handleSoftwareAdded}
                />
            )}

            {editingSoftware && (
                <EditSoftwareModal
                    software={editingSoftware}
                    onClose={() => setEditingSoftware(null)}
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

export default SoftwareDashboard;
