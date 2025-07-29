import jsPDF from 'jspdf';
import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generation utilities for Uline S-5627 label sheets
 */
export class PDFGenerator {
  /**
   * Generate PDF with labels positioned for Uline S-5627 sheets
   * @param {Array} labelDataArray - Array of label data objects
   * @param {Object} options - Generation options
   * @returns {Promise<Blob>} - PDF blob
   */
  static async generateLabels(labelDataArray, options = {}) {
    const {
      format = 'letter', // 8.5" x 11"
      orientation = 'portrait',
      margins = { top: 0.5, right: 0.3, bottom: 0.5, left: 0.3 }, // inches
      debug = false
    } = options;

    // Create new PDF document
    const pdf = new jsPDF({
      orientation,
      unit: 'pt',
      format: format === 'letter' ? [612, 792] : format // 8.5" x 11" in points
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
          // Check if we need a new page
          if (currentLabelIndex > 0 && currentLabelIndex % specs.LABELS_PER_SHEET === 0) {
            pdf.addPage();
            currentPage++;
          }

          // Calculate position for this label
          const position = this.calculateUlineLabelPosition(currentLabelIndex % specs.LABELS_PER_SHEET);

          // Calculate which box number this label represents
          const boxNumber = Math.floor(labelCopy / Math.max(1, Math.floor(formattedData.labelQuantity / formattedData.boxCount))) + 1;

          // Draw the label
          await this.drawLabel(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug);

          currentLabelIndex++;
        }
      }

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-5627 Format Labels',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v5.3.1',
        keywords: 'cannabis, inventory, labels, uline, s-5627'
      });

      // Log generation event
      storage.addSessionEvent(
        EVENT_TYPES.LABEL_GENERATED,
        `Generated ${currentLabelIndex} labels across ${currentPage} pages`,
        `Items: ${labelDataArray.length}, Format: Uline S-5627`
      );

      // Return PDF as blob
      return pdf.output('blob');

    } catch (error) {
      console.error('PDF generation error:', error);
      
      // Log error
      storage.addSessionEvent(
        EVENT_TYPES.ERROR_OCCURRED,
        `PDF generation failed: ${error.message}`,
        `Items attempted: ${labelDataArray.length}`
      );

      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Calculate label position using EXACT specifications from image analysis
   * @param {number} labelIndex - Index of label (0-based)
   * @returns {Object} - Position coordinates in points
   */
  static calculateUlineLabelPosition(labelIndex) {
    const labelsPerRow = 2;
    const labelsPerCol = 6;
    const row = Math.floor(labelIndex / labelsPerRow);
    const col = labelIndex % labelsPerRow;
    
    // Standard 8.5" x 11" page (612 x 792 points)
    const pageWidth = 612;
    const pageHeight = 792;
    
    // Label dimensions (exact Uline specifications)
    const labelWidth = 288; // 4 inches exact
    const labelHeight = 108; // 1.5 inches exact
    
    // EXTRACTED FROM ULINE TEMPLATE IMAGE ANALYSIS - PIXEL PERFECT
    const topMargin = 72;       // 1.000" - Equal top margin
    const bottomMargin = 72;    // 1.000" - Equal bottom margin  
    const leftMargin = 15;      // 0.208" - Side margin
    const rightMargin = 15;     // 0.208" - Side margin
    const columnGap = 6;        // 0.083" - Small middle gap
    
    // PERFECT TEMPLATE MATCH VERIFICATION:
    // Width: 15 + 288 + 6 + 288 + 15 = 612pt ✅ EXACT
    // Height: 72 + (6 × 108) + 72 = 792pt ✅ EXACT
    
    // Calculate X position (columns) - small gap between columns
    let xPos = leftMargin;
    if (col === 1) {
      // Right column: left margin + left label + small gap
      xPos = leftMargin + labelWidth + columnGap;
    }
    
    // Calculate Y position - labels are adjacent vertically (no row gaps)
    const yPos = topMargin + (row * labelHeight);
    
    return {
      x: xPos,
      y: yPos,
      width: labelWidth,
      height: labelHeight
    };
  }

  /**
   * Draw a single label on the PDF with updated layout
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Formatted label data
   * @param {Object} position - Label position and dimensions
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total number of boxes
   * @param {boolean} debug - Show debug borders
   */
  static async drawLabel(pdf, labelData, position, boxNumber = 1, totalBoxes = 1, debug = false) {
    const { x, y, width, height } = position;

    // Draw Uline-style border (solid black)
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, y, width, height);

    // Draw debug border if enabled (red inside the black border)
    if (debug) {
      pdf.setDrawColor(255, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.rect(x + 1, y + 1, width - 2, height - 2);
    }

    // Calculate areas within the label
    const padding = 4; // 4pt padding
    const contentX = x + padding;
    const contentY = y + padding;
    const contentWidth = width - (padding * 2);
    const contentHeight = height - (padding * 2);

    try {
      // 1. Product Name (Top section - largest possible font)
      await this.drawProductName(pdf, labelData.productName, contentX, contentY, contentWidth, 24);

      // 2. Hyphenated Barcode Display (under product name)
      this.drawBarcodeDisplay(pdf, labelData.barcodeDisplay, contentX, contentY + 28, contentWidth);

      // 3. Scannable Barcode (Left side - ABSOLUTELY NO TEXT)
      await this.drawBarcode(pdf, labelData.barcode, contentX, contentY + 42, 105, 42);

      // 4. Right Side Information (moved to far right)
      this.drawRightSideInfo(pdf, labelData, contentX + 110, contentY + 42, contentWidth - 110, boxNumber, totalBoxes);

      // 5. Audit Trail (Bottom left with EST time)
      this.drawAuditTrail(pdf, labelData, contentX, y + height - padding - 8);

    } catch (error) {
      console.error('Error drawing label components:', error);
      // Draw error message instead
      pdf.setFontSize(8);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Error', contentX + 5, contentY + 20);
    }
  }

  /**
   * Draw product name with optimal font sizing
   * @param {jsPDF} pdf - PDF document
   * @param {string} productName - Product name
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Available width
   * @param {number} height - Available height
   */
  static async drawProductName(pdf, productName, x, y, width, height) {
    if (!productName) return;

    // Calculate optimal font size
    const fontSize = LabelFormatter.autoFitFontSize(productName, width, height, 18);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(fontSize);
    pdf.setTextColor(0, 0, 0);

    // Handle text wrapping
    const lines = pdf.splitTextToSize(productName, width);
    const lineHeight = fontSize * 1.1;
    
    // Center the text block vertically within available height
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
   * Draw hyphenated barcode display
   * @param {jsPDF} pdf - PDF document
   * @param {string} barcodeDisplay - Formatted barcode for display
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Available width
   */
  static drawBarcodeDisplay(pdf, barcodeDisplay, x, y, width) {
    if (!barcodeDisplay) return;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(102, 102, 102); // Gray color

    const textWidth = pdf.getTextWidth(barcodeDisplay);
    const centerX = x + (width - textWidth) / 2;
    pdf.text(barcodeDisplay, centerX, y + 8);
  }

  /**
   * Draw scannable barcode using canvas method (NO TEXT EVER)
   * @param {jsPDF} pdf - PDF document
   * @param {string} barcodeValue - Barcode value
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Barcode width
   * @param {number} height - Barcode height
   */
  static async drawBarcode(pdf, barcodeValue, x, y, width, height) {
    if (!barcodeValue) return;

    try {
      // Clean the barcode value (remove hyphens for scanning)
      const cleanBarcodeValue = barcodeValue.replace(/[^A-Za-z0-9]/g, '');
      
      // Validate barcode
      const validation = BarcodeGenerator.validateCode39(cleanBarcodeValue);
      if (!validation.isValid) {
        console.warn('Invalid barcode:', validation.error);
        this.drawBarcodeError(pdf, x, y, width, height);
        return;
      }

      // Create a temporary canvas to generate barcode without any text
      const canvas = document.createElement('canvas');
      canvas.width = width * 2; // Higher resolution
      canvas.height = height * 2;
      
      // Use JsBarcode directly on canvas with NO text
      const JsBarcode = (await import('jsbarcode')).default;
      
      JsBarcode(canvas, validation.cleanValue, {
        format: 'CODE39',
        width: 3,
        height: height * 2,
        displayValue: false,  // NO TEXT
        margin: 0,           // NO MARGINS
        background: '#ffffff',
        lineColor: '#000000'
      });

      // Convert canvas to data URL and add to PDF
      const barcodeDataURL = canvas.toDataURL('image/png');
      pdf.addImage(barcodeDataURL, 'PNG', x, y, width, height);

    } catch (error) {
      console.error('Barcode generation error:', error);
      this.drawBarcodeError(pdf, x, y, width, height);
    }
  }

  /**
   * Draw barcode error placeholder
   * @param {jsPDF} pdf - PDF document
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   */
  static drawBarcodeError(pdf, x, y, width, height) {
    pdf.setDrawColor(255, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, y, width, height);
    
    pdf.setFontSize(6);
    pdf.setTextColor(255, 0, 0);
    pdf.text('Barcode Error', x + 2, y + height / 2);
  }

  /**
   * Draw right side information with moderately larger side-by-side boxes
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Available width
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total boxes
   */
  static drawRightSideInfo(pdf, labelData, x, y, width, boxNumber, totalBoxes) {
    // Position everything to the far right
    const rightAlignX = x + width - 90; // 90pt from right edge
    let currentY = y;

    // Harvest Date - Bold and right-aligned
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(0, 0, 0);
    const harvestText = `Harvest: ${labelData.harvestDate || 'MM/DD/YYYY'}`;
    const harvestWidth = pdf.getTextWidth(harvestText);
    pdf.text(harvestText, rightAlignX + 90 - harvestWidth, currentY + 7);

    currentY += 12;

    // Packaged Date - Normal weight and right-aligned
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    const packagedText = `Packaged: ${labelData.packagedDate || 'MM/DD/YYYY'}`;
    const packagedWidth = pdf.getTextWidth(packagedText);
    pdf.text(packagedText, rightAlignX + 90 - packagedWidth, currentY + 7);

    // MODERATELY LARGER BOXES - 1.5x size increase (side by side)
    const boxWidth = 60;          // 1.5x larger (was 40pt, now 60pt)
    const boxHeight = 18;         // 1.5x larger (was 12pt, now 18pt)
    const boxGap = 3;             // Slightly larger gap (was 2pt, now 3pt)
    
    // Position for both boxes side by side
    const box1X = rightAlignX + 90 - (boxWidth * 2) - boxGap; // Left box (Case Qty)
    const box2X = rightAlignX + 90 - boxWidth; // Right box (Box X/X)
    const boxY = y + 42;          // Positioned lower to accommodate larger size

    // Case Qty Box - MODERATELY LARGER
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.rect(box1X, boxY, boxWidth, boxHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);           // Increased from 5pt to 8pt
    const caseQtyValue = labelData.caseQuantity || '___';
    const caseQtyText = `Case Qty: ${caseQtyValue}`;
    const caseQtyWidth = pdf.getTextWidth(caseQtyText);
    pdf.text(caseQtyText, box1X + (boxWidth - caseQtyWidth) / 2, boxY + (boxHeight / 2) + 3);

    // Box Number Box - MODERATELY LARGER  
    pdf.rect(box2X, boxY, boxWidth, boxHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);           // Increased from 5pt to 8pt
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    const boxTextWidth = pdf.getTextWidth(boxText);
    pdf.text(boxText, box2X + (boxWidth - boxTextWidth) / 2, boxY + (boxHeight / 2) + 3);
  }

  /**
   * Draw audit trail with EST timezone
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data with timestamp
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  static drawAuditTrail(pdf, labelData, x, y) {
    // Create EST timestamp
    const now = new Date();
    const estOffset = -5; // EST is UTC-5 (adjust for EDT if needed)
    const estTime = new Date(now.getTime() + (estOffset * 60 * 60 * 1000));
    
    const month = (estTime.getMonth() + 1).toString().padStart(2, '0');
    const day = estTime.getDate().toString().padStart(2, '0');
    const year = estTime.getFullYear().toString().slice(-2);
    const hours = estTime.getHours().toString().padStart(2, '0');
    const minutes = estTime.getMinutes().toString().padStart(2, '0');
    
    const auditString = `${month}/${day}/${year} ${hours}:${minutes} EST (${labelData.username || 'Unknown'})`;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5);
    pdf.setTextColor(102, 102, 102);
    pdf.text(auditString, x, y);
  }

  /**
   * Generate test PDF for verification
   * @returns {Promise<Blob>} - Test PDF blob
   */
  static async generateTestPDF() {
    const testData = [{
      sku: 'TEST-123',
      barcode: 'TEST123456',
      productName: 'Test Cannabis Product for Label Verification and Layout Testing',
      brand: 'Test Brand',
      enhancedData: {
        labelQuantity: 2,
        caseQuantity: '24',
        boxCount: '3',
        harvestDate: '01/15/2024',
        packagedDate: '02/20/2024'
      },
      user: 'TestUser'
    }];

    return this.generateLabels(testData, { debug: true });
  }

  /**
   * Calculate PDF dimensions and positions for debugging
   * @returns {Object} - Debug information
   */
  static getDebugInfo() {
    const specs = LabelFormatter.getLabelSpecs();
    const positions = [];

    for (let i = 0; i < specs.LABELS_PER_SHEET; i++) {
      positions.push(this.calculateUlineLabelPosition(i));
    }

    return {
      pageSize: { width: 612, height: 792 }, // 8.5" x 11" in points
      labelSpecs: specs,
      labelPositions: positions,
      totalLabelsPerSheet: specs.LABELS_PER_SHEET,
      boxUpdates: {
        oldSize: { width: 40, height: 12 },
        newSize: { width: 60, height: 18 },
        increase: "1.5x larger (50% increase)",
        oldFont: "5pt",
        newFont: "8pt",
        layout: "Side by side (not stacked)"
      }
    };
  }

  /**
   * Validate PDF generation requirements
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

      if (validation.warnings.length > 0) {
        warnings.push(`Item ${index + 1}: ${validation.warnings.join(', ')}`);
      }

      const qty = parseInt(item.enhancedData?.labelQuantity || '1');
      totalLabels += qty;
    });

    if (totalLabels > 500) {
      warnings.push(`Large number of labels (${totalLabels}) may take significant time to generate`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalLabels,
      estimatedPages: LabelFormatter.calculatePagesNeeded(totalLabels)
    };
  }
}