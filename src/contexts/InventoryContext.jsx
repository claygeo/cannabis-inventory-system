import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { DataProcessor } from '../utils/dataProcessor.js';
import { EVENT_TYPES } from '../constants.js';
import storage from '../utils/storage.js';

const InventoryContext = createContext();

// Inventory action types
const INVENTORY_ACTIONS = {
  SET_MAIN_INVENTORY: 'SET_MAIN_INVENTORY',
  SET_SWEED_DATA: 'SET_SWEED_DATA',
  CLEAR_MAIN_INVENTORY: 'CLEAR_MAIN_INVENTORY',
  CLEAR_SWEED_DATA: 'CLEAR_SWEED_DATA',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Initial inventory state
const initialState = {
  mainInventory: [],
  sweedData: [],
  isLoading: false,
  error: null,
  lastMainImport: null,
  lastSweedImport: null
};

// Inventory reducer
function inventoryReducer(state, action) {
  switch (action.type) {
    case INVENTORY_ACTIONS.SET_MAIN_INVENTORY:
      return {
        ...state,
        mainInventory: action.payload.data,
        lastMainImport: action.payload.timestamp,
        isLoading: false,
        error: null
      };
      
    case INVENTORY_ACTIONS.SET_SWEED_DATA:
      return {
        ...state,
        sweedData: action.payload.data,
        lastSweedImport: action.payload.timestamp,
        isLoading: false,
        error: null
      };
      
    case INVENTORY_ACTIONS.CLEAR_MAIN_INVENTORY:
      return {
        ...state,
        mainInventory: [],
        lastMainImport: null
      };
      
    case INVENTORY_ACTIONS.CLEAR_SWEED_DATA:
      return {
        ...state,
        sweedData: [],
        lastSweedImport: null
      };
      
    case INVENTORY_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
      
    case INVENTORY_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
      
    case INVENTORY_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
      
    default:
      return state;
  }
}

// InventoryProvider component
export function InventoryProvider({ children }) {
  const [state, dispatch] = useReducer(inventoryReducer, initialState);

  // Load data from storage on mount
  React.useEffect(() => {
    const mainInventory = storage.getInventoryData();
    const sweedData = storage.getSweedData();
    
    if (mainInventory.length > 0) {
      dispatch({
        type: INVENTORY_ACTIONS.SET_MAIN_INVENTORY,
        payload: { 
          data: mainInventory, 
          timestamp: new Date().toISOString() 
        }
      });
    }
    
    if (sweedData.length > 0) {
      dispatch({
        type: INVENTORY_ACTIONS.SET_SWEED_DATA,
        payload: { 
          data: sweedData, 
          timestamp: new Date().toISOString() 
        }
      });
    }
  }, []);

  // Import main inventory from Excel or CSV file
  const importMainInventory = useCallback(async (file, onProgress = null) => {
    dispatch({ type: INVENTORY_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: INVENTORY_ACTIONS.CLEAR_ERROR });

    try {
      // Parse file (Excel or CSV) - FIXED: Now uses parseFile instead of parseCSV
      const fileData = await DataProcessor.parseFile(file, onProgress);
      
      if (fileData.errors.length > 0) {
        console.warn('File parsing warnings:', fileData.errors);
      }

      // Validate structure
      const validation = DataProcessor.validateMainInventoryStructure(fileData.data);
      if (!validation.isValid) {
        throw new Error(`Invalid file structure: ${validation.errors.join(', ')}`);
      }

      // Process the data
      const processedData = DataProcessor.processMainInventoryData(fileData.data);
      
      if (processedData.errors.length > 0) {
        console.warn('Data processing errors:', processedData.errors);
      }

      // Save to storage
      storage.setInventoryData(processedData.data);

      // Log import
      storage.addSessionEvent(
        EVENT_TYPES.MAIN_INVENTORY_IMPORT,
        `Items: ${processedData.statistics.processedRows}, Duplicates: ${processedData.statistics.duplicates}`,
        `File: ${file.name}, Size: ${file.size} bytes`
      );

      // Update state
      dispatch({
        type: INVENTORY_ACTIONS.SET_MAIN_INVENTORY,
        payload: { 
          data: processedData.data, 
          timestamp: new Date().toISOString() 
        }
      });

      return {
        success: true,
        data: processedData.data,
        statistics: processedData.statistics,
        duplicates: processedData.duplicates,
        errors: processedData.errors
      };

    } catch (error) {
      const errorMessage = error.message || 'Failed to import main inventory';
      
      // Log error
      storage.addSessionEvent(
        EVENT_TYPES.ERROR,
        `Main inventory import failed: ${errorMessage}`,
        `File: ${file?.name || 'Unknown'}`
      );

      dispatch({
        type: INVENTORY_ACTIONS.SET_ERROR,
        payload: errorMessage
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }, []);

  // Import Sweed data from Excel or CSV file
  const importSweedData = useCallback(async (file, onProgress = null) => {
    dispatch({ type: INVENTORY_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: INVENTORY_ACTIONS.CLEAR_ERROR });

    try {
      // Parse file (Excel or CSV) - FIXED: Now uses parseFile instead of parseCSV
      const fileData = await DataProcessor.parseFile(file, onProgress);
      
      if (fileData.errors.length > 0) {
        console.warn('File parsing warnings:', fileData.errors);
      }

      // Validate structure
      const validation = DataProcessor.validateSweedStructure(fileData.data);
      if (!validation.isValid) {
        throw new Error(`Invalid file structure: ${validation.errors.join(', ')}`);
      }

      // Process the data
      const processedData = DataProcessor.processSweedData(fileData.data);
      
      if (processedData.errors.length > 0) {
        console.warn('Data processing errors:', processedData.errors);
      }

      // Save to storage
      storage.setSweedData(processedData.data);

      // Log import
      storage.addSessionEvent(
        EVENT_TYPES.SWEED_IMPORT,
        `Items: ${processedData.statistics.processedRows}, Duplicates: ${processedData.statistics.duplicates}`,
        `File: ${file.name}, Size: ${file.size} bytes`
      );

      // Update state
      dispatch({
        type: INVENTORY_ACTIONS.SET_SWEED_DATA,
        payload: { 
          data: processedData.data, 
          timestamp: new Date().toISOString() 
        }
      });

      return {
        success: true,
        data: processedData.data,
        statistics: processedData.statistics,
        duplicates: processedData.duplicates,
        errors: processedData.errors
      };

    } catch (error) {
      const errorMessage = error.message || 'Failed to import Sweed data';
      
      // Log error
      storage.addSessionEvent(
        EVENT_TYPES.ERROR,
        `Sweed import failed: ${errorMessage}`,
        `File: ${file?.name || 'Unknown'}`
      );

      dispatch({
        type: INVENTORY_ACTIONS.SET_ERROR,
        payload: errorMessage
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }, []);

  // Clear main inventory
  const clearMainInventory = useCallback(() => {
    storage.clearInventoryData();
    dispatch({ type: INVENTORY_ACTIONS.CLEAR_MAIN_INVENTORY });
    
    storage.addSessionEvent(
      EVENT_TYPES.SESSION_CLEARED,
      'Main inventory data cleared',
      ''
    );
  }, []);

  // Clear Sweed data
  const clearSweedData = useCallback(() => {
    storage.clearSweedData();
    dispatch({ type: INVENTORY_ACTIONS.CLEAR_SWEED_DATA });
    
    storage.addSessionEvent(
      EVENT_TYPES.SESSION_CLEARED,
      'Sweed data cleared',
      ''
    );
  }, []);

  // Clear all inventory data
  const clearAllData = useCallback(() => {
    storage.clearInventoryData();
    storage.clearSweedData();
    
    dispatch({ type: INVENTORY_ACTIONS.CLEAR_MAIN_INVENTORY });
    dispatch({ type: INVENTORY_ACTIONS.CLEAR_SWEED_DATA });
    
    storage.addSessionEvent(
      EVENT_TYPES.SESSION_CLEARED,
      'All inventory data cleared',
      ''
    );
  }, []);

  // Find products by barcode
  const findProductsByBarcode = useCallback((barcode) => {
    return DataProcessor.findProductsByBarcode(
      barcode,
      state.mainInventory,
      state.sweedData
    );
  }, [state.mainInventory, state.sweedData]);

  // Get inventory statistics
  const getInventoryStats = useCallback(() => {
    return {
      mainInventoryCount: state.mainInventory.length,
      sweedDataCount: state.sweedData.length,
      totalItems: state.mainInventory.length + state.sweedData.length,
      lastMainImport: state.lastMainImport,
      lastSweedImport: state.lastSweedImport,
      hasMainInventory: state.mainInventory.length > 0,
      hasSweedData: state.sweedData.length > 0
    };
  }, [state]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: INVENTORY_ACTIONS.CLEAR_ERROR });
  }, []);

  // Search products
  const searchProducts = useCallback((searchTerm, source = 'both') => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return [];

    const searchInData = (data) => {
      return data.filter(item => 
        item.productName?.toLowerCase().includes(term) ||
        item.brand?.toLowerCase().includes(term) ||
        item.strain?.toLowerCase().includes(term) ||
        item.sku?.toLowerCase().includes(term) ||
        item.barcode?.toLowerCase().includes(term) ||
        item.bioTrackCode?.toLowerCase().includes(term)
      );
    };

    let results = [];
    
    if (source === 'main' || source === 'both') {
      const mainResults = searchInData(state.mainInventory).map(item => ({
        ...item,
        source: 'MainInventory',
        displaySource: '[MAIN]'
      }));
      results = results.concat(mainResults);
    }
    
    if (source === 'sweed' || source === 'both') {
      const sweedResults = searchInData(state.sweedData).map(item => ({
        ...item,
        source: 'SweedReport',
        displaySource: '[SWEED]'
      }));
      results = results.concat(sweedResults);
    }

    return results;
  }, [state.mainInventory, state.sweedData]);

  // Get product by SKU and source
  const getProductBySKU = useCallback((sku, source) => {
    if (source === 'MainInventory') {
      return state.mainInventory.find(item => item.sku === sku);
    } else if (source === 'SweedReport') {
      return state.sweedData.find(item => item.sku === sku);
    }
    return null;
  }, [state.mainInventory, state.sweedData]);

  // Context value
  const value = {
    // State
    mainInventory: state.mainInventory,
    sweedData: state.sweedData,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    importMainInventory,
    importSweedData,
    clearMainInventory,
    clearSweedData,
    clearAllData,
    clearError,
    
    // Helpers
    findProductsByBarcode,
    getInventoryStats,
    searchProducts,
    getProductBySKU
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

// Custom hook to use inventory context
export function useInventory() {
  const context = useContext(InventoryContext);
  
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  
  return context;
}

// Inventory stats component
export function InventoryStats({ className = '' }) {
  const { getInventoryStats } = useInventory();
  const stats = getInventoryStats();
  
  return (
    <div className={`grid grid-cols-3 gap-4 ${className}`}>
      <div className="bg-blue-50 p-3 rounded-lg">
        <div className="text-2xl font-bold text-blue-600">{stats.mainInventoryCount}</div>
        <div className="text-sm text-blue-700">Main Inventory</div>
      </div>
      
      <div className="bg-orange-50 p-3 rounded-lg">
        <div className="text-2xl font-bold text-orange-600">{stats.sweedDataCount}</div>
        <div className="text-sm text-orange-700">Sweed Items</div>
      </div>
      
      <div className="bg-green-50 p-3 rounded-lg">
        <div className="text-2xl font-bold text-green-600">{stats.totalItems}</div>
        <div className="text-sm text-green-700">Total Items</div>
      </div>
    </div>
  );
}