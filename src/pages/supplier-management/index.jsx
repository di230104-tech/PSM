import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useSelector } from 'react-redux';
import { NotificationContainer } from '../../components/ui/NotificationToast';
import { DashboardSkeleton } from '../../components/ui/LoadingState';
import Button from '../../components/ui/Button';
import SupplierTable from './components/SupplierTable';
import SupplierDetailPanel from './components/SupplierDetailPanel';
import SupplierFormModal from './components/SupplierFormModal';
import FilterToolbar from './components/FilterToolbar';
import PerformanceMetrics from './components/PerformanceMetrics';
import SupplierReliabilityReport from './components/SupplierReliabilityReport';

const SupplierManagement = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    rating: 'all'
  });
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  
  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type, duration: 4000 }]);
  }, []);

  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('suppliers').select('*').order('company_name');
      
      if (error) {
        console.error("Error fetching suppliers:", error);
        addNotification('Failed to load suppliers.', 'error');
      } else {
        setSuppliers(data);
      }

      // Fetch assets with supplier relation for the reliability report
      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select(`
          *,
          suppliers ( company_name )
        `);
      
      if (assetsError) {
        console.error("Error fetching assets:", assetsError);
      } else {
        setAssets(assetsData);
      }
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  useEffect(() => {
    let filtered = suppliers;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((supplier) =>
        supplier.company_name?.toLowerCase().includes(searchLower) ||
        supplier.contact_person?.toLowerCase().includes(searchLower) ||
        supplier.email?.toLowerCase().includes(searchLower)
      );
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter((supplier) => supplier.status === filters.status);
    }
    if (filters.rating !== 'all') {
      const ratingValue = parseFloat(filters.rating);
      filtered = filtered.filter((supplier) => supplier.rating >= ratingValue);
    }
    setFilteredSuppliers(filtered);
  }, [suppliers, filters]);

  const removeNotification = (id) => setNotifications((prev) => prev.filter((n) => n.id !== id));

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    setIsFormModalOpen(true);
  };

  const handleEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setIsFormModalOpen(true);
  };

  const handleDeleteSupplier = async (supplierId) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', supplierId);
    if (error) {
      addNotification(`Error deleting supplier: ${error.message}`, 'error');
    } else {
      addNotification("Supplier deleted successfully", 'success');
      if (selectedSupplier?.id === supplierId) {
        setSelectedSupplier(null);
      }
      fetchSuppliers(); // Refetch data
    }
  };

  const handleSupplierSubmit = async (supplierData) => {
    // Map frontend camelCase to backend snake_case
    const payload = {
      company_name: supplierData.companyName,
      contact_person: supplierData.contactPerson,
      email: supplierData.email,
      phone: supplierData.phone,
      address: supplierData.address,
      website: supplierData.website,
      tax_id: supplierData.taxId,
      contract_start: supplierData.contractStart,
      contract_end: supplierData.contractEnd,
      status: supplierData.status,
      rating: supplierData.rating,
      preferred_vendor: supplierData.preferredVendor,
      notes: supplierData.notes
    };

    let error;
    if (editingSupplier) {
      // Update existing supplier
      ({ error } = await supabase.from('suppliers').update(payload).eq('id', editingSupplier.id));
      if (!error) addNotification("Supplier updated successfully", 'success');
    } else {
      // Add new supplier
      ({ error } = await supabase.from('suppliers').insert(payload));
      if (!error) addNotification("Supplier added successfully", 'success');
    }

    if (error) {
      addNotification(`Error saving supplier: ${error.message}`, 'error');
    } else {
      setIsFormModalOpen(false);
      setEditingSupplier(null);
      fetchSuppliers(); // Refetch data
    }
  };

  const handleFilterChange = (newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }));

  if (isLoading && suppliers.length === 0) {
    return (
      <div className="p-6"><DashboardSkeleton /></div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Supplier Management</h1>
          <p className="text-muted-foreground">Manage vendor relationships and procurement workflows</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="default" iconName="Plus" iconPosition="left" onClick={handleAddSupplier}>Add Supplier</Button>
        </div>
      </div>
      <PerformanceMetrics suppliers={suppliers} />
      <SupplierReliabilityReport assets={assets} />
      <FilterToolbar filters={filters} onFilterChange={handleFilterChange} suppliersCount={filteredSuppliers.length} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <SupplierTable suppliers={filteredSuppliers} selectedSupplier={selectedSupplier} onSupplierSelect={setSelectedSupplier} onSupplierEdit={handleEditSupplier} onSupplierDelete={handleDeleteSupplier} />
        </div>
        <div className="xl:col-span-1">
          <SupplierDetailPanel supplier={selectedSupplier} onEdit={handleEditSupplier} />
        </div>
      </div>

      <SupplierFormModal isOpen={isFormModalOpen} onClose={() => { setIsFormModalOpen(false); setEditingSupplier(null); }} supplier={editingSupplier} onSubmit={handleSupplierSubmit} />
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </div>
  );
};

export default SupplierManagement;
