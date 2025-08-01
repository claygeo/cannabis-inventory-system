import jsPDF from 'jspdf';
import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generation utilities for Uline S-12212 label sheets (4" × 6")
 * ALL TEXT ROTATED 90° CLOCKWISE: Optimized positioning and spacing for rotated text
 * Product names, store info, barcode data, dates, case info, and audit trail all rotated
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
          await this.drawAllTextRotatedLabelOptimized(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
      }

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-12212 Format Labels (All Text Rotated 90° Clockwise - Optimized)',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v7.4.0',
        keywords: 'cannabis, inventory, labels, uline, s-12212, all-text-rotated, optimized'
      });

      // Log generation event
      storage.addSessionEvent(
        EVENT_TYPES.LABEL_GENERATED,
        `Generated ${currentLabelIndex} S-12212 labels with optimized rotated text across ${currentPage} pages`,
        `Items: ${labelDataArray.length}, Format: Uline S-12212 (All Text Rotated 90° Clockwise - Optimized)`
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
      
      // Grid information
      row: row,
      col: col,
      labelIndex: labelIndex,
      
      // Layout info
      isSideways: true,
      requiresRotation: true,
      allTextRotated: true, // ALL text rotated 90° clockwise
      optimizedPositioning: true, // Optimized positioning for rotated text
      rotationInstructions: 'All text rotated 90° clockwise for optimal reading'
    };
  }

  /**
   * Draw label with ALL TEXT ROTATED 90° CLOCKWISE - OPTIMIZED VERSION
   * Better positioning and spacing for rotated text elements
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Formatted label data
   * @param {Object} position - Label position and dimensions
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total number of boxes
   * @param {boolean} debug - Show debug borders
   * @param {string} currentUser - Current user
   */
  static async drawAllTextRotatedLabelOptimized(pdf, labelData, position, boxNumber = 1, totalBoxes = 1, debug = false, currentUser = 'Unknown') {
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
        pdf.text(`L${position.labelIndex + 1} OPT-ROT`, x + 5, y + 15, { angle: 90 });
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
      await this.drawBrandProductOptimizedRotated(pdf, brandInfo, contentX, contentY, contentWidth, section1Height);

      // Section 2: Store (25% of height)
      const section2Y = contentY + section1Height;
      const section2Height = Math.floor(contentHeight * 0.25); // 103pt
      this.drawStoreOptimizedRotated(pdf, contentX, section2Y, contentWidth, section2Height);

      // Section 3: Bottom info (30% of height)
      const section3Y = section2Y + section2Height;
      const section3Height = Math.floor(contentHeight * 0.30); // 124pt
      await this.drawBottomInfoOptimizedRotated(pdf, labelData, contentX, section3Y, contentWidth, section3Height, boxNumber, totalBoxes);

      // Section 4: Audit Trail (5% of height)
      const section4Y = section3Y + section3Height;
      const section4Height = contentHeight - section1Height - section2Height - section3Height;
      this.drawAuditOptimizedRotated(pdf, currentUser, contentX, section4Y, contentWidth, section4Height);

    } catch (error) {
      console.error('Error drawing optimized rotated text label:', error);
      pdf.setFontSize(10);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Error', x + 5, y + 20, { angle: 90 });
    }
  }

  /**
   * Draw brand and product section with OPTIMIZED ROTATED TEXT positioning
   */
  static async drawBrandProductOptimizedRotated(pdf, brandInfo, x, y, width, height) {
    // For rotated text, we position from left side and text flows right
    let currentX = x + 15; // Start from left side
    const textY = y + height - 15; // Bottom of section for rotated text baseline

    // Brand name first (large, prominent) - ROTATED 90° CLOCKWISE
    if (brandInfo.brand) {
      const brandFontSize = Math.min(34, Math.max(20, 36 - Math.floor(brandInfo.brand.length / 4)));
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(brandFontSize);
      pdf.setTextColor(0, 0, 0);
      
      pdf.text(brandInfo.brand, currentX, textY, { angle: 90 });
      currentX += brandFontSize + 18; // Space for next text
    }

    // Product name after brand - ROTATED 90° CLOCKWISE with optimized spacing
    const remainingWidth = Math.max(50, width - (currentX - x) - 15);
    const maxProductFontSize = brandInfo.brand ? 28 : 34;
    
    // Smart font sizing based on text length and available space
    let productFontSize = maxProductFontSize;
    const productLength = brandInfo.productName.length;
    
    if (productLength > 100) productFontSize = Math.max(16, maxProductFontSize - 10);
    else if (productLength > 80) productFontSize = Math.max(18, maxProductFontSize - 8);
    else if (productLength > 60) productFontSize = Math.max(20, maxProductFontSize - 6);
    else if (productLength > 40) productFontSize = Math.max(22, maxProductFontSize - 4);
    else if (productLength > 20) productFontSize = Math.max(24, maxProductFontSize - 2);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(productFontSize);
    pdf.setTextColor(0, 0, 0);
    
    // Split product name intelligently for rotated text
    const words = brandInfo.productName.split(' ');
    let currentLine = '';
    let lines = [];
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      // For rotated text, check against available height (becomes width when rotated)
      if (testLine.length * productFontSize * 0.55 <= height - 30 || currentLine === '') {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);
    
    // Draw each line with proper spacing
    lines.forEach((line, index) => {
      if (currentX + productFontSize + 5 < x + width - 10) {
        pdf.text(line, currentX, textY, { angle: 90 });
        currentX += productFontSize + 10;
      }
    });
  }

  /**
   * Draw store section with OPTIMIZED ROTATED TEXT
   */
  static drawStoreOptimizedRotated(pdf, x, y, width, height) {
    const textX = x + 20;
    const textY = y + height - 15;
    
    // "Store:" label rotated 90° clockwise - OPTIMIZED POSITIONING
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16); // Larger for better visibility
    pdf.setTextColor(0, 0, 0);
    pdf.text('Store:', textX, textY, { angle: 90 });
    
    // Store text box - positioned for rotated view
    const boxWidth = Math.min(width - 60, 200);
    const boxHeight = Math.min(height - 25, 65);
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
   * Draw bottom info section with OPTIMIZED ROTATED TEXT
   */
  static async drawBottomInfoOptimizedRotated(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    // Divide into 3 columns for: Barcode | Dates | Case/Box
    const colWidth = width / 3;

    // Column 1: Barcode with OPTIMIZED rotated text
    await this.drawBarcodeColumnOptimizedRotated(pdf, labelData, x, y, colWidth, height);
    
    // Column 2: Dates with OPTIMIZED rotated text
    this.drawDatesColumnOptimizedRotated(pdf, labelData, x + colWidth, y, colWidth, height);
    
    // Column 3: Case/Box with OPTIMIZED rotated text
    this.drawCaseColumnOptimizedRotated(pdf, labelData, x + (colWidth * 2), y, colWidth, height, boxNumber, totalBoxes);
  }

  /**
   * Draw barcode column with OPTIMIZED ROTATED TEXT
   */
  static async drawBarcodeColumnOptimizedRotated(pdf, labelData, x, y, width, height) {
    const padding = 5;
    const innerX = x + padding;
    const innerWidth = width - (padding * 2);
    
    // Barcode numeric display - ROTATED 90° CLOCKWISE with better positioning
    const spacedBarcodeDisplay = this.formatBarcodeWithSpaces(labelData.barcodeDisplay);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11); // Larger, more readable font
    pdf.setTextColor(102, 102, 102);
    
    // Position rotated text properly
    const displayX = innerX + 8;
    const displayY = y + height - 10;
    pdf.text(spacedBarcodeDisplay, displayX, displayY, { angle: 90 });
    
    // Barcode image - positioned for rotated view
    const barcodeHeight = Math.min(height - 35, 75);
    const barcodeWidth = Math.min(innerWidth - 15, 85);
    const barcodeX = innerX + 20;
    const barcodeY = y + 15;
    
    await this.drawEnhancedBarcodeRotated(
      pdf, 
      labelData.barcode, 
      barcodeX, 
      barcodeY, 
      barcodeWidth, 
      barcodeHeight
    );
  }

  /**
   * Draw dates column with OPTIMIZED ROTATED TEXT
   */
  static drawDatesColumnOptimizedRotated(pdf, labelData, x, y, width, height) {
    let currentX = x + 10;
    const textY = y + height - 10;
    
    // Harvest date - ROTATED 90° CLOCKWISE with better spacing
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13); // Larger fonts for better readability
    pdf.setTextColor(0, 0, 0);
    pdf.text('Harvest:', currentX, textY, { angle: 90 });
    currentX += 18;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    const harvestDate = labelData.harvestDate || 'MM/DD/YY';
    pdf.text(harvestDate, currentX, textY, { angle: 90 });
    currentX += 25;
    
    // Package date - ROTATED 90° CLOCKWISE with better spacing
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text('Package:', currentX, textY, { angle: 90 });
    currentX += 18;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    const packageDate = labelData.packagedDate || 'MM/DD/YY';
    pdf.text(packageDate, currentX, textY, { angle: 90 });
  }

  /**
   * Draw case/box column with OPTIMIZED ROTATED TEXT
   */
  static drawCaseColumnOptimizedRotated(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    const padding = 8;
    const innerX = x + padding;
    const innerWidth = width - (padding * 2);
    let currentY = y + 15;
    
    const boxHeight = 22; // Larger boxes for better visibility
    
    // Case Qty Box
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(innerX, currentY, innerWidth, boxHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12); // Larger font
    pdf.setTextColor(0, 0, 0);
    const caseQtyValue = labelData.caseQuantity || '___';
    const caseQtyText = `Case: ${caseQtyValue}`;
    
    // Center the rotated text in the box
    const caseTextX = innerX + (innerWidth / 2) - 8;
    const caseTextY = currentY + boxHeight - 2;
    pdf.text(caseQtyText, caseTextX, caseTextY, { angle: 90 });
    
    currentY += boxHeight + 15;
    
    // Box Number Box
    pdf.rect(innerX, currentY, innerWidth, boxHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    
    // Center the rotated text in the box
    const boxTextX = innerX + (innerWidth / 2) - 8;
    const boxTextY = currentY + boxHeight - 2;
    pdf.text(boxText, boxTextX, boxTextY, { angle: 90 });
  }

  /**
   * Draw audit section with OPTIMIZED ROTATED TEXT
   */
  static drawAuditOptimizedRotated(pdf, currentUser, x, y, width, height) {
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
    
    // Position audit trail at bottom left with proper rotation
    pdf.text(auditLine, x + 8, y + height - 3, { angle: 90 });
  }

  /**
   * Draw enhanced scannable barcode (rotated 90° clockwise)
   */
  static async drawEnhancedBarcodeRotated(pdf, barcodeValue, x, y, width, height) {
    if (!barcodeValue) return;

    try {
      const cleanBarcodeValue = barcodeValue.replace(/[^A-Za-z0-9]/g, '');
      
      const validation = BarcodeGenerator.validateCode39(cleanBarcodeValue);
      if (!validation.isValid) {
        console.warn('Invalid barcode:', validation.error);
        this.drawBarcodeErrorRotated(pdf, x, y, width, height);
        return;
      }

      const canvas = document.createElement('canvas');
      // For rotated barcode, swap dimensions
      canvas.width = height * 2;
      canvas.height = width * 2;
      
      const JsBarcode = (await import('jsbarcode')).default;
      
      JsBarcode(canvas, validation.cleanValue, {
        format: 'CODE39',
        width: Math.max(2, Math.floor(height / 25)), // Adjusted for rotation
        height: width * 2,  // Adjusted for rotation
        displayValue: false,
        margin: 0,
        background: '#ffffff',
        lineColor: '#000000'
      });

      const barcodeDataURL = canvas.toDataURL('image/png');
      
      // Add the barcode image rotated 90° clockwise
      pdf.addImage(barcodeDataURL, 'PNG', x, y, width, height, '', '', 90);

    } catch (error) {
      console.error('Rotated barcode generation error:', error);
      this.drawBarcodeErrorRotated(pdf, x, y, width, height);
    }
  }

  /**
   * Draw barcode error placeholder rotated
   */
  static drawBarcodeErrorRotated(pdf, x, y, width, height) {
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
      sku: 'TEST-S12212-OPT-ROT',
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
      labelFormat: 'Uline S-12212 (Optimized Rotated Text Layout)',
      pageSize: 'Legal (8.5" × 14")',
      labelsPerPage: 4,
      contentLayout: 'All text rotated 90° clockwise with optimized positioning and spacing',
      optimization: 'Improved font sizes, spacing, and alignment for rotated text elements',
      textRotation: 'All text elements rotated 90° clockwise with optimized positioning'
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
      migration: 'Uline S-12212 Optimized Rotated Text Layout',
      version: '7.4.0',
      optimizations: {
        textRotation: '90° clockwise for all elements',
        positioning: 'Optimized spacing and alignment for rotated text',
        fontSizing: 'Smart sizing based on text length and available space',
        improvements: [
          'Better text positioning for 90° rotation',
          'Optimized spacing between rotated elements',
          'Larger, more readable fonts throughout',
          'Improved alignment for all rotated text',
          'Smart font scaling based on content length'
        ]
      },
      layoutStructure: {
        section1: 'Brand + Product Name (40% height) - Optimized rotated positioning',
        section2: 'Store Section (25% height) - Store label and text box with rotated label',
        section3: 'Bottom Info (30% height) - 3 columns: Barcode | Dates | Case/Box with rotated text',
        section4: 'Audit Trail (5% height) - Rotated audit text, bottom left corner'
      },
      rotatedTextFeatures: {
        brandText: 'Up to 34pt, rotated 90° clockwise',
        productText: 'Up to 34pt, rotated 90° clockwise, smart line wrapping',
        storeLabel: '16pt, rotated 90° clockwise',
        barcodeNumeric: '11pt, rotated 90° clockwise',
        dateLabels: '13pt, rotated 90° clockwise',
        caseBoxText: '12pt, rotated 90° clockwise, centered in boxes',
        auditTrail: '8pt, rotated 90° clockwise'
      },
      positions: positions
    };
  }

  // Legacy compatibility
  static calculateUlineLabelPosition(labelIndex) {
    return this.calculateUlineS12212Position(labelIndex % 4);
  }

  // Main method aliases
  static async drawAllTextRotatedLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawAllTextRotatedLabelOptimized(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }

  static async drawSidewaysLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawAllTextRotatedLabelOptimized(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }

  static async draw4LayerOptimizedLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawAllTextRotatedLabelOptimized(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }
}