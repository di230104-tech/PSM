import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { supabase } from '../../../lib/supabaseClient';
import { useSelector } from 'react-redux';
import { logActivity } from '../../../utils/activityLogger';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import { useNavigate } from 'react-router-dom';

const BulkImport = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [parsedData, setParsedData] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const { user: authUser } = useSelector((state) => state.auth);
  const userId = authUser?.id;

  // Fetch suppliers for mapping names to IDs
  React.useEffect(() => {
    const fetchSuppliers = async () => {
      const { data, error } = await supabase.from('suppliers').select('id, company_name');
      if (!error && data) {
        setSuppliers(data);
      }
    };
    fetchSuppliers();
  }, []);

  const onDrop = useCallback(async (acceptedFiles) => {
    setFiles(acceptedFiles);
    setIsParsing(true);
    setParsedData([]);
    setImportResults(null);

    const file = acceptedFiles[0];
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Map CSV headers to Supabase schema in the complete callback
        const mapped = results.data.map(item => {
          // Resolve Supplier ID
          const supplierName = item.Supplier?.trim();
          const foundSupplier = suppliers.find(s => 
            s.company_name.toLowerCase() === supplierName?.toLowerCase()
          );
          
          // Calculate Warranty Months
          const purchaseDate = new Date(item['Purchase Date']);
          const expiryDate = new Date(item['Warranty Expiry']);
          let warrantyMonths = 0;
          if (!isNaN(purchaseDate.getTime()) && !isNaN(expiryDate.getTime())) {
            const yearsDiff = expiryDate.getFullYear() - purchaseDate.getFullYear();
            const monthsDiff = expiryDate.getMonth() - purchaseDate.getMonth();
            warrantyMonths = Math.max(0, (yearsDiff * 12) + monthsDiff);
          }

          const catPrefix = (item.Category || 'GEN').substring(0, 3).toUpperCase();
          const randomId = Math.floor(1000 + Math.random() * 9000);

          return {
            product_name: item['Model Name'],
            category: item.Category,
            serial_number: item['Serial Number'],
            purchase_date: item['Purchase Date'] || null,
            purchase_price: parseFloat(item['Purchase Price']) || 0,
            warranty_months: warrantyMonths,
            supplier_id: foundSupplier ? foundSupplier.id : null,
            status: 'Available',
            asset_tag: `ISD-${catPrefix}-${randomId}`,
            lifespan_years: 3,
          };
        });
        setParsedData(mapped);
        setIsParsing(false);
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        setIsParsing(false);
      }
    });
  }, [suppliers]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  });
  
  const handleImport = async () => {
    if (parsedData.length === 0) return;
    
    setIsImporting(true);
    setImportResults({ success: 0, failed: 0, errors: [] });

    const { data, error } = await supabase
      .from('assets')
      .insert(parsedData)
      .select();
      
    if (error) {
      setImportResults({
        success: 0,
        failed: parsedData.length,
        errors: [error.message]
      });
    } else {
      setImportResults({
        success: data.length,
        failed: parsedData.length - data.length,
        errors: [] // Simplified for bulk insert; for per-row errors, would need to loop
      });
      for (const asset of data) {
        await logActivity(
          'asset_added',
          `Added new asset via bulk import: ${asset.product_name} (${asset.asset_tag})`,
          asset.id,
          userId,
          { source: 'bulk_import' }
        );
      }
    }
    setIsImporting(false);
  };

  return (
    <div>
      {/* Dropzone UI */}
      <div {...getRootProps()} className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
        <input {...getInputProps()} />
        <div className="space-y-4">
          <Icon name="UploadCloud" size={48} className="mx-auto text-muted-foreground" />
          <div>
            <p className="text-foreground font-medium">
              {isParsing ? 'Parsing...' : 'Drop CSV file here or click to browse'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Only *.csv files are accepted.
            </p>
          </div>
        </div>
      </div>
      
      <div className="text-center mt-4">
        <Button 
          variant="link" 
          onClick={() => navigate('/bulk-import-template')}
        >
          Download CSV Template
        </Button>
      </div>

      {/* Preview and Import */}
      {parsedData.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold">Preview Data ({parsedData.length} rows)</h3>
          <div className="mt-4 max-h-60 overflow-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  {parsedData.length > 0 && Object.keys(parsedData[0]).map(key => (
                    <th key={key} className="p-2 text-left">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {parsedData.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="p-2 truncate">{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button onClick={handleImport} loading={isImporting}>
              Confirm Import
            </Button>
          </div>
        </div>
      )}
      
      {/* Import Results */}
      {importResults && (
         <div className="mt-6 p-4 bg-muted/50 rounded-lg">
           <h3 className="font-semibold">Import Complete</h3>
           <p className="text-success">{importResults.success} rows successfully imported.</p>
           <p className="text-error">{importResults.failed} rows failed.</p>
           {importResults.errors.length > 0 && (
             <div className="mt-2 text-xs text-error">
               <h4 className="font-bold">Errors:</h4>
               <ul className="list-disc list-inside">
                 {importResults.errors.slice(0, 10).map((err, i) => (
                   <li key={i}>{err}</li>
                 ))}
               </ul>
               {importResults.errors.length > 10 && <p>...</p>}
             </div>
           )}
         </div>
      )}
    </div>
  );
};

export default BulkImport;
