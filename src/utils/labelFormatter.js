import { LABEL_SPECS, VALIDATION, S5492_LAYOUT, CANNABIS_BRANDS } from '../constants.js';

/**
 * Label formatting utilities for Uline S-5492 labels (4" × 6" HORIZONTAL)
 * Enhanced with brand detection and massive font sizing
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
    
    return {
      // Product information with brand detection
      productName: this.formatProductNameForS5492(item.productName),
      sku: item.sku || '',
      barcode: item.barcode || item.sku || '',
      brand: item.brand || '',
      
      // Enhanced data with S-5492 considerations
      labelQuantity: parseInt(enhancedData?.labelQuantity || '1'),
      caseQuantity: enhancedData?.caseQuantity || '',
      boxCount: parseInt(enhancedData?.boxCount || '1'),
      harvestDate: this.formatDate(enhancedData?.harvestDate),
      packagedDate: this.formatDate(enhancedData?.packagedDate),
      
      // Display formats - Enhanced for S-5492
      barcodeDisplay: this.formatBarcodeForS5492Display(item.barcode || item.sku || ''),
      
      // Brand separation info
      brandInfo: this.extractBrandFromProductName(item.productName),
      
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
   * Format product name optimized for S-5492 horizontal labels
   * @param {string} productName - Raw product name
   * @returns {string} - Formatted product name
   */
  static formatProductNameForS5492(productName) {
    if (!productName) return 'Product Name';
    
    // Clean and trim
    let formatted = productName.trim();
    formatted = formatted.replace(/\s+/g, ' ');
    
    // For S-5492, we can accommodate very long names due to horizontal layout
    const maxLength = 200; // Much longer for horizontal layout
    if (formatted.length > maxLength) {
      formatted = formatted.substring(0, maxLength - 3) + '...';
    }
    
    return formatted;
  }

  /**
   * Extract brand from product name for separate display
   * @param {string} productName - Full product name
   * @returns {Object} - Brand and remaining product name
   */
  static extractBrandFromProductName(productName) {
    if (!productName) return { brand: '', productName: 'Product Name' };

    const trimmed = productName.trim();
    
    // Check if product name starts with any known brand
    for (const brand of CANNABIS_BRANDS) {
      const regex = new RegExp(`^${brand}\\s+`, 'i');
      if (regex.test(trimmed)) {
        const remaining = trimmed.replace(regex, '').trim();
        return {
          brand: brand,
          productName: remaining || trimmed
        };
      }
    }

    // Check for common patterns like "Brand Name - Product" or "Brand: Product"
    const separatorMatch = trimmed.match(/^([A-Za-z\s&'-]+?)\s*[-–:]\s*(.+)$/);
    if (separatorMatch && separatorMatch[1].length <= 25) {
      const potentialBrand = separatorMatch[1].trim();
      // Only treat as brand if it's reasonably short
      if (potentialBrand.split(/\s+/).length <= 3) {
        return {
          brand: potentialBrand,
          productName: separatorMatch[2].trim()
        };
      }
    }

    // No brand detected
    return {
      brand: '',
      productName: trimmed
    };
  }

  /**
   * Format barcode for S-5492 display (spaces instead of hyphens)
   * @param {string} barcode - Raw barcode
   * @returns {string} - Spaced barcode for display
   */
  static formatBarcodeForS5492Display(barcode) {
    if (!barcode) return '';
    
    // Remove any existing hyphens and spaces
    const clean = barcode.replace(/[^A-Za-z0-9]/g, '');
    
    // For S-5492, use SPACES for better readability
    if (clean.length <= 8) {
      return clean.replace(/(.{2})/g, '$1 ').trim();
    } else {
      return clean.replace(/(.{3})/g, '$1 ').trim();
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
   * Format audit string for S-5492 labels
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
    const user = (username || 'Unknown').substring(0, 15); // Longer for horizontal layout
    
    return `${dateStr} ${timeStr} (${user})`;
  }

  /**
   * Calculate optimal font size for S-5492 product names (MASSIVE sizing)
   * @param {string} text - Product name text
   * @param {number} maxWidth - Maximum width in points
   * @param {number} maxHeight - Maximum height in points
   * @param {number} startingSize - Starting font size
   * @returns {number} - Optimal font size
   */
  static calculateS5492ProductNameFontSize(text, maxWidth = 408, maxHeight = 140, startingSize = 48) {
    if (!text) return startingSize;
    
    const length = text.length;
    const wordCount = text.split(' ').length;
    
    // Start with maximum possible size for visibility from far away
    let fontSize = startingSize;
    
    // Adjust based on character count - but keep as large as possible
    if (length > 100) fontSize = Math.max(24, startingSize - 8);
    else if (length > 80) fontSize = Math.max(28, startingSize - 6);
    else if (length > 60) fontSize = Math.max(32, startingSize - 4);
    else if (length > 40) fontSize = Math.max(36, startingSize - 2);
    
    // Adjust based on word count (affects wrapping) - but still prioritize size
    if (wordCount > 10) fontSize = Math.max(fontSize - 4, 20);
    else if (wordCount > 8) fontSize = Math.max(fontSize - 2, 22);
    
    // Ensure within bounds but prioritize larger sizes
    return Math.max(
      Math.min(fontSize, S5492_LAYOUT.PRODUCT_NAME.MAX_FONT_SIZE),
      S5492_LAYOUT.PRODUCT_NAME.MIN_FONT_SIZE
    );
  }

  /**
   * Calculate optimal font size for brand names
   * @param {string} brandText - Brand text
   * @param {number} maxWidth - Maximum width in points
   * @param {number} maxHeight - Maximum height in points
   * @returns {number} - Optimal font size
   */
  static calculateBrandFontSize(brandText, maxWidth = 408, maxHeight = 50) {
    if (!brandText) return S5492_LAYOUT.BRAND_NAME.MAX_FONT_SIZE;
    
    const length = brandText.length;
    let fontSize = S5492_LAYOUT.BRAND_NAME.MAX_FONT_SIZE; // 48pt
    
    // Brands are usually shorter, so can be very large
    if (length > 20) fontSize = 36;
    else if (length > 15) fontSize = 42;
    
    return Math.max(
      Math.min(fontSize, S5492_LAYOUT.BRAND_NAME.MAX_FONT_SIZE),
      S5492_LAYOUT.BRAND_NAME.MIN_FONT_SIZE
    );
  }

  /**
   * Enhanced text fit estimation for S-5492 horizontal layout
   * @param {string} text - Text to measure
   * @param {number} fontSize - Font size in points
   * @param {number} maxWidth - Maximum width in points
   * @param {number} maxHeight - Maximum height in points
   * @returns {Object} - Fit analysis
   */
  static estimateS5492TextFit(text, fontSize, maxWidth, maxHeight) {
    if (!text) return { fits: true, lineCount: 0 };
    
    // More accurate for horizontal layout
    const charWidth = fontSize * 0.6; // Average character width
    const lineHeight = fontSize * 1.1; // Line spacing
    
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
   * Auto-fit font size for S-5492 horizontal labels (prioritizing maximum size)
   * @param {string} text - Text to fit
   * @param {number} maxWidth - Maximum width in points
   * @param {number} maxHeight - Maximum height in points
   * @param {number} startingSize - Starting font size
   * @returns {number} - Optimal font size
   */
  static autoFitFontSize(text, maxWidth = 408, maxHeight = 140, startingSize = 48) {
    if (!text) return startingSize;
    
    let fontSize = startingSize;
    let attempts = 0;
    const maxAttempts = 20; // More attempts for better optimization
    
    while (attempts < maxAttempts) {
      const fit = this.estimateS5492TextFit(text, fontSize, maxWidth, maxHeight);
      
      if (fit.fits) {
        return fontSize;
      }
      
      // Reduce by smaller increments to find the largest possible size
      fontSize = Math.max(fontSize - 1, S5492_LAYOUT.PRODUCT_NAME.MIN_FONT_SIZE);
      attempts++;
      
      if (fontSize <= S5492_LAYOUT.PRODUCT_NAME.MIN_FONT_SIZE) break;
    }
    
    return fontSize;
  }

  /**
   * Validate label data for S-5492 format
   * @param {Object} item - Inventory item
   * @param {Object} enhancedData - Enhanced data
   * @returns {Object} - Validation result
   */
  static validateS5492LabelData(item, enhancedData) {
    const errors = [];
    const warnings = [];
    
    // Required fields
    if (!item.sku && !item.barcode) {
      errors.push('Either SKU or Barcode is required');
    }
    
    if (!item.productName) {
      warnings.push('Product name is missing');
    } else if (item.productName.length > 200) {
      warnings.push('Product name is very long and may not display optimally');
    }
    
    // Enhanced data validation for S-5492
    if (enhancedData?.labelQuantity) {
      const qty = parseInt(enhancedData.labelQuantity);
      if (isNaN(qty) || qty < 1 || qty > VALIDATION.LABEL_QUANTITY.max) {
        errors.push(`Label quantity must be between 1 and ${VALIDATION.LABEL_QUANTITY.max}`);
      }
      
      // Warning for many labels with large format
      if (qty > 8) {
        warnings.push('Large label quantities may require multiple legal size sheets with S-5492 format');
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
      labelFormat: 'S-5492'
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
   * Format multiple labels for S-5492
   * @param {Array} items - Array of inventory items
   * @param {Object} globalEnhancedData - Global enhanced data settings
   * @param {string} username - Username for audit
   * @returns {Array} - Array of formatted label data
   */
  static formatMultipleS5492Labels(items, globalEnhancedData, username) {
    return items.map(item => this.formatLabelData(item, globalEnhancedData, username));
  }

  /**
   * Get S-5492 label specifications
   * @returns {Object} - Label specifications
   */
  static getLabelSpecs() {
    return {
      ...LABEL_SPECS,
      dimensionsPoints: {
        width: LABEL_SPECS.WIDTH_INCHES * 72, // 432pt (6")
        height: LABEL_SPECS.HEIGHT_INCHES * 72 // 288pt (4")
      },
      printableArea: {
        width: (LABEL_SPECS.WIDTH_INCHES * 72) - 24, // 408pt (margin)
        height: (LABEL_SPECS.HEIGHT_INCHES * 72) - 24 // 264pt (margin)
      },
      layout: S5492_LAYOUT,
      brandDetection: {
        enabled: true,
        brands: CANNABIS_BRANDS,
        method: 'automatic'
      },
      migration: {
        from: 'S-21846',
        improvements: [
          'Horizontal 4×6 orientation',
          'Brand detection and separation',
          'Massive product name fonts (up to 48pt)',
          'Bottom-focused layout',
          'Larger date and case/box information',
          'Legal size sheet compatibility'
        ]
      }
    };
  }

  /**
   * Calculate pages needed for S-5492 labels
   * @param {number} totalLabels - Total number of labels
   * @returns {number} - Number of pages needed
   */
  static calculateS5492PagesNeeded(totalLabels) {
    const specs = this.getLabelSpecs();
    return Math.ceil(totalLabels / specs.LABELS_PER_SHEET);
  }

  /**
   * Get S-5492 layout recommendations
   * @param {Object} labelData - Label data to analyze
   * @returns {Object} - Layout recommendations
   */
  static getS5492LayoutRecommendations(labelData) {
    const brandInfo = this.extractBrandFromProductName(labelData.productName);
    
    const recommendations = {
      brandDetection: {
        detected: !!brandInfo.brand,
        brand: brandInfo.brand,
        productName: brandInfo.productName
      },
      productName: {
        estimatedFontSize: this.calculateS5492ProductNameFontSize(brandInfo.productName),
        brandFontSize: brandInfo.brand ? this.calculateBrandFontSize(brandInfo.brand) : null,
        willWrap: false,
        recommendations: []
      },
      barcodeDisplay: {
        format: 'spaced',
        example: this.formatBarcodeForS5492Display(labelData.barcode)
      },
      layout: {
        orientation: 'horizontal',
        format: 'S-5492',
        sizeInches: `${LABEL_SPECS.WIDTH_INCHES}" × ${LABEL_SPECS.HEIGHT_INCHES}"`,
        labelsPerSheet: LABEL_SPECS.LABELS_PER_SHEET,
        sheetSize: 'Legal (8.5" × 14")'
      }
    };

    // Analyze text length and provide recommendations
    const totalText = brandInfo.brand + ' ' + brandInfo.productName;
    if (totalText.length > 80) {
      recommendations.productName.recommendations.push('Very long product name - will use multiple lines');
    }
    if (totalText.length > 120) {
      recommendations.productName.willWrap = true;
      recommendations.productName.recommendations.push('Product name may wrap to 3-4 lines');
    }
    
    if (!brandInfo.brand) {
      recommendations.productName.recommendations.push('No brand detected - full product name will use maximum font size');
    } else {
      recommendations.productName.recommendations.push(`Brand "${brandInfo.brand}" detected - will display separately`);
    }

    return recommendations;
  }

  /**
   * Compare different label formats
   * @param {number} labelQuantity - Number of labels needed
   * @returns {Object} - Comparison data
   */
  static compareFormats(labelQuantity) {
    const s5627Pages = Math.ceil(labelQuantity / 12); // Original format
    const s21846Pages = Math.ceil(labelQuantity / 2);  // Previous format
    const s5492Pages = Math.ceil(labelQuantity / 4);   // Current format
    
    return {
      labelQuantity,
      formats: {
        s5627: {
          format: 'S-5627 (4" × 1.5")',
          labelsPerSheet: 12,
          pagesNeeded: s5627Pages,
          status: 'Deprecated'
        },
        s21846: {
          format: 'S-21846 (7-3/4" × 4-3/4")',
          labelsPerSheet: 2,
          pagesNeeded: s21846Pages,
          status: 'Deprecated'
        },
        s5492: {
          format: 'S-5492 (6" × 4" Horizontal)',
          labelsPerSheet: 4,
          pagesNeeded: s5492Pages,
          status: 'Current',
          features: ['Brand separation', 'Massive fonts', 'Bottom layout']
        }
      }
    };
  }

  /**
   * Main validation method (used by PDFGenerator)
   * @param {Object} item - Inventory item
   * @param {Object} enhancedData - Enhanced data
   * @returns {Object} - Validation result
   */
  static validateLabelData(item, enhancedData) {
    return this.validateS5492LabelData(item, enhancedData);
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