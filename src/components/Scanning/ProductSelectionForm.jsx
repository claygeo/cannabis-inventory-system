import React, { useState } from 'react';
import { useSession } from '../../contexts/SessionContext.jsx';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductSelectionForm({ 
  products, 
  barcode, 
  onProductSelected, 
  onCancel 
}) {
  const { addScannedItem } = useSession();
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Early return if no products or missing props
  if (!products || !Array.isArray(products) || products.length === 0) {
    console.warn('ProductSelectionForm: No products provided, auto-canceling');
    if (onCancel) onCancel();
    return null;
  }

  // Handle product selection
  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  // Handle confirm selection
  const handleConfirmSelection = () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    try {
      // Add the selected product to scanned items
      const wasAdded = addScannedItem(
        selectedProduct.barcode, 
        selectedProduct.sku, 
        selectedProduct.source
      );

      if (wasAdded) {
        onProductSelected(selectedProduct);
      } else {
        toast.warn('This product has already been scanned');
        onCancel();
      }
    } catch (error) {
      console.error('Error adding scanned item:', error);
      toast.error('Error adding product');
      onCancel();
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  // Handle escape key
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div 
      className="modal-backdrop fixed inset-0 flex items-center justify-center p-4"
      style={{ 
        backgroundColor: 'rgba(21, 22, 27, 0.8)',
        zIndex: 50 // Use the defined modal z-index
      }}
      onClick={handleCancel}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div 
        className="modal-content bg-[#181B22] border border-[#39414E] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        style={{ zIndex: 51 }} // Slightly higher than backdrop
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-yellow-400" />
              <div>
                <h2 className="text-lg font-semibold text-[#FAFCFB]">
                  Multiple Products Found
                </h2>
                <p className="text-sm text-[#9FA3AC]">
                  Scanned Barcode: <span className="font-mono text-[#FAFCFB]">{barcode}</span>
                </p>
              </div>
            </div>
            
            <button
              onClick={handleCancel}
              className="text-[#9FA3AC] hover:text-[#FAFCFB] transition-colors p-1 rounded"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="px-6 py-4 bg-blue-500/10 border-b border-blue-500/20">
          <p className="text-sm text-blue-400">
            Multiple SKUs use this barcode. Please select the correct product you are scanning:
          </p>
        </div>

        {/* Product List */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {products.map((product, index) => (
              <div
                key={`${product.sku}-${index}`}
                onClick={() => handleProductClick(product)}
                className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  selectedProduct === product
                    ? 'border-[#86EFAC] bg-[#86EFAC]/10 shadow-md'
                    : 'border-[#39414E] hover:border-[#9FA3AC] hover:bg-[#39414E]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Basic Info */}
                      <div>
                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="font-medium text-[#9FA3AC]">SKU:</span>
                            <span className="ml-2 font-mono text-[#FAFCFB]">{product.sku || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-[#9FA3AC]">Barcode:</span>
                            <span className="ml-2 font-mono text-[#FAFCFB]">{product.barcode || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-[#9FA3AC]">BioTrack:</span>
                            <span className="ml-2 font-mono text-[#FAFCFB]">{product.bioTrackCode || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Product Details */}
                      <div>
                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="font-medium text-[#9FA3AC]">Product:</span>
                            <span className="ml-2 text-[#FAFCFB]">{product.productName || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-[#9FA3AC]">Brand:</span>
                            <span className="ml-2 text-[#FAFCFB]">{product.brand || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-[#9FA3AC]">Strain:</span>
                            <span className="ml-2 text-[#FAFCFB]">{product.strain || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-[#9FA3AC]">Size:</span>
                            <span className="ml-2 text-[#FAFCFB]">{product.size || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Location/Shipping Info */}
                      <div>
                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="font-medium text-[#9FA3AC]">Quantity:</span>
                            <span className="ml-2 text-[#FAFCFB]">{product.quantity || 'N/A'}</span>
                          </div>
                          {product.source === 'SweedReport' ? (
                            <>
                              <div>
                                <span className="font-medium text-[#9FA3AC]">Ship To:</span>
                                <span className="ml-2 text-[#FAFCFB]">{product.shipToLocation || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="font-medium text-[#9FA3AC]">Order #:</span>
                                <span className="ml-2 font-mono text-[#FAFCFB]">{product.orderNumber || 'N/A'}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <span className="font-medium text-[#9FA3AC]">Location:</span>
                                <span className="ml-2 text-[#FAFCFB]">{product.location || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="font-medium text-[#9FA3AC]">Distributor:</span>
                                <span className="ml-2 text-[#FAFCFB]">{product.distributor || 'N/A'}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  <div className="ml-4">
                    {selectedProduct === product && (
                      <CheckCircle className="h-6 w-6 text-[#86EFAC]" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Product Details */}
        {selectedProduct && (
          <div className="px-6 py-4 bg-green-500/10 border-t border-green-500/20">
            <h3 className="font-medium text-green-400 mb-2">Selected Product:</h3>
            <div className="text-sm text-green-400">
              <span className="font-mono">{selectedProduct.sku}</span> - {selectedProduct.productName}
              {selectedProduct.source === 'SweedReport' && selectedProduct.shipToLocation && (
                <span className="ml-2">(Ship To: {selectedProduct.shipToLocation})</span>
              )}
              {selectedProduct.source === 'MainInventory' && selectedProduct.location && (
                <span className="ml-2">(Location: {selectedProduct.location})</span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-[#15161B] border-t border-[#39414E] flex items-center justify-between">
          <div className="text-sm text-[#9FA3AC]">
            Found {products.length} product{products.length !== 1 ? 's' : ''} with barcode{' '}
            <span className="font-mono text-[#FAFCFB]">{barcode}</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCancel}
              className="bg-[#181B22] text-[#FAFCFB] border border-[#39414E] hover:bg-[#39414E] px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handleConfirmSelection}
              disabled={!selectedProduct}
              className="bg-[#86EFAC] text-[#00001C] hover:opacity-90 disabled:opacity-50 px-4 py-2 rounded-lg transition-opacity"
            >
              Select This Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}