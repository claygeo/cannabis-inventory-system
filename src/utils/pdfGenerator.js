import jsPDF from 'jspdf';
import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generation utilities for Uline S-12212 label sheets (4" × 6")
 * ROTATED TEXT OPTIMIZATION: All text rotated 90° clockwise for maximum space utilization
 * Larger fonts possible, especially for product names readable from far away
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

          // Draw the label with ALL TEXT ROTATED 90° CLOCKWISE
          await this.drawRotatedTextLabel(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
      }

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-12212 Format Labels (All Text Rotated 90° for Space Optimization)',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v7.2.0',
        keywords: 'cannabis, inventory, labels, uline, s-12212, rotated-text, optimized'
      });

      // Log generation event
      storage.addSessionEvent(
        EVENT_TYPES.LABEL_GENERATED,
        `Generated ${currentLabelIndex} S-12212 labels with rotated text optimization across ${currentPage} pages`,
        `Items: ${labelDataArray.length}, Format: Uline S-12212 (All Text Rotated 90° for Optimization)`
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
   * Calculate label position for Uline S-12212 on legal paper
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
    
    // S-12212 labels: 4" × 6" 
    const labelWidth = 288;  // 4" in points
    const labelHeight = 432; // 6" in points
    
    // Grid layout: 2 columns × 2 rows
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
      width: labelWidth,   // 288pt (4")
      height: labelHeight, // 432pt (6")
      
      // Layout information
      row: row,
      col: col,
      labelIndex: labelIndex,
      
      // Optimization info
      textRotation: 90, // All text rotated 90° clockwise
      spaceOptimization: true,
      readableFromDistance: true
    };
  }

  /**
   * Draw label with ALL TEXT ROTATED 90° CLOCKWISE for space optimization
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Formatted label data
   * @param {Object} position - Label position and dimensions
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total number of boxes
   * @param {boolean} debug - Show debug borders
   * @param {string} currentUser - Current user
   */
  static async drawRotatedTextLabel(pdf, labelData, position, boxNumber = 1, totalBoxes = 1, debug = false, currentUser = 'Unknown') {
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
        pdf.text(`L${position.labelIndex + 1} ROT-TXT`, x + 5, y + 15, { angle: 90 });
      }

      const padding = 10;
      const contentX = x + padding;
      const contentY = y + padding;
      const contentWidth = width - (padding * 2);    // 268pt
      const contentHeight = height - (padding * 2);  // 412pt

      const brandInfo = this.extractBrandFromProductName(labelData.productName);

      // Layout sections (all text will be rotated 90° clockwise)
      // Section 1: Brand + Product Name (40% of height)
      const section1Height = Math.floor(contentHeight * 0.40); // 165pt
      await this.drawBrandProductRotated(pdf, brandInfo, contentX, contentY, contentWidth, section1Height);

      // Section 2: Store (25% of height)
      const section2Y = contentY + section1Height;
      const section2Height = Math.floor(contentHeight * 0.25); // 103pt
      this.drawStoreRotated(pdf, contentX, section2Y, contentWidth, section2Height);

      // Section 3: Bottom info (30% of height)
      const section3Y = section2Y + section2Height;
      const section3Height = Math.floor(contentHeight * 0.30); // 124pt
      await this.drawBottomInfoRotated(pdf, labelData, contentX, section3Y, contentWidth, section3Height, boxNumber, totalBoxes);

      // Section 4: Audit Trail (5% of height)
      const section4Y = section3Y + section3Height;
      const section4Height = contentHeight - section1Height - section2Height - section3Height;
      this.drawAuditRotated(pdf, currentUser, contentX, section4Y, contentWidth, section4Height);

    } catch (error) {
      console.error('Error drawing rotated text label:', error);
      pdf.setFontSize(10);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Error', x + 5, y + 20);
    }
  }

  /**
   * Draw brand and product section with rotated text (90° clockwise)
   */
  static async drawBrandProductRotated(pdf, brandInfo, x, y, width, height) {
    // For 90° rotated text, we position from left side and text flows to the right
    let currentX = x + 20; // Start position for rotated text
    const textY = y + height - 20; // Y position for rotated text baseline

    // Brand name (large, rotated 90° clockwise)
    if (brandInfo.brand) {
      const brandFontSize = Math.min(36, Math.max(20, 40 - Math.floor(brandInfo.brand.length / 3)));
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(brandFontSize);
      pdf.setTextColor(0, 0, 0);
      
      pdf.text(brandInfo.brand, currentX, textY, { angle: 90 });
      currentX += brandFontSize + 20; // Move right for next text
    }

    // Product name (large, rotated 90° clockwise, may wrap)
    const remainingWidth = width - (currentX - x) - 20;
    const maxProductFontSize = brandInfo.brand ? 30 : 36;
    
    // Calculate optimal font size based on available space
    let productFontSize = maxProductFontSize;
    let productLines = [];
    
    // For rotated text, we need to consider how much vertical space each line takes
    const maxLines = Math.floor(remainingWidth / (maxProductFontSize + 5));
    
    // Try different font sizes to find best fit
    for (let fontSize = maxProductFontSize; fontSize >= 16; fontSize -= 2) {
      const words = brandInfo.productName.split(' ');
      let currentLine = '';
      let lines = [];
      
      words.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        // For rotated text, we check against available height
        if (testLine.length * fontSize * 0.6 <= height - 40 || currentLine === '') {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      });
      if (currentLine) lines.push(currentLine);
      
      if (lines.length <= maxLines) {
        productFontSize = fontSize;
        productLines = lines;
        break;
      }
    }
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(productFontSize);
    pdf.setTextColor(0, 0, 0);
    
    // Draw each line rotated
    productLines.forEach((line, index) => {
      if (currentX + (productFontSize + 5) < x + width - 10) {
        pdf.text(line, currentX, textY, { angle: 90 });
        currentX += productFontSize + 8;
      }
    });
  }

  /**
   * Draw store section with rotated text
   */
  static drawStoreRotated(pdf, x, y, width, height) {
    const textX = x + 20;
    const textY = y + height - 20;
    
    // "Store:" label rotated 90° clockwise
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18); // Larger for better visibility
    pdf.setTextColor(0, 0, 0);
    pdf.text('Store:', textX, textY, { angle: 90 });
    
    // Store text box
    const boxWidth = width - 60;
    const boxHeight = 60;
    const boxX = x + 50;
    const boxY = y + (height - boxHeight) / 2;
    
    // Main box
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(boxX, boxY, boxWidth, boxHeight);

    // Writing lines
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.5);
    
    const numLines = 4;
    for (let i = 1; i < numLines; i++) {
      const lineY = boxY + (i * (boxHeight / numLines));
      pdf.line(boxX + 5, lineY, boxX + boxWidth - 5, lineY);
    }
  }

  /**
   * Draw bottom info section with rotated text
   */
  static async drawBottomInfoRotated(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    // Divide into 3 columns for: Barcode | Dates | Case/Box
    const colWidth = width / 3;

    // Column 1: Barcode with rotated text
    await this.drawBarcodeColumnRotated(pdf, labelData, x, y, colWidth, height);
    
    // Column 2: Dates with rotated text
    this.drawDatesColumnRotated(pdf, labelData, x + colWidth, y, colWidth, height);
    
    // Column 3: Case/Box with rotated text
    this.drawCaseColumnRotated(pdf, labelData, x + (colWidth * 2), y, colWidth, height, boxNumber, totalBoxes);
  }

  /**
   * Draw barcode column with rotated text
   */
  static async drawBarcodeColumnRotated(pdf, labelData, x, y, width, height) {
    const textX = x + 15;
    const textY = y + height - 15;
    
    // Barcode numeric display (rotated 90° clockwise)
    const spacedBarcodeDisplay = this.formatBarcodeWithSpaces(labelData.barcodeDisplay);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11); // Larger for better visibility
    pdf.setTextColor(102, 102, 102);
    pdf.text(spacedBarcodeDisplay, textX, textY, { angle: 90 });
    
    // Barcode image
    const barcodeWidth = Math.min(width - 30, 80);
    const barcodeHeight = Math.min(height - 40, 60);
    const barcodeX = x + (width - barcodeWidth) / 2;
    const barcodeY = y + 15;
    
    await this.drawEnhancedBarcode(pdf, labelData.barcode, barcodeX, barcodeY, barcodeWidth, barcodeHeight);
  }

  /**
   * Draw dates column with rotated text
   */
  static drawDatesColumnRotated(pdf, labelData, x, y, width, height) {
    let currentX = x + 15;
    const textY = y + height - 15;
    
    // Harvest date (rotated 90° clockwise)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13); // Larger fonts
    pdf.setTextColor(0, 0, 0);
    pdf.text('Harvest:', currentX, textY, { angle: 90 });
    currentX += 20;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    const harvestDate = labelData.harvestDate || 'MM/DD/YY';
    pdf.text(harvestDate, currentX, textY, { angle: 90 });
    currentX += 35;
    
    // Package date (rotated 90° clockwise)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text('Package:', currentX, textY, { angle: 90 });
    currentX += 20;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    const packageDate = labelData.packagedDate || 'MM/DD/YY';
    pdf.text(packageDate, currentX, textY, { angle: 90 });
  }

  /**
   * Draw case/box column with rotated text
   */
  static drawCaseColumnRotated(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    let currentX = x + 15;
    const centerY = y + height / 2;
    
    // Case quantity box
    const boxWidth = 20;
    const boxHeight = Math.min(height - 30, 80);
    const boxX = currentX;
    const boxY = y + (height - boxHeight) / 2;
    
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(boxX, boxY, boxWidth, boxHeight);
    
    // Case text (rotated 90° clockwise)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12); // Larger font
    pdf.setTextColor(0, 0, 0);
    const caseQtyValue = labelData.caseQuantity || '___';
    const caseQtyText = `Case: ${caseQtyValue}`;
    pdf.text(caseQtyText, currentX + 5, boxY + boxHeight - 10, { angle: 90 });
    
    currentX += boxWidth + 15;
    
    // Box number box
    pdf.rect(currentX, boxY, boxWidth, boxHeight);
    
    // Box text (rotated 90° clockwise)
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    pdf.text(boxText, currentX + 5, boxY + boxHeight - 10, { angle: 90 });
  }

  /**
   * Draw audit section with rotated text
   */
  static drawAuditRotated(pdf, currentUser, x, y, width, height) {
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
    pdf.setFontSize(8);
    pdf.setTextColor(102, 102, 102);
    
    // Audit trail rotated 90° clockwise
    pdf.text(auditLine, x + 10, y + height - 5, { angle: 90 });
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
      sku: 'TEST-S12212-ROTATED-TEXT',
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
      labelFormat: 'Uline S-12212 (All Text Rotated 90° for Space Optimization)',
      pageSize: 'Legal (8.5" × 14")',
      labelsPerPage: 4,
      contentLayout: 'All text rotated 90° clockwise for maximum space utilization',
      optimization: 'Larger fonts possible, especially for product names readable from distance',
      textRotation: 'All text elements rotated 90° clockwise'
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
      migration: 'Uline S-12212 All Text Rotated 90° for Space Optimization',
      version: '7.2.0',
      approach: {
        concept: 'All text rotated 90° clockwise to optimize label space',
        method: 'pdf.text(text, x, y, { angle: 90 }) for all text elements',
        benefits: [
          'Much larger font sizes possible (up to 36pt)',
          'Product names readable from far away',
          'Optimal use of available label dimensions',
          'Professional appearance with space efficiency'
        ]
      },
      textRotation: {
        angle: '90° clockwise',
        elements: [
          'Brand names (up to 36pt)',
          'Product names (up to 36pt, multi-line)',
          'Store label (18pt)',
          'Barcode numeric display (11pt)',
          'Date labels and values (13pt/12pt)',
          'Case and box info (12pt)',
          'Audit trail (8pt)'
        ]
      },
      spaceOptimization: {
        primary: 'Product names can be much larger',
        secondary: 'All text benefits from increased space',
        result: 'Labels readable from greater distances',
        usability: 'Turn head or label to read - natural motion'
      },
      positions: positions
    };
  }

  // Legacy compatibility methods
  static calculateUlineLabelPosition(labelIndex) {
    return this.calculateUlineS12212Position(labelIndex % 4);
  }

  static async drawSidewaysLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawRotatedTextLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }

  static async draw4LayerOptimizedLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawRotatedTextLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }
}