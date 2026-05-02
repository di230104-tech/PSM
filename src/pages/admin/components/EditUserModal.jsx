import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { supabase } from '../../../lib/supabaseClient';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { AlertCircle } from 'lucide-react';

const EditUserModal = ({ user, departments: initialDepartments, onClose, onUserUpdated }) => {
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm();
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState(initialDepartments || []);
  const [isLoadingDepts, setIsLoadingDepts] = useState(false);

  // Define allowed roles for registration (should match UserRegistration)
  const roles = [
    { value: 'admin', label: 'System Admin' },
    { value: 'it_staff', label: 'IT Staff' }, // Assuming IT Staff role
    { value: 'department_pic', label: 'Department PIC' }, // Assuming Department PIC role
  ];

  useEffect(() => {
    const fetchDepartments = async () => {
      if (initialDepartments && initialDepartments.length > 0) return;
      
      setIsLoadingDepts(true);
      try {
        const { data, error } = await supabase
          .from('departments')
          .select('id, name')
          .order('name');
        
        if (error) throw error;
        setDepartments(data.map(dept => ({ value: dept.id, label: dept.name })));
      } catch (err) {
        console.error("Error fetching departments:", err);
        setError('Failed to load departments');
      } finally {
        setIsLoadingDepts(false);
      }
    };

    fetchDepartments();
  }, [initialDepartments]);

  useEffect(() => {
    // Populate form with current user data when modal opens
    if (user) {
      reset({
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        department_id: user.department_id,
      });
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    setError('');

    try {
      // 1. Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          role: data.role,
          department_id: parseInt(data.department_id),
        })
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      // If email is changed, it requires a different flow in Supabase or admin privileges
      // For now, we are not allowing email change from this modal for simplicity and security.
      // If needed, supabase.auth.admin.updateUserById(user.id, { email: data.email }); would be used.

      onUserUpdated(); // Notify parent component that user was updated
      onClose(); // Close modal

    } catch (err) {
      setError(err.message);
      console.error("Update error:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Edit User: {user?.full_name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Modify the details for the selected user.
            </p>
          </div>
          <Button variant="ghost" size="sm" iconName="X" onClick={onClose} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <Input
            label="Full Name"
            type="text"
            placeholder="e.g., John Smith"
            {...register('fullName', { required: 'Full Name is required' })}
            error={errors.fullName?.message}
          />
          {/* Email field is read-only as changing it for other users is complex */}
          <Input
            label="Email (Login ID)"
            type="email"
            readOnly
            disabled
            value={user?.email}
            className="bg-muted-foreground/10 cursor-not-allowed"
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
                placeholder={isLoadingDepts ? "Loading departments..." : "Select a department..."}
                error={errors.department_id?.message}
                disabled={isLoadingDepts}
              />
            )}
          />

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              loading={isSubmitting} 
              disabled={isSubmitting || isLoadingDepts}
            >
              {isSubmitting ? 'Updating User...' : 'Update User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
