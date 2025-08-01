import jsPDF from 'jspdf';
import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generation utilities for Uline S-12212 label sheets (4" × 6")
 * ALL TEXT ROTATED 90° CLOCKWISE: Taking current perfect layout and rotating all text elements
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
          await this.drawAllTextRotatedLabel(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
      }

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-12212 Format Labels (All Text Rotated 90° Clockwise)',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v7.3.0',
        keywords: 'cannabis, inventory, labels, uline, s-12212, all-text-rotated'
      });

      // Log generation event
      storage.addSessionEvent(
        EVENT_TYPES.LABEL_GENERATED,
        `Generated ${currentLabelIndex} S-12212 labels with all text rotated 90° clockwise across ${currentPage} pages`,
        `Items: ${labelDataArray.length}, Format: Uline S-12212 (All Text Rotated 90° Clockwise)`
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
      rotationInstructions: 'All text rotated 90° clockwise for optimal reading'
    };
  }

  /**
   * Draw label with ALL TEXT ROTATED 90° CLOCKWISE
   * Keep current perfect layout and positioning, just rotate every text element
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Formatted label data
   * @param {Object} position - Label position and dimensions
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total number of boxes
   * @param {boolean} debug - Show debug borders
   * @param {string} currentUser - Current user
   */
  static async drawAllTextRotatedLabel(pdf, labelData, position, boxNumber = 1, totalBoxes = 1, debug = false, currentUser = 'Unknown') {
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
        pdf.text(`L${position.labelIndex + 1} ALL-ROT`, x + 5, y + 15, { angle: 90 });
      }

      const padding = 10;
      const contentX = x + padding;
      const contentY = y + padding;
      const contentWidth = width - (padding * 2);    // 268pt
      const contentHeight = height - (padding * 2);  // 412pt

      // 4-LAYER LAYOUT designed for 6" width (432pt when rotated) WITH ALL TEXT ROTATED
      const brandInfo = this.extractBrandFromProductName(labelData.productName);

      // LAYER 1: Brand + Product Name (Top section - 40% of height) - ALL TEXT ROTATED
      const layer1Height = Math.floor(contentHeight * 0.40); // 166pt
      await this.drawLayer1BrandAndProductAllRotated(pdf, brandInfo, contentX, contentY, contentWidth, layer1Height);

      // LAYER 2: Store Section (Middle section - 25% of height) - ALL TEXT ROTATED  
      const layer2Y = contentY + layer1Height;
      const layer2Height = Math.floor(contentHeight * 0.25); // 104pt
      this.drawLayer2StoreSectionAllRotated(pdf, contentX, layer2Y, contentWidth, layer2Height);

      // LAYER 3: Bottom Row - Barcode | Dates | Case/Box (Bottom section - 30% of height) - ALL TEXT ROTATED
      const layer3Y = contentY + layer1Height + layer2Height;
      const layer3Height = Math.floor(contentHeight * 0.30); // 125pt
      await this.drawLayer3BottomRowAllRotated(pdf, labelData, contentX, layer3Y, contentWidth, layer3Height, boxNumber, totalBoxes);

      // LAYER 4: Audit Trail (Very bottom - 5% of height) - TEXT ROTATED
      const layer4Y = contentY + layer1Height + layer2Height + layer3Height;
      const layer4Height = contentHeight - layer1Height - layer2Height - layer3Height; // Remaining space
      this.drawLayer4AuditTrailAllRotated(pdf, currentUser, contentX, layer4Y, contentWidth, layer4Height);

    } catch (error) {
      console.error('Error drawing all text rotated label:', error);
      pdf.setFontSize(10);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Error', x + 5, y + 20, { angle: 90 });
    }
  }

  /**
   * LAYER 1: Draw brand and product name with ALL TEXT ROTATED 90° clockwise
   */
  static async drawLayer1BrandAndProductAllRotated(pdf, brandInfo, x, y, width, height) {
    let currentY = y + 15;
    const lineSpacing = 1.3;

    // Brand name first (large, prominent) - ROTATED 90° CLOCKWISE
    if (brandInfo.brand) {
      const brandFontSize = Math.min(28, LabelFormatter.autoFitFontSize(brandInfo.brand, width, 35, 28));
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(brandFontSize);
      pdf.setTextColor(0, 0, 0);
      
      // Center the brand text horizontally, rotate 90° clockwise
      const brandWidth = pdf.getTextWidth(brandInfo.brand);
      const brandX = x + (width - brandWidth) / 2;
      pdf.text(brandInfo.brand, brandX, currentY, { angle: 90 });
      currentY += brandFontSize * lineSpacing + 8;
    }

    // Product name below brand (utilizing full width) - ROTATED 90° CLOCKWISE
    const remainingHeight = Math.max(30, height - (currentY - y) - 10);
    const maxProductFontSize = brandInfo.brand ? 24 : 30;
    
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
    productLines.forEach((line) => {
      const textWidth = pdf.getTextWidth(line);
      const centerX = x + (width - textWidth) / 2;
      pdf.text(line, centerX, currentY, { angle: 90 });
      currentY += productFontSize * lineSpacing;
    });
  }

  /**
   * LAYER 2: Draw store section with ALL TEXT ROTATED 90° clockwise
   */
  static drawLayer2StoreSectionAllRotated(pdf, x, y, width, height) {
    // "Store:" label centered - ROTATED 90° CLOCKWISE
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14); // Larger font for prominence
    pdf.setTextColor(0, 0, 0);
    
    const storeLabel = 'Store:';
    const labelWidth = pdf.getTextWidth(storeLabel);
    const labelX = x + (width - labelWidth) / 2;
    pdf.text(storeLabel, labelX, y + 20, { angle: 90 });
    
    // Text box centered below label (unchanged positioning)
    const boxWidth = Math.min(width * 0.8, 200); // 80% of width or 200pt max
    const boxHeight = Math.min(height - 35, 60); // Leave space for label above
    const boxX = x + (width - boxWidth) / 2;
    const boxY = y + 30;
    
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
      pdf.line(boxX + 2, lineY, boxX + boxWidth - 2, lineY);
    }
  }

  /**
   * LAYER 3: Draw bottom row with ALL TEXT ROTATED 90° clockwise
   */
  static async drawLayer3BottomRowAllRotated(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    // 3 evenly distributed sections
    const sectionWidth = width / 3;
    
    // Section 1: Barcode (left) - WITH ALL TEXT ROTATED
    await this.drawBarcodeSectionAllRotated(pdf, labelData, x, y, sectionWidth, height);
    
    // Section 2: Dates (center) - WITH ALL TEXT ROTATED
    this.drawDatesSectionAllRotated(pdf, labelData, x + sectionWidth, y, sectionWidth, height);
    
    // Section 3: Case/Box (right) - WITH ALL TEXT ROTATED
    this.drawCaseBoxSectionAllRotated(pdf, labelData, x + (sectionWidth * 2), y, sectionWidth, height, boxNumber, totalBoxes);
  }

  /**
   * Draw barcode section with ALL TEXT ROTATED 90° clockwise
   */
  static async drawBarcodeSectionAllRotated(pdf, labelData, x, y, width, height) {
    const padding = 5;
    const innerX = x + padding;
    const innerWidth = width - (padding * 2);
    
    // Barcode numeric display - ROTATED 90° CLOCKWISE
    const spacedBarcodeDisplay = this.formatBarcodeWithSpaces(labelData.barcodeDisplay);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9); // Larger font
    pdf.setTextColor(102, 102, 102);
    
    const displayWidth = pdf.getTextWidth(spacedBarcodeDisplay);
    const displayX = innerX + Math.max(0, (innerWidth - displayWidth) / 2);
    pdf.text(spacedBarcodeDisplay, displayX, y + 15, { angle: 90 });
    
    // Barcode image (positioned for rotated view)
    const barcodeHeight = Math.min(height - 25, 80); // Larger barcode
    await this.drawEnhancedBarcodeRotated(
      pdf, 
      labelData.barcode, 
      innerX, 
      y + 20, 
      innerWidth, 
      barcodeHeight
    );
  }

  /**
   * Draw dates section with ALL TEXT ROTATED 90° clockwise
   */
  static drawDatesSectionAllRotated(pdf, labelData, x, y, width, height) {
    const padding = 5;
    const innerX = x + padding;
    let currentY = y + 15;
    
    // Harvest Date - ALL TEXT ROTATED 90° CLOCKWISE
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12); // Larger font
    pdf.setTextColor(0, 0, 0);
    
    const harvestLabel = 'Harvest:';
    const harvestLabelWidth = pdf.getTextWidth(harvestLabel);
    const harvestLabelX = innerX + ((width - padding * 2) - harvestLabelWidth) / 2;
    pdf.text(harvestLabel, harvestLabelX, currentY, { angle: 90 });
    currentY += 18;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    const harvestDate = labelData.harvestDate || 'MM/DD/YY';
    const harvestDateWidth = pdf.getTextWidth(harvestDate);
    const harvestDateX = innerX + ((width - padding * 2) - harvestDateWidth) / 2;
    pdf.text(harvestDate, harvestDateX, currentY, { angle: 90 });
    currentY += 25;
    
    // Package Date - ALL TEXT ROTATED 90° CLOCKWISE
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    const packageLabel = 'Package:';
    const packageLabelWidth = pdf.getTextWidth(packageLabel);
    const packageLabelX = innerX + ((width - padding * 2) - packageLabelWidth) / 2;
    pdf.text(packageLabel, packageLabelX, currentY, { angle: 90 });
    currentY += 18;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    const packageDate = labelData.packagedDate || 'MM/DD/YY';
    const packageDateWidth = pdf.getTextWidth(packageDate);
    const packageDateX = innerX + ((width - padding * 2) - packageDateWidth) / 2;
    pdf.text(packageDate, packageDateX, currentY, { angle: 90 });
  }

  /**
   * Draw case/box section with ALL TEXT ROTATED 90° clockwise
   */
  static drawCaseBoxSectionAllRotated(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    const padding = 5;
    const innerX = x + padding;
    const innerWidth = width - (padding * 2);
    let currentY = y + 15;
    
    const boxHeight = 20; // Larger boxes
    
    // Case Qty Box
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(innerX, currentY, innerWidth, boxHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11); // Larger font
    pdf.setTextColor(0, 0, 0);
    const caseQtyValue = labelData.caseQuantity || '___';
    const caseQtyText = `Case: ${caseQtyValue}`;
    
    const caseQtyWidth = pdf.getTextWidth(caseQtyText);
    const caseQtyX = innerX + (innerWidth - caseQtyWidth) / 2;
    pdf.text(caseQtyText, caseQtyX, currentY + 14, { angle: 90 });
    
    currentY += boxHeight + 15;
    
    // Box Number Box
    pdf.rect(innerX, currentY, innerWidth, boxHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    
    const boxTextWidth = pdf.getTextWidth(boxText);
    const boxTextX = innerX + (innerWidth - boxTextWidth) / 2;
    pdf.text(boxText, boxTextX, currentY + 14, { angle: 90 });
  }

  /**
   * LAYER 4: Draw audit trail with TEXT ROTATED 90° clockwise
   */
  static drawLayer4AuditTrailAllRotated(pdf, currentUser, x, y, width, height) {
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
    pdf.setFontSize(6); // Very small to stay out of the way
    pdf.setTextColor(102, 102, 102);
    
    // Draw rotated audit trail at bottom left
    pdf.text(auditLine, x, y + height - 3, { angle: 90 }); // Bottom left
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
      // Create barcode in normal orientation first
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
      
      // Add the barcode image rotated 90° clockwise
      pdf.addImage(barcodeDataURL, 'PNG', x, y, width, height, '', '', 90);

    } catch (error) {
      console.error('Barcode generation error:', error);
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
   * Generate test PDF
   */
  static async generateTestPDF() {
    const testData = [{
      sku: 'TEST-S12212-ALL-TEXT-ROT',
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
      labelFormat: 'Uline S-12212 (All Text Rotated 90° Clockwise)',
      pageSize: 'Legal (8.5" × 14")',
      labelsPerPage: 4,
      contentLayout: '4-Layer: Brand+Product | Store | Barcode+Dates+Case | Audit (ALL TEXT ROTATED 90°)',
      rotationNote: 'All text elements and barcode rotated 90° clockwise for optimal space utilization',
      allTextRotated: 'Every text element rotated 90° clockwise including barcode'
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
      migration: 'Uline S-12212 All Text Rotated 90° Clockwise',
      version: '7.3.0',
      allTextRotation: {
        enabled: true,
        angle: '90° clockwise',
        method: 'pdf.text(text, x, y, { angle: 90 }) for every text element',
        elements: [
          'Brand names',
          'Product names (multi-line)',
          'Store label',
          'Barcode numeric display',
          'Harvest label and date',
          'Package label and date', 
          'Case label and value',
          'Box number display',
          'Audit trail'
        ],
        barcode: 'Barcode image also rotated 90° clockwise'
      },
      layerStructure: {
        layer1: 'Brand + Product Name (40% height) - All text rotated for maximum visibility',
        layer2: 'Store Section (25% height) - Store label and text box, label rotated',
        layer3: 'Bottom Row (30% height) - Barcode | Dates | Case/Box all text rotated',
        layer4: 'Audit Trail (5% height) - Audit text rotated, bottom left corner'
      },
      optimization: {
        targetDimensions: '6" wide × 4" tall (when paper rotated)',
        textRotation: 'All text rotated 90° clockwise within containers',
        readingMethod: 'Turn head or label to read - text flows optimally',
        visibility: 'Larger fonts possible with rotated text layout'
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
    return this.drawAllTextRotatedLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }

  static async drawSidewaysLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawAllTextRotatedLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }

  static async draw4LayerOptimizedLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawAllTextRotatedLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }
}