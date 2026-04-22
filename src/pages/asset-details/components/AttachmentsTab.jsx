import React, { useState, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { supabase } from '../../../lib/supabaseClient';
import { LoadingSpinner } from '../../../components/ui/LoadingState';
import { useSelector } from 'react-redux';

const AttachmentsTab = ({ assetTag, attachments, onSuccess }) => {
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [documentType, setDocumentType] = useState('Invoice');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const { user } = useSelector((state) => state.auth);

  const documentTypes = [
    'Invoice', 
    'Warranty', 
    'User Manual', 
    'Damage Photo', 
    'Purchase Order',
    'Other'
  ];

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i))?.toFixed(2)) + ' ' + sizes?.[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFileIcon = (fileName, fileType) => {
    if (fileType?.startsWith('image/')) return 'Image';
    const extension = fileName?.split('.')?.pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'FileText';
      case 'doc': case 'docx': return 'FileText';
      case 'xls': case 'xlsx': return 'FileSpreadsheet';
      case 'zip': case 'rar': return 'Archive';
      default: return 'File';
    }
  };

  const handleDragOver = (e) => {
    e?.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e?.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e?.preventDefault();
    setDragOver(false);
    const files = Array.from(e?.dataTransfer?.files);
    if (files.length > 0) {
      setSelectedFiles(files);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e?.target?.files);
    if (files.length > 0) {
      setSelectedFiles(files);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `${assetTag}/${fileName}`;

        // 1. Upload to Storage
        const { error: uploadError } = await supabase.storage
          .from('asset_attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Insert into DB
        const { error: dbError } = await supabase
          .from('asset_attachments')
          .insert([{
            asset_tag: assetTag,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type,
            document_type: documentType,
            uploaded_by: user?.id
          }]);

        if (dbError) throw dbError;
      }

      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onSuccess?.();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload files: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`Are you sure you want to delete ${file.file_name}?`)) return;

    try {
      // 1. Delete from Storage
      const { error: storageError } = await supabase.storage
        .from('asset_attachments')
        .remove([file.file_path]);

      if (storageError) throw storageError;

      // 2. Delete from DB
      const { error: dbError } = await supabase
        .from('asset_attachments')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      onSuccess?.();
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file: ' + error.message);
    }
  };

  const handleView = async (file) => {
    const { data } = supabase.storage
      .from('asset_attachments')
      .getPublicUrl(file.file_path);
    
    if (data?.publicUrl) {
      window.open(data.publicUrl, '_blank');
    }
  };

  return (
    <div tabId="attachments" className="space-y-8">
      {/* Upload Section */}
      <div className="bg-muted/30 p-6 rounded-xl border border-border">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Drag & Drop Zone */}
          <div
            className={`
              flex-1 border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
              ${dragOver 
                ? 'border-primary bg-primary/5 shadow-inner' 
                : 'border-border hover:border-muted-foreground bg-card'
              }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Icon name="UploadCloud" size={48} className="mx-auto text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-1">
              {selectedFiles.length > 0 
                ? `${selectedFiles.length} file(s) selected` 
                : 'Click or drag files to this area'
              }
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Support for PDF, DOC, XLS, and Images (Max 10MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            {selectedFiles.length > 0 && (
              <div className="text-sm font-medium text-primary bg-primary/10 py-2 px-4 rounded-full inline-block">
                Ready to upload
              </div>
            )}
          </div>

          {/* Upload Controls */}
          <div className="w-full md:w-64 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Document Type</label>
              <select
                className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                {documentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <Button
              variant="primary"
              className="w-full"
              iconName={isUploading ? null : 'Upload'}
              disabled={selectedFiles.length === 0 || isUploading}
              onClick={handleUpload}
            >
              {isUploading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Uploading...
                </>
              ) : 'Start Upload'}
            </Button>

            {selectedFiles.length > 0 && (
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => {
                  setSelectedFiles([]);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                Clear Selection
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Attachments List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Icon name="Paperclip" size={20} />
          Existing Attachments ({attachments?.length || 0})
        </h3>

        {!attachments || attachments.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="FileQuestion" size={32} className="text-muted-foreground" />
            </div>
            <h4 className="text-lg font-medium text-foreground mb-2">No documents found</h4>
            <p className="text-muted-foreground">Upload invoices, warranties, or manuals to keep them safe.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attachments?.map((file) => (
              <div 
                key={file?.id} 
                className="group flex items-center space-x-4 p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-all shadow-sm"
              >
                {/* File Preview/Icon */}
                <div className="flex-shrink-0 w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden border border-border">
                  {file.file_type?.startsWith('image/') ? (
                    <img 
                      src={`${supabase.storage.from('asset_attachments').getPublicUrl(file.file_path).data.publicUrl}`} 
                      alt={file.file_name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icon name={getFileIcon(file.file_name, file.file_type)} size={32} className="text-muted-foreground" />
                  )}
                </div>
                
                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-foreground truncate text-sm" title={file.file_name}>
                      {file.file_name}
                    </h4>
                    <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                      {file.document_type}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Icon name="Database" size={12} />
                      {formatFileSize(file.file_size)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="Calendar" size={12} />
                      {formatDate(file.created_at)}
                    </span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    iconName="Eye"
                    title="View Document"
                    onClick={() => handleView(file)}
                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    iconName="Trash2"
                    title="Delete Permanently"
                    onClick={() => handleDelete(file)}
                    className="h-8 w-8 text-muted-foreground hover:text-error hover:bg-error/10"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttachmentsTab;
