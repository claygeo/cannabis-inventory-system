// S-5492 ROTATED specifications - Labels positioned sideways on legal paper
const LABEL_SPECS = {
  // S-5492 Physical Specifications: 4" × 6" positioned SIDEWAYS
  WIDTH_INCHES: 6,        // 6" wide when paper is rotated 90°
  HEIGHT_INCHES: 4,       // 4" tall when paper is rotated 90°
  LABELS_PER_SHEET: 4,    // 2×2 grid (when rotated)
  SHEET_WIDTH: 8.5,       // Legal width (printed orientation)
  SHEET_HEIGHT: 14,       // Legal height (printed orientation)
  ORIENTATION: 'rotated', // Labels positioned sideways
  ROTATION_ANGLE: 90,     // Rotate paper 90° clockwise to read
  WORKFLOW: 'print_rotate_peel',
  
  // HP E877 Printer specs
  PRINTER_MARGIN: 0.167,  // 0.167" margins on all sides
  PRINTABLE_WIDTH: 8.17,  // 8.5" - (2 × 0.167")
  PRINTABLE_HEIGHT: 13.67, // 14" - (2 × 0.167")
  
  // Migration info
  REPLACES: 'S-21846',
  MIGRATION_DATE: '2025-07',
  VERSION: '6.1.0'
};

const S5492_ROTATED_LAYOUT = {
  PRODUCT_NAME: {
    MAX_FONT_SIZE: 32,      // Large for visibility after rotation
    MIN_FONT_SIZE: 12,      // Minimum readable
    MAX_LINES: 3,           // Fewer lines for rotated space
    HEIGHT_PERCENTAGE: 0.65 // 65% of rotated label height
  },
  BRAND_NAME: {
    MAX_FONT_SIZE: 20,      // Proportional to product name
    MIN_FONT_SIZE: 10,
    HEIGHT_PERCENTAGE: 0.15 // 15% of rotated label height
  },
  BOTTOM_SECTION: {
    HEIGHT_PERCENTAGE: 0.35, // 35% of rotated label height
    BARCODE_WIDTH: 25,       // 25% of rotated label width
    TEXT_BOX_WIDTH: 25,      // 25% of rotated label width
    DATES_WIDTH: 25,         // 25% of rotated label width
    CASE_BOX_WIDTH: 25       // 25% of rotated label width
  },
  AUDIT_TRAIL: {
    FONT_SIZE: 6,
    COLOR: [102, 102, 102], // Gray
    POSITION: 'bottom-left'
  },
  ROTATION_INFO: {
    angle: 90,
    direction: 'clockwise',
    workflow: 'Print PDF → Rotate paper 90° → Read/peel labels'
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
    maxLength: 120,        // Shorter for rotated space constraints
    minLength: 3
  },
  BARCODE: {
    minLength: 3,
    maxLength: 20,
    allowedChars: /^[A-Za-z0-9]+$/
  }
};

/**
 * Label formatting utilities for Uline S-5492 ROTATED labels
 * Labels positioned sideways - rotate paper 90° for reading/peeling
 */
export class LabelFormatter {
  /**
   * Format label data for S-5492 ROTATED PDF generation
   * @param {Object} item - Inventory item
   * @param {Object} enhancedData - Enhanced label data
   * @param {string} username - Username for audit trail
   * @returns {Object} - Formatted label data
   */
  static formatLabelData(item, enhancedData, username) {
    const timestamp = new Date();
    
    // Extract brand information for separate display
    const brandInfo = this.extractBrandFromProductName(item.productName);
    
    return {
      // Product information with brand detection
      productName: this.formatProductNameForRotated(item.productName),
      originalProductName: item.productName,
      sku: item.sku || '',
      barcode: item.barcode || item.sku || this.generateFallbackBarcode(item),
      brand: brandInfo.brand || item.brand || '',
      
      // Brand separation info
      brandInfo: brandInfo,
      
      // Enhanced data with rotated layout considerations
      labelQuantity: Math.max(1, parseInt(enhancedData?.labelQuantity || '1')),
      caseQuantity: enhancedData?.caseQuantity || '',
      boxCount: Math.max(1, parseInt(enhancedData?.boxCount || '1')),
      harvestDate: this.formatDate(enhancedData?.harvestDate),
      packagedDate: this.formatDate(enhancedData?.packagedDate),
      
      // Display formats - Enhanced for rotated layout
      barcodeDisplay: this.formatBarcodeForRotatedDisplay(item.barcode || item.sku || ''),
      
      // Font size calculations for rotated layout
      productNameFontSize: this.calculateRotatedProductNameFontSize(brandInfo.productName),
      brandFontSize: brandInfo.brand ? this.calculateRotatedBrandFontSize(brandInfo.brand) : null,
      
      // Audit information
      username: username || 'Unknown',
      timestamp,
      auditString: this.formatAuditString(timestamp, username),
      
      // Source information
      source: item.source || 'Unknown',
      displaySource: item.displaySource || '[UNK]',
      
      // Rotation-specific info
      rotationInfo: {
        angle: LABEL_SPECS.ROTATION_ANGLE,
        workflow: LABEL_SPECS.WORKFLOW,
        instructions: 'Print → Rotate paper 90° clockwise → Peel labels'
      }
    };
  }

  /**
   * Format product name optimized for rotated labels
   * @param {string} productName - Raw product name
   * @returns {string} - Formatted product name
   */
  static formatProductNameForRotated(productName) {
    if (!productName) return 'Product Name';
    
    // Clean and normalize
    let formatted = productName.trim();
    formatted = formatted.replace(/\s+/g, ' '); // Collapse multiple spaces
    formatted = formatted.replace(/[""'']/g, '"'); // Normalize quotes
    
    // For rotated layout, be more conservative with length
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
   * Enhanced brand extraction
   * @param {string} productName - Full product name
   * @returns {Object} - Brand and remaining product name
   */
  static extractBrandFromProductName(productName) {
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
          detectionMethod: 'exact_match'
        };
      }
    }

    // Check for common brand patterns
    const patterns = [
      /^([A-Za-z\s&'-]+?)\s*[-–]\s*(.+)$/,
      /^([A-Za-z\s&'-]+?)\s*:\s*(.+)$/,
      /^([A-Za-z\s&'-]+?)\s*\|\s*(.+)$/
    ];

    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        const potentialBrand = match[1].trim();
        const productPart = match[2].trim();
        
        if (potentialBrand.length <= 20 && 
            potentialBrand.split(/\s+/).length <= 3 &&
            !potentialBrand.match(/\d+mg|\d+g|\d+ml|capsule|gummies|flower|concentrate/i)) {
          
          return {
            brand: potentialBrand,
            productName: productPart,
            brandDetected: true,
            detectionMethod: 'pattern_match'
          };
        }
      }
    }

    return {
      brand: '',
      productName: trimmed,
      brandDetected: false,
      detectionMethod: 'none'
    };
  }

  /**
   * Format barcode for rotated display
   * @param {string} barcode - Raw barcode
   * @returns {string} - Spaced barcode for display
   */
  static formatBarcodeForRotatedDisplay(barcode) {
    if (!barcode) return '';
    
    const clean = barcode.replace(/[^A-Za-z0-9]/g, '');
    
    // For rotated layout, use compact spacing
    if (clean.length <= 8) {
      return clean.replace(/(.{2})/g, '$1 ').trim();
    } else {
      return clean.replace(/(.{3})/g, '$1 ').trim();
    }
  }

  /**
   * Enhanced date formatting for rotated labels (compact)
   * @param {string} dateStr - Raw date string
   * @returns {string} - Formatted date
   */
  static formatDate(dateStr) {
    if (!dateStr) return '';
    
    const cleaned = dateStr.toString().replace(/[^\d\/\-]/g, '');
    
    // Convert to MM/DD/YY format (compact for rotated space)
    const formats = [
      { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, format: (m, d, y) => `${m}/${d}/${y.slice(-2)}` },
      { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/, format: '$1/$2/$3' },
      { regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, format: (m, d, y) => `${m}/${d}/${y.slice(-2)}` },
      { regex: /^(\d{1,2})-(\d{1,2})-(\d{2})$/, format: '$1/$2/$3' },
      { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, format: (y, m, d) => `${m}/${d}/${y.slice(-2)}` },
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
   * Format audit string for rotated labels
   * @param {Date} timestamp - Timestamp
   * @param {string} username - Username
   * @returns {string} - Formatted audit string
   */
  static formatAuditString(timestamp, username) {
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
    const user = (username || 'Unknown').substring(0, 12); // Compact for rotated
    
    return `${dateStr} ${timeStr} EST (${user})`;
  }

  /**
   * Calculate optimal font size for rotated product names
   * @param {string} text - Product name text
   * @param {number} maxWidth - Maximum width in rotated view
   * @param {number} maxHeight - Maximum height in rotated view
   * @param {number} startingSize - Starting font size
   * @returns {number} - Optimal font size
   */
  static calculateRotatedProductNameFontSize(text, maxWidth = 380, maxHeight = 100, startingSize = 32) {
    if (!text) return startingSize;
    
    const length = text.length;
    const wordCount = text.split(' ').length;
    
    // Start with size appropriate for rotated viewing
    let fontSize = startingSize;
    
    // Adjust based on character count
    if (length > 80) fontSize = Math.max(16, startingSize - 8);
    else if (length > 60) fontSize = Math.max(20, startingSize - 6);
    else if (length > 40) fontSize = Math.max(24, startingSize - 4);
    else if (length > 20) fontSize = Math.max(28, startingSize - 2);
    
    // Adjust based on word count
    if (wordCount > 8) fontSize = Math.max(fontSize - 4, 14);
    else if (wordCount > 6) fontSize = Math.max(fontSize - 2, 16);
    
    return Math.max(
      Math.min(fontSize, S5492_ROTATED_LAYOUT.PRODUCT_NAME.MAX_FONT_SIZE),
      S5492_ROTATED_LAYOUT.PRODUCT_NAME.MIN_FONT_SIZE
    );
  }

  /**
   * Calculate optimal font size for rotated brand names
   * @param {string} brandText - Brand text
   * @param {number} maxWidth - Maximum width in rotated view
   * @param {number} maxHeight - Maximum height in rotated view
   * @returns {number} - Optimal font size
   */
  static calculateRotatedBrandFontSize(brandText, maxWidth = 380, maxHeight = 30) {
    if (!brandText) return S5492_ROTATED_LAYOUT.BRAND_NAME.MAX_FONT_SIZE;
    
    const length = brandText.length;
    let fontSize = S5492_ROTATED_LAYOUT.BRAND_NAME.MAX_FONT_SIZE; // 20pt
    
    if (length > 15) fontSize = 16;
    else if (length > 10) fontSize = 18;
    
    return Math.max(
      Math.min(fontSize, S5492_ROTATED_LAYOUT.BRAND_NAME.MAX_FONT_SIZE),
      S5492_ROTATED_LAYOUT.BRAND_NAME.MIN_FONT_SIZE
    );
  }

  /**
   * Auto-fit font size for rotated labels
   * @param {string} text - Text to fit
   * @param {number} maxWidth - Maximum width in rotated view
   * @param {number} maxHeight - Maximum height in rotated view
   * @param {number} startingSize - Starting font size
   * @param {string} fontWeight - Font weight
   * @returns {number} - Optimal font size
   */
  static autoFitFontSize(text, maxWidth = 380, maxHeight = 100, startingSize = 32, fontWeight = 'normal') {
    if (!text) return startingSize;
    
    // Simplified fitting for rotated layout
    const charWidthMultiplier = fontWeight === 'bold' ? 0.65 : 0.6;
    const estimatedWidth = text.length * (startingSize * charWidthMultiplier);
    
    if (estimatedWidth > maxWidth) {
      const scaleFactor = maxWidth / estimatedWidth;
      return Math.max(
        Math.floor(startingSize * scaleFactor),
        S5492_ROTATED_LAYOUT.PRODUCT_NAME.MIN_FONT_SIZE
      );
    }
    
    return Math.min(startingSize, S5492_ROTATED_LAYOUT.PRODUCT_NAME.MAX_FONT_SIZE);
  }

  /**
   * Validate S-5492 rotated label data
   * @param {Object} item - Inventory item
   * @param {Object} enhancedData - Enhanced data
   * @returns {Object} - Validation result
   */
  static validateS5492RotatedLabelData(item, enhancedData) {
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
        warnings.push('Product name is long - may not display optimally in rotated layout');
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
      warnings.push('Harvest date format may not be valid');
    }
    
    if (enhancedData?.packagedDate && !this.isValidDate(enhancedData.packagedDate)) {
      warnings.push('Packaged date format may not be valid');
    }
    
    // Rotation-specific warnings
    const brandInfo = this.extractBrandFromProductName(item.productName);
    if (brandInfo.brandDetected) {
      warnings.push(`Brand "${brandInfo.brand}" detected - will be displayed separately in rotated layout`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      labelFormat: 'S-5492 (ROTATED)',
      orientation: 'rotated',
      workflow: 'Print → Rotate 90° → Peel',
      brandInfo: brandInfo
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
   * Get comprehensive S-5492 rotated label specifications
   * @returns {Object} - Complete label specifications
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
      layout: S5492_ROTATED_LAYOUT,
      brandDetection: {
        enabled: true,
        brands: CANNABIS_BRANDS,
        count: CANNABIS_BRANDS.length,
        method: 'automatic'
      },
      validation: VALIDATION,
      rotation: {
        angle: LABEL_SPECS.ROTATION_ANGLE,
        workflow: LABEL_SPECS.WORKFLOW,
        instructions: [
          'Print PDF on legal size paper (8.5" × 14")',
          'Use HP E877 with "Actual Size" setting',
          'Rotate paper 90° clockwise after printing',
          'Labels are now readable and peelable',
          'Each label: 6" wide × 4" tall (in rotated view)'
        ]
      },
      migration: {
        from: 'S-21846 (7.75" × 4.75", 2 per sheet)',
        to: 'S-5492 (4" × 6" rotated, 4 per sheet)',
        improvements: [
          'ROTATED positioning for larger label accommodation',
          'Print-rotate-peel workflow',
          'Brand detection and separation',
          'Optimized font sizing for rotated viewing',
          'Legal size paper full utilization',
          'HP E877 margin compensation'
        ],
        version: LABEL_SPECS.VERSION
      }
    };
  }

  /**
   * Calculate pages needed for S-5492 rotated labels
   * @param {number} totalLabels - Total number of labels
   * @returns {number} - Number of pages needed
   */
  static calculateS5492PagesNeeded(totalLabels) {
    return Math.ceil(totalLabels / LABEL_SPECS.LABELS_PER_SHEET);
  }

  /**
   * Main validation method (used by PDFGenerator)
   * @param {Object} item - Inventory item
   * @param {Object} enhancedData - Enhanced data
   * @returns {Object} - Validation result
   */
  static validateLabelData(item, enhancedData) {
    return this.validateS5492RotatedLabelData(item, enhancedData);
  }

  /**
   * Main pages calculation method (used by PDFGenerator)
   * @param {number} totalLabels - Total number of labels
   * @returns {number} - Number of pages needed
   */
  static calculatePagesNeeded(totalLabels) {
    return this.calculateS5492PagesNeeded(totalLabels);
  }
}

// Export constants for use in other modules
export { LABEL_SPECS, S5492_ROTATED_LAYOUT, CANNABIS_BRANDS, VALIDATION };