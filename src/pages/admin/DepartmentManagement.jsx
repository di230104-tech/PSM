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

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Existing Departments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Created At</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-[11px] text-gray-400">{dept.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{dept.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(dept.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:bg-blue-50"
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
                        className="h-8 w-8 text-red-600 hover:bg-red-50"
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
            <div className="text-center text-gray-400 py-12">
              <p className="text-sm font-medium">No departments found.</p>
            </div>
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
