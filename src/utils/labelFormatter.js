// CORRECTED S-5492 specifications - HORIZONTAL labels (6" WIDE × 4" TALL)
const LABEL_SPECS = {
  // S-5492 Physical Specifications: Uline 4" × 6" = 6" WIDE × 4" TALL
  WIDTH_INCHES: 6,        // 6" WIDE (horizontal orientation)
  HEIGHT_INCHES: 4,       // 4" TALL 
  LABELS_PER_SHEET: 4,    // 2×2 grid on legal size
  SHEET_WIDTH: 8.5,       // Legal width
  SHEET_HEIGHT: 14,       // Legal height
  ORIENTATION: 'horizontal', // Labels are WIDER than tall
  
  // Migration info
  REPLACES: 'S-21846',
  MIGRATION_DATE: '2025-07',
  VERSION: '6.0.0'
};

const S5492_LAYOUT = {
  PRODUCT_NAME: {
    MAX_FONT_SIZE: 36,      // Large for horizontal space
    MIN_FONT_SIZE: 12,      // Minimum readable
    MAX_LINES: 4,           // Maximum lines for wrapping
    HEIGHT_PERCENTAGE: 0.6  // 60% of label height
  },
  BRAND_NAME: {
    MAX_FONT_SIZE: 24,      // Smaller than product name
    MIN_FONT_SIZE: 10,
    HEIGHT_PERCENTAGE: 0.15 // 15% of label height
  },
  BOTTOM_SECTION: {
    HEIGHT_PERCENTAGE: 0.4, // 40% of label height
    BARCODE_WIDTH: 25,      // 25% of label width
    TEXT_BOX_WIDTH: 25,     // 25% of label width
    DATES_WIDTH: 25,        // 25% of label width
    CASE_BOX_WIDTH: 25      // 25% of label width
  },
  AUDIT_TRAIL: {
    FONT_SIZE: 6,
    COLOR: [102, 102, 102], // Gray
    POSITION: 'bottom-left'
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
    maxLength: 150,        // Reasonable for horizontal layout
    minLength: 3
  },
  BARCODE: {
    minLength: 3,
    maxLength: 20,
    allowedChars: /^[A-Za-z0-9]+$/
  }
};

/**
 * Label formatting utilities for Uline S-5492 labels (6" WIDE × 4" TALL HORIZONTAL)
 * Enhanced with comprehensive brand detection optimized for horizontal layout
 */
export class LabelFormatter {
  /**
   * Format label data for S-5492 PDF generation
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
      productName: this.formatProductNameForS5492(item.productName),
      originalProductName: item.productName,
      sku: item.sku || '',
      barcode: item.barcode || item.sku || this.generateFallbackBarcode(item),
      brand: brandInfo.brand || item.brand || '',
      
      // Brand separation info
      brandInfo: brandInfo,
      
      // Enhanced data with S-5492 considerations
      labelQuantity: Math.max(1, parseInt(enhancedData?.labelQuantity || '1')),
      caseQuantity: enhancedData?.caseQuantity || '',
      boxCount: Math.max(1, parseInt(enhancedData?.boxCount || '1')),
      harvestDate: this.formatDate(enhancedData?.harvestDate),
      packagedDate: this.formatDate(enhancedData?.packagedDate),
      
      // Display formats - Enhanced for S-5492
      barcodeDisplay: this.formatBarcodeForS5492Display(item.barcode || item.sku || ''),
      
      // Font size calculations for horizontal layout
      productNameFontSize: this.calculateS5492ProductNameFontSize(brandInfo.productName),
      brandFontSize: brandInfo.brand ? this.calculateBrandFontSize(brandInfo.brand) : null,
      
      // Audit information
      username: username || 'Unknown',
      timestamp,
      auditString: this.formatAuditString(timestamp, username),
      
      // Source information
      source: item.source || 'Unknown',
      displaySource: item.displaySource || '[UNK]',
      
      // Layout optimization flags
      layoutOptimizations: this.calculateLayoutOptimizations(item.productName, brandInfo)
    };
  }

  /**
   * Format product name optimized for S-5492 horizontal labels
   * @param {string} productName - Raw product name
   * @returns {string} - Formatted product name
   */
  static formatProductNameForS5492(productName) {
    if (!productName) return 'Product Name';
    
    // Clean and normalize
    let formatted = productName.trim();
    formatted = formatted.replace(/\s+/g, ' '); // Collapse multiple spaces
    formatted = formatted.replace(/[""'']/g, '"'); // Normalize quotes
    
    // For horizontal S-5492, we can accommodate longer names
    const maxLength = VALIDATION.PRODUCT_NAME.maxLength;
    if (formatted.length > maxLength) {
      // Intelligent truncation - try to break at word boundaries
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
   * Enhanced brand extraction with comprehensive cannabis brand database
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
      // "Brand Name - Product" or "Brand Name – Product"
      /^([A-Za-z\s&'-]+?)\s*[-–]\s*(.+)$/,
      // "Brand Name: Product"
      /^([A-Za-z\s&'-]+?)\s*:\s*(.+)$/,
      // "Brand Name | Product"
      /^([A-Za-z\s&'-]+?)\s*\|\s*(.+)$/
    ];

    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        const potentialBrand = match[1].trim();
        const productPart = match[2].trim();
        
        // Only treat as brand if it's reasonably short
        if (potentialBrand.length <= 25 && 
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

    // No brand detected
    return {
      brand: '',
      productName: trimmed,
      brandDetected: false,
      detectionMethod: 'none'
    };
  }

  /**
   * Format barcode for S-5492 display (spaces for better horizontal readability)
   * @param {string} barcode - Raw barcode
   * @returns {string} - Spaced barcode for display
   */
  static formatBarcodeForS5492Display(barcode) {
    if (!barcode) return '';
    
    // Remove any existing formatting
    const clean = barcode.replace(/[^A-Za-z0-9]/g, '');
    
    // For S-5492 horizontal layout, use optimal spacing
    if (clean.length <= 6) {
      return clean.replace(/(.{2})/g, '$1 ').trim();
    } else if (clean.length <= 12) {
      return clean.replace(/(.{3})/g, '$1 ').trim();
    } else {
      return clean.replace(/(.{4})/g, '$1 ').trim();
    }
  }

  /**
   * Enhanced date formatting for S-5492 labels
   * @param {string} dateStr - Raw date string
   * @returns {string} - Formatted date
   */
  static formatDate(dateStr) {
    if (!dateStr) return '';
    
    const cleaned = dateStr.toString().replace(/[^\d\/\-]/g, '');
    
    // Handle various input formats and convert to MM/DD/YY (shorter for horizontal space)
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
    
    // If no standard format matches, return shortened version
    if (cleaned.match(/\d+[\/\-]\d+[\/\-]\d+/)) {
      return cleaned.replace(/-/g, '/').replace(/\/(\d{4})$/, '/$1'.slice(-3)); // Convert to 2-digit year
    }
    
    return dateStr;
  }

  /**
   * Format audit string for S-5492 labels
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
    const user = (username || 'Unknown').substring(0, 15); // Reasonable length
    
    return `${dateStr} ${timeStr} EST (${user})`;
  }

  /**
   * Calculate optimal font size for S-5492 product names (optimized for horizontal space)
   * @param {string} text - Product name text
   * @param {number} maxWidth - Maximum width in points (default for scaled labels)
   * @param {number} maxHeight - Maximum height in points
   * @param {number} startingSize - Starting font size
   * @returns {number} - Optimal font size
   */
  static calculateS5492ProductNameFontSize(text, maxWidth = 270, maxHeight = 80, startingSize = 36) {
    if (!text) return startingSize;
    
    const length = text.length;
    const wordCount = text.split(' ').length;
    
    // Start with maximum size appropriate for horizontal layout
    let fontSize = startingSize;
    
    // Adjust based on character count - optimized for horizontal space
    if (length > 100) fontSize = Math.max(16, startingSize - 10);
    else if (length > 80) fontSize = Math.max(20, startingSize - 8);
    else if (length > 60) fontSize = Math.max(24, startingSize - 6);
    else if (length > 40) fontSize = Math.max(28, startingSize - 4);
    else if (length > 20) fontSize = Math.max(32, startingSize - 2);
    
    // Adjust based on word count (affects line wrapping)
    if (wordCount > 10) fontSize = Math.max(fontSize - 4, 14);
    else if (wordCount > 8) fontSize = Math.max(fontSize - 2, 16);
    
    // Ensure within bounds
    return Math.max(
      Math.min(fontSize, S5492_LAYOUT.PRODUCT_NAME.MAX_FONT_SIZE),
      S5492_LAYOUT.PRODUCT_NAME.MIN_FONT_SIZE
    );
  }

  /**
   * Calculate optimal font size for brand names in horizontal layout
   * @param {string} brandText - Brand text
   * @param {number} maxWidth - Maximum width in points
   * @param {number} maxHeight - Maximum height in points
   * @returns {number} - Optimal font size
   */
  static calculateBrandFontSize(brandText, maxWidth = 270, maxHeight = 30) {
    if (!brandText) return S5492_LAYOUT.BRAND_NAME.MAX_FONT_SIZE;
    
    const length = brandText.length;
    let fontSize = S5492_LAYOUT.BRAND_NAME.MAX_FONT_SIZE; // 24pt
    
    // Brands are usually shorter, but consider horizontal space
    if (length > 20) fontSize = 18;
    else if (length > 15) fontSize = 20;
    else if (length > 10) fontSize = 22;
    
    return Math.max(
      Math.min(fontSize, S5492_LAYOUT.BRAND_NAME.MAX_FONT_SIZE),
      S5492_LAYOUT.BRAND_NAME.MIN_FONT_SIZE
    );
  }

  /**
   * Advanced text fit estimation for S-5492 horizontal layout
   * @param {string} text - Text to measure
   * @param {number} fontSize - Font size in points
   * @param {number} maxWidth - Maximum width in points
   * @param {number} maxHeight - Maximum height in points
   * @param {string} fontWeight - Font weight ('normal' or 'bold')
   * @returns {Object} - Detailed fit analysis
   */
  static estimateS5492TextFit(text, fontSize, maxWidth, maxHeight, fontWeight = 'normal') {
    if (!text) return { fits: true, lineCount: 0 };
    
    // Accurate measurements for horizontal layout
    const charWidthMultiplier = fontWeight === 'bold' ? 0.65 : 0.6;
    const charWidth = fontSize * charWidthMultiplier;
    const lineHeight = fontSize * 1.1; // Line spacing
    
    const charsPerLine = Math.floor(maxWidth / charWidth);
    const words = text.split(' ');
    
    let lines = 1;
    let currentLineLength = 0;
    let longestLineLength = 0;
    
    for (const word of words) {
      const wordLength = word.length;
      
      if (currentLineLength + wordLength + 1 > charsPerLine && currentLineLength > 0) {
        lines++;
        longestLineLength = Math.max(longestLineLength, currentLineLength);
        currentLineLength = wordLength;
      } else {
        currentLineLength += wordLength + (currentLineLength > 0 ? 1 : 0);
      }
    }
    
    longestLineLength = Math.max(longestLineLength, currentLineLength);
    const totalHeight = lines * lineHeight;
    const actualWidth = longestLineLength * charWidth;
    
    return {
      fits: totalHeight <= maxHeight && actualWidth <= maxWidth,
      lineCount: lines,
      estimatedHeight: totalHeight,
      estimatedWidth: actualWidth,
      charsPerLine,
      longestLineLength,
      utilizationPercent: {
        height: Math.min(100, (totalHeight / maxHeight) * 100),
        width: Math.min(100, (actualWidth / maxWidth) * 100)
      },
      canIncrease: totalHeight < maxHeight * 0.8 && actualWidth < maxWidth * 0.8
    };
  }

  /**
   * Auto-fit font size for S-5492 horizontal labels
   * @param {string} text - Text to fit
   * @param {number} maxWidth - Maximum width in points
   * @param {number} maxHeight - Maximum height in points
   * @param {number} startingSize - Starting font size
   * @param {string} fontWeight - Font weight
   * @returns {number} - Optimal font size
   */
  static autoFitFontSize(text, maxWidth = 270, maxHeight = 80, startingSize = 36, fontWeight = 'normal') {
    if (!text) return startingSize;
    
    let fontSize = startingSize;
    let bestFit = null;
    const maxAttempts = 20;
    let attempts = 0;
    
    // Try to find the largest font size that fits
    while (attempts < maxAttempts) {
      const fit = this.estimateS5492TextFit(text, fontSize, maxWidth, maxHeight, fontWeight);
      
      if (fit.fits) {
        bestFit = { fontSize, fit };
        
        // Try to increase if we have room
        if (fit.canIncrease && fontSize < startingSize) {
          fontSize += 1;
          attempts++;
          continue;
        } else {
          break; // Found a good fit
        }
      } else {
        // Reduce font size
        fontSize = Math.max(fontSize - 1, S5492_LAYOUT.PRODUCT_NAME.MIN_FONT_SIZE);
        if (fontSize <= S5492_LAYOUT.PRODUCT_NAME.MIN_FONT_SIZE) break;
      }
      
      attempts++;
    }
    
    return bestFit ? bestFit.fontSize : Math.max(fontSize, S5492_LAYOUT.PRODUCT_NAME.MIN_FONT_SIZE);
  }

  /**
   * Calculate layout optimizations for specific product
   * @param {string} originalProductName - Original product name
   * @param {Object} brandInfo - Brand extraction info
   * @returns {Object} - Layout optimization flags
   */
  static calculateLayoutOptimizations(originalProductName, brandInfo) {
    const totalLength = originalProductName ? originalProductName.length : 0;
    const hasLongProductName = totalLength > 60;
    const hasVeryLongProductName = totalLength > 100;
    const wordCount = originalProductName ? originalProductName.split(' ').length : 0;
    
    return {
      hasLongProductName,
      hasVeryLongProductName,
      highWordCount: wordCount > 8,
      brandDetected: brandInfo.brandDetected,
      recommendSmallerFont: hasVeryLongProductName || wordCount > 12,
      recommendFewerLines: wordCount > 10,
      textComplexity: this.assessTextComplexity(originalProductName),
      layoutSuggestions: this.generateLayoutSuggestions(totalLength, wordCount, brandInfo.brandDetected)
    };
  }

  /**
   * Assess text complexity for layout optimization
   * @param {string} text - Text to assess
   * @returns {string} - Complexity level
   */
  static assessTextComplexity(text) {
    if (!text) return 'simple';
    
    const length = text.length;
    const wordCount = text.split(' ').length;
    const hasNumbers = /\d/.test(text);
    const hasBrackets = /[\[\]()]/.test(text);
    const hasSpecialChars = /[&@#$%]/.test(text);
    
    let complexityScore = 0;
    
    if (length > 80) complexityScore += 2;
    else if (length > 50) complexityScore += 1;
    
    if (wordCount > 10) complexityScore += 2;
    else if (wordCount > 6) complexityScore += 1;
    
    if (hasNumbers) complexityScore += 1;
    if (hasBrackets) complexityScore += 1;
    if (hasSpecialChars) complexityScore += 1;
    
    if (complexityScore >= 5) return 'very_complex';
    if (complexityScore >= 3) return 'complex';
    if (complexityScore >= 1) return 'moderate';
    return 'simple';
  }

  /**
   * Generate layout suggestions based on content analysis
   * @param {number} textLength - Text length
   * @param {number} wordCount - Word count
   * @param {boolean} hasBrand - Has detected brand
   * @returns {Array} - Array of suggestions
   */
  static generateLayoutSuggestions(textLength, wordCount, hasBrand) {
    const suggestions = [];
    
    if (textLength > 100) {
      suggestions.push('Consider shortening product name for better horizontal layout');
    }
    
    if (wordCount > 12) {
      suggestions.push('High word count may require smaller font in horizontal layout');
    }
    
    if (!hasBrand && textLength > 60) {
      suggestions.push('Long product name without brand - will use full horizontal space');
    }
    
    if (hasBrand) {
      suggestions.push('Brand detected - will display separately above product name');
    }
    
    if (textLength < 25) {
      suggestions.push('Short product name - can use very large font for maximum visibility');
    }
    
    return suggestions;
  }

  /**
   * Comprehensive validation for S-5492 label data
   * @param {Object} item - Inventory item
   * @param {Object} enhancedData - Enhanced data
   * @returns {Object} - Validation result
   */
  static validateS5492LabelData(item, enhancedData) {
    const errors = [];
    const warnings = [];
    
    // Required fields validation
    if (!item.sku && !item.barcode && !item.productName) {
      errors.push('At least one of SKU, Barcode, or Product Name is required');
    }
    
    if (!item.productName) {
      warnings.push('Product name is missing - label may be hard to identify');
    } else {
      // Product name validation
      if (item.productName.length < VALIDATION.PRODUCT_NAME.minLength) {
        warnings.push('Product name is very short');
      }
      if (item.productName.length > VALIDATION.PRODUCT_NAME.maxLength) {
        warnings.push('Product name is long and may not display optimally on horizontal S-5492 labels');
      }
    }
    
    // Barcode validation
    if (item.barcode) {
      const barcodeClean = item.barcode.replace(/[^A-Za-z0-9]/g, '');
      if (barcodeClean.length < VALIDATION.BARCODE.minLength) {
        warnings.push('Barcode is very short and may not scan properly');
      }
      if (barcodeClean.length > VALIDATION.BARCODE.maxLength) {
        warnings.push('Barcode is very long and may not fit in horizontal layout');
      }
      if (!VALIDATION.BARCODE.allowedChars.test(barcodeClean)) {
        errors.push('Barcode contains invalid characters (only letters and numbers allowed)');
      }
    }
    
    // Enhanced data validation for S-5492
    if (enhancedData?.labelQuantity) {
      const qty = parseInt(enhancedData.labelQuantity);
      if (isNaN(qty) || qty < VALIDATION.LABEL_QUANTITY.min || qty > VALIDATION.LABEL_QUANTITY.max) {
        errors.push(`Label quantity must be between ${VALIDATION.LABEL_QUANTITY.min} and ${VALIDATION.LABEL_QUANTITY.max}`);
      } else if (qty > VALIDATION.LABEL_QUANTITY.warningThreshold) {
        const pages = Math.ceil(qty / LABEL_SPECS.LABELS_PER_SHEET);
        warnings.push(`Large label quantity (${qty}) will require ${pages} legal size sheets with S-5492 format`);
      }
    }
    
    if (enhancedData?.caseQuantity) {
      const qty = parseInt(enhancedData.caseQuantity);
      if (isNaN(qty) || qty < VALIDATION.CASE_QUANTITY.min || qty > VALIDATION.CASE_QUANTITY.max) {
        errors.push(`Case quantity must be between ${VALIDATION.CASE_QUANTITY.min} and ${VALIDATION.CASE_QUANTITY.max}`);
      }
    }
    
    if (enhancedData?.boxCount) {
      const count = parseInt(enhancedData.boxCount);
      if (isNaN(count) || count < VALIDATION.BOX_COUNT.min || count > VALIDATION.BOX_COUNT.max) {
        errors.push(`Box count must be between ${VALIDATION.BOX_COUNT.min} and ${VALIDATION.BOX_COUNT.max}`);
      }
    }
    
    // Date validation
    if (enhancedData?.harvestDate && !this.isValidDate(enhancedData.harvestDate)) {
      warnings.push('Harvest date format may not be valid (expected MM/DD/YYYY or MM/DD/YY)');
    }
    
    if (enhancedData?.packagedDate && !this.isValidDate(enhancedData.packagedDate)) {
      warnings.push('Packaged date format may not be valid (expected MM/DD/YYYY or MM/DD/YY)');
    }
    
    // S-5492 specific validations
    const brandInfo = this.extractBrandFromProductName(item.productName);
    if (brandInfo.brandDetected) {
      warnings.push(`Brand "${brandInfo.brand}" detected - will be displayed separately for better horizontal layout`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      labelFormat: 'S-5492',
      orientation: 'horizontal',
      brandInfo: brandInfo,
      recommendations: this.generateValidationRecommendations(item, enhancedData, brandInfo)
    };
  }

  /**
   * Generate recommendations based on validation
   * @param {Object} item - Inventory item
   * @param {Object} enhancedData - Enhanced data
   * @param {Object} brandInfo - Brand info
   * @returns {Array} - Recommendations
   */
  static generateValidationRecommendations(item, enhancedData, brandInfo) {
    const recommendations = [];
    
    if (!item.barcode && !item.sku) {
      recommendations.push('Add a barcode or SKU for better inventory tracking');
    }
    
    if (brandInfo.brandDetected) {
      recommendations.push(`Brand "${brandInfo.brand}" will be displayed prominently in horizontal layout`);
    }
    
    const textComplexity = this.assessTextComplexity(item.productName);
    if (textComplexity === 'very_complex') {
      recommendations.push('Consider simplifying product name for better horizontal label readability');
    }
    
    const qty = parseInt(enhancedData?.labelQuantity || '1');
    if (qty > 8) {
      const pages = Math.ceil(qty / LABEL_SPECS.LABELS_PER_SHEET);
      recommendations.push(`${qty} labels will require ${pages} legal size sheets (4 labels per sheet)`);
    }
    
    return recommendations;
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
    // Create a simple fallback barcode from available data
    const base = item.sku || item.productName || 'UNKNOWN';
    const clean = base.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const truncated = clean.substring(0, 12);
    
    // Add timestamp suffix to make unique
    const timestamp = Date.now().toString().slice(-4);
    
    return truncated + timestamp;
  }

  /**
   * Format multiple labels for S-5492
   * @param {Array} items - Array of inventory items
   * @param {Object} globalEnhancedData - Global enhanced data settings
   * @param {string} username - Username for audit
   * @returns {Array} - Array of formatted label data
   */
  static formatMultipleS5492Labels(items, globalEnhancedData, username) {
    return items.map((item, index) => {
      try {
        return this.formatLabelData(item, globalEnhancedData, username);
      } catch (error) {
        console.error(`Error formatting label ${index + 1}:`, error);
        return {
          ...this.formatLabelData({}, globalEnhancedData, username),
          error: `Formatting error: ${error.message}`,
          originalItem: item
        };
      }
    });
  }

  /**
   * Get comprehensive S-5492 label specifications
   * @returns {Object} - Complete label specifications
   */
  static getLabelSpecs() {
    return {
      ...LABEL_SPECS,
      dimensionsPoints: {
        width: LABEL_SPECS.WIDTH_INCHES * 72,  // 432pt (6" WIDE)
        height: LABEL_SPECS.HEIGHT_INCHES * 72  // 288pt (4" TALL)
      },
      printableArea: {
        width: (LABEL_SPECS.WIDTH_INCHES * 72) - 12, // 420pt (with margins)
        height: (LABEL_SPECS.HEIGHT_INCHES * 72) - 12 // 276pt (with margins)
      },
      pageSize: {
        width: LABEL_SPECS.SHEET_WIDTH * 72,    // 612pt (8.5")
        height: LABEL_SPECS.SHEET_HEIGHT * 72   // 1008pt (14")
      },
      layout: S5492_LAYOUT,
      brandDetection: {
        enabled: true,
        brands: CANNABIS_BRANDS,
        count: CANNABIS_BRANDS.length,
        method: 'automatic'
      },
      validation: VALIDATION,
      migration: {
        from: 'S-21846 (7.75" × 4.75", 2 per sheet)',
        to: 'S-5492 (6" WIDE × 4" TALL horizontal, 4 per sheet)',
        improvements: [
          'HORIZONTAL orientation (6" WIDE × 4" TALL)',
          'Brand detection and separation for 50+ cannabis brands',
          'Optimized font sizing for horizontal space',
          'Bottom-focused layout for scanning workflow',
          'Legal size sheet compatibility (8.5" × 14")',
          'Proportional scaling to fit on legal paper',
          'Enhanced date formatting for compact display'
        ],
        version: LABEL_SPECS.VERSION
      }
    };
  }

  /**
   * Calculate pages needed for S-5492 labels
   * @param {number} totalLabels - Total number of labels
   * @returns {number} - Number of pages needed
   */
  static calculateS5492PagesNeeded(totalLabels) {
    return Math.ceil(totalLabels / LABEL_SPECS.LABELS_PER_SHEET);
  }

  /**
   * Get detailed S-5492 layout recommendations for specific product
   * @param {Object} labelData - Label data to analyze
   * @returns {Object} - Detailed layout recommendations
   */
  static getS5492LayoutRecommendations(labelData) {
    const brandInfo = this.extractBrandFromProductName(labelData.productName);
    const textComplexity = this.assessTextComplexity(labelData.productName);
    
    const recommendations = {
      brandDetection: {
        detected: brandInfo.brandDetected,
        brand: brandInfo.brand,
        productName: brandInfo.productName,
        method: brandInfo.detectionMethod,
        confidence: brandInfo.detectionMethod === 'exact_match' ? 'high' : 
                   brandInfo.detectionMethod === 'pattern_match' ? 'medium' : 'low'
      },
      productName: {
        estimatedFontSize: this.calculateS5492ProductNameFontSize(brandInfo.productName),
        brandFontSize: brandInfo.brand ? this.calculateBrandFontSize(brandInfo.brand) : null,
        textComplexity: textComplexity,
        willWrap: brandInfo.productName && brandInfo.productName.length > 50,
        estimatedLines: brandInfo.productName ? Math.ceil(brandInfo.productName.length / 35) : 1,
        recommendations: []
      },
      barcodeDisplay: {
        format: 'spaced',
        example: this.formatBarcodeForS5492Display(labelData.barcode),
        length: labelData.barcode ? labelData.barcode.replace(/[^A-Za-z0-9]/g, '').length : 0
      },
      layout: {
        orientation: 'horizontal',
        format: 'S-5492',
        physicalSize: `${LABEL_SPECS.WIDTH_INCHES}" WIDE × ${LABEL_SPECS.HEIGHT_INCHES}" TALL`,
        labelsPerSheet: LABEL_SPECS.LABELS_PER_SHEET,
        sheetSize: `Legal (${LABEL_SPECS.SHEET_WIDTH}" × ${LABEL_SPECS.SHEET_HEIGHT}")`,
        contentFlow: 'horizontal sections'
      },
      optimizations: this.calculateLayoutOptimizations(labelData.productName, brandInfo)
    };

    // Generate specific recommendations
    const totalText = (brandInfo.brand || '') + ' ' + (brandInfo.productName || '');
    if (totalText.length > 80) {
      recommendations.productName.recommendations.push('Long product name - optimized for horizontal space');
    }
    if (totalText.length > 120) {
      recommendations.productName.recommendations.push('Very long product name - consider abbreviating for better horizontal display');
    }
    
    if (!brandInfo.brand) {
      recommendations.productName.recommendations.push('No brand detected - full product name will use maximum horizontal space');
    } else {
      recommendations.productName.recommendations.push(`Brand "${brandInfo.brand}" will be displayed above product name`);
    }

    if (textComplexity === 'very_complex') {
      recommendations.productName.recommendations.push('Complex product name - may require smaller font in horizontal layout');
    }

    return recommendations;
  }

  // Main interface methods (used by PDFGenerator)
  
  /**
   * Main validation method
   * @param {Object} item - Inventory item
   * @param {Object} enhancedData - Enhanced data
   * @returns {Object} - Validation result
   */
  static validateLabelData(item, enhancedData) {
    return this.validateS5492LabelData(item, enhancedData);
  }

  /**
   * Main pages calculation method
   * @param {number} totalLabels - Total number of labels
   * @returns {number} - Number of pages needed
   */
  static calculatePagesNeeded(totalLabels) {
    return this.calculateS5492PagesNeeded(totalLabels);
  }
}

// Export constants for use in other modules
export { LABEL_SPECS, S5492_LAYOUT, CANNABIS_BRANDS, VALIDATION };