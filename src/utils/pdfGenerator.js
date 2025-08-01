import jsPDF from 'jspdf';
import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generation utilities for Uline S-12212 label sheets (4" × 6")
 * SIMPLE ROTATION APPROACH: Create normal horizontal layout, then rotate entire content 90°
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

          // Draw the label with SIMPLE ROTATION APPROACH
          await this.drawSimpleRotatedLabel(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
      }

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-12212 Format Labels (Simple Rotation for 6" Width)',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v6.9.0',
        keywords: 'cannabis, inventory, labels, uline, s-12212, simple-rotation, 6inch'
      });

      // Log generation event
      storage.addSessionEvent(
        EVENT_TYPES.LABEL_GENERATED,
        `Generated ${currentLabelIndex} S-12212 labels with simple rotation approach across ${currentPage} pages`,
        `Items: ${labelDataArray.length}, Format: Uline S-12212 (Simple Rotation for 6" Width)`
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
      simpleRotation: true, // NEW: Using simple rotation approach
      rotationInstructions: 'Rotate paper 90° clockwise to read labels optimized for 6" width'
    };
  }

  /**
   * Draw label with SIMPLE ROTATION APPROACH
   * Create horizontal layout (6" wide × 4" tall), then rotate entire content 90° clockwise
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Formatted label data
   * @param {Object} position - Label position and dimensions
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total number of boxes
   * @param {boolean} debug - Show debug borders
   * @param {string} currentUser - Current user
   */
  static async drawSimpleRotatedLabel(pdf, labelData, position, boxNumber = 1, totalBoxes = 1, debug = false, currentUser = 'Unknown') {
    const { x, y, width, height } = position;

    try {
      // Draw label border
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(1);
      pdf.rect(x, y, width, height);

      // Save the current graphics state
      pdf.saveGraphicsState();

      // Set up rotation: rotate 90° clockwise around the label center
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      
      // Translate to center, rotate, translate back
      pdf.setCurrentTransformationMatrix(
        Math.cos(Math.PI/2),   // cos(90°) = 0
        Math.sin(Math.PI/2),   // sin(90°) = 1  
        -Math.sin(Math.PI/2),  // -sin(90°) = -1
        Math.cos(Math.PI/2),   // cos(90°) = 0
        centerX + centerY,     // tx
        centerY - centerX      // ty
      );

      // Now draw content in "horizontal" coordinate system (6" wide × 4" tall)
      // This content will be rotated 90° clockwise by the transformation
      const contentWidth = 432;  // 6" when rotated (flows horizontally)
      const contentHeight = 288;  // 4" when rotated (flows vertically)
      
      // Center the content in the transformed space
      const contentX = -contentWidth / 2;
      const contentY = -contentHeight / 2;

      // Debug info for rotated content
      if (debug) {
        pdf.setDrawColor(255, 0, 0);
        pdf.setLineWidth(0.5);
        pdf.rect(contentX, contentY, contentWidth, contentHeight);
        
        pdf.setFontSize(8);
        pdf.setTextColor(255, 0, 0);
        pdf.text(`L${position.labelIndex + 1} SIMPLE-ROT`, contentX + 5, contentY + 15);
      }

      const brandInfo = this.extractBrandFromProductName(labelData.productName);

      // Draw horizontal layout (this will appear rotated 90° clockwise in final PDF)
      await this.drawHorizontalLayout(pdf, labelData, brandInfo, contentX, contentY, contentWidth, contentHeight, boxNumber, totalBoxes, currentUser);

      // Restore the graphics state
      pdf.restoreGraphicsState();

    } catch (error) {
      console.error('Error drawing simple rotated label:', error);
      pdf.setFontSize(10);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Error', x + 5, y + 20);
    }
  }

  /**
   * Draw horizontal layout (6" wide × 4" tall) - this gets rotated 90° by transformation
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {Object} brandInfo - Brand information
   * @param {number} x - X position (left edge)
   * @param {number} y - Y position (top edge)
   * @param {number} width - Width (432pt = 6")
   * @param {number} height - Height (288pt = 4")
   * @param {number} boxNumber - Box number
   * @param {number} totalBoxes - Total boxes
   * @param {string} currentUser - Current user
   */
  static async drawHorizontalLayout(pdf, labelData, brandInfo, x, y, width, height, boxNumber, totalBoxes, currentUser) {
    const padding = 10;
    const contentX = x + padding;
    const contentY = y + padding;
    const contentWidth = width - (padding * 2);   // 412pt
    const contentHeight = height - (padding * 2); // 268pt

    // Section 1: Brand + Product Name (top 40%)
    const section1Height = Math.floor(contentHeight * 0.40); // 107pt
    await this.drawBrandProductSection(pdf, brandInfo, contentX, contentY, contentWidth, section1Height);

    // Section 2: Store (middle 25%)
    const section2Y = contentY + section1Height;
    const section2Height = Math.floor(contentHeight * 0.25); // 67pt
    this.drawStoreSection(pdf, contentX, section2Y, contentWidth, section2Height);

    // Section 3: Bottom Row - Barcode | Dates | Case/Box (bottom 30%)
    const section3Y = section2Y + section2Height;
    const section3Height = Math.floor(contentHeight * 0.30); // 80pt
    await this.drawBottomSection(pdf, labelData, contentX, section3Y, contentWidth, section3Height, boxNumber, totalBoxes);

    // Section 4: Audit Trail (bottom 5%)
    const section4Y = section3Y + section3Height;
    const section4Height = contentHeight - section1Height - section2Height - section3Height; // Remaining
    this.drawAuditSection(pdf, currentUser, contentX, section4Y, contentWidth, section4Height);
  }

  /**
   * Draw brand and product name section (top 40%)
   */
  static async drawBrandProductSection(pdf, brandInfo, x, y, width, height) {
    let currentY = y + 15;

    // Brand name (large, centered)
    if (brandInfo.brand) {
      const brandFontSize = Math.min(28, Math.max(16, 30 - Math.floor(brandInfo.brand.length / 4)));
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(brandFontSize);
      pdf.setTextColor(0, 0, 0);
      
      const brandWidth = pdf.getTextWidth(brandInfo.brand);
      const brandX = x + (width - brandWidth) / 2; // Center horizontally
      pdf.text(brandInfo.brand, brandX, currentY);
      currentY += brandFontSize + 8;
    }

    // Product name (large, centered, multiple lines if needed)
    const remainingHeight = height - (currentY - y) - 10;
    const maxProductFontSize = brandInfo.brand ? 22 : 26;
    const productFontSize = Math.min(maxProductFontSize, Math.max(14, maxProductFontSize - Math.floor(brandInfo.productName.length / 8)));
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(productFontSize);
    pdf.setTextColor(0, 0, 0);
    
    // Split text to fit width
    const productLines = pdf.splitTextToSize(brandInfo.productName, width - 20);
    const lineHeight = productFontSize * 1.2;
    
    // Center the text block vertically and horizontally
    const totalTextHeight = productLines.length * lineHeight;
    const startY = currentY + Math.max(0, (remainingHeight - totalTextHeight) / 2);
    
    productLines.forEach((line, index) => {
      const textWidth = pdf.getTextWidth(line);
      const textX = x + (width - textWidth) / 2; // Center each line
      const lineY = startY + (index * lineHeight);
      pdf.text(line, textX, lineY);
    });
  }

  /**
   * Draw store section (middle 25%)
   */
  static drawStoreSection(pdf, x, y, width, height) {
    // "Store:" label centered
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    
    const storeLabel = 'Store:';
    const labelWidth = pdf.getTextWidth(storeLabel);
    const labelX = x + (width - labelWidth) / 2;
    pdf.text(storeLabel, labelX, y + 18);
    
    // Text box centered below label
    const boxWidth = Math.min(width * 0.8, 250);
    const boxHeight = height - 30;
    const boxX = x + (width - boxWidth) / 2;
    const boxY = y + 25;
    
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
   * Draw bottom section with 3 columns (bottom 30%)
   */
  static async drawBottomSection(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    const columnWidth = width / 3;

    // Column 1: Barcode (left)
    await this.drawBarcodeColumn(pdf, labelData, x, y, columnWidth, height);
    
    // Column 2: Dates (center)
    this.drawDatesColumn(pdf, labelData, x + columnWidth, y, columnWidth, height);
    
    // Column 3: Case/Box (right)
    this.drawCaseColumn(pdf, labelData, x + (columnWidth * 2), y, columnWidth, height, boxNumber, totalBoxes);
  }

  /**
   * Draw barcode column
   */
  static async drawBarcodeColumn(pdf, labelData, x, y, width, height) {
    const padding = 8;
    const innerX = x + padding;
    const innerWidth = width - (padding * 2);
    
    // Barcode numeric display
    const spacedBarcodeDisplay = this.formatBarcodeWithSpaces(labelData.barcodeDisplay);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(102, 102, 102);
    
    const displayWidth = pdf.getTextWidth(spacedBarcodeDisplay);
    const displayX = innerX + (innerWidth - displayWidth) / 2;
    pdf.text(spacedBarcodeDisplay, displayX, y + 12);
    
    // Barcode image
    const barcodeHeight = Math.min(height - 20, 50);
    const barcodeWidth = Math.min(innerWidth, 120);
    const barcodeX = innerX + (innerWidth - barcodeWidth) / 2;
    
    await this.drawEnhancedBarcode(
      pdf, 
      labelData.barcode, 
      barcodeX, 
      y + 18, 
      barcodeWidth, 
      barcodeHeight
    );
  }

  /**
   * Draw dates column
   */
  static drawDatesColumn(pdf, labelData, x, y, width, height) {
    const padding = 8;
    const centerX = x + width / 2;
    let currentY = y + 15;
    
    // Harvest Date
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    
    const harvestLabel = 'Harvest:';
    const harvestLabelWidth = pdf.getTextWidth(harvestLabel);
    pdf.text(harvestLabel, centerX - harvestLabelWidth / 2, currentY);
    currentY += 15;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const harvestDate = labelData.harvestDate || 'MM/DD/YY';
    const harvestDateWidth = pdf.getTextWidth(harvestDate);
    pdf.text(harvestDate, centerX - harvestDateWidth / 2, currentY);
    currentY += 20;
    
    // Package Date
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    const packageLabel = 'Package:';
    const packageLabelWidth = pdf.getTextWidth(packageLabel);
    pdf.text(packageLabel, centerX - packageLabelWidth / 2, currentY);
    currentY += 15;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const packageDate = labelData.packagedDate || 'MM/DD/YY';
    const packageDateWidth = pdf.getTextWidth(packageDate);
    pdf.text(packageDate, centerX - packageDateWidth / 2, currentY);
  }

  /**
   * Draw case/box column
   */
  static drawCaseColumn(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    const padding = 8;
    const innerX = x + padding;
    const innerWidth = width - (padding * 2);
    const centerX = x + width / 2;
    
    let currentY = y + 15;
    const boxHeight = 16;
    
    // Case Qty Box
    const caseBoxX = innerX;
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(caseBoxX, currentY, innerWidth, boxHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    const caseQtyValue = labelData.caseQuantity || '___';
    const caseQtyText = `Case: ${caseQtyValue}`;
    const caseQtyWidth = pdf.getTextWidth(caseQtyText);
    pdf.text(caseQtyText, centerX - caseQtyWidth / 2, currentY + 11);
    
    currentY += boxHeight + 8;
    
    // Box Number Box
    pdf.rect(caseBoxX, currentY, innerWidth, boxHeight);
    
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    const boxTextWidth = pdf.getTextWidth(boxText);
    pdf.text(boxText, centerX - boxTextWidth / 2, currentY + 11);
  }

  /**
   * Draw audit section (bottom 5%)
   */
  static drawAuditSection(pdf, currentUser, x, y, width, height) {
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
    
    // Bottom left corner
    pdf.text(auditLine, x + 5, y + height - 3);
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
    pdf.text('Barcode Error', x + 5, y + height / 2);
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
      sku: 'TEST-S12212-SIMPLE-ROT',
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
      labelFormat: 'Uline S-12212 (Simple Rotation for 6" Width)',
      pageSize: 'Legal (8.5" × 14")',
      labelsPerPage: 4,
      contentLayout: 'Horizontal layout rotated 90° clockwise as complete unit',
      rotationNote: 'Content designed horizontally then rotated 90° clockwise for optimal 6" width utilization',
      simpleRotation: 'Enabled - Entire content area rotated as single unit'
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
      migration: 'Uline S-12212 Simple Rotation Approach',
      version: '6.9.0',
      approach: {
        method: 'Create horizontal layout, rotate entire content 90° clockwise',
        advantages: [
          'Normal horizontal layout logic',
          'Single transformation applied to entire content',
          'Predictable positioning and spacing',
          'Clean coordinate system'
        ],
        transformation: 'setCurrentTransformationMatrix with 90° rotation'
      },
      layoutFlow: {
        design: 'Horizontal 6" × 4" layout',
        sections: {
          brandProduct: 'Top 40% - Brand name and product name with large fonts',
          store: 'Middle 25% - Store label and text box with lines',
          bottomRow: 'Bottom 30% - Three columns: Barcode | Dates | Case/Box',
          audit: 'Bottom 5% - Audit trail in bottom left'
        },
        rotation: 'Entire layout rotated 90° clockwise for final output'
      },
      finalResult: {
        paperOrientation: 'Rotate paper 90° clockwise to read',
        effectiveDimensions: '6" wide × 4" tall',
        textFlow: 'Horizontal across full 6" width',
        readability: 'Optimal for cannabis inventory labels'
      },
      positions: positions
    };
  }

  // Legacy compatibility methods
  static calculateUlineLabelPosition(labelIndex) {
    return this.calculateUlineS12212Position(labelIndex % 4);
  }

  static async drawSidewaysLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawSimpleRotatedLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }

  static async draw4LayerOptimizedLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawSimpleRotatedLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }
}