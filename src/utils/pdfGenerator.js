import jsPDF from 'jspdf';
import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generation utilities for Uline S-12212 label sheets (4" × 6")
 * Using S-5492 layout specifications adapted for S-12212 physical labels
 * ALL TEXT ROTATED 90° CLOCKWISE following established layout patterns
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

          // Draw the label using established layout patterns with S-12212 specs
          await this.drawS12212LabelWithRotatedText(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
      }

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-12212 Format Labels (4" × 6" with Rotated Text Layout)',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v7.4.0',
        keywords: 'cannabis, inventory, labels, uline, s-12212, rotated-text'
      });

      // Log generation event
      storage.addSessionEvent(
        EVENT_TYPES.LABEL_GENERATED,
        `Generated ${currentLabelIndex} S-12212 labels with rotated text layout across ${currentPage} pages`,
        `Items: ${labelDataArray.length}, Format: Uline S-12212 (4" × 6" with Rotated Text)`
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
   * Calculate label position for Uline S-12212 (4" × 6") positioned sideways on legal paper
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
    
    // S-12212 labels: 4" × 6" positioned sideways for text rotation
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
      
      // Grid information
      row: row,
      col: col,
      labelIndex: labelIndex,
      
      // Layout info
      labelType: 'S-12212',
      physicalSize: '4" × 6"',
      textRotation: 90, // All text rotated 90° clockwise
      layoutMethod: 'adapted_from_S5492_specs'
    };
  }

  /**
   * Draw S-12212 label using established layout patterns with ALL TEXT ROTATED 90° CLOCKWISE
   * Uses layout percentages from S5492_NEW_ROTATED_LAYOUT: 35% | 35% | 30%
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Formatted label data
   * @param {Object} position - Label position and dimensions
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total number of boxes
   * @param {boolean} debug - Show debug borders
   * @param {string} currentUser - Current user
   */
  static async drawS12212LabelWithRotatedText(pdf, labelData, position, boxNumber = 1, totalBoxes = 1, debug = false, currentUser = 'Unknown') {
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
        pdf.text(`S-12212-${position.labelIndex + 1}`, x + 5, y + 15, { angle: 90 });
      }

      // Use padding from S5492 layout specs
      const padding = 10; // From S5492_NEW_ROTATED_LAYOUT.SPACING.PADDING
      const contentX = x + padding;
      const contentY = y + padding;
      const contentWidth = width - (padding * 2);    // 268pt
      const contentHeight = height - (padding * 2);  // 412pt

      const brandInfo = LabelFormatter.extractBrandFromProductNameEnhanced(labelData.productName);

      // Layout sections using S5492 percentages: 35% | 35% | 30%
      // TOP SECTION: Brand + Product Name (35% of height)
      const topSectionHeight = Math.floor(contentHeight * 0.35); // ~144pt
      await this.drawTopSectionWithAuditAndProduct(pdf, brandInfo, labelData, contentX, contentY, contentWidth, topSectionHeight, currentUser);

      // MIDDLE SECTION: Store (35% of height)
      const middleSectionY = contentY + topSectionHeight;
      const middleSectionHeight = Math.floor(contentHeight * 0.35); // ~144pt
      this.drawMiddleStoreSection(pdf, contentX, middleSectionY, contentWidth, middleSectionHeight);

      // BOTTOM SECTION: 4-column layout (30% of height)
      const bottomSectionY = middleSectionY + middleSectionHeight;
      const bottomSectionHeight = contentHeight - topSectionHeight - middleSectionHeight; // ~124pt
      await this.drawBottomFourColumnSection(pdf, labelData, contentX, bottomSectionY, contentWidth, bottomSectionHeight, boxNumber, totalBoxes);

    } catch (error) {
      console.error('Error drawing S-12212 label with rotated text:', error);
      pdf.setFontSize(10);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Error', x + 5, y + 20, { angle: 90 });
    }
  }

  /**
   * Draw top section with audit trail (rotated) and product name following S5492 specs
   */
  static async drawTopSectionWithAuditAndProduct(pdf, brandInfo, labelData, x, y, width, height, currentUser) {
    // Audit trail in top-left corner (rotated 90° clockwise) - following S5492 specs
    const auditFontSize = 7; // From S5492_NEW_ROTATED_LAYOUT.TOP_SECTION.AUDIT_TRAIL.FONT_SIZE
    
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
    const user = (currentUser || 'Unknown').substring(0, 10);
    
    const auditLine = `${month}/${day}/${year} ${hoursStr}:${minutes}${ampm} EST (${user})`;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(auditFontSize);
    pdf.setTextColor(102, 102, 102); // S5492_NEW_ROTATED_LAYOUT.TOP_SECTION.AUDIT_TRAIL.COLOR
    pdf.text(auditLine, x + 5, y + height - 10, { angle: 90 });

    // Product name area (75% of width - leaving space for audit trail)
    const productAreaWidth = width * 0.75; // From S5492_NEW_ROTATED_LAYOUT.TOP_SECTION.PRODUCT_NAME.WIDTH_PERCENTAGE
    const productAreaX = x + (width * 0.25); // Start after audit trail area
    
    let currentY = y + 20;

    // Brand name (large, rotated 90° clockwise)
    if (brandInfo.brand) {
      const brandFontSize = LabelFormatter.calculateNewLayoutBrandFontSize(brandInfo.brand);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(brandFontSize);
      pdf.setTextColor(0, 0, 0);
      
      const brandWidth = pdf.getTextWidth(brandInfo.brand);
      const brandX = productAreaX + (productAreaWidth - brandWidth) / 2;
      pdf.text(brandInfo.brand, brandX, currentY, { angle: 90 });
      currentY += brandFontSize + 10;
    }

    // Product name (large, rotated 90° clockwise)
    const remainingHeight = height - (currentY - y) - 20;
    const productFontSize = LabelFormatter.calculateNewLayoutProductNameFontSize(
      brandInfo.productName, 
      productAreaWidth, 
      remainingHeight
    );
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(productFontSize);
    pdf.setTextColor(0, 0, 0);
    
    const productLines = pdf.splitTextToSize(brandInfo.productName, productAreaWidth);
    const maxLines = 3; // From S5492_NEW_ROTATED_LAYOUT.TOP_SECTION.PRODUCT_NAME.MAX_LINES
    
    productLines.slice(0, maxLines).forEach((line) => {
      if (currentY < y + height - 20) {
        const textWidth = pdf.getTextWidth(line);
        const centerX = productAreaX + (productAreaWidth - textWidth) / 2;
        pdf.text(line, centerX, currentY, { angle: 90 });
        currentY += productFontSize * 1.2; // S5492_NEW_ROTATED_LAYOUT.SPACING.LINE_SPACING
      }
    });
  }

  /**
   * Draw middle store section following S5492 specs
   */
  static drawMiddleStoreSection(pdf, x, y, width, height) {
    // "Store:" label (rotated 90° clockwise)
    const storeLabelFontSize = 9; // From S5492_NEW_ROTATED_LAYOUT.BOTTOM_SECTION.COLUMNS.STORE_BOX.LABEL_FONT_SIZE
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(storeLabelFontSize);
    pdf.setTextColor(0, 0, 0);
    
    const storeLabel = 'Store:'; // From S5492_NEW_ROTATED_LAYOUT.BOTTOM_SECTION.COLUMNS.STORE_BOX.LABEL_TEXT
    const labelWidth = pdf.getTextWidth(storeLabel);
    const labelX = x + (width - labelWidth) / 2;
    pdf.text(storeLabel, labelX, y + 20, { angle: 90 });
    
    // Store text box
    const boxWidth = Math.min(width * 0.8, 200);
    const boxHeight = Math.floor(height * 0.7); // From S5492_NEW_ROTATED_LAYOUT.BOTTOM_SECTION.COLUMNS.STORE_BOX.BOX_HEIGHT_RATIO
    const boxX = x + (width - boxWidth) / 2;
    const boxY = y + 35;
    
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
      pdf.line(boxX + 3, lineY, boxX + boxWidth - 3, lineY);
    }
  }

  /**
   * Draw bottom 4-column section following S5492 specs
   */
  static async drawBottomFourColumnSection(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    // 4 columns with equal width (25% each) - From S5492_NEW_ROTATED_LAYOUT.BOTTOM_SECTION.COLUMNS
    const columnWidth = width * 0.25; // WIDTH_PERCENTAGE: 0.25 for each column

    // Column 1: Barcode (left)
    await this.drawBarcodeColumn(pdf, labelData, x, y, columnWidth, height);
    
    // Column 2: Store Box (center-left) - Skip since we moved store to middle section
    // Use this space for additional barcode info or spacing
    
    // Column 3: Dates (center-right)
    this.drawDatesColumn(pdf, labelData, x + (columnWidth * 2), y, columnWidth, height);
    
    // Column 4: Case/Box (right)
    this.drawCaseBoxColumn(pdf, labelData, x + (columnWidth * 3), y, columnWidth, height, boxNumber, totalBoxes);
  }

  /**
   * Draw barcode column following S5492 specs
   */
  static async drawBarcodeColumn(pdf, labelData, x, y, width, height) {
    const padding = 2; // From S5492_NEW_ROTATED_LAYOUT.SPACING.COLUMN_PADDING
    const innerX = x + padding;
    const innerWidth = width - (padding * 2);
    
    // Barcode numeric display (rotated 90° clockwise)
    const spacedBarcodeDisplay = LabelFormatter.formatBarcodeForNewLayout(labelData.barcodeDisplay);
    const numericFontSize = 8; // From S5492_NEW_ROTATED_LAYOUT.BOTTOM_SECTION.COLUMNS.BARCODE.NUMERIC_FONT_SIZE
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(numericFontSize);
    pdf.setTextColor(102, 102, 102);
    
    const displayWidth = pdf.getTextWidth(spacedBarcodeDisplay);
    const displayX = innerX + Math.max(0, (innerWidth - displayWidth) / 2);
    pdf.text(spacedBarcodeDisplay, displayX, y + 15, { angle: 90 });
    
    // Barcode image
    const barcodeHeightRatio = 0.7; // From S5492_NEW_ROTATED_LAYOUT.BOTTOM_SECTION.COLUMNS.BARCODE.BARCODE_HEIGHT_RATIO
    const barcodeHeight = Math.min(height * barcodeHeightRatio, 60);
    
    await this.drawEnhancedBarcode(
      pdf, 
      labelData.barcode, 
      innerX, 
      y + 25, 
      innerWidth, 
      barcodeHeight
    );
  }

  /**
   * Draw dates column following S5492 specs
   */
  static drawDatesColumn(pdf, labelData, x, y, width, height) {
    const padding = 2;
    const innerX = x + padding;
    let currentY = y + 15;
    
    const labelFontSize = 10; // From S5492_NEW_ROTATED_LAYOUT.BOTTOM_SECTION.COLUMNS.DATES.LABEL_FONT_SIZE
    const valueFontSize = 10; // From S5492_NEW_ROTATED_LAYOUT.BOTTOM_SECTION.COLUMNS.DATES.VALUE_FONT_SIZE
    
    // Harvest Date (rotated 90° clockwise)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(labelFontSize);
    pdf.setTextColor(0, 0, 0);
    
    const harvestLabel = 'Harvest:';
    const harvestLabelWidth = pdf.getTextWidth(harvestLabel);
    const harvestLabelX = innerX + ((width - padding * 2) - harvestLabelWidth) / 2;
    pdf.text(harvestLabel, harvestLabelX, currentY, { angle: 90 });
    currentY += 18;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(valueFontSize);
    const harvestDate = LabelFormatter.formatDateForNewLayout(labelData.harvestDate) || 'MM/DD/YY';
    const harvestDateWidth = pdf.getTextWidth(harvestDate);
    const harvestDateX = innerX + ((width - padding * 2) - harvestDateWidth) / 2;
    pdf.text(harvestDate, harvestDateX, currentY, { angle: 90 });
    currentY += 25;
    
    // Package Date (rotated 90° clockwise)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(labelFontSize);
    const packageLabel = 'Package:';
    const packageLabelWidth = pdf.getTextWidth(packageLabel);
    const packageLabelX = innerX + ((width - padding * 2) - packageLabelWidth) / 2;
    pdf.text(packageLabel, packageLabelX, currentY, { angle: 90 });
    currentY += 18;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(valueFontSize);
    const packageDate = LabelFormatter.formatDateForNewLayout(labelData.packagedDate) || 'MM/DD/YY';
    const packageDateWidth = pdf.getTextWidth(packageDate);
    const packageDateX = innerX + ((width - padding * 2) - packageDateWidth) / 2;
    pdf.text(packageDate, packageDateX, currentY, { angle: 90 });
  }

  /**
   * Draw case/box column following S5492 specs
   */
  static drawCaseBoxColumn(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    const padding = 2;
    const innerX = x + padding;
    const innerWidth = width - (padding * 2);
    let currentY = y + 15;
    
    const fontSize = 9; // From S5492_NEW_ROTATED_LAYOUT.BOTTOM_SECTION.COLUMNS.CASE_BOX.FONT_SIZE
    const boxHeight = 14; // From S5492_NEW_ROTATED_LAYOUT.BOTTOM_SECTION.COLUMNS.CASE_BOX.BOX_HEIGHT
    
    // Case Qty Box
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(innerX, currentY, innerWidth, boxHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(fontSize);
    pdf.setTextColor(0, 0, 0);
    const caseQtyValue = labelData.caseQuantity || '___';
    const caseQtyText = `Case: ${caseQtyValue}`;
    
    const caseQtyWidth = pdf.getTextWidth(caseQtyText);
    const caseQtyX = innerX + (innerWidth - caseQtyWidth) / 2;
    pdf.text(caseQtyText, caseQtyX, currentY + 10, { angle: 90 });
    
    currentY += boxHeight + 10;
    
    // Box Number Box
    pdf.rect(innerX, currentY, innerWidth, boxHeight);
    
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    const boxTextWidth = pdf.getTextWidth(boxText);
    const boxTextX = innerX + (innerWidth - boxTextWidth) / 2;
    pdf.text(boxText, boxTextX, currentY + 10, { angle: 90 });
  }

  /**
   * Enhanced barcode generation (using existing method)
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
   * Generate test PDF
   */
  static async generateTestPDF() {
    const testData = [{
      sku: 'TEST-S12212-FINAL',
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
      labelFormat: 'Uline S-12212 (4" × 6" with S-5492 Layout Specifications)',
      pageSize: 'Legal (8.5" × 14")',
      labelsPerPage: 4,
      contentLayout: 'S-5492 specs adapted for S-12212: 35% top | 35% middle | 30% bottom (ALL TEXT ROTATED 90°)',
      layoutSource: 'Using S5492_NEW_ROTATED_LAYOUT specifications from labelFormatter.js',
      allTextRotated: 'Every text element rotated 90° clockwise'
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
      migration: 'Uline S-12212 with S-5492 Layout Specifications',
      version: '7.4.0',
      approach: {
        physicalLabels: 'S-12212 (4" × 6")',
        layoutSpecs: 'S-5492 specifications from labelFormatter.js',
        textRotation: 'All text rotated 90° clockwise',
        method: 'Adapted existing layout logic for new physical label size'
      },
      layoutStructure: {
        topSection: '35% - Audit trail (rotated) + Brand/Product names (S-5492 font specs)',
        middleSection: '35% - Store label and text box (S-5492 store specs)',
        bottomSection: '30% - 4-column layout: Barcode | (space) | Dates | Case/Box',
        fontSizing: 'Using LabelFormatter font calculation methods',
        spacing: 'Using S5492_NEW_ROTATED_LAYOUT spacing constants'
      },
      specifications: {
        auditTrail: 'Font size 7, gray color, top-left rotated',
        brandName: 'Dynamic sizing via calculateNewLayoutBrandFontSize()',
        productName: 'Dynamic sizing via calculateNewLayoutProductNameFontSize(), max 3 lines',
        storeLabel: 'Font size 9, with text box and lines',
        barcodeNumeric: 'Font size 8, formatted via formatBarcodeForNewLayout()',
        dates: 'Font size 10 labels, 10 values, formatted via formatDateForNewLayout()',
        caseBox: 'Font size 9, box height 14pt'
      },
      positions: positions
    };
  }

  // Legacy compatibility methods
  static calculateUlineLabelPosition(labelIndex) {
    return this.calculateUlineS12212Position(labelIndex % 4);
  }

  static async drawSidewaysLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawS12212LabelWithRotatedText(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }

  static async draw4LayerOptimizedLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawS12212LabelWithRotatedText(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }
}