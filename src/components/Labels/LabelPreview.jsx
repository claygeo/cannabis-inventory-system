import React, { useState } from 'react';
import { X, Download, Printer, Eye } from 'lucide-react';
import UlineS5627Label from './UlineS5627Label.jsx';
import toast from 'react-hot-toast';

export default function LabelPreview({ item, enhancedData, user, onClose }) {
  const [scale, setScale] = useState(1);
  const [showMultiple, setShowMultiple] = useState(false);

  // Generate labels based on quantity
  const generateLabels = () => {
    const quantity = parseInt(enhancedData.labelQuantity) || 1;
    const labels = [];
    
    for (let i = 1; i <= quantity; i++) {
      labels.push({
        ...item,
        enhancedData,
        labelNumber: i,
        totalLabels: quantity,
        user: user?.username || 'Unknown',
        timestamp: new Date()
      });
    }
    
    return labels;
  };

  const labels = generateLabels();

  // Handle print
  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  // Handle PDF generation (placeholder - would integrate with jsPDF)
  const handleDownloadPDF = () => {
    toast.success('PDF generation would be implemented here with jsPDF');
    // TODO: Implement PDF generation using jsPDF
  };

  // Handle scale change
  const handleScaleChange = (newScale) => {
    setScale(newScale);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-purple-50 border-b border-purple-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-purple-900">
                Label Preview - Fixed Dimensions
              </h2>
              <p className="text-sm text-purple-700">
                SKU: {item.sku} • Quantity: {enhancedData.labelQuantity} • 
                Format: Uline S-5627 (4" x 1.5")
              </p>
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Scale:</label>
                <select
                  value={scale}
                  onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value={0.5}>50%</option>
                  <option value={0.75}>75%</option>
                  <option value={1}>100%</option>
                  <option value={1.25}>125%</option>
                  <option value={1.5}>150%</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">View:</label>
                <select
                  value={showMultiple ? 'multiple' : 'single'}
                  onChange={(e) => setShowMultiple(e.target.value === 'multiple')}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="single">Single Label</option>
                  <option value="multiple">All Labels</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="btn btn-secondary btn-sm flex items-center space-x-2"
              >
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </button>

              <button
                onClick={handleDownloadPDF}
                className="btn btn-primary btn-sm flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Preview Content */}
        <div className="p-6 overflow-auto max-h-[70vh]">
          <div className="space-y-6">
            {/* Label Specifications */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Label Specifications</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-blue-800">Dimensions:</div>
                  <div className="text-blue-700">4" × 1.5" (FIXED)</div>
                </div>
                <div>
                  <div className="font-medium text-blue-800">Layout:</div>
                  <div className="text-blue-700">2×6 (12 per sheet)</div>
                </div>
                <div>
                  <div className="font-medium text-blue-800">Paper:</div>
                  <div className="text-blue-700">Uline S-5627</div>
                </div>
                <div>
                  <div className="font-medium text-blue-800">Quantity:</div>
                  <div className="text-blue-700">{enhancedData.labelQuantity} label(s)</div>
                </div>
              </div>
            </div>

            {/* Enhanced Data Summary */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">Enhanced Features</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-green-800">Case Quantity:</div>
                  <div className="text-green-700">{enhancedData.caseQuantity || 'Not set'}</div>
                </div>
                <div>
                  <div className="font-medium text-green-800">Box Count:</div>
                  <div className="text-green-700">{enhancedData.boxCount || 'Not set'}</div>
                </div>
                <div>
                  <div className="font-medium text-green-800">Harvest Date:</div>
                  <div className="text-green-700">{enhancedData.harvestDate || 'Not set'}</div>
                </div>
                <div>
                  <div className="font-medium text-green-800">Packaged Date:</div>
                  <div className="text-green-700">{enhancedData.packagedDate || 'Not set'}</div>
                </div>
              </div>
            </div>

            {/* Label Preview */}
            <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
              <h3 className="font-medium text-gray-900 mb-4">Label Preview</h3>
              
              <div 
                className="transform-gpu transition-transform duration-200"
                style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
              >
                {showMultiple ? (
                  // Show all labels in grid layout (2×6 for Uline S-5627)
                  <div className="grid grid-cols-2 gap-x-1 gap-y-0" style={{ width: '8.5in' }}>
                    {labels.map((labelData, index) => (
                      <div key={index} className="page-break-avoid">
                        <UlineS5627Label data={labelData} />
                      </div>
                    ))}
                  </div>
                ) : (
                  // Show single label
                  <UlineS5627Label data={labels[0]} />
                )}
              </div>
            </div>

            {/* Product Information */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Product Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">SKU:</span> 
                    <span className="ml-2 font-mono">{item.sku}</span>
                  </div>
                  <div>
                    <span className="font-medium">Product Name:</span> 
                    <span className="ml-2">{item.productName}</span>
                  </div>
                  <div>
                    <span className="font-medium">Brand:</span> 
                    <span className="ml-2">{item.brand}</span>
                  </div>
                  <div>
                    <span className="font-medium">Strain:</span> 
                    <span className="ml-2">{item.strain || 'N/A'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Barcode:</span> 
                    <span className="ml-2 font-mono">{item.barcode}</span>
                  </div>
                  <div>
                    <span className="font-medium">BioTrack:</span> 
                    <span className="ml-2 font-mono">{item.bioTrackCode}</span>
                  </div>
                  <div>
                    <span className="font-medium">Source:</span> 
                    <span className="ml-2">{item.source}</span>
                  </div>
                  <div>
                    <span className="font-medium">Quantity:</span> 
                    <span className="ml-2">{item.quantity}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Print Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-900 mb-2">Print Instructions</h3>
              <div className="text-sm text-yellow-800 space-y-1">
                <div>• Use Uline S-5627 label sheets (or Avery 5197 equivalent)</div>
                <div>• Set printer to 100% scale (no scaling/fitting)</div>
                <div>• Use high quality print mode for barcode clarity</div>
                <div>• Labels are precisely sized at 4" × 1.5" with proper margins</div>
                <div>• 12 labels per sheet in 2×6 layout</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Cannabis Inventory Management System V5.3 - Fixed Dimensions Edition
            </div>
            <div>
              Generated: {new Date().toLocaleString()} • User: {user?.username}
            </div>
          </div>
        </div>
      </div>

      {/* Custom print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          
          .print-content,
          .print-content * {
            visibility: visible;
          }
          
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
          }
          
          @page {
            size: letter;
            margin: 0.5in 0.1875in;
          }
          
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}