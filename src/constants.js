// Application Constants
export const APP_NAME = "Cannabis Inventory Management System";
export const APP_VERSION = "5.3";

// User Roles and Authentication
export const USER_ROLES = {
  ADMINISTRATOR: "Administrator",
  WAREHOUSE: "Warehouse", 
  MANAGER: "Manager"
};

export const DEFAULT_USERS = {
  admin: { password: "admin123", role: USER_ROLES.ADMINISTRATOR },
  warehouse: { password: "warehouse123", role: USER_ROLES.WAREHOUSE },
  manager: { password: "manager123", role: USER_ROLES.MANAGER }
};

// Data Sources
export const DATA_SOURCES = {
  MAIN_INVENTORY: "MainInventory",
  SWEED_REPORT: "SweedReport"
};

// Label Configuration - Uline S-5627 Format
export const LABEL_CONFIG = {
  // Physical dimensions (4" x 1.5")
  WIDTH_INCHES: 4,
  HEIGHT_INCHES: 1.5,
  
  // Layout (2 columns x 6 rows = 12 labels per sheet)
  COLUMNS_PER_PAGE: 2,
  ROWS_PER_PAGE: 6,
  LABELS_PER_PAGE: 12,
  
  // Margins for Uline S-5627 compatibility
  PAGE_MARGIN_TOP: 0.5,    // inches
  PAGE_MARGIN_BOTTOM: 0.5, // inches  
  PAGE_MARGIN_LEFT: 0.1875, // 3/16 inches
  PAGE_MARGIN_RIGHT: 0.1875, // 3/16 inches
  
  // Label spacing
  LABEL_SPACING_X: 0.125, // 1/8 inch between columns
  LABEL_SPACING_Y: 0,     // No spacing between rows
  
  // Print settings
  DPI: 300,
  PRINT_SCALE: 1.0
};

// Session Storage Keys
export const STORAGE_KEYS = {
  CURRENT_USER: "cannabis_current_user",
  INVENTORY_DATA: "cannabis_inventory_data", 
  SWEED_DATA: "cannabis_sweed_data",
  SCANNED_ITEMS: "cannabis_scanned_items",
  SCANNED_SWEED_ITEMS: "cannabis_scanned_sweed_items",
  ENHANCED_DATA: "cannabis_enhanced_data",
  SESSION_DATA: "cannabis_session_data"
};

// CSV Column Mappings
export const MAIN_INVENTORY_COLUMNS = {
  FACILITY_NAME: 0,      // Column A
  PRODUCT_NAME: 1,       // Column B  
  BRAND: 4,              // Column E
  STRAIN: 6,             // Column G
  SIZE: 7,               // Column H
  SKU: 8,                // Column I
  BARCODE: 9,            // Column J
  BIOTRACK_CODE: 10,     // Column K
  QUANTITY: 11,          // Column L
  LOCATION: 19,          // Column T
  DISTRIBUTOR: 27        // Column AB
};

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

// Validation Rules
export const VALIDATION = {
  LABEL_QUANTITY: { min: 1, max: 50 },
  CASE_QUANTITY: { min: 1, max: 1000 },
  BOX_COUNT: { min: 1, max: 100 },
  DATE_FORMATS: [
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,  // MM/DD/YYYY or DD/MM/YYYY
    /^\d{1,2}\/\d{1,2}\/\d{2}$/,  // MM/DD/YY or DD/MM/YY
    /^\d{1,2}-\d{1,2}-\d{4}$/,    // MM-DD-YYYY or DD-MM-YYYY
    /^\d{1,2}-\d{1,2}-\d{2}$/     // MM-DD-YY or DD-MM-YY
  ]
};

// Event Types for Session Tracking
export const EVENT_TYPES = {
  SESSION_START: "Session Start",
  USER_LOGIN: "User Login", 
  USER_LOGOUT: "User Logout",
  MAIN_INVENTORY_IMPORT: "Main Inventory Import",
  SWEED_IMPORT: "Sweed Import", 
  ITEM_SCANNED: "Item Scanned",
  LABEL_GENERATED: "Label Generated",
  SESSION_CLEARED: "Session Cleared",
  ERROR: "Error"
};

// Barcode Configuration
export const BARCODE_CONFIG = {
  FORMAT: "CODE39",
  WIDTH: 2,
  HEIGHT: 50,
  DISPLAY_VALUE: false,
  MARGIN: 0
};