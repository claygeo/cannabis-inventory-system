// Application constants - Updated for S-21846 migration
export const APP_NAME = 'Cannabis Inventory Management System';
export const APP_VERSION = '5.4.0'; // Updated for S-21846 migration
export const APP_SUBTITLE = 'S-21846 Large Label Edition';

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
  ERROR_OCCURRED: 'error_occurred',
  LABEL_MIGRATION: 'label_migration' // New event type for S-21846 migration
};

// Main Inventory (Homestead) CSV column mapping (0-based indices)
export const MAIN_INVENTORY_COLUMNS = {
  FACILITY_NAME: 0,
  PRODUCT_NAME: 1,
  CATEGORY: 2,
  SUBCATEGORY: 3,
  BRAND: 4,
  PRODUCT_TYPE: 5,
  STRAIN: 6,
  SIZE: 7,
  SKU: 8,
  BARCODE: 9,
  BIOTRACK_CODE: 10,
  QUANTITY: 11,
  PRICE: 12,
  WHOLESALE_COST: 13,
  CBD_PERCENT: 14,
  THC_PERCENT: 15,
  SHIPMENT_ID: 16,
  INTERNAL_NO: 17,
  RECEPTION_DATE: 18,
  LOCATION: 19,
  LOCATION_STOCK_TYPE: 20,
  MANUFACTURING_DATE: 21,
  MANUFACTURING_AGE: 22,
  EXPIRATION_DATE: 23,
  AGE_DAYS: 24,
  RESERVED_QTY: 25,
  RESERVED_TRANSACTION_TYPE: 26,
  DISTRIBUTOR: 27,
  MANUFACTURER: 28
};

// Sweed Report CSV column mapping (0-based indices)
export const SWEED_COLUMNS = {
  PRODUCT_NAME: 0,
  BRAND: 1,
  STRAIN: 2,
  SIZE: 3,
  SKU: 4,
  BARCODE: 5,
  EXTERNAL_TRACK_CODE: 6,
  QUANTITY: 7,
  SHIP_TO_LOCATION: 8,
  SHIP_TO_ADDRESS: 9,
  ORDER_NUMBER: 10,
  REQUEST_DATE: 11
};

// File structure configuration
export const FILE_STRUCTURE = {
  MAIN_INVENTORY: {
    HEADER_ROW: 2,
    DATA_START_ROW: 3,
    MIN_ROWS: 4,
    EXPECTED_COLUMNS: 29
  },
  SWEED_REPORT: {
    HEADER_ROW: 10,
    DATA_START_ROW: 11,
    MIN_ROWS: 12,
    EXPECTED_COLUMNS: 12
  }
};

// Barcode configuration for Code 39 format - Enhanced for S-21846
export const BARCODE_CONFIG = {
  FORMAT: 'CODE39',
  WIDTH: 4,              // Increased bar width for larger labels
  HEIGHT: 80,            // Increased height for S-21846
  DISPLAY_VALUE: false,  // NO TEXT EVER on scannable barcode
  MARGIN: 0,             // No margins for better space usage
  FONT_SIZE: 14,         // Larger font for barcode display text
  FONT_FAMILY: 'Arial',
  TEXT_MARGIN: 8,        // Increased spacing
  BACKGROUND: '#ffffff',
  LINE_COLOR: '#000000'
};

// Label specifications for Uline S-21846 (MIGRATED FROM S-5627)
export const LABEL_SPECS = {
  // New S-21846 specifications
  WIDTH_INCHES: 7.75,     // 7-3/4"
  HEIGHT_INCHES: 4.75,    // 4-3/4"
  LABELS_PER_SHEET: 2,    // 2 labels per sheet (down from 12)
  COLUMNS: 1,             // 1 column
  ROWS: 2,                // 2 rows (vertically stacked)
  SHEET_FORMAT: 'Uline S-21846',
  AVERY_EQUIVALENT: '6876',
  
  // Migration notes
  MIGRATED_FROM: 'Uline S-5627',
  MIGRATION_DATE: '2025-07-31',
  MIGRATION_REASON: 'User requested larger labels for better readability and manual writing space',
  
  // Layout enhancements for S-21846
  ENHANCED_FEATURES: [
    'Much larger product name area',
    'Spaced barcode display (no hyphens)',
    'Large manual writing text box',
    'Bigger date and box information',
    'Enhanced readability for all elements'
  ]
};

// Legacy S-5627 specifications (preserved for reference)
export const LEGACY_S5627_SPECS = {
  WIDTH_INCHES: 4,
  HEIGHT_INCHES: 1.5,
  LABELS_PER_SHEET: 12,
  COLUMNS: 2,
  ROWS: 6,
  SHEET_FORMAT: 'Uline S-5627',
  STATUS: 'DEPRECATED',
  REPLACED_BY: 'S-21846',
  DEPRECATION_DATE: '2025-07-31'
};

// HP E877 Printer Configuration (Critical for proper printing)
export const HP_E877_CONFIG = {
  PRINTABLE_AREA: {
    WIDTH_INCHES: 8.17,
    HEIGHT_INCHES: 10.67,
    WIDTH_POINTS: 588,
    HEIGHT_POINTS: 768
  },
  NON_PRINTABLE_MARGINS: {
    ALL_SIDES_INCHES: 0.167,
    ALL_SIDES_POINTS: 12
  },
  PRINT_SETTINGS: {
    REQUIRED_SETTING: 'ACTUAL SIZE',
    NEVER_USE: 'Fit to printable area',
    REASON: 'Prevents crooked/skewed printing'
  },
  OPTIMIZATION_NOTES: [
    'PDFs designed within printable area only',
    'Prevents progressive left-leaning during printing',
    'S-21846 labels fit naturally within printable area'
  ]
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
  SESSION_DATA: 'cannabis_session_data',
  LABEL_FORMAT_PREFERENCE: 'cannabis_label_format' // New for format selection
};

// Validation limits - Updated for larger labels
export const VALIDATION_LIMITS = {
  LABEL_QUANTITY: { min: 1, max: 25 }, // Reduced max due to larger labels
  CASE_QUANTITY: { min: 1, max: 1000 },
  BOX_COUNT: { min: 1, max: 100 }
};

// Validation constants (for LabelFormatter class)
export const VALIDATION = {
  LABEL_QUANTITY: { min: 1, max: 25 }, // Reduced for S-21846
  CASE_QUANTITY: { min: 1, max: 1000 },
  BOX_COUNT: { min: 1, max: 100 },
  DATE_FORMATS: [
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,
    /^\d{1,2}\/\d{1,2}\/\d{2}$/,
    /^\d{1,2}-\d{1,2}-\d{4}$/,
    /^\d{1,2}-\d{1,2}-\d{2}$/
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
  WARNING_DURATION: 4000,
  MIGRATION_DURATION: 6000 // New for migration notifications
};

// Pagination - Adjusted for larger labels (fewer per page in preview)
export const PAGINATION = {
  ITEMS_PER_PAGE: 10, // Reduced for larger label previews
  MAX_VISIBLE_PAGES: 5
};

// Label Layout Configuration for S-21846
export const S21846_LAYOUT = {
  PRODUCT_NAME: {
    AREA_HEIGHT: 60,
    MAX_FONT_SIZE: 36,
    MIN_FONT_SIZE: 14,
    FONT_WEIGHT: 'bold'
  },
  BARCODE_DISPLAY: {
    FONT_SIZE: 14,
    FORMAT: 'SPACED', // Spaces instead of hyphens
    COLOR: '#666666'
  },
  SCANNABLE_BARCODE: {
    WIDTH: 200,
    HEIGHT: 80,
    POSITION: 'left',
    TEXT_DISPLAY: false // NEVER show text
  },
  WRITING_BOX: {
    WIDTH: 160,
    HEIGHT: 80,
    POSITION: 'center',
    GRID_LINES: true,
    LINE_SPACING: 20
  },
  RIGHT_INFO: {
    DATE_FONT_SIZE: 12,
    BOX_WIDTH: 70,
    BOX_HEIGHT: 25,
    BOX_FONT_SIZE: 11
  },
  AUDIT_TRAIL: {
    FONT_SIZE: 8,
    COLOR: '#666666',
    POSITION: 'bottom-left'
  }
};

// Migration tracking
export const MIGRATION_INFO = {
  FROM_FORMAT: 'S-5627',
  TO_FORMAT: 'S-21846',
  MIGRATION_DATE: '2025-07-31',
  VERSION: '5.4.0',
  CHANGES: [
    'Label size: 4″×1.5″ → 7.75″×4.75″',
    'Labels per sheet: 12 → 2',
    'Layout: Grid → Vertical stack',
    'Enhanced readability and writing space',
    'Larger fonts and elements throughout'
  ],
  COMPATIBILITY: {
    HP_E877: 'Optimized',
    ULINE_SHEETS: 'S-21846 required',
    AVERY_EQUIVALENT: '6876'
  }
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
  LEGACY_S5627_SPECS,
  HP_E877_CONFIG,
  USER_ROLES,
  DEFAULT_USERS,
  STORAGE_KEYS,
  VALIDATION_LIMITS,
  VALIDATION,
  DATE_FORMATS,
  ACCEPTED_FILE_TYPES,
  TOAST_CONFIG,
  PAGINATION,
  S21846_LAYOUT,
  MIGRATION_INFO
};