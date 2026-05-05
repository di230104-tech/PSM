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
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Software Name</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Vendor</th>
                                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Utilization</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Compliance</th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Annual Cost</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Renewal Date</th>
                                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {licenses.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                                        <Icon name="FileCode" size={48} className="mx-auto mb-4 opacity-20" />
                                        <p className="text-sm font-medium">No software licenses found.</p>
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
                                        className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                                        onClick={() => navigate(`/software/${lic.id}`)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900">{lic.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {lic.vendor}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs font-bold text-gray-700">{lic.used_seats} / {lic.total_seats}</span>
                                                <div className="w-20 h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                                                    <div 
                                                        className={`h-full ${lic.used_seats > lic.total_seats ? 'bg-red-500' : 'bg-blue-600'}`} 
                                                        style={{ width: `${Math.min(100, (lic.used_seats / lic.total_seats) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {lic.used_seats > lic.total_seats ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-100">
                                                    Over-Deployed!
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-100">
                                                    Compliant
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-gray-900">
                                            {formatCurrency(lic.annual_cost)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {lic.renewal_date ? new Date(lic.renewal_date).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingSoftware(lic);
                                                    }}
                                                    className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
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
                                                    className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
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
