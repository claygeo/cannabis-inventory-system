import jsPDF from 'jspdf';
import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generation utilities for Uline S-5492 label sheets
 * CORRECTED LAYOUT: Content positioned for optimal rotated view
 * Maps content to appear correctly when paper is rotated 90° clockwise
 */
export class PDFGenerator {
  /**
   * Generate PDF with labels positioned for Uline S-5492 sheets (SIDEWAYS)
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

    // Legal size sheets for S-5492 (8.5" × 14") - labels positioned sideways
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
          // Check if we need a new page (S-5492 has 4 labels per sheet)
          if (currentLabelIndex > 0 && currentLabelIndex % specs.LABELS_PER_SHEET === 0) {
            pdf.addPage();
            currentPage++;
          }

          // Calculate position for this label (SIDEWAYS)
          const position = this.calculateUlineS5492PositionSideways(currentLabelIndex % specs.LABELS_PER_SHEET);

          // Calculate which box number this label represents
          const boxNumber = Math.floor(labelCopy / Math.max(1, Math.floor(formattedData.labelQuantity / formattedData.boxCount))) + 1;

          // Draw the sideways label with CORRECTED ROTATION MAPPING
          await this.drawSidewaysLabelCorrectedLayout(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
      }

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-5492 Format Labels (CORRECTED ROTATION MAPPING)',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v6.3.2',
        keywords: 'cannabis, inventory, labels, uline, s-5492, corrected, rotation, mapping'
      });

      // Log generation event
      storage.addSessionEvent(
        EVENT_TYPES.LABEL_GENERATED,
        `Generated ${currentLabelIndex} S-5492 labels with corrected rotation mapping across ${currentPage} pages`,
        `Items: ${labelDataArray.length}, Format: Uline S-5492 (Corrected Rotation Mapping)`
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
   * Calculate label position for Uline S-5492 positioned SIDEWAYS on legal paper
   * Container positioning remains unchanged - only content layout is corrected
   * @param {number} labelIndex - Index of label (0-3 for 4 labels per sheet)
   * @returns {Object} - Position coordinates in points
   */
  static calculateUlineS5492PositionSideways(labelIndex) {
    // Legal size sheet dimensions (8.5" × 14")
    const pageWidth = 612;   // 8.5" in points  
    const pageHeight = 1008; // 14" in points
    
    // HP E877 printer margins: 0.167" on all sides
    const printerMargin = 12; // 0.167" = 12pt
    const printableWidth = pageWidth - (printerMargin * 2);   // 588pt
    const printableHeight = pageHeight - (printerMargin * 2); // 984pt
    
    // S-5492 labels: 4" × 6" = When positioned sideways: 4" tall × 6" wide
    // In PDF coordinates (before rotation): height=4", width=6"
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
      rotationInstructions: 'Rotate paper 90° clockwise to read labels'
    };
  }

  /**
   * CORRECTED LAYOUT: Draw sideways label with properly mapped content for rotation
   * Content positioned to appear correctly when paper is rotated 90° clockwise
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Formatted label data
   * @param {Object} position - Label position and dimensions
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total number of boxes
   * @param {boolean} debug - Show debug borders
   * @param {string} currentUser - Current user
   */
  static async drawSidewaysLabelCorrectedLayout(pdf, labelData, position, boxNumber = 1, totalBoxes = 1, debug = false, currentUser = 'Unknown') {
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
        
        // Debug text
        pdf.setFontSize(8);
        pdf.setTextColor(255, 0, 0);
        pdf.text(`L${position.labelIndex + 1} CORRECTED`, x + 5, y + 15);
        pdf.text(`PDF: ${width}×${height}pt`, x + 5, y + 25);
        pdf.text('Rotated: 432×288pt', x + 5, y + 35);
      }

      const padding = 10;
      const contentX = x + padding;
      const contentY = y + padding;
      const contentWidth = width - (padding * 2);    // 268pt
      const contentHeight = height - (padding * 2);  // 412pt

      // CORRECTED COORDINATE MAPPING for 90° clockwise rotation
      // When paper is rotated 90° clockwise:
      // - PDF bottom becomes rotated left
      // - PDF top becomes rotated right  
      // - PDF left becomes rotated bottom
      // - PDF right becomes rotated top

      const brandInfo = this.extractBrandFromProductName(labelData.productName);

      // 1. AUDIT TRAIL: Should appear in TOP-LEFT of rotated view
      //    → Position at BOTTOM-LEFT of PDF coordinates
      await this.drawAuditTrailForRotation(pdf, currentUser, contentX + 5, contentY + contentHeight - 45);

      // 2. PRODUCT NAME: Should appear in TOP-CENTER/RIGHT of rotated view  
      //    → Position at BOTTOM-CENTER/RIGHT of PDF coordinates
      await this.drawProductNameForRotation(pdf, brandInfo, contentX + 50, contentY + contentHeight - 120, contentWidth - 50, 120);

      // 3. BARCODE: Should appear in BOTTOM-LEFT of rotated view
      //    → Position at TOP-LEFT of PDF coordinates  
      await this.drawBarcodeForRotation(pdf, labelData, contentX + 5, contentY + 5, 65, 80);

      // 4. STORE BOX: Should appear in BOTTOM-CENTER-LEFT of rotated view
      //    → Position at TOP-CENTER-LEFT of PDF coordinates
      this.drawStoreBoxForRotation(pdf, contentX + 75, contentY + 5, 60, 80);

      // 5. DATES: Should appear in BOTTOM-CENTER-RIGHT of rotated view  
      //    → Position at TOP-CENTER-RIGHT of PDF coordinates
      this.drawDatesForRotation(pdf, labelData, contentX + 140, contentY + 5, 65, 80);

      // 6. CASE/BOX: Should appear in BOTTOM-RIGHT of rotated view
      //    → Position at TOP-RIGHT of PDF coordinates
      this.drawCaseBoxForRotation(pdf, labelData, contentX + 210, contentY + 5, 55, 80, boxNumber, totalBoxes);

    } catch (error) {
      console.error('Error drawing corrected layout label:', error);
      pdf.setFontSize(10);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Error', x + 5, y + 20);
    }
  }

  /**
   * Draw audit trail positioned for top-left of rotated view (bottom-left of PDF)
   * @param {jsPDF} pdf - PDF document  
   * @param {string} currentUser - Current user
   * @param {number} x - X position in PDF coordinates
   * @param {number} y - Y position in PDF coordinates  
   */
  static async drawAuditTrailForRotation(pdf, currentUser, x, y) {
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
    
    // Compact audit info that will appear in top-left when rotated
    const auditLine = `${month}/${day}/${year} ${hoursStr}:${minutes}${ampm} (${(currentUser || 'Unknown').substring(0, 6)})`;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(102, 102, 102);
    pdf.text(auditLine, x, y);
  }

  /**
   * Draw product name positioned for top-center/right of rotated view (bottom of PDF)
   * @param {jsPDF} pdf - PDF document
   * @param {Object} brandInfo - Brand information  
   * @param {number} x - X position in PDF coordinates
   * @param {number} y - Y position in PDF coordinates
   * @param {number} width - Available width
   * @param {number} height - Available height
   */
  static async drawProductNameForRotation(pdf, brandInfo, x, y, width, height) {
    let currentY = y + height - 10; // Start from bottom and work up
    const lineSpacing = 1.2;

    // Draw brand name if present (will appear above product name when rotated)
    if (brandInfo.brand) {
      const brandFontSize = Math.min(20, LabelFormatter.autoFitFontSize(brandInfo.brand, width, 25, 20));
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(brandFontSize);
      pdf.setTextColor(0, 0, 0);
      
      // Center the brand text
      const brandWidth = pdf.getTextWidth(brandInfo.brand);
      const brandX = x + (width - brandWidth) / 2;
      pdf.text(brandInfo.brand, brandX, currentY);
      currentY -= brandFontSize * lineSpacing + 8; // Move up
    }

    // Draw product name (will appear below brand when rotated)
    const remainingHeight = Math.max(25, currentY - y);
    const maxProductFontSize = brandInfo.brand ? 28 : 32;
    
    const productFontSize = Math.min(maxProductFontSize, LabelFormatter.autoFitFontSize(
      brandInfo.productName, 
      width, 
      remainingHeight, 
      maxProductFontSize
    ));
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(productFontSize);
    pdf.setTextColor(0, 0, 0);
    
    const productLines = pdf.splitTextToSize(brandInfo.productName, width);
    
    // Position lines from bottom up
    let tempY = currentY;
    for (let i = productLines.length - 1; i >= 0; i--) {
      const line = productLines[i];
      const textWidth = pdf.getTextWidth(line);
      const centerX = x + (width - textWidth) / 2;
      pdf.text(line, centerX, tempY);
      tempY -= productFontSize * lineSpacing;
    }
  }

  /**
   * Draw barcode positioned for bottom-left of rotated view (top-left of PDF)
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position in PDF coordinates
   * @param {number} y - Y position in PDF coordinates
   * @param {number} width - Available width  
   * @param {number} height - Available height
   */
  static async drawBarcodeForRotation(pdf, labelData, x, y, width, height) {
    // Barcode numeric display above barcode
    const spacedBarcodeDisplay = this.formatBarcodeWithSpaces(labelData.barcodeDisplay);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(102, 102, 102);
    const displayWidth = pdf.getTextWidth(spacedBarcodeDisplay);
    const displayX = x + Math.max(0, (width - displayWidth) / 2);
    pdf.text(spacedBarcodeDisplay, displayX, y + 12);
    
    // Barcode image
    const barcodeHeight = Math.min(height - 20, 50);
    await this.drawEnhancedBarcode(
      pdf, 
      labelData.barcode, 
      x, 
      y + 15, 
      width, 
      barcodeHeight
    );
  }

  /**
   * Draw store box positioned for bottom-center-left of rotated view (top-center-left of PDF)
   * @param {jsPDF} pdf - PDF document
   * @param {number} x - X position in PDF coordinates
   * @param {number} y - Y position in PDF coordinates  
   * @param {number} width - Available width
   * @param {number} height - Available height
   */
  static drawStoreBoxForRotation(pdf, x, y, width, height) {
    // "Store:" label
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Store:', x, y + 12);
    
    // Text box with lines
    const boxHeight = Math.min(height - 20, 55);
    const boxY = y + 16;
    
    // Main box
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, boxY, width, boxHeight);

    // Writing lines
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.5);
    
    const numLines = 4;
    for (let i = 1; i < numLines; i++) {
      const lineY = boxY + (i * (boxHeight / numLines));
      pdf.line(x + 2, lineY, x + width - 2, lineY);
    }
  }

  /**
   * Draw dates positioned for bottom-center-right of rotated view (top-center-right of PDF)
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position in PDF coordinates
   * @param {number} y - Y position in PDF coordinates
   * @param {number} width - Available width
   * @param {number} height - Available height
   */
  static drawDatesForRotation(pdf, labelData, x, y, width, height) {
    let currentY = y + 12;
    
    // Harvest Date
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Harvest:', x, currentY);
    currentY += 12;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const harvestDate = labelData.harvestDate || 'MM/DD/YY';
    pdf.text(harvestDate, x, currentY);
    currentY += 18;
    
    // Package Date
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('Package:', x, currentY);
    currentY += 12;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const packageDate = labelData.packagedDate || 'MM/DD/YY';
    pdf.text(packageDate, x, currentY);
  }

  /**
   * Draw case/box positioned for bottom-right of rotated view (top-right of PDF)
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position in PDF coordinates
   * @param {number} y - Y position in PDF coordinates
   * @param {number} width - Available width
   * @param {number} height - Available height
   * @param {number} boxNumber - Box number
   * @param {number} totalBoxes - Total boxes
   */
  static drawCaseBoxForRotation(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    let currentY = y + 12;
    const boxHeight = 14;
    
    // Case Qty Box
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, currentY, width, boxHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);
    const caseQtyValue = labelData.caseQuantity || '___';
    const caseQtyText = `Case: ${caseQtyValue}`;
    const caseQtyWidth = pdf.getTextWidth(caseQtyText);
    pdf.text(caseQtyText, x + (width - caseQtyWidth) / 2, currentY + 10);
    
    currentY += boxHeight + 8;
    
    // Box Number Box
    pdf.rect(x, currentY, width, boxHeight);
    
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    const boxTextWidth = pdf.getTextWidth(boxText);
    pdf.text(boxText, x + (width - boxTextWidth) / 2, currentY + 10);
  }

  /**
   * Extract brand from product name (enhanced)
   * @param {string} productName - Full product name
   * @returns {Object} - Brand and remaining product name
   */
  static extractBrandFromProductName(productName) {
    if (!productName) return { brand: '', productName: 'Product Name' };

    const brands = [
      'Curaleaf', 'Grassroots', 'Reef', 'B-Noble', 'Cresco', 'Rythm', 'GTI',
      'Verano', 'Aeriz', 'Revolution', 'Cookies', 'Jeeter', 'Raw Garden',
      'Stiiizy', 'Select', 'Heavy Hitters', 'Papa & Barkley', 'Kiva',
      'Wyld', 'Wana', 'Plus Products', 'Legion of Bloom', 'AbsoluteXtracts',
      'Matter', 'Pharmacann', 'Green Thumb', 'Columbia Care', 'Trulieve'
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
   * Draw enhanced scannable barcode
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
        width: Math.max(2, Math.floor(width / 40)),
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
    pdf.text('Barcode Error', x + 5, y + height / 2);
  }

  /**
   * Generate test PDF for S-5492 corrected layout verification
   * @returns {Promise<Blob>} - Test PDF blob
   */
  static async generateTestPDF() {
    const testData = [{
      sku: 'TEST-S5492-CORRECTED',
      barcode: 'TEST123456',
      productName: 'Curaleaf Pink Champagne Premium Cannabis Capsules [10mg THC] 30-Count Test Product',
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
   * Generate alignment test PDF showing corrected layout mapping
   * @returns {Promise<Blob>} - Test PDF with corrected layout
   */
  static async generateAlignmentTestPDF() {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [612, 1008]
    });

    // Draw page outline
    pdf.setDrawColor(0, 0, 255);
    pdf.setLineWidth(1);
    pdf.rect(0, 0, 612, 1008);
    
    // Draw printable area
    pdf.setDrawColor(0, 255, 0);
    pdf.setLineWidth(1);
    pdf.rect(12, 12, 588, 984);

    // Title
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('S-5492 CORRECTED ROTATION MAPPING Test', 50, 30);

    // Draw all 4 label positions with corrected layout indicators
    for (let i = 0; i < 4; i++) {
      const pos = this.calculateUlineS5492PositionSideways(i);
      
      // Label outline
      pdf.setDrawColor(255, 0, 0);
      pdf.setLineWidth(2);
      pdf.rect(pos.x, pos.y, pos.width, pos.height);
      
      // Position info
      pdf.setFontSize(10);
      pdf.setTextColor(255, 0, 0);
      pdf.text(`Label ${i + 1} - CORRECTED MAPPING`, pos.x + 5, pos.y + 15);
      pdf.text(`PDF: ${pos.width}×${pos.height}pt`, pos.x + 5, pos.y + 28);
      pdf.text('Rotated view: 432×288pt', pos.x + 5, pos.y + 41);
      
      // Show content zones
      pdf.setDrawColor(0, 128, 255);
      pdf.setLineWidth(1);
      
      // Top area (will be bottom when rotated) - Product Name
      pdf.rect(pos.x + 50, pos.y + pos.height - 120, pos.width - 55, 115);
      pdf.setFontSize(8);
      pdf.text('Product Name Area', pos.x + 60, pos.y + pos.height - 60);
      
      // Bottom area (will be top when rotated) - Controls
      pdf.rect(pos.x + 5, pos.y + 5, pos.width - 10, 85);
      pdf.text('Controls Area', pos.x + 15, pos.y + 50);
      
      // Left area (will be right when rotated) - Audit
      pdf.rect(pos.x + 5, pos.y + pos.height - 50, 40, 45);
      pdf.text('Audit', pos.x + 10, pos.y + pos.height - 25);
    }

    // Corrected layout instructions
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('CORRECTED ROTATION MAPPING:', 50, 80);
    pdf.setFontSize(10);
    pdf.text('1. Content positioned to appear correctly when paper rotated 90°', 50, 95);
    pdf.text('2. Audit Trail: Top-left when rotated (bottom-left in PDF)', 50, 110);
    pdf.text('3. Product Name: Top-center/right when rotated (bottom-center/right in PDF)', 50, 125);
    pdf.text('4. Controls: Bottom row when rotated (top row in PDF)', 50, 140);
    pdf.text('5. Layout: Barcode | Store | Dates | Case/Box (left to right when rotated)', 50, 155);

    return pdf.output('blob');
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
      labelFormat: 'S-5492 (CORRECTED ROTATION MAPPING)',
      pageSize: 'Legal (8.5" × 14")',
      labelsPerPage: 4,
      contentLayout: 'Content positioned for optimal rotated view',
      rotationNote: 'Labels positioned sideways - rotate paper 90° clockwise for optimal layout'
    };
  }

  /**
   * Get debug information
   */
  static getDebugInfo() {
    const positions = [];
    for (let i = 0; i < 4; i++) {
      positions.push(this.calculateUlineS5492PositionSideways(i));
    }

    return {
      migration: 'S-5492 CORRECTED ROTATION MAPPING',
      version: '6.3.2',
      rotationMapping: {
        concept: 'Content positioned in PDF to appear correctly when paper rotated 90° clockwise',
        auditTrail: 'Bottom-left in PDF → Top-left when rotated',
        productName: 'Bottom-center/right in PDF → Top-center/right when rotated',
        barcode: 'Top-left in PDF → Bottom-left when rotated',
        storeBox: 'Top-center-left in PDF → Bottom-center-left when rotated',
        dates: 'Top-center-right in PDF → Bottom-center-right when rotated',
        caseBox: 'Top-right in PDF → Bottom-right when rotated'
      },
      coordinateTransform: {
        pdfDimensions: '288pt × 432pt (4" × 6")',
        rotatedDimensions: '432pt × 288pt (6" × 4")',
        transformType: 'Position mapping without PDF transformations',
        compatibility: 'All PDF viewers and printers'
      },
      layoutSpecs: {
        dimensions: '4" × 6" (positioned sideways)',
        orientation: 'SIDEWAYS containers with mapped content',
        labelsPerSheet: 4,
        layout: '2×2 grid of sideways labels',
        workflow: 'Print → Rotate paper 90° clockwise → Perfect layout'
      },
      positions: positions,
      technicalApproach: [
        'NO PDF transformation functions used',
        'Simple coordinate mapping based on rotation',
        'Content positioned at calculated PDF coordinates',
        'Appears correctly when paper physically rotated',
        'Compatible with all PDF viewers and printers'
      ]
    };
  }

  // Legacy compatibility
  static calculateUlineLabelPosition(labelIndex) {
    return this.calculateUlineS5492PositionSideways(labelIndex % 4);
  }

  // Backwards compatibility - redirect to corrected method
  static async drawSidewaysLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawSidewaysLabelCorrectedLayout(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }
}