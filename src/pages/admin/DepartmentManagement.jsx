import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { DashboardSkeleton } from '../../components/ui/LoadingState';
import { NotificationContainer, NotificationToast } from '../../components/ui/NotificationToast';
import { Edit, Trash2, Plus } from 'lucide-react'; 
import EditDepartmentModal from './components/EditDepartmentModal';
import DeleteDepartmentConfirmationModal from './components/DeleteDepartmentConfirmationModal';
import AddDepartmentModal from './components/AddDepartmentModal';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showEditDepartmentModal, setShowEditDepartmentModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('departments').select('*').order('name');
    if (error) {
      addNotification('Error fetching departments', 'error');
    } else {
      setDepartments(data);
    }
    setIsLoading(false);
  };

  const addNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Department Management</h1>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
          <Plus size={20} /> Register Department
        </Button>
      </div>

      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Existing Departments</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-background border-b">
              <tr>
                <th scope="col" className="px-6 py-3">ID</th>
                <th scope="col" className="px-6 py-3">Name</th>
                <th scope="col" className="px-6 py-3">Created At</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">{dept.id}</td>
                  <td className="px-6 py-4 font-medium text-foreground">{dept.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{new Date(dept.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary"
                        onClick={() => {
                          setEditingDepartment(dept);
                          setShowEditDepartmentModal(true);
                        }}
                        title="Edit Department"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => {
                          setDepartmentToDelete(dept);
                          setShowDeleteConfirmModal(true);
                        }}
                        title="Delete Department"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {departments.length === 0 && (
            <p className="text-center text-muted-foreground mt-8 py-8">No departments found.</p>
          )}
        </div>
      </div>
      
      <NotificationContainer notifications={notifications} onRemove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />

      {isAddModalOpen && (
        <AddDepartmentModal
          onClose={() => setIsAddModalOpen(false)}
          onDepartmentAdded={() => {
            fetchDepartments();
            addNotification('Department registered successfully!', 'success');
          }}
        />
      )}

      {showEditDepartmentModal && editingDepartment && (
        <EditDepartmentModal
          department={editingDepartment}
          onClose={() => {
            setShowEditDepartmentModal(false);
            setEditingDepartment(null);
          }}
          onDepartmentUpdated={() => {
            fetchDepartments();
            addNotification('Department updated successfully!', 'success');
          }}
        />
      )}

      {showDeleteConfirmModal && departmentToDelete && (
        <DeleteDepartmentConfirmationModal
          department={departmentToDelete}
          onClose={() => {
            setShowDeleteConfirmModal(false);
            setDepartmentToDelete(null);
          }}
          onConfirmDelete={() => {
            fetchDepartments();
            addNotification('Department deleted successfully!', 'success');
          }}
        />
      )}
    </div>
  );
};

export default DepartmentManagement;
