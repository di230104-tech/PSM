// src/pages/admin/components/BulkImportEmployees.jsx
import React, { useState } from 'react';
import { X, Upload, Download, AlertCircle } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Papa from 'papaparse'; 
import { supabase } from '../../../lib/supabaseClient'; // Import supabase

const BulkImportEmployees = ({ isOpen, onClose, onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null); // To show a preview of the CSV data

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError('');

      // Optional: Read and preview CSV
      Papa.parse(selectedFile, {
        header: true,
        preview: 5, // Show first 5 rows
        skipEmptyLines: true,
        complete: (results) => {
          setPreview(results.data);
        },
        error: (err) => {
          setError(`CSV parsing error: ${err.message}`);
          setPreview(null);
        }
      });
    } else {
      setFile(null);
      setPreview(null);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "full_name,email,employee_id,department_id\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'employee_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = () => {
    if (!file) {
      setError('Please select a CSV file to import.');
      return;
    }

    setImporting(true);
    setError('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const employeesToInsert = results.data.map(row => ({
          full_name: row.full_name,
          email: row.email,
          employee_id: row.employee_id,
          department_id: parseInt(row.department_id) // Ensure department_id is integer
        }));

        if (employeesToInsert.length === 0) {
          setError('No valid data found in the CSV file.');
          setImporting(false);
          return;
        }

        try {
          const { error: insertError } = await supabase.from('employees').insert(employeesToInsert);

          if (insertError) {
            throw insertError;
          }

          onImportComplete('Employees imported successfully!');
          onClose();
        } catch (err) {
          setError(`Error importing data: ${err.message}`);
        } finally {
          setImporting(false);
        }
      },
      error: (err) => {
        setError(`CSV parsing error: ${err.message}`);
        setImporting(false);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-foreground">Bulk Import Employees</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} /> {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-primary/10 file:text-primary
                hover:file:bg-primary/20"
              disabled={importing}
            />
            <Button
              variant="outline"
              iconName="Download"
              onClick={handleDownloadTemplate}
              disabled={importing}
            >
              Template
            </Button>
          </div>

          {preview && (
            <div className="mt-4 p-4 border border-border rounded-lg bg-muted/50">
              <h3 className="text-lg font-medium mb-2">CSV Preview (First 5 rows)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border text-sm">
                  <thead className="bg-muted">
                    <tr>
                      {Object.keys(preview[0] || {}).map(header => (
                        <th key={header} className="px-4 py-2 text-left font-medium text-muted-foreground">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-t border-border">
                        {Object.values(row).map((value, colIndex) => (
                          <td key={colIndex} className="px-4 py-2 text-foreground">{value}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/25">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={importing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            loading={importing}
            disabled={importing || !file}
            iconName="Upload"
          >
            {importing ? 'Importing...' : 'Import Employees'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkImportEmployees;
