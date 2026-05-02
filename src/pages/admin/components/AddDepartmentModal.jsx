import React, { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { AlertCircle, X } from 'lucide-react';

const AddDepartmentModal = ({ onClose, onDepartmentAdded }) => {
  const [formData, setFormData] = useState({ id: '', name: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!formData.name.trim()) {
      setError('Department name is required');
      setIsSubmitting(false);
      return;
    }

    try {
      const insertData = {
        name: formData.name.trim()
      };

      // Only include id if it's provided
      if (formData.id.trim()) {
        insertData.id = formData.id.trim();
      }

      const { error: insertError } = await supabase
        .from('departments')
        .insert([insertData]);

      if (insertError) {
        throw insertError;
      }

      onDepartmentAdded();
      onClose();
    } catch (err) {
      setError(err.message);
      console.error("Insert error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-md flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Register Department</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Add a new department to the system.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div>
            <label htmlFor="id" className="block text-sm font-medium text-foreground mb-1">
              Department ID / Code
            </label>
            <Input
              id="id"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              placeholder="e.g., IT-01 or 99"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
              Department Name
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., IT Support"
              required
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              loading={isSubmitting} 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDepartmentModal;
