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
  Download,
  Eye,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ImportForm() {
  const {
    mainInventory,
    importMainInventory,
    clearMainInventory,
    isLoading,
    error,
    clearError,
    getInventoryStats
  } = useInventory();

  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
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

    const result = await importMainInventory(selectedFile, (progress, total) => {
      // Progress callback could be used for progress bar
      console.log(`Import progress: ${progress}/${total}`);
    });

    setImportResult(result);

    if (result.success) {
      toast.success(`Successfully imported ${result.statistics.processedRows} items`);
      setSelectedFile(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      toast.error(result.error || 'Import failed');
    }
  };

  // Handle clear data
  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all main inventory data? This cannot be undone.')) {
      clearMainInventory();
      toast.success('Main inventory data cleared');
      setImportResult(null);
    }
  };

  // Toggle preview
  const togglePreview = () => {
    setShowPreview(!showPreview);
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import Main Inventory</h1>
          <p className="text-gray-600 mt-1">
            Upload your main inventory CSV file to populate the system
          </p>
        </div>

        <Link
          to="/dashboard"
          className="btn btn-secondary flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Current Status */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Current Status</h2>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                {stats.hasMainInventory ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                )}
                <span className="text-gray-600">
                  {stats.hasMainInventory 
                    ? `${stats.mainInventoryCount} items loaded`
                    : 'No data imported'
                  }
                </span>
              </div>
              
              {stats.lastMainImport && (
                <div className="text-gray-500">
                  Last import: {new Date(stats.lastMainImport).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {stats.hasMainInventory && (
            <div className="flex items-center space-x-2">
              <button
                onClick={togglePreview}
                className="btn btn-secondary btn-sm flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
              </button>
              
              <button
                onClick={handleClearData}
                className="btn btn-error btn-sm flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear Data</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* File Upload Area */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload CSV File</h2>

        {/* File Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-gray-100 rounded-full">
              <Upload className="h-8 w-8 text-gray-600" />
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-1">
                Drop your CSV file here, or click to browse
              </h3>
              <p className="text-sm text-gray-500">
                Supports CSV and Excel files up to 10MB
              </p>
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
              className="btn btn-primary"
              disabled={isLoading}
            >
              Select File
            </button>
          </div>
        </div>

        {/* Selected File Info */}
        {selectedFile && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <File className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-900">{selectedFile.name}</div>
                  <div className="text-sm text-blue-700">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type || 'CSV'}
                  </div>
                </div>
              </div>

              <button
                onClick={handleImport}
                disabled={isLoading}
                className="btn btn-primary flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Import Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Import Results */}
        {importResult && importResult.success && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-900">Import Successful</span>
            </div>
            
            <div className="text-sm text-green-800 space-y-1">
              <div>✓ {importResult.statistics.processedRows} items imported successfully</div>
              {importResult.statistics.duplicates > 0 && (
                <div>⚠ {importResult.statistics.duplicates} duplicates handled</div>
              )}
              {importResult.statistics.errors > 0 && (
                <div>❌ {importResult.statistics.errors} errors encountered</div>
              )}
            </div>

            {(importResult.duplicates?.length > 0 || importResult.errors?.length > 0) && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <button className="text-sm text-green-700 hover:text-green-800 underline">
                  View detailed report
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* File Format Help */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Expected File Format</h2>
        
        <div className="space-y-4 text-sm text-gray-600">
          <p>
            Your CSV file should contain the main inventory data with the following structure:
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg font-mono text-xs overflow-x-auto">
            <div className="font-semibold text-gray-800 mb-2">Expected Columns (starting from row 3):</div>
            <div>A: Facility Name</div>
            <div>B: Product Name</div>
            <div>E: Brand</div>
            <div>G: Strain</div>
            <div>H: Size</div>
            <div>I: SKU</div>
            <div>J: Barcode</div>
            <div>K: BioTrack Code</div>
            <div>L: Quantity</div>
            <div>T: Location</div>
            <div>AB: Distributor</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>First two rows are treated as headers and will be skipped</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Barcode and SKU are required fields</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Duplicates will be handled automatically</span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Preview */}
      {showPreview && stats.hasMainInventory && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Preview</h2>
          
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product Name</th>
                  <th>Brand</th>
                  <th>Barcode</th>
                  <th>BioTrack Code</th>
                  <th>Quantity</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {mainInventory.slice(0, 10).map((item, index) => (
                  <tr key={index}>
                    <td className="font-mono">{item.sku}</td>
                    <td>{item.productName}</td>
                    <td>{item.brand}</td>
                    <td className="font-mono">{item.barcode}</td>
                    <td className="font-mono">{item.bioTrackCode}</td>
                    <td>{item.quantity}</td>
                    <td>{item.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {mainInventory.length > 10 && (
            <div className="mt-4 text-sm text-gray-500 text-center">
              Showing first 10 of {mainInventory.length} items
            </div>
          )}
        </div>
      )}
    </div>
  );
}