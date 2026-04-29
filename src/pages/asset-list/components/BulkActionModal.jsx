import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

import { formatAssetStatus } from '../../../utils/formatters';

const BulkActionModal = ({ 
  isOpen, 
  onClose, 
  selectedAssets = [], 
  actionType, 
  onConfirm,
  locations = [] // Add locations prop
}) => {
  const [formData, setFormData] = useState({
    newStatus: '',
    newLocation: '',
    assignedUser: '',
    notes: ''
  });

  if (!isOpen) return null;

  const statusOptions = [
    { value: 'checked_out', label: formatAssetStatus('checked_out') },
    { value: 'in_storage', label: formatAssetStatus('in_storage') },
    { value: 'in_repair', label: formatAssetStatus('in_repair') },
    { value: 'retired', label: formatAssetStatus('retired') },
    { value: 'lost', label: formatAssetStatus('lost') }
  ];

  const locationOptions = locations.map(loc => ({
    value: loc.id || loc.value,
    label: loc.name || loc.label
  }));

  const userOptions = [
    { value: 'john.doe', label: 'John Doe - IT Department' },
    { value: 'jane.smith', label: 'Jane Smith - Finance' },
    { value: 'mike.johnson', label: 'Mike Johnson - Marketing' },
    { value: 'sarah.wilson', label: 'Sarah Wilson - HR' },
    { value: 'david.brown', label: 'David Brown - Operations' }
  ];

  const getActionTitle = () => {
    switch (actionType) {
      case 'update_status':
        return 'Update Status';
      case 'transfer_location':
        return 'Transfer Location';
      case 'assign_user':
        return 'Assign to User';
      case 'generate_qr':
        return 'Generate QR Codes';
      case 'export_selected':
        return 'Export Selected Assets';
      default:
        return 'Bulk Action';
    }
  };

  const getActionDescription = () => {
    const count = selectedAssets?.length;
    switch (actionType) {
      case 'update_status':
        return `Update the status for ${count} selected asset${count > 1 ? 's' : ''}`;
      case 'transfer_location':
        return `Transfer ${count} selected asset${count > 1 ? 's' : ''} to a new location`;
      case 'assign_user':
        return `Assign ${count} selected asset${count > 1 ? 's' : ''} to a user`;
      case 'generate_qr':
        return `Generate and download QR codes for ${count} selected asset${count > 1 ? 's' : ''}`;
      case 'export_selected':
        return `Export ${count} selected asset${count > 1 ? 's' : ''} to CSV file`;
      default:
        return `Perform action on ${count} selected asset${count > 1 ? 's' : ''}`;
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    onConfirm({
      actionType,
      selectedAssets,
      formData
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderActionForm = () => {
    switch (actionType) {
      case 'update_status':
        return (
          <div className="space-y-4">
            <Select
              label="New Status"
              options={statusOptions}
              value={formData?.newStatus}
              onChange={(value) => handleInputChange('newStatus', value)}
              required
              placeholder="Select new status"
            />
            <Input
              label="Notes (Optional)"
              type="text"
              placeholder="Add a note about this status change"
              value={formData?.notes}
              onChange={(e) => handleInputChange('notes', e?.target?.value)}
            />
          </div>
        );

      case 'transfer_location':
        return (
          <div className="space-y-4">
            <Select
              label="New Location"
              options={locationOptions}
              value={formData?.newLocation}
              onChange={(value) => handleInputChange('newLocation', value)}
              required
              placeholder="Select new location"
            />
            <Input
              label="Transfer Notes (Optional)"
              type="text"
              placeholder="Add a note about this transfer"
              value={formData?.notes}
              onChange={(e) => handleInputChange('notes', e?.target?.value)}
            />
          </div>
        );

      case 'assign_user':
        return (
          <div className="space-y-4">
            <Select
              label="Assign to User"
              options={userOptions}
              value={formData?.assignedUser}
              onChange={(value) => handleInputChange('assignedUser', value)}
              required
              searchable
              placeholder="Select user"
            />
            <Input
              label="Assignment Notes (Optional)"
              type="text"
              placeholder="Add a note about this assignment"
              value={formData?.notes}
              onChange={(e) => handleInputChange('notes', e?.target?.value)}
            />
          </div>
        );

      case 'generate_qr':
        return (
          <div className="text-center py-4">
            <Icon name="QrCode" size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              QR codes will be generated and downloaded as a ZIP file containing individual PNG files for each asset.
            </p>
          </div>
        );

      case 'export_selected':
        return (
          <div className="text-center py-4">
            <Icon name="Download" size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Selected assets will be exported to a CSV file with all available details.
            </p>
          </div>
        );

      default:
        return (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Please confirm this action.
            </p>
          </div>
        );
    }
  };

  const isFormValid = () => {
    switch (actionType) {
      case 'update_status':
        return formData?.newStatus !== '';
      case 'transfer_location':
        return formData?.newLocation !== '';
      case 'assign_user':
        return formData?.assignedUser !== '';
      case 'generate_qr': case'export_selected':
        return true;
      default:
        return true;
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-400 flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-lg shadow-modal w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {getActionTitle()}
              </h2>
              <p className="text-sm text-muted-foreground">
                {getActionDescription()}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              iconName="X"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            />
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              {renderActionForm()}
            </div>

            {/* Footer */}
            <div className="flex space-x-3 p-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={!isFormValid()}
                className="flex-1"
              >
                Confirm Action
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default BulkActionModal;
