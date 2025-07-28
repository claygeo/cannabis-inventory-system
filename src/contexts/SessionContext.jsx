import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { DataProcessor } from '../utils/dataProcessor.js';
import { EVENT_TYPES } from '../constants.js';
import storage from '../utils/storage.js';

const SessionContext = createContext();

// Session action types
const SESSION_ACTIONS = {
  SET_SCANNED_ITEMS: 'SET_SCANNED_ITEMS',
  SET_SCANNED_SWEED_ITEMS: 'SET_SCANNED_SWEED_ITEMS',
  ADD_SCANNED_ITEM: 'ADD_SCANNED_ITEM',
  ADD_SCANNED_SWEED_ITEM: 'ADD_SCANNED_SWEED_ITEM',
  REMOVE_SCANNED_ITEM: 'REMOVE_SCANNED_ITEM',
  REMOVE_SCANNED_SWEED_ITEM: 'REMOVE_SCANNED_SWEED_ITEM',
  CLEAR_SCANNED_ITEMS: 'CLEAR_SCANNED_ITEMS',
  CLEAR_ALL_SESSION_DATA: 'CLEAR_ALL_SESSION_DATA',
  SET_ENHANCED_DATA: 'SET_ENHANCED_DATA',
  UPDATE_ENHANCED_DATA: 'UPDATE_ENHANCED_DATA',
  SET_SESSION_EVENTS: 'SET_SESSION_EVENTS'
};

// Initial session state
const initialState = {
  scannedItems: [],
  scannedSweedItems: [], 
  enhancedData: {},
  sessionEvents: []
};

// Session reducer
function sessionReducer(state, action) {
  switch (action.type) {
    case SESSION_ACTIONS.SET_SCANNED_ITEMS:
      return {
        ...state,
        scannedItems: action.payload
      };
      
    case SESSION_ACTIONS.SET_SCANNED_SWEED_ITEMS:
      return {
        ...state,
        scannedSweedItems: action.payload
      };
      
    case SESSION_ACTIONS.ADD_SCANNED_ITEM:
      if (!state.scannedItems.includes(action.payload)) {
        return {
          ...state,
          scannedItems: [...state.scannedItems, action.payload]
        };
      }
      return state;
      
    case SESSION_ACTIONS.ADD_SCANNED_SWEED_ITEM:
      if (!state.scannedSweedItems.includes(action.payload)) {
        return {
          ...state,
          scannedSweedItems: [...state.scannedSweedItems, action.payload]
        };
      }
      return state;
      
    case SESSION_ACTIONS.REMOVE_SCANNED_ITEM:
      return {
        ...state,
        scannedItems: state.scannedItems.filter(item => item !== action.payload)
      };
      
    case SESSION_ACTIONS.REMOVE_SCANNED_SWEED_ITEM:
      return {
        ...state,
        scannedSweedItems: state.scannedSweedItems.filter(item => item !== action.payload)
      };
      
    case SESSION_ACTIONS.CLEAR_SCANNED_ITEMS:
      return {
        ...state,
        scannedItems: [],
        scannedSweedItems: []
      };
      
    case SESSION_ACTIONS.CLEAR_ALL_SESSION_DATA:
      return {
        ...initialState
      };
      
    case SESSION_ACTIONS.SET_ENHANCED_DATA:
      return {
        ...state,
        enhancedData: action.payload
      };
      
    case SESSION_ACTIONS.UPDATE_ENHANCED_DATA:
      return {
        ...state,
        enhancedData: {
          ...state.enhancedData,
          ...action.payload
        }
      };
      
    case SESSION_ACTIONS.SET_SESSION_EVENTS:
      return {
        ...state,
        sessionEvents: action.payload
      };
      
    default:
      return state;
  }
}

// SessionProvider component
export function SessionProvider({ children }) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  // Load session data from storage on mount
  React.useEffect(() => {
    const scannedItems = storage.getScannedItems();
    const scannedSweedItems = storage.getScannedSweedItems();
    const enhancedData = storage.getEnhancedData();
    const sessionEvents = storage.getSessionData();
    
    dispatch({ type: SESSION_ACTIONS.SET_SCANNED_ITEMS, payload: scannedItems });
    dispatch({ type: SESSION_ACTIONS.SET_SCANNED_SWEED_ITEMS, payload: scannedSweedItems });
    dispatch({ type: SESSION_ACTIONS.SET_ENHANCED_DATA, payload: enhancedData });
    dispatch({ type: SESSION_ACTIONS.SET_SESSION_EVENTS, payload: sessionEvents });
  }, []);

  // Add scanned item
  const addScannedItem = useCallback((barcode, sku, source) => {
    const key = `${barcode}_${sku}`;
    
    if (source === 'MainInventory') {
      if (!storage.isItemScanned(barcode, sku)) {
        storage.addScannedItem(barcode, sku);
        dispatch({ type: SESSION_ACTIONS.ADD_SCANNED_ITEM, payload: key });
        
        storage.addSessionEvent(
          EVENT_TYPES.ITEM_SCANNED,
          `Main inventory item scanned: SKU ${sku}`,
          `Barcode: ${barcode}`
        );
        
        return true;
      }
    } else if (source === 'SweedReport') {
      if (!storage.isSweedItemScanned(barcode, sku)) {
        storage.addScannedSweedItem(barcode, sku);
        dispatch({ type: SESSION_ACTIONS.ADD_SCANNED_SWEED_ITEM, payload: key });
        
        storage.addSessionEvent(
          EVENT_TYPES.ITEM_SCANNED,
          `Sweed item scanned: SKU ${sku}`,
          `Barcode: ${barcode}`
        );
        
        return true;
      }
    }
    
    return false; // Already scanned
  }, []);

  // Remove scanned item  
  const removeScannedItem = useCallback((barcode, sku, source) => {
    const key = `${barcode}_${sku}`;
    
    if (source === 'MainInventory') {
      storage.removeScannedItem(barcode, sku);
      dispatch({ type: SESSION_ACTIONS.REMOVE_SCANNED_ITEM, payload: key });
    } else if (source === 'SweedReport') {
      storage.removeScannedSweedItem(barcode, sku);
      dispatch({ type: SESSION_ACTIONS.REMOVE_SCANNED_SWEED_ITEM, payload: key });
    }
    
    storage.addSessionEvent(
      EVENT_TYPES.SESSION_CLEARED,
      `Item removed from scan list: SKU ${sku}`,
      `Source: ${source}`
    );
  }, []);

  // Check if item is scanned
  const isItemScanned = useCallback((barcode, sku, source) => {
    if (source === 'MainInventory') {
      return storage.isItemScanned(barcode, sku);
    } else if (source === 'SweedReport') {
      return storage.isSweedItemScanned(barcode, sku);
    }
    return false;
  }, []);

  // Clear all scanned items
  const clearScannedItems = useCallback(() => {
    storage.clearScannedItems();
    storage.clearScannedSweedItems();
    
    dispatch({ type: SESSION_ACTIONS.CLEAR_SCANNED_ITEMS });
    
    storage.addSessionEvent(
      EVENT_TYPES.SESSION_CLEARED,
      'All scanned items cleared',
      ''
    );
  }, []);

  // Get scanned items details
  const getScannedItemsDetails = useCallback((inventoryData, sweedData) => {
    return DataProcessor.getScannedItemsDetails(
      state.scannedItems,
      state.scannedSweedItems,
      inventoryData,
      sweedData
    );
  }, [state.scannedItems, state.scannedSweedItems]);

  // Enhanced data management
  const setEnhancedDataForSKU = useCallback((sku, dataType, value) => {
    storage.setEnhancedDataForSKU(sku, dataType, value);
    
    const updatedData = storage.getEnhancedData();
    dispatch({ type: SESSION_ACTIONS.SET_ENHANCED_DATA, payload: updatedData });
    
    storage.addSessionEvent(
      EVENT_TYPES.LABEL_GENERATED,
      `Enhanced data saved for SKU ${sku}`,
      `${dataType}: ${value}`
    );
  }, []);

  const getEnhancedDataForSKU = useCallback((sku, dataType) => {
    return storage.getEnhancedDataForSKU(sku, dataType);
  }, []);

  const hasEnhancedDataForSKU = useCallback((sku) => {
    return storage.hasEnhancedDataForSKU(sku);
  }, []);

  const clearEnhancedDataForSKU = useCallback((sku) => {
    storage.clearEnhancedDataForSKU(sku);
    
    const updatedData = storage.getEnhancedData();
    dispatch({ type: SESSION_ACTIONS.SET_ENHANCED_DATA, payload: updatedData });
    
    storage.addSessionEvent(
      EVENT_TYPES.SESSION_CLEARED,
      `Enhanced data cleared for SKU ${sku}`,
      ''
    );
  }, []);

  const clearAllEnhancedData = useCallback(() => {
    storage.clearEnhancedData();
    dispatch({ type: SESSION_ACTIONS.SET_ENHANCED_DATA, payload: {} });
    
    storage.addSessionEvent(
      EVENT_TYPES.SESSION_CLEARED,
      'All enhanced data cleared',
      ''
    );
  }, []);

  // Clear entire session
  const clearAllSessionData = useCallback(() => {
    storage.clearAllSessionData();
    dispatch({ type: SESSION_ACTIONS.CLEAR_ALL_SESSION_DATA });
    
    // This event is already logged in storage.clearAllSessionData()
  }, []);

  // Get session statistics
  const getSessionStats = useCallback(() => {
    return {
      mainItemsScanned: state.scannedItems.length,
      sweedItemsScanned: state.scannedSweedItems.length,
      totalItemsScanned: state.scannedItems.length + state.scannedSweedItems.length,
      enhancedDataCount: Object.keys(state.enhancedData).length,
      sessionEventsCount: state.sessionEvents.length,
      hasScannedItems: state.scannedItems.length > 0 || state.scannedSweedItems.length > 0
    };
  }, [state]);

  // Export session data
  const exportSessionData = useCallback(() => {
    return storage.exportSessionData();
  }, []);

  // Generate pick ticket data
  const generatePickTicketData = useCallback((inventoryData, sweedData) => {
    const scannedDetails = getScannedItemsDetails(inventoryData, sweedData);
    return DataProcessor.generatePickTicketData(scannedDetails);
  }, [getScannedItemsDetails]);

  // Process barcode scan
  const processBarcodeScan = useCallback((barcode, inventoryData, sweedData) => {
    const matches = DataProcessor.findProductsByBarcode(barcode, inventoryData, sweedData);
    
    if (matches.length === 0) {
      storage.addSessionEvent(
        EVENT_TYPES.ERROR,
        `Barcode not found: ${barcode}`,
        `Available items: ${inventoryData.length + sweedData.length}`
      );
      
      return {
        success: false,
        error: 'Barcode not found in any inventory',
        matches: []
      };
    }
    
    if (matches.length === 1) {
      // Single match - process directly
      const match = matches[0];
      const wasAdded = addScannedItem(match.barcode, match.sku, match.source);
      
      if (!wasAdded) {
        return {
          success: false,
          error: 'Item already scanned',
          matches: [match],
          alreadyScanned: true
        };
      }
      
      return {
        success: true,
        matches: [match],
        processed: match
      };
    }
    
    // Multiple matches - return for user selection
    return {
      success: true,
      matches,
      requiresSelection: true
    };
  }, [addScannedItem]);

  // Get items ready for label generation
  const getLabelGenerationItems = useCallback((inventoryData, sweedData) => {
    const scannedDetails = getScannedItemsDetails(inventoryData, sweedData);
    
    return scannedDetails.map(item => ({
      ...item,
      hasEnhancedData: hasEnhancedDataForSKU(item.sku),
      enhancedData: {
        labelQuantity: getEnhancedDataForSKU(item.sku, 'LabelQuantity') || '1',
        caseQuantity: getEnhancedDataForSKU(item.sku, 'CaseQuantity'),
        boxCount: getEnhancedDataForSKU(item.sku, 'BoxCount'),
        harvestDate: getEnhancedDataForSKU(item.sku, 'HarvestDate'),
        packagedDate: getEnhancedDataForSKU(item.sku, 'PackagedDate')
      }
    }));
  }, [getScannedItemsDetails, hasEnhancedDataForSKU, getEnhancedDataForSKU]);

  // Context value
  const value = {
    // State
    scannedItems: state.scannedItems,
    scannedSweedItems: state.scannedSweedItems,
    enhancedData: state.enhancedData,
    sessionEvents: state.sessionEvents,
    
    // Scanning actions
    addScannedItem,
    removeScannedItem,
    isItemScanned,
    clearScannedItems,
    processBarcodeScan,
    
    // Enhanced data actions
    setEnhancedDataForSKU,
    getEnhancedDataForSKU,
    hasEnhancedDataForSKU,
    clearEnhancedDataForSKU,
    clearAllEnhancedData,
    
    // Session management
    clearAllSessionData,
    getSessionStats,
    exportSessionData,
    
    // Data helpers
    getScannedItemsDetails,
    generatePickTicketData,
    getLabelGenerationItems
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

// Custom hook to use session context
export function useSession() {
  const context = useContext(SessionContext);
  
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  
  return context;
}

// Session stats component
export function SessionStats({ className = '' }) {
  const { getSessionStats } = useSession();
  const stats = getSessionStats();
  
  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      <div className="bg-green-50 p-3 rounded-lg">
        <div className="text-2xl font-bold text-green-600">{stats.mainItemsScanned}</div>
        <div className="text-sm text-green-700">Main Items Scanned</div>
      </div>
      
      <div className="bg-orange-50 p-3 rounded-lg">
        <div className="text-2xl font-bold text-orange-600">{stats.sweedItemsScanned}</div>
        <div className="text-sm text-orange-700">Sweed Items Scanned</div>
      </div>
    </div>
  );
}