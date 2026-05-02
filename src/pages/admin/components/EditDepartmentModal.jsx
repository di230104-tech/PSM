import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../../lib/supabaseClient';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { AlertCircle } from 'lucide-react';

const EditDepartmentModal = ({ department, onClose, onDepartmentUpdated }) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  const [error, setError] = useState('');

  useEffect(() => {
    // Populate form with current department data when modal opens
    if (department) {
      reset({
        name: department.name,
        // Assuming there might be a description field for departments as well.
        // If not, this can be removed.
        // description: department.description,
      });
    }
  }, [department, reset]);

  const onSubmit = async (data) => {
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('departments')
        .update({
          name: data.name,
          // description: data.description, // if description field is present
        })
        .eq('id', department.id);

      if (updateError) {
        throw updateError;
      }

      onDepartmentUpdated(); // Notify parent component that department was updated
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
            <h2 className="text-xl font-semibold text-foreground">Edit Department: {department?.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Modify the details for the selected department.
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

          <div className="bg-muted/50 p-3 rounded-lg border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">System ID</p>
            <p className="text-sm font-mono text-foreground">{department?.id}</p>
          </div>

          <Input
            label="Department Name"
            type="text"
            placeholder="e.g., Engineering"
            {...register('name', { required: 'Department Name is required' })}
            error={errors.name?.message}
          />
          {/* If you have a description field for departments, uncomment this */}
          {/*
          <Input
            label="Description"
            type="text"
            placeholder="e.g., Manages all software development"
            {...register('description')}
            error={errors.description?.message}
          />
          */}

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              loading={isSubmitting} 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating Department...' : 'Update Department'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDepartmentModal;
