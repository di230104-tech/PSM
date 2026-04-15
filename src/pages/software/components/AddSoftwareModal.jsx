import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { supabase } from '../../../lib/supabaseClient';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { AlertCircle, X } from 'lucide-react';

const AddSoftwareModal = ({ onClose, onSoftwareAdded }) => {
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      total_seats: 1,
      annual_cost: 0
    }
  });
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    setError('');

    try {
      const { error: insertError } = await supabase
        .from('software_licenses')
        .insert([{
          name: data.name,
          vendor: data.vendor,
          total_seats: parseInt(data.total_seats),
          annual_cost: parseFloat(data.annual_cost),
          renewal_date: data.renewal_date || null,
          license_key: data.license_key || null
        }]);

      if (insertError) {
        throw insertError;
      }

      onSoftwareAdded('Software added successfully', 'success');
      onClose();

    } catch (err) {
      setError(err.message);
      console.error("Add software error:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Add New Software</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Register a new software subscription or license.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-error/10 text-error p-3 rounded-lg flex items-center gap-2 border border-error/20">
              <AlertCircle size={20} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Software Name"
              type="text"
              placeholder="e.g., Microsoft 365 Business"
              {...register('name', { required: 'Software Name is required' })}
              error={errors.name?.message}
            />

            <Input
              label="Vendor"
              type="text"
              placeholder="e.g., Microsoft"
              {...register('vendor', { required: 'Vendor is required' })}
              error={errors.vendor?.message}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Total Seats"
                type="number"
                placeholder="1"
                {...register('total_seats', { 
                  required: 'Total Seats is required',
                  min: { value: 0, message: 'Cannot be negative' }
                })}
                error={errors.total_seats?.message}
              />

              <Input
                label="Annual Cost ($)"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('annual_cost', { 
                  required: 'Annual Cost is required',
                  min: { value: 0, message: 'Cannot be negative' }
                })}
                error={errors.annual_cost?.message}
              />
            </div>

            <Input
              label="Renewal Date"
              type="date"
              {...register('renewal_date')}
              error={errors.renewal_date?.message}
            />

            <Input
              label="License/Volume Key (Optional)"
              type="text"
              placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
              {...register('license_key')}
            />
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-border">
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              loading={isSubmitting} 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Add Software'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSoftwareModal;
