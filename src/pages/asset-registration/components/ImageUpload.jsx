import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '../../../lib/supabaseClient';
import AppIcon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ImageUpload = ({ onUpload, initialImageUrl = null, bucketName = 'Asset_image' }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(initialImageUrl);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);
    setError(null);

    try {
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // --- Upload to Supabase ---
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }
      
      // --- Get Public URL ---
      const { data: publicUrlData, error: urlError } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      if (urlError) {
        throw urlError;
      }
      
      onUpload(publicUrlData.publicUrl); // Pass the URL to the parent

    } catch (e) {
      console.error('Detailed Upload Error:', e);
      const errorMessage = e.message || 'An unknown error occurred.';
      setError(`Failed to upload image: ${errorMessage}. Please try again.`);
      setPreview(initialImageUrl); // Revert on error
    } finally {
      setUploading(false);
    }
  }, [bucketName, initialImageUrl, onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/gif': ['.gif']
    },
    multiple: false,
  });

  const handleRemoveImage = () => {
    setPreview(null);
    onUpload(null); // Notify parent that image is removed
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-4">
        <AppIcon name="Image" size={20} className="text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Asset Image</h3>
      </div>
      
      {preview ? (
        <div className="relative group">
          <img src={preview} alt="Asset preview" className="w-full h-48 object-cover rounded-lg" />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="destructive"
              size="sm"
              iconName="Trash2"
              onClick={handleRemoveImage}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <AppIcon name="UploadCloud" size={48} className="mx-auto text-muted-foreground" />
            <div>
              <p className="text-foreground font-medium">
                {uploading ? 'Uploading...' : 'Drop image here or click to browse'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Supports: JPG, PNG, GIF (Max 5MB)
              </p>
            </div>
          </div>
        </div>
      )}

      {uploading && <div className="mt-2 text-sm text-primary">Processing image...</div>}
      {error && <div className="mt-2 text-sm text-error">{error}</div>}
    </div>
  );
};

export default ImageUpload;