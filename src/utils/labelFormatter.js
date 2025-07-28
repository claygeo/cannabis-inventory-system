import { LABEL_SPECS } from '../constants.js';
import { ValidationHelper } from './validation.js';

/**
 * Label formatting utilities for Cannabis Inventory Management System
 * Handles text formatting, layout, and display for Uline S-5627 labels
 */

export class LabelFormatter {
  /**
   * Format product name for label display
   * @param {string} productName - Original product name
   * @param {number} maxLength - Maximum character length
   * @returns {string} - Formatted product name
   */
  static formatProductName(productName, maxLength = 35) {
    if (!productName) return '';
    
    let formatted = String(productName).trim();
    
    // Remove excessive whitespace
    formatted = formatted.replace(/\s+/g, ' ');
    
    // Truncate if too long, but try to break at words
    if (formatted.length > maxLength) {
      const truncated = formatted.substring(0, maxLength - 3);
      const lastSpace = truncated.lastIndexOf(' ');
      
      if (lastSpace > maxLength * 0.6) {
        // Break at word boundary if reasonable
        formatted = truncated.substring(0, lastSpace) + '...';
      } else {
        // Hard truncate
        formatted = truncated + '...';
      }
    }
    
    return formatted;
  }

  /**
   * Format brand name for label display
   * @param {string} brand - Original brand name
   * @param {number} maxLength - Maximum character length
   * @returns {string} - Formatted brand name
   */
  static formatBrand(brand, maxLength = 20) {
    if (!brand) return '';
    
    let formatted = String(brand).trim();
    
    // Common brand abbreviations
    const abbreviations = {
      'INCORPORATED': 'INC',
      'CORPORATION': 'CORP',
      'COMPANY': 'CO',
      'LIMITED': 'LTD',
      'CANNABIS': 'CANN',
      'CULTIVATION': 'CULT'
    };
    
    // Apply abbreviations
    Object.entries(abbreviations).forEach(([full, abbrev]) => {
      const regex = new RegExp(`\\b${full}\\b`, 'gi');
      formatted = formatted.replace(regex, abbrev);
    });
    
    // Truncate if still too long
    if (formatted.length > maxLength) {
      formatted = formatted.substring(0, maxLength - 3) + '...';
    }
    
    return formatted;
  }

  /**
   * Format strain name for label display
   * @param {string} strain - Original strain name
   * @param {number} maxLength - Maximum character length
   * @returns {string} - Formatted strain name
   */
  static formatStrain(strain, maxLength = 18) {
    if (!strain) return '';
    
    let formatted = String(strain).trim();
    
    // Remove common prefixes/suffixes that take up space
    const cleanupPatterns = [
      /^strain\s*/i,
      /\s*strain$/i,
      /^cannabis\s*/i,
      /\s*cannabis$/i
    ];
    
    cleanupPatterns.forEach(pattern => {
      formatted = formatted.replace(pattern, '');
    });
    
    // Truncate if too long
    if (formatted.length > maxLength) {
      formatted = formatted.substring(0, maxLength - 3) + '...';
    }
    
    return formatted;
  }

  /**
   * Format size/weight information for label display
   * @param {string} size - Original size string
   * @param {number} maxLength - Maximum character length
   * @returns {string} - Formatted size
   */
  static formatSize(size, maxLength = 15) {
    if (!size) return '';
    
    let formatted = String(size).trim();
    
    // Standardize common units
    const unitReplacements = {
      'GRAM': 'g',
      'GRAMS': 'g',
      'OUNCE': 'oz',
      'OUNCES': 'oz',
      'POUND': 'lb',
      'POUNDS': 'lb',
      'MILLIGRAM': 'mg',
      'MILLIGRAMS': 'mg',
      'KILOGRAM': 'kg',
      'KILOGRAMS': 'kg'
    };
    
    // Apply unit replacements
    Object.entries(unitReplacements).forEach(([full, abbrev]) => {
      const regex = new RegExp(`\\b${full}\\b`, 'gi');
      formatted = formatted.replace(regex, abbrev);
    });
    
    // Remove excessive spaces
    formatted = formatted.replace(/\s+/g, ' ');
    
    // Truncate if too long
    if (formatted.length > maxLength) {
      formatted = formatted.substring(0, maxLength);
    }
    
    return formatted;
  }

  /**
   * Format SKU for display
   * @param {string} sku - Original SKU
   * @param {boolean} addHyphens - Whether to add hyphens for readability
   * @returns {string} - Formatted SKU
   */
  static formatSKU(sku, addHyphens = false) {
    if (!sku) return '';
    
    let formatted = String(sku).trim().toUpperCase();
    
    if (addHyphens && formatted.length > 6) {
      // Add hyphens every 4 characters for readability
      formatted = formatted.replace(/(.{4})/g, '$1-').replace(/-$/, '');
    }
    
    return formatted;
  }

  /**
   * Format barcode for display
   * @param {string} barcode - Original barcode
   * @param {boolean} addHyphens - Whether to add hyphens for readability
   * @returns {string} - Formatted barcode
   */
  static formatBarcode(barcode, addHyphens = true) {
    if (!barcode) return '';
    
    let formatted = String(barcode).trim().toUpperCase();
    
    if (addHyphens && formatted.length > 4) {
      // Add hyphens every 4 characters for readability
      formatted = formatted.replace(/(.{4})/g, '$1-').replace(/-$/, '');
    }
    
    return formatted;
  }

  /**
   * Format date for label display
   * @param {string} dateStr - Date string in various formats
   * @param {string} format - Output format ('short', 'medium', 'long')
   * @returns {string} - Formatted date
   */
  static formatDate(dateStr, format = 'short') {
    if (!dateStr) return '';
    
    try {
      const validation = ValidationHelper.validateDate(dateStr);
      if (!validation.isValid) {
        return dateStr; // Return original if invalid
      }
      
      const { day, month, year } = validation.value;
      
      switch (format) {
        case 'short':
          return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
        case 'medium':
          return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
        case 'long':
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                             'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return `${day} ${monthNames[month - 1]} ${year}`;
        default:
          return validation.formattedDate;
      }
    } catch (error) {
      console.warn('Date formatting error:', error);
      return dateStr;
    }
  }

  /**
   * Format quantity for display
   * @param {any} quantity - Quantity value
   * @param {string} unit - Unit suffix (optional)
   * @returns {string} - Formatted quantity
   */
  static formatQuantity(quantity, unit = '') {
    if (quantity === null || quantity === undefined || quantity === '') {
      return '';
    }
    
    const numValue = parseFloat(quantity);
    if (isNaN(numValue)) {
      return String(quantity);
    }
    
    // Format number with appropriate decimal places
    let formatted;
    if (numValue % 1 === 0) {
      // Whole number
      formatted = numValue.toString();
    } else if (numValue < 10) {
      // Small number, show 2 decimal places
      formatted = numValue.toFixed(2).replace(/\.?0+$/, '');
    } else {
      // Larger number, show 1 decimal place
      formatted = numValue.toFixed(1).replace(/\.?0+$/, '');
    }
    
    return unit ? `${formatted} ${unit}` : formatted;
  }

  /**
   * Format location for label display
   * @param {string} location - Original location
   * @param {number} maxLength - Maximum character length
   * @returns {string} - Formatted location
   */
  static formatLocation(location, maxLength = 15) {
    if (!location) return '';
    
    let formatted = String(location).trim();
    
    // Common location abbreviations
    const abbreviations = {
      'WAREHOUSE': 'WH',
      'SECTION': 'SEC',
      'AISLE': 'A',
      'SHELF': 'SH',
      'BIN': 'B',
      'LEVEL': 'L'
    };
    
    // Apply abbreviations
    Object.entries(abbreviations).forEach(([full, abbrev]) => {
      const regex = new RegExp(`\\b${full}\\b`, 'gi');
      formatted = formatted.replace(regex, abbrev);
    });
    
    // Truncate if too long
    if (formatted.length > maxLength) {
      formatted = formatted.substring(0, maxLength);
    }
    
    return formatted;
  }

  /**
   * Generate label text content for a specific label
   * @param {Object} item - Item data
   * @param {Object} enhancedData - Enhanced label data
   * @param {number} labelNumber - Label number (for multi-label items)
   * @returns {Object} - Formatted label content
   */
  static generateLabelContent(item, enhancedData = {}, labelNumber = 1) {
    const content = {
      // Header information
      sku: this.formatSKU(item.sku),
      source: item.displaySource || '[MAIN]',
      
      // Main content
      productName: this.formatProductName(item.productName),
      brand: this.formatBrand(item.brand),
      strain: this.formatStrain(item.strain),
      size: this.formatSize(item.size),
      
      // Barcode
      barcode: this.formatBarcode(item.barcode, false), // No hyphens for actual barcode
      barcodeDisplay: this.formatBarcode(item.barcode, true), // With hyphens for display
      
      // Dates
      harvestDate: this.formatDate(enhancedData.harvestDate, 'short'),
      packagedDate: this.formatDate(enhancedData.packagedDate, 'short'),
      
      // Quantities
      labelQuantity: this.formatQuantity(enhancedData.labelQuantity),
      caseQuantity: this.formatQuantity(enhancedData.caseQuantity),
      boxCount: this.formatQuantity(enhancedData.boxCount),
      
      // Location
      location: this.formatLocation(item.location || item.shipToLocation),
      
      // Label metadata
      labelNumber,
      totalLabels: enhancedData.labelQuantity || 1,
      labelId: `${item.sku}_${labelNumber}`
    };
    
    return content;
  }

  /**
   * Calculate text dimensions for label layout
   * @param {string} text - Text to measure
   * @param {number} fontSize - Font size in points
   * @param {string} fontFamily - Font family
   * @returns {Object} - Text dimensions
   */
  static calculateTextDimensions(text, fontSize = 8, fontFamily = 'Arial') {
    // Create a temporary canvas for text measurement
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = `${fontSize}pt ${fontFamily}`;
    
    const metrics = context.measureText(text);
    
    return {
      width: metrics.width,
      height: fontSize * 1.2, // Approximate height based on font size
      fontSize,
      fontFamily
    };
  }

  /**
   * Optimize text for label space constraints
   * @param {string} text - Original text
   * @param {number} maxWidth - Maximum width in pixels
   * @param {number} fontSize - Font size in points
   * @param {string} fontFamily - Font family
   * @returns {Object} - Optimized text and dimensions
   */
  static optimizeTextForSpace(text, maxWidth, fontSize = 8, fontFamily = 'Arial') {
    let optimizedText = text;
    let dimensions = this.calculateTextDimensions(optimizedText, fontSize, fontFamily);
    
    // If text fits, return as-is
    if (dimensions.width <= maxWidth) {
      return {
        text: optimizedText,
        dimensions,
        truncated: false
      };
    }
    
    // Try reducing font size first
    let adjustedFontSize = fontSize;
    while (adjustedFontSize > 6 && dimensions.width > maxWidth) {
      adjustedFontSize -= 0.5;
      dimensions = this.calculateTextDimensions(optimizedText, adjustedFontSize, fontFamily);
    }
    
    // If still doesn't fit, truncate text
    if (dimensions.width > maxWidth) {
      while (optimizedText.length > 0 && dimensions.width > maxWidth) {
        optimizedText = optimizedText.slice(0, -4) + '...';
        dimensions = this.calculateTextDimensions(optimizedText, adjustedFontSize, fontFamily);
      }
    }
    
    return {
      text: optimizedText,
      dimensions: {
        ...dimensions,
        fontSize: adjustedFontSize
      },
      truncated: optimizedText !== text,
      fontSizeReduced: adjustedFontSize < fontSize
    };
  }

  /**
   * Generate CSS styles for label elements
   * @param {string} element - Element type ('header', 'body', 'footer', etc.)
   * @param {Object} options - Style options
   * @returns {Object} - CSS style object
   */
  static generateLabelStyles(element, options = {}) {
    const baseStyles = {
      fontFamily: 'Arial, sans-serif',
      color: '#000',
      margin: '0',
      padding: '0'
    };
    
    switch (element) {
      case 'sku':
        return {
          ...baseStyles,
          fontSize: '9pt',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          ...options
        };
        
      case 'productName':
        return {
          ...baseStyles,
          fontSize: '7pt',
          fontWeight: 'bold',
          lineHeight: '1.1',
          wordBreak: 'break-word',
          hyphens: 'auto',
          ...options
        };
        
      case 'brand':
        return {
          ...baseStyles,
          fontSize: '6pt',
          color: '#333',
          textTransform: 'uppercase',
          ...options
        };
        
      case 'details':
        return {
          ...baseStyles,
          fontSize: '6pt',
          color: '#666',
          ...options
        };
        
      case 'barcode':
        return {
          ...baseStyles,
          fontSize: '5pt',
          fontFamily: 'monospace',
          textAlign: 'center',
          ...options
        };
        
      case 'dates':
        return {
          ...baseStyles,
          fontSize: '5pt',
          color: '#666',
          ...options
        };
        
      case 'source':
        return {
          ...baseStyles,
          fontSize: '6pt',
          fontWeight: 'bold',
          color: 'white',
          backgroundColor: '#000',
          padding: '1px 4px',
          borderRadius: '2px',
          ...options
        };
        
      default:
        return {
          ...baseStyles,
          ...options
        };
    }
  }

  /**
   * Validate label content for printing requirements
   * @param {Object} labelContent - Label content to validate
   * @returns {Object} - Validation result
   */
  static validateLabelContent(labelContent) {
    const errors = [];
    const warnings = [];
    
    // Check required fields
    if (!labelContent.sku) {
      errors.push('SKU is required');
    }
    
    if (!labelContent.barcode) {
      errors.push('Barcode is required');
    }
    
    if (!labelContent.productName) {
      warnings.push('Product name is missing');
    }
    
    // Check field lengths
    if (labelContent.sku && labelContent.sku.length > 20) {
      warnings.push('SKU may be too long for label');
    }
    
    if (labelContent.productName && labelContent.productName.length > 50) {
      warnings.push('Product name may be too long for label');
    }
    
    // Check special characters that might cause printing issues
    const problematicChars = /[^\x00-\x7F]/g; // Non-ASCII characters
    Object.entries(labelContent).forEach(([field, value]) => {
      if (value && typeof value === 'string' && problematicChars.test(value)) {
        warnings.push(`${field} contains special characters that may not print correctly`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate print-ready label HTML
   * @param {Object} labelContent - Formatted label content
   * @param {string} barcodeSVG - Barcode SVG string
   * @returns {string} - HTML string for printing
   */
  static generatePrintHTML(labelContent, barcodeSVG) {
    return `
      <div class="label" style="
        width: 4in;
        height: 1.5in;
        border: 1px solid #000;
        padding: 0.1in;
        box-sizing: border-box;
        font-family: Arial, sans-serif;
        font-size: 8pt;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        page-break-inside: avoid;
        background: white;
      ">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; height: 0.25in;">
          <div style="font-weight: bold; font-size: 9pt; max-width: 2in; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${labelContent.sku}
          </div>
          <div style="font-size: 6pt; background: #000; color: white; padding: 1px 4px; border-radius: 2px; font-weight: bold;">
            ${labelContent.source}
          </div>
        </div>

        <!-- Body -->
        <div style="flex: 1; display: flex; align-items: center; justify-content: space-between; gap: 0.1in;">
          <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-weight: bold; font-size: 7pt; line-height: 1; max-height: 0.3in; overflow: hidden; word-wrap: break-word;">
              ${labelContent.productName}
            </div>
            <div style="font-size: 6pt; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${labelContent.brand}
            </div>
            <div style="font-size: 6pt; color: #666; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${labelContent.size}
            </div>
            <div style="font-size: 6pt; color: #555; font-style: italic; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${labelContent.strain}
            </div>
          </div>

          <div style="width: 1.3in; height: 0.8in; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <div style="max-width: 1.3in; max-height: 0.6in;">
              ${barcodeSVG}
            </div>
            <div style="font-size: 5pt; color: #000; font-family: monospace; text-align: center; margin-top: 0.02in; max-width: 1.3in; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${labelContent.barcodeDisplay}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; font-size: 5pt; color: #666; height: 0.15in; border-top: 1px solid #eee; padding-top: 0.02in;">
          <div>
            ${labelContent.harvestDate ? `H: ${labelContent.harvestDate}` : ''}
            ${labelContent.harvestDate && labelContent.packagedDate ? '<br>' : ''}
            ${labelContent.packagedDate ? `P: ${labelContent.packagedDate}` : ''}
          </div>
          <div style="text-align: right;">
            ${labelContent.caseQuantity ? `Units: ${labelContent.caseQuantity}` : ''}
            ${labelContent.caseQuantity && labelContent.boxCount ? '<br>' : ''}
            ${labelContent.boxCount ? `Boxes: ${labelContent.boxCount}` : ''}
          </div>
        </div>
      </div>
    `;
  }
}