import jsPDF from 'jspdf';
import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generation utilities for Uline S-5492 label sheets (4" × 6" HORIZONTAL)
 * Complete redesign for bottom-focused layout with brand separation
 */
export class PDFGenerator {
  /**
   * Generate PDF with labels positioned for Uline S-5492 sheets
   * @param {Array} labelDataArray - Array of label data objects
   * @param {Object} options - Generation options
   * @returns {Promise<Blob>} - PDF blob
   */
  static async generateLabels(labelDataArray, options = {}) {
    const {
      format = 'legal', // Legal size for S-5492
      orientation = 'portrait',
      debug = false,
      currentUser = 'Unknown'
    } = options;

    // Legal size sheets for S-5492 (8.5" × 14")
    const pdf = new jsPDF({
      orientation,
      unit: 'pt',
      format: [612, 1008] // Legal size in points
    });

    let currentLabelIndex = 0;
    let currentPage = 1;
    const specs = LabelFormatter.getLabelSpecs();

    try {
      // Process each label data item
      for (const labelData of labelDataArray) {
        const formattedData = LabelFormatter.formatLabelData(
          labelData,
          labelData.enhancedData || {},
          labelData.user || 'Unknown'
        );

        // Generate the number of labels specified
        for (let labelCopy = 0; labelCopy < formattedData.labelQuantity; labelCopy++) {
          // Check if we need a new page (S-5492 has 4 labels per sheet)
          if (currentLabelIndex > 0 && currentLabelIndex % specs.LABELS_PER_SHEET === 0) {
            pdf.addPage();
            currentPage++;
          }

          // Calculate position for this label
          const position = this.calculateUlineS5492Position(currentLabelIndex % specs.LABELS_PER_SHEET);

          // Calculate which box number this label represents
          const boxNumber = Math.floor(labelCopy / Math.max(1, Math.floor(formattedData.labelQuantity / formattedData.boxCount))) + 1;

          // Draw the label with S-5492 horizontal layout
          await this.drawHorizontalLabel(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
      }

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-5492 Format Labels (4" × 6" Horizontal)',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v5.5.0',
        keywords: 'cannabis, inventory, labels, uline, s-5492, horizontal, 4x6'
      });

      // Log generation event
      storage.addSessionEvent(
        EVENT_TYPES.LABEL_GENERATED,
        `Generated ${currentLabelIndex} S-5492 labels across ${currentPage} pages`,
        `Items: ${labelDataArray.length}, Format: Uline S-5492 (4" × 6" Horizontal)`
      );

      return pdf.output('blob');

    } catch (error) {
      console.error('PDF generation error:', error);
      
      storage.addSessionEvent(
        EVENT_TYPES.ERROR_OCCURRED,
        `PDF generation failed: ${error.message}`,
        `Items attempted: ${labelDataArray.length}`
      );

      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Calculate label position for Uline S-5492 (4" × 6" horizontal, 4 per sheet)
   * On legal size sheets (8.5" × 14")
   * @param {number} labelIndex - Index of label (0-3 for 4 labels per sheet)
   * @returns {Object} - Position coordinates in points
   */
  static calculateUlineS5492Position(labelIndex) {
    // S-5492: 4 labels per legal sheet (8.5" × 14")
    const labelsPerSheet = 4;
    
    // Legal size sheet
    const pageWidth = 612;   // 8.5" in points
    const pageHeight = 1008; // 14" in points
    
    // Label dimensions (HORIZONTAL: 6" wide × 4" tall)
    const labelWidth = 432;  // 6" in points
    const labelHeight = 288; // 4" in points
    
    // Calculate grid: 2 columns × 2 rows
    const cols = 2;
    const rows = 2;
    const row = Math.floor(labelIndex / cols);
    const col = labelIndex % cols;
    
    // Calculate margins for centering on legal sheet
    const totalLabelsWidth = cols * labelWidth;   // 864pt
    const totalLabelsHeight = rows * labelHeight; // 576pt
    
    const horizontalMargin = (pageWidth - totalLabelsWidth) / 2;   // ~-126pt (will be negative - labels wider than page)
    const verticalMargin = (pageHeight - totalLabelsHeight) / 2;   // 216pt
    
    // Adjust for legal size constraints - labels will extend beyond page width
    const adjustedHorizontalMargin = Math.max(18, horizontalMargin); // Minimum 18pt margin
    const adjustedLabelWidth = Math.min(labelWidth, (pageWidth - 36) / 2); // Fit within page with margins
    
    // Calculate positions
    const xPos = adjustedHorizontalMargin + (col * (adjustedLabelWidth + 18));
    const yPos = verticalMargin + (row * (labelHeight + 36)); // 36pt gap between rows
    
    return {
      x: xPos,
      y: yPos,
      width: adjustedLabelWidth,
      height: labelHeight
    };
  }

  /**
   * Legacy method - Calculate label position (for backward compatibility)
   * @param {number} labelIndex - Index of label (0-based)
   * @returns {Object} - Position coordinates in points
   */
  static calculateUlineLabelPosition(labelIndex) {
    return this.calculateUlineS5492Position(labelIndex % 4);
  }

  /**
   * Legacy method for S-21846 compatibility
   */
  static calculateUlineS21846Position(labelIndex) {
    return this.calculateUlineS5492Position(labelIndex % 4);
  }

  /**
   * Draw horizontal 4x6 label with bottom-focused layout and brand separation
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Formatted label data
   * @param {Object} position - Label position and dimensions
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total number of boxes
   * @param {boolean} debug - Show debug borders
   * @param {string} currentUser - Current user generating the labels
   */
  static async drawHorizontalLabel(pdf, labelData, position, boxNumber = 1, totalBoxes = 1, debug = false, currentUser = 'Unknown') {
    const { x, y, width, height } = position;

    // Draw label border
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, y, width, height);

    // Debug border
    if (debug) {
      pdf.setDrawColor(255, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.rect(x + 2, y + 2, width - 4, height - 4);
    }

    const padding = 12;
    const contentX = x + padding;
    const contentY = y + padding;
    const contentWidth = width - (padding * 2);
    const contentHeight = height - (padding * 2);

    try {
      // 1. MASSIVE Product Name with Brand Separation (Top area)
      const brandInfo = this.extractBrandFromProductName(labelData.productName);
      await this.drawMassiveProductNameWithBrand(pdf, brandInfo, contentX, contentY, contentWidth, contentHeight - 100);

      // 2. Bottom section layout (last 100pt of height)
      const bottomY = y + height - 100; // Bottom 100pt area
      
      // 3. Audit Trail (Absolute bottom left)
      this.drawAuditTrail(pdf, currentUser, contentX, y + height - padding - 5);

      // 4. Bottom row with larger elements (above audit trail)
      await this.drawBottomRowElements(pdf, labelData, contentX, bottomY + 10, contentWidth, boxNumber, totalBoxes);

    } catch (error) {
      console.error('Error drawing horizontal label components:', error);
      pdf.setFontSize(12);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Error', contentX + 5, contentY + 40);
    }
  }

  /**
   * Extract brand from product name for separate display
   * @param {string} productName - Full product name
   * @returns {Object} - Brand and remaining product name
   */
  static extractBrandFromProductName(productName) {
    if (!productName) return { brand: '', productName: 'Product Name' };

    // Common cannabis brands (case insensitive)
    const brands = [
      'Curaleaf', 'Grassroots', 'Reef', 'B-Noble', 'Cresco', 'Rythm', 'GTI',
      'Verano', 'Aeriz', 'Revolution', 'Cookies', 'Jeeter', 'Raw Garden',
      'Stiiizy', 'Select', 'Heavy Hitters', 'Papa & Barkley', 'Kiva',
      'Wyld', 'Wana', 'Plus Products', 'Legion of Bloom', 'AbsoluteXtracts',
      'Matter', 'Pharmacann', 'Green Thumb', 'Columbia Care', 'Trulieve',
      'MedMen', 'Harvest', 'Acreage', 'Canopy Growth', 'Tilray'
    ];

    const trimmed = productName.trim();
    
    // Check if product name starts with any known brand
    for (const brand of brands) {
      const regex = new RegExp(`^${brand}\\s+`, 'i');
      if (regex.test(trimmed)) {
        const remaining = trimmed.replace(regex, '').trim();
        return {
          brand: brand,
          productName: remaining || trimmed
        };
      }
    }

    // If no brand found, check for common patterns like "Brand Name - Product"
    const dashMatch = trimmed.match(/^([A-Za-z\s&-]+?)\s*[-–]\s*(.+)$/);
    if (dashMatch && dashMatch[1].length <= 20) {
      return {
        brand: dashMatch[1].trim(),
        productName: dashMatch[2].trim()
      };
    }

    // No brand detected
    return {
      brand: '',
      productName: trimmed
    };
  }

  /**
   * Draw massive product name with brand separation
   * @param {jsPDF} pdf - PDF document
   * @param {Object} brandInfo - Brand and product name info
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Available width
   * @param {number} height - Available height
   */
  static async drawMassiveProductNameWithBrand(pdf, brandInfo, x, y, width, height) {
    let currentY = y;
    const lineSpacing = 1.1;

    // Draw brand name if present (larger, bold)
    if (brandInfo.brand) {
      const brandFontSize = Math.min(48, LabelFormatter.autoFitFontSize(brandInfo.brand, width, 50, 48));
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(brandFontSize);
      pdf.setTextColor(0, 0, 0);
      
      const brandLines = pdf.splitTextToSize(brandInfo.brand, width);
      brandLines.forEach((line, index) => {
        const textWidth = pdf.getTextWidth(line);
        const centerX = x + (width - textWidth) / 2;
        pdf.text(line, centerX, currentY + (brandFontSize * 0.8));
        currentY += brandFontSize * lineSpacing;
      });
      
      currentY += 10; // Gap between brand and product name
    }

    // Draw product name (maximum possible size)
    const remainingHeight = height - (currentY - y);
    const maxProductFontSize = brandInfo.brand ? 36 : 48; // Smaller if brand present
    const productFontSize = LabelFormatter.autoFitFontSize(brandInfo.productName, width, remainingHeight, maxProductFontSize);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(productFontSize);
    pdf.setTextColor(0, 0, 0);
    
    const productLines = pdf.splitTextToSize(brandInfo.productName, width);
    productLines.forEach((line, index) => {
      const textWidth = pdf.getTextWidth(line);
      const centerX = x + (width - textWidth) / 2;
      pdf.text(line, centerX, currentY + (productFontSize * 0.8));
      currentY += productFontSize * lineSpacing;
    });
  }

  /**
   * Draw bottom row elements: barcode, text box, dates, case/box info
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Available width
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total boxes
   */
  static async drawBottomRowElements(pdf, labelData, x, y, width, boxNumber, totalBoxes) {
    const rowHeight = 60; // Height for bottom row elements
    
    // Calculate section widths
    const barcodeWidth = 140;
    const textBoxWidth = 120;
    const rightInfoWidth = width - barcodeWidth - textBoxWidth - 20; // 20pt gaps
    
    let currentX = x;
    
    // 1. Barcode section (left)
    const spacedBarcodeDisplay = this.formatBarcodeWithSpaces(labelData.barcodeDisplay);
    
    // Barcode display above barcode
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(102, 102, 102);
    const displayWidth = pdf.getTextWidth(spacedBarcodeDisplay);
    const displayCenterX = currentX + (barcodeWidth - displayWidth) / 2;
    pdf.text(spacedBarcodeDisplay, displayCenterX, y - 5);
    
    // Draw barcode
    await this.drawEnhancedBarcode(pdf, labelData.barcode, currentX, y, barcodeWidth, 45);
    currentX += barcodeWidth + 10;
    
    // 2. Text box (middle)
    this.drawManualWritingBox(pdf, currentX, y, textBoxWidth, rowHeight);
    currentX += textBoxWidth + 10;
    
    // 3. Right info section (dates and boxes) - LARGER FONTS
    this.drawLargerRightInfo(pdf, labelData, currentX, y, rightInfoWidth, boxNumber, totalBoxes);
  }

  /**
   * Draw larger right side information
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Available width
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total boxes
   */
  static drawLargerRightInfo(pdf, labelData, x, y, width, boxNumber, totalBoxes) {
    let currentY = y;
    
    // Harvest Date (LARGER)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14); // Increased from 11
    pdf.setTextColor(0, 0, 0);
    const harvestText = `Harvest: ${labelData.harvestDate || 'MM/DD/YYYY'}`;
    pdf.text(harvestText, x, currentY + 12);
    currentY += 18;
    
    // Packaged Date (LARGER)
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(14); // Increased from 11
    const packagedText = `Packaged: ${labelData.packagedDate || 'MM/DD/YYYY'}`;
    pdf.text(packagedText, x, currentY + 12);
    currentY += 20;
    
    // Case Qty and Box info (LARGER BOXES and TEXT)
    const boxWidth = 65;  // Increased from 50
    const boxHeight = 18; // Increased from 15
    const boxGap = 8;     // Increased gap
    
    // Case Qty Box
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, currentY, boxWidth, boxHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12); // Increased from 10
    const caseQtyValue = labelData.caseQuantity || '___';
    const caseQtyText = `Case: ${caseQtyValue}`;
    const caseQtyWidth = pdf.getTextWidth(caseQtyText);
    pdf.text(caseQtyText, x + (boxWidth - caseQtyWidth) / 2, currentY + (boxHeight / 2) + 4);
    
    // Box Number Box
    pdf.rect(x + boxWidth + boxGap, currentY, boxWidth, boxHeight);
    
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    const boxTextWidth = pdf.getTextWidth(boxText);
    pdf.text(boxText, x + boxWidth + boxGap + (boxWidth - boxTextWidth) / 2, currentY + (boxHeight / 2) + 4);
  }

  /**
   * Format barcode display with spaces instead of hyphens
   * @param {string} barcodeDisplay - Hyphenated barcode display
   * @returns {string} - Spaced barcode display
   */
  static formatBarcodeWithSpaces(barcodeDisplay) {
    if (!barcodeDisplay) return '';
    return barcodeDisplay.replace(/-/g, ' ');
  }

  /**
   * Draw enhanced scannable barcode
   * @param {jsPDF} pdf - PDF document
   * @param {string} barcodeValue - Barcode value
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Barcode width
   * @param {number} height - Barcode height
   */
  static async drawEnhancedBarcode(pdf, barcodeValue, x, y, width, height) {
    if (!barcodeValue) return;

    try {
      const cleanBarcodeValue = barcodeValue.replace(/[^A-Za-z0-9]/g, '');
      
      const validation = BarcodeGenerator.validateCode39(cleanBarcodeValue);
      if (!validation.isValid) {
        console.warn('Invalid barcode:', validation.error);
        this.drawBarcodeError(pdf, x, y, width, height);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width * 2;
      canvas.height = height * 2;
      
      const JsBarcode = (await import('jsbarcode')).default;
      
      JsBarcode(canvas, validation.cleanValue, {
        format: 'CODE39',
        width: 3,
        height: height * 2,
        displayValue: false,
        margin: 0,
        background: '#ffffff',
        lineColor: '#000000'
      });

      const barcodeDataURL = canvas.toDataURL('image/png');
      pdf.addImage(barcodeDataURL, 'PNG', x, y, width, height);

    } catch (error) {
      console.error('Enhanced barcode generation error:', error);
      this.drawBarcodeError(pdf, x, y, width, height);
    }
  }

  /**
   * Draw text box for manual writing (no label)
   * @param {jsPDF} pdf - PDF document
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Box width
   * @param {number} height - Box height
   */
  static drawManualWritingBox(pdf, x, y, width, height) {
    // Draw box border
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, y, width, height);

    // Add grid lines
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.5);
    
    const lineSpacing = height / 3;
    for (let i = 1; i < 3; i++) {
      const lineY = y + (i * lineSpacing);
      pdf.line(x, lineY, x + width, lineY);
    }
  }

  /**
   * Draw audit trail
   * @param {jsPDF} pdf - PDF document
   * @param {string} currentUser - Current user
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  static drawAuditTrail(pdf, currentUser, x, y) {
    const now = new Date();
    const estOffset = -5;
    const estTime = new Date(now.getTime() + (estOffset * 60 * 60 * 1000));
    
    const month = (estTime.getMonth() + 1).toString().padStart(2, '0');
    const day = estTime.getDate().toString().padStart(2, '0');
    const year = estTime.getFullYear().toString().slice(-2);
    
    let hours = estTime.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = hours.toString();
    
    const minutes = estTime.getMinutes().toString().padStart(2, '0');
    
    const auditString = `${month}/${day}/${year} ${hoursStr}:${minutes} ${ampm} EST (${currentUser})`;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(102, 102, 102);
    pdf.text(auditString, x, y);
  }

  /**
   * Draw barcode error placeholder
   */
  static drawBarcodeError(pdf, x, y, width, height) {
    pdf.setDrawColor(255, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, y, width, height);
    
    pdf.setFontSize(8);
    pdf.setTextColor(255, 0, 0);
    pdf.text('Barcode Error', x + 5, y + height / 2);
  }

  // Legacy methods for backward compatibility
  static async drawLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawHorizontalLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }

  static async drawEnhancedLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawHorizontalLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }

  static async drawProductName(pdf, productName, x, y, width, height) {
    const brandInfo = this.extractBrandFromProductName(productName);
    return this.drawMassiveProductNameWithBrand(pdf, brandInfo, x, y, width, height);
  }

  static async drawEnhancedProductName(pdf, productName, x, y, width, height) {
    const brandInfo = this.extractBrandFromProductName(productName);
    return this.drawMassiveProductNameWithBrand(pdf, brandInfo, x, y, width, height);
  }

  static drawBarcodeDisplay(pdf, barcodeDisplay, x, y, width) {
    const spacedDisplay = this.formatBarcodeWithSpaces(barcodeDisplay);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(102, 102, 102);
    const textWidth = pdf.getTextWidth(spacedDisplay);
    const centerX = x + (width - textWidth) / 2;
    pdf.text(spacedDisplay, centerX, y + 12);
  }

  static async drawBarcode(pdf, barcodeValue, x, y, width, height) {
    return this.drawEnhancedBarcode(pdf, barcodeValue, x, y, width, height);
  }

  static drawRightSideInfo(pdf, labelData, x, y, width, boxNumber, totalBoxes) {
    return this.drawLargerRightInfo(pdf, labelData, x, y, width, boxNumber, totalBoxes);
  }

  static drawEnhancedRightSideInfo(pdf, labelData, x, y, width, boxNumber, totalBoxes) {
    return this.drawLargerRightInfo(pdf, labelData, x, y, width, boxNumber, totalBoxes);
  }

  static drawEnhancedAuditTrail(pdf, currentUser, x, y) {
    return this.drawAuditTrail(pdf, currentUser, x, y);
  }

  /**
   * Generate test PDF for S-5492 verification
   * @returns {Promise<Blob>} - Test PDF blob
   */
  static async generateTestPDF() {
    const testData = [{
      sku: 'TEST-S5492',
      barcode: 'TEST123456',
      productName: 'Curaleaf Pink Champagne Capsules [10mg] 30-Capsules Premium Cannabis Product',
      brand: 'Test Brand',
      enhancedData: {
        labelQuantity: 4,
        caseQuantity: '48',
        boxCount: '2',
        harvestDate: '01/15/2025',
        packagedDate: '02/20/2025'
      },
      user: 'TestUser'
    }];

    return this.generateLabels(testData, { debug: true, currentUser: 'TestUser' });
  }

  /**
   * Required validation method
   * @param {Array} labelDataArray - Label data to validate
   * @returns {Object} - Validation result
   */
  static validateGenerationData(labelDataArray) {
    const errors = [];
    const warnings = [];

    if (!Array.isArray(labelDataArray) || labelDataArray.length === 0) {
      errors.push('No label data provided');
      return { isValid: false, errors, warnings };
    }

    let totalLabels = 0;

    labelDataArray.forEach((item, index) => {
      const validation = LabelFormatter.validateLabelData(item, item.enhancedData);
      
      if (!validation.isValid) {
        errors.push(`Item ${index + 1}: ${validation.errors.join(', ')}`);
      }

      if (validation.warnings && validation.warnings.length > 0) {
        warnings.push(`Item ${index + 1}: ${validation.warnings.join(', ')}`);
      }

      const qty = parseInt(item.enhancedData?.labelQuantity || '1');
      totalLabels += qty;
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalLabels,
      estimatedPages: LabelFormatter.calculatePagesNeeded(totalLabels),
      labelFormat: 'S-5492'
    };
  }

  /**
   * Get debug information
   * @returns {Object} - Debug information
   */
  static getDebugInfo() {
    const specs = LabelFormatter.getLabelSpecs();
    const positions = [];

    for (let i = 0; i < specs.LABELS_PER_SHEET; i++) {
      positions.push(this.calculateUlineS5492Position(i));
    }

    return {
      migration: "S-21846 → S-5492",
      pageSize: { width: 612, height: 1008 }, // Legal size
      labelSpecs: specs,
      labelPositions: positions,
      totalLabelsPerSheet: specs.LABELS_PER_SHEET,
      changes: {
        labelSize: "7.75″×4.75″ → 6″×4″ (horizontal)",
        labelsPerSheet: "2 → 4",
        layout: "Vertical stack → 2×2 grid horizontal",
        features: [
          "Brand separation (Curaleaf, Grassroots, etc.)",
          "Massive product name (up to 48pt)",
          "Bottom-focused layout",
          "Larger dates and case/box info",
          "Horizontal 4×6 orientation"
        ]
      }
    };
  }
}