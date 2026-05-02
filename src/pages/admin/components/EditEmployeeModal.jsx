import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { supabase } from '../../../lib/supabaseClient';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { AlertCircle } from 'lucide-react';

const EditEmployeeModal = ({ employee, departments: initialDepartments, onClose, onEmployeeUpdated }) => {
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm();
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState(initialDepartments || []);
  const [isLoadingDepts, setIsLoadingDepts] = useState(false);

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
    // Populate form with current employee data when modal opens
    if (employee) {
      reset({
        fullName: employee.full_name,
        email: employee.email,
        employeeNumber: employee.employee_number,
        department_id: employee.department_id,
      });
    }
  }, [employee, reset]);

  const onSubmit = async (data) => {
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('employees')
        .update({
          full_name: data.fullName,
          email: data.email,
          employee_number: data.employeeNumber,
          department_id: parseInt(data.department_id),
        })
        .eq('id', employee.id);

      if (updateError) {
        throw updateError;
      }

      onEmployeeUpdated(); // Notify parent component that employee was updated
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
            <h2 className="text-xl font-semibold text-foreground">Edit Employee: {employee?.full_name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Modify the details for the selected employee.
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
          <Input
            label="Email"
            type="email"
            placeholder="e.g., john.smith@company.com"
            {...register('email', { pattern: { value: /\S+@\S+$/i, message: 'Invalid email format' } })}
            error={errors.email?.message}
          />
          <Input
            label="Employee Number"
            type="text"
            placeholder="e.g., EMP-001"
            {...register('employeeNumber')}
            error={errors.employeeNumber?.message}
          />
          <Controller
            name="department_id"
            control={control}
            rules={{ required: 'Department is required' }}
            render={({ field }) => (
              <Select
                {...field}
                label="Department"
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
              {isSubmitting ? 'Updating Employee...' : 'Update Employee'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEmployeeModal;
