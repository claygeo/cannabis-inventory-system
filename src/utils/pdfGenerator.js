import jsPDF from 'jspdf';
import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generation utilities for Uline S-21846 label sheets (7-3/4" × 4-3/4")
 * Migrated from S-5627 with enhanced layout and HP E877 optimization
 */
export class PDFGenerator {
  /**
   * Generate PDF with labels positioned for Uline S-21846 sheets
   * @param {Array} labelDataArray - Array of label data objects
   * @param {Object} options - Generation options
   * @returns {Promise<Blob>} - PDF blob
   */
  static async generateLabels(labelDataArray, options = {}) {
    const {
      format = 'hp_e877_optimized', // HP E877 optimized format
      orientation = 'portrait',
      debug = false,
      currentUser = 'Unknown'
    } = options;

    // HP E877 Optimized page size (printable area: 8.17" × 10.67")
    const pdf = new jsPDF({
      orientation,
      unit: 'pt',
      format: [588, 768] // HP E877 printable area in points
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
          // Check if we need a new page (S-21846 has 2 labels per sheet)
          if (currentLabelIndex > 0 && currentLabelIndex % specs.LABELS_PER_SHEET === 0) {
            pdf.addPage();
            currentPage++;
          }

          // Calculate position for this label
          const position = this.calculateUlineS21846Position(currentLabelIndex % specs.LABELS_PER_SHEET);

          // Calculate which box number this label represents
          const boxNumber = Math.floor(labelCopy / Math.max(1, Math.floor(formattedData.labelQuantity / formattedData.boxCount))) + 1;

          // Draw the label with enhanced S-21846 layout
          await this.drawEnhancedLabel(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
      }

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-21846 Format Labels (7-3/4" × 4-3/4")',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v5.4.0',
        keywords: 'cannabis, inventory, labels, uline, s-21846, large-format'
      });

      // Log generation event
      storage.addSessionEvent(
        EVENT_TYPES.LABEL_GENERATED,
        `Generated ${currentLabelIndex} S-21846 labels across ${currentPage} pages`,
        `Items: ${labelDataArray.length}, Format: Uline S-21846 (7-3/4" × 4-3/4")`
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
   * Calculate label position for Uline S-21846 (7-3/4" × 4-3/4", 2 per sheet)
   * Optimized for HP E877 printable area (588pt × 768pt)
   * @param {number} labelIndex - Index of label (0-1 for 2 labels per sheet)
   * @returns {Object} - Position coordinates in points
   */
  static calculateUlineS21846Position(labelIndex) {
    // S-21846: 2 labels per sheet, vertically stacked
    const labelsPerSheet = 2;
    
    // HP E877 printable area
    const pageWidth = 588;   // 8.17" in points
    const pageHeight = 768;  // 10.67" in points
    
    // Label dimensions (7-3/4" × 4-3/4")
    const labelWidth = 558;  // 7.75" in points
    const labelHeight = 342; // 4.75" in points
    
    // Calculate margins for optimal HP E877 printing
    const horizontalMargin = (pageWidth - labelWidth) / 2; // 15pt (~0.21")
    
    // Vertical spacing calculations
    const totalLabelsHeight = labelsPerSheet * labelHeight; // 684pt
    const availableHeight = pageHeight; // 768pt
    const remainingSpace = availableHeight - totalLabelsHeight; // 84pt
    
    // Distribute vertical space: top margin, gap between labels, bottom margin
    const topMargin = remainingSpace / 3; // ~28pt
    const labelGap = remainingSpace / 3;  // ~28pt
    const bottomMargin = remainingSpace / 3; // ~28pt
    
    // Calculate Y position based on label index
    let yPos;
    if (labelIndex === 0) {
      // Top label
      yPos = topMargin;
    } else {
      // Bottom label
      yPos = topMargin + labelHeight + labelGap;
    }
    
    return {
      x: horizontalMargin,
      y: yPos,
      width: labelWidth,
      height: labelHeight
    };
  }

  /**
   * Legacy method - Calculate label position (for backward compatibility)
   * @param {number} labelIndex - Index of label (0-based)
   * @returns {Object} - Position coordinates in points
   */
  static calculateUlineLabelPosition(labelIndex) {
    // For backward compatibility, redirect to S-21846 method
    return this.calculateUlineS21846Position(labelIndex % 2);
  }

  /**
   * Draw enhanced label with new S-21846 layout requirements
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Formatted label data
   * @param {Object} position - Label position and dimensions
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total number of boxes
   * @param {boolean} debug - Show debug borders
   * @param {string} currentUser - Current user generating the labels
   */
  static async drawEnhancedLabel(pdf, labelData, position, boxNumber = 1, totalBoxes = 1, debug = false, currentUser = 'Unknown') {
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

    const padding = 12; // Increased padding for larger labels
    const contentX = x + padding;
    const contentY = y + padding;
    const contentWidth = width - (padding * 2);
    const contentHeight = height - (padding * 2);

    try {
      // 1. Product Name (Top section - MUCH LARGER)
      await this.drawEnhancedProductName(pdf, labelData.productName, contentX, contentY, contentWidth, 60);

      // 2. Barcode area positioning
      const barcodeX = contentX;
      const barcodeY = contentY + 85;
      const barcodeWidth = 200;
      const barcodeHeight = 80;

      // 3. Barcode Display (DIRECTLY above the barcode, not full width)
      const spacedBarcodeDisplay = this.formatBarcodeWithSpaces(labelData.barcodeDisplay);
      this.drawBarcodeDisplayAboveBarcode(pdf, spacedBarcodeDisplay, barcodeX, barcodeY - 15, barcodeWidth);

      // 4. Scannable Barcode (Left side, larger)
      await this.drawEnhancedBarcode(pdf, labelData.barcode, barcodeX, barcodeY, barcodeWidth, barcodeHeight);

      // 5. Large Text Box for Manual Writing (Center area) - NO "Notes:" label
      this.drawManualWritingBox(pdf, contentX + 210, barcodeY, 160, 80);

      // 6. Bottom Right Information (Dates and boxes moved to bottom)
      const bottomInfo = this.drawBottomRightInfo(pdf, labelData, contentX, y + height - padding, contentWidth, boxNumber, totalBoxes);

      // 7. Audit Trail (Bottom left, aligned with Case/Box level)
      this.drawEnhancedAuditTrail(pdf, currentUser, contentX, bottomInfo.boxY + 12); // Align with box center

    } catch (error) {
      console.error('Error drawing enhanced label components:', error);
      // Draw error message
      pdf.setFontSize(12);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Error', contentX + 5, contentY + 40);
    }
  }

  /**
   * Legacy method - Draw label (for backward compatibility)
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Formatted label data
   * @param {Object} position - Label position and dimensions
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total number of boxes
   * @param {boolean} debug - Show debug borders
   * @param {string} currentUser - Current user generating the labels
   */
  static async drawLabel(pdf, labelData, position, boxNumber = 1, totalBoxes = 1, debug = false, currentUser = 'Unknown') {
    // For backward compatibility, redirect to enhanced method
    return this.drawEnhancedLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }

  /**
   * Draw enhanced product name for larger labels
   * @param {jsPDF} pdf - PDF document
   * @param {string} productName - Product name
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Available width
   * @param {number} height - Available height
   */
  static async drawEnhancedProductName(pdf, productName, x, y, width, height) {
    if (!productName) return;

    // Much larger font size for S-21846
    const fontSize = LabelFormatter.autoFitFontSize(productName, width, height, 36);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(fontSize);
    pdf.setTextColor(0, 0, 0);

    // Handle text wrapping
    const lines = pdf.splitTextToSize(productName, width);
    const lineHeight = fontSize * 1.15;
    
    // Center the text block vertically
    const totalTextHeight = lines.length * lineHeight;
    const startY = y + Math.max(0, (height - totalTextHeight) / 2) + fontSize * 0.8;

    // Draw each line centered
    lines.forEach((line, index) => {
      const lineY = startY + (index * lineHeight);
      const textWidth = pdf.getTextWidth(line);
      const centerX = x + (width - textWidth) / 2;
      pdf.text(line, centerX, lineY);
    });
  }

  /**
   * Legacy method - Draw product name (for backward compatibility)
   * @param {jsPDF} pdf - PDF document
   * @param {string} productName - Product name
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Available width
   * @param {number} height - Available height
   */
  static async drawProductName(pdf, productName, x, y, width, height) {
    return this.drawEnhancedProductName(pdf, productName, x, y, width, height);
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
   * Draw barcode display directly above the barcode (not full width)
   * @param {jsPDF} pdf - PDF document
   * @param {string} barcodeDisplay - Spaced barcode for display
   * @param {number} x - Barcode X position
   * @param {number} y - Y position above barcode
   * @param {number} barcodeWidth - Width of the barcode below
   */
  static drawBarcodeDisplayAboveBarcode(pdf, barcodeDisplay, x, y, barcodeWidth) {
    if (!barcodeDisplay) return;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(14); // Larger font for S-21846
    pdf.setTextColor(102, 102, 102);

    // Center the text above the barcode (not full label width)
    const textWidth = pdf.getTextWidth(barcodeDisplay);
    const centerX = x + (barcodeWidth - textWidth) / 2;
    pdf.text(barcodeDisplay, centerX, y + 12);
  }

  /**
   * Draw enhanced barcode display with larger font (legacy - for full width)
   * @param {jsPDF} pdf - PDF document
   * @param {string} barcodeDisplay - Spaced barcode for display
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Available width
   */
  static drawEnhancedBarcodeDisplay(pdf, barcodeDisplay, x, y, width) {
    if (!barcodeDisplay) return;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(14); // Larger font for S-21846
    pdf.setTextColor(102, 102, 102);

    const textWidth = pdf.getTextWidth(barcodeDisplay);
    const centerX = x + (width - textWidth) / 2;
    pdf.text(barcodeDisplay, centerX, y + 12);
  }

  /**
   * Legacy method - Draw barcode display (for backward compatibility)
   * @param {jsPDF} pdf - PDF document
   * @param {string} barcodeDisplay - Formatted barcode for display
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Available width
   */
  static drawBarcodeDisplay(pdf, barcodeDisplay, x, y, width) {
    const spacedDisplay = this.formatBarcodeWithSpaces(barcodeDisplay);
    return this.drawEnhancedBarcodeDisplay(pdf, spacedDisplay, x, y, width);
  }

  /**
   * Draw enhanced scannable barcode (larger, still NO TEXT)
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

      // Create larger barcode for S-21846
      const canvas = document.createElement('canvas');
      canvas.width = width * 2;
      canvas.height = height * 2;
      
      const JsBarcode = (await import('jsbarcode')).default;
      
      JsBarcode(canvas, validation.cleanValue, {
        format: 'CODE39',
        width: 4, // Thicker bars for larger label
        height: height * 2,
        displayValue: false, // NO TEXT EVER
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
   * Legacy method - Draw barcode (for backward compatibility)
   * @param {jsPDF} pdf - PDF document
   * @param {string} barcodeValue - Barcode value
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Barcode width
   * @param {number} height - Barcode height
   */
  static async drawBarcode(pdf, barcodeValue, x, y, width, height) {
    return this.drawEnhancedBarcode(pdf, barcodeValue, x, y, width, height);
  }

  /**
   * Draw large text box for manual writing (NO "Notes:" label)
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

    // Add light grid lines for writing
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.5);
    
    // Horizontal lines
    const lineSpacing = height / 4;
    for (let i = 1; i < 4; i++) {
      const lineY = y + (i * lineSpacing);
      pdf.line(x, lineY, x + width, lineY);
    }

    // NO "Notes:" label - removed as requested
  }

  /**
   * Draw bottom right information with dates and boxes moved to bottom
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - Content X position
   * @param {number} y - Bottom Y position
   * @param {number} width - Available width
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total boxes
   * @returns {Object} - Position info for audit trail alignment
   */
  static drawBottomRightInfo(pdf, labelData, x, y, width, boxNumber, totalBoxes) {
    // Position everything to the right side, working upward from bottom
    const rightAlignX = x + width - 180; // 180pt from right edge for more space
    let currentYFromBottom = y - 10; // Start 10pt from bottom

    // CASE/BOX BOXES at the very bottom
    const largeBoxWidth = 80;  // Made slightly wider
    const largeBoxHeight = 20; // Made slightly shorter for bottom positioning
    const boxGap = 5;
    
    const box1X = rightAlignX;
    const box2X = rightAlignX + largeBoxWidth + boxGap;
    const boxY = currentYFromBottom - largeBoxHeight;

    // Case Qty Box
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(box1X, boxY, largeBoxWidth, largeBoxHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    const caseQtyValue = labelData.caseQuantity || '___';
    const caseQtyText = `Case: ${caseQtyValue}`;
    const caseQtyWidth = pdf.getTextWidth(caseQtyText);
    pdf.text(caseQtyText, box1X + (largeBoxWidth - caseQtyWidth) / 2, boxY + (largeBoxHeight / 2) + 3);

    // Box Number Box
    pdf.rect(box2X, boxY, largeBoxWidth, largeBoxHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    const boxTextWidth = pdf.getTextWidth(boxText);
    pdf.text(boxText, box2X + (largeBoxWidth - boxTextWidth) / 2, boxY + (largeBoxHeight / 2) + 3);

    // Move up for dates
    currentYFromBottom = boxY - 8; // 8pt gap above boxes

    // Packaged Date (above boxes)
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    const packagedText = `Packaged: ${labelData.packagedDate || 'MM/DD/YYYY'}`;
    const packagedWidth = pdf.getTextWidth(packagedText);
    pdf.text(packagedText, rightAlignX + (largeBoxWidth * 2 + boxGap - packagedWidth) / 2, currentYFromBottom);

    // Move up for harvest date
    currentYFromBottom -= 15;

    // Harvest Date (above packaged date)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    const harvestText = `Harvest: ${labelData.harvestDate || 'MM/DD/YYYY'}`;
    const harvestWidth = pdf.getTextWidth(harvestText);
    pdf.text(harvestText, rightAlignX + (largeBoxWidth * 2 + boxGap - harvestWidth) / 2, currentYFromBottom);

    // Return box position for audit trail alignment
    return {
      boxY: boxY,
      boxHeight: largeBoxHeight
    };
  }

  /**
   * Legacy method - Draw right side info (for backward compatibility)
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Available width
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total boxes
   */
  static drawRightSideInfo(pdf, labelData, x, y, width, boxNumber, totalBoxes) {
    // Redirect to new bottom right method, but adjust positioning
    return this.drawBottomRightInfo(pdf, labelData, x - width, y + 100, width * 2, boxNumber, totalBoxes);
  }

  /**
   * Legacy method for old right side positioning
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Available width
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total boxes
   */
  static drawEnhancedRightSideInfo(pdf, labelData, x, y, width, boxNumber, totalBoxes) {
    // For legacy compatibility, redirect to new bottom method
    return this.drawBottomRightInfo(pdf, labelData, x - 200, y + 80, width + 200, boxNumber, totalBoxes);
  }

  /**
   * Draw enhanced audit trail aligned with Case/Box level
   * @param {jsPDF} pdf - PDF document
   * @param {string} currentUser - Current user
   * @param {number} x - X position (left side)
   * @param {number} y - Y position (aligned with boxes)
   */
  static drawEnhancedAuditTrail(pdf, currentUser, x, y) {
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
    pdf.setFontSize(8); // Slightly larger for S-21846
    pdf.setTextColor(102, 102, 102);
    pdf.text(auditString, x, y);
  }

  /**
   * Legacy method - Draw audit trail (for backward compatibility)
   * @param {jsPDF} pdf - PDF document
   * @param {string} currentUser - Current user
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  static drawAuditTrail(pdf, currentUser, x, y) {
    return this.drawEnhancedAuditTrail(pdf, currentUser, x, y);
  }

  /**
   * Draw barcode error placeholder
   */
  static drawBarcodeError(pdf, x, y, width, height) {
    pdf.setDrawColor(255, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, y, width, height);
    
    pdf.setFontSize(10);
    pdf.setTextColor(255, 0, 0);
    pdf.text('Barcode Error', x + 5, y + height / 2);
  }

  /**
   * Generate test PDF for S-21846 verification
   * @returns {Promise<Blob>} - Test PDF blob
   */
  static async generateTestPDF() {
    const testData = [{
      sku: 'TEST-S21846',
      barcode: 'TEST123456',
      productName: 'Test Cannabis Product for S-21846 Large Label Verification and Layout Testing',
      brand: 'Test Brand',
      enhancedData: {
        labelQuantity: 2,
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
   * Validate PDF generation requirements (REQUIRED METHOD)
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

    // Adjusted for S-21846 (fewer labels per sheet)
    if (totalLabels > 100) {
      warnings.push(`Large number of labels (${totalLabels}) may take significant time with S-21846 format`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalLabels,
      estimatedPages: LabelFormatter.calculatePagesNeeded(totalLabels),
      labelFormat: 'S-21846'
    };
  }

  /**
   * Get debug information for S-21846
   * @returns {Object} - Debug information
   */
  static getDebugInfo() {
    const specs = LabelFormatter.getLabelSpecs();
    const positions = [];

    for (let i = 0; i < specs.LABELS_PER_SHEET; i++) {
      positions.push(this.calculateUlineS21846Position(i));
    }

    return {
      migration: "S-5627 → S-21846",
      pageSize: { width: 588, height: 768 }, // HP E877 optimized
      labelSpecs: specs,
      labelPositions: positions,
      totalLabelsPerSheet: specs.LABELS_PER_SHEET,
      changes: {
        labelSize: "4″×1.5″ → 7.75″×4.75″",
        labelsPerSheet: "12 → 2", 
        layout: "2×6 grid → 2×1 vertical stack",
        features: [
          "Much larger product name",
          "Spaced barcode display directly above barcode",
          "Large manual writing text box (no label)",
          "Dates and boxes moved to bottom right",
          "Audit trail aligned with Case/Box level",
          "Enhanced readability for all elements"
        ]
      },
      hpE877Optimization: {
        printableArea: "8.17″ × 10.67″ (588×768pt)",
        margins: "Auto-calculated for perfect centering",
        scalingFactor: "Not needed - labels fit naturally"
      }
    };
  }

  /**
   * Calculate PDF dimensions and positions for debugging (legacy method)
   * @returns {Object} - Debug information
   */
  static getS21846DebugInfo() {
    return this.getDebugInfo();
  }
}