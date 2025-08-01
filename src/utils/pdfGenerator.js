import jsPDF from 'jspdf';
import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generation utilities for Uline S-12212 label sheets (4" × 6")
 * MANUAL ROTATION APPROACH: Position rotated text manually without transformation matrices
 * Final result: Content flows horizontally across 6" width when paper is rotated 90° clockwise
 */
export class PDFGenerator {
  /**
   * Generate PDF with labels positioned for Uline S-12212 sheets
   * @param {Array} labelDataArray - Array of label data objects
   * @param {Object} options - Generation options
   * @returns {Promise<Blob>} - PDF blob
   */
  static async generateLabels(labelDataArray, options = {}) {
    const {
      format = 'legal',
      orientation = 'portrait',
      debug = false,
      currentUser = 'Unknown'
    } = options;

    // Legal size sheets for S-12212 (8.5" × 14")
    const pdf = new jsPDF({
      orientation: 'portrait',
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
          labelData.user || currentUser
        );

        // Generate the number of labels specified
        for (let labelCopy = 0; labelCopy < formattedData.labelQuantity; labelCopy++) {
          // Check if we need a new page (4 labels per sheet)
          if (currentLabelIndex > 0 && currentLabelIndex % specs.LABELS_PER_SHEET === 0) {
            pdf.addPage();
            currentPage++;
          }

          // Calculate position for this label
          const position = this.calculateUlineS12212Position(currentLabelIndex % specs.LABELS_PER_SHEET);

          // Calculate which box number this label represents
          const boxNumber = Math.floor(labelCopy / Math.max(1, Math.floor(formattedData.labelQuantity / formattedData.boxCount))) + 1;

          // Draw the label with MANUAL ROTATION
          await this.drawManuallyRotatedLabel(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
      }

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-12212 Format Labels (Manual Rotation for 6" Width)',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v7.0.0',
        keywords: 'cannabis, inventory, labels, uline, s-12212, manual-rotation, 6inch'
      });

      // Log generation event
      storage.addSessionEvent(
        EVENT_TYPES.LABEL_GENERATED,
        `Generated ${currentLabelIndex} S-12212 labels with manual rotation across ${currentPage} pages`,
        `Items: ${labelDataArray.length}, Format: Uline S-12212 (Manual Rotation for 6" Width)`
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
   * Calculate label position for Uline S-12212 positioned sideways on legal paper
   * @param {number} labelIndex - Index of label (0-3 for 4 labels per sheet)
   * @returns {Object} - Position coordinates in points
   */
  static calculateUlineS12212Position(labelIndex) {
    // Legal size sheet dimensions (8.5" × 14")
    const pageWidth = 612;   // 8.5" in points  
    const pageHeight = 1008; // 14" in points
    
    // HP E877 printer margins: 0.167" on all sides
    const printerMargin = 12; // 0.167" = 12pt
    const printableWidth = pageWidth - (printerMargin * 2);   // 588pt
    const printableHeight = pageHeight - (printerMargin * 2); // 984pt
    
    // S-12212 labels: 4" × 6" = When positioned sideways: 4" tall × 6" wide
    const labelWidth = 288;  // 4" in points (will be height when rotated)
    const labelHeight = 432; // 6" in points (will be width when rotated)
    
    // Grid layout: 2 columns × 2 rows of sideways labels
    const cols = 2;
    const rows = 2;
    const row = Math.floor(labelIndex / cols);
    const col = labelIndex % cols;
    
    // Calculate spacing
    const totalLabelsWidth = cols * labelWidth;   // 576pt
    const totalLabelsHeight = rows * labelHeight; // 864pt
    
    // Center on page
    const startX = printerMargin + (printableWidth - totalLabelsWidth) / 2;
    const startY = printerMargin + (printableHeight - totalLabelsHeight) / 2;
    
    // Individual label position
    const xPos = startX + (col * labelWidth);
    const yPos = startY + (row * labelHeight);
    
    return {
      x: Math.floor(xPos),
      y: Math.floor(yPos),
      width: labelWidth,   // 288pt (4" - will be height when rotated)
      height: labelHeight, // 432pt (6" - will be width when rotated)
      
      // Information for when paper is rotated
      rotatedWidth: labelHeight,  // 432pt (6" wide when rotated)
      rotatedHeight: labelWidth,  // 288pt (4" tall when rotated)
      
      // Grid information
      row: row,
      col: col,
      labelIndex: labelIndex,
      
      // Layout info
      isSideways: true,
      requiresRotation: true,
      manualRotation: true, // NEW: Using manual rotation positioning
      rotationInstructions: 'Rotate paper 90° clockwise to read labels optimized for 6" width'
    };
  }

  /**
   * Draw label with MANUAL ROTATION - no transformation matrices
   * Position each element manually to create the effect of 90° rotation
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Formatted label data
   * @param {Object} position - Label position and dimensions
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total number of boxes
   * @param {boolean} debug - Show debug borders
   * @param {string} currentUser - Current user
   */
  static async drawManuallyRotatedLabel(pdf, labelData, position, boxNumber = 1, totalBoxes = 1, debug = false, currentUser = 'Unknown') {
    const { x, y, width, height } = position;

    try {
      // Draw label border
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(1);
      pdf.rect(x, y, width, height);

      // Debug info
      if (debug) {
        pdf.setDrawColor(255, 0, 0);
        pdf.setLineWidth(0.5);
        pdf.rect(x + 2, y + 2, width - 4, height - 4);
        
        pdf.setFontSize(8);
        pdf.setTextColor(255, 0, 0);
        pdf.text(`L${position.labelIndex + 1} MANUAL`, x + 5, y + 15, { angle: 90 });
      }

      const padding = 10;
      const contentX = x + padding;
      const contentY = y + padding;
      const contentWidth = width - (padding * 2);    // 268pt
      const contentHeight = height - (padding * 2);  // 412pt

      const brandInfo = this.extractBrandFromProductName(labelData.productName);

      // When paper is rotated 90° clockwise, the layout should look like:
      // [Brand + Product] [Store] [Barcode|Dates|Case] [Audit]
      // flowing horizontally across the 6" width

      // In PDF coordinates (before paper rotation):
      // Top section = Left when rotated (Brand + Product)
      // Middle-top = Center-left when rotated (Store)  
      // Middle-bottom = Center-right when rotated (Bottom info)
      // Bottom = Right when rotated (Audit)

      // Section widths when rotated (heights in PDF coordinates)
      const brandProductHeight = Math.floor(contentHeight * 0.40); // 165pt
      const storeHeight = Math.floor(contentHeight * 0.25);        // 103pt  
      const bottomInfoHeight = Math.floor(contentHeight * 0.30);   // 124pt
      const auditHeight = contentHeight - brandProductHeight - storeHeight - bottomInfoHeight; // Remaining

      // Draw sections
      await this.drawRotatedBrandProduct(pdf, brandInfo, contentX, contentY, contentWidth, brandProductHeight);
      
      this.drawRotatedStore(pdf, contentX, contentY + brandProductHeight, contentWidth, storeHeight);
      
      await this.drawRotatedBottomInfo(pdf, labelData, contentX, contentY + brandProductHeight + storeHeight, contentWidth, bottomInfoHeight, boxNumber, totalBoxes);
      
      this.drawRotatedAudit(pdf, currentUser, contentX, contentY + brandProductHeight + storeHeight + bottomInfoHeight, contentWidth, auditHeight);

    } catch (error) {
      console.error('Error drawing manually rotated label:', error);
      pdf.setFontSize(10);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Error', x + 5, y + 20);
    }
  }

  /**
   * Draw brand and product section (top of rotated view = left in PDF)
   */
  static async drawRotatedBrandProduct(pdf, brandInfo, x, y, width, height) {
    // Start from top of this section, text flows down (which becomes left-to-right when rotated)
    let currentY = y + 20;
    const textX = x + 15; // Left margin

    // Brand name (large)
    if (brandInfo.brand) {
      const brandFontSize = Math.min(28, Math.max(16, 30 - Math.floor(brandInfo.brand.length / 4)));
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(brandFontSize);
      pdf.setTextColor(0, 0, 0);
      
      pdf.text(brandInfo.brand, textX, currentY, { angle: 90 });
      currentY += brandFontSize + 15;
    }

    // Product name (large, may wrap)
    const maxProductFontSize = brandInfo.brand ? 24 : 28;
    const productFontSize = Math.min(maxProductFontSize, Math.max(16, maxProductFontSize - Math.floor(brandInfo.productName.length / 6)));
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(productFontSize);
    pdf.setTextColor(0, 0, 0);
    
    // For rotated text, we need to consider the available height for text flow
    const availableHeight = height - (currentY - y) - 20;
    const maxLineWidth = availableHeight - 20;
    
    // Split text if needed
    const words = brandInfo.productName.split(' ');
    let currentLine = '';
    let lines = [];
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = pdf.getTextWidth(testLine);
      
      if (testWidth <= maxLineWidth || currentLine === '') {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);

    // Draw each line
    lines.forEach((line, index) => {
      if (currentY + (productFontSize * 1.2) < y + height - 10) {
        pdf.text(line, textX, currentY, { angle: 90 });
        currentY += productFontSize * 1.2;
      }
    });
  }

  /**
   * Draw store section (center-left of rotated view)
   */
  static drawRotatedStore(pdf, x, y, width, height) {
    const centerY = y + (height / 2);
    const textX = x + 20;
    
    // "Store:" label
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Store:', textX, centerY - 40, { angle: 90 });
    
    // Store text box - need to position for rotated view
    const boxWidth = width - 40;
    const boxHeight = 50;
    const boxX = x + 10;
    const boxY = centerY - 10;
    
    // Main box
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(boxX, boxY, boxWidth, boxHeight);

    // Writing lines
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.5);
    
    const numLines = 3;
    for (let i = 1; i < numLines; i++) {
      const lineY = boxY + (i * (boxHeight / numLines));
      pdf.line(boxX + 3, lineY, boxX + boxWidth - 3, lineY);
    }
  }

  /**
   * Draw bottom info section (center-right of rotated view)
   */
  static async drawRotatedBottomInfo(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    // Divide into 3 rows (which become 3 columns when rotated)
    const rowHeight = height / 3;

    // Row 1: Barcode
    await this.drawRotatedBarcodeRow(pdf, labelData, x, y, width, rowHeight);
    
    // Row 2: Dates  
    this.drawRotatedDatesRow(pdf, labelData, x, y + rowHeight, width, rowHeight);
    
    // Row 3: Case/Box
    this.drawRotatedCaseRow(pdf, labelData, x, y + (rowHeight * 2), width, rowHeight, boxNumber, totalBoxes);
  }

  /**
   * Draw barcode row (becomes left column when rotated)
   */
  static async drawRotatedBarcodeRow(pdf, labelData, x, y, width, height) {
    const centerY = y + (height / 2);
    const textX = x + 15;
    
    // Barcode numeric display
    const spacedBarcodeDisplay = this.formatBarcodeWithSpaces(labelData.barcodeDisplay);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(102, 102, 102);
    pdf.text(spacedBarcodeDisplay, textX, centerY - 30, { angle: 90 });
    
    // Barcode image - create and position for rotated view
    const barcodeHeight = Math.min(height - 40, 60);
    const barcodeWidth = Math.min(width - 30, 80);
    await this.drawEnhancedBarcode(pdf, labelData.barcode, x + 15, centerY - 10, barcodeWidth, barcodeHeight);
  }

  /**
   * Draw dates row (becomes center column when rotated)
   */
  static drawRotatedDatesRow(pdf, labelData, x, y, width, height) {
    const centerY = y + (height / 2);
    let textX = x + 15;
    
    // Harvest date
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Harvest:', textX, centerY - 25, { angle: 90 });
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const harvestDate = labelData.harvestDate || 'MM/DD/YY';
    pdf.text(harvestDate, textX, centerY + 5, { angle: 90 });
    
    textX += 35; // Move right for package date
    
    // Package date  
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Package:', textX, centerY - 25, { angle: 90 });
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const packageDate = labelData.packagedDate || 'MM/DD/YY';
    pdf.text(packageDate, textX, centerY + 5, { angle: 90 });
  }

  /**
   * Draw case row (becomes right column when rotated)
   */
  static drawRotatedCaseRow(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    const centerY = y + (height / 2);
    const textX = x + 15;
    
    // Case quantity box
    const boxWidth = width - 30;
    const boxHeight = 16;
    const boxX = x + 15;
    const caseBoxY = centerY - 20;
    
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(boxX, caseBoxY, boxWidth, boxHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    const caseQtyValue = labelData.caseQuantity || '___';
    const caseQtyText = `Case: ${caseQtyValue}`;
    pdf.text(caseQtyText, textX, caseBoxY + 12, { angle: 90 });
    
    // Box number box
    const boxBoxY = centerY + 5;
    pdf.rect(boxX, boxBoxY, boxWidth, boxHeight);
    
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    pdf.text(boxText, textX, boxBoxY + 12, { angle: 90 });
  }

  /**
   * Draw audit section (right edge of rotated view)
   */
  static drawRotatedAudit(pdf, currentUser, x, y, width, height) {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const year = now.getFullYear().toString().slice(-2);
    
    let hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = hours.toString();
    
    const minutes = now.getMinutes().toString().padStart(2, '0');
    
    const auditLine = `${month}/${day}/${year} ${hoursStr}:${minutes}${ampm} EST (${(currentUser || 'Unknown').substring(0, 8)})`;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(102, 102, 102);
    
    // Position at far right when rotated (bottom in PDF coordinates)
    pdf.text(auditLine, x + 10, y + 15, { angle: 90 });
  }

  /**
   * Enhanced barcode generation
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
        width: Math.max(2, Math.floor(width / 35)),
        height: height * 2,
        displayValue: false,
        margin: 0,
        background: '#ffffff',
        lineColor: '#000000'
      });

      const barcodeDataURL = canvas.toDataURL('image/png');
      pdf.addImage(barcodeDataURL, 'PNG', x, y, width, height);

    } catch (error) {
      console.error('Barcode generation error:', error);
      this.drawBarcodeError(pdf, x, y, width, height);
    }
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
    pdf.text('Barcode Error', x + 5, y + height / 2, { angle: 90 });
  }

  /**
   * Extract brand from product name
   */
  static extractBrandFromProductName(productName) {
    if (!productName) return { brand: '', productName: 'Product Name' };

    const brands = [
      'Curaleaf', 'Grassroots', 'Reef', 'B-Noble', 'Cresco', 'Rythm', 'GTI',
      'Verano', 'Aeriz', 'Revolution', 'Cookies', 'Jeeter', 'Raw Garden',
      'Stiiizy', 'Select', 'Heavy Hitters', 'Papa & Barkley', 'Kiva',
      'Wyld', 'Wana', 'Plus Products', 'Legion of Bloom', 'AbsoluteXtracts',
      'Matter', 'Pharmacann', 'Green Thumb', 'Columbia Care', 'Trulieve',
      'FIND'
    ];

    const trimmed = productName.trim();
    
    for (const brand of brands) {
      const regex = new RegExp(`^${brand}\\s+`, 'i');
      if (regex.test(trimmed)) {
        const remaining = trimmed.replace(regex, '').trim();
        return { brand: brand, productName: remaining || trimmed };
      }
    }

    const dashMatch = trimmed.match(/^([A-Za-z\s&'-]+?)\s*[-–:]\s*(.+)$/);
    if (dashMatch && dashMatch[1].length <= 25) {
      return { brand: dashMatch[1].trim(), productName: dashMatch[2].trim() };
    }

    return { brand: '', productName: trimmed };
  }

  /**
   * Format barcode display with spaces
   */
  static formatBarcodeWithSpaces(barcodeDisplay) {
    if (!barcodeDisplay) return '';
    return barcodeDisplay.replace(/-/g, ' ');
  }

  /**
   * Generate test PDF
   */
  static async generateTestPDF() {
    const testData = [{
      sku: 'TEST-S12212-MANUAL-ROT',
      barcode: 'TEST123456',
      productName: 'Curaleaf Pink Champagne Premium Cannabis Capsules [10mg THC] 30-Count',
      brand: 'Test Brand',
      enhancedData: {
        labelQuantity: 4,
        caseQuantity: '48',
        boxCount: '2',
        harvestDate: '01/15/25',
        packagedDate: '02/20/25'
      },
      user: 'TestUser'
    }];

    return this.generateLabels(testData, { debug: true, currentUser: 'TestUser' });
  }

  /**
   * Validation method
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
      estimatedPages: Math.ceil(totalLabels / 4),
      labelFormat: 'Uline S-12212 (Manual Rotation for 6" Width)',
      pageSize: 'Legal (8.5" × 14")',
      labelsPerPage: 4,
      contentLayout: 'Manual positioning with 90° text rotation',
      rotationNote: 'All text manually positioned and rotated 90° clockwise for optimal 6" width utilization',
      manualRotation: 'Enabled - No transformation matrices used'
    };
  }

  /**
   * Get debug information
   */
  static getDebugInfo() {
    const positions = [];
    for (let i = 0; i < 4; i++) {
      positions.push(this.calculateUlineS12212Position(i));
    }

    return {
      migration: 'Uline S-12212 Manual Rotation Approach',
      version: '7.0.0',
      approach: {
        method: 'Manual positioning of rotated elements',
        advantages: [
          'No transformation matrices',
          'Simple text rotation only',
          'Full jsPDF compatibility',
          'Predictable element positioning'
        ],
        textRotation: 'pdf.text(text, x, y, { angle: 90 })'
      },
      layoutMapping: {
        rotatedView: {
          left: 'Brand + Product Name (40%)',
          centerLeft: 'Store Section (25%)',
          centerRight: 'Barcode | Dates | Case (30%)',
          right: 'Audit Trail (5%)'
        },
        pdfCoordinates: {
          top: 'Brand + Product Name',
          upperMiddle: 'Store Section',
          lowerMiddle: 'Bottom Info',
          bottom: 'Audit Trail'
        }
      },
      positions: positions
    };
  }

  // Legacy compatibility methods
  static calculateUlineLabelPosition(labelIndex) {
    return this.calculateUlineS12212Position(labelIndex % 4);
  }

  static async drawSidewaysLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawManuallyRotatedLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }

  static async draw4LayerOptimizedLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawManuallyRotatedLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }
}