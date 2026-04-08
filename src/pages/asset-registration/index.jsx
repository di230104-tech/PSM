import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../../lib/supabaseClient';
import { NotificationContainer } from '../../components/ui/NotificationToast';
import AssetDetailsSection from './components/AssetDetailsSection';
import FinancialSection from './components/FinancialSection';
import ImageUpload from './components/ImageUpload';
import Button from '../../components/ui/Button';
import { useSelector } from 'react-redux'; // Import useSelector
import { logActivity } from '../../utils/activityLogger'; // Import logActivity
import BulkImport from './components/BulkImport'; // Import BulkImport

// --- 1. Zod Validation Schema ---
const assetRegistrationSchema = z.object({
  product_name: z.string().min(3, { message: 'Asset name must be at least 3 characters long' }),
  category: z.string().min(1, "Category is required"),
  serial_number: z.string().regex(/^[a-zA-Z0-9]+$/, { message: 'Serial number must be alphanumeric' }),
  model: z.string().optional(),
  purchase_date: z.coerce.date(),
  purchase_price: z.coerce.number().positive({ message: 'Price must be a positive number' }),
  warranty_months: z.coerce.number().int().min(0, { message: 'Warranty must be a positive number' }),
  supplier_id: z.string().min(1, "Supplier is required"),
  image_url: z.string().url().optional().nullable(),
  lifespan_years: z.preprocess((a) => parseInt(String(a)) || 0, z.number().int().min(0)),
  status: z.string().optional(),
}).refine(data => {
    if (data.purchase_date && data.warranty_months > 0) {
        const expiryDate = new Date(data.purchase_date);
        expiryDate.setMonth(expiryDate.getMonth() + data.warranty_months);
        return expiryDate > new Date();
    }
    return true;
}, {
    message: "Warranty expiry date must be in the future",
    path: ["warranty_months"],
});

// Draft schema
const draftAssetSchema = z.object({
  product_name: z.string().min(1, "Asset Name is required for drafts"),
  category: z.string().optional(),
  serial_number: z.string().optional(),
  model: z.string().optional(),
  purchase_date: z.string().optional(),
  purchase_price: z.preprocess((a) => parseFloat(String(a)) || 0, z.number().min(0).optional()),
  warranty_months: z.preprocess((a) => parseInt(String(a)) || 0, z.number().int().min(0).optional()),
  supplier_id: z.string().optional(),
  image_url: z.string().url().optional().nullable(),
  lifespan_years: z.preprocess((a) => parseInt(String(a)) || 0, z.number().int().min(0).optional()),
  status: z.string().optional(),
});

const AssetRegistration = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assetTag = searchParams.get('tag');
  const mode = searchParams.get('mode'); // Get mode from URL
  const isEditMode = assetTag !== null;
  const isBulkMode = mode === 'bulk';

  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [imageUrl, setImageUrl] = useState(null);
  const [asset, setAsset] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [selectedDraftId, setSelectedDraftId] = useState(null);

  const { register, handleSubmit, reset, setValue, control, formState: { errors, isSubmitting }, getValues } = useForm({
    resolver: zodResolver(assetRegistrationSchema),
    defaultValues: { 
      category: 'Laptop', 
      warranty_months: 12, 
      lifespan_years: 3, 
      purchase_price: 0
    }
  });

  const { user: authUser } = useSelector((state) => state.auth); // Get user from Redux store
  const userId = authUser?.id;

  // --- Fetch Reference Data & Asset Data for Editing ---
  useEffect(() => {
    const fetchReferenceData = async () => {
      const { data: supps, error: suppsError } = await supabase.from('suppliers').select('id, company_name');
      if (suppsError) console.error("Error fetching suppliers:", suppsError);

      console.log("Raw suppliers data from Supabase:", supps);
      if (supps) {
        const processedSupps = supps.map(s => ({ value: s.id.toString(), label: s.company_name }));
        setSuppliers(processedSupps);
        console.log("Processed suppliers for dropdown:", processedSupps);
      }
    };

    const fetchAssetForEdit = async () => {
      if (!isEditMode) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('assets').select('*').eq('asset_tag', assetTag).single();
        if (error) throw error;
        if (data) {
          setAsset(data);
          // Format purchase_date for the date input (YYYY-MM-DD)
          const formattedData = {
            ...data,
            purchase_date: data.purchase_date ? new Date(data.purchase_date).toISOString().split('T')[0] : '',
            supplier_id: String(data.supplier_id),
            lifespan_years: data.lifespan_years || 3,
          };
          reset(formattedData);
          if (data.image_url) {
            setImageUrl(data.image_url);
            setValue('image_url', data.image_url);
          }
        }
      } catch (error) {
        console.error("Error fetching asset for edit:", error);
        addNotification('Failed to load asset data.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    if (!isBulkMode) {
      fetchReferenceData();
      fetchAssetForEdit();
      fetchDrafts();
    }
  }, [assetTag, isEditMode, isBulkMode, reset, setValue]);

  const fetchDrafts = async () => {
    const { data, error } = await supabase
      .from('draft_assets')
      .select('*')
      .eq('user_id', userId);
    if (error) {
      console.error('Error fetching drafts:', error);
    } else {
      setDrafts(data);
    }
  };

  const addNotification = (message, type) => {
    setNotifications(prev => [...prev, { id: Date.now(), message, type }]);
  };
  
  const handleImageUpload = (url) => {
    setImageUrl(url);
    setValue('image_url', url);
  };

  const handleSelectDraft = (draft) => {
    setSelectedDraftId(draft.id);
    reset(draft);
    setImageUrl(draft.image_url);
  };

  const handleDeleteDraft = async (draftId) => {
    const { error } = await supabase.from('draft_assets').delete().eq('id', draftId);
    if (error) {
      addNotification('Error deleting draft.', 'error');
    } else {
      addNotification('Draft deleted successfully.', 'success');
      setDrafts(drafts.filter(d => d.id !== draftId));
    }
  };

  const handleSaveAsDraft = async () => {
    const formData = getValues();
    const result = draftAssetSchema.safeParse(formData);

    if (!result.success) {
      // Show validation errors for draft
      console.error("Draft validation errors:", result.error);
      addNotification("Asset Name is required to save a draft.", "error");
      return;
    }
    
    setIsLoading(true);
    const assetData = {
      product_name: formData.product_name,
      category: formData.category,
      serial_number: formData.serial_number,
      model: formData.model,
      purchase_date: formData.purchase_date || null,
      purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
      warranty_months: formData.warranty_months ? parseInt(formData.warranty_months) : null,
      supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
      image_url: formData.image_url,
      lifespan_years: formData.lifespan_years ? parseInt(formData.lifespan_years) : null,
      user_id: userId,
    };

    try {
      if (selectedDraftId) {
        // --- UPDATE DRAFT ---
        const { error } = await supabase.from('draft_assets').update(assetData).eq('id', selectedDraftId);
        if (error) throw error;
        addNotification('Draft updated successfully!', 'success');
        fetchDrafts(); // Refresh drafts list
      } else {
        // --- INSERT DRAFT ---
        const { data, error } = await supabase.from('draft_assets').insert(assetData).select().single();
        if (error) throw error;
        addNotification(`Success! Asset draft saved.`, 'success');
        reset();
        setImageUrl(null);
        fetchDrafts(); // Refresh drafts list
      }
    } catch (error) {
      console.error("Draft Submission Error:", error);
      addNotification(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handle Form Submit (Create or Update) ---
  const onSubmit = async (formData) => {
    setIsLoading(true);

    const assetData = {
      product_name: formData.product_name,
      category: formData.category,
      serial_number: formData.serial_number,
      model: formData.model,
      purchase_date: formData.purchase_date || null,
      purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
      warranty_months: formData.warranty_months ? parseInt(formData.warranty_months) : null,
      supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
      image_url: formData.image_url,
      lifespan_years: formData.lifespan_years ? parseInt(formData.lifespan_years) : null,
      status: formData.status || 'in_storage',
    };

    try {
      if (isEditMode) {
        // --- UPDATE ---
        const { error } = await supabase.from('assets').update(assetData).eq('asset_tag', assetTag);
        if (error) throw error;
        // Log activity for asset update
        await logActivity(
          'asset_updated',
          `Updated asset: ${assetData.product_name} (${assetData.serial_number})`,
          assetTag, 
          userId,
          { changes: assetData } // Log the changes made
        );
        navigate('/asset-list', { state: { message: 'Asset details updated successfully!' } });
      } else {
        // --- INSERT ---
        const asset_tag = `ISD-${assetData.category.substring(0,3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const { data, error } = await supabase.from('assets').insert({ ...assetData, asset_tag, status: 'in_storage' }).select().single();
        if (error) throw error;

        // If this was a draft, delete it
        if (selectedDraftId) {
          await supabase.from('draft_assets').delete().eq('id', selectedDraftId);
        }

        // Log activity for asset added
        await logActivity(
          'asset_added',
          `Added new asset: ${assetData.product_name} (${asset_tag})`,
          data.asset_tag, 
          userId,
          { new_asset_data: assetData }
        );
        addNotification(`Success! Asset ${asset_tag} registered.`, 'success');
        reset();
        setImageUrl(null);
        setSelectedDraftId(null);
        fetchDrafts();
      }
    } catch (error) {
      console.error("Submission Error:", error);
      addNotification(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isBulkMode) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bulk Import Assets</h1>
            <p className="text-muted-foreground">Upload a CSV file to add multiple assets at once.</p>
          </div>
        </div>
        <BulkImport />
        <NotificationContainer notifications={notifications} onRemove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{isEditMode ? 'Edit Asset' : 'Register New Asset'}</h1>
          <p className="text-muted-foreground">{isEditMode ? 'Update the details of the existing asset.' : 'Add new equipment to the live database.'}</p>
        </div>
        {!isEditMode && ( // Only show button when not in edit mode
          <Button
            variant="outline"
            iconName="Upload"
            onClick={() => navigate('/asset-registration?mode=bulk')} // Navigate to bulk import mode
          >
            Bulk Import
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <AssetDetailsSection register={register} errors={errors} control={control} />
        
        <FinancialSection 
          register={register} errors={errors} 
          suppliers={suppliers}
          control={control}
          isEditMode={isEditMode}
          asset={asset}
        />

        <ImageUpload onUpload={handleImageUpload} initialImageUrl={imageUrl} />

        <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => navigate('/asset-list')}>Cancel</Button>
            {!isEditMode && <Button type="button" variant="secondary" onClick={handleSaveAsDraft}>{selectedDraftId ? 'Update Draft' : 'Save as Draft'}</Button>}
            <Button type="submit" loading={isSubmitting}>{isEditMode ? 'Save Changes' : 'Register Asset'}</Button>
        </div>
      </form>

      {!isEditMode && !isBulkMode && drafts.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Your Drafts</h2>
          <div className="space-y-2">
            {drafts.map(draft => (
              <div key={draft.id} className="p-4 bg-muted/50 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium">{draft.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Saved on {new Date(draft.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Button variant="outline" size="sm" onClick={() => handleSelectDraft(draft)}>
                    Load Draft
                  </Button>
                  <Button variant="destructive" size="sm" className="ml-2" onClick={() => handleDeleteDraft(draft.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <NotificationContainer notifications={notifications} onRemove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />
    </div>
  );
};


export default AssetRegistration;
