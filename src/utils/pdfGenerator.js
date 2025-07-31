import jsPDF from 'jspdf';
import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generation utilities for Uline S-5492 label sheets
 * SIDEWAYS LAYOUT: Labels positioned sideways on legal paper - rotate paper 90° to read
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

          // Draw the sideways label
          await this.drawSidewaysLabel(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
      }

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-5492 Format Labels (SIDEWAYS for 90° rotation)',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v6.2.0',
        keywords: 'cannabis, inventory, labels, uline, s-5492, sideways, legal'
      });

      // Log generation event
      storage.addSessionEvent(
        EVENT_TYPES.LABEL_GENERATED,
        `Generated ${currentLabelIndex} S-5492 sideways labels across ${currentPage} pages`,
        `Items: ${labelDataArray.length}, Format: Uline S-5492 (Sideways for 90° rotation)`
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
   * Labels are positioned sideways - paper must be rotated 90° for reading/peeling
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
   * Draw sideways label - content will be readable when paper is rotated 90°
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Formatted label data
   * @param {Object} position - Label position and dimensions
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total number of boxes
   * @param {boolean} debug - Show debug borders
   * @param {string} currentUser - Current user
   */
  static async drawSidewaysLabel(pdf, labelData, position, boxNumber = 1, totalBoxes = 1, debug = false, currentUser = 'Unknown') {
    const { x, y, width, height, rotatedWidth, rotatedHeight } = position;

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
        pdf.text(`Label ${position.labelIndex + 1}`, x + 5, y + 15);
        pdf.text(`${width}×${height}pt`, x + 5, y + 25);
        pdf.text('SIDEWAYS', x + 5, y + 35);
      }

      const padding = 8;
      const contentX = x + padding;
      const contentY = y + padding;
      const contentWidth = width - (padding * 2);
      const contentHeight = height - (padding * 2);

      // Draw content positioned for sideways reading
      // When paper is rotated 90° clockwise, this will be readable
      
      // 1. Product name (will be at top when rotated)
      const productNameHeight = Math.floor(contentHeight * 0.6);
      const brandInfo = this.extractBrandFromProductName(labelData.productName);
      await this.drawSidewaysProductName(pdf, brandInfo, contentX, contentY, contentWidth, productNameHeight);
      
      // 2. Bottom section (will be at bottom when rotated)
      const bottomSectionHeight = Math.floor(contentHeight * 0.35);
      const bottomSectionY = contentY + contentHeight - bottomSectionHeight;
      await this.drawSidewaysBottomSection(pdf, labelData, contentX, bottomSectionY, contentWidth, bottomSectionHeight, boxNumber, totalBoxes);
      
      // 3. Audit trail (absolute bottom)
      const auditY = y + height - 6;
      this.drawSidewaysAuditTrail(pdf, currentUser, contentX, auditY);

    } catch (error) {
      console.error('Error drawing sideways label:', error);
      pdf.setFontSize(10);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Error', x + 5, y + 20);
    }
  }

  /**
   * Draw product name positioned for sideways reading
   * @param {jsPDF} pdf - PDF document
   * @param {Object} brandInfo - Brand and product info
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Available width
   * @param {number} height - Available height
   */
  static async drawSidewaysProductName(pdf, brandInfo, x, y, width, height) {
    let currentY = y;
    const lineSpacing = 1.1;

    // Draw brand name if present
    if (brandInfo.brand) {
      const brandFontSize = Math.min(18, LabelFormatter.autoFitFontSize(brandInfo.brand, width, 25, 18));
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(brandFontSize);
      pdf.setTextColor(0, 0, 0);
      
      // Center the brand text
      const brandWidth = pdf.getTextWidth(brandInfo.brand);
      const brandX = x + (width - brandWidth) / 2;
      pdf.text(brandInfo.brand, brandX, currentY + (brandFontSize * 0.8));
      currentY += brandFontSize * lineSpacing + 8;
    }

    // Draw product name
    const remainingHeight = Math.max(15, height - (currentY - y));
    const maxProductFontSize = brandInfo.brand ? 22 : 28;
    
    const productFontSize = LabelFormatter.autoFitFontSize(
      brandInfo.productName, 
      width, 
      remainingHeight, 
      maxProductFontSize
    );
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(productFontSize);
    pdf.setTextColor(0, 0, 0);
    
    const productLines = pdf.splitTextToSize(brandInfo.productName, width);
    productLines.forEach((line) => {
      const textWidth = pdf.getTextWidth(line);
      const centerX = x + (width - textWidth) / 2;
      pdf.text(line, centerX, currentY + (productFontSize * 0.8));
      currentY += productFontSize * lineSpacing;
    });
  }

  /**
   * Draw bottom section positioned for sideways reading
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Available width
   * @param {number} height - Available height
   * @param {number} boxNumber - Box number
   * @param {number} totalBoxes - Total boxes
   */
  static async drawSidewaysBottomSection(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    // Layout info across the width
    const section1Width = width * 0.25; // Barcode
    const section2Width = width * 0.25; // Text box
    const section3Width = width * 0.25; // Dates
    const section4Width = width * 0.25; // Case/Box
    
    let currentX = x;
    
    // 1. Barcode section
    await this.drawSidewaysBarcode(pdf, labelData, currentX, y, section1Width, height);
    currentX += section1Width;
    
    // 2. Manual text box
    this.drawManualWritingBox(pdf, currentX + 2, y + height - 30, section2Width - 4, 25);
    currentX += section2Width;
    
    // 3. Dates section
    this.drawSidewaysDates(pdf, labelData, currentX, y, section3Width, height);
    currentX += section3Width;
    
    // 4. Case/Box section
    this.drawSidewaysCaseBox(pdf, labelData, currentX, y, section4Width, height, boxNumber, totalBoxes);
  }

  /**
   * Draw barcode positioned for sideways reading
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Section width
   * @param {number} height - Section height
   */
  static async drawSidewaysBarcode(pdf, labelData, x, y, width, height) {
    const barcodeHeight = Math.min(30, height * 0.6);
    
    // Barcode display text
    const spacedBarcodeDisplay = this.formatBarcodeWithSpaces(labelData.barcodeDisplay);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(102, 102, 102);
    const displayWidth = pdf.getTextWidth(spacedBarcodeDisplay);
    const displayX = x + Math.max(0, (width - displayWidth) / 2);
    pdf.text(spacedBarcodeDisplay, displayX, y + 8);
    
    // Draw barcode
    await this.drawEnhancedBarcode(
      pdf, 
      labelData.barcode, 
      x + 2, 
      y + 12, 
      width - 4, 
      barcodeHeight
    );
  }

  /**
   * Draw dates positioned for sideways reading
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Section width
   * @param {number} height - Section height
   */
  static drawSidewaysDates(pdf, labelData, x, y, width, height) {
    let currentY = y + 10;
    
    // Harvest Date
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);
    const harvestText = `Harvest: ${labelData.harvestDate || 'MM/DD/YY'}`;
    pdf.text(harvestText, x, currentY);
    currentY += 10;
    
    // Packaged Date
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    const packagedText = `Packaged: ${labelData.packagedDate || 'MM/DD/YY'}`;
    pdf.text(packagedText, x, currentY);
  }

  /**
   * Draw case/box info positioned for sideways reading
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Section width
   * @param {number} height - Section height
   * @param {number} boxNumber - Box number
   * @param {number} totalBoxes - Total boxes
   */
  static drawSidewaysCaseBox(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    const boxWidth = Math.min(width - 4, 50);
    const boxHeight = 10;
    let currentY = y + 8;
    
    // Case Qty Box
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, currentY, boxWidth, boxHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    const caseQtyValue = labelData.caseQuantity || '___';
    const caseQtyText = `Case: ${caseQtyValue}`;
    const caseQtyWidth = pdf.getTextWidth(caseQtyText);
    pdf.text(caseQtyText, x + (boxWidth - caseQtyWidth) / 2, currentY + 7);
    
    currentY += boxHeight + 3;
    
    // Box Number Box
    pdf.rect(x, currentY, boxWidth, boxHeight);
    
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    const boxTextWidth = pdf.getTextWidth(boxText);
    pdf.text(boxText, x + (boxWidth - boxTextWidth) / 2, currentY + 7);
  }

  /**
   * Draw audit trail positioned for sideways reading
   * @param {jsPDF} pdf - PDF document
   * @param {string} currentUser - Current user
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  static drawSidewaysAuditTrail(pdf, currentUser, x, y) {
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
    
    const auditString = `${month}/${day}/${year} ${hoursStr}:${minutes} ${ampm} EST (${currentUser})`;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5);
    pdf.setTextColor(102, 102, 102);
    pdf.text(auditString, x, y);
  }

  /**
   * Extract brand from product name
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
   * Draw manual writing text box
   */
  static drawManualWritingBox(pdf, x, y, width, height) {
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, y, width, height);

    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.5);
    
    const lineSpacing = height / 3;
    for (let i = 1; i < 3; i++) {
      const lineY = y + (i * lineSpacing);
      pdf.line(x, lineY, x + width, lineY);
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
   * Generate test PDF for S-5492 sideways verification
   * @returns {Promise<Blob>} - Test PDF blob
   */
  static async generateTestPDF() {
    const testData = [{
      sku: 'TEST-S5492-SIDE',
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
   * Generate alignment test PDF showing sideways positioning
   * @returns {Promise<Blob>} - Test PDF with measurements
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
    pdf.text('S-5492 SIDEWAYS Test - Rotate Paper 90° to Read Labels', 50, 30);

    // Draw all 4 label positions
    for (let i = 0; i < 4; i++) {
      const pos = this.calculateUlineS5492PositionSideways(i);
      
      // Label outline
      pdf.setDrawColor(255, 0, 0);
      pdf.setLineWidth(2);
      pdf.rect(pos.x, pos.y, pos.width, pos.height);
      
      // Position info
      pdf.setFontSize(10);
      pdf.setTextColor(255, 0, 0);
      pdf.text(`Label ${i + 1}`, pos.x + 5, pos.y + 15);
      pdf.text(`${pos.width}×${pos.height}pt`, pos.x + 5, pos.y + 28);
      pdf.text('SIDEWAYS', pos.x + 5, pos.y + 41);
    }

    // Instructions
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Instructions:', 50, 80);
    pdf.setFontSize(10);
    pdf.text('1. Print this PDF on legal size paper', 50, 95);
    pdf.text('2. Rotate paper 90° clockwise', 50, 110);
    pdf.text('3. Labels should now be readable (6" wide × 4" tall)', 50, 125);

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
      labelFormat: 'S-5492 (SIDEWAYS)',
      pageSize: 'Legal (8.5" × 14")',
      labelsPerPage: 4,
      rotationNote: 'Labels positioned sideways - rotate paper 90° clockwise for reading/peeling'
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
      migration: 'S-21846 → S-5492 (SIDEWAYS FIXED)',
      labelSpecs: {
        dimensions: '4" × 6" (positioned sideways)',
        orientation: 'SIDEWAYS (no PDF transformation)',
        labelsPerSheet: 4,
        layout: '2×2 grid of sideways labels',
        workflow: 'Print → Rotate paper 90° clockwise → Read/peel labels'
      },
      pageSize: {
        format: 'Legal',
        dimensions: '8.5" × 14"',
        printableArea: '588 × 984 points (HP E877 margins)'
      },
      positions: positions,
      fixes: [
        'Removed all PDF transformation functions',
        'No setTransformationMatrix calls',
        'Simple positioning without rotation',
        'Content oriented for post-rotation reading'
      ],
      instructions: [
        'Print PDF on legal size paper using HP E877',
        'Use "Actual Size" print setting (no scaling)',
        'Rotate printed paper 90° clockwise',
        'Labels are now readable: 6" wide × 4" tall',
        'Peel and apply labels normally'
      ]
    };
  }

  // Legacy compatibility
  static calculateUlineLabelPosition(labelIndex) {
    return this.calculateUlineS5492PositionSideways(labelIndex % 4);
  }
}