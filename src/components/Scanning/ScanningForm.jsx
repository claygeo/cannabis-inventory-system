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
  Tag,
  AlertCircle
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
    try {
      const details = getScannedItemsDetails(mainInventory, sweedData);
      setScannedItemsList(details || []);
    } catch (error) {
      console.error('Error loading scanned items:', error);
      setScannedItemsList([]);
    }
  }, [mainInventory, sweedData, getScannedItemsDetails, sessionStats.totalItemsScanned]);

  // Focus barcode input on mount
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  // Auto-close product selection on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showProductSelection) {
        handleProductSelectionCancelled();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showProductSelection]);

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
        if (result.requiresSelection && result.matches && result.matches.length > 1) {
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
          const item = result.matches && result.matches[0];
          if (item) {
            setProductDetails(buildAlreadyScannedMessage(item, cleanBarcode));
            toast.warn(`Already scanned: ${item.sku}`);
          } else {
            setProductDetails('Product already scanned');
            toast.warn('Product already scanned');
          }
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
    console.log('Product selected:', selectedProduct);
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
    console.log('Product selection cancelled');
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
      try {
        clearScannedItems();
        setScannedItemsList([]);
        setProductDetails('All scanned items cleared. Ready to start scanning again.');
        toast.success('All scanned items cleared');
      } catch (error) {
        console.error('Error clearing items:', error);
        toast.error('Error clearing items');
      }
    }
  };

  // Build success message
  const buildSuccessMessage = (item, scannedBarcode) => {
    return `========== PRODUCT SCANNED SUCCESSFULLY ==========

SCANNED BARCODE: ${scannedBarcode}

=== PRODUCT DETAILS ===
SKU: ${item.sku || 'N/A'}
Product Name: ${item.productName || 'N/A'}
Brand: ${item.brand || 'N/A'}
Strain: ${item.strain || 'N/A'}
Size: ${item.size || 'N/A'}
Barcode: ${item.barcode || 'N/A'}
BioTrack/External: ${item.bioTrackCode || 'N/A'}
Quantity: ${item.quantity || 'N/A'}

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
${matches.map(item => `• ${item.sku} - ${item.productName}`).join('\n')}

=========================================`;
  };

  // Build already scanned message
  const buildAlreadyScannedMessage = (item, scannedBarcode) => {
    return `========== ALREADY SCANNED ==========

Product Information:
  SKU: ${item.sku || 'N/A'}
  Product: ${item.productName || 'N/A'}
  BioTrack: ${item.bioTrackCode || 'N/A'}

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
   • Main Inventory (${inventoryStats.mainInventoryCount || 0} items)
   • Sweed Report (${inventoryStats.sweedDataCount || 0} items)

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
    <div className="min-h-screen bg-[#15161B] p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#FAFCFB]">Barcode Scanning</h1>
          </div>

          <Link
            to="/dashboard"
            className="bg-[#181B22] text-[#FAFCFB] border border-[#39414E] hover:bg-[#39414E] px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Debug Info */}
        <div className="bg-[#181B22] border border-[#39414E] rounded-xl p-4 text-xs text-[#9FA3AC]">
          <div>Debug: showProductSelection = {showProductSelection.toString()}</div>
          <div>Debug: selectedProducts length = {selectedProducts.length}</div>
          <div>Debug: scannedItemsList length = {scannedItemsList.length}</div>
        </div>

        {/* Scanning Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanning Input */}
          <div className="bg-[#181B22] border border-[#39414E] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[#FAFCFB] mb-4">Barcode Scanner</h2>
            
            {!canScan && (
              <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                  <span className="text-yellow-400">
                    Please import inventory data before scanning
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="barcode" className="block text-sm font-medium text-[#FAFCFB] mb-2">
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
                    className="flex-1 bg-[#181B22] border border-[#39414E] text-[#FAFCFB] rounded-lg px-4 py-2 font-mono text-lg focus:border-[#86EFAC] focus:outline-none transition-colors"
                    disabled={!canScan || scanning}
                    autoComplete="off"
                  />
                  <button
                    onClick={handleScan}
                    disabled={!canScan || scanning || !barcode.trim()}
                    className="bg-[#86EFAC] text-[#00001C] hover:opacity-90 disabled:opacity-50 px-4 py-2 rounded-lg flex items-center space-x-2 transition-opacity"
                  >
                    <Search className="h-4 w-4" />
                    <span>{scanning ? 'Scanning...' : 'Scan'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-[#181B22] border border-[#39414E] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[#FAFCFB] mb-4">Last Scanned Product Details</h2>
            
            <div className="bg-[#15161B] border border-[#39414E] rounded-lg p-4 h-80 overflow-y-auto">
              <pre className="text-xs font-mono text-[#FAFCFB] whitespace-pre-wrap">
                {productDetails || `Ready to scan items from both inventories.

Available Items:
• Main Inventory: ${inventoryStats.mainInventoryCount || 0} items
• Sweed Report: ${inventoryStats.sweedDataCount || 0} items`}
              </pre>
            </div>
          </div>
        </div>

        {/* Scanned Items List */}
        <div className="bg-[#181B22] border border-[#39414E] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#FAFCFB]">Scanned Items List</h2>
            
            <div className="flex items-center space-x-2">
              {sessionStats.totalItemsScanned > 0 && (
                <>
                  <Link
                    to="/labels"
                    className="bg-[#86EFAC] text-[#00001C] hover:opacity-90 px-4 py-2 rounded-lg flex items-center space-x-2 transition-opacity"
                  >
                    <Tag className="h-4 w-4" />
                    <span>Generate Labels</span>
                  </Link>
                  
                  <button
                    onClick={handleClearAll}
                    className="bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Clear All</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {scannedItemsList.length === 0 ? (
            <div className="text-center py-12 text-[#9FA3AC]">
              <Scan className="h-12 w-12 mx-auto mb-4 text-[#39414E]" />
              <h3 className="text-lg font-medium mb-2 text-[#FAFCFB]">No items scanned yet</h3>
              <p>Start scanning barcodes to see them appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-[#39414E]">
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#9FA3AC]">SKU</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#9FA3AC]">Product Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#9FA3AC]">Brand</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#9FA3AC]">Barcode</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#9FA3AC]">BioTrack</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#9FA3AC]">Quantity</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#9FA3AC]">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {scannedItemsList.map((item, index) => (
                    <tr key={index} className="border-b border-[#39414E]">
                      <td className="px-4 py-3 text-sm text-[#FAFCFB] font-mono">{item.sku || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-[#FAFCFB]">{item.productName || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-[#FAFCFB]">{item.brand || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-[#FAFCFB] font-mono">{item.barcode || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-[#FAFCFB] font-mono">{item.bioTrackCode || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-[#FAFCFB]">{item.quantity || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-[#FAFCFB]">{item.location || item.shipToLocation || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Product Selection Dialog - Only render when needed */}
        {showProductSelection && selectedProducts && selectedProducts.length > 0 && (
          <ProductSelectionForm
            products={selectedProducts}
            barcode={barcode}
            onProductSelected={handleProductSelected}
            onCancel={handleProductSelectionCancelled}
          />
        )}
      </div>
    </div>
  );
}