import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useInventory } from '../../contexts/InventoryContext.jsx';
import { ValidationHelper } from '../../utils/validation.js';
import { 
  Upload, 
  File, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Loader2,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SweedImportForm() {
  const {
    sweedData,
    importSweedData,
    clearSweedData,
    isLoading,
    error,
    clearError,
    getInventoryStats
  } = useInventory();

  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const fileInputRef = useRef(null);

  const stats = getInventoryStats();

  // Handle file selection
  const handleFileSelect = (file) => {
    const validation = ValidationHelper.validateFile(file);
    
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    setSelectedFile(file);
    setImportResult(null);
    clearError();
    
    // Generate preview data
    generatePreview(file);
  };

  // Generate preview data
  const generatePreview = async (file) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').slice(2, 22); // Skip headers, show first 20 data rows
      const preview = lines.map((line, index) => {
        const columns = line.split(',');
        return {
          row: index + 3,
          product: columns[0] || '',
          brand: columns[1] || '',
          sku: columns[4] || '',
          barcode: columns[5] || '',
          quantity: columns[7] || '',
          shipTo: columns[8] || ''
        };
      }).filter(row => row.sku || row.barcode); // Only show rows with data
      
      setPreviewData(preview);
    } catch (error) {
      console.error('Preview generation error:', error);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    const result = await importSweedData(selectedFile, (progress, total) => {
      console.log(`Import progress: ${progress}/${total}`);
    });

    setImportResult(result);

    if (result.success) {
      toast.success(`Successfully imported ${result.statistics.processedRows} Sweed items`);
      setSelectedFile(null);
      setPreviewData(null);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      toast.error(result.error || 'Import failed');
    }
  };

  // Handle clear data
  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all Sweed report data? This cannot be undone.')) {
      clearSweedData();
      toast.success('Sweed report data cleared');
      setImportResult(null);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-[#15161B] p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#FAFCFB]">Import Sweed Report</h1>
          </div>

          <Link
            to="/dashboard"
            className="bg-[#181B22] text-[#FAFCFB] border border-[#39414E] hover:bg-[#39414E] px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Current Status */}
        <div className="bg-[#181B22] border border-[#39414E] rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#FAFCFB] mb-2">Current Status</h2>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  {stats.hasSweedData ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-[#9FA3AC]" />
                  )}
                  <span className="text-[#9FA3AC]">
                    {stats.hasSweedData 
                      ? `${stats.sweedDataCount} Sweed items loaded`
                      : 'No Sweed data imported'
                    }
                  </span>
                </div>
                
                {stats.lastSweedImport && (
                  <div className="text-[#9FA3AC]">
                    Last import: {new Date(stats.lastSweedImport).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {stats.hasSweedData && (
              <button
                onClick={handleClearData}
                className="bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear Data</span>
              </button>
            )}
          </div>
        </div>

        {/* File Upload Area */}
        <div className="bg-[#181B22] border border-[#39414E] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#FAFCFB] mb-4">Upload Sweed File</h2>

          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-[#86EFAC] bg-[#86EFAC]/10'
                : 'border-[#39414E] hover:border-[#9FA3AC]'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-[#39414E] rounded-full">
                <Upload className="h-8 w-8 text-[#9FA3AC]" />
              </div>
              
              <div>
                <h3 className="font-medium text-[#FAFCFB] mb-1">
                  Upload Sweed File
                </h3>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#86EFAC] text-[#00001C] hover:opacity-90 px-6 py-2 rounded-lg font-medium transition-opacity"
                disabled={isLoading}
              >
                Select File
              </button>
            </div>
          </div>

          {/* Selected File Info */}
          {selectedFile && (
            <div className="mt-4 p-4 bg-[#86EFAC]/10 border border-[#86EFAC]/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <File className="h-5 w-5 text-[#86EFAC]" />
                  <div>
                    <div className="font-medium text-[#FAFCFB]">{selectedFile.name}</div>
                    <div className="text-sm text-[#9FA3AC]">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type || 'CSV'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleImport}
                  disabled={isLoading}
                  className="bg-[#86EFAC] text-[#00001C] hover:opacity-90 px-4 py-2 rounded-lg flex items-center space-x-2 transition-opacity"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Import Sweed Data</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <span className="text-red-400">{error}</span>
              </div>
            </div>
          )}

          {/* Import Results */}
          {importResult && importResult.success && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="font-medium text-green-400">Sweed Import Successful</span>
              </div>
              
              <div className="text-sm text-green-400 space-y-1">
                <div>✓ {importResult.statistics.processedRows} Sweed items imported successfully</div>
                {importResult.statistics.duplicates > 0 && (
                  <div>⚠ {importResult.statistics.duplicates} duplicates handled</div>
                )}
                {importResult.statistics.errors > 0 && (
                  <div>❌ {importResult.statistics.errors} errors encountered</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Data Preview */}
        {previewData && previewData.length > 0 && (
          <div className="bg-[#181B22] border border-[#39414E] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[#FAFCFB] mb-4">Sweed Data Preview</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-[#39414E]">
                    <th className="px-4 py-2 text-left text-sm font-medium text-[#9FA3AC]">Row</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-[#9FA3AC]">Product</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-[#9FA3AC]">Brand</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-[#9FA3AC]">SKU</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-[#9FA3AC]">Barcode</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-[#9FA3AC]">Quantity</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-[#9FA3AC]">Ship To</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 15).map((row, index) => (
                    <tr key={index} className="border-b border-[#39414E]">
                      <td className="px-4 py-2 text-sm text-[#9FA3AC]">{row.row}</td>
                      <td className="px-4 py-2 text-sm text-[#FAFCFB]">{row.product}</td>
                      <td className="px-4 py-2 text-sm text-[#FAFCFB]">{row.brand}</td>
                      <td className="px-4 py-2 text-sm text-[#FAFCFB] font-mono">{row.sku}</td>
                      <td className="px-4 py-2 text-sm text-[#FAFCFB] font-mono">{row.barcode}</td>
                      <td className="px-4 py-2 text-sm text-[#FAFCFB]">{row.quantity}</td>
                      <td className="px-4 py-2 text-sm text-[#FAFCFB]">{row.shipTo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {previewData.length > 15 && (
              <div className="mt-4 text-sm text-[#9FA3AC] text-center">
                Showing first 15 of {previewData.length} preview rows
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}