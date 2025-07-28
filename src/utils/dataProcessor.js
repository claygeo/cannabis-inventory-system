import Papa from 'papaparse';
import { MAIN_INVENTORY_COLUMNS, SWEED_COLUMNS, DATA_SOURCES } from '../constants.js';

/**
 * Data processing utilities for CSV imports and data manipulation
 */

export class DataProcessor {
  /**
   * Parse CSV file and return structured data
   * @param {File} file - CSV file to parse
   * @param {Function} onProgress - Progress callback (optional)
   * @returns {Promise<Object>} - Parsed data with metadata
   */
  static async parseCSV(file, onProgress = null) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        dynamicTyping: true,
        delimitersToGuess: [',', '\t', '|', ';'],
        step: onProgress ? (results, parser) => {
          onProgress(parser.streamer._input.length, file.size);
        } : undefined,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }
          
          const data = {
            data: results.data,
            meta: results.meta,
            errors: results.errors,
            rowCount: results.data.length,
            columnCount: results.data.length > 0 ? results.data[0].length : 0
          };
          
          resolve(data);
        },
        error: (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        }
      });
    });
  }

  /**
   * Process Main Inventory CSV data into structured format
   * @param {Array} rawData - Raw CSV data array
   * @returns {Object} - Processed data with statistics
   */
  static processMainInventoryData(rawData) {
    const processedData = [];
    const duplicates = [];
    const errors = [];
    const seenKeys = new Set();

    // Skip header rows (start from row 3, index 2)
    for (let i = 2; i < rawData.length; i++) {
      const row = rawData[i];
      
      try {
        // Extract data according to Main Inventory column mapping
        const item = {
          facilityName: this.cleanString(row[MAIN_INVENTORY_COLUMNS.FACILITY_NAME]),
          productName: this.cleanString(row[MAIN_INVENTORY_COLUMNS.PRODUCT_NAME]),
          brand: this.cleanString(row[MAIN_INVENTORY_COLUMNS.BRAND]),
          strain: this.cleanString(row[MAIN_INVENTORY_COLUMNS.STRAIN]),
          size: this.cleanString(row[MAIN_INVENTORY_COLUMNS.SIZE]),
          sku: this.cleanString(row[MAIN_INVENTORY_COLUMNS.SKU]),
          barcode: this.cleanString(row[MAIN_INVENTORY_COLUMNS.BARCODE]),
          bioTrackCode: this.cleanString(row[MAIN_INVENTORY_COLUMNS.BIOTRACK_CODE]),
          quantity: this.parseQuantity(row[MAIN_INVENTORY_COLUMNS.QUANTITY]),
          location: this.cleanString(row[MAIN_INVENTORY_COLUMNS.LOCATION]),
          distributor: this.cleanString(row[MAIN_INVENTORY_COLUMNS.DISTRIBUTOR]),
          dataSource: DATA_SOURCES.MAIN_INVENTORY,
          rowIndex: i + 1
        };

        // Validate required fields
        if (!item.barcode || !item.sku) {
          errors.push({
            row: i + 1,
            error: 'Missing required fields (barcode or SKU)',
            data: item
          });
          continue;
        }

        // Check for duplicates
        const uniqueKey = `${item.barcode}_${item.sku}`;
        if (seenKeys.has(uniqueKey)) {
          duplicates.push({
            row: i + 1,
            key: uniqueKey,
            data: item
          });
          // Still add with modified key to preserve data
          item.duplicateKey = `${uniqueKey}_DUP_${duplicates.length}`;
        } else {
          seenKeys.add(uniqueKey);
        }

        processedData.push(item);

      } catch (error) {
        errors.push({
          row: i + 1,
          error: error.message,
          data: row
        });
      }
    }

    return {
      data: processedData,
      statistics: {
        totalRows: rawData.length,
        processedRows: processedData.length,
        duplicates: duplicates.length,
        errors: errors.length,
        skippedRows: 2 // Header rows
      },
      duplicates,
      errors
    };
  }

  /**
   * Process Sweed Report CSV data into structured format
   * @param {Array} rawData - Raw CSV data array
   * @returns {Object} - Processed data with statistics
   */
  static processSweedData(rawData) {
    const processedData = [];
    const duplicates = [];
    const errors = [];
    const seenKeys = new Set();

    // Skip header rows (start from row 3, index 2)
    for (let i = 2; i < rawData.length; i++) {
      const row = rawData[i];
      
      try {
        // Extract data according to Sweed column mapping
        const item = {
          productName: this.cleanString(row[SWEED_COLUMNS.PRODUCT_NAME]),
          brand: this.cleanString(row[SWEED_COLUMNS.BRAND]),
          strain: this.cleanString(row[SWEED_COLUMNS.STRAIN]),
          size: this.cleanString(row[SWEED_COLUMNS.SIZE]),
          sku: this.cleanString(row[SWEED_COLUMNS.SKU]),
          barcode: this.cleanString(row[SWEED_COLUMNS.BARCODE]),
          externalTrackCode: this.cleanString(row[SWEED_COLUMNS.EXTERNAL_TRACK_CODE]),
          quantity: this.parseQuantity(row[SWEED_COLUMNS.QUANTITY]),
          shipToLocation: this.cleanString(row[SWEED_COLUMNS.SHIP_TO_LOCATION]),
          shipToAddress: this.cleanString(row[SWEED_COLUMNS.SHIP_TO_ADDRESS]),
          orderNumber: this.cleanString(row[SWEED_COLUMNS.ORDER_NUMBER]),
          requestDate: this.cleanString(row[SWEED_COLUMNS.REQUEST_DATE]),
          dataSource: DATA_SOURCES.SWEED_REPORT,
          // Map externalTrackCode to bioTrackCode for compatibility
          bioTrackCode: this.cleanString(row[SWEED_COLUMNS.EXTERNAL_TRACK_CODE]),
          rowIndex: i + 1
        };

        // Validate required fields
        if (!item.barcode || !item.sku) {
          errors.push({
            row: i + 1,
            error: 'Missing required fields (barcode or SKU)',
            data: item
          });
          continue;
        }

        // Check for duplicates
        const uniqueKey = `${item.barcode}_${item.sku}`;
        if (seenKeys.has(uniqueKey)) {
          duplicates.push({
            row: i + 1,
            key: uniqueKey,
            data: item
          });
          // Still add with modified key to preserve data
          item.duplicateKey = `${uniqueKey}_SWEED_DUP_${duplicates.length}`;
        } else {
          seenKeys.add(uniqueKey);
        }

        processedData.push(item);

      } catch (error) {
        errors.push({
          row: i + 1,
          error: error.message,
          data: row
        });
      }
    }

    return {
      data: processedData,
      statistics: {
        totalRows: rawData.length,
        processedRows: processedData.length,
        duplicates: duplicates.length,
        errors: errors.length,
        skippedRows: 2 // Header rows
      },
      duplicates,
      errors
    };
  }

  /**
   * Find all products matching a barcode across both inventories
   * @param {string} barcode - Barcode to search for
   * @param {Array} inventoryData - Main inventory data
   * @param {Array} sweedData - Sweed data
   * @returns {Array} - Array of matching products
   */
  static findProductsByBarcode(barcode, inventoryData, sweedData) {
    const matches = [];
    
    // Search main inventory
    inventoryData.forEach(item => {
      if (item.barcode === barcode) {
        matches.push({
          ...item,
          source: 'MainInventory',
          displaySource: '[MAIN]'
        });
      }
    });

    // Search Sweed data
    sweedData.forEach(item => {
      if (item.barcode === barcode) {
        matches.push({
          ...item,
          source: 'SweedReport',
          displaySource: '[SWEED]'
        });
      }
    });

    return matches;
  }

  /**
   * Get detailed information about scanned items
   * @param {Array} scannedItems - Array of scanned item keys
   * @param {Array} scannedSweedItems - Array of scanned Sweed item keys  
   * @param {Array} inventoryData - Main inventory data
   * @param {Array} sweedData - Sweed data
   * @returns {Array} - Detailed information about scanned items
   */
  static getScannedItemsDetails(scannedItems, scannedSweedItems, inventoryData, sweedData) {
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
          displaySource: '[MAIN]',
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
          displaySource: '[SWEED]',
          ...item,
          scannedAt: new Date().toISOString()
        });
      }
    });

    return details;
  }

  /**
   * Generate pick ticket data from scanned items
   * @param {Array} scannedItemsDetails - Detailed scanned items
   * @returns {Array} - Pick ticket data
   */
  static generatePickTicketData(scannedItemsDetails) {
    return scannedItemsDetails.map((item, index) => ({
      pickNumber: index + 1,
      source: item.displaySource,
      sku: item.sku,
      barcode: item.barcode,
      productName: item.productName,
      brand: item.brand,
      size: item.size,
      quantity: item.quantity,
      location: item.location || '',
      shipTo: item.shipToLocation || '',
      orderNumber: item.orderNumber || '',
      picked: false,
      notes: ''
    }));
  }

  // Utility methods

  /**
   * Clean and normalize string values
   * @param {any} value - Value to clean
   * @returns {string} - Cleaned string
   */
  static cleanString(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  /**
   * Parse quantity values with error handling
   * @param {any} value - Value to parse as quantity
   * @returns {number} - Parsed quantity or 0
   */
  static parseQuantity(value) {
    if (value === null || value === undefined || value === '') return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Validate CSV structure for Main Inventory
   * @param {Array} data - Raw CSV data
   * @returns {Object} - Validation result
   */
  static validateMainInventoryStructure(data) {
    const errors = [];
    const warnings = [];

    if (data.length < 3) {
      errors.push('File must have at least 3 rows (headers + data)');
      return { isValid: false, errors, warnings };
    }

    // Check if we have enough columns
    const firstDataRow = data[2]; // Skip header rows
    if (!firstDataRow || firstDataRow.length < 28) {
      errors.push('Missing required columns. Expected at least 28 columns for Main Inventory format.');
    }

    // Check for common column indicators
    const headerRow = data[1]; // Second row usually contains headers
    if (headerRow) {
      const expectedHeaders = ['Product Name', 'Brand', 'SKU', 'Barcode'];
      const missingHeaders = expectedHeaders.filter(header => 
        !headerRow.some(cell => 
          String(cell).toLowerCase().includes(header.toLowerCase())
        )
      );
      
      if (missingHeaders.length > 0) {
        warnings.push(`Potentially missing headers: ${missingHeaders.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate CSV structure for Sweed Report
   * @param {Array} data - Raw CSV data
   * @returns {Object} - Validation result
   */
  static validateSweedStructure(data) {
    const errors = [];
    const warnings = [];

    if (data.length < 3) {
      errors.push('File must have at least 3 rows (headers + data)');
      return { isValid: false, errors, warnings };
    }

    // Check if we have enough columns
    const firstDataRow = data[2]; // Skip header rows
    if (!firstDataRow || firstDataRow.length < 12) {
      errors.push('Missing required columns. Expected at least 12 columns for Sweed Report format.');
    }

    // Check for common column indicators
    const headerRow = data[1]; // Second row usually contains headers
    if (headerRow) {
      const expectedHeaders = ['Product Name', 'Brand', 'SKU', 'Barcode', 'Ship To'];
      const missingHeaders = expectedHeaders.filter(header => 
        !headerRow.some(cell => 
          String(cell).toLowerCase().includes(header.toLowerCase())
        )
      );
      
      if (missingHeaders.length > 0) {
        warnings.push(`Potentially missing headers: ${missingHeaders.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Export data to CSV format
   * @param {Array} data - Data to export
   * @param {Array} columns - Column definitions
   * @returns {string} - CSV string
   */
  static exportToCSV(data, columns) {
    const headers = columns.map(col => col.header);
    const rows = data.map(item => 
      columns.map(col => {
        const value = item[col.key] || '';
        // Escape values that contain commas or quotes
        if (String(value).includes(',') || String(value).includes('"')) {
          return `"${String(value).replace(/"/g, '""')}"`;
        }
        return value;
      })
    );

    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
  }
}