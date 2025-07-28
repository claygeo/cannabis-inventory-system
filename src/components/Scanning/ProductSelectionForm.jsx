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
  };

  // Handle cancel
  const handleCancel = () => {
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
              <div>
                <h2 className="text-lg font-semibold text-yellow-900">
                  Multiple Products Found
                </h2>
                <p className="text-sm text-yellow-700">
                  Scanned Barcode: <span className="font-mono">{barcode}</span>
                </p>
              </div>
            </div>
            
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
          <p className="text-sm text-blue-800">
            Multiple SKUs use this barcode. Please select the correct product you are scanning:
          </p>
        </div>

        {/* Product List */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {products.map((product, index) => (
              <div
                key={index}
                onClick={() => handleProductClick(product)}
                className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  selectedProduct === product
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Basic Info */}
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`badge ${
                            product.source === 'SweedReport' 
                              ? 'badge-yellow' 
                              : 'badge-blue'
                          }`}>
                            {product.displaySource}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="font-medium">SKU:</span>
                            <span className="ml-2 font-mono">{product.sku}</span>
                          </div>
                          <div>
                            <span className="font-medium">Barcode:</span>
                            <span className="ml-2 font-mono">{product.barcode}</span>
                          </div>
                          <div>
                            <span className="font-medium">BioTrack:</span>
                            <span className="ml-2 font-mono">{product.bioTrackCode}</span>
                          </div>
                        </div>
                      </div>

                      {/* Product Details */}
                      <div>
                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="font-medium">Product:</span>
                            <span className="ml-2">{product.productName}</span>
                          </div>
                          <div>
                            <span className="font-medium">Brand:</span>
                            <span className="ml-2">{product.brand}</span>
                          </div>
                          <div>
                            <span className="font-medium">Strain:</span>
                            <span className="ml-2">{product.strain || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium">Size:</span>
                            <span className="ml-2">{product.size || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Location/Shipping Info */}
                      <div>
                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="font-medium">Quantity:</span>
                            <span className="ml-2">{product.quantity}</span>
                          </div>
                          {product.source === 'SweedReport' ? (
                            <>
                              <div>
                                <span className="font-medium">Ship To:</span>
                                <span className="ml-2">{product.shipToLocation || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="font-medium">Order #:</span>
                                <span className="ml-2 font-mono">{product.orderNumber || 'N/A'}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <span className="font-medium">Location:</span>
                                <span className="ml-2">{product.location || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="font-medium">Distributor:</span>
                                <span className="ml-2">{product.distributor || 'N/A'}</span>
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
                      <CheckCircle className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Product Details */}
        {selectedProduct && (
          <div className="px-6 py-4 bg-green-50 border-t border-green-200">
            <h3 className="font-medium text-green-900 mb-2">Selected Product:</h3>
            <div className="text-sm text-green-800">
              <span className="font-mono">{selectedProduct.sku}</span> - {selectedProduct.productName}
              {selectedProduct.source === 'SweedReport' && (
                <span className="ml-2">(Ship To: {selectedProduct.shipToLocation})</span>
              )}
              {selectedProduct.source === 'MainInventory' && (
                <span className="ml-2">(Location: {selectedProduct.location})</span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Found {products.length} product{products.length !== 1 ? 's' : ''} with barcode{' '}
            <span className="font-mono">{barcode}</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCancel}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            
            <button
              onClick={handleConfirmSelection}
              disabled={!selectedProduct}
              className="btn btn-success"
            >
              Select This Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}