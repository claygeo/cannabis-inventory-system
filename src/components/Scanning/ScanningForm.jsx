import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useInventory } from '../../contexts/InventoryContext.jsx';
import { useSession } from '../../contexts/SessionContext.jsx';
import { ValidationHelper } from '../../utils/validation.js';
import ProductSelectionForm from './ProductSelectionForm.jsx';
import { 
  Scan, 
  ArrowLeft, 
  Search,
  Trash2,
  FileText,
  Tag,
  AlertCircle,
  CheckCircle,
  Clock,
  Package
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ScanningForm() {
  const { mainInventory, sweedData, getInventoryStats } = useInventory();
  const { 
    processBarcodeScan, 
    getScannedItemsDetails, 
    clearScannedItems, 
    getSessionStats 
  } = useSession();

  const [barcode, setBarcode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showProductSelection, setShowProductSelection] = useState(false);
  const [productDetails, setProductDetails] = useState('');
  const [scannedItemsList, setScannedItemsList] = useState([]);

  const barcodeInputRef = useRef(null);
  const inventoryStats = getInventoryStats();
  const sessionStats = getSessionStats();

  // Load scanned items details on mount and when session changes
  useEffect(() => {
    const details = getScannedItemsDetails(mainInventory, sweedData);
    setScannedItemsList(details);
  }, [mainInventory, sweedData, getScannedItemsDetails, sessionStats.totalItemsScanned]);

  // Focus barcode input on mount
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  // Handle barcode input change
  const handleBarcodeChange = (e) => {
    setBarcode(e.target.value);
  };

  // Handle barcode scan/search
  const handleScan = async () => {
    const cleanBarcode = barcode.trim();
    
    if (!cleanBarcode) {
      toast.error('Please enter a barcode');
      return;
    }

    // Validate barcode format
    const validation = ValidationHelper.validateBarcode(cleanBarcode);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    setScanning(true);
    
    try {
      // Process the barcode scan
      const result = processBarcodeScan(cleanBarcode, mainInventory, sweedData);
      
      if (result.success) {
        if (result.requiresSelection) {
          // Multiple matches - show selection dialog
          setSelectedProducts(result.matches);
          setShowProductSelection(true);
          setProductDetails(buildMultipleMatchesMessage(result.matches, cleanBarcode));
        } else if (result.processed) {
          // Single match processed successfully
          const processedItem = result.processed;
          setProductDetails(buildSuccessMessage(processedItem, cleanBarcode));
          toast.success(`Scanned: ${processedItem.sku}`);
          
          // Clear barcode input
          setBarcode('');
          if (barcodeInputRef.current) {
            barcodeInputRef.current.focus();
          }
        }
      } else {
        // Handle errors
        if (result.alreadyScanned) {
          const item = result.matches[0];
          setProductDetails(buildAlreadyScannedMessage(item, cleanBarcode));
          toast.warn(`Already scanned: ${item.sku}`);
        } else {
          setProductDetails(buildNotFoundMessage(cleanBarcode));
          toast.error(result.error || 'Barcode not found');
        }
      }
    } catch (error) {
      console.error('Scanning error:', error);
      toast.error('Error processing barcode');
      setProductDetails(buildErrorMessage(cleanBarcode, error.message));
    } finally {
      setScanning(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleScan();
    }
  };

  // Handle product selection from dialog
  const handleProductSelected = (selectedProduct) => {
    setShowProductSelection(false);
    setSelectedProducts([]);
    
    // Clear barcode input and focus
    setBarcode('');
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
    
    // Update product details
    setProductDetails(buildSuccessMessage(selectedProduct, barcode));
    toast.success(`Scanned: ${selectedProduct.sku}`);
  };

  // Handle product selection cancelled
  const handleProductSelectionCancelled = () => {
    setShowProductSelection(false);
    setSelectedProducts([]);
    
    // Keep barcode in input for retry
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  // Clear all scanned items
  const handleClearAll = () => {
    if (window.confirm('Clear all scanned items? This cannot be undone.')) {
      clearScannedItems();
      setScannedItemsList([]);
      setProductDetails('All scanned items cleared. Ready to start scanning again.');
      toast.success('All scanned items cleared');
    }
  };

  // Build success message
  const buildSuccessMessage = (item, scannedBarcode) => {
    return `========== PRODUCT SCANNED SUCCESSFULLY ==========

SCANNED BARCODE: ${scannedBarcode}
DATA SOURCE: ${item.source.toUpperCase()}

=== PRODUCT DETAILS ===
SKU: ${item.sku}
Product Name: ${item.productName}
Brand: ${item.brand}
Strain: ${item.strain || 'N/A'}
Size: ${item.size || 'N/A'}
Barcode: ${item.barcode}
BioTrack/External: ${item.bioTrackCode || 'N/A'}
Quantity: ${item.quantity}

${item.source === 'SweedReport' ? 
  `=== SHIPPING DETAILS ===
Ship To Location: ${item.shipToLocation || 'N/A'}
Order Number: ${item.orderNumber || 'N/A'}` :
  `=== INVENTORY DETAILS ===
Location: ${item.location || 'N/A'}
Distributor: ${item.distributor || 'N/A'}`
}

STATUS: SUCCESSFULLY ADDED TO SCAN LIST
==============================================`;
  };

  // Build multiple matches message
  const buildMultipleMatchesMessage = (matches, scannedBarcode) => {
    return `========== MULTIPLE PRODUCTS FOUND ==========

SCANNED BARCODE: ${scannedBarcode}
FOUND ${matches.length} MATCHING PRODUCTS

This barcode is used by multiple SKUs.
Please select the correct product from the dialog.

Products found:
${matches.map(item => `• ${item.displaySource} ${item.sku} - ${item.productName}`).join('\n')}

=========================================`;
  };

  // Build already scanned message
  const buildAlreadyScannedMessage = (item, scannedBarcode) => {
    return `========== ALREADY SCANNED ==========

Product Information:
  SKU: ${item.sku}
  Product: ${item.productName}
  Source: ${item.source}
  BioTrack: ${item.bioTrackCode}

This exact product has already been scanned.
No further action needed.

Continue scanning other items.
=====================================`;
  };

  // Build not found message
  const buildNotFoundMessage = (scannedBarcode) => {
    return `========== BARCODE NOT FOUND ==========

Scanned Barcode: ${scannedBarcode}

This barcode was NOT found in either:
   • Main Inventory (${inventoryStats.mainInventoryCount} items)
   • Sweed Report (${inventoryStats.sweedDataCount} items)

Possible reasons:
• Barcode not in imported data
• Item may be out of stock
• Barcode may be damaged/incorrect
• Wrong inventory files imported

Please verify the barcode and try again.
=======================================`;
  };

  // Build error message
  const buildErrorMessage = (scannedBarcode, errorMsg) => {
    return `========== SCANNING ERROR ==========

Scanned Barcode: ${scannedBarcode}
Error: ${errorMsg}

Please try scanning again or contact support.
====================================`;
  };

  // Check if scanning is ready
  const canScan = inventoryStats.totalItems > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Scan className="h-6 w-6 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Enhanced Barcode Scanning</h1>
          </div>
          <p className="text-gray-600">
            Scan barcodes to find matching products from both inventories
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

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-blue-600" />
            <div>
              <div className="text-xl font-bold text-blue-700">{inventoryStats.totalItems}</div>
              <div className="text-sm text-blue-600">Total Items Available</div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-xl font-bold text-green-700">{sessionStats.totalItemsScanned}</div>
              <div className="text-sm text-green-600">Items Scanned</div>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-purple-600" />
            <div>
              <div className="text-xl font-bold text-purple-700">
                {inventoryStats.mainInventoryCount}/{inventoryStats.sweedDataCount}
              </div>
              <div className="text-sm text-purple-600">Main/Sweed Split</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scanning Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scanning Input */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Barcode Scanner</h2>
          
          {!canScan && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <span className="text-yellow-800">
                  Please import inventory data before scanning
                </span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="barcode" className="form-label">
                Scan or Enter Barcode:
              </label>
              <div className="flex space-x-2">
                <input
                  ref={barcodeInputRef}
                  id="barcode"
                  type="text"
                  value={barcode}
                  onChange={handleBarcodeChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Scan barcode or type manually..."
                  className="input flex-1 font-mono text-lg"
                  disabled={!canScan || scanning}
                  autoComplete="off"
                />
                <button
                  onClick={handleScan}
                  disabled={!canScan || scanning || !barcode.trim()}
                  className="btn btn-success flex items-center space-x-2"
                >
                  <Search className="h-4 w-4" />
                  <span>{scanning ? 'Scanning...' : 'Scan'}</span>
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="text-sm text-gray-600 space-y-1">
              <div>• Scan barcode with scanner or type manually</div>
              <div>• Press Enter or click Scan to process</div>
              <div>• System handles multiple SKUs per barcode</div>
              <div>• Enhanced features: Product selection, duplicate detection</div>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Last Scanned Product Details</h2>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-80 overflow-y-auto">
            <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap">
              {productDetails || `Welcome to Enhanced Barcode Scanning V5.3!

New Features in V5.3:
• Enhanced interface with better visibility
• Improved product selection
• Better progress tracking
• Enhanced label generation with FIXED DIMENSIONS for Uline S-5627 labels

Ready to scan items from both inventories.

Available Items:
• Main Inventory: ${inventoryStats.mainInventoryCount} items
• Sweed Report: ${inventoryStats.sweedDataCount} items`}
            </pre>
          </div>
        </div>
      </div>

      {/* Scanned Items List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Scanned Items List</h2>
          
          <div className="flex items-center space-x-2">
            {sessionStats.totalItemsScanned > 0 && (
              <>
                <Link
                  to="/labels"
                  className="btn btn-primary btn-sm flex items-center space-x-2"
                >
                  <Tag className="h-4 w-4" />
                  <span>Generate Labels</span>
                </Link>
                
                <Link
                  to="/reports"
                  className="btn btn-secondary btn-sm flex items-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>Pick Tickets</span>
                </Link>
                
                <button
                  onClick={handleClearAll}
                  className="btn btn-error btn-sm flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear All</span>
                </button>
              </>
            )}
          </div>
        </div>

        {scannedItemsList.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Scan className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No items scanned yet</h3>
            <p>Start scanning barcodes to see them appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>SKU</th>
                  <th>Product Name</th>
                  <th>Brand</th>
                  <th>Barcode</th>
                  <th>BioTrack</th>
                  <th>Quantity</th>
                  <th>Location/Ship To</th>
                </tr>
              </thead>
              <tbody>
                {scannedItemsList.map((item, index) => (
                  <tr key={index} className={item.source === 'Sweed Report' ? 'bg-orange-50' : 'bg-blue-50'}>
                    <td>
                      <span className={`badge ${item.source === 'Sweed Report' ? 'badge-yellow' : 'badge-blue'}`}>
                        {item.displaySource}
                      </span>
                    </td>
                    <td className="font-mono">{item.sku}</td>
                    <td>{item.productName}</td>
                    <td>{item.brand}</td>
                    <td className="font-mono">{item.barcode}</td>
                    <td className="font-mono">{item.bioTrackCode}</td>
                    <td>{item.quantity}</td>
                    <td>{item.location || item.shipToLocation || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Selection Dialog */}
      {showProductSelection && (
        <ProductSelectionForm
          products={selectedProducts}
          barcode={barcode}
          onProductSelected={handleProductSelected}
          onCancel={handleProductSelectionCancelled}
        />
      )}
    </div>
  );
}