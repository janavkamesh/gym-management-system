'use client';

import { useState, useRef } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { previewMembersCSV, executeMembersImport } from '@/lib/actions/members';
import { useToast } from './ToastProvider';
import { ModalTransition } from './ui/ModalTransition';
import { ModalHeader } from './ui/ModalHeader';

export default function ImportCSVModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isValidated, setIsValidated] = useState(false);
  const { showToast } = useToast();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        showToast('Please upload a valid CSV file', 'error');
        return;
      }
      setFile(selectedFile);
      setPreviewData([]);
      setIsValidated(false);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];
    
    // Basic CSV parse (assuming no commas inside quotes for simplicity in this MVP)
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || '';
      });
      return row;
    });
  };

  const handlePreview = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    try {
      const text = await file.text();
      const parsedRows = parseCSV(text);
      
      if (parsedRows.length === 0) {
        showToast('CSV is empty or invalid format', 'error');
        setIsProcessing(false);
        return;
      }

      const results = await previewMembersCSV(parsedRows);
      setPreviewData(results);
      setIsValidated(true);
    } catch (error) {
      showToast('Error parsing CSV', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    const validRows = previewData
      .filter(row => row.status === 'Pass')
      .map(row => row.validatedData);

    if (validRows.length === 0) {
      showToast('No valid rows to import', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Import timed out after 30 seconds. Please check if members were partially imported.')), 30000);
      });
      
      const count = await Promise.race([
        executeMembersImport(validRows),
        timeoutPromise
      ]);
      
      const warningCount = previewData.filter(row => row.status === 'Pass' && row.warning).length;
      const msg = warningCount > 0 
        ? `Successfully imported ${count} members (${warningCount} warnings)`
        : `Successfully imported ${count} members`;
      showToast(msg, 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      const message = error?.message || 'Failed to import members. The server may have encountered an error.';
      showToast(message, 'error');
      setIsProcessing(false);
    }
  };

  const validCount = previewData.filter(r => r.status === 'Pass').length;

  return (
    <ModalTransition 
      isOpen={isOpen} 
      onClose={onClose}
      containerClassName="bg-white rounded-t-2xl md:rounded-lg shadow-2xl w-full max-w-4xl overflow-hidden md:animate-fade-in max-h-[90vh] flex flex-col"
    >
      <ModalHeader title="Import Members (CSV)" onClose={onClose} />

        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1">
            {!isValidated ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                <Upload size={48} className="text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Upload CSV File</h3>
                <p className="text-sm text-slate-500 mb-3 text-center max-w-lg">
                  Expected columns: <span className="font-mono text-slate-700 bg-slate-200 px-1 rounded">name</span>, <span className="font-mono text-slate-700 bg-slate-200 px-1 rounded">phone</span>, <span className="font-mono text-slate-700 bg-slate-200 px-1 rounded">plan_name</span>, <span className="font-mono text-slate-700 bg-slate-200 px-1 rounded">amount</span>, <span className="font-mono text-slate-700 bg-slate-200 px-1 rounded">join_date</span>, <span className="font-mono text-slate-700 bg-slate-200 px-1 rounded">expiry_date</span>, <span className="font-mono text-slate-700 bg-slate-200 px-1 rounded">gender (optional)</span>, <span className="font-mono text-slate-700 bg-slate-200 px-1 rounded">uid (optional)</span>
                </p>
                <a 
                  href={`data:text/csv;charset=utf-8,${encodeURIComponent('name,phone,plan_name,amount,join_date,expiry_date,gender,uid\nJane Doe,9876543210,3 Months,13500,2024-01-01,2024-04-01,Female,')}`} 
                  download="sample_members.csv" 
                  className="mb-6 text-sm text-blue-600 hover:underline font-medium"
                >
                  Download Sample CSV
                </a>
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm active:scale-95"
                >
                  Select File
                </button>
                {file && (
                  <div className="mt-4 text-sm font-medium text-blue-600 flex items-center gap-2">
                    <CheckCircle2 size={16} /> {file.name}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="text-sm">
                    <span className="font-medium text-slate-900">{previewData.length} total rows</span> • 
                    <span className="text-green-600 font-medium ml-2">{validCount} valid</span> • 
                    <span className="text-red-500 font-medium ml-2">{previewData.filter(r => r.status === 'Failed').length} failed</span> • 
                    <span className="text-yellow-600 font-medium ml-2">{previewData.filter(r => r.status === 'Skipped').length} skipped</span>
                  </div>
                  <button 
                    onClick={() => { setFile(null); setIsValidated(false); setPreviewData([]); }}
                    className="text-sm text-blue-600 hover:underline font-medium"
                  >
                    Upload different file
                  </button>
                </div>
                
                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">Row</th>
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">UID</th>
                        <th className="px-4 py-3 font-medium">Phone</th>
                        <th className="px-4 py-3 font-medium">Plan</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewData.map((row, idx) => (
                        <tr key={idx} className={row.status === 'Failed' ? 'bg-red-50/30' : row.status === 'Skipped' ? 'bg-yellow-50/30' : ''}>
                          <td className="px-4 py-3 text-slate-500">{row.row}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{row.data.name || '-'}</td>
                          <td className="px-4 py-3 text-slate-600">{row.data.uid || '-'}</td>
                          <td className="px-4 py-3 text-slate-600">{row.data.phone || '-'}</td>
                          <td className="px-4 py-3 text-slate-600">{row.data.plan_name || '-'}</td>
                          <td className="px-4 py-3">
                            {row.status === 'Pass' && <span className="inline-flex items-center gap-1 text-green-600 font-medium text-xs bg-green-50 px-2 py-1 rounded"><CheckCircle2 size={12}/> Pass</span>}
                            {row.status === 'Failed' && <span className="inline-flex items-center gap-1 text-red-600 font-medium text-xs bg-red-50 px-2 py-1 rounded"><AlertCircle size={12}/> Fail</span>}
                            {row.status === 'Skipped' && <span className="inline-flex items-center gap-1 text-yellow-600 font-medium text-xs bg-yellow-50 px-2 py-1 rounded"><Info size={12}/> Skip</span>}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{row.reason || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 bg-white shrink-0 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg min-h-12 md:min-h-0 transition-colors touch-manipulation"
            >
              Cancel
            </button>
            {!isValidated ? (
              <button
                type="button"
                onClick={handlePreview}
                disabled={!file || isProcessing}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg min-h-12 md:min-h-0 shadow-sm transition-colors active:scale-95 duration-120 touch-manipulation"
              >
                {isProcessing ? 'Processing...' : 'Preview Import'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={validCount === 0 || isProcessing}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg min-h-12 md:min-h-0 shadow-sm transition-colors active:scale-95 duration-120 touch-manipulation"
              >
                {isProcessing ? 'Importing...' : `Confirm Import (${validCount})`}
              </button>
            )}
          </div>
        </div>
    </ModalTransition>
  );
}
