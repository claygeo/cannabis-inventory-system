// Application constants
export const APP_NAME = 'Cannabis Inventory Management System';
export const APP_VERSION = '5.3.0';
export const APP_SUBTITLE = 'Fixed Dimensions Edition';

// Data source identifiers
export const DATA_SOURCES = {
  MAIN_INVENTORY: 'MainInventory',
  SWEED_REPORT: 'SweedReport'
};

// Event types for session tracking
export const EVENT_TYPES = {
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  INVENTORY_IMPORT: 'inventory_import',
  SWEED_IMPORT: 'sweed_import',
  ITEM_SCANNED: 'item_scanned',
  LABEL_GENERATED: 'label_generated',
  PICK_TICKET_GENERATED: 'pick_ticket_generated',
  ENHANCED_DATA_SAVED: 'enhanced_data_saved',
  SESSION_CLEARED: 'session_cleared',
  ERROR_OCCURRED: 'error_occurred'
};

// Main Inventory (Homestead) CSV column mapping (0-based indices)
// Based on actual file structure: Row 3 contains headers, data starts at Row 4
export const MAIN_INVENTORY_COLUMNS = {
  FACILITY_NAME: 0,      // Column A - "Facility Name"
  PRODUCT_NAME: 1,       // Column B - "Product Name"
  CATEGORY: 2,           // Column C - "Category"
  SUBCATEGORY: 3,        // Column D - "Subcategory"
  BRAND: 4,              // Column E - "Brand"
  PRODUCT_TYPE: 5,       // Column F - "Product Type"
  STRAIN: 6,             // Column G - "Strain prevalence"
  SIZE: 7,               // Column H - "Size"
  SKU: 8,                // Column I - "SKU"
  BARCODE: 9,            // Column J - "Barcode"
  BIOTRACK_CODE: 10,     // Column K - "BioTrack code"
  QUANTITY: 11,          // Column L - "QTY"
  PRICE: 12,             // Column M - "Price"
  WHOLESALE_COST: 13,    // Column N - "Wholesale Cost"
  CBD_PERCENT: 14,       // Column O - "CBD,%"
  THC_PERCENT: 15,       // Column P - "THC,%"
  SHIPMENT_ID: 16,       // Column Q - "Shipt. ID"
  INTERNAL_NO: 17,       // Column R - "Internal No."
  RECEPTION_DATE: 18,    // Column S - "Reception Date"
  LOCATION: 19,          // Column T - "Location"
  LOCATION_STOCK_TYPE: 20, // Column U - "Location Stock Type"
  MANUFACTURING_DATE: 21,  // Column V - "Manufacturing Date"
  MANUFACTURING_AGE: 22,   // Column W - "Manufacturing Age, days"
  EXPIRATION_DATE: 23,     // Column X - "Expiration Date"
  AGE_DAYS: 24,           // Column Y - "Age days"
  RESERVED_QTY: 25,       // Column Z - "Reserved Qty"
  RESERVED_TRANSACTION_TYPE: 26, // Column AA - "Reserved Transaction Type"
  DISTRIBUTOR: 27,        // Column AB - "Distributor"
  MANUFACTURER: 28        // Column AC - "Manufacturer"
};

// Sweed Report CSV column mapping (0-based indices)
// Flexible mapping - will be determined by header detection
export const SWEED_COLUMNS = {
  PRODUCT_NAME: 0,       // Column A
  BRAND: 1,              // Column B
  STRAIN: 2,             // Column C
  SIZE: 3,               // Column D
  SKU: 4,                // Column E
  BARCODE: 5,            // Column F
  EXTERNAL_TRACK_CODE: 6, // Column G
  QUANTITY: 7,           // Column H
  SHIP_TO_LOCATION: 8,   // Column I
  SHIP_TO_ADDRESS: 9,    // Column J
  ORDER_NUMBER: 10,      // Column K
  REQUEST_DATE: 11       // Column L
};

// File structure configuration
export const FILE_STRUCTURE = {
  MAIN_INVENTORY: {
    HEADER_ROW: 2,         // Headers are in row 3 (index 2)
    DATA_START_ROW: 3,     // Data starts in row 4 (index 3)
    MIN_ROWS: 4,           // Must have at least header + 1 data row
    EXPECTED_COLUMNS: 29   // Based on actual file structure
  },
  SWEED_REPORT: {
    HEADER_ROW: 0,         // Assume headers in first row
    DATA_START_ROW: 1,     // Data starts in second row
    MIN_ROWS: 2,           // Must have at least header + 1 data row
    EXPECTED_COLUMNS: 12   // Typical Sweed report columns
  }
};

// Barcode configuration for Code 39 format
export const BARCODE_CONFIG = {
  FORMAT: 'CODE39',
  WIDTH: 2,              // Bar width in pixels
  HEIGHT: 60,            // Barcode height in pixels
  DISPLAY_VALUE: true,   // Show text below barcode
  MARGIN: 10,            // Margin around barcode
  FONT_SIZE: 12,         // Font size for displayed value
  FONT_FAMILY: 'Arial',  // Font family for displayed value
  TEXT_MARGIN: 5,        // Space between barcode and text
  BACKGROUND: '#ffffff', // Background color
  LINE_COLOR: '#000000'  // Bar color
};

// Label specifications for Uline S-5627
export const LABEL_SPECS = {
  WIDTH_INCHES: 4,
  HEIGHT_INCHES: 1.5,
  LABELS_PER_SHEET: 12,
  COLUMNS: 2,
  ROWS: 6,
  SHEET_FORMAT: 'Uline S-5627'
};

// Authentication roles
export const USER_ROLES = {
  ADMIN: 'Administrator',
  WAREHOUSE: 'Warehouse',
  MANAGER: 'Manager'
};

// Default users (for development)
export const DEFAULT_USERS = [
  { username: 'admin', password: 'admin123', role: USER_ROLES.ADMIN },
  { username: 'warehouse', password: 'warehouse123', role: USER_ROLES.WAREHOUSE },
  { username: 'manager', password: 'manager123', role: USER_ROLES.MANAGER }
];

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'cannabis_auth_token',
  USER_DATA: 'cannabis_user_data',
  INVENTORY_DATA: 'cannabis_inventory_data',
  SWEED_DATA: 'cannabis_sweed_data',
  SCANNED_ITEMS: 'cannabis_scanned_items',
  ENHANCED_DATA: 'cannabis_enhanced_data',
  SESSION_DATA: 'cannabis_session_data'
};

// Validation limits
export const VALIDATION_LIMITS = {
  LABEL_QUANTITY: { min: 1, max: 50 },
  CASE_QUANTITY: { min: 1, max: 1000 },
  BOX_COUNT: { min: 1, max: 100 }
};

// Validation constants (for ValidationHelper class)
export const VALIDATION = {
  LABEL_QUANTITY: { min: 1, max: 50 },
  CASE_QUANTITY: { min: 1, max: 1000 },
  BOX_COUNT: { min: 1, max: 100 },
  DATE_FORMATS: [
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,    // DD/MM/YYYY or MM/DD/YYYY
    /^\d{1,2}\/\d{1,2}\/\d{2}$/,     // DD/MM/YY or MM/DD/YY
    /^\d{1,2}-\d{1,2}-\d{4}$/,      // DD-MM-YYYY or MM-DD-YYYY
    /^\d{1,2}-\d{1,2}-\d{2}$/       // DD-MM-YY or MM-DD-YY
  ]
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MM/dd/yyyy',
  INPUT: 'dd/MM/yyyy',
  ISO: 'yyyy-MM-dd'
};

// File types for import
export const ACCEPTED_FILE_TYPES = {
  EXCEL: '.xlsx,.xls',
  CSV: '.csv'
};

// Toast configuration
export const TOAST_CONFIG = {
  SUCCESS_DURATION: 3000,
  ERROR_DURATION: 5000,
  WARNING_DURATION: 4000
};

// Pagination
export const PAGINATION = {
  ITEMS_PER_PAGE: 20,
  MAX_VISIBLE_PAGES: 5
};

export default {
  APP_NAME,
  APP_VERSION,
  APP_SUBTITLE,
  DATA_SOURCES,
  EVENT_TYPES,
  MAIN_INVENTORY_COLUMNS,
  SWEED_COLUMNS,
  FILE_STRUCTURE,
  BARCODE_CONFIG,
  LABEL_SPECS,
  USER_ROLES,
  DEFAULT_USERS,
  STORAGE_KEYS,
  VALIDATION_LIMITS,
  VALIDATION,
  DATE_FORMATS,
  ACCEPTED_FILE_TYPES,
  TOAST_CONFIG,
  PAGINATION
};