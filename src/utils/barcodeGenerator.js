import JsBarcode from 'jsbarcode';
import { BARCODE_CONFIG } from '../constants.js';

/**
 * Barcode generation utilities using Code 39 format
 */

export class BarcodeGenerator {
  /**
   * Generate a barcode as SVG string
   * @param {string} value - Value to encode
   * @param {Object} options - Custom options (optional)
   * @returns {string} - SVG string
   */
  static generateSVG(value, options = {}) {
    const config = {
      ...BARCODE_CONFIG,
      ...options
    };

    // Create a temporary canvas element
    const canvas = document.createElement('canvas');
    
    try {
      // Generate barcode on canvas
      JsBarcode(canvas, value, {
        format: config.FORMAT,
        width: config.WIDTH,
        height: config.HEIGHT,
        displayValue: config.DISPLAY_VALUE,
        margin: config.MARGIN,
        background: options.background || '#ffffff',
        lineColor: options.lineColor || '#000000'
      });

      // Convert canvas to SVG
      const svgString = this.canvasToSVG(canvas, value, config);
      return svgString;
      
    } catch (error) {
      console.error('Error generating barcode:', error);
      return this.generateErrorBarcode(value);
    }
  }

  /**
   * Generate a barcode as data URL
   * @param {string} value - Value to encode
   * @param {Object} options - Custom options (optional)
   * @returns {string} - Data URL
   */
  static generateDataURL(value, options = {}) {
    const config = {
      ...BARCODE_CONFIG,
      ...options
    };

    const canvas = document.createElement('canvas');
    
    try {
      JsBarcode(canvas, value, {
        format: config.FORMAT,
        width: config.WIDTH,
        height: config.HEIGHT,
        displayValue: config.DISPLAY_VALUE,
        margin: config.MARGIN,
        background: options.background || '#ffffff',
        lineColor: options.lineColor || '#000000'
      });

      return canvas.toDataURL('image/png');
      
    } catch (error) {
      console.error('Error generating barcode:', error);
      return this.generateErrorBarcodeDataURL();
    }
  }

  /**
   * Generate barcode directly to canvas element
   * @param {HTMLCanvasElement} canvas - Target canvas element
   * @param {string} value - Value to encode
   * @param {Object} options - Custom options (optional)
   * @returns {boolean} - Success status
   */
  static generateToCanvas(canvas, value, options = {}) {
    const config = {
      ...BARCODE_CONFIG,
      ...options
    };

    try {
      JsBarcode(canvas, value, {
        format: config.FORMAT,
        width: config.WIDTH,
        height: config.HEIGHT,
        displayValue: config.DISPLAY_VALUE,
        margin: config.MARGIN,
        background: options.background || '#ffffff',
        lineColor: options.lineColor || '#000000'
      });

      return true;
      
    } catch (error) {
      console.error('Error generating barcode to canvas:', error);
      return false;
    }
  }

  /**
   * Generate Code 39 barcode specifically for labels
   * @param {string} value - Value to encode
   * @param {Object} labelOptions - Label-specific options
   * @returns {string} - SVG string optimized for labels
   */
  static generateForLabel(value, labelOptions = {}) {
    // Code 39 requires asterisks as start/stop characters
    const code39Value = `*${value}*`;
    
    const config = {
      format: 'CODE39',
      width: labelOptions.width || 1.5,
      height: labelOptions.height || 40,
      displayValue: false, // Don't show text below barcode
      margin: 0,
      background: 'transparent',
      lineColor: '#000000'
    };

    return this.generateSVG(code39Value, config);
  }

  /**
   * Generate a high-DPI barcode for printing
   * @param {string} value - Value to encode
   * @param {number} dpi - Target DPI (default: 300)
   * @returns {string} - High resolution data URL
   */
  static generateHighDPI(value, dpi = 300) {
    const scaleFactor = dpi / 96; // 96 DPI is standard screen resolution
    
    const config = {
      ...BARCODE_CONFIG,
      width: BARCODE_CONFIG.WIDTH * scaleFactor,
      height: BARCODE_CONFIG.HEIGHT * scaleFactor
    };

    return this.generateDataURL(`*${value}*`, config);
  }

  /**
   * Validate if a value can be encoded as Code 39
   * @param {string} value - Value to validate
   * @returns {Object} - Validation result
   */
  static validateCode39(value) {
    const result = { isValid: false, error: '', cleanValue: '' };
    
    if (!value) {
      result.error = 'Barcode value is required';
      return result;
    }

    const stringValue = String(value).trim().toUpperCase();
    
    // Code 39 supports: 0-9, A-Z, space, and special characters: - . $ / + % *
    const validChars = /^[0-9A-Z\-\.\$\/\+\%\s]*$/;
    
    if (!validChars.test(stringValue)) {
      result.error = 'Code 39 only supports numbers, uppercase letters, space, and special characters: - . $ / + %';
      return result;
    }

    // Check length (Code 39 has practical limits)
    if (stringValue.length > 43) {
      result.error = 'Barcode value too long (maximum 43 characters for Code 39)';
      return result;
    }

    if (stringValue.length === 0) {
      result.error = 'Barcode value cannot be empty';
      return result;
    }

    result.isValid = true;
    result.cleanValue = stringValue;
    return result;
  }

  /**
   * Format barcode value for display (with hyphens)
   * @param {string} value - Barcode value
   * @returns {string} - Formatted value
   */
  static formatForDisplay(value) {
    if (!value) return '';
    
    const cleanValue = String(value).replace(/[^A-Za-z0-9]/g, '');
    
    // Add hyphen every 4 characters
    return cleanValue.replace(/(.{4})/g, '$1-').replace(/-$/, '');
  }

  /**
   * Convert canvas to SVG (helper method)
   * @param {HTMLCanvasElement} canvas - Canvas with barcode
   * @param {string} value - Original value
   * @param {Object} config - Barcode configuration
   * @returns {string} - SVG string
   */
  static canvasToSVG(canvas, value, config) {
    const width = canvas.width;
    const height = canvas.height;
    
    // Get image data from canvas
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, width, height);
    
    // Create SVG with barcode pattern
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="100%" height="100%" fill="white"/>`;
    
    // Convert pixels to SVG rectangles (simplified approach)
    // This is a basic implementation - for production, consider using a proper conversion library
    for (let y = 0; y < height; y += 2) { // Sample every 2 pixels for performance
      for (let x = 0; x < width; x++) {
        const pixelIndex = (y * width + x) * 4;
        const r = imageData.data[pixelIndex];
        const g = imageData.data[pixelIndex + 1];
        const b = imageData.data[pixelIndex + 2];
        
        // If pixel is black (or dark)
        if (r < 128 && g < 128 && b < 128) {
          svg += `<rect x="${x}" y="${y}" width="1" height="2" fill="black"/>`;
        }
      }
    }
    
    svg += '</svg>';
    return svg;
  }

  /**
   * Generate error barcode when main generation fails
   * @param {string} value - Original value that failed
   * @returns {string} - Error SVG
   */
  static generateErrorBarcode(value) {
    return `
      <svg width="200" height="50" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#ffeeee" stroke="#ff0000"/>
        <text x="50%" y="50%" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="10" fill="#ff0000">
          Error: ${value || 'Invalid'}
        </text>
      </svg>
    `;
  }

  /**
   * Generate error barcode data URL
   * @returns {string} - Error data URL
   */
  static generateErrorBarcodeDataURL() {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffeeee';
    ctx.fillRect(0, 0, 200, 50);
    ctx.strokeStyle = '#ff0000';
    ctx.strokeRect(0, 0, 200, 50);
    
    ctx.fillStyle = '#ff0000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Barcode Error', 100, 30);
    
    return canvas.toDataURL('image/png');
  }

  /**
   * Get barcode dimensions for layout calculations
   * @param {string} value - Barcode value
   * @param {Object} options - Configuration options
   * @returns {Object} - Dimensions
   */
  static getDimensions(value, options = {}) {
    const config = { ...BARCODE_CONFIG, ...options };
    
    // Code 39 has specific width calculations
    // Each character requires 9 bars (5 narrow, 4 wide) plus 1 space
    // Start/stop characters (*) are added automatically
    const effectiveLength = value ? value.length + 2 : 3; // +2 for start/stop
    const estimatedWidth = effectiveLength * (5 * config.WIDTH + 4 * config.WIDTH * 2) + (effectiveLength - 1) * config.WIDTH;
    
    return {
      width: Math.max(estimatedWidth, 100), // Minimum width
      height: config.HEIGHT,
      aspectRatio: estimatedWidth / config.HEIGHT
    };
  }

  /**
   * Test barcode generation with a sample value
   * @returns {Object} - Test results
   */
  static testGeneration() {
    const testValue = 'TEST123';
    const results = {
      svg: null,
      dataURL: null,
      validation: null,
      error: null
    };

    try {
      results.validation = this.validateCode39(testValue);
      
      if (results.validation.isValid) {
        results.svg = this.generateSVG(testValue);
        results.dataURL = this.generateDataURL(testValue);
      }
      
    } catch (error) {
      results.error = error.message;
    }

    return results;
  }
}