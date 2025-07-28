import { useState, useCallback, useRef, useEffect } from 'react';
import { STORAGE_KEYS, EVENT_TYPES } from '../constants.js';
import { StorageHelper } from '../utils/storage.js';
import { ValidationHelper } from '../utils/validation.js';

/**
 * Custom hook for barcode scanning functionality
 * Handles barcode input, validation, and scanned items management
 */
export const useScanning = () => {
  const [currentBarcode, setCurrentBarcode] = useState('');
  const [scannedItems, setScannedItems] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedItem, setLastScannedItem] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [duplicateWarnings, setDuplicateWarnings] = useState([]);
  
  // Refs for managing scanning state
  const scanInputRef = useRef(null);
  const lastScanTimeRef = useRef(0);
  const scanCountRef = useRef(0);

  // Configuration
  const SCAN_DEBOUNCE_TIME = 1000; // 1 second between duplicate scans
  const MAX_SCAN_HISTORY = 100;

  /**
   * Load scanned items from storage on mount
   */
  useEffect(() => {
    const loadStoredData = () => {
      try {
        const storedItems = StorageHelper.getItem(STORAGE_KEYS.SCANNED_ITEMS) || [];
        setScannedItems(storedItems);

        const storedHistory = StorageHelper.getItem('scan_history') || [];
        setScanHistory(storedHistory);
      } catch (error) {
        console.error('Error loading scanned items:', error);
      }
    };

    loadStoredData();
  }, []);

  /**
   * Focus the barcode input field
   */
  const focusBarcodeInput = useCallback(() => {
    if (scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, []);

  /**
   * Log scanning events
   * @param {string} eventType - Type of event
   * @param {Object} eventData - Event data
   */
  const logScanEvent = useCallback((eventType, eventData) => {
    const event = {
      type: eventType,
      timestamp: new Date().toISOString(),
      scanId: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...eventData
    };

    // Add to scan history
    setScanHistory(prev => {
      const updated = [event, ...prev];
      const trimmed = updated.slice(0, MAX_SCAN_HISTORY);
      StorageHelper.setItem('scan_history', trimmed);
      return trimmed;
    });
  }, []);

  /**
   * Validate barcode input
   * @param {string} barcode - Barcode to validate
   * @returns {Object} - Validation result
   */
  const validateBarcode = useCallback((barcode) => {
    const validation = ValidationHelper.validateBarcode(barcode);
    
    if (!validation.isValid) {
      return validation;
    }

    // Additional scanning-specific validation
    const cleanBarcode = validation.value;

    // Check for recently scanned duplicates (debounce)
    const now = Date.now();
    const timeSinceLastScan = now - lastScanTimeRef.current;
    
    if (timeSinceLastScan < SCAN_DEBOUNCE_TIME && 
        lastScannedItem?.barcode === cleanBarcode) {
      return {
        isValid: false,
        error: 'Item was just scanned. Please wait a moment before scanning again.',
        isDuplicate: true
      };
    }

    return {
      isValid: true,
      value: cleanBarcode
    };
  }, [lastScannedItem]);

  /**
   * Process barcode scan
   * @param {string} barcode - Scanned barcode
   * @param {Array} inventory - Inventory data to search
   * @param {Array} sweedData - Sweed data to search
   * @param {Function} onProductsFound - Callback when products are found
   * @param {Function} onNoProductsFound - Callback when no products are found
   * @returns {Promise<Object>} - Scan result
   */
  const processBarcodeScan = useCallback(async (
    barcode, 
    inventory, 
    sweedData, 
    onProductsFound, 
    onNoProductsFound
  ) => {
    try {
      setIsScanning(true);
      
      // Validate barcode
      const validation = validateBarcode(barcode);
      if (!validation.isValid) {
        logScanEvent(EVENT_TYPES.ERROR_OCCURRED, {
          context: 'barcode_validation',
          barcode: barcode,
          error: validation.error
        });

        return {
          success: false,
          error: validation.error,
          isDuplicate: validation.isDuplicate || false
        };
      }

      const cleanBarcode = validation.value;

      // Search for products
      const foundProducts = [];

      // Search main inventory
      inventory.forEach(item => {
        if (item.barcode === cleanBarcode) {
          foundProducts.push({
            ...item,
            source: 'MainInventory',
            displaySource: '[MAIN]',
            uniqueKey: `${item.barcode}_${item.sku}_main`
          });
        }
      });

      // Search Sweed data
      sweedData.forEach(item => {
        if (item.barcode === cleanBarcode) {
          foundProducts.push({
            ...item,
            source: 'SweedReport',
            displaySource: '[SWEED]',
            uniqueKey: `${item.barcode}_${item.sku}_sweed`
          });
        }
      });

      // Update scan statistics
      scanCountRef.current += 1;
      lastScanTimeRef.current = Date.now();

      if (foundProducts.length === 0) {
        // No products found
        logScanEvent(EVENT_TYPES.ITEM_SCANNED, {
          barcode: cleanBarcode,
          found: false,
          productsCount: 0
        });

        if (onNoProductsFound) {
          onNoProductsFound(cleanBarcode);
        }

        return {
          success: false,
          error: `No products found for barcode: ${cleanBarcode}`,
          barcode: cleanBarcode
        };
      }

      // Products found
      logScanEvent(EVENT_TYPES.ITEM_SCANNED, {
        barcode: cleanBarcode,
        found: true,
        productsCount: foundProducts.length,
        products: foundProducts.map(p => ({
          sku: p.sku,
          source: p.source
        }))
      });

      if (onProductsFound) {
        onProductsFound(foundProducts, cleanBarcode);
      }

      return {
        success: true,
        products: foundProducts,
        barcode: cleanBarcode
      };

    } catch (error) {
      console.error('Barcode scan processing error:', error);
      
      logScanEvent(EVENT_TYPES.ERROR_OCCURRED, {
        context: 'barcode_scan_processing',
        barcode: barcode,
        error: error.message
      });

      return {
        success: false,
        error: `Scan processing failed: ${error.message}`
      };
    } finally {
      setIsScanning(false);
    }
  }, [validateBarcode, logScanEvent]);

  /**
   * Add item to scanned items list
   * @param {Object} item - Item to add
   * @param {string} barcode - Original barcode scanned
   * @returns {Object} - Add result
   */
  const addScannedItem = useCallback((item, barcode) => {
    try {
      const scannedItem = {
        ...item,
        scannedAt: new Date().toISOString(),
        scannedBarcode: barcode,
        scanId: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      // Check for duplicates
      const isDuplicate = scannedItems.some(
        existing => existing.barcode === item.barcode && 
                   existing.sku === item.sku &&
                   existing.source === item.source
      );

      if (isDuplicate) {
        // Add to duplicate warnings but don't prevent adding
        setDuplicateWarnings(prev => [
          ...prev,
          {
            id: Date.now(),
            message: `${item.sku} (${item.displaySource}) was already scanned`,
            timestamp: new Date().toISOString()
          }
        ]);
      }

      // Add to scanned items
      setScannedItems(prev => {
        const updated = [...prev, scannedItem];
        StorageHelper.setItem(STORAGE_KEYS.SCANNED_ITEMS, updated);
        return updated;
      });

      // Update last scanned item
      setLastScannedItem(scannedItem);

      return {
        success: true,
        item: scannedItem,
        isDuplicate
      };

    } catch (error) {
      console.error('Error adding scanned item:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }, [scannedItems]);

  /**
   * Remove item from scanned items list
   * @param {string} scanId - Scan ID to remove
   * @returns {Object} - Remove result
   */
  const removeScannedItem = useCallback((scanId) => {
    try {
      setScannedItems(prev => {
        const updated = prev.filter(item => item.scanId !== scanId);
        StorageHelper.setItem(STORAGE_KEYS.SCANNED_ITEMS, updated);
        return updated;
      });

      return { success: true };
    } catch (error) {
      console.error('Error removing scanned item:', error);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Clear all scanned items
   * @returns {Object} - Clear result
   */
  const clearScannedItems = useCallback(() => {
    try {
      setScannedItems([]);
      setLastScannedItem(null);
      setDuplicateWarnings([]);
      StorageHelper.removeItem(STORAGE_KEYS.SCANNED_ITEMS);

      logScanEvent(EVENT_TYPES.SESSION_CLEARED, {
        context: 'scanned_items',
        clearedCount: scannedItems.length
      });

      return { success: true };
    } catch (error) {
      console.error('Error clearing scanned items:', error);
      return { success: false, error: error.message };
    }
  }, [scannedItems.length, logScanEvent]);

  /**
   * Get scanned items grouped by source
   * @returns {Object} - Grouped scanned items
   */
  const getScannedItemsBySource = useCallback(() => {
    const grouped = {
      MainInventory: [],
      SweedReport: []
    };

    scannedItems.forEach(item => {
      if (grouped[item.source]) {
        grouped[item.source].push(item);
      }
    });

    return grouped;
  }, [scannedItems]);

  /**
   * Get scanning statistics
   * @returns {Object} - Scanning statistics
   */
  const getScanningStats = useCallback(() => {
    const grouped = getScannedItemsBySource();
    
    return {
      totalScanned: scannedItems.length,
      mainInventoryCount: grouped.MainInventory.length,
      sweedReportCount: grouped.SweedReport.length,
      uniqueBarcodes: new Set(scannedItems.map(item => item.barcode)).size,
      uniqueSKUs: new Set(scannedItems.map(item => item.sku)).size,
      duplicateWarnings: duplicateWarnings.length,
      scanHistoryCount: scanHistory.length,
      sessionScanCount: scanCountRef.current
    };
  }, [scannedItems, duplicateWarnings, scanHistory, getScannedItemsBySource]);

  /**
   * Handle barcode input change
   * @param {string} value - Input value
   */
  const handleBarcodeChange = useCallback((value) => {
    setCurrentBarcode(value);
  }, []);

  /**
   * Clear current barcode input
   */
  const clearCurrentBarcode = useCallback(() => {
    setCurrentBarcode('');
    focusBarcodeInput();
  }, [focusBarcodeInput]);

  /**
   * Get recent scan history
   * @param {number} limit - Number of recent scans to return
   * @returns {Array} - Recent scan events
   */
  const getRecentScans = useCallback((limit = 20) => {
    return scanHistory
      .filter(event => event.type === EVENT_TYPES.ITEM_SCANNED)
      .slice(0, limit);
  }, [scanHistory]);

  /**
   * Clear duplicate warnings
   */
  const clearDuplicateWarnings = useCallback(() => {
    setDuplicateWarnings([]);
  }, []);

  /**
   * Export scanned items to CSV
   * @returns {string} - CSV string
   */
  const exportScannedItemsToCSV = useCallback(() => {
    if (scannedItems.length === 0) {
      throw new Error('No scanned items to export');
    }

    const headers = [
      'Scan ID',
      'Scanned At',
      'Source',
      'SKU',
      'Barcode',
      'Product Name',
      'Brand',
      'Size',
      'Quantity',
      'Location'
    ];

    const rows = scannedItems.map(item => [
      item.scanId,
      item.scannedAt,
      item.displaySource,
      item.sku,
      item.barcode,
      item.productName || '',
      item.brand || '',
      item.size || '',
      item.quantity || '',
      item.location || item.shipToLocation || ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => 
        String(cell).includes(',') ? `"${cell}"` : cell
      ).join(','))
      .join('\n');
  }, [scannedItems]);

  /**
   * Start scanning session
   */
  const startScanningSession = useCallback(() => {
    scanCountRef.current = 0;
    lastScanTimeRef.current = 0;
    setDuplicateWarnings([]);
    focusBarcodeInput();

    logScanEvent(EVENT_TYPES.SESSION_START, {
      context: 'scanning_session'
    });
  }, [focusBarcodeInput, logScanEvent]);

  /**
   * End scanning session
   */
  const endScanningSession = useCallback(() => {
    const stats = getScanningStats();
    
    logScanEvent(EVENT_TYPES.SESSION_END, {
      context: 'scanning_session',
      finalStats: stats
    });
  }, [getScanningStats, logScanEvent]);

  return {
    // State
    currentBarcode,
    scannedItems,
    isScanning,
    lastScannedItem,
    scanHistory,
    duplicateWarnings,

    // Refs
    scanInputRef,

    // Actions
    processBarcodeScan,
    addScannedItem,
    removeScannedItem,
    clearScannedItems,
    handleBarcodeChange,
    clearCurrentBarcode,
    clearDuplicateWarnings,
    startScanningSession,
    endScanningSession,

    // Utilities
    validateBarcode,
    focusBarcodeInput,
    getScannedItemsBySource,
    getScanningStats,
    getRecentScans,
    exportScannedItemsToCSV,

    // Computed values
    hasScannedItems: scannedItems.length > 0,
    hasDuplicateWarnings: duplicateWarnings.length > 0,
    isValidBarcode: currentBarcode ? validateBarcode(currentBarcode).isValid : false
  };
};