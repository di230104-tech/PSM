import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import { supabase } from '../../../lib/supabaseClient';
import { AlertCircle, X } from 'lucide-react';

const DeleteLocationConfirmationModal = ({ location, onClose, onConfirmDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');
    try {
      const { error: deleteError } = await supabase
        .from('locations')
        .delete()
        .eq('id', location.id);

      if (deleteError) {
        throw deleteError;
      }

      onConfirmDelete();
      onClose();
    } catch (err) {
      setError(err.message);
      console.error("Delete location error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Confirm Location Deletion</h2>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isDeleting}>
            <X size={20} />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete location: <span className="font-semibold text-foreground">{location?.name}</span>?
          </p>
          
          <div className="p-4 bg-destructive/10 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-destructive shrink-0" size={20} />
            <p className="text-sm text-destructive leading-relaxed">
              This action cannot be undone. Any assets currently assigned to this location will be preserved but marked as unassigned.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-border gap-3">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" loading={isDeleting} disabled={isDeleting} onClick={handleDelete}>
            {isDeleting ? 'Deleting...' : 'Delete Location'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteLocationConfirmationModal;
