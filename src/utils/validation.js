import { VALIDATION, DATE_FORMATS } from '../constants.js';

/**
 * Validation helper utilities for label generation
 */
export class ValidationHelper {
  /**
   * Validate label quantity
   * @param {string|number} value - Label quantity value
   * @returns {Object} - Validation result
   */
  static validateLabelQuantity(value) {
    const result = { isValid: false, error: '', cleanValue: null };
    
    if (!value && value !== 0) {
      result.error = 'Label quantity is required';
      return result;
    }

    const numValue = parseInt(value);
    
    if (isNaN(numValue)) {
      result.error = 'Label quantity must be a number';
      return result;
    }

    if (numValue < VALIDATION.LABEL_QUANTITY.min) {
      result.error = `Label quantity must be at least ${VALIDATION.LABEL_QUANTITY.min}`;
      return result;
    }

    if (numValue > VALIDATION.LABEL_QUANTITY.max) {
      result.error = `Label quantity cannot exceed ${VALIDATION.LABEL_QUANTITY.max}`;
      return result;
    }

    result.isValid = true;
    result.cleanValue = numValue;
    return result;
  }

  /**
   * Validate case quantity
   * @param {string|number} value - Case quantity value
   * @returns {Object} - Validation result
   */
  static validateCaseQuantity(value) {
    const result = { isValid: true, error: '', cleanValue: null };
    
    // Case quantity is optional
    if (!value) {
      return result;
    }

    const numValue = parseInt(value);
    
    if (isNaN(numValue)) {
      result.isValid = false;
      result.error = 'Case quantity must be a number';
      return result;
    }

    if (numValue < VALIDATION.CASE_QUANTITY.min) {
      result.isValid = false;
      result.error = `Case quantity must be at least ${VALIDATION.CASE_QUANTITY.min}`;
      return result;
    }

    if (numValue > VALIDATION.CASE_QUANTITY.max) {
      result.isValid = false;
      result.error = `Case quantity cannot exceed ${VALIDATION.CASE_QUANTITY.max}`;
      return result;
    }

    result.cleanValue = numValue;
    return result;
  }

  /**
   * Validate box count
   * @param {string|number} value - Box count value
   * @returns {Object} - Validation result
   */
  static validateBoxCount(value) {
    const result = { isValid: true, error: '', cleanValue: null };
    
    // Box count is optional (defaults to 1)
    if (!value) {
      result.cleanValue = 1;
      return result;
    }

    const numValue = parseInt(value);
    
    if (isNaN(numValue)) {
      result.isValid = false;
      result.error = 'Box count must be a number';
      return result;
    }

    if (numValue < VALIDATION.BOX_COUNT.min) {
      result.isValid = false;
      result.error = `Box count must be at least ${VALIDATION.BOX_COUNT.min}`;
      return result;
    }

    if (numValue > VALIDATION.BOX_COUNT.max) {
      result.isValid = false;
      result.error = `Box count cannot exceed ${VALIDATION.BOX_COUNT.max}`;
      return result;
    }

    result.cleanValue = numValue;
    return result;
  }

  /**
   * Validate date format
   * @param {string} value - Date value
   * @returns {Object} - Validation result
   */
  static validateDate(value) {
    const result = { isValid: true, error: '', cleanValue: null };
    
    // Date is optional
    if (!value) {
      return result;
    }

    const trimmedValue = value.trim();
    
    if (!trimmedValue) {
      return result;
    }

    // Check against supported date formats
    const isValidFormat = VALIDATION.DATE_FORMATS.some(pattern => 
      pattern.test(trimmedValue)
    );

    if (!isValidFormat) {
      result.isValid = false;
      result.error = 'Date must be in MM/DD/YYYY, DD/MM/YYYY, MM/DD/YY, or DD/MM/YY format';
      return result;
    }

    // Additional validation for reasonable date values
    const parts = trimmedValue.split(/[\/\-]/);
    if (parts.length >= 2) {
      const month = parseInt(parts[0]);
      const day = parseInt(parts[1]);
      
      if (month > 12 || month < 1) {
        result.isValid = false;
        result.error = 'Month must be between 1 and 12';
        return result;
      }
      
      if (day > 31 || day < 1) {
        result.isValid = false;
        result.error = 'Day must be between 1 and 31';
        return result;
      }
    }

    result.cleanValue = trimmedValue;
    return result;
  }

  /**
   * Validate all enhanced data
   * @param {Object} enhancedData - Enhanced data object
   * @returns {Object} - Validation result
   */
  static validateEnhancedData(enhancedData) {
    const errors = [];
    const warnings = [];
    
    if (!enhancedData) {
      errors.push('Enhanced data is required');
      return { isValid: false, errors, warnings };
    }

    // Validate label quantity (required)
    const labelQtyValidation = this.validateLabelQuantity(enhancedData.labelQuantity);
    if (!labelQtyValidation.isValid) {
      errors.push(labelQtyValidation.error);
    }

    // Validate case quantity (optional)
    if (enhancedData.caseQuantity) {
      const caseQtyValidation = this.validateCaseQuantity(enhancedData.caseQuantity);
      if (!caseQtyValidation.isValid) {
        errors.push(caseQtyValidation.error);
      }
    }

    // Validate box count (optional)
    if (enhancedData.boxCount) {
      const boxCountValidation = this.validateBoxCount(enhancedData.boxCount);
      if (!boxCountValidation.isValid) {
        errors.push(boxCountValidation.error);
      }
    }

    // Validate harvest date (optional)
    if (enhancedData.harvestDate) {
      const harvestDateValidation = this.validateDate(enhancedData.harvestDate);
      if (!harvestDateValidation.isValid) {
        errors.push(`Harvest date: ${harvestDateValidation.error}`);
      }
    }

    // Validate packaged date (optional)
    if (enhancedData.packagedDate) {
      const packagedDateValidation = this.validateDate(enhancedData.packagedDate);
      if (!packagedDateValidation.isValid) {
        errors.push(`Packaged date: ${packagedDateValidation.error}`);
      }
    }

    // Business logic validations
    if (enhancedData.harvestDate && enhancedData.packagedDate) {
      const harvestDate = this.parseDate(enhancedData.harvestDate);
      const packagedDate = this.parseDate(enhancedData.packagedDate);
      
      if (harvestDate && packagedDate && harvestDate > packagedDate) {
        warnings.push('Harvest date appears to be after packaged date');
      }
    }

    // Check for future dates
    const today = new Date();
    if (enhancedData.harvestDate) {
      const harvestDate = this.parseDate(enhancedData.harvestDate);
      if (harvestDate && harvestDate > today) {
        warnings.push('Harvest date is in the future');
      }
    }

    if (enhancedData.packagedDate) {
      const packagedDate = this.parseDate(enhancedData.packagedDate);
      if (packagedDate && packagedDate > today) {
        warnings.push('Packaged date is in the future');
      }
    }

    // Check for reasonable label quantity vs box count
    if (enhancedData.labelQuantity && enhancedData.boxCount) {
      const labelQty = parseInt(enhancedData.labelQuantity);
      const boxCount = parseInt(enhancedData.boxCount);
      
      if (labelQty < boxCount) {
        warnings.push('Label quantity is less than box count - each box should have at least one label');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Parse date string into Date object
   * @param {string} dateStr - Date string
   * @returns {Date|null} - Parsed date or null if invalid
   */
  static parseDate(dateStr) {
    if (!dateStr) return null;
    
    const trimmed = dateStr.trim();
    const parts = trimmed.split(/[\/\-]/);
    
    if (parts.length < 2) return null;
    
    let month = parseInt(parts[0]);
    let day = parseInt(parts[1]);
    let year = parts[2] ? parseInt(parts[2]) : new Date().getFullYear();
    
    // Handle 2-digit years
    if (year < 100) {
      // Assume 20xx for years 00-30, 19xx for years 31-99
      year += (year <= 30) ? 2000 : 1900;
    }
    
    // Create date (month is 0-based in JavaScript Date)
    const date = new Date(year, month - 1, day);
    
    // Verify the date is valid
    if (date.getFullYear() !== year || 
        date.getMonth() !== (month - 1) || 
        date.getDate() !== day) {
      return null;
    }
    
    return date;
  }

  /**
   * Validate SKU format
   * @param {string} sku - SKU value
   * @returns {Object} - Validation result
   */
  static validateSKU(sku) {
    const result = { isValid: false, error: '', cleanValue: null };
    
    if (!sku) {
      result.error = 'SKU is required';
      return result;
    }

    const trimmed = sku.trim();
    
    if (!trimmed) {
      result.error = 'SKU cannot be empty';
      return result;
    }

    if (trimmed.length > 50) {
      result.error = 'SKU cannot exceed 50 characters';
      return result;
    }

    // Check for valid characters (alphanumeric, hyphens, underscores)
    if (!/^[A-Za-z0-9\-_]+$/.test(trimmed)) {
      result.error = 'SKU can only contain letters, numbers, hyphens, and underscores';
      return result;
    }

    result.isValid = true;
    result.cleanValue = trimmed.toUpperCase();
    return result;
  }

  /**
   * Validate barcode format
   * @param {string} barcode - Barcode value
   * @returns {Object} - Validation result
   */
  static validateBarcode(barcode) {
    const result = { isValid: false, error: '', cleanValue: null };
    
    if (!barcode) {
      result.error = 'Barcode is required';
      return result;
    }

    const trimmed = barcode.trim();
    
    if (!trimmed) {
      result.error = 'Barcode cannot be empty';
      return result;
    }

    // Code 39 supports: 0-9, A-Z, space, and special characters: - . $ / + % *
    if (!/^[0-9A-Z\-\.\$\/\+\%\s]*$/i.test(trimmed)) {
      result.error = 'Barcode contains invalid characters for Code 39 format';
      return result;
    }

    if (trimmed.length > 43) {
      result.error = 'Barcode too long for Code 39 format (maximum 43 characters)';
      return result;
    }

    result.isValid = true;
    result.cleanValue = trimmed.toUpperCase();
    return result;
  }

  /**
   * Validate product name
   * @param {string} productName - Product name
   * @returns {Object} - Validation result
   */
  static validateProductName(productName) {
    const result = { isValid: true, error: '', cleanValue: null };
    
    if (!productName) {
      result.isValid = false;
      result.error = 'Product name is required';
      return result;
    }

    const trimmed = productName.trim();
    
    if (!trimmed) {
      result.isValid = false;
      result.error = 'Product name cannot be empty';
      return result;
    }

    if (trimmed.length > 200) {
      result.isValid = false;
      result.error = 'Product name cannot exceed 200 characters';
      return result;
    }

    result.cleanValue = trimmed;
    return result;
  }

  /**
   * Validate complete item data for labeling
   * @param {Object} item - Item data
   * @param {Object} enhancedData - Enhanced data
   * @returns {Object} - Validation result
   */
  static validateItemForLabeling(item, enhancedData) {
    const errors = [];
    const warnings = [];

    // Validate basic item data
    if (!item.sku && !item.barcode) {
      errors.push('Either SKU or Barcode is required');
    }

    const skuValidation = this.validateSKU(item.sku);
    if (item.sku && !skuValidation.isValid) {
      errors.push(`SKU: ${skuValidation.error}`);
    }

    const barcodeValidation = this.validateBarcode(item.barcode);
    if (item.barcode && !barcodeValidation.isValid) {
      errors.push(`Barcode: ${barcodeValidation.error}`);
    }

    const productNameValidation = this.validateProductName(item.productName);
    if (!productNameValidation.isValid) {
      errors.push(`Product name: ${productNameValidation.error}`);
    }

    // Validate enhanced data
    const enhancedValidation = this.validateEnhancedData(enhancedData);
    if (!enhancedValidation.isValid) {
      errors.push(...enhancedValidation.errors);
    }
    warnings.push(...enhancedValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Clean and format input value
   * @param {any} value - Input value
   * @param {string} type - Value type (number, text, date)
   * @returns {string} - Cleaned value
   */
  static cleanValue(value, type = 'text') {
    if (value === null || value === undefined) return '';
    
    let cleaned = String(value).trim();
    
    switch (type) {
      case 'number':
        // Remove non-numeric characters except decimal point
        cleaned = cleaned.replace(/[^\d.]/g, '');
        break;
        
      case 'date':
        // Remove extra spaces and normalize separators
        cleaned = cleaned.replace(/\s+/g, ' ').replace(/[^\d\/\-\s]/g, '');
        break;
        
      case 'text':
      default:
        // Remove extra whitespace
        cleaned = cleaned.replace(/\s+/g, ' ');
        break;
    }
    
    return cleaned;
  }

  /**
   * Get validation error summary
   * @param {Array} errors - Array of error messages
   * @param {Array} warnings - Array of warning messages
   * @returns {string} - Summary message
   */
  static getValidationSummary(errors, warnings) {
    const parts = [];
    
    if (errors.length > 0) {
      parts.push(`${errors.length} error${errors.length > 1 ? 's' : ''}`);
    }
    
    if (warnings.length > 0) {
      parts.push(`${warnings.length} warning${warnings.length > 1 ? 's' : ''}`);
    }
    
    if (parts.length === 0) {
      return 'All validations passed';
    }
    
    return `Found ${parts.join(' and ')}`;
  }
}