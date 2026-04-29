import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import { supabase } from '../../../lib/supabaseClient';
import { AlertCircle } from 'lucide-react';

const DeleteEmployeeConfirmationModal = ({ employee, onClose, onConfirmDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');
    try {
      const { error: deleteError } = await supabase
        .from('employees')
        .delete()
        .eq('id', employee.id);

      if (deleteError) {
        throw deleteError;
      }

      onConfirmDelete(); // Notify parent component that employee was deleted
      onClose(); // Close modal
    } catch (err) {
      setError(err.message);
      console.error("Delete employee error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-md flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Confirm Employee Deletion</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Are you sure you want to delete employee: <span className="font-medium">{employee?.full_name} ({employee?.employee_number})</span>?
            </p>
          </div>
          <Button variant="ghost" size="sm" iconName="X" onClick={onClose} />
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-destructive flex items-center gap-2">
            <AlertCircle size={20} />
            This action cannot be undone. However, associated historical data (such as past asset loans) will be preserved and marked as unassigned.
          </p>
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-border gap-3">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" loading={isDeleting} disabled={isDeleting} onClick={handleDelete}>
            {isDeleting ? 'Deleting...' : 'Delete Employee'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteEmployeeConfirmationModal;
