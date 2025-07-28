import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS, EVENT_TYPES, DATA_SOURCES } from '../constants.js';
import { StorageHelper } from '../utils/storage.js';
import { DataProcessor } from '../utils/dataProcessor.js';

/**
 * Custom hook for inventory data management
 * Handles CSV/Excel imports, data processing, and inventory state
 */
export const useInventory = () => {
  const [mainInventory, setMainInventory] = useState([]);
  const [sweedData, setSweedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [lastImportStats, setLastImportStats] = useState(null);
  const [importHistory, setImportHistory] = useState([]);

  /**
   * Load inventory data from storage on mount
   */
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        setIsLoading(true);
        
        // Load main inventory data
        const storedMainInventory = StorageHelper.getItem(STORAGE_KEYS.INVENTORY_DATA);
        if (storedMainInventory && Array.isArray(storedMainInventory)) {
          setMainInventory(storedMainInventory);
        }

        // Load Sweed data
        const storedSweedData = StorageHelper.getItem(STORAGE_KEYS.SWEED_DATA);
        if (storedSweedData && Array.isArray(storedSweedData)) {
          setSweedData(storedSweedData);
        }

        // Load import history
        const storedHistory = StorageHelper.getItem('inventory_import_history') || [];
        setImportHistory(storedHistory);

      } catch (error) {
        console.error('Error loading stored inventory data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredData();
  }, []);

  /**
   * Log inventory events
   * @param {string} eventType - Type of event
   * @param {Object} eventData - Event data
   */
  const logInventoryEvent = useCallback((eventType, eventData) => {
    const event = {
      type: eventType,
      timestamp: new Date().toISOString(),
      ...eventData
    };

    // Add to import history
    setImportHistory(prev => {
      const updated = [event, ...prev];
      // Keep only last 50 events
      const trimmed = updated.slice(0, 50);
      StorageHelper.setItem('inventory_import_history', trimmed);
      return trimmed;
    });
  }, []);

  /**
   * Import main inventory file (CSV or Excel)
   * @param {File} file - File to import
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} - Import result
   */
  const importMainInventory = useCallback(async (file, onProgress = null) => {
    try {
      setIsLoading(true);
      setImportProgress(0);

      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      if (file.size === 0) {
        throw new Error('File is empty');
      }

      // Detect file type and show progress
      const fileType = DataProcessor.detectFileType(file);
      console.log(`Importing ${fileType} file:`, file.name);

      // Parse file (Excel or CSV)
      setImportProgress(10);
      const rawData = await DataProcessor.parseFile(file, (loaded, total) => {
        const progressPercent = Math.floor((loaded / total) * 40) + 10; // 10-50%
        setImportProgress(progressPercent);
        if (onProgress) onProgress(progressPercent);
      });

      // Validate structure
      setImportProgress(50);
      const structureValidation = DataProcessor.validateMainInventoryStructure(rawData.data);
      if (!structureValidation.isValid) {
        throw new Error(`Invalid file structure: ${structureValidation.errors.join(', ')}`);
      }

      // Process data
      setImportProgress(60);
      const processedResult = DataProcessor.processMainInventoryData(rawData.data);
      
      if (processedResult.errors.length > 0 && processedResult.data.length === 0) {
        throw new Error('No valid data could be processed from the file');
      }

      // Store processed data
      setImportProgress(80);
      StorageHelper.setItem(STORAGE_KEYS.INVENTORY_DATA, processedResult.data);
      setMainInventory(processedResult.data);

      // Update statistics
      const importStats = {
        fileName: file.name,
        fileSize: file.size,
        fileType: fileType,
        importTime: new Date().toISOString(),
        dataSource: DATA_SOURCES.MAIN_INVENTORY,
        totalRows: rawData.rowCount,
        processedRows: processedResult.data.length,
        duplicates: processedResult.duplicates.length,
        errors: processedResult.errors.length,
        warnings: structureValidation.warnings || []
      };

      setLastImportStats(importStats);
      setImportProgress(100);

      // Log event
      logInventoryEvent(EVENT_TYPES.INVENTORY_IMPORT, importStats);

      return {
        success: true,
        data: processedResult.data,
        statistics: importStats,
        duplicates: processedResult.duplicates,
        errors: processedResult.errors,
        warnings: structureValidation.warnings || []
      };

    } catch (error) {
      console.error('Main inventory import error:', error);
      
      // Log error event
      logInventoryEvent(EVENT_TYPES.ERROR_OCCURRED, {
        context: 'main_inventory_import',
        error: error.message,
        fileName: file?.name
      });

      return {
        success: false,
        error: error.message,
        data: [],
        statistics: null
      };
    } finally {
      setIsLoading(false);
      setImportProgress(0);
    }
  }, [logInventoryEvent]);

  /**
   * Import Sweed report file (CSV or Excel)
   * @param {File} file - File to import
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} - Import result
   */
  const importSweedData = useCallback(async (file, onProgress = null) => {
    try {
      setIsLoading(true);
      setImportProgress(0);

      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      if (file.size === 0) {
        throw new Error('File is empty');
      }

      // Detect file type and show progress
      const fileType = DataProcessor.detectFileType(file);
      console.log(`Importing ${fileType} Sweed file:`, file.name);

      // Parse file (Excel or CSV)
      setImportProgress(10);
      const rawData = await DataProcessor.parseFile(file, (loaded, total) => {
        const progressPercent = Math.floor((loaded / total) * 40) + 10; // 10-50%
        setImportProgress(progressPercent);
        if (onProgress) onProgress(progressPercent);
      });

      // Validate structure
      setImportProgress(50);
      const structureValidation = DataProcessor.validateSweedStructure(rawData.data);
      if (!structureValidation.isValid) {
        throw new Error(`Invalid file structure: ${structureValidation.errors.join(', ')}`);
      }

      // Process data
      setImportProgress(60);
      const processedResult = DataProcessor.processSweedData(rawData.data);
      
      if (processedResult.errors.length > 0 && processedResult.data.length === 0) {
        throw new Error('No valid data could be processed from the file');
      }

      // Store processed data
      setImportProgress(80);
      StorageHelper.setItem(STORAGE_KEYS.SWEED_DATA, processedResult.data);
      setSweedData(processedResult.data);

      // Update statistics
      const importStats = {
        fileName: file.name,
        fileSize: file.size,
        fileType: fileType,
        importTime: new Date().toISOString(),
        dataSource: DATA_SOURCES.SWEED_REPORT,
        totalRows: rawData.rowCount,
        processedRows: processedResult.data.length,
        duplicates: processedResult.duplicates.length,
        errors: processedResult.errors.length,
        warnings: structureValidation.warnings || []
      };

      setLastImportStats(importStats);
      setImportProgress(100);

      // Log event
      logInventoryEvent(EVENT_TYPES.SWEED_IMPORT, importStats);

      return {
        success: true,
        data: processedResult.data,
        statistics: importStats,
        duplicates: processedResult.duplicates,
        errors: processedResult.errors,
        warnings: structureValidation.warnings || []
      };

    } catch (error) {
      console.error('Sweed data import error:', error);
      
      // Log error event
      logInventoryEvent(EVENT_TYPES.ERROR_OCCURRED, {
        context: 'sweed_import',
        error: error.message,
        fileName: file?.name
      });

      return {
        success: false,
        error: error.message,
        data: [],
        statistics: null
      };
    } finally {
      setIsLoading(false);
      setImportProgress(0);
    }
  }, [logInventoryEvent]);

  /**
   * Search products by barcode across both inventories
   * @param {string} barcode - Barcode to search for
   * @returns {Array} - Matching products
   */
  const searchByBarcode = useCallback((barcode) => {
    if (!barcode || barcode.trim() === '') {
      return [];
    }

    const cleanBarcode = barcode.trim().toUpperCase();
    return DataProcessor.findProductsByBarcode(cleanBarcode, mainInventory, sweedData);
  }, [mainInventory, sweedData]);

  /**
   * Search products by SKU across both inventories
   * @param {string} sku - SKU to search for
   * @returns {Array} - Matching products
   */
  const searchBySKU = useCallback((sku) => {
    if (!sku || sku.trim() === '') {
      return [];
    }

    const cleanSKU = sku.trim().toUpperCase();
    const matches = [];

    // Search main inventory
    mainInventory.forEach(item => {
      if (item.sku && item.sku.toUpperCase().includes(cleanSKU)) {
        matches.push({
          ...item,
          source: 'MainInventory',
          displaySource: '[MAIN]'
        });
      }
    });

    // Search Sweed data
    sweedData.forEach(item => {
      if (item.sku && item.sku.toUpperCase().includes(cleanSKU)) {
        matches.push({
          ...item,
          source: 'SweedReport',
          displaySource: '[SWEED]'
        });
      }
    });

    return matches;
  }, [mainInventory, sweedData]);

  /**
   * Search products by name across both inventories
   * @param {string} name - Product name to search for
   * @returns {Array} - Matching products
   */
  const searchByName = useCallback((name) => {
    if (!name || name.trim() === '') {
      return [];
    }

    const cleanName = name.trim().toLowerCase();
    const matches = [];

    // Search main inventory
    mainInventory.forEach(item => {
      if (item.productName && item.productName.toLowerCase().includes(cleanName)) {
        matches.push({
          ...item,
          source: 'MainInventory',
          displaySource: '[MAIN]'
        });
      }
    });

    // Search Sweed data
    sweedData.forEach(item => {
      if (item.productName && item.productName.toLowerCase().includes(cleanName)) {
        matches.push({
          ...item,
          source: 'SweedReport',
          displaySource: '[SWEED]'
        });
      }
    });

    return matches;
  }, [mainInventory, sweedData]);

  /**
   * Get inventory statistics
   * @returns {Object} - Inventory statistics
   */
  const getInventoryStats = useCallback(() => {
    return {
      mainInventory: {
        totalItems: mainInventory.length,
        uniqueBarcodes: new Set(mainInventory.map(item => item.barcode)).size,
        uniqueSKUs: new Set(mainInventory.map(item => item.sku)).size,
        brands: new Set(mainInventory.map(item => item.brand).filter(Boolean)).size,
        locations: new Set(mainInventory.map(item => item.location).filter(Boolean)).size
      },
      sweedData: {
        totalItems: sweedData.length,
        uniqueBarcodes: new Set(sweedData.map(item => item.barcode)).size,
        uniqueSKUs: new Set(sweedData.map(item => item.sku)).size,
        brands: new Set(sweedData.map(item => item.brand).filter(Boolean)).size,
        orders: new Set(sweedData.map(item => item.orderNumber).filter(Boolean)).size
      },
      combined: {
        totalItems: mainInventory.length + sweedData.length,
        uniqueBarcodes: new Set([
          ...mainInventory.map(item => item.barcode),
          ...sweedData.map(item => item.barcode)
        ]).size
      }
    };
  }, [mainInventory, sweedData]);

  /**
   * Clear all inventory data
   * @returns {Promise<Object>} - Clear result
   */
  const clearAllData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Clear storage
      StorageHelper.removeItem(STORAGE_KEYS.INVENTORY_DATA);
      StorageHelper.removeItem(STORAGE_KEYS.SWEED_DATA);

      // Clear state
      setMainInventory([]);
      setSweedData([]);
      setLastImportStats(null);

      // Log event
      logInventoryEvent(EVENT_TYPES.SESSION_CLEARED, {
        context: 'inventory_data',
        clearedItems: mainInventory.length + sweedData.length
      });

      return { success: true };

    } catch (error) {
      console.error('Error clearing inventory data:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [mainInventory.length, sweedData.length, logInventoryEvent]);

  /**
   * Export inventory data to CSV
   * @param {string} type - Type of data to export ('main' or 'sweed')
   * @returns {string} - CSV string
   */
  const exportToCSV = useCallback((type = 'main') => {
    try {
      const data = type === 'main' ? mainInventory : sweedData;
      
      if (data.length === 0) {
        throw new Error('No data to export');
      }

      const columns = type === 'main' ? [
        { key: 'facilityName', header: 'Facility Name' },
        { key: 'productName', header: 'Product Name' },
        { key: 'brand', header: 'Brand' },
        { key: 'strain', header: 'Strain' },
        { key: 'size', header: 'Size' },
        { key: 'sku', header: 'SKU' },
        { key: 'barcode', header: 'Barcode' },
        { key: 'bioTrackCode', header: 'BioTrack Code' },
        { key: 'quantity', header: 'Quantity' },
        { key: 'location', header: 'Location' },
        { key: 'distributor', header: 'Distributor' }
      ] : [
        { key: 'productName', header: 'Product Name' },
        { key: 'brand', header: 'Brand' },
        { key: 'strain', header: 'Strain' },
        { key: 'size', header: 'Size' },
        { key: 'sku', header: 'SKU' },
        { key: 'barcode', header: 'Barcode' },
        { key: 'externalTrackCode', header: 'External Track Code' },
        { key: 'quantity', header: 'Quantity' },
        { key: 'shipToLocation', header: 'Ship To Location' },
        { key: 'orderNumber', header: 'Order Number' },
        { key: 'requestDate', header: 'Request Date' }
      ];

      return DataProcessor.exportToCSV(data, columns);

    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }, [mainInventory, sweedData]);

  /**
   * Get recent import history
   * @param {number} limit - Number of recent imports to return
   * @returns {Array} - Recent import events
   */
  const getRecentImports = useCallback((limit = 10) => {
    return importHistory
      .filter(event => 
        event.type === EVENT_TYPES.INVENTORY_IMPORT || 
        event.type === EVENT_TYPES.SWEED_IMPORT
      )
      .slice(0, limit);
  }, [importHistory]);

  return {
    // State
    mainInventory,
    sweedData,
    isLoading,
    importProgress,
    lastImportStats,
    importHistory,

    // Actions
    importMainInventory,
    importSweedData,
    clearAllData,

    // Search
    searchByBarcode,
    searchBySKU,
    searchByName,

    // Utilities
    getInventoryStats,
    exportToCSV,
    getRecentImports,

    // Computed values
    hasMainInventory: mainInventory.length > 0,
    hasSweedData: sweedData.length > 0,
    totalItems: mainInventory.length + sweedData.length
  };
};