// Application constants - Updated for S-5492 4x6 horizontal migration
export const APP_NAME = 'Cannabis Inventory Management System';
export const APP_VERSION = '5.5.0'; // Updated for S-5492 migration
export const APP_SUBTITLE = 'S-5492 Horizontal Label Edition';

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
  LABEL_MIGRATION: 'label_migration'
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

// Barcode configuration for Code 39 format - Enhanced for S-5492
export const BARCODE_CONFIG = {
  FORMAT: 'CODE39',
  WIDTH: 3,              // Optimized for horizontal layout
  HEIGHT: 45,            // Adjusted for bottom row
  DISPLAY_VALUE: false,  // NO TEXT on barcode itself
  MARGIN: 0,
  FONT_SIZE: 10,         // For separate display above barcode
  FONT_FAMILY: 'Arial',
  TEXT_MARGIN: 5,
  BACKGROUND: '#ffffff',
  LINE_COLOR: '#000000'
};

// Label specifications for Uline S-5492 (4" × 6" HORIZONTAL)
export const LABEL_SPECS = {
  // S-5492 specifications (HORIZONTAL orientation)
  WIDTH_INCHES: 6,        // 6" wide (horizontal)
  HEIGHT_INCHES: 4,       // 4" tall (horizontal)
  LABELS_PER_SHEET: 4,    // 4 labels per legal sheet
  COLUMNS: 2,             // 2 columns
  ROWS: 2,                // 2 rows
  SHEET_FORMAT: 'Uline S-5492',
  SHEET_SIZE: 'Legal',    // 8.5" × 14" legal size sheets
  ORIENTATION: 'Horizontal',
  
  // Migration history
  MIGRATED_FROM: 'Uline S-21846',
  MIGRATION_DATE: '2025-07-31',
  MIGRATION_REASON: 'Management decision for 4×6 horizontal format with brand separation',
  
  // Layout features for S-5492
  ENHANCED_FEATURES: [
    'Brand separation (Curaleaf, Grassroots, etc.)',
    'Massive product name (up to 48pt font)',
    'Bottom-focused layout design',
    'Larger harvest/packaged dates',
    'Enlarged case quantity and box info',
    'Horizontal 4×6 orientation for better visibility'
  ]
};

// Cannabis brand detection for product name separation
export const CANNABIS_BRANDS = [
  'Curaleaf', 'Grassroots', 'Reef', 'B-Noble', 'Cresco', 'Rythm', 'GTI',
  'Verano', 'Aeriz', 'Revolution', 'Cookies', 'Jeeter', 'Raw Garden',
  'Stiiizy', 'Select', 'Heavy Hitters', 'Papa & Barkley', 'Kiva',
  'Wyld', 'Wana', 'Plus Products', 'Legion of Bloom', 'AbsoluteXtracts',
  'Matter', 'Pharmacann', 'Green Thumb', 'Columbia Care', 'Trulieve',
  'MedMen', 'Harvest', 'Acreage', 'Canopy Growth', 'Tilray',
  'Pax', 'Dosist', 'Beboe', 'Lord Jones', 'Caliva', 'Flow Kana',
  'Glass House', 'Connected', 'Alien Labs', 'Jungle Boys'
];

// Legacy specifications for reference
export const LEGACY_SPECS = {
  S5627: {
    WIDTH_INCHES: 4,
    HEIGHT_INCHES: 1.5,
    LABELS_PER_SHEET: 12,
    STATUS: 'DEPRECATED',
    REPLACED_BY: 'S-21846'
  },
  S21846: {
    WIDTH_INCHES: 7.75,
    HEIGHT_INCHES: 4.75,
    LABELS_PER_SHEET: 2,
    STATUS: 'DEPRECATED',
    REPLACED_BY: 'S-5492'
  }
};

// Legal size sheet configuration (for S-5492)
export const LEGAL_SHEET_CONFIG = {
  WIDTH_INCHES: 8.5,
  HEIGHT_INCHES: 14,
  WIDTH_POINTS: 612,
  HEIGHT_POINTS: 1008,
  MARGINS: {
    TOP: 18,
    BOTTOM: 18,
    LEFT: 18,
    RIGHT: 18
  }
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
  LABEL_FORMAT_PREFERENCE: 'cannabis_label_format'
};

// Validation limits - Updated for S-5492
export const VALIDATION_LIMITS = {
  LABEL_QUANTITY: { min: 1, max: 20 }, // Fewer labels due to larger size
  CASE_QUANTITY: { min: 1, max: 1000 },
  BOX_COUNT: { min: 1, max: 100 }
};

// Validation constants
export const VALIDATION = {
  LABEL_QUANTITY: { min: 1, max: 20 },
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
  MIGRATION_DURATION: 6000
};

// Pagination - Adjusted for larger labels
export const PAGINATION = {
  ITEMS_PER_PAGE: 8, // Fewer items due to larger preview size
  MAX_VISIBLE_PAGES: 5
};

// S-5492 Horizontal Layout Configuration
export const S5492_LAYOUT = {
  ORIENTATION: 'horizontal',
  
  BRAND_NAME: {
    MAX_FONT_SIZE: 48,
    MIN_FONT_SIZE: 16,
    FONT_WEIGHT: 'bold',
    DETECTION: 'automatic' // Auto-detect brands from CANNABIS_BRANDS list
  },
  
  PRODUCT_NAME: {
    MAX_FONT_SIZE: 36, // When brand present
    MAX_FONT_SIZE_NO_BRAND: 48, // When no brand detected
    MIN_FONT_SIZE: 14,
    FONT_WEIGHT: 'bold',
    MAX_LINES: 4,
    AREA_HEIGHT: 140 // Most of the label height
  },
  
  BOTTOM_ROW: {
    HEIGHT: 60,
    BARCODE_WIDTH: 140,
    TEXT_BOX_WIDTH: 120,
    SPACING: 10
  },
  
  BARCODE: {
    WIDTH: 140,
    HEIGHT: 45,
    DISPLAY_FONT_SIZE: 10,
    FORMAT: 'SPACED' // Spaces not hyphens
  },
  
  TEXT_BOX: {
    WIDTH: 120,
    HEIGHT: 60,
    GRID_LINES: 3,
    LABEL: false // No "Notes:" label
  },
  
  RIGHT_INFO: {
    HARVEST_FONT_SIZE: 14,  // LARGER
    PACKAGED_FONT_SIZE: 14, // LARGER
    BOX_WIDTH: 65,          // LARGER
    BOX_HEIGHT: 18,         // LARGER
    BOX_FONT_SIZE: 12       // LARGER
  },
  
  AUDIT_TRAIL: {
    FONT_SIZE: 8,
    COLOR: '#666666',
    POSITION: 'bottom-left-absolute'
  }
};

// Migration tracking for S-5492
export const MIGRATION_INFO = {
  FROM_FORMAT: 'S-21846',
  TO_FORMAT: 'S-5492',
  MIGRATION_DATE: '2025-07-31',
  VERSION: '5.5.0',
  CHANGES: [
    'Label size: 7.75″×4.75″ → 6″×4″ (horizontal)',
    'Labels per sheet: 2 → 4',
    'Layout: Vertical → 2×2 grid horizontal',
    'Brand separation: Auto-detect cannabis brands',
    'Product name: Massive sizing (up to 48pt)',
    'Bottom layout: Barcode, text box, larger dates/boxes',
    'Sheet size: HP E877 → Legal size (8.5″×14″)'
  ],
  COMPATIBILITY: {
    SHEET_SIZE: 'Legal (8.5″ × 14″)',
    ULINE_SHEETS: 'S-5492 required',
    ORIENTATION: 'Horizontal landscape'
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
  CANNABIS_BRANDS,
  LEGACY_SPECS,
  LEGAL_SHEET_CONFIG,
  USER_ROLES,
  DEFAULT_USERS,
  STORAGE_KEYS,
  VALIDATION_LIMITS,
  VALIDATION,
  DATE_FORMATS,
  ACCEPTED_FILE_TYPES,
  TOAST_CONFIG,
  PAGINATION,
  S5492_LAYOUT,
  MIGRATION_INFO
};