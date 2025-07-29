import { LABEL_SPECS, VALIDATION } from '../constants.js';

/**
 * Label formatting utilities for Uline S-5627 labels
 */
export class LabelFormatter {
  /**
   * Format label data for PDF generation
   * @param {Object} item - Inventory item
   * @param {Object} enhancedData - Enhanced label data
   * @param {string} username - Username for audit trail
   * @returns {Object} - Formatted label data
   */
  static formatLabelData(item, enhancedData, username) {
    const timestamp = new Date();
    
    return {
      // Product information
      productName: this.formatProductName(item.productName),
      sku: item.sku || '',
      barcode: item.barcode || item.sku || '',
      brand: item.brand || '',
      
      // Enhanced data
      labelQuantity: parseInt(enhancedData?.labelQuantity || '1'),
      caseQuantity: enhancedData?.caseQuantity || '',
      boxCount: parseInt(enhancedData?.boxCount || '1'),
      harvestDate: this.formatDate(enhancedData?.harvestDate),
      packagedDate: this.formatDate(enhancedData?.packagedDate),
      
      // Display formats
      barcodeDisplay: this.formatBarcodeForDisplay(item.barcode || item.sku || ''),
      
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
   * Format product name for label display
   * @param {string} productName - Raw product name
   * @returns {string} - Formatted product name
   */
  static formatProductName(productName) {
    if (!productName) return 'Product Name';
    
    // Clean and trim the product name
    let formatted = productName.trim();
    
    // Remove extra whitespace
    formatted = formatted.replace(/\s+/g, ' ');
    
    // Truncate if too long (will be handled by font sizing)
    const maxLength = 100; // Reasonable limit
    if (formatted.length > maxLength) {
      formatted = formatted.substring(0, maxLength - 3) + '...';
    }
    
    return formatted;
  }

  /**
   * Format barcode for hyphenated display
   * @param {string} barcode - Raw barcode
   * @returns {string} - Hyphenated barcode for display
   */
  static formatBarcodeForDisplay(barcode) {
    if (!barcode) return '';
    
    // Remove any existing hyphens and spaces
    const clean = barcode.replace(/[^A-Za-z0-9]/g, '');
    
    // Add hyphens every 3-4 characters for readability
    if (clean.length <= 6) {
      return clean.replace(/(.{3})/g, '$1-').replace(/-$/, '');
    } else {
      return clean.replace(/(.{4})/g, '$1-').replace(/-$/, '');
    }
  }

  /**
   * Format date string for display
   * @param {string} dateStr - Raw date string
   * @returns {string} - Formatted date
   */
  static formatDate(dateStr) {
    if (!dateStr) return '';
    
    // Handle various input formats
    const cleaned = dateStr.replace(/[^\d\/\-]/g, '');
    
    // Check for common formats
    if (cleaned.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      return cleaned; // Already in MM/DD/YYYY or DD/MM/YYYY
    }
    
    if (cleaned.match(/^\d{1,2}\/\d{1,2}\/\d{2}$/)) {
      return cleaned; // MM/DD/YY or DD/MM/YY
    }
    
    if (cleaned.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
      return cleaned.replace(/-/g, '/'); // Convert MM-DD-YYYY to MM/DD/YYYY
    }
    
    if (cleaned.match(/^\d{1,2}-\d{1,2}-\d{2}$/)) {
      return cleaned.replace(/-/g, '/'); // Convert MM-DD-YY to MM/DD/YY
    }
    
    // Return original if no pattern matches
    return dateStr;
  }

  /**
   * Format audit string for label
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
    const user = (username || 'Unknown').substring(0, 10); // Limit username length
    
    return `${dateStr} ${timeStr} (${user})`;
  }

  /**
   * Calculate optimal font size for product name
   * @param {string} text - Product name text
   * @param {number} maxWidth - Maximum width in points
   * @param {number} maxHeight - Maximum height in points
   * @returns {number} - Optimal font size in points
   */
  static calculateProductNameFontSize(text, maxWidth = 280, maxHeight = 24) {
    if (!text) return 12;
    
    const length = text.length;
    const wordCount = text.split(' ').length;
    
    // Base font size calculation
    let fontSize = 18;
    
    // Adjust based on character count
    if (length > 50) fontSize = 10;
    else if (length > 40) fontSize = 12;
    else if (length > 30) fontSize = 14;
    else if (length > 20) fontSize = 16;
    
    // Adjust based on word count (affects wrapping)
    if (wordCount > 6) fontSize = Math.max(fontSize - 2, 8);
    else if (wordCount > 4) fontSize = Math.max(fontSize - 1, 9);
    
    // Ensure minimum readability
    return Math.max(fontSize, 8);
  }

  /**
   * Estimate if text will fit in given dimensions
   * @param {string} text - Text to measure
   * @param {number} fontSize - Font size in points
   * @param {number} maxWidth - Maximum width in points
   * @param {number} maxHeight - Maximum height in points
   * @returns {Object} - Fit analysis
   */
  static estimateTextFit(text, fontSize, maxWidth, maxHeight) {
    if (!text) return { fits: true, lineCount: 0 };
    
    // Rough estimation: average character width is ~0.6 * fontSize
    const charWidth = fontSize * 0.6;
    const lineHeight = fontSize * 1.2;
    
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
      charsPerLine
    };
  }

  /**
   * Auto-adjust font size to fit text in dimensions
   * @param {string} text - Text to fit
   * @param {number} maxWidth - Maximum width in points
   * @param {number} maxHeight - Maximum height in points
   * @param {number} startingSize - Starting font size
   * @returns {number} - Optimal font size
   */
  static autoFitFontSize(text, maxWidth = 280, maxHeight = 24, startingSize = 18) {
    if (!text) return startingSize;
    
    let fontSize = startingSize;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const fit = this.estimateTextFit(text, fontSize, maxWidth, maxHeight);
      
      if (fit.fits) {
        return fontSize;
      }
      
      // Reduce font size and try again
      fontSize = Math.max(fontSize - 1, 8);
      attempts++;
      
      // If we've reached minimum size, stop
      if (fontSize <= 8) break;
    }
    
    return fontSize;
  }

  /**
   * Validate label data before formatting
   * @param {Object} item - Inventory item
   * @param {Object} enhancedData - Enhanced data
   * @returns {Object} - Validation result
   */
  static validateLabelData(item, enhancedData) {
    const errors = [];
    const warnings = [];
    
    // Required fields
    if (!item.sku && !item.barcode) {
      errors.push('Either SKU or Barcode is required');
    }
    
    if (!item.productName) {
      warnings.push('Product name is missing');
    }
    
    // Enhanced data validation
    if (enhancedData?.labelQuantity) {
      const qty = parseInt(enhancedData.labelQuantity);
      if (isNaN(qty) || qty < 1 || qty > VALIDATION.LABEL_QUANTITY.max) {
        errors.push(`Label quantity must be between 1 and ${VALIDATION.LABEL_QUANTITY.max}`);
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
    if (enhancedData?.harvestDate) {
      if (!this.isValidDate(enhancedData.harvestDate)) {
        warnings.push('Harvest date format may not be valid');
      }
    }
    
    if (enhancedData?.packagedDate) {
      if (!this.isValidDate(enhancedData.packagedDate)) {
        warnings.push('Packaged date format may not be valid');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check if date string is in valid format
   * @param {string} dateStr - Date string to validate
   * @returns {boolean} - Is valid
   */
  static isValidDate(dateStr) {
    if (!dateStr) return false;
    
    // Check against supported patterns
    return VALIDATION.DATE_FORMATS.some(pattern => pattern.test(dateStr.trim()));
  }

  /**
   * Generate multiple label data objects
   * @param {Array} items - Array of inventory items
   * @param {Object} globalEnhancedData - Global enhanced data settings
   * @param {string} username - Username for audit
   * @returns {Array} - Array of formatted label data
   */
  static formatMultipleLabels(items, globalEnhancedData, username) {
    return items.map(item => this.formatLabelData(item, globalEnhancedData, username));
  }

  /**
   * Get label specifications for current format
   * @returns {Object} - Label specifications
   */
  static getLabelSpecs() {
    return {
      ...LABEL_SPECS,
      dimensionsPoints: {
        width: LABEL_SPECS.WIDTH_INCHES * 72, // Convert to points
        height: LABEL_SPECS.HEIGHT_INCHES * 72
      },
      printableArea: {
        width: (LABEL_SPECS.WIDTH_INCHES * 72) - 8, // 4pt margin each side
        height: (LABEL_SPECS.HEIGHT_INCHES * 72) - 8
      }
    };
  }

  /**
   * Calculate label positions on sheet
   * @param {number} labelIndex - Index of label (0-based)
   * @returns {Object} - Position coordinates in points
   */
  static calculateLabelPosition(labelIndex) {
    const specs = this.getLabelSpecs();
    const labelsPerRow = specs.COLUMNS;
    const row = Math.floor(labelIndex / labelsPerRow);
    const col = labelIndex % labelsPerRow;
    
    // Standard 8.5" x 11" page (612 x 792 points)
    const pageWidth = 612;
    const pageHeight = 792;
    
    // Calculate starting positions (centered on page)
    const totalLabelsWidth = specs.COLUMNS * specs.dimensionsPoints.width;
    const totalLabelsHeight = specs.ROWS * specs.dimensionsPoints.height;
    
    const startX = (pageWidth - totalLabelsWidth) / 2;
    const startY = (pageHeight - totalLabelsHeight) / 2;
    
    return {
      x: startX + (col * specs.dimensionsPoints.width),
      y: startY + (row * specs.dimensionsPoints.height),
      width: specs.dimensionsPoints.width,
      height: specs.dimensionsPoints.height
    };
  }

  /**
   * Calculate how many pages needed for labels
   * @param {number} totalLabels - Total number of labels
   * @returns {number} - Number of pages needed
   */
  static calculatePagesNeeded(totalLabels) {
    const specs = this.getLabelSpecs();
    return Math.ceil(totalLabels / specs.LABELS_PER_SHEET);
  }
}