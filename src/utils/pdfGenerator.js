import jsPDF from 'jspdf';
import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generation utilities for Uline S-12212 label sheets (4" × 6")
 * LANDSCAPE-FIRST APPROACH: Design content for 6" wide × 4" tall, then rotate ENTIRE content area 90° clockwise
 * Uses S5492_NEW_ROTATED_LAYOUT specifications with complete content rotation
 */
export class PDFGenerator {
  /**
   * Generate PDF with labels positioned for Uline S-12212 sheets
   * LANDSCAPE APPROACH: Design content as 6" wide × 4" tall, then rotate entire content area
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

          // Draw the label using LANDSCAPE-FIRST approach with ENTIRE content rotation
          await this.drawS12212LabelLandscapeRotated(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
      }

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-12212 Format Labels (4" × 6" with Landscape-First Content Rotation)',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v7.5.0',
        keywords: 'cannabis, inventory, labels, uline, s-12212, landscape-rotation'
      });

      // Log generation event
      storage.addSessionEvent(
        EVENT_TYPES.LABEL_GENERATED,
        `Generated ${currentLabelIndex} S-12212 labels with landscape-first content rotation across ${currentPage} pages`,
        `Items: ${labelDataArray.length}, Format: Uline S-12212 (6" × 4" landscape rotated)`
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
   * Container positioning unchanged - content will be designed landscape and rotated
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
    
    // S-12212 labels: 4" × 6" positioned sideways (containers remain as before)
    const labelWidth = 288;  // 4" in points (container width)
    const labelHeight = 432; // 6" in points (container height)
    
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
      width: labelWidth,   // 288pt (4") - container width
      height: labelHeight, // 432pt (6") - container height
      
      // Landscape content dimensions (what we design for, then rotate)
      landscapeWidth: labelHeight,  // 432pt (6" wide in landscape)
      landscapeHeight: labelWidth,  // 288pt (4" tall in landscape)
      
      // Grid information
      row: row,
      col: col,
      labelIndex: labelIndex,
      
      // Layout info
      labelType: 'S-12212',
      approach: 'landscape_first_then_rotate',
      contentDesignedFor: '6" wide × 4" tall landscape',
      rotationMethod: 'entire_content_area'
    };
  }

  /**
   * Draw S-12212 label using LANDSCAPE-FIRST approach with ENTIRE content rotation
   * Design content for 6" wide × 4" tall landscape, then rotate ENTIRE content area 90° clockwise
   * Uses layout percentages from S5492_NEW_ROTATED_LAYOUT: 35% | 35% | 30%
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Formatted label data
   * @param {Object} position - Label position and dimensions
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total number of boxes
   * @param {boolean} debug - Show debug borders
   * @param {string} currentUser - Current user
   */
  static async drawS12212LabelLandscapeRotated(pdf, labelData, position, boxNumber = 1, totalBoxes = 1, debug = false, currentUser = 'Unknown') {
    const { x, y, width, height, landscapeWidth, landscapeHeight } = position;

    try {
      // Save PDF state before transformation
      pdf.saveGraphicsState();

      // STEP 1: Set up transformation for ENTIRE content rotation
      // Move to the center of the label container
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      
      // Transform coordinate system: translate to center, rotate 90° clockwise, translate back
      pdf.setCurrentTransformationMatrix(
        Math.cos(Math.PI/2), Math.sin(Math.PI/2),   // Rotation matrix for 90° clockwise
        -Math.sin(Math.PI/2), Math.cos(Math.PI/2),  // Rotation matrix for 90° clockwise
        centerX + centerY * Math.sin(Math.PI/2) - centerX * Math.cos(Math.PI/2),  // Translation X
        centerY - centerY * Math.cos(Math.PI/2) - centerX * Math.sin(Math.PI/2)   // Translation Y
      );

      // STEP 2: Now design content as if it's 6" wide × 4" tall landscape
      // Calculate landscape layout coordinates (relative to rotated coordinate system)
      const landscapeX = centerX - landscapeWidth / 2;
      const landscapeY = centerY - landscapeHeight / 2;

      // Draw label border (in landscape orientation)
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(1);
      pdf.rect(landscapeX, landscapeY, landscapeWidth, landscapeHeight);

      // Debug border (in landscape orientation)
      if (debug) {
        pdf.setDrawColor(255, 0, 0);
        pdf.setLineWidth(0.5);
        pdf.rect(landscapeX + 2, landscapeY + 2, landscapeWidth - 4, landscapeHeight - 4);
        
        pdf.setFontSize(8);
        pdf.setTextColor(255, 0, 0);
        pdf.text(`S-12212-${position.labelIndex + 1} (Landscape)`, landscapeX + 5, landscapeY + 15);
      }

      // STEP 3: Design content in landscape layout (6" wide × 4" tall)
      const padding = 10; // From S5492_NEW_ROTATED_LAYOUT.SPACING.PADDING
      const contentX = landscapeX + padding;
      const contentY = landscapeY + padding;
      const contentWidth = landscapeWidth - (padding * 2);    // ~412pt (6" wide)
      const contentHeight = landscapeHeight - (padding * 2);  // ~268pt (4" tall)

      const brandInfo = LabelFormatter.extractBrandFromProductNameEnhanced(labelData.productName);

      // Layout sections using S5492 percentages in LANDSCAPE: 35% | 35% | 30%
      // LEFT SECTION: Audit Trail + Brand/Product (35% of width)
      const leftSectionWidth = Math.floor(contentWidth * 0.35); // ~144pt
      await this.drawLandscapeLeftSection(pdf, brandInfo, labelData, contentX, contentY, leftSectionWidth, contentHeight, currentUser);

      // CENTER SECTION: Store (35% of width)
      const centerSectionX = contentX + leftSectionWidth;
      const centerSectionWidth = Math.floor(contentWidth * 0.35); // ~144pt
      this.drawLandscapeCenterSection(pdf, centerSectionX, contentY, centerSectionWidth, contentHeight);

      // RIGHT SECTION: Barcode + Dates + Case/Box (30% of width)
      const rightSectionX = centerSectionX + centerSectionWidth;
      const rightSectionWidth = contentWidth - leftSectionWidth - centerSectionWidth; // ~124pt
      await this.drawLandscapeRightSection(pdf, labelData, rightSectionX, contentY, rightSectionWidth, contentHeight, boxNumber, totalBoxes);

      // Restore PDF state (removes transformation)
      pdf.restoreGraphicsState();

    } catch (error) {
      // Restore PDF state in case of error
      pdf.restoreGraphicsState();
      
      console.error('Error drawing S-12212 label with landscape rotation:', error);
      pdf.setFontSize(10);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Error', x + 5, y + 20);
    }
  }

  /**
   * Draw left section in landscape layout (audit trail + brand/product)
   * This becomes the "top" section when paper is rotated
   */
  static async drawLandscapeLeftSection(pdf, brandInfo, labelData, x, y, width, height, currentUser) {
    // Audit trail in landscape layout (positioned at top-left of section)
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
    pdf.text(auditLine, x + 5, y + 15);

    // Brand and product area (main area of left section)
    let currentY = y + 30;

    // Brand name (if detected)
    if (brandInfo.brand) {
      const brandFontSize = LabelFormatter.calculateNewLayoutBrandFontSize(brandInfo.brand, width - 10);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(brandFontSize);
      pdf.setTextColor(0, 0, 0);
      
      const brandText = brandInfo.brand;
      const brandWidth = pdf.getTextWidth(brandText);
      const brandX = x + Math.max(5, (width - brandWidth) / 2);
      pdf.text(brandText, brandX, currentY);
      currentY += brandFontSize + 8;
    }

    // Product name (large, horizontal text in landscape)
    const remainingHeight = height - (currentY - y) - 20;
    const productFontSize = LabelFormatter.calculateNewLayoutProductNameFontSize(
      brandInfo.productName, 
      width - 10, 
      remainingHeight
    );
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(productFontSize);
    pdf.setTextColor(0, 0, 0);
    
    // Split text to fit in landscape layout
    const productLines = pdf.splitTextToSize(brandInfo.productName, width - 10);
    const maxLines = Math.floor(remainingHeight / (productFontSize * 1.2));
    
    productLines.slice(0, maxLines).forEach((line) => {
      if (currentY < y + height - 20) {
        const textWidth = pdf.getTextWidth(line);
        const centerX = x + Math.max(5, (width - textWidth) / 2);
        pdf.text(line, centerX, currentY);
        currentY += productFontSize * 1.2; // S5492_NEW_ROTATED_LAYOUT.SPACING.LINE_SPACING
      }
    });
  }

  /**
   * Draw center section in landscape layout (store area)
   * This becomes the "middle" section when paper is rotated
   */
  static drawLandscapeCenterSection(pdf, x, y, width, height) {
    // "Store:" label centered in section
    const storeLabelFontSize = 9; // From S5492_NEW_ROTATED_LAYOUT.BOTTOM_SECTION.COLUMNS.STORE_BOX.LABEL_FONT_SIZE
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(storeLabelFontSize);
    pdf.setTextColor(0, 0, 0);
    
    const storeLabel = 'Store:'; // From S5492_NEW_ROTATED_LAYOUT.BOTTOM_SECTION.COLUMNS.STORE_BOX.LABEL_TEXT
    const labelWidth = pdf.getTextWidth(storeLabel);
    const labelX = x + (width - labelWidth) / 2;
    pdf.text(storeLabel, labelX, y + 20);
    
    // Store text box (landscape oriented)
    const boxWidth = Math.min(width * 0.8, width - 20);
    const boxHeight = Math.floor(height * 0.7); // From S5492_NEW_ROTATED_LAYOUT.BOTTOM_SECTION.COLUMNS.STORE_BOX.BOX_HEIGHT_RATIO
    const boxX = x + (width - boxWidth) / 2;
    const boxY = y + 35;
    
    // Main box
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(boxX, boxY, boxWidth, boxHeight);

    // Writing lines (horizontal in landscape view)
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.5);
    
    const numLines = 6; // More lines since we have more height in landscape
    for (let i = 1; i < numLines; i++) {
      const lineY = boxY + (i * (boxHeight / numLines));
      pdf.line(boxX + 3, lineY, boxX + boxWidth - 3, lineY);
    }
  }

  /**
   * Draw right section in landscape layout (barcode + dates + case/box)
   * This becomes the "bottom" section when paper is rotated
   */
  static async drawLandscapeRightSection(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    // Divide right section into areas (stacked vertically in landscape view)
    const areaHeight = height / 3; // Three areas stacked vertically

    // Top area: Barcode
    await this.drawLandscapeBarcodeArea(pdf, labelData, x, y, width, areaHeight);
    
    // Middle area: Dates
    this.drawLandscapeDatesArea(pdf, labelData, x, y + areaHeight, width, areaHeight);
    
    // Bottom area: Case/Box
    this.drawLandscapeCaseBoxArea(pdf, labelData, x, y + (areaHeight * 2), width, areaHeight, boxNumber, totalBoxes);
  }

  /**
   * Draw barcode area in landscape layout
   */
  static async drawLandscapeBarcodeArea(pdf, labelData, x, y, width, height) {
    const padding = 2;
    const innerX = x + padding;
    const innerY = y + padding;
    const innerWidth = width - (padding * 2);
    const innerHeight = height - (padding * 2);
    
    // Barcode numeric display (horizontal in landscape)
    const spacedBarcodeDisplay = LabelFormatter.formatBarcodeForNewLayout(labelData.barcodeDisplay);
    const numericFontSize = 8; // From S5492_NEW_ROTATED_LAYOUT.BOTTOM_SECTION.COLUMNS.BARCODE.NUMERIC_FONT_SIZE
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(numericFontSize);
    pdf.setTextColor(102, 102, 102);
    
    const displayWidth = pdf.getTextWidth(spacedBarcodeDisplay);
    const displayX = innerX + Math.max(0, (innerWidth - displayWidth) / 2);
    pdf.text(spacedBarcodeDisplay, displayX, innerY + 15);
    
    // Barcode image (horizontal in landscape)
    const barcodeHeight = Math.min(innerHeight - 20, 40);
    const barcodeWidth = Math.min(innerWidth, 80);
    
    await this.drawEnhancedBarcode(
      pdf, 
      labelData.barcode, 
      innerX + (innerWidth - barcodeWidth) / 2, 
      innerY + 20, 
      barcodeWidth, 
      barcodeHeight
    );
  }

  /**
   * Draw dates area in landscape layout
   */
  static drawLandscapeDatesArea(pdf, labelData, x, y, width, height) {
    const padding = 2;
    const innerX = x + padding;
    const innerY = y + padding;
    const innerWidth = width - (padding * 2);
    
    const labelFontSize = 10; // From S5492_NEW_ROTATED_LAYOUT.BOTTOM_SECTION.COLUMNS.DATES.LABEL_FONT_SIZE
    const valueFontSize = 10; // From S5492_NEW_ROTATED_LAYOUT.BOTTOM_SECTION.COLUMNS.DATES.VALUE_FONT_SIZE
    
    let currentY = innerY + 15;
    
    // Harvest Date (horizontal text in landscape)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(labelFontSize);
    pdf.setTextColor(0, 0, 0);
    
    const harvestLabel = 'Harvest:';
    const harvestLabelWidth = pdf.getTextWidth(harvestLabel);
    const harvestLabelX = innerX + (innerWidth - harvestLabelWidth) / 2;
    pdf.text(harvestLabel, harvestLabelX, currentY);
    currentY += 12;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(valueFontSize);
    const harvestDate = LabelFormatter.formatDateForNewLayout(labelData.harvestDate) || 'MM/DD/YY';
    const harvestDateWidth = pdf.getTextWidth(harvestDate);
    const harvestDateX = innerX + (innerWidth - harvestDateWidth) / 2;
    pdf.text(harvestDate, harvestDateX, currentY);
    currentY += 20;
    
    // Package Date (horizontal text in landscape)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(labelFontSize);
    const packageLabel = 'Package:';
    const packageLabelWidth = pdf.getTextWidth(packageLabel);
    const packageLabelX = innerX + (innerWidth - packageLabelWidth) / 2;
    pdf.text(packageLabel, packageLabelX, currentY);
    currentY += 12;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(valueFontSize);
    const packageDate = LabelFormatter.formatDateForNewLayout(labelData.packagedDate) || 'MM/DD/YY';
    const packageDateWidth = pdf.getTextWidth(packageDate);
    const packageDateX = innerX + (innerWidth - packageDateWidth) / 2;
    pdf.text(packageDate, packageDateX, currentY);
  }

  /**
   * Draw case/box area in landscape layout
   */
  static drawLandscapeCaseBoxArea(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    const padding = 2;
    const innerX = x + padding;
    const innerY = y + padding;
    const innerWidth = width - (padding * 2);
    const innerHeight = height - (padding * 2);
    
    const fontSize = 9; // From S5492_NEW_ROTATED_LAYOUT.BOTTOM_SECTION.COLUMNS.CASE_BOX.FONT_SIZE
    const boxHeight = 14; // From S5492_NEW_ROTATED_LAYOUT.BOTTOM_SECTION.COLUMNS.CASE_BOX.BOX_HEIGHT
    
    let currentY = innerY + 10;
    
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
    pdf.text(caseQtyText, caseQtyX, currentY + 10);
    
    currentY += boxHeight + 8;
    
    // Box Number Box
    pdf.rect(innerX, currentY, innerWidth, boxHeight);
    
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    const boxTextWidth = pdf.getTextWidth(boxText);
    const boxTextX = innerX + (innerWidth - boxTextWidth) / 2;
    pdf.text(boxText, boxTextX, currentY + 10);
  }

  /**
   * Enhanced barcode generation (reusing existing method)
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
   * Generate test PDF
   */
  static async generateTestPDF() {
    const testData = [{
      sku: 'TEST-S12212-LANDSCAPE',
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
      labelFormat: 'Uline S-12212 (4" × 6" with Landscape-First Content Rotation)',
      pageSize: 'Legal (8.5" × 14")',
      labelsPerPage: 4,
      contentLayout: 'Landscape-first approach: Design 6" wide × 4" tall, then rotate ENTIRE content area 90°',
      layoutSource: 'Using S5492_NEW_ROTATED_LAYOUT specifications with complete content rotation',
      approach: 'landscape_first_then_rotate_entire_content'
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
      migration: 'Uline S-12212 with Landscape-First Content Rotation',
      version: '7.5.0',
      approach: {
        description: 'LANDSCAPE-FIRST: Design content for 6" wide × 4" tall, then rotate ENTIRE content area 90°',
        physicalLabels: 'S-12212 (4" × 6")',
        layoutSpecs: 'S-5492 specifications from labelFormatter.js',
        contentDesign: '6" wide × 4" tall landscape layout',
        rotation: 'Entire content area rotated 90° clockwise as complete unit',
        method: 'PDF coordinate transformation with complete content rotation'
      },
      layoutStructure: {
        landscapeDesign: 'Content designed as 6" wide × 4" tall landscape',
        leftSection: '35% - Audit trail + Brand/Product names (horizontal text)',
        centerSection: '35% - Store label and text box (horizontal orientation)',
        rightSection: '30% - Barcode + Dates + Case/Box (stacked vertically)',
        transformation: 'Entire content area rotated 90° clockwise using PDF transformation',
        afterRotation: 'Content optimally positioned when paper is rotated 90°'
      },
      improvements: [
        'Content designed as true landscape layout (6" wide × 4" tall)',
        'ENTIRE content area rotated as complete unit (not individual text elements)',
        'Optimal space utilization for larger fonts and better readability',
        'Professional landscape layout when paper is physically rotated',
        'Uses existing S5492_NEW_ROTATED_LAYOUT specifications',
        'Maintains all existing functionality (brand detection, barcode generation)'
      ],
      specifications: {
        designDimensions: '432pt × 288pt (6" × 4" landscape)',
        rotationMethod: 'PDF coordinate transformation (90° clockwise)',
        auditTrail: 'Horizontal text in top-left of landscape design',
        brandProduct: 'Horizontal text with optimal font sizing',
        storeSection: 'Horizontal orientation with writing lines',
        barcodeSection: 'Horizontal barcode with numeric display above',
        datesSection: 'Centered horizontal text for labels and values',
        caseBoxSection: 'Horizontal text in bordered boxes'
      },
      workflow: {
        step1: 'Design content for 6" wide × 4" tall landscape layout',
        step2: 'Apply PDF transformation to rotate ENTIRE content area 90° clockwise',
        step3: 'Print on legal paper (8.5" × 14") using HP E877',
        step4: 'Rotate paper 90° clockwise to read optimally positioned content',
        result: 'Each label appears as 6" wide × 4" tall with professional layout'
      },
      positions: positions
    };
  }

  // Legacy compatibility methods
  static calculateUlineLabelPosition(labelIndex) {
    return this.calculateUlineS12212Position(labelIndex % 4);
  }

  static async drawSidewaysLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawS12212LabelLandscapeRotated(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }

  static async draw4LayerOptimizedLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawS12212LabelLandscapeRotated(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }
}