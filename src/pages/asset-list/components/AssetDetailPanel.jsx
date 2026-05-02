import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import AppImage from '../../../components/AppImage';
import { supabase } from '../../../lib/supabaseClient';
import { formatAssetStatus } from '../../../utils/formatters';
import { useSelector } from 'react-redux'; // Import useSelector
import { logActivity } from '../../../utils/activityLogger'; // Import logActivity

const AssetDetailPanel = ({ asset, onClose, onEdit, onAssetUpdate }) => {
  if (!asset) return null;
  const [isUploading, setIsUploading] = useState(false);
  const { user: authUser } = useSelector((state) => state.auth); // Get user from Redux store
  const userId = authUser?.id;

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const fileName = `${asset.asset_tag}-${Date.now()}-${file.name}`;
    
    try {
      // First, attempt to remove the old image if one exists
      if (asset.image_url) {
        const oldImageKey = asset.image_url.split('/').pop();
        await supabase.storage.from('Asset_image').remove([oldImageKey]);
      }

      // Upload the new image
      const { error: uploadError } = await supabase.storage
        .from('Asset_image')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL of the newly uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('Asset_image')
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData.publicUrl;

      // Update the asset record in the database with the new URL
      const { data: updatedAsset, error: dbError } = await supabase
        .from('assets')
        .update({ image_url: publicUrl })
        .eq('asset_tag', asset.asset_tag)
        .select()
        .single();

      if (dbError) throw dbError;
      
      if (onAssetUpdate) {
        onAssetUpdate(updatedAsset);
      }

      // Log the activity
      await logActivity(
        'asset_image_updated',
        `Updated image for ${asset.product_name} (${asset.asset_tag})`,
        asset.asset_tag,
        userId, // Pass the userId here
        { previous_image_url: asset.image_url, new_image_url: publicUrl }
      );

    } catch (error) {
      console.error('Error uploading image:', error);
      // You might want to show a notification to the user
    } finally {
      setIsUploading(false);
    }
  };



  const getStatusColor = (status) => {
    switch (status) {
      case 'In Use': return 'bg-green-100 text-green-800 border-green-200';
      case 'Available': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'In Repair': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Broken': return 'bg-red-100 text-red-800 border-red-200';
      case 'Retired': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const DetailItem = ({ label, value, className = '' }) => (
    <div className={`py-3 ${className}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || '-'}</p>
    </div>
  );

  return (
    <>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[100]"
        onClick={onClose}
      />
      <motion.div
        key="panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border z-[100] flex flex-col"
      >
          {/* Header */}
          <header className="p-6 border-b border-border">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <Icon name="Package" size={24} className="text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{asset.product_name}</h2>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-muted-foreground font-mono">{asset.asset_tag}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(asset.status)}`}>
                    {formatAssetStatus(asset.status)}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Image Section */}
          <div className="p-6">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative group">
                  <AppImage 
                      src={asset.image_url} 
                      alt={asset.product_name}
                      className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg z-10">
                      <input
                          type="file"
                          id="imageUpload"
                          className="hidden"
                          onChange={handleImageUpload}
                          accept="image/*"
                          disabled={isUploading}
                      />
                      <label htmlFor="imageUpload" className="cursor-pointer">
                          <Button variant="secondary" iconName="Upload" disabled={isUploading}>
                              {isUploading ? 'Uploading...' : 'Change Image'}
                          </Button>
                      </label>
                  </div>
              </div>
          </div>

          {/* Details */}
          <div className="flex-1 px-6 pb-6 overflow-y-auto">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Asset Details</h3>
            <div className="grid grid-cols-2 gap-x-6 divide-y divide-border">
              <DetailItem label="Category" value={asset.category} />
              <DetailItem label="Serial Number" value={asset.serial_number} />
              <DetailItem label="Department" value={asset.departments?.name} />
              <DetailItem label="Supplier" value={asset.suppliers?.company_name} />
              <DetailItem label="Contact person" value={asset.suppliers?.contact_person} />
              <DetailItem label="Contact number" value={asset.suppliers?.phone} />
              <DetailItem 
                label="Purchase Date" 
                value={asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '-'}
              />
              <DetailItem 
                label="Purchase Price"
                value={asset.purchase_price ? `RM ${asset.purchase_price.toLocaleString()}` : '-'}
              />
              <DetailItem label="Warranty" value={asset.warranty_months ? `${asset.warranty_months} months` : '-'} />
            </div>
            <div className="mt-6 text-center text-sm text-muted-foreground">
               No additional details or recent activity to show.
            </div>
          </div>

          {/* Footer */}
          <footer className="p-6 border-t border-border bg-muted/30">
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Close</Button>
              <Button onClick={onEdit}>Edit Asset</Button>
            </div>
          </footer>
        </motion.div>
      </>
  );
};

export default AssetDetailPanel;

