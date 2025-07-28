import { VALIDATION } from '../constants.js';

/**
 * Validation utilities for Cannabis Inventory Management System
 */

export class ValidationHelper {
  /**
   * Validate label quantity
   * @param {any} value - Value to validate
   * @returns {Object} - Validation result
   */
  static validateLabelQuantity(value) {
    const result = { isValid: false, error: '', value: null };
    
    if (value === '' || value === null || value === undefined) {
      result.error = 'Label quantity is required';
      return result;
    }

    const numValue = parseInt(value, 10);
    
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
    result.value = numValue;
    return result;
  }

  /**
   * Validate case quantity
   * @param {any} value - Value to validate
   * @returns {Object} - Validation result
   */
  static validateCaseQuantity(value) {
    const result = { isValid: true, error: '', value: null };
    
    // Case quantity is optional
    if (value === '' || value === null || value === undefined) {
      return result;
    }

    const numValue = parseInt(value, 10);
    
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

    result.value = numValue;
    return result;
  }

  /**
   * Validate box count
   * @param {any} value - Value to validate
   * @returns {Object} - Validation result
   */
  static validateBoxCount(value) {
    const result = { isValid: true, error: '', value: null };
    
    // Box count is optional
    if (value === '' || value === null || value === undefined) {
      return result;
    }

    const numValue = parseInt(value, 10);
    
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

    result.value = numValue;
    return result;
  }

  /**
   * Validate date format (accepts multiple formats)
   * @param {string} dateStr - Date string to validate
   * @returns {Object} - Validation result
   */
  static validateDate(dateStr) {
    const result = { isValid: true, error: '', value: null, formattedDate: '' };
    
    // Empty dates are allowed
    if (!dateStr || dateStr.trim() === '') {
      return result;
    }

    const trimmedDate = dateStr.trim();
    
    // Check against supported formats
    const matchedFormat = VALIDATION.DATE_FORMATS.find(format => 
      format.test(trimmedDate)
    );

    if (!matchedFormat) {
      result.isValid = false;
      result.error = 'Date must be in format DD/MM/YYYY, MM/DD/YYYY, DD/MM/YY, or use hyphens instead of slashes';
      return result;
    }

    // Replace hyphens with slashes for consistent parsing
    const normalizedDate = trimmedDate.replace(/-/g, '/');
    const dateParts = normalizedDate.split('/');
    
    if (dateParts.length !== 3) {
      result.isValid = false;
      result.error = 'Invalid date format';
      return result;
    }

    let [part1, part2, part3] = dateParts.map(part => parseInt(part, 10));
    
    // Handle 2-digit years
    if (part3 < 100) {
      if (part3 <= 50) {
        part3 += 2000; // 00-50 becomes 2000-2050
      } else {
        part3 += 1900; // 51-99 becomes 1951-1999
      }
    }

    // Try to determine if it's DD/MM/YYYY or MM/DD/YYYY
    let day, month, year;
    
    // If first part > 12, it must be DD/MM/YYYY
    if (part1 > 12) {
      day = part1;
      month = part2;
      year = part3;
    }
    // If second part > 12, it must be MM/DD/YYYY
    else if (part2 > 12) {
      month = part1;
      day = part2;
      year = part3;
    }
    // Both could be valid, assume DD/MM/YYYY (more common internationally)
    else {
      day = part1;
      month = part2;
      year = part3;
    }

    // Validate ranges
    if (month < 1 || month > 12) {
      result.isValid = false;
      result.error = 'Invalid month';
      return result;
    }

    if (day < 1 || day > 31) {
      result.isValid = false;
      result.error = 'Invalid day';
      return result;
    }

    if (year < 1900 || year > 2100) {
      result.isValid = false;
      result.error = 'Year must be between 1900 and 2100';
      return result;
    }

    // Validate day for specific month
    const daysInMonth = this.getDaysInMonth(month, year);
    if (day > daysInMonth) {
      result.isValid = false;
      result.error = `Invalid day for ${this.getMonthName(month)}`;
      return result;
    }

    // Create formatted date for display
    result.formattedDate = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    result.value = { day, month, year };
    
    return result;
  }

  /**
   * Get number of days in a month
   * @param {number} month - Month (1-12)
   * @param {number} year - Year
   * @returns {number} - Number of days in month
   */
  static getDaysInMonth(month, year) {
    switch (month) {
      case 1: case 3: case 5: case 7: case 8: case 10: case 12:
        return 31;
      case 4: case 6: case 9: case 11:
        return 30;
      case 2:
        return this.isLeapYear(year) ? 29 : 28;
      default:
        return 30;
    }
  }

  /**
   * Check if year is a leap year
   * @param {number} year - Year to check
   * @returns {boolean} - True if leap year
   */
  static isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  /**
   * Get month name
   * @param {number} month - Month number (1-12)
   * @returns {string} - Month name
   */
  static getMonthName(month) {
    const months = [
      '', 'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month] || 'Unknown';
  }

  /**
   * Validate barcode format
   * @param {string} barcode - Barcode to validate
   * @returns {Object} - Validation result
   */
  static validateBarcode(barcode) {
    const result = { isValid: false, error: '', value: null };
    
    if (!barcode || barcode.trim() === '') {
      result.error = 'Barcode is required';
      return result;
    }

    const trimmedBarcode = barcode.trim();
    
    // Basic barcode validation - must be alphanumeric
    if (!/^[A-Za-z0-9]+$/.test(trimmedBarcode)) {
      result.error = 'Barcode must contain only letters and numbers';
      return result;
    }

    // Minimum length check
    if (trimmedBarcode.length < 4) {
      result.error = 'Barcode must be at least 4 characters long';
      return result;
    }

    // Maximum length check
    if (trimmedBarcode.length > 20) {
      result.error = 'Barcode cannot exceed 20 characters';
      return result;
    }

    result.isValid = true;
    result.value = trimmedBarcode;
    return result;
  }

  /**
   * Validate SKU format
   * @param {string} sku - SKU to validate
   * @returns {Object} - Validation result
   */
  static validateSKU(sku) {
    const result = { isValid: false, error: '', value: null };
    
    if (!sku || sku.trim() === '') {
      result.error = 'SKU is required';
      return result;
    }

    const trimmedSKU = sku.trim();
    
    // Minimum length check
    if (trimmedSKU.length < 2) {
      result.error = 'SKU must be at least 2 characters long';
      return result;
    }

    // Maximum length check
    if (trimmedSKU.length > 50) {
      result.error = 'SKU cannot exceed 50 characters';
      return result;
    }

    result.isValid = true;
    result.value = trimmedSKU;
    return result;
  }

  /**
   * Validate file for CSV import
   * @param {File} file - File to validate
   * @param {Array} allowedTypes - Allowed MIME types
   * @param {number} maxSizeMB - Maximum file size in MB
   * @returns {Object} - Validation result
   */
  static validateFile(file, allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], maxSizeMB = 10) {
    const result = { isValid: false, error: '', file: null };
    
    if (!file) {
      result.error = 'Please select a file';
      return result;
    }

    // Check file type
    const isValidType = allowedTypes.includes(file.type) || 
                       file.name.toLowerCase().endsWith('.csv') ||
                       file.name.toLowerCase().endsWith('.xlsx') ||
                       file.name.toLowerCase().endsWith('.xls');
    
    if (!isValidType) {
      result.error = 'Please select a CSV or Excel file';
      return result;
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      result.error = `File size cannot exceed ${maxSizeMB}MB`;
      return result;
    }

    // Check if file is empty
    if (file.size === 0) {
      result.error = 'File is empty';
      return result;
    }

    result.isValid = true;
    result.file = file;
    return result;
  }

  /**
   * Validate user credentials
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Object} - Validation result
   */
  static validateCredentials(username, password) {
    const result = { isValid: false, errors: [] };
    
    if (!username || username.trim() === '') {
      result.errors.push('Username is required');
    }

    if (!password || password.trim() === '') {
      result.errors.push('Password is required');
    }

    if (username && username.trim().length < 3) {
      result.errors.push('Username must be at least 3 characters long');
    }

    if (password && password.length < 6) {
      result.errors.push('Password must be at least 6 characters long');
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Sanitize input for display
   * @param {string} input - Input to sanitize
   * @returns {string} - Sanitized input
   */
  static sanitizeInput(input) {
    if (!input) return '';
    
    return String(input)
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000); // Limit length
  }

  /**
   * Format barcode for display with hyphens
   * @param {string} barcode - Barcode to format
   * @returns {string} - Formatted barcode
   */
  static formatBarcodeForDisplay(barcode) {
    if (!barcode) return '';
    
    const cleanBarcode = String(barcode).replace(/[^A-Za-z0-9]/g, '');
    
    // Add hyphen every 4 characters for better readability
    return cleanBarcode.replace(/(.{4})/g, '$1-').replace(/-$/, '');
  }

  /**
   * Validate enhanced data object
   * @param {Object} data - Enhanced data to validate
   * @returns {Object} - Validation result
   */
  static validateEnhancedData(data) {
    const result = { isValid: true, errors: [] };
    
    if (data.labelQuantity !== undefined && data.labelQuantity !== '') {
      const labelValidation = this.validateLabelQuantity(data.labelQuantity);
      if (!labelValidation.isValid) {
        result.errors.push(labelValidation.error);
      }
    }

    if (data.caseQuantity !== undefined && data.caseQuantity !== '') {
      const caseValidation = this.validateCaseQuantity(data.caseQuantity);
      if (!caseValidation.isValid) {
        result.errors.push(caseValidation.error);
      }
    }

    if (data.boxCount !== undefined && data.boxCount !== '') {
      const boxValidation = this.validateBoxCount(data.boxCount);
      if (!boxValidation.isValid) {
        result.errors.push(boxValidation.error);
      }
    }

    if (data.harvestDate !== undefined && data.harvestDate !== '') {
      const dateValidation = this.validateDate(data.harvestDate);
      if (!dateValidation.isValid) {
        result.errors.push(`Harvest date: ${dateValidation.error}`);
      }
    }

    if (data.packagedDate !== undefined && data.packagedDate !== '') {
      const dateValidation = this.validateDate(data.packagedDate);
      if (!dateValidation.isValid) {
        result.errors.push(`Packaged date: ${dateValidation.error}`);
      }
    }

    result.isValid = result.errors.length === 0;
    return result;
  }
}