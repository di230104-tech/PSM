import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { supabase } from '../../lib/supabaseClient';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select'; 
import { AlertCircle, UserPlus, Edit, Trash2 } from 'lucide-react'; // Added Edit and Trash2 icons
import EditUserModal from './components/EditUserModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import { useSelector } from 'react-redux';

const UserRegistration = () => {
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm();
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]); // New state for storing fetched users
  const [loadingUsers, setLoadingUsers] = useState(true); // New state for user loading status
  const [showEditUserModal, setShowEditUserModal] = useState(false); // State to control edit modal visibility
  const [editingUser, setEditingUser] = useState(null); // State to store the user being edited
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false); // State to control delete confirmation modal visibility
  const [userToDelete, setUserToDelete] = useState(null); // State to store the user to be deleted

  // Get actual user from Redux store
  const { user } = useSelector((state) => state.auth);

  // Fetch departments for the select dropdown
  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase.from('departments').select('id, name');
      if (error) {
        console.error('Error fetching departments:', error);
      } else {
        setDepartments(data.map(dept => ({ value: dept.id, label: dept.name })));
      }
    };
    fetchDepartments();
  }, []);

  // Fetch users from the profiles table
  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        role,
        department_id,
        departments (name)
      `);
    
    if (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users.');
    } else {
      setUsers(data);
    }
    setLoadingUsers(false);
  };

  useEffect(() => {
    fetchUsers(); // Initial fetch of users
  }, []);

  // Define allowed roles for registration
  const roles = [
    { value: 'admin', label: 'System Admin' },
  ];

  const onSubmit = async (data) => {
    setSuccess('');
    setError('');

    try {
      // 1. Create user in Supabase auth.users
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: data.role
          }
        }
      });
      
      if (authError) throw authError;

      // 2. Insert corresponding profile entry into 'profiles' table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: data.fullName,
          role: data.role,
          email: data.email,
          department_id: parseInt(data.department_id),
        });

      if (profileError) {
        throw profileError;
      }

      setSuccess(`User ${data.email} registered successfully. A confirmation email has been sent.`);
      reset();

    } catch (err) {
      setError(err.message);
      console.error("Registration error:", err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3 text-foreground">
        <UserPlus size={28} /> User Registration
      </h1>
      <p className="text-muted-foreground mb-8">
        Use this form to provision new user accounts and assign their access roles (Admin, IT Staff, or Department PIC) within the system.
      </p>

      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4">{success}</div>
      )}
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-card p-8 rounded-xl shadow-lg border border-border">
          <Input
            label="Full Name"
            type="text"
            placeholder="e.g., John Smith"
            {...register('fullName', { required: 'Full Name is required' })}
            error={errors.fullName?.message}
          />
          <Input
            label="Email (Used for Login)"
            type="email"
            placeholder="user@panasonic.com"
            {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+$/i, message: 'Invalid email format' } })}
            error={errors.email?.message}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Min 6 characters"
            {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
            error={errors.password?.message}
          />
          <Controller
            name="role"
            control={control}
            rules={{ required: 'Role assignment is required' }}
            render={({ field }) => (
              <Select
                {...field}
                label="Assign Role"
                options={roles}
                placeholder="Select a role..."
                error={errors.role?.message}
              />
            )}
          />
          <Controller
            name="department_id"
            control={control}
            rules={{ required: 'Department is required' }}
            render={({ field }) => (
              <Select
                {...field}
                label="Assign Department"
                options={departments}
                placeholder="Select a department..."
                error={errors.department_id?.message}
              />
            )}
          />
          <Button 
            type="submit" 
            loading={isSubmitting} 
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Registering User...' : 'Register User'}
          </Button>
        </form>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Registered Users</h2>
          </div>

          {loadingUsers ? (
            <div className="text-center py-10 text-gray-400">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-10 text-gray-400">No registered users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{u.full_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {u.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {u.departments ? u.departments.name : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setEditingUser(u);
                              setShowEditUserModal(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setUserToDelete(u);
                              setShowDeleteConfirmModal(true);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showEditUserModal && editingUser && (
        <EditUserModal
          user={editingUser}
          departments={departments}
          onClose={() => {
            setShowEditUserModal(false);
            setEditingUser(null);
          }}
          onUserUpdated={() => {
            fetchUsers(); // Refresh the list of users
            setSuccess('User updated successfully!');
          }}
        />
      )}

      {showDeleteConfirmModal && userToDelete && (
        <DeleteConfirmationModal
          user={userToDelete}
          onClose={() => {
            setShowDeleteConfirmModal(false);
            setUserToDelete(null);
          }}
          onConfirmDelete={() => {
            fetchUsers(); // Refresh the list of users
            setSuccess('User deleted successfully!');
          }}
        />
      )}
    </div>
  );
};


export default UserRegistration;