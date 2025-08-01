import jsPDF from 'jspdf';
import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generation utilities for Uline S-12212 label sheets (4" × 6")
 * OPTIMIZED 4-LAYER LAYOUT WITH FULL ROTATION: Content rotated 90° clockwise for 6" width utilization
 * Layer 1: Brand + Product Name | Layer 2: Store | Layer 3: Barcode|Dates|Case | Layer 4: Audit
 * ALL CONTENT ROTATED 90° CLOCKWISE including text boxes and barcodes
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

          // Draw the label with FULLY ROTATED LAYOUT
          await this.drawFullyRotatedLabel(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
      }

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-12212 Format Labels (Fully Rotated Layout for 6" Width)',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v6.8.0',
        keywords: 'cannabis, inventory, labels, uline, s-12212, fully-rotated, 6inch, optimized'
      });

      // Log generation event
      storage.addSessionEvent(
        EVENT_TYPES.LABEL_GENERATED,
        `Generated ${currentLabelIndex} S-12212 labels with fully rotated layout across ${currentPage} pages`,
        `Items: ${labelDataArray.length}, Format: Uline S-12212 (Fully Rotated for 6" Width)`
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
      hasTextRotation: true,
      hasFullRotation: true, // NEW: Everything rotated
      rotationInstructions: 'Rotate paper 90° clockwise to read labels optimized for 6" width with fully rotated content'
    };
  }

  /**
   * Draw fully rotated label designed for 6" width utilization
   * ALL CONTENT ROTATED 90° CLOCKWISE - text, boxes, and barcodes
   * When paper is rotated 90° clockwise, content flows horizontally across 6" width
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Formatted label data
   * @param {Object} position - Label position and dimensions
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total number of boxes
   * @param {boolean} debug - Show debug borders
   * @param {string} currentUser - Current user
   */
  static async drawFullyRotatedLabel(pdf, labelData, position, boxNumber = 1, totalBoxes = 1, debug = false, currentUser = 'Unknown') {
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
        this.drawRotatedText(pdf, `L${position.labelIndex + 1} FULL-ROT`, x + 25, y + 15, 90);
      }

      const padding = 10;
      const contentX = x + padding;
      const contentY = y + padding;
      const contentWidth = width - (padding * 2);    // 268pt
      const contentHeight = height - (padding * 2);  // 412pt

      // For rotated layout, we work in the rotated coordinate system
      // The "width" becomes height when rotated, "height" becomes width
      const rotatedContentWidth = contentHeight;  // 412pt (flows horizontally when paper rotated)
      const rotatedContentHeight = contentWidth;  // 268pt (flows vertically when paper rotated)

      const brandInfo = this.extractBrandFromProductName(labelData.productName);

      // Calculate rotated sections (working in rotated coordinate system)
      // Section 1: Brand + Product (left 40% when rotated) = top 40% in PDF coordinates
      const section1Height = Math.floor(rotatedContentWidth * 0.40); // 165pt
      
      // Section 2: Store (next 25% when rotated) = next 25% in PDF coordinates  
      const section2Height = Math.floor(rotatedContentWidth * 0.25); // 103pt
      
      // Section 3: Bottom info (next 30% when rotated) = next 30% in PDF coordinates
      const section3Height = Math.floor(rotatedContentWidth * 0.30); // 124pt
      
      // Section 4: Audit (remaining 5% when rotated) = remaining in PDF coordinates
      const section4Height = rotatedContentWidth - section1Height - section2Height - section3Height;

      // Draw sections - positioned for 90° rotation
      await this.drawRotatedBrandAndProduct(pdf, brandInfo, contentX, contentY, section1Height, rotatedContentHeight);
      
      this.drawRotatedStoreSection(pdf, contentX, contentY + section1Height, section2Height, rotatedContentHeight);
      
      await this.drawRotatedBottomInfo(pdf, labelData, contentX, contentY + section1Height + section2Height, section3Height, rotatedContentHeight, boxNumber, totalBoxes);
      
      this.drawRotatedAuditTrail(pdf, currentUser, contentX, contentY + section1Height + section2Height + section3Height, section4Height, rotatedContentHeight);

    } catch (error) {
      console.error('Error drawing fully rotated label:', error);
      pdf.setFontSize(10);
      pdf.setTextColor(255, 0, 0);
      this.drawRotatedText(pdf, 'Label Error', x + 25, y + 15, 90);
    }
  }

  /**
   * Helper method to draw rotated text (90° clockwise)
   * @param {jsPDF} pdf - PDF document
   * @param {string} text - Text to draw
   * @param {number} x - X position
   * @param {number} y - Y position  
   * @param {number} angle - Rotation angle (90° clockwise)
   * @param {Object} options - Additional options
   */
  static drawRotatedText(pdf, text, x, y, angle = 90, options = {}) {
    const { 
      align = 'left',
      baseline = 'alphabetic',
      maxWidth = null
    } = options;

    try {
      if (maxWidth && pdf.getTextWidth(text) > maxWidth) {
        // Handle text wrapping for rotated text
        const lines = pdf.splitTextToSize(text, maxWidth);
        lines.forEach((line, index) => {
          const lineX = x + (index * (pdf.internal.getFontSize() + 2));
          pdf.text(line, lineX, y, { angle: angle, align: align, baseline: baseline });
        });
      } else {
        pdf.text(text, x, y, { angle: angle, align: align, baseline: baseline });
      }
    } catch (error) {
      console.error('Error drawing rotated text:', error);
      // Fallback to regular text if rotation fails
      pdf.text(text, x, y);
    }
  }

  /**
   * Draw rotated brand and product section
   * In rotated view: Top section with brand and product name
   * @param {jsPDF} pdf - PDF document
   * @param {Object} brandInfo - Brand information
   * @param {number} x - X position in PDF
   * @param {number} y - Y position in PDF
   * @param {number} sectionHeight - Height of section in PDF (width when rotated)
   * @param {number} sectionWidth - Width of section in PDF (height when rotated)
   */
  static async drawRotatedBrandAndProduct(pdf, brandInfo, x, y, sectionHeight, sectionWidth) {
    // When rotated 90°, text flows from left to right across the top
    // Start from the left edge of the rotated view
    let currentY = y + 20; // Starting Y position
    const textX = x + 10;   // X position for rotated text
    
    // Brand name (large, at top when rotated)
    if (brandInfo.brand) {
      const brandFontSize = Math.min(28, Math.max(16, 28 - Math.floor(brandInfo.brand.length / 3)));
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(brandFontSize);
      pdf.setTextColor(0, 0, 0);
      
      this.drawRotatedText(pdf, brandInfo.brand, textX, currentY, 90);
      currentY += brandFontSize + 10; // Move down for next text
    }

    // Product name (large, below brand when rotated)
    const maxProductFontSize = brandInfo.brand ? 24 : 30;
    const productFontSize = Math.min(maxProductFontSize, Math.max(14, maxProductFontSize - Math.floor(brandInfo.productName.length / 5)));
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(productFontSize);
    pdf.setTextColor(0, 0, 0);
    
    // For long product names, wrap text
    const maxLineWidth = sectionHeight - 40; // Account for margins
    const productLines = pdf.splitTextToSize(brandInfo.productName, maxLineWidth);
    
    productLines.forEach((line, index) => {
      if (currentY + (productFontSize * 1.2) < y + sectionHeight - 10) { // Check if we have space
        this.drawRotatedText(pdf, line, textX, currentY, 90);
        currentY += productFontSize * 1.2;
      }
    });
  }

  /**
   * Draw rotated store section
   * In rotated view: Middle section with "Store:" label and text box
   * @param {jsPDF} pdf - PDF document
   * @param {number} x - X position in PDF
   * @param {number} y - Y position in PDF
   * @param {number} sectionHeight - Height of section in PDF (width when rotated)
   * @param {number} sectionWidth - Width of section in PDF (height when rotated)
   */
  static drawRotatedStoreSection(pdf, x, y, sectionHeight, sectionWidth) {
    const centerY = y + (sectionHeight / 2);
    const textX = x + 15;
    
    // "Store:" label
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    this.drawRotatedText(pdf, 'Store:', textX, centerY - 30, 90);
    
    // Store text box - rotated 90°
    const boxWidth = sectionWidth - 40;  // Box width in PDF (height when rotated)
    const boxHeight = 60;                // Box height in PDF (width when rotated) 
    const boxX = x + 20;
    const boxY = centerY - 10;
    
    // Draw rotated box by rotating the coordinate system
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    
    // Main box
    pdf.rect(boxX, boxY, boxWidth, boxHeight);

    // Writing lines inside box
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.5);
    
    const numLines = 3;
    for (let i = 1; i < numLines; i++) {
      const lineY = boxY + (i * (boxHeight / numLines));
      pdf.line(boxX + 3, lineY, boxX + boxWidth - 3, lineY);
    }
  }

  /**
   * Draw rotated bottom information section
   * In rotated view: Bottom section with barcode, dates, and case info in 3 columns
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position in PDF
   * @param {number} y - Y position in PDF
   * @param {number} sectionHeight - Height of section in PDF (width when rotated)
   * @param {number} sectionWidth - Width of section in PDF (height when rotated)
   * @param {number} boxNumber - Box number
   * @param {number} totalBoxes - Total boxes
   */
  static async drawRotatedBottomInfo(pdf, labelData, x, y, sectionHeight, sectionWidth, boxNumber, totalBoxes) {
    // Divide into 3 columns when rotated (3 sections vertically in PDF)
    const columnHeight = sectionHeight / 3; // Each column height in PDF
    
    // Column 1: Barcode (left when rotated)
    await this.drawRotatedBarcodeColumn(pdf, labelData, x, y, columnHeight, sectionWidth);
    
    // Column 2: Dates (center when rotated)
    this.drawRotatedDatesColumn(pdf, labelData, x, y + columnHeight, columnHeight, sectionWidth);
    
    // Column 3: Case/Box (right when rotated)
    this.drawRotatedCaseColumn(pdf, labelData, x, y + (columnHeight * 2), columnHeight, sectionWidth, boxNumber, totalBoxes);
  }

  /**
   * Draw rotated barcode column
   */
  static async drawRotatedBarcodeColumn(pdf, labelData, x, y, columnHeight, columnWidth) {
    const centerY = y + (columnHeight / 2);
    const textX = x + 15;
    
    // Barcode numeric display - rotated
    const spacedBarcodeDisplay = this.formatBarcodeWithSpaces(labelData.barcodeDisplay);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(102, 102, 102);
    this.drawRotatedText(pdf, spacedBarcodeDisplay, textX, centerY - 40, 90);
    
    // Rotated barcode - create rotated barcode image
    const barcodeWidth = Math.min(columnWidth - 30, 80);
    const barcodeHeight = Math.min(columnHeight - 20, 60);
    await this.drawRotatedBarcode(pdf, labelData.barcode, x + 20, centerY - 10, barcodeWidth, barcodeHeight);
  }

  /**
   * Draw rotated dates column
   */
  static drawRotatedDatesColumn(pdf, labelData, x, y, columnHeight, columnWidth) {
    const centerY = y + (columnHeight / 2);
    let textX = x + 15;
    
    // Harvest date
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    this.drawRotatedText(pdf, 'Harvest:', textX, centerY - 30, 90);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const harvestDate = labelData.harvestDate || 'MM/DD/YY';
    this.drawRotatedText(pdf, harvestDate, textX, centerY - 10, 90);
    
    textX += 45; // Move right for package date
    
    // Package date
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    this.drawRotatedText(pdf, 'Package:', textX, centerY - 30, 90);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const packageDate = labelData.packagedDate || 'MM/DD/YY';
    this.drawRotatedText(pdf, packageDate, textX, centerY - 10, 90);
  }

  /**
   * Draw rotated case column
   */
  static drawRotatedCaseColumn(pdf, labelData, x, y, columnHeight, columnWidth, boxNumber, totalBoxes) {
    const centerY = y + (columnHeight / 2);
    const textX = x + 15;
    
    // Case quantity box - rotated
    const boxWidth = columnWidth - 30;
    const boxHeight = 18;
    const boxX = x + 15;
    const caseBoxY = centerY - 25;
    
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(boxX, caseBoxY, boxWidth, boxHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    const caseQtyValue = labelData.caseQuantity || '___';
    const caseQtyText = `Case: ${caseQtyValue}`;
    this.drawRotatedText(pdf, caseQtyText, textX, caseBoxY + 12, 90);
    
    // Box number box - rotated
    const boxBoxY = centerY + 5;
    pdf.rect(boxX, boxBoxY, boxWidth, boxHeight);
    
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    this.drawRotatedText(pdf, boxText, textX, boxBoxY + 12, 90);
  }

  /**
   * Draw rotated audit trail
   * In rotated view: Very bottom of label
   * @param {jsPDF} pdf - PDF document
   * @param {string} currentUser - Current user
   * @param {number} x - X position in PDF
   * @param {number} y - Y position in PDF
   * @param {number} sectionHeight - Height of section in PDF (width when rotated)
   * @param {number} sectionWidth - Width of section in PDF (height when rotated)
   */
  static drawRotatedAuditTrail(pdf, currentUser, x, y, sectionHeight, sectionWidth) {
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
    
    // Position at bottom when rotated (left side in PDF)
    this.drawRotatedText(pdf, auditLine, x + 5, y + 10, 90);
  }

  /**
   * Draw a rotated barcode
   * Creates barcode and rotates it 90° clockwise
   */
  static async drawRotatedBarcode(pdf, barcodeValue, x, y, width, height) {
    if (!barcodeValue) return;

    try {
      const cleanBarcodeValue = barcodeValue.replace(/[^A-Za-z0-9]/g, '');
      
      const validation = BarcodeGenerator.validateCode39(cleanBarcodeValue);
      if (!validation.isValid) {
        console.warn('Invalid barcode:', validation.error);
        this.drawRotatedBarcodeError(pdf, x, y, width, height);
        return;
      }

      // Create barcode canvas
      const canvas = document.createElement('canvas');
      // Swap dimensions for rotation
      canvas.width = height * 2;  // Barcode will be rotated
      canvas.height = width * 2;
      
      const JsBarcode = (await import('jsbarcode')).default;
      
      JsBarcode(canvas, validation.cleanValue, {
        format: 'CODE39',
        width: Math.max(2, Math.floor(height / 20)), // Adjusted for rotation
        height: width * 2,  // Adjusted for rotation
        displayValue: false,
        margin: 0,
        background: '#ffffff',
        lineColor: '#000000'
      });

      const barcodeDataURL = canvas.toDataURL('image/png');
      
      // Add rotated barcode image
      pdf.addImage(barcodeDataURL, 'PNG', x, y, width, height, '', '', 90); // 90° rotation

    } catch (error) {
      console.error('Rotated barcode generation error:', error);
      this.drawRotatedBarcodeError(pdf, x, y, width, height);
    }
  }

  /**
   * Draw rotated barcode error placeholder
   */
  static drawRotatedBarcodeError(pdf, x, y, width, height) {
    pdf.setDrawColor(255, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, y, width, height);
    
    pdf.setFontSize(8);
    pdf.setTextColor(255, 0, 0);
    this.drawRotatedText(pdf, 'Barcode Error', x + 5, y + height / 2, 90);
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
      'FIND' // Added FIND as mentioned
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
   * Generate test PDF with fully rotated layout
   */
  static async generateTestPDF() {
    const testData = [{
      sku: 'TEST-S12212-FULL-ROT',
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
      labelFormat: 'Uline S-12212 (Fully Rotated Layout for 6" Width)',
      pageSize: 'Legal (8.5" × 14")',
      labelsPerPage: 4,
      contentLayout: 'Fully Rotated: Brand+Product | Store | Barcode+Dates+Case | Audit (ALL CONTENT ROTATED 90°)',
      rotationNote: 'All content (text, boxes, barcodes) rotated 90° clockwise, optimized for 6" width when paper rotated 90° clockwise',
      fullRotation: 'Enabled - All content rotated including text boxes and barcodes'
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
      migration: 'Uline S-12212 Fully Rotated Layout',
      version: '6.8.0',
      fullRotation: {
        enabled: true,
        angle: '90° clockwise',
        method: 'Complete coordinate system rotation',
        includes: ['text', 'text boxes', 'barcodes', 'all elements'],
        compatibility: 'jsPDF native rotation functions only',
        description: 'All content rotated 90° clockwise for optimal 6" width utilization'
      },
      layoutStructure: {
        section1: 'Brand + Product Name (left 40% when rotated) - Large fonts with proper positioning',
        section2: 'Store Section (center 25% when rotated) - Rotated text box with lines',
        section3: 'Bottom Info (right 30% when rotated) - 3 columns: Barcode | Dates | Case/Box',
        section4: 'Audit Trail (far right 5% when rotated) - Small rotated text'
      },
      rotatedDimensions: {
        whenPaperRotated: '6" wide × 4" tall',
        sections: {
          brandProduct: '2.4" wide (40%)',
          store: '1.5" wide (25%)',
          bottomInfo: '1.8" wide (30%)',
          audit: '0.3" wide (5%)'
        }
      },
      positions: positions
    };
  }

  // Legacy compatibility
  static calculateUlineLabelPosition(labelIndex) {
    return this.calculateUlineS12212Position(labelIndex % 4);
  }

  // Main method aliases
  static async draw4LayerOptimizedLabelWithRotation(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawFullyRotatedLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }

  static async drawSidewaysLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawFullyRotatedLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }
}