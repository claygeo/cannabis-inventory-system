// S-5492 NEW ROTATED CONTENT LAYOUT specifications
const LABEL_SPECS = {
  // S-5492 Physical Specifications: 4" × 6" positioned SIDEWAYS with content rotated 90° right
  WIDTH_INCHES: 6,        // 6" wide when paper is rotated 90°
  HEIGHT_INCHES: 4,       // 4" tall when paper is rotated 90°
  LABELS_PER_SHEET: 4,    // 2×2 grid (when rotated)
  SHEET_WIDTH: 8.5,       // Legal width (printed orientation)
  SHEET_HEIGHT: 14,       // Legal height (printed orientation)
  ORIENTATION: 'rotated_content', // Labels positioned sideways, content rotated 90° right
  ROTATION_ANGLE: 90,     // Rotate paper 90° clockwise to read
  CONTENT_ROTATION: 90,   // Content also rotated 90° right for optimal layout
  WORKFLOW: 'print_rotate_peel',
  
  // HP E877 Printer specs
  PRINTER_MARGIN: 0.167,  // 0.167" margins on all sides
  PRINTABLE_WIDTH: 8.17,  // 8.5" - (2 × 0.167")
  PRINTABLE_HEIGHT: 13.67, // 14" - (2 × 0.167")
  
  // Migration info
  REPLACES: 'S-21846',
  MIGRATION_DATE: '2025-07',
  VERSION: '6.3.0',
  LAYOUT_UPDATE: 'Content repositioned and rotated 90° right'
};

const S5492_NEW_ROTATED_LAYOUT = {
  TOP_SECTION: {
    HEIGHT_PERCENTAGE: 0.35,  // 35% of label height
    AUDIT_TRAIL: {
      POSITION: 'top-left',
      ROTATION: 90,           // 90° clockwise rotation
      FONT_SIZE: 7,           // Increased from 5
      COLOR: [102, 102, 102], // Gray
      WIDTH_PERCENTAGE: 0.25  // 25% of label width
    },
    PRODUCT_NAME: {
      POSITION: 'center-top',
      MAX_FONT_SIZE: 34,      // Increased significantly
      MIN_FONT_SIZE: 16,      // Higher minimum
      MAX_LINES: 3,
      WIDTH_PERCENTAGE: 0.75, // 75% of label width (leaves space for audit trail)
      BRAND_MAX_FONT_SIZE: 22, // Increased brand font
      BRAND_MIN_FONT_SIZE: 12
    }
  },
  MIDDLE_SECTION: {
    HEIGHT_PERCENTAGE: 0.35,  // 35% of label height
    PURPOSE: 'product_name_overflow' // Extra space for long product names
  },
  BOTTOM_SECTION: {
    HEIGHT_PERCENTAGE: 0.30,  // 30% of label height
    LAYOUT: 'four_column',
    COLUMNS: {
      BARCODE: {
        WIDTH_PERCENTAGE: 0.25,
        POSITION: 'left',
        NUMERIC_FONT_SIZE: 8,   // Increased from 6
        BARCODE_HEIGHT_RATIO: 0.7
      },
      STORE_BOX: {
        WIDTH_PERCENTAGE: 0.25,
        POSITION: 'center-left',
        LABEL_FONT_SIZE: 9,     // "Store:" label font
        LABEL_TEXT: 'Store:',
        BOX_HEIGHT_RATIO: 0.7
      },
      DATES: {
        WIDTH_PERCENTAGE: 0.25,
        POSITION: 'center-right',
        LABEL_FONT_SIZE: 10,    // Increased from 8
        VALUE_FONT_SIZE: 10,    // Increased from 8
        LAYOUT: 'vertical'
      },
      CASE_BOX: {
        WIDTH_PERCENTAGE: 0.25,
        POSITION: 'right',
        FONT_SIZE: 9,           // Increased from 7
        BOX_HEIGHT: 14,         // Increased from 10
        LAYOUT: 'vertical'
      }
    }
  },
  SPACING: {
    PADDING: 10,              // Increased from 8
    COLUMN_PADDING: 2,
    LINE_SPACING: 1.2,
    SECTION_SPACING: 4
  },
  ROTATION_INFO: {
    container_angle: 0,       // Container not rotated in PDF
    content_angle: 90,        // Content rotated 90° right
    paper_rotation: 90,       // Rotate paper 90° clockwise to read
    workflow: 'Print PDF → Rotate paper 90° → Content is optimally positioned'
  }
};

const CANNABIS_BRANDS = [
  // Major Multi-State Operators (MSOs)
  'Curaleaf', 'Trulieve', 'Green Thumb', 'Cresco', 'Verano', 'Acreage', 'Columbia Care',
  'Harvest', 'MedMen', 'Planet 13', 'TerrAscend', 'Jushi', '4Front Ventures',
  
  // Popular Consumer Brands
  'Rythm', 'GTI', 'Grassroots', 'Reef', 'B-Noble', 'Aeriz', 'Revolution',
  'Cookies', 'Jeeter', 'Raw Garden', 'Stiiizy', 'Select', 'Heavy Hitters',
  'Papa & Barkley', 'Kiva', 'Wyld', 'Wana', 'Plus Products', 'Legion of Bloom',
  'AbsoluteXtracts', 'Matter', 'Pharmacann',
  
  // Canadian LPs
  'Canopy Growth', 'Tilray', 'Aphria', 'Aurora', 'Hexo', 'Cronos', 'OrganiGram',
  'Village Farms', 'WeedMD', 'Fire & Flower', 'High Tide',
  
  // Regional/Craft Brands
  'Sublime', 'Connected', 'Alien Labs', 'Backpack Boyz', 'Jungle Boys',
  'Glass House', 'Flow Kana', 'Humboldt Seed Company', 'Lowell Herb Co',
  'Caliva', 'Dosist', 'Beboe', 'Lord Jones', 'Foria'
];

const VALIDATION = {
  LABEL_QUANTITY: {
    min: 1,
    max: 100,
    warningThreshold: 16 // Warn for large quantities (4 per sheet)
  },
  CASE_QUANTITY: {
    min: 1,
    max: 9999
  },
  BOX_COUNT: {
    min: 1,
    max: 50
  },
  DATE_FORMATS: [
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,     // MM/DD/YYYY
    /^\d{1,2}\/\d{1,2}\/\d{2}$/,     // MM/DD/YY
    /^\d{1,2}-\d{1,2}-\d{4}$/,       // MM-DD-YYYY
    /^\d{1,2}-\d{1,2}-\d{2}$/,       // MM-DD-YY
    /^\d{4}-\d{1,2}-\d{1,2}$/        // YYYY-MM-DD
  ],
  PRODUCT_NAME: {
    maxLength: 150,        // Increased for new layout with better space utilization
    minLength: 3
  },
  BARCODE: {
    minLength: 3,
    maxLength: 20,
    allowedChars: /^[A-Za-z0-9]+$/
  }
};

/**
 * Label formatting utilities for Uline S-5492 NEW ROTATED CONTENT LAYOUT
 * Content rotated 90° right within sideways-positioned labels
 */
export class LabelFormatter {
  /**
   * Format label data for S-5492 NEW ROTATED CONTENT LAYOUT PDF generation
   * @param {Object} item - Inventory item
   * @param {Object} enhancedData - Enhanced label data
   * @param {string} username - Username for audit trail
   * @returns {Object} - Formatted label data
   */
  static formatLabelData(item, enhancedData, username) {
    const timestamp = new Date();
    
    // Extract brand information for separate display with enhanced detection
    const brandInfo = this.extractBrandFromProductNameEnhanced(item.productName);
    
    return {
      // Product information with enhanced brand detection
      productName: this.formatProductNameForNewLayout(item.productName),
      originalProductName: item.productName,
      sku: item.sku || '',
      barcode: item.barcode || item.sku || this.generateFallbackBarcode(item),
      brand: brandInfo.brand || item.brand || '',
      
      // Enhanced brand separation info
      brandInfo: brandInfo,
      
      // Enhanced data optimized for new rotated content layout
      labelQuantity: Math.max(1, parseInt(enhancedData?.labelQuantity || '1')),
      caseQuantity: enhancedData?.caseQuantity || '',
      boxCount: Math.max(1, parseInt(enhancedData?.boxCount || '1')),
      harvestDate: this.formatDateForNewLayout(enhancedData?.harvestDate),
      packagedDate: this.formatDateForNewLayout(enhancedData?.packagedDate),
      
      // Display formats - Enhanced for new rotated content layout
      barcodeDisplay: this.formatBarcodeForNewLayout(item.barcode || item.sku || ''),
      
      // Font size calculations for new rotated content layout
      productNameFontSize: this.calculateNewLayoutProductNameFontSize(brandInfo.productName),
      brandFontSize: brandInfo.brand ? this.calculateNewLayoutBrandFontSize(brandInfo.brand) : null,
      
      // Audit information
      username: username || 'Unknown',
      timestamp,
      auditString: this.formatAuditStringForNewLayout(timestamp, username),
      
      // Source information
      source: item.source || 'Unknown',
      displaySource: item.displaySource || '[UNK]',
      
      // New rotated content layout info
      layoutInfo: {
        contentRotation: S5492_NEW_ROTATED_LAYOUT.ROTATION_INFO.content_angle,
        paperRotation: S5492_NEW_ROTATED_LAYOUT.ROTATION_INFO.paper_rotation,
        workflow: S5492_NEW_ROTATED_LAYOUT.ROTATION_INFO.workflow,
        version: LABEL_SPECS.VERSION,
        layoutUpdate: LABEL_SPECS.LAYOUT_UPDATE
      }
    };
  }

  /**
   * Format product name optimized for new rotated content layout
   * @param {string} productName - Raw product name
   * @returns {string} - Formatted product name
   */
  static formatProductNameForNewLayout(productName) {
    if (!productName) return 'Product Name';
    
    // Clean and normalize
    let formatted = productName.trim();
    formatted = formatted.replace(/\s+/g, ' '); // Collapse multiple spaces
    formatted = formatted.replace(/[""'']/g, '"'); // Normalize quotes
    
    // For new layout, allow longer names due to better space utilization
    const maxLength = VALIDATION.PRODUCT_NAME.maxLength;
    if (formatted.length > maxLength) {
      const truncated = formatted.substring(0, maxLength - 3);
      const lastSpace = truncated.lastIndexOf(' ');
      if (lastSpace > maxLength * 0.8) {
        formatted = truncated.substring(0, lastSpace) + '...';
      } else {
        formatted = truncated + '...';
      }
    }
    
    return formatted;
  }

  /**
   * Enhanced brand extraction with improved pattern recognition
   * @param {string} productName - Full product name
   * @returns {Object} - Enhanced brand and remaining product name
   */
  static extractBrandFromProductNameEnhanced(productName) {
    if (!productName) return { brand: '', productName: 'Product Name' };

    const trimmed = productName.trim();
    
    // Check if product name starts with any known brand (case insensitive)
    for (const brand of CANNABIS_BRANDS) {
      const regex = new RegExp(`^${brand}\\s+`, 'i');
      if (regex.test(trimmed)) {
        const remaining = trimmed.replace(regex, '').trim();
        return {
          brand: brand,
          productName: remaining || trimmed,
          brandDetected: true,
          detectionMethod: 'exact_match',
          confidence: 'high',
          layoutOptimized: true // Flag for new layout
        };
      }
    }

    // Enhanced pattern matching for new layout
    const patterns = [
      { regex: /^([A-Za-z\s&'-]+?)\s*[-–]\s*(.+)$/, priority: 1 },
      { regex: /^([A-Za-z\s&'-]+?)\s*:\s*(.+)$/, priority: 2 },
      { regex: /^([A-Za-z\s&'-]+?)\s*\|\s*(.+)$/, priority: 3 },
      { regex: /^([A-Za-z\s&'-]+?)\s*\.\s*(.+)$/, priority: 4 }
    ];

    for (const pattern of patterns) {
      const match = trimmed.match(pattern.regex);
      if (match) {
        const potentialBrand = match[1].trim();
        const productPart = match[2].trim();
        
        // Enhanced brand validation for new layout
        if (potentialBrand.length <= 25 && 
            potentialBrand.split(/\s+/).length <= 4 &&
            !potentialBrand.match(/\d+mg|\d+g|\d+ml|capsule|gummies|flower|concentrate|strain/i) &&
            productPart.length > 5) {
          
          return {
            brand: potentialBrand,
            productName: productPart,
            brandDetected: true,
            detectionMethod: 'pattern_match',
            confidence: pattern.priority <= 2 ? 'medium' : 'low',
            layoutOptimized: true
          };
        }
      }
    }

    return {
      brand: '',
      productName: trimmed,
      brandDetected: false,
      detectionMethod: 'none',
      confidence: 'none',
      layoutOptimized: true
    };
  }

  /**
   * Format barcode for new rotated content layout display
   * @param {string} barcode - Raw barcode
   * @returns {string} - Optimally spaced barcode for new layout
   */
  static formatBarcodeForNewLayout(barcode) {
    if (!barcode) return '';
    
    const clean = barcode.replace(/[^A-Za-z0-9]/g, '');
    
    // For new layout, optimize spacing for larger display area
    if (clean.length <= 6) {
      return clean.replace(/(.{2})/g, '$1 ').trim();
    } else if (clean.length <= 12) {
      return clean.replace(/(.{3})/g, '$1 ').trim();
    } else {
      return clean.replace(/(.{4})/g, '$1 ').trim();
    }
  }

  /**
   * Enhanced date formatting for new rotated content layout
   * @param {string} dateStr - Raw date string
   * @returns {string} - Formatted date optimized for new layout
   */
  static formatDateForNewLayout(dateStr) {
    if (!dateStr) return '';
    
    const cleaned = dateStr.toString().replace(/[^\d\/\-]/g, '');
    
    // Convert to MM/DD/YY format (optimal for new layout space)
    const formats = [
      { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, format: (m, d, y) => `${m.padStart(2, '0')}/${d.padStart(2, '0')}/${y.slice(-2)}` },
      { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/, format: (m, d, y) => `${m.padStart(2, '0')}/${d.padStart(2, '0')}/${y}` },
      { regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, format: (m, d, y) => `${m.padStart(2, '0')}/${d.padStart(2, '0')}/${y.slice(-2)}` },
      { regex: /^(\d{1,2})-(\d{1,2})-(\d{2})$/, format: (m, d, y) => `${m.padStart(2, '0')}/${d.padStart(2, '0')}/${y}` },
      { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, format: (y, m, d) => `${m.padStart(2, '0')}/${d.padStart(2, '0')}/${y.slice(-2)}` },
    ];
    
    for (const format of formats) {
      if (format.regex.test(cleaned)) {
        if (typeof format.format === 'function') {
          const match = cleaned.match(format.regex);
          return format.format(...match.slice(1));
        } else {
          return cleaned.replace(format.regex, format.format);
        }
      }
    }
    
    return cleaned.replace(/-/g, '/');
  }

  /**
   * Format audit string for new rotated content layout (with rotation)
   * @param {Date} timestamp - Timestamp
   * @param {string} username - Username
   * @returns {string} - Formatted audit string for rotation
   */
  static formatAuditStringForNewLayout(timestamp, username) {
    const month = (timestamp.getMonth() + 1).toString().padStart(2, '0');
    const day = timestamp.getDate().toString().padStart(2, '0');
    const year = timestamp.getFullYear().toString().slice(-2);
    
    let hours = timestamp.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = hours.toString();
    
    const minutes = timestamp.getMinutes().toString().padStart(2, '0');
    
    const dateStr = `${month}/${day}/${year}`;
    const timeStr = `${hoursStr}:${minutes} ${ampm}`;
    const user = (username || 'Unknown').substring(0, 10); // Compact for rotation
    
    return `${dateStr} ${timeStr} EST (${user})`;
  }

  /**
   * Calculate optimal font size for new layout product names
   * @param {string} text - Product name text
   * @param {number} maxWidth - Maximum width in new layout
   * @param {number} maxHeight - Maximum height in new layout
   * @param {number} startingSize - Starting font size
   * @returns {number} - Optimal font size for new layout
   */
  static calculateNewLayoutProductNameFontSize(text, maxWidth = 350, maxHeight = 120, startingSize = 32) {
    if (!text) return startingSize;
    
    const length = text.length;
    const wordCount = text.split(' ').length;
    
    // Enhanced sizing for new layout with more space
    let fontSize = startingSize;
    
    // Adjust based on character count (more generous for new layout)
    if (length > 100) fontSize = Math.max(18, startingSize - 10);
    else if (length > 80) fontSize = Math.max(22, startingSize - 8);
    else if (length > 60) fontSize = Math.max(26, startingSize - 6);
    else if (length > 40) fontSize = Math.max(28, startingSize - 4);
    else if (length > 20) fontSize = Math.max(30, startingSize - 2);
    
    // Adjust based on word count
    if (wordCount > 10) fontSize = Math.max(fontSize - 6, 16);
    else if (wordCount > 8) fontSize = Math.max(fontSize - 4, 18);
    else if (wordCount > 6) fontSize = Math.max(fontSize - 2, 20);
    
    return Math.max(
      Math.min(fontSize, S5492_NEW_ROTATED_LAYOUT.TOP_SECTION.PRODUCT_NAME.MAX_FONT_SIZE),
      S5492_NEW_ROTATED_LAYOUT.TOP_SECTION.PRODUCT_NAME.MIN_FONT_SIZE
    );
  }

  /**
   * Calculate optimal font size for new layout brand names
   * @param {string} brandText - Brand text
   * @param {number} maxWidth - Maximum width in new layout
   * @param {number} maxHeight - Maximum height in new layout
   * @returns {number} - Optimal font size for new layout
   */
  static calculateNewLayoutBrandFontSize(brandText, maxWidth = 350, maxHeight = 35) {
    if (!brandText) return S5492_NEW_ROTATED_LAYOUT.TOP_SECTION.PRODUCT_NAME.BRAND_MAX_FONT_SIZE;
    
    const length = brandText.length;
    let fontSize = S5492_NEW_ROTATED_LAYOUT.TOP_SECTION.PRODUCT_NAME.BRAND_MAX_FONT_SIZE; // 22pt
    
    if (length > 20) fontSize = 16;
    else if (length > 15) fontSize = 18;
    else if (length > 10) fontSize = 20;
    
    return Math.max(
      Math.min(fontSize, S5492_NEW_ROTATED_LAYOUT.TOP_SECTION.PRODUCT_NAME.BRAND_MAX_FONT_SIZE),
      S5492_NEW_ROTATED_LAYOUT.TOP_SECTION.PRODUCT_NAME.BRAND_MIN_FONT_SIZE
    );
  }

  /**
   * Enhanced auto-fit font size for new rotated content layout
   * @param {string} text - Text to fit
   * @param {number} maxWidth - Maximum width in new layout
   * @param {number} maxHeight - Maximum height in new layout
   * @param {number} startingSize - Starting font size
   * @param {string} fontWeight - Font weight
   * @returns {number} - Optimal font size for new layout
   */
  static autoFitFontSize(text, maxWidth = 350, maxHeight = 120, startingSize = 32, fontWeight = 'normal') {
    if (!text) return startingSize;
    
    // Enhanced fitting algorithm for new layout with better space utilization
    const charWidthMultiplier = fontWeight === 'bold' ? 0.7 : 0.65;
    const estimatedWidth = text.length * (startingSize * charWidthMultiplier);
    
    if (estimatedWidth > maxWidth) {
      const scaleFactor = maxWidth / estimatedWidth;
      const scaledSize = Math.floor(startingSize * scaleFactor);
      
      // Apply minimum constraints for new layout
      return Math.max(
        scaledSize,
        S5492_NEW_ROTATED_LAYOUT.TOP_SECTION.PRODUCT_NAME.MIN_FONT_SIZE
      );
    }
    
    return Math.min(startingSize, S5492_NEW_ROTATED_LAYOUT.TOP_SECTION.PRODUCT_NAME.MAX_FONT_SIZE);
  }

  /**
   * Validate S-5492 new rotated content layout label data
   * @param {Object} item - Inventory item
   * @param {Object} enhancedData - Enhanced data
   * @returns {Object} - Validation result
   */
  static validateS5492NewLayoutLabelData(item, enhancedData) {
    const errors = [];
    const warnings = [];
    
    // Required fields validation
    if (!item.sku && !item.barcode && !item.productName) {
      errors.push('At least one of SKU, Barcode, or Product Name is required');
    }
    
    if (!item.productName) {
      warnings.push('Product name is missing - label may be hard to identify');
    } else {
      if (item.productName.length < VALIDATION.PRODUCT_NAME.minLength) {
        warnings.push('Product name is very short');
      }
      if (item.productName.length > VALIDATION.PRODUCT_NAME.maxLength) {
        warnings.push('Product name is very long - may need font adjustment in new layout');
      }
    }
    
    // Enhanced data validation
    if (enhancedData?.labelQuantity) {
      const qty = parseInt(enhancedData.labelQuantity);
      if (isNaN(qty) || qty < VALIDATION.LABEL_QUANTITY.min || qty > VALIDATION.LABEL_QUANTITY.max) {
        errors.push(`Label quantity must be between ${VALIDATION.LABEL_QUANTITY.min} and ${VALIDATION.LABEL_QUANTITY.max}`);
      } else if (qty > VALIDATION.LABEL_QUANTITY.warningThreshold) {
        const pages = Math.ceil(qty / LABEL_SPECS.LABELS_PER_SHEET);
        warnings.push(`Large label quantity (${qty}) will require ${pages} legal size sheets`);
      }
    }
    
    // Date validation
    if (enhancedData?.harvestDate && !this.isValidDate(enhancedData.harvestDate)) {
      warnings.push('Harvest date format may not be valid - will be formatted for new layout');
    }
    
    if (enhancedData?.packagedDate && !this.isValidDate(enhancedData.packagedDate)) {
      warnings.push('Packaged date format may not be valid - will be formatted for new layout');
    }
    
    // New layout specific validations
    const brandInfo = this.extractBrandFromProductNameEnhanced(item.productName);
    if (brandInfo.brandDetected) {
      warnings.push(`Brand "${brandInfo.brand}" detected - will be displayed separately in new rotated layout (${brandInfo.confidence} confidence)`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      labelFormat: 'S-5492 (NEW ROTATED CONTENT LAYOUT)',
      orientation: 'sideways_with_rotated_content',
      workflow: 'Print → Rotate paper 90° → Content optimally positioned',
      brandInfo: brandInfo,
      layoutVersion: LABEL_SPECS.VERSION,
      contentRotation: S5492_NEW_ROTATED_LAYOUT.ROTATION_INFO.content_angle
    };
  }

  /**
   * Check if date string is valid
   * @param {string} dateStr - Date string to validate
   * @returns {boolean} - Is valid
   */
  static isValidDate(dateStr) {
    if (!dateStr) return false;
    return VALIDATION.DATE_FORMATS.some(pattern => pattern.test(dateStr.toString().trim()));
  }

  /**
   * Generate fallback barcode if none provided
   * @param {Object} item - Inventory item
   * @returns {string} - Fallback barcode
   */
  static generateFallbackBarcode(item) {
    const base = item.sku || item.productName || 'UNKNOWN';
    const clean = base.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const truncated = clean.substring(0, 10);
    const timestamp = Date.now().toString().slice(-4);
    return truncated + timestamp;
  }

  /**
   * Get comprehensive S-5492 new rotated content layout specifications
   * @returns {Object} - Complete label specifications with new layout info
   */
  static getLabelSpecs() {
    return {
      ...LABEL_SPECS,
      dimensionsPoints: {
        width: LABEL_SPECS.WIDTH_INCHES * 72,  // 432pt (6" in rotated view)
        height: LABEL_SPECS.HEIGHT_INCHES * 72  // 288pt (4" in rotated view)
      },
      printableArea: {
        width: LABEL_SPECS.PRINTABLE_WIDTH * 72,   // ~588pt
        height: LABEL_SPECS.PRINTABLE_HEIGHT * 72  // ~984pt
      },
      pageSize: {
        width: LABEL_SPECS.SHEET_WIDTH * 72,    // 612pt (8.5")
        height: LABEL_SPECS.SHEET_HEIGHT * 72   // 1008pt (14")
      },
      layout: S5492_NEW_ROTATED_LAYOUT,
      brandDetection: {
        enabled: true,
        enhanced: true,
        brands: CANNABIS_BRANDS,
        count: CANNABIS_BRANDS.length,
        method: 'enhanced_automatic',
        confidenceLevels: ['high', 'medium', 'low'],
        patternMatching: true
      },
      validation: VALIDATION,
      newContentLayout: {
        topSection: {
          auditTrail: 'Top-left, rotated 90° clockwise',
          productName: 'Center-top, largest fonts (up to 34pt)',
          brandName: 'Above product name if detected (up to 22pt)'
        },
        middleSection: {
          purpose: 'Product name overflow area',
          height: '35% of label'
        },
        bottomSection: {
          layout: 'Four-column design',
          columns: [
            'Barcode with numeric display (larger fonts)',
            'Store text box with "Store:" label',
            'Harvest & Package dates (larger fonts)',
            'Case quantity & Box X/X (larger fonts)'
          ]
        },
        improvements: [
          'Content rotated 90° right for optimal layout',
          'Significantly larger fonts throughout',
          'Enhanced brand detection and separation',
          'Store text box with clear labeling',
          'Rotated audit trail in optimal position',
          'Better space utilization in all sections'
        ]
      },
      rotation: {
        containerAngle: 0,    // Container positioning unchanged
        contentAngle: LABEL_SPECS.CONTENT_ROTATION,
        paperAngle: LABEL_SPECS.ROTATION_ANGLE,
        workflow: LABEL_SPECS.WORKFLOW,
        instructions: [
          'Print PDF on legal size paper (8.5" × 14")',
          'Use HP E877 with "Actual Size" setting',
          'Rotate paper 90° clockwise after printing',
          'Content is now optimally positioned for reading',
          'Each label: 6" wide × 4" tall (in rotated view)',
          'All elements use larger fonts for better visibility'
        ]
      },
      migration: {
        from: 'S-5492 (Basic sideways layout)',
        to: 'S-5492 (New rotated content layout)',
        improvements: [
          'Content repositioned and rotated 90° right',
          'Audit trail moved to top-left with rotation',
          'Product name prominence with larger fonts',
          'Enhanced 4-column bottom section layout',
          'Store text box with clear "Store:" labeling',
          'All fonts increased for better visibility',
          'Better space utilization throughout'
        ],
        version: LABEL_SPECS.VERSION,
        layoutUpdate: LABEL_SPECS.LAYOUT_UPDATE
      }
    };
  }

  /**
   * Calculate pages needed for S-5492 new layout labels
   * @param {number} totalLabels - Total number of labels
   * @returns {number} - Number of pages needed
   */
  static calculateS5492NewLayoutPagesNeeded(totalLabels) {
    return Math.ceil(totalLabels / LABEL_SPECS.LABELS_PER_SHEET);
  }

  /**
   * Get new layout font size recommendations
   * @param {string} textType - Type of text ('product', 'brand', 'barcode', 'dates', 'case')
   * @param {string} text - Text to size
   * @param {Object} constraints - Size constraints
   * @returns {number} - Recommended font size
   */
  static getNewLayoutFontSize(textType, text = '', constraints = {}) {
    const { maxWidth = 350, maxHeight = 120 } = constraints;
    
    switch (textType) {
      case 'product':
        return this.calculateNewLayoutProductNameFontSize(text, maxWidth, maxHeight);
      case 'brand':
        return this.calculateNewLayoutBrandFontSize(text, maxWidth);
      case 'barcode':
        return S5492_NEW_ROTATED_LAYOUT.BOTTOM_SECTION.COLUMNS.BARCODE.NUMERIC_FONT_SIZE;
      case 'dates':
        return S5492_NEW_ROTATED_LAYOUT.BOTTOM_SECTION.COLUMNS.DATES.LABEL_FONT_SIZE;
      case 'case':
        return S5492_NEW_ROTATED_LAYOUT.BOTTOM_SECTION.COLUMNS.CASE_BOX.FONT_SIZE;
      case 'store':
        return S5492_NEW_ROTATED_LAYOUT.BOTTOM_SECTION.COLUMNS.STORE_BOX.LABEL_FONT_SIZE;
      case 'audit':
        return S5492_NEW_ROTATED_LAYOUT.TOP_SECTION.AUDIT_TRAIL.FONT_SIZE;
      default:
        return 10;
    }
  }

  /**
   * Main validation method (used by PDFGenerator)
   * @param {Object} item - Inventory item
   * @param {Object} enhancedData - Enhanced data
   * @returns {Object} - Validation result
   */
  static validateLabelData(item, enhancedData) {
    return this.validateS5492NewLayoutLabelData(item, enhancedData);
  }

  /**
   * Main pages calculation method (used by PDFGenerator)
   * @param {number} totalLabels - Total number of labels
   * @returns {number} - Number of pages needed
   */
  static calculatePagesNeeded(totalLabels) {
    return this.calculateS5492NewLayoutPagesNeeded(totalLabels);
  }
}

// Export constants for use in other modules
export { LABEL_SPECS, S5492_NEW_ROTATED_LAYOUT, CANNABIS_BRANDS, VALIDATION };