import React, { useState } from 'react';
import UlineS5627Label from './UlineS5627Label.jsx';
import { PDFGenerator } from '../../utils/pdfGenerator.js';
import { 
  X, 
  Download, 
  Printer, 
  Eye, 
  EyeOff,
  AlertCircle,
  CheckCircle,
  Maximize2,
  Minimize2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LabelPreview({ item, enhancedData, user, onClose }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAllLabels, setShowAllLabels] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate how many labels to generate
  const labelQuantity = parseInt(enhancedData?.labelQuantity || '1');
  const totalBoxes = parseInt(enhancedData?.boxCount || '1');

  // Generate PDF
  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    
    try {
      const labelData = {
        ...item,
        enhancedData,
        user: user?.username || 'Unknown',
        timestamp: new Date().toISOString()
      };

      const pdfBlob = await PDFGenerator.generateLabels([labelData]);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `labels_${item.sku}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`PDF generated successfully for ${item.sku}`);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Print labels directly
  const handlePrint = () => {
    window.print();
  };

  // Render labels for preview
  const renderLabels = () => {
    const labels = [];
    const displayCount = showAllLabels ? labelQuantity : Math.min(labelQuantity, 4);
    
    for (let i = 0; i < displayCount; i++) {
      // Calculate box number for this label
      const currentBox = Math.floor(i / Math.max(1, Math.floor(labelQuantity / totalBoxes))) + 1;
      
      labels.push(
        <div key={i} className="border-2 border-[#39414E] rounded-lg overflow-hidden bg-[#181B22]">
          <div className="bg-[#15161B] px-2 py-1 text-xs font-medium text-[#9FA3AC]">
            Label {i + 1} of {labelQuantity}
          </div>
          <div className="p-2">
            <UlineS5627Label 
              item={item}
              enhancedData={enhancedData}
              user={user}
              boxNumber={currentBox}
              totalBoxes={totalBoxes}
              preview={true}
            />
          </div>
        </div>
      );
    }
    
    return labels;
  };

  return (
    <div 
      className="modal-backdrop fixed inset-0 flex items-center justify-center p-4"
      style={{ 
        backgroundColor: 'rgba(21, 22, 27, 0.8)',
        zIndex: 50 // Use the defined modal z-index
      }}
      onClick={onClose}
    >
      <div 
        className={`modal-content bg-[#181B22] border border-[#39414E] rounded-lg shadow-xl transition-all duration-300 ${
          isExpanded 
            ? 'w-full h-full max-w-none max-h-none' 
            : 'w-full max-w-6xl max-h-[90vh]'
        }`}
        style={{ zIndex: 51 }} // Slightly higher than backdrop
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#39414E]">
          <div>
            <h2 className="text-xl font-bold text-[#FAFCFB]">Label Preview</h2>
            <p className="text-[#9FA3AC] mt-1">
              Uline S-5627 Format (4" × 1.5") - {labelQuantity} label{labelQuantity > 1 ? 's' : ''} for {item.sku}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-[#9FA3AC] hover:text-[#FAFCFB] transition-colors rounded"
              title={isExpanded ? "Minimize" : "Expand"}
            >
              {isExpanded ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-[#9FA3AC] hover:text-[#FAFCFB] transition-colors rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`flex flex-col ${isExpanded ? 'h-full' : ''}`}>
          {/* Item Information */}
          <div className="p-6 bg-[#15161B] border-b border-[#39414E]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-[#9FA3AC]">SKU:</span>
                <div className="font-mono text-[#FAFCFB]">{item.sku}</div>
              </div>
              <div>
                <span className="font-medium text-[#9FA3AC]">Barcode:</span>
                <div className="font-mono text-[#FAFCFB]">{item.barcode}</div>
              </div>
              <div>
                <span className="font-medium text-[#9FA3AC]">Source:</span>
                <div className={`badge ${
                  item.source === 'SweedReport' ? 'badge-yellow' : 'badge-blue'
                }`}>
                  {item.displaySource}
                </div>
              </div>
              <div>
                <span className="font-medium text-[#9FA3AC]">Labels:</span>
                <div className="text-[#FAFCFB]">{labelQuantity} label{labelQuantity > 1 ? 's' : ''}</div>
              </div>
            </div>

            <div className="mt-3">
              <span className="font-medium text-[#9FA3AC]">Product:</span>
              <div className="text-[#FAFCFB]">{item.productName}</div>
            </div>

            {/* Enhanced Data Summary */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[#9FA3AC]">Harvest:</span>
                <div className="font-medium text-[#FAFCFB]">
                  {enhancedData?.harvestDate || 'Not set'}
                </div>
              </div>
              <div>
                <span className="text-[#9FA3AC]">Packaged:</span>
                <div className="font-medium text-[#FAFCFB]">
                  {enhancedData?.packagedDate || 'Not set'}
                </div>
              </div>
              <div>
                <span className="text-[#9FA3AC]">Case Qty:</span>
                <div className="font-medium text-[#FAFCFB]">
                  {enhancedData?.caseQuantity || 'Not set'}
                </div>
              </div>
              <div>
                <span className="text-[#9FA3AC]">Boxes:</span>
                <div className="font-medium text-[#FAFCFB]">
                  {enhancedData?.boxCount || '1'} box{(enhancedData?.boxCount || 1) > 1 ? 'es' : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Preview Controls */}
          <div className="p-4 border-b border-[#39414E] flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-[#9FA3AC]">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Ready for printing on Uline S-5627 sheets</span>
              </div>

              {labelQuantity > 4 && (
                <button
                  onClick={() => setShowAllLabels(!showAllLabels)}
                  className="flex items-center space-x-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {showAllLabels ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span>
                    {showAllLabels ? 'Show less' : `Show all ${labelQuantity} labels`}
                  </span>
                </button>
              )}
            </div>

            <div className="text-sm text-[#9FA3AC]">
              Showing {showAllLabels ? labelQuantity : Math.min(labelQuantity, 4)} of {labelQuantity} labels
            </div>
          </div>

          {/* Labels Preview */}
          <div className={`p-6 bg-[#15161B] ${isExpanded ? 'flex-1' : ''} overflow-auto`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderLabels()}
            </div>

            {labelQuantity > 4 && !showAllLabels && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center space-x-2 text-[#9FA3AC] bg-[#181B22] px-4 py-2 rounded-lg border border-[#39414E]">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    {labelQuantity - 4} more labels will be included in the PDF
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-[#39414E] bg-[#181B22]">
            <div className="flex items-center justify-between">
              <div className="text-sm text-[#9FA3AC]">
                Labels will be properly positioned for Uline S-5627 label sheets
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="btn btn-secondary"
                >
                  Close Preview
                </button>

                <button
                  onClick={handlePrint}
                  className="btn btn-secondary flex items-center space-x-2"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Preview</span>
                </button>

                <button
                  onClick={handleGeneratePDF}
                  disabled={isGenerating}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#00001C] border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Technical Info */}
            <div className="mt-4 text-xs text-[#9FA3AC] border-t border-[#39414E] pt-4">
              <div className="flex items-center justify-between">
                <span>Label Dimensions: 4" × 1.5" (288pt × 108pt) • Format: Uline S-5627</span>
                <span>Generated: {new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-labels, .print-labels * {
            visibility: visible;
          }
          .print-labels {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}