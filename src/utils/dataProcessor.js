// 🚨 NUCLEAR DEBUG VERSION - ADD THIS LOGGING TO TRACK EVERYTHING 🚨
console.log('🚨🚨🚨 DATAPROCESSOR.JS FILE LOADED 🚨🚨🚨', new Date().toISOString());
console.log('🚨 File path: src/utils/dataProcessor.js');
console.log('🚨 Loading imports...');

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { MAIN_INVENTORY_COLUMNS, SWEED_COLUMNS, DATA_SOURCES, FILE_STRUCTURE } from '../constants.js';

console.log('🚨 Imports loaded successfully');
console.log('🚨 About to create DataProcessor class...');

/**
 * Data processing utilities for CSV/Excel imports and data manipulation
 */
export class DataProcessor {
  static {
    console.log('🚨🚨🚨 DATAPROCESSOR CLASS INITIALIZED 🚨🚨🚨');
    console.log('🚨 Class creation timestamp:', new Date().toISOString());
    console.log('🚨 Papa:', typeof Papa);
    console.log('🚨 XLSX:', typeof XLSX);
    console.log('🚨 Constants loaded:', {
      MAIN_INVENTORY_COLUMNS: typeof MAIN_INVENTORY_COLUMNS,
      SWEED_COLUMNS: typeof SWEED_COLUMNS,
      DATA_SOURCES: typeof DATA_SOURCES,
      FILE_STRUCTURE: typeof FILE_STRUCTURE
    });
  }

  /**
   * Detect file type based on file extension and content
   * @param {File} file - File to analyze
   * @returns {string} - File type ('excel' or 'csv')
   */
  static detectFileType(file) {
    console.log('🚨🚨🚨 DETECTFILETYPE CALLED 🚨🚨🚨');
    console.log('🚨 Method entry timestamp:', new Date().toISOString());
    console.log('🚨 Received file object:', file);
    console.log('🔍 Detecting file type for:', file.name);
    console.log('📁 File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    const fileName = file.name.toLowerCase();
    console.log('🔤 Lowercase filename:', fileName);
    
    // Check for Excel extensions
    const isXlsx = fileName.endsWith('.xlsx');
    const isXls = fileName.endsWith('.xls');
    const isCsv = fileName.endsWith('.csv');
    
    console.log('📋 Extension checks:', { isXlsx, isXls, isCsv });
    
    if (isXlsx || isXls) {
      console.log('✅ Detected Excel file - RETURNING "excel"');
      console.log('🚨 detectFileType RETURN VALUE: "excel"');
      return 'excel';
    }
    if (isCsv) {
      console.log('✅ Detected CSV file - RETURNING "csv"');
      console.log('🚨 detectFileType RETURN VALUE: "csv"');
      return 'csv';
    }
    
    // Also check MIME type as backup
    if (file.type) {
      console.log('🔍 Checking MIME type:', file.type);
      if (file.type.includes('spreadsheet') || file.type.includes('excel')) {
        console.log('✅ Detected Excel via MIME type - RETURNING "excel"');
        console.log('🚨 detectFileType RETURN VALUE: "excel"');
        return 'excel';
      }
      if (file.type.includes('csv')) {
        console.log('✅ Detected CSV via MIME type - RETURNING "csv"');
        console.log('🚨 detectFileType RETURN VALUE: "csv"');
        return 'csv';
      }
    }
    
    // Default to CSV for unknown extensions
    console.log('⚠️ Unknown file type, defaulting to CSV - RETURNING "csv"');
    console.log('🚨 detectFileType RETURN VALUE: "csv"');
    return 'csv';
  }

  /**
   * Parse Excel file and return structured data
   * @param {File} file - Excel file to parse
   * @param {Function} onProgress - Progress callback (optional)
   * @returns {Promise<Object>} - Parsed data with metadata
   */
  static async parseExcel(file, onProgress = null) {
    console.log('🚨🚨🚨 PARSEEXCEL CALLED 🚨🚨🚨');
    console.log('📊 Starting Excel parsing for:', file.name);
    console.log('🚨 parseExcel entry timestamp:', new Date().toISOString());
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          console.log('🚨 FileReader onload triggered');
          if (onProgress) onProgress(50, 100);
          
          const data = new Uint8Array(e.target.result);
          console.log('📁 File data loaded, size:', data.length, 'bytes');
          console.log('🔍 First 10 bytes:', Array.from(data.slice(0, 10)));
          
          const workbook = XLSX.read(data, {
            type: 'array',
            cellDates: true,
            cellStyles: false
          });
          
          console.log('📋 Workbook loaded successfully');
          console.log('📄 Available sheets:', workbook.SheetNames);
          
          if (onProgress) onProgress(75, 100);
          
          // Get first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          console.log('📄 Processing sheet:', sheetName);
          console.log('📏 Sheet range:', worksheet['!ref']);
          
          // Convert to array format (similar to Papa Parse output)
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,  // Return array of arrays
            raw: false, // Format values as strings
            blankrows: true // INCLUDE blank rows for debugging
          });
          
          console.log('🔢 Raw Excel data rows:', jsonData.length);
          console.log('🔍 First 10 rows from Excel:');
          for (let i = 0; i < Math.min(10, jsonData.length); i++) {
            console.log(`Row ${i + 1}:`, jsonData[i]);
          }
          
          // Filter out completely empty rows (but log what we're filtering)
          const filteredData = jsonData.filter((row, index) => {
            const hasContent = row && row.some(cell => cell !== null && cell !== undefined && cell !== '');
            if (!hasContent) {
              console.log(`🗑️ Filtering out empty row ${index + 1}:`, row);
            }
            return hasContent;
          });
          
          console.log('✅ Filtered data rows:', filteredData.length);
          console.log('🔍 First 5 filtered rows:');
          for (let i = 0; i < Math.min(5, filteredData.length); i++) {
            console.log(`Filtered Row ${i + 1}:`, filteredData[i]);
          }
          
          if (onProgress) onProgress(100, 100);
          
          const result = {
            data: filteredData,
            meta: {
              delimiter: '',
              linebreak: '',
              aborted: false,
              truncated: false,
              cursor: filteredData.length
            },
            errors: [],
            rowCount: filteredData.length,
            columnCount: filteredData.length > 0 ? Math.max(...filteredData.map(row => row.length)) : 0
          };
          
          console.log('📊 Excel parsing complete:', {
            rowCount: result.rowCount,
            columnCount: result.columnCount
          });
          console.log('🚨 parseExcel RESOLVING with result');
          
          resolve(result);
          
        } catch (error) {
          console.error('❌ Excel parsing failed:', error);
          console.log('🚨 parseExcel REJECTING with error:', error.message);
          reject(new Error(`Excel parsing failed: ${error.message}`));
        }
      };
      
      reader.onerror = () => {
        console.error('❌ Failed to read Excel file');
        console.log('🚨 FileReader error event triggered');
        reject(new Error('Failed to read Excel file'));
      };
      
      console.log('🚨 Starting FileReader.readAsArrayBuffer');
      if (onProgress) onProgress(25, 100);
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Parse CSV file and return structured data
   * @param {File} file - CSV file to parse
   * @param {Function} onProgress - Progress callback (optional)
   * @returns {Promise<Object>} - Parsed data with metadata
   */
  static async parseCSV(file, onProgress = null) {
    console.log('🚨🚨🚨 PARSECSV CALLED 🚨🚨🚨');
    console.log('📄 Starting CSV parsing for:', file.name);
    console.log('🚨 parseCSV entry timestamp:', new Date().toISOString());
    
    return new Promise((resolve, reject) => {
      console.log('🚨 Starting Papa.parse');
      Papa.parse(file, {
        header: false,
        skipEmptyLines: 'greedy', // Skip empty lines more aggressively
        dynamicTyping: true,
        delimitersToGuess: [',', '\t', '|', ';'],
        step: onProgress ? (results, parser) => {
          onProgress(parser.streamer._input.length, file.size);
        } : undefined,
        complete: (results) => {
          console.log('🚨 Papa.parse complete callback triggered');
          if (results.errors.length > 0) {
            console.warn('⚠️ CSV parsing warnings:', results.errors);
          }
          
          console.log('🔢 Raw CSV data rows:', results.data.length);
          
          // Filter out completely empty rows
          const filteredData = results.data.filter((row, index) => {
            const hasContent = row && row.some(cell => cell !== null && cell !== undefined && cell !== '');
            if (!hasContent) {
              console.log(`🗑️ Filtering out empty CSV row ${index + 1}:`, row);
            }
            return hasContent;
          });
          
          console.log('✅ Filtered CSV data rows:', filteredData.length);
          
          const data = {
            data: filteredData,
            meta: results.meta,
            errors: results.errors,
            rowCount: filteredData.length,
            columnCount: filteredData.length > 0 ? Math.max(...filteredData.map(row => row.length)) : 0
          };
          
          console.log('📊 CSV parsing complete:', {
            rowCount: data.rowCount,
            columnCount: data.columnCount
          });
          console.log('🚨 parseCSV RESOLVING with result');
          
          resolve(data);
        },
        error: (error) => {
          console.error('❌ CSV parsing failed:', error);
          console.log('🚨 Papa.parse error callback triggered:', error.message);
          reject(new Error(`CSV parsing failed: ${error.message}`));
        }
      });
    });
  }

  /**
   * Parse file (Excel or CSV) and return structured data
   * @param {File} file - File to parse
   * @param {Function} onProgress - Progress callback (optional)
   * @returns {Promise<Object>} - Parsed data with metadata
   */
  static async parseFile(file, onProgress = null) {
    console.log('🚨🚨🚨 PARSEFILE CALLED - ENTRY POINT 🚨🚨🚨');
    console.log('🚨 parseFile entry timestamp:', new Date().toISOString());
    console.log('📁 File received in parseFile:', file.name);
    console.log('🔍 About to call detectFileType...');
    
    const fileType = this.detectFileType(file);
    
    console.log('🎯 detectFileType returned:', fileType);
    console.log('🚨 DECISION POINT - fileType =', fileType);
    console.log('🚨 About to choose parser based on fileType...');
    
    if (fileType === 'excel') {
      console.log('✅ CHOOSING EXCEL PARSER - Calling parseExcel');
      console.log('🚨 ROUTE: parseFile -> parseExcel');
      return this.parseExcel(file, onProgress);
    } else {
      console.log('❌ CHOOSING CSV PARSER - Calling parseCSV');
      console.log('🚨 ROUTE: parseFile -> parseCSV');
      console.log('🚨 WHY CSV? fileType =', fileType);
      return this.parseCSV(file, onProgress);
    }
  }

  /**
   * Validate file structure for Main Inventory
   * @param {Array} data - Raw file data
   * @returns {Object} - Validation result
   */
  static validateMainInventoryStructure(data) {
    console.log('🚨🚨🚨 VALIDATE MAIN INVENTORY STRUCTURE CALLED 🚨🚨🚨');
    console.log('🔍 Validating Main Inventory structure...');
    console.log('📊 Data length:', data.length);
    
    const errors = [];
    const warnings = [];
    const config = FILE_STRUCTURE.MAIN_INVENTORY;
    
    console.log('⚙️ Using config:', config);

    if (data.length < config.MIN_ROWS) {
      const error = `File must have at least ${config.MIN_ROWS} rows (export info + headers + data), got ${data.length} rows`;
      console.error('❌ Validation failed:', error);
      errors.push(error);
      return { isValid: false, errors, warnings };
    }

    // Check if we have the expected structure
    const headerRow = data[config.HEADER_ROW];
    console.log(`📋 Header row (index ${config.HEADER_ROW}):`, headerRow);
    
    if (!headerRow || headerRow.length < 10) {
      warnings.push('Header row appears to be missing or incomplete');
      console.warn('⚠️ Header row incomplete');
    }

    // Look for expected header patterns
    const expectedHeaders = ['Facility Name', 'Product Name', 'Brand', 'SKU', 'Barcode'];
    let headerFound = false;
    
    console.log('🔍 Looking for headers in first 5 rows...');
    for (let i = 0; i < Math.min(5, data.length); i++) {
      const row = data[i];
      console.log(`Row ${i + 1}:`, row);
      
      if (row && expectedHeaders.some(header => 
        row.some(cell => cell && String(cell).toLowerCase().includes(header.toLowerCase()))
      )) {
        console.log(`✅ Found headers in row ${i + 1}`);
        headerFound = true;
        break;
      }
    }

    if (!headerFound) {
      warnings.push('Could not locate expected headers. File structure may be different than expected.');
      console.warn('⚠️ Expected headers not found');
    }

    // Check data rows
    const sampleDataRow = data[config.DATA_START_ROW];
    console.log(`📊 Sample data row (index ${config.DATA_START_ROW}):`, sampleDataRow);
    
    if (!sampleDataRow || sampleDataRow.length < 10) {
      warnings.push('Data rows appear to be missing or incomplete');
      console.warn('⚠️ Data rows incomplete');
    }

    const result = {
      isValid: errors.length === 0,
      errors,
      warnings
    };
    
    console.log('✅ Validation result:', result);
    console.log('🚨 validateMainInventoryStructure RETURNING:', result);
    return result;
  }

  /**
   * Process Main Inventory (Homestead) data into structured format
   * @param {Array} rawData - Raw CSV/Excel data array
   * @returns {Object} - Processed data with statistics
   */
  static processMainInventoryData(rawData) {
    console.log('🚨🚨🚨 PROCESS MAIN INVENTORY DATA CALLED 🚨🚨🚨');
    const processedData = [];
    const duplicates = [];
    const errors = [];
    const seenKeys = new Set();

    console.log('🏭 Processing Main Inventory data, total rows:', rawData.length);

    // Use the configured structure
    const config = FILE_STRUCTURE.MAIN_INVENTORY;
    const headerRowIndex = config.HEADER_ROW;
    const dataStartIndex = config.DATA_START_ROW;

    console.log('⚙️ Using configuration:', {
      headerRowIndex,
      dataStartIndex,
      minRows: config.MIN_ROWS
    });

    // Validate we have enough rows
    if (rawData.length < config.MIN_ROWS) {
      throw new Error(`Insufficient data rows. Expected at least ${config.MIN_ROWS} rows, got ${rawData.length}`);
    }

    // Get header row for validation
    const headerRow = rawData[headerRowIndex];
    console.log('📋 Header row:', headerRow);
    
    if (!headerRow || headerRow.length < 10) {
      console.warn('⚠️ Header row seems incomplete:', headerRow);
    }

    // Detect column mapping if headers don't match expected structure
    let columnMapping = MAIN_INVENTORY_COLUMNS;
    if (headerRow) {
      const detectedMapping = this.detectColumnMapping(headerRow, MAIN_INVENTORY_COLUMNS);
      // Use detected mapping if it seems more accurate
      const detectedValid = Object.values(detectedMapping).filter(index => index >= 0).length;
      const originalValid = Object.values(MAIN_INVENTORY_COLUMNS).filter(index => index < headerRow.length).length;
      
      console.log('🔍 Column mapping comparison:', {
        detectedValid,
        originalValid,
        detectedMapping: detectedMapping
      });
      
      if (detectedValid > originalValid) {
        console.log('✅ Using detected column mapping');
        columnMapping = detectedMapping;
      } else {
        console.log('✅ Using default column mapping');
      }
    }

    // Process data rows
    console.log(`📊 Processing rows ${dataStartIndex + 1} to ${rawData.length}`);
    
    for (let i = dataStartIndex; i < rawData.length; i++) {
      const row = rawData[i];
      
      // Skip completely empty rows
      if (!row || !row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
        console.log(`⏭️ Skipping empty row ${i + 1}`);
        continue;
      }
      
      if (i < dataStartIndex + 3) {
        console.log(`📊 Processing row ${i + 1}:`, row);
      }
      
      try {
        // Extract data according to column mapping
        const item = {
          facilityName: this.cleanString(row[columnMapping.FACILITY_NAME]),
          productName: this.cleanString(row[columnMapping.PRODUCT_NAME]),
          category: this.cleanString(row[columnMapping.CATEGORY]),
          subcategory: this.cleanString(row[columnMapping.SUBCATEGORY]),
          brand: this.cleanString(row[columnMapping.BRAND]),
          productType: this.cleanString(row[columnMapping.PRODUCT_TYPE]),
          strain: this.cleanString(row[columnMapping.STRAIN]),
          size: this.cleanString(row[columnMapping.SIZE]),
          sku: this.cleanString(row[columnMapping.SKU]),
          barcode: this.cleanString(row[columnMapping.BARCODE]),
          bioTrackCode: this.cleanString(row[columnMapping.BIOTRACK_CODE]),
          quantity: this.parseQuantity(row[columnMapping.QUANTITY]),
          price: this.cleanString(row[columnMapping.PRICE]),
          wholesaleCost: this.cleanString(row[columnMapping.WHOLESALE_COST]),
          location: this.cleanString(row[columnMapping.LOCATION]),
          distributor: this.cleanString(row[columnMapping.DISTRIBUTOR]),
          manufacturer: this.cleanString(row[columnMapping.MANUFACTURER]),
          dataSource: DATA_SOURCES.MAIN_INVENTORY,
          rowIndex: i + 1
        };

        // Validate required fields
        if (!item.barcode && !item.sku) {
          errors.push({
            row: i + 1,
            error: 'Missing both barcode and SKU - at least one is required',
            data: item
          });
          continue;
        }

        // Use SKU as backup if no barcode
        if (!item.barcode && item.sku) {
          item.barcode = item.sku;
        }

        // Use barcode as backup if no SKU
        if (!item.sku && item.barcode) {
          item.sku = item.barcode;
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
        console.error(`❌ Error processing row ${i + 1}:`, error);
        errors.push({
          row: i + 1,
          error: error.message,
          data: row
        });
      }
    }

    console.log(`✅ Processed ${processedData.length} items from Main Inventory`);
    console.log(`⚠️ Found ${duplicates.length} duplicates`);
    console.log(`❌ Found ${errors.length} errors`);

    return {
      data: processedData,
      statistics: {
        totalRows: rawData.length,
        processedRows: processedData.length,
        duplicates: duplicates.length,
        errors: errors.length,
        skippedRows: dataStartIndex,
        headerRow: headerRowIndex + 1,
        dataStartRow: dataStartIndex + 1
      },
      duplicates,
      errors
    };
  }

  /**
   * Process Sweed Report data into structured format
   * @param {Array} rawData - Raw CSV/Excel data array
   * @returns {Object} - Processed data with statistics
   */
  static processSweedData(rawData) {
    console.log('🚨🚨🚨 PROCESS SWEED DATA CALLED 🚨🚨🚨');
    const processedData = [];
    const duplicates = [];
    const errors = [];
    const seenKeys = new Set();

    console.log('🚛 Processing Sweed data, total rows:', rawData.length);

    // Use the configured structure for Sweed files
    const config = FILE_STRUCTURE.SWEED_REPORT;
    const headerRowIndex = config.HEADER_ROW;      // Row 11 (index 10)
    const dataStartIndex = config.DATA_START_ROW;  // Row 12 (index 11)

    console.log('⚙️ Using Sweed configuration:', {
      headerRowIndex,
      dataStartIndex,
      minRows: config.MIN_ROWS
    });

    // Validate we have enough rows
    if (rawData.length < config.MIN_ROWS) {
      throw new Error(`Insufficient data rows. Expected at least ${config.MIN_ROWS} rows, got ${rawData.length}`);
    }

    // Get header row for validation
    const headerRow = rawData[headerRowIndex];
    console.log('📋 Sweed header row:', headerRow);
    
    if (!headerRow || headerRow.length < 5) {
      console.warn('⚠️ Sweed header row seems incomplete:', headerRow);
    }

    // Detect column mapping if headers don't match expected structure
    let columnMapping = SWEED_COLUMNS;
    if (headerRow) {
      const detectedMapping = this.detectColumnMapping(headerRow, SWEED_COLUMNS);
      // Use detected mapping if it seems more accurate
      const detectedValid = Object.values(detectedMapping).filter(index => index >= 0).length;
      const originalValid = Object.values(SWEED_COLUMNS).filter(index => index < headerRow.length).length;
      
      if (detectedValid > originalValid) {
        console.log('✅ Using detected Sweed column mapping:', detectedMapping);
        columnMapping = detectedMapping;
      } else {
        console.log('✅ Using default Sweed column mapping');
      }
    }

    // Process data rows
    for (let i = dataStartIndex; i < rawData.length; i++) {
      const row = rawData[i];
      
      // Skip completely empty rows
      if (!row || !row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
        continue;
      }
      
      try {
        // Extract data according to column mapping
        const item = {
          productName: this.cleanString(row[columnMapping.PRODUCT_NAME]),
          brand: this.cleanString(row[columnMapping.BRAND]),
          strain: this.cleanString(row[columnMapping.STRAIN]),
          size: this.cleanString(row[columnMapping.SIZE]),
          sku: this.cleanString(row[columnMapping.SKU]),
          barcode: this.cleanString(row[columnMapping.BARCODE]),
          externalTrackCode: this.cleanString(row[columnMapping.EXTERNAL_TRACK_CODE]),
          quantity: this.parseQuantity(row[columnMapping.QUANTITY]),
          shipToLocation: this.cleanString(row[columnMapping.SHIP_TO_LOCATION]),
          shipToAddress: this.cleanString(row[columnMapping.SHIP_TO_ADDRESS]),
          orderNumber: this.cleanString(row[columnMapping.ORDER_NUMBER]),
          requestDate: this.cleanString(row[columnMapping.REQUEST_DATE]),
          dataSource: DATA_SOURCES.SWEED_REPORT,
          // Map externalTrackCode to bioTrackCode for compatibility
          bioTrackCode: this.cleanString(row[columnMapping.EXTERNAL_TRACK_CODE]),
          rowIndex: i + 1
        };

        // Validate required fields
        if (!item.barcode && !item.sku) {
          errors.push({
            row: i + 1,
            error: 'Missing both barcode and SKU - at least one is required',
            data: item
          });
          continue;
        }

        // Use SKU as backup if no barcode
        if (!item.barcode && item.sku) {
          item.barcode = item.sku;
        }

        // Use barcode as backup if no SKU
        if (!item.sku && item.barcode) {
          item.sku = item.barcode;
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

    console.log(`✅ Processed ${processedData.length} items from Sweed Report`);

    return {
      data: processedData,
      statistics: {
        totalRows: rawData.length,
        processedRows: processedData.length,
        duplicates: duplicates.length,
        errors: errors.length,
        skippedRows: dataStartIndex,
        headerRow: headerRowIndex + 1,
        dataStartRow: dataStartIndex + 1
      },
      duplicates,
      errors
    };
  }

  /**
   * Detect header row in data
   * @param {Array} rawData - Raw data array
   * @param {Array} expectedHeaders - Array of expected header keywords
   * @returns {number} - Header row index (-1 if not found)
   */
  static detectHeaderRow(rawData, expectedHeaders) {
    console.log('🚨 detectHeaderRow called');
    for (let i = 0; i < Math.min(15, rawData.length); i++) {
      const row = rawData[i];
      if (!row || !Array.isArray(row)) continue;
      
      const headerMatches = expectedHeaders.filter(header => 
        row.some(cell => 
          cell && typeof cell === 'string' && 
          cell.toLowerCase().includes(header.toLowerCase())
        )
      );
      
      // If we find at least 60% of expected headers, consider this the header row
      if (headerMatches.length >= expectedHeaders.length * 0.6) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Auto-detect column mapping based on headers
   * @param {Array} headerRow - Header row data
   * @param {Object} expectedMappings - Expected column mappings
   * @returns {Object} - Detected column mappings
   */
  static detectColumnMapping(headerRow, expectedMappings) {
    console.log('🚨 detectColumnMapping called');
    const detectedMapping = {};
    
    // Common header variations
    const headerVariations = {
      FACILITY_NAME: ['facility', 'facility name'],
      PRODUCT_NAME: ['product', 'product name', 'name'],
      BRAND: ['brand', 'manufacturer'],
      STRAIN: ['strain', 'strain prevalence', 'variety'],
      SIZE: ['size', 'weight', 'volume'],
      SKU: ['sku', 'item code', 'product code'],
      BARCODE: ['barcode', 'upc', 'gtin'],
      BIOTRACK_CODE: ['biotrack', 'biotrack code', 'tracking code', 'track code'],
      QUANTITY: ['qty', 'quantity', 'amount', 'count'],
      LOCATION: ['location', 'warehouse', 'storage'],
      DISTRIBUTOR: ['distributor', 'supplier', 'vendor'],
      EXTERNAL_TRACK_CODE: ['external', 'external track', 'external tracking'],
      SHIP_TO_LOCATION: ['ship to', 'ship to location', 'destination'],
      SHIP_TO_ADDRESS: ['ship to address', 'address', 'shipping address'],
      ORDER_NUMBER: ['order', 'order number', 'order #'],
      REQUEST_DATE: ['request date', 'date', 'request']
    };

    Object.entries(expectedMappings).forEach(([key, defaultIndex]) => {
      const variations = headerVariations[key] || [key.toLowerCase()];
      
      // Find column index by matching header text
      const foundIndex = headerRow.findIndex(cell => {
        if (!cell || typeof cell !== 'string') return false;
        const cellLower = cell.toLowerCase();
        return variations.some(variation => cellLower.includes(variation));
      });
      
      detectedMapping[key] = foundIndex !== -1 ? foundIndex : defaultIndex;
    });

    return detectedMapping;
  }

  /**
   * Find all products matching a barcode across both inventories
   * @param {string} barcode - Barcode to search for
   * @param {Array} inventoryData - Main inventory data
   * @param {Array} sweedData - Sweed data
   * @returns {Array} - Array of matching products
   */
  static findProductsByBarcode(barcode, inventoryData, sweedData) {
    console.log('🚨 findProductsByBarcode called');
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
    console.log('🚨 getScannedItemsDetails called');
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
    console.log('🚨 generatePickTicketData called');
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
    
    // Handle string quantities with commas
    let cleanValue = String(value).replace(/,/g, '');
    
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Validate file structure for Sweed Report
   * @param {Array} data - Raw file data
   * @returns {Object} - Validation result
   */
  static validateSweedStructure(data) {
    console.log('🚨 validateSweedStructure called');
    const errors = [];
    const warnings = [];
    const config = FILE_STRUCTURE.SWEED_REPORT;

    if (data.length < config.MIN_ROWS) {
      errors.push(`File must have at least ${config.MIN_ROWS} rows (10 info rows + headers + data)`);
      return { isValid: false, errors, warnings };
    }

    // Check if we have the expected header row at position 10 (row 11)
    const headerRow = data[config.HEADER_ROW];
    if (!headerRow || headerRow.length < 5) {
      warnings.push('Header row at position 11 appears to be missing or incomplete');
    }

    // Look for expected header patterns in the correct position
    const expectedHeaders = ['Product', 'Brand', 'SKU', 'Barcode', 'Ship To', 'Order'];
    let headerFound = false;
    
    // Check specifically around row 11 (index 10)
    for (let i = Math.max(0, config.HEADER_ROW - 2); i <= Math.min(data.length - 1, config.HEADER_ROW + 2); i++) {
      const row = data[i];
      if (row && expectedHeaders.some(header => 
        row.some(cell => cell && String(cell).toLowerCase().includes(header.toLowerCase()))
      )) {
        headerFound = true;
        break;
      }
    }

    if (!headerFound) {
      warnings.push('Could not locate expected headers around row 11. File structure may be different than expected.');
    }

    // Check data rows
    const sampleDataRow = data[config.DATA_START_ROW];
    if (!sampleDataRow || sampleDataRow.length < 5) {
      warnings.push('Data rows appear to be missing or incomplete');
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
    console.log('🚨 exportToCSV called');
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

console.log('🚨🚨🚨 DATAPROCESSOR.JS FULLY LOADED 🚨🚨🚨');
console.log('🚨 Export complete timestamp:', new Date().toISOString());