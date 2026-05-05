// src/pages/admin/EmployeeManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabaseClient';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Controller } from 'react-hook-form';
import { AlertCircle, UserPlus, Users, Edit, Trash2 } from 'lucide-react'; // Added Edit and Trash2 icons
import EditEmployeeModal from './components/EditEmployeeModal';
import DeleteEmployeeConfirmationModal from './components/DeleteEmployeeConfirmationModal';
import { useSelector } from 'react-redux';

const EmployeeManagement = () => {
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm();
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false); // State to control edit modal visibility
  const [editingEmployee, setEditingEmployee] = useState(null); // State to store the employee being edited
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false); // State to control delete confirmation modal visibility
  const [employeeToDelete, setEmployeeToDelete] = useState(null); // State to store the employee to be deleted

  // Get actual user from Redux store
  const { user } = useSelector((state) => state.auth);

  const fetchEmployeesAndDepartments = useCallback(async () => {
    setLoading(true);
    // Fetch departments
    const { data: deptData, error: deptError } = await supabase.from('departments').select('id, name');
    if (deptError) {
      setError('Failed to fetch departments.');
      console.error('Error fetching departments:', deptError); // Log department fetch error
    } else {
      setDepartments(deptData.map(d => ({ value: d.id, label: d.name })));
    }

    // Fetch employees
    const { data: empData, error: empError } = await supabase.from('employees').select('*, departments(name)');
    if (empError) {
      setError('Failed to fetch employees.');
      console.error('Error fetching employees:', empError); // Log employee fetch error
    } else {
      console.log("Fetched employee data (full):", JSON.stringify(empData, null, 2)); // Full object log
      setEmployees(empData);
    }
    setLoading(false);
  }, [setLoading, setError, setDepartments, setEmployees]); // Dependencies for useCallback

  useEffect(() => {
    fetchEmployeesAndDepartments();
  }, [success, fetchEmployeesAndDepartments]); // Refetch when a new employee is added

  const onSubmit = async (data) => {
    setSuccess('');
    setError('');
    try {
      const { error } = await supabase.from('employees').insert({
        full_name: data.fullName,
        email: data.email,
        employee_number: data.employeeNumber,
        department_id: parseInt(data.department_id),
      });
      if (error) throw error;
      setSuccess(`Employee ${data.fullName} added successfully.`);
      reset();
    } catch (err) {
      setError(err.message);
      console.error("Employee creation error:", err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto p-6">
      
      {/* Left Column: Add Employee Form */}
      <div className="lg:col-span-1">
        <div className="bg-card p-8 rounded-xl shadow-lg border border-border">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-foreground">
            <UserPlus size={24} /> Add New Employee
          </h2>
          {success && <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4">{success}</div>}
          {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 flex items-center gap-2"><AlertCircle size={20} />{error}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input label="Full Name" type="text" {...register('fullName', { required: 'Full Name is required' })} error={errors.fullName?.message} />
            <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
            <Input label="Employee ID" type="text" {...register('employeeNumber')} error={errors.employeeNumber?.message} />
            <Controller
              name="department_id"
              control={control}
              rules={{ required: 'Department is required' }}
              render={({ field }) => (
                <Select {...field} label="Department" options={departments} error={errors.department_id?.message} />
              )}
            />
            <Button type="submit" loading={isSubmitting} disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Adding...' : 'Add Employee'}
            </Button>
          </form>
        </div>
      </div>

      {/* Right Column: Employee List */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
            <Users size={20} className="text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Employee List</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Employee ID</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-10 text-gray-400">Loading...</td></tr>
                ) : employees.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-10 text-gray-400">No employees found.</td></tr>
                ) : (
                  employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{emp.full_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{emp.employee_number || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {emp.departments?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.email || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setEditingEmployee(emp);
                              setShowEditEmployeeModal(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setEmployeeToDelete(emp);
                              setShowDeleteConfirmModal(true);
                            }}
                          >
                            Delete
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
      </div>

      {showEditEmployeeModal && editingEmployee && (
        <EditEmployeeModal
          employee={editingEmployee}
          departments={departments}
          onClose={() => {
            setShowEditEmployeeModal(false);
            setEditingEmployee(null);
          }}
          onEmployeeUpdated={() => {
            setSuccess('Employee updated successfully!');
            fetchEmployeesAndDepartments(); // Directly re-fetch data
          }}
        />
      )}

      {showDeleteConfirmModal && employeeToDelete && (
        <DeleteEmployeeConfirmationModal
          employee={employeeToDelete}
          onClose={() => {
            setShowDeleteConfirmModal(false);
            setEmployeeToDelete(null);
          }}
          onConfirmDelete={() => {
            setSuccess('Employee deleted successfully!');
            fetchEmployeesAndDepartments(); // Directly re-fetch data
          }}
        />
      )}
    </div>
  );
};

export default EmployeeManagement;
