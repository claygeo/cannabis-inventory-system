import { LABEL_SPECS, VALIDATION, S21846_LAYOUT } from '../constants.js';

/**
 * Label formatting utilities for Uline S-21846 labels (7-3/4" × 4-3/4")
 * Enhanced from S-5627 with larger fonts, better layout, and improved readability
 */
export class LabelFormatter {
  /**
   * Format label data for S-21846 PDF generation
   * @param {Object} item - Inventory item
   * @param {Object} enhancedData - Enhanced label data
   * @param {string} username - Username for audit trail
   * @returns {Object} - Formatted label data
   */
  static formatLabelData(item, enhancedData, username) {
    const timestamp = new Date();
    
    return {
      // Product information
      productName: this.formatProductNameForS21846(item.productName),
      sku: item.sku || '',
      barcode: item.barcode || item.sku || '',
      brand: item.brand || '',
      
      // Enhanced data with S-21846 considerations
      labelQuantity: parseInt(enhancedData?.labelQuantity || '1'),
      caseQuantity: enhancedData?.caseQuantity || '',
      boxCount: parseInt(enhancedData?.boxCount || '1'),
      harvestDate: this.formatDate(enhancedData?.harvestDate),
      packagedDate: this.formatDate(enhancedData?.packagedDate),
      
      // Display formats - Enhanced for S-21846
      barcodeDisplay: this.formatBarcodeForS21846Display(item.barcode || item.sku || ''),
      
      // Audit information
      username: username || 'Unknown',
      timestamp,
      auditString: this.formatAuditString(timestamp, username),
      
      // Source information
      source: item.source || 'Unknown',
      displaySource: item.displaySource || '[UNK]'
    };
  }

  /**
   * Format product name optimized for S-21846 large labels
   * @param {string} productName - Raw product name
   * @returns {string} - Formatted product name
   */
  static formatProductNameForS21846(productName) {
    if (!productName) return 'Product Name';
    
    // Clean and trim
    let formatted = productName.trim();
    formatted = formatted.replace(/\s+/g, ' ');
    
    // For S-21846, we can accommodate longer names due to larger label size
    const maxLength = 150; // Increased from 100 for S-5627
    if (formatted.length > maxLength) {
      formatted = formatted.substring(0, maxLength - 3) + '...';
    }
    
    return formatted;
  }

  /**
   * Format barcode for S-21846 display (spaces instead of hyphens)
   * @param {string} barcode - Raw barcode
   * @returns {string} - Spaced barcode for display
   */
  static formatBarcodeForS21846Display(barcode) {
    if (!barcode) return '';
    
    // Remove any existing hyphens and spaces
    const clean = barcode.replace(/[^A-Za-z0-9]/g, '');
    
    // For S-21846, use SPACES instead of hyphens for better readability
    if (clean.length <= 6) {
      return clean.replace(/(.{3})/g, '$1 ').trim();
    } else {
      return clean.replace(/(.{4})/g, '$1 ').trim();
    }
  }

  /**
   * Format date string for display
   * @param {string} dateStr - Raw date string
   * @returns {string} - Formatted date
   */
  static formatDate(dateStr) {
    if (!dateStr) return '';
    
    const cleaned = dateStr.replace(/[^\d\/\-]/g, '');
    
    // Handle various input formats
    if (cleaned.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      return cleaned;
    }
    
    if (cleaned.match(/^\d{1,2}\/\d{1,2}\/\d{2}$/)) {
      return cleaned;
    }
    
    if (cleaned.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
      return cleaned.replace(/-/g, '/');
    }
    
    if (cleaned.match(/^\d{1,2}-\d{1,2}-\d{2}$/)) {
      return cleaned.replace(/-/g, '/');
    }
    
    return dateStr;
  }

  /**
   * Format audit string for S-21846 labels
   * @param {Date} timestamp - Timestamp
   * @param {string} username - Username
   * @returns {string} - Formatted audit string
   */
  static formatAuditString(timestamp, username) {
    const month = (timestamp.getMonth() + 1).toString().padStart(2, '0');
    const day = timestamp.getDate().toString().padStart(2, '0');
    const year = timestamp.getFullYear().toString().slice(-2);
    const hours = timestamp.getHours().toString().padStart(2, '0');
    const minutes = timestamp.getMinutes().toString().padStart(2, '0');
    
    const dateStr = `${month}/${day}/${year}`;
    const timeStr = `${hours}:${minutes}`;
    const user = (username || 'Unknown').substring(0, 12); // Increased length for S-21846
    
    return `${dateStr} ${timeStr} (${user})`;
  }

  /**
   * Calculate optimal font size for S-21846 product names
   * @param {string} text - Product name text
   * @param {number} maxWidth - Maximum width in points
   * @param {number} maxHeight - Maximum height in points
   * @returns {number} - Optimal font size in points
   */
  static calculateS21846ProductNameFontSize(text, maxWidth = 534, maxHeight = 60) {
    if (!text) return S21846_LAYOUT.PRODUCT_NAME.MAX_FONT_SIZE;
    
    const length = text.length;
    const wordCount = text.split(' ').length;
    
    // Start with larger base font size for S-21846
    let fontSize = S21846_LAYOUT.PRODUCT_NAME.MAX_FONT_SIZE; // 36pt
    
    // Adjust based on character count
    if (length > 80) fontSize = 22;
    else if (length > 60) fontSize = 26;
    else if (length > 40) fontSize = 30;
    else if (length > 25) fontSize = 34;
    
    // Adjust based on word count (affects wrapping)
    if (wordCount > 8) fontSize = Math.max(fontSize - 4, 18);
    else if (wordCount > 6) fontSize = Math.max(fontSize - 2, 20);
    
    // Ensure within bounds
    return Math.max(
      Math.min(fontSize, S21846_LAYOUT.PRODUCT_NAME.MAX_FONT_SIZE),
      S21846_LAYOUT.PRODUCT_NAME.MIN_FONT_SIZE
    );
  }

  /**
   * Enhanced text fit estimation for S-21846
   * @param {string} text - Text to measure
   * @param {number} fontSize - Font size in points
   * @param {number} maxWidth - Maximum width in points
   * @param {number} maxHeight - Maximum height in points
   * @returns {Object} - Fit analysis
   */
  static estimateS21846TextFit(text, fontSize, maxWidth, maxHeight) {
    if (!text) return { fits: true, lineCount: 0 };
    
    // More accurate estimation for larger fonts
    const charWidth = fontSize * 0.55; // Slightly tighter for larger fonts
    const lineHeight = fontSize * 1.15; // Better line spacing for readability
    
    const charsPerLine = Math.floor(maxWidth / charWidth);
    const words = text.split(' ');
    
    let lines = 1;
    let currentLineLength = 0;
    
    for (const word of words) {
      if (currentLineLength + word.length + 1 > charsPerLine) {
        lines++;
        currentLineLength = word.length;
      } else {
        currentLineLength += word.length + 1;
      }
    }
    
    const totalHeight = lines * lineHeight;
    
    return {
      fits: totalHeight <= maxHeight,
      lineCount: lines,
      estimatedHeight: totalHeight,
      charsPerLine,
      recommendedFontSize: fontSize
    };
  }

  /**
   * Auto-fit font size for S-21846 labels
   * @param {string} text - Text to fit
   * @param {number} maxWidth - Maximum width in points
   * @param {number} maxHeight - Maximum height in points
   * @param {number} startingSize - Starting font size
   * @returns {number} - Optimal font size
   */
  static autoFitFontSize(text, maxWidth = 534, maxHeight = 60, startingSize = 36) {
    if (!text) return startingSize;
    
    let fontSize = startingSize;
    let attempts = 0;
    const maxAttempts = 15; // More attempts for better optimization
    
    while (attempts < maxAttempts) {
      const fit = this.estimateS21846TextFit(text, fontSize, maxWidth, maxHeight);
      
      if (fit.fits) {
        return fontSize;
      }
      
      // More granular reduction for better fitting
      fontSize = Math.max(fontSize - 1, S21846_LAYOUT.PRODUCT_NAME.MIN_FONT_SIZE);
      attempts++;
      
      if (fontSize <= S21846_LAYOUT.PRODUCT_NAME.MIN_FONT_SIZE) break;
    }
    
    return fontSize;
  }

  /**
   * Validate label data for S-21846 format
   * @param {Object} item - Inventory item
   * @param {Object} enhancedData - Enhanced data
   * @returns {Object} - Validation result
   */
  static validateS21846LabelData(item, enhancedData) {
    const errors = [];
    const warnings = [];
    
    // Required fields
    if (!item.sku && !item.barcode) {
      errors.push('Either SKU or Barcode is required');
    }
    
    if (!item.productName) {
      warnings.push('Product name is missing');
    } else if (item.productName.length > 150) {
      warnings.push('Product name is very long and may not display optimally');
    }
    
    // Enhanced data validation for S-21846
    if (enhancedData?.labelQuantity) {
      const qty = parseInt(enhancedData.labelQuantity);
      if (isNaN(qty) || qty < 1 || qty > VALIDATION.LABEL_QUANTITY.max) {
        errors.push(`Label quantity must be between 1 and ${VALIDATION.LABEL_QUANTITY.max}`);
      }
      
      // Warning for large quantities with big labels
      if (qty > 10) {
        warnings.push('Large label quantities may require significant printing time with S-21846 format');
      }
    }
    
    if (enhancedData?.caseQuantity) {
      const qty = parseInt(enhancedData.caseQuantity);
      if (isNaN(qty) || qty < 1 || qty > VALIDATION.CASE_QUANTITY.max) {
        errors.push(`Case quantity must be between 1 and ${VALIDATION.CASE_QUANTITY.max}`);
      }
    }
    
    if (enhancedData?.boxCount) {
      const count = parseInt(enhancedData.boxCount);
      if (isNaN(count) || count < 1 || count > VALIDATION.BOX_COUNT.max) {
        errors.push(`Box count must be between 1 and ${VALIDATION.BOX_COUNT.max}`);
      }
    }
    
    // Date validation
    if (enhancedData?.harvestDate && !this.isValidDate(enhancedData.harvestDate)) {
      warnings.push('Harvest date format may not be valid');
    }
    
    if (enhancedData?.packagedDate && !this.isValidDate(enhancedData.packagedDate)) {
      warnings.push('Packaged date format may not be valid');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      labelFormat: 'S-21846'
    };
  }

  /**
   * Check if date string is valid
   * @param {string} dateStr - Date string to validate
   * @returns {boolean} - Is valid
   */
  static isValidDate(dateStr) {
    if (!dateStr) return false;
    return VALIDATION.DATE_FORMATS.some(pattern => pattern.test(dateStr.trim()));
  }

  /**
   * Format multiple labels for S-21846
   * @param {Array} items - Array of inventory items
   * @param {Object} globalEnhancedData - Global enhanced data settings
   * @param {string} username - Username for audit
   * @returns {Array} - Array of formatted label data
   */
  static formatMultipleS21846Labels(items, globalEnhancedData, username) {
    return items.map(item => this.formatLabelData(item, globalEnhancedData, username));
  }

  /**
   * Get S-21846 label specifications
   * @returns {Object} - Label specifications
   */
  static getLabelSpecs() {
    return {
      ...LABEL_SPECS,
      dimensionsPoints: {
        width: LABEL_SPECS.WIDTH_INCHES * 72, // 558pt
        height: LABEL_SPECS.HEIGHT_INCHES * 72 // 342pt
      },
      printableArea: {
        width: (LABEL_SPECS.WIDTH_INCHES * 72) - 24, // 534pt (12pt margin each side)
        height: (LABEL_SPECS.HEIGHT_INCHES * 72) - 24 // 318pt
      },
      layout: S21846_LAYOUT,
      migration: {
        from: 'S-5627',
        improvements: [
          'Much larger readable fonts',
          'Dedicated manual writing area',
          'Spaced barcode display',
          'Enhanced date/box information',
          'Better overall readability'
        ]
      }
    };
  }

  /**
   * Calculate pages needed for S-21846 labels
   * @param {number} totalLabels - Total number of labels
   * @returns {number} - Number of pages needed
   */
  static calculateS21846PagesNeeded(totalLabels) {
    const specs = this.getLabelSpecs();
    return Math.ceil(totalLabels / specs.LABELS_PER_SHEET);
  }

  /**
   * Get S-21846 layout recommendations
   * @param {Object} labelData - Label data to analyze
   * @returns {Object} - Layout recommendations
   */
  static getS21846LayoutRecommendations(labelData) {
    const recommendations = {
      productName: {
        estimatedFontSize: this.calculateS21846ProductNameFontSize(labelData.productName),
        willWrap: false,
        recommendations: []
      },
      barcodeDisplay: {
        format: 'spaced',
        example: this.formatBarcodeForS21846Display(labelData.barcode)
      },
      writingBox: {
        available: true,
        size: `${S21846_LAYOUT.WRITING_BOX.WIDTH}pt × ${S21846_LAYOUT.WRITING_BOX.HEIGHT}pt`,
        gridLines: S21846_LAYOUT.WRITING_BOX.GRID_LINES
      },
      overall: {
        format: 'S-21846',
        sizeInches: `${LABEL_SPECS.WIDTH_INCHES}" × ${LABEL_SPECS.HEIGHT_INCHES}"`,
        labelsPerSheet: LABEL_SPECS.LABELS_PER_SHEET
      }
    };

    // Analyze product name
    const nameLength = labelData.productName?.length || 0;
    if (nameLength > 60) {
      recommendations.productName.recommendations.push('Consider shortening product name for optimal display');
    }
    if (nameLength > 100) {
      recommendations.productName.willWrap = true;
      recommendations.productName.recommendations.push('Product name will wrap to multiple lines');
    }

    return recommendations;
  }

  /**
   * Compare S-21846 vs S-5627 capacity
   * @param {number} labelQuantity - Number of labels needed
   * @returns {Object} - Comparison data
   */
  static compareFormats(labelQuantity) {
    const s5627Pages = Math.ceil(labelQuantity / 12); // Old format
    const s21846Pages = Math.ceil(labelQuantity / 2);  // New format
    
    return {
      labelQuantity,
      s5627: {
        format: 'S-5627 (4" × 1.5")',
        labelsPerSheet: 12,
        pagesNeeded: s5627Pages,
        sheetsNeeded: s5627Pages
      },
      s21846: {
        format: 'S-21846 (7-3/4" × 4-3/4")',
        labelsPerSheet: 2,
        pagesNeeded: s21846Pages,
        sheetsNeeded: s21846Pages
      },
      comparison: {
        morePages: s21846Pages - s5627Pages,
        benefitTradeoff: 'More sheets required, but much larger and more readable labels with writing space'
      }
    };
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use validateS21846LabelData instead
   */
  static validateLabelData(item, enhancedData) {
    console.warn('validateLabelData is deprecated. Use validateS21846LabelData for new S-21846 format.');
    return this.validateS21846LabelData(item, enhancedData);
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use calculateS21846PagesNeeded instead
   */
  static calculatePagesNeeded(totalLabels) {
    console.warn('calculatePagesNeeded is deprecated. Use calculateS21846PagesNeeded for new S-21846 format.');
    return this.calculateS21846PagesNeeded(totalLabels);
  }
}