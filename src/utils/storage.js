import { STORAGE_KEYS, EVENT_TYPES } from '../constants.js';

/**
 * Storage utility functions for Cannabis Inventory Management System
 * Handles all localStorage operations with proper error handling
 */

class StorageManager {
  constructor() {
    this.initializeStorage();
  }

  initializeStorage() {
    // Initialize empty collections if they don't exist
    if (!this.getItem(STORAGE_KEYS.INVENTORY_DATA)) {
      this.setItem(STORAGE_KEYS.INVENTORY_DATA, []);
    }
    if (!this.getItem(STORAGE_KEYS.SWEED_DATA)) {
      this.setItem(STORAGE_KEYS.SWEED_DATA, []);
    }
    if (!this.getItem(STORAGE_KEYS.SCANNED_ITEMS)) {
      this.setItem(STORAGE_KEYS.SCANNED_ITEMS, []);
    }
    if (!this.getItem(STORAGE_KEYS.SCANNED_SWEED_ITEMS)) {
      this.setItem(STORAGE_KEYS.SCANNED_SWEED_ITEMS, []);
    }
    if (!this.getItem(STORAGE_KEYS.ENHANCED_DATA)) {
      this.setItem(STORAGE_KEYS.ENHANCED_DATA, {});
    }
    if (!this.getItem(STORAGE_KEYS.SESSION_DATA)) {
      this.setItem(STORAGE_KEYS.SESSION_DATA, []);
    }
  }

  // Generic storage methods
  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error saving to localStorage: ${key}`, error);
      return false;
    }
  }

  getItem(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage: ${key}`, error);
      return null;
    }
  }

  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage: ${key}`, error);
      return false;
    }
  }

  // User Management
  setCurrentUser(user) {
    return this.setItem(STORAGE_KEYS.CURRENT_USER, user);
  }

  getCurrentUser() {
    return this.getItem(STORAGE_KEYS.CURRENT_USER);
  }

  clearCurrentUser() {
    return this.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  // Inventory Data Management
  setInventoryData(data) {
    return this.setItem(STORAGE_KEYS.INVENTORY_DATA, data);
  }

  getInventoryData() {
    return this.getItem(STORAGE_KEYS.INVENTORY_DATA) || [];
  }

  clearInventoryData() {
    return this.setItem(STORAGE_KEYS.INVENTORY_DATA, []);
  }

  // Sweed Data Management
  setSweedData(data) {
    return this.setItem(STORAGE_KEYS.SWEED_DATA, data);
  }

  getSweedData() {
    return this.getItem(STORAGE_KEYS.SWEED_DATA) || [];
  }

  clearSweedData() {
    return this.setItem(STORAGE_KEYS.SWEED_DATA, []);
  }

  // Scanned Items Management
  getScannedItems() {
    return this.getItem(STORAGE_KEYS.SCANNED_ITEMS) || [];
  }

  setScannedItems(items) {
    return this.setItem(STORAGE_KEYS.SCANNED_ITEMS, items);
  }

  addScannedItem(barcode, sku) {
    const scannedItems = this.getScannedItems();
    const key = `${barcode}_${sku}`;
    if (!scannedItems.includes(key)) {
      scannedItems.push(key);
      return this.setScannedItems(scannedItems);
    }
    return false; // Already scanned
  }

  removeScannedItem(barcode, sku) {
    const scannedItems = this.getScannedItems();
    const key = `${barcode}_${sku}`;
    const index = scannedItems.indexOf(key);
    if (index > -1) {
      scannedItems.splice(index, 1);
      return this.setScannedItems(scannedItems);
    }
    return false;
  }

  isItemScanned(barcode, sku) {
    const scannedItems = this.getScannedItems();
    const key = `${barcode}_${sku}`;
    return scannedItems.includes(key);
  }

  clearScannedItems() {
    return this.setScannedItems([]);
  }

  // Scanned Sweed Items Management
  getScannedSweedItems() {
    return this.getItem(STORAGE_KEYS.SCANNED_SWEED_ITEMS) || [];
  }

  setScannedSweedItems(items) {
    return this.setItem(STORAGE_KEYS.SCANNED_SWEED_ITEMS, items);
  }

  addScannedSweedItem(barcode, sku) {
    const scannedItems = this.getScannedSweedItems();
    const key = `${barcode}_${sku}`;
    if (!scannedItems.includes(key)) {
      scannedItems.push(key);
      return this.setScannedSweedItems(scannedItems);
    }
    return false; // Already scanned
  }

  removeScannedSweedItem(barcode, sku) {
    const scannedItems = this.getScannedSweedItems();
    const key = `${barcode}_${sku}`;
    const index = scannedItems.indexOf(key);
    if (index > -1) {
      scannedItems.splice(index, 1);
      return this.setScannedSweedItems(scannedItems);
    }
    return false;
  }

  isSweedItemScanned(barcode, sku) {
    const scannedItems = this.getScannedSweedItems();
    const key = `${barcode}_${sku}`;
    return scannedItems.includes(key);
  }

  clearScannedSweedItems() {
    return this.setScannedSweedItems([]);
  }

  // Enhanced Data Management (for label generation)
  getEnhancedData() {
    return this.getItem(STORAGE_KEYS.ENHANCED_DATA) || {};
  }

  setEnhancedData(data) {
    return this.setItem(STORAGE_KEYS.ENHANCED_DATA, data);
  }

  getEnhancedDataForSKU(sku, dataType) {
    const enhancedData = this.getEnhancedData();
    const key = `${sku}_${dataType}`;
    return enhancedData[key] || '';
  }

  setEnhancedDataForSKU(sku, dataType, value) {
    const enhancedData = this.getEnhancedData();
    const key = `${sku}_${dataType}`;
    enhancedData[key] = value;
    return this.setEnhancedData(enhancedData);
  }

  hasEnhancedDataForSKU(sku) {
    const enhancedData = this.getEnhancedData();
    const dataTypes = ['LabelQuantity', 'CaseQuantity', 'BoxCount', 'HarvestDate', 'PackagedDate'];
    
    return dataTypes.some(dataType => {
      const key = `${sku}_${dataType}`;
      return enhancedData[key] && enhancedData[key] !== '';
    });
  }

  clearEnhancedData() {
    return this.setEnhancedData({});
  }

  clearEnhancedDataForSKU(sku) {
    const enhancedData = this.getEnhancedData();
    const dataTypes = ['LabelQuantity', 'CaseQuantity', 'BoxCount', 'HarvestDate', 'PackagedDate'];
    
    dataTypes.forEach(dataType => {
      const key = `${sku}_${dataType}`;
      delete enhancedData[key];
    });
    
    return this.setEnhancedData(enhancedData);
  }

  // Session Data Management (for logging and tracking)
  getSessionData() {
    return this.getItem(STORAGE_KEYS.SESSION_DATA) || [];
  }

  setSessionData(data) {
    return this.setItem(STORAGE_KEYS.SESSION_DATA, data);
  }

  addSessionEvent(eventType, details, additionalInfo = '') {
    const sessionData = this.getSessionData();
    const currentUser = this.getCurrentUser();
    
    const logEntry = {
      eventType,
      timestamp: new Date().toISOString(),
      user: currentUser ? currentUser.username : 'Unknown',
      details,
      additionalInfo
    };

    sessionData.push(logEntry);
    return this.setSessionData(sessionData);
  }

  clearSessionData() {
    return this.setSessionData([]);
  }

  // Complete Session Management
  clearAllSessionData() {
    this.clearScannedItems();
    this.clearScannedSweedItems();
    this.clearEnhancedData();
    this.clearSessionData();
    this.addSessionEvent(EVENT_TYPES.SESSION_CLEARED, 'All session data cleared', 'Manual reset');
    return true;
  }

  clearAllData() {
    this.clearInventoryData();
    this.clearSweedData();
    this.clearAllSessionData();
    this.clearCurrentUser();
    return true;
  }

  // Get summary statistics
  getSessionSummary() {
    const currentUser = this.getCurrentUser();
    const inventoryData = this.getInventoryData();
    const sweedData = this.getSweedData();
    const scannedItems = this.getScannedItems();
    const scannedSweedItems = this.getScannedSweedItems();
    const sessionData = this.getSessionData();

    return {
      user: currentUser,
      inventoryItemsAvailable: inventoryData.length,
      sweedItemsAvailable: sweedData.length,
      totalItemsAvailable: inventoryData.length + sweedData.length,
      mainItemsScanned: scannedItems.length,
      sweedItemsScanned: scannedSweedItems.length,
      totalItemsScanned: scannedItems.length + scannedSweedItems.length,
      sessionEventsCount: sessionData.length,
      lastActivity: sessionData.length > 0 ? sessionData[sessionData.length - 1].timestamp : null
    };
  }

  // Export session data for reporting
  exportSessionData() {
    const summary = this.getSessionSummary();
    const sessionData = this.getSessionData();
    const inventoryData = this.getInventoryData();
    const sweedData = this.getSweedData();
    
    return {
      summary,
      sessionEvents: sessionData,
      scannedItemsDetails: this.getScannedItemsDetails(),
      enhancedData: this.getEnhancedData(),
      exportTimestamp: new Date().toISOString()
    };
  }

  // Get detailed information about scanned items
  getScannedItemsDetails() {
    const scannedItems = this.getScannedItems();
    const scannedSweedItems = this.getScannedSweedItems();
    const inventoryData = this.getInventoryData();
    const sweedData = this.getSweedData();
    const details = [];

    // Process main inventory scanned items
    scannedItems.forEach(scannedKey => {
      const [barcode, sku] = scannedKey.split('_');
      const item = inventoryData.find(item => 
        item.barcode === barcode && item.sku === sku
      );
      
      if (item) {
        details.push({
          source: 'Main Inventory',
          ...item,
          scannedAt: new Date().toISOString()
        });
      }
    });

    // Process Sweed scanned items
    scannedSweedItems.forEach(scannedKey => {
      const [barcode, sku] = scannedKey.split('_');
      const item = sweedData.find(item => 
        item.barcode === barcode && item.sku === sku
      );
      
      if (item) {
        details.push({
          source: 'Sweed Report',
          ...item,
          scannedAt: new Date().toISOString()
        });
      }
    });

    return details;
  }
}

// Create and export singleton instance
const storage = new StorageManager();
export default storage;