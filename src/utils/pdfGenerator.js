import jsPDF from 'jspdf';
import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generation utilities for Uline S-5492 label sheets
 * ROTATED LAYOUT: Labels positioned sideways on legal paper for 90-degree rotation workflow
 */
export class PDFGenerator {
  /**
   * Generate PDF with labels positioned for Uline S-5492 sheets (ROTATED)
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
      orientation: 'portrait', // PDF page is portrait but labels are rotated
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

          // Calculate position for this label (ROTATED)
          const position = this.calculateUlineS5492PositionRotated(currentLabelIndex % specs.LABELS_PER_SHEET);

          // Calculate which box number this label represents
          const boxNumber = Math.floor(labelCopy / Math.max(1, Math.floor(formattedData.labelQuantity / formattedData.boxCount))) + 1;

          // Draw the rotated label
          await this.drawRotatedLabel(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
      }

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-5492 Format Labels (ROTATED for 90° workflow)',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v6.1.0',
        keywords: 'cannabis, inventory, labels, uline, s-5492, rotated, legal'
      });

      // Log generation event
      storage.addSessionEvent(
        EVENT_TYPES.LABEL_GENERATED,
        `Generated ${currentLabelIndex} S-5492 rotated labels across ${currentPage} pages`,
        `Items: ${labelDataArray.length}, Format: Uline S-5492 (Rotated for 90° workflow)`
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
   * Calculate label position for Uline S-5492 ROTATED on legal paper
   * Labels are positioned sideways - paper must be rotated 90° for reading/peeling
   * @param {number} labelIndex - Index of label (0-3 for 4 labels per sheet)
   * @returns {Object} - Position coordinates in points
   */
  static calculateUlineS5492PositionRotated(labelIndex) {
    // Legal size sheet dimensions (8.5" × 14")
    const pageWidth = 612;   // 8.5" in points  
    const pageHeight = 1008; // 14" in points
    
    // HP E877 printer margins: 0.167" on all sides
    const printerMargin = 12; // 0.167" = 12pt
    const printableWidth = pageWidth - (printerMargin * 2);   // 588pt
    const printableHeight = pageHeight - (printerMargin * 2); // 984pt
    
    // S-5492 ROTATED dimensions: When paper is rotated 90°, we have:
    // - Effective width: 14" (1008pt) minus margins = 984pt
    // - Effective height: 8.5" (612pt) minus margins = 588pt
    // - Label size: 4" × 6" becomes 6" wide × 4" tall in rotated view
    
    // In the rotated coordinate system:
    const rotatedPageWidth = printableHeight;  // 984pt (14" - margins)
    const rotatedPageHeight = printableWidth;  // 588pt (8.5" - margins)
    
    // Label dimensions in rotated view
    const labelWidth = 432;  // 6" wide in rotated view
    const labelHeight = 288; // 4" tall in rotated view
    
    // Grid layout: 2 columns × 2 rows in rotated view
    const cols = 2;
    const rows = 2;
    const row = Math.floor(labelIndex / cols);
    const col = labelIndex % cols;
    
    // Calculate positions in rotated coordinate system
    const rotatedX = col * (labelWidth + 12) + 6; // Small gap between columns
    const rotatedY = row * (labelHeight + 12) + 6; // Small gap between rows
    
    // Transform back to PDF coordinate system (unrotated)
    // When rotated 90° clockwise: x' = y, y' = pageWidth - x
    const pdfX = printerMargin + rotatedY;
    const pdfY = printerMargin + (rotatedPageWidth - rotatedX - labelWidth);
    
    return {
      x: Math.floor(pdfX),
      y: Math.floor(pdfY),
      width: labelHeight,  // In PDF coords: height becomes width
      height: labelWidth,  // In PDF coords: width becomes height
      
      // Rotation information
      isRotated: true,
      rotationAngle: 90,
      rotatedWidth: labelWidth,   // Width when rotated (6")
      rotatedHeight: labelHeight, // Height when rotated (4")
      
      // Grid information
      row: row,
      col: col,
      labelIndex: labelIndex,
      
      // Debug info
      rotatedCoords: { x: rotatedX, y: rotatedY },
      rotatedPageSize: { width: rotatedPageWidth, height: rotatedPageHeight }
    };
  }

  /**
   * Draw rotated label with content oriented for 90-degree rotation
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Formatted label data
   * @param {Object} position - Label position and dimensions
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total number of boxes
   * @param {boolean} debug - Show debug borders
   * @param {string} currentUser - Current user
   */
  static async drawRotatedLabel(pdf, labelData, position, boxNumber = 1, totalBoxes = 1, debug = false, currentUser = 'Unknown') {
    const { x, y, width, height, rotatedWidth, rotatedHeight } = position;

    // Save the current transformation state
    pdf.saveGraphicsState();
    
    // Move to label position and rotate 90 degrees clockwise
    pdf.setGState('normal');
    
    // Apply rotation: translate to label center, rotate, translate back
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    
    pdf.setTransformationMatrix(
      0, 1,    // Rotate 90° clockwise
      -1, 0,   
      centerX + centerY, centerY - centerX  // Translation
    );
    
    // Now draw in the rotated coordinate system
    const rotatedX = -rotatedWidth / 2;
    const rotatedY = -rotatedHeight / 2;

    // Draw label border
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(rotatedX, rotatedY, rotatedWidth, rotatedHeight);

    // Debug info
    if (debug) {
      pdf.setDrawColor(255, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.rect(rotatedX + 2, rotatedY + 2, rotatedWidth - 4, rotatedHeight - 4);
      
      // Debug text
      pdf.setFontSize(8);
      pdf.setTextColor(255, 0, 0);
      pdf.text(`${(rotatedWidth/72).toFixed(2)}" × ${(rotatedHeight/72).toFixed(2)}"`, rotatedX + 5, rotatedY + 15);
      pdf.text(`ROTATED Label ${position.labelIndex + 1}`, rotatedX + 5, rotatedY + 25);
    }

    const padding = 8;
    const contentX = rotatedX + padding;
    const contentY = rotatedY + padding;
    const contentWidth = rotatedWidth - (padding * 2);
    const contentHeight = rotatedHeight - (padding * 2);

    try {
      // Draw content in rotated orientation
      
      // 1. Audit trail (bottom left in rotated view)
      const auditY = rotatedY + rotatedHeight - 8;
      this.drawAuditTrail(pdf, currentUser, contentX, auditY);
      
      // 2. Bottom section: Horizontal layout (in rotated view)
      const bottomSectionHeight = 60;
      const bottomSectionY = rotatedY + rotatedHeight - bottomSectionHeight - 15;
      await this.drawHorizontalBottomSection(pdf, labelData, contentX, bottomSectionY, contentWidth, bottomSectionHeight, boxNumber, totalBoxes);
      
      // 3. Top section: Product name (in rotated view)
      const productNameHeight = contentHeight - bottomSectionHeight - 20;
      const brandInfo = this.extractBrandFromProductName(labelData.productName);
      await this.drawProductNameRotated(pdf, brandInfo, contentX, contentY, contentWidth, productNameHeight);

    } catch (error) {
      console.error('Error drawing rotated label:', error);
      pdf.setFontSize(10);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Error', contentX + 5, contentY + 20);
    }
    
    // Restore the graphics state
    pdf.restoreGraphicsState();
  }

  /**
   * Draw horizontal bottom section in rotated coordinate system
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position (in rotated coords)
   * @param {number} y - Y position (in rotated coords)
   * @param {number} width - Available width (in rotated coords)
   * @param {number} height - Available height (in rotated coords)
   * @param {number} boxNumber - Box number
   * @param {number} totalBoxes - Total boxes
   */
  static async drawHorizontalBottomSection(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    // Divide into 4 horizontal sections
    const sectionWidth = width / 4;
    let currentX = x;
    
    // Section 1: Barcode (far left)
    await this.drawBarcodeSection(pdf, labelData, currentX, y, sectionWidth, height);
    currentX += sectionWidth;
    
    // Section 2: Manual text box
    this.drawManualWritingBox(pdf, currentX + 5, y + height - 35, sectionWidth - 10, 30);
    currentX += sectionWidth;
    
    // Section 3: Dates
    this.drawDatesSection(pdf, labelData, currentX, y, sectionWidth, height);
    currentX += sectionWidth;
    
    // Section 4: Case/Box info (far right)
    this.drawCaseBoxSection(pdf, labelData, currentX, y, sectionWidth, height, boxNumber, totalBoxes);
  }

  /**
   * Draw product name in rotated coordinate system
   * @param {jsPDF} pdf - PDF document
   * @param {Object} brandInfo - Brand and product info
   * @param {number} x - X position (in rotated coords)
   * @param {number} y - Y position (in rotated coords)
   * @param {number} width - Available width (in rotated coords)
   * @param {number} height - Available height (in rotated coords)
   */
  static async drawProductNameRotated(pdf, brandInfo, x, y, width, height) {
    let currentY = y;
    const lineSpacing = 1.1;

    // Draw brand name if present
    if (brandInfo.brand) {
      const brandFontSize = Math.min(20, LabelFormatter.autoFitFontSize(brandInfo.brand, width, 25, 20));
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(brandFontSize);
      pdf.setTextColor(0, 0, 0);
      
      const brandLines = pdf.splitTextToSize(brandInfo.brand, width);
      brandLines.forEach((line) => {
        const textWidth = pdf.getTextWidth(line);
        const centerX = x + (width - textWidth) / 2;
        pdf.text(line, centerX, currentY + (brandFontSize * 0.8));
        currentY += brandFontSize * lineSpacing;
      });
      
      currentY += 8;
    }

    // Draw product name (large for visibility)
    const remainingHeight = Math.max(15, height - (currentY - y));
    const maxProductFontSize = brandInfo.brand ? 24 : 32;
    
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
   * Draw barcode section in rotated coordinates
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Section width
   * @param {number} height - Section height
   */
  static async drawBarcodeSection(pdf, labelData, x, y, width, height) {
    const barcodeHeight = Math.min(35, height * 0.6);
    
    // Barcode display text
    const spacedBarcodeDisplay = this.formatBarcodeWithSpaces(labelData.barcodeDisplay);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(102, 102, 102);
    const displayWidth = pdf.getTextWidth(spacedBarcodeDisplay);
    const displayCenterX = x + Math.max(0, (width - displayWidth) / 2);
    pdf.text(spacedBarcodeDisplay, displayCenterX, y + 10);
    
    // Draw barcode
    await this.drawEnhancedBarcode(
      pdf, 
      labelData.barcode, 
      x + 2, 
      y + 15, 
      width - 4, 
      barcodeHeight
    );
  }

  /**
   * Draw dates section in rotated coordinates
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Section width
   * @param {number} height - Section height
   */
  static drawDatesSection(pdf, labelData, x, y, width, height) {
    let currentY = y + 12;
    
    // Harvest Date
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    const harvestText = `Harvest: ${labelData.harvestDate || 'MM/DD/YY'}`;
    pdf.text(harvestText, x, currentY);
    currentY += 12;
    
    // Packaged Date
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const packagedText = `Packaged: ${labelData.packagedDate || 'MM/DD/YY'}`;
    pdf.text(packagedText, x, currentY);
  }

  /**
   * Draw case/box section in rotated coordinates
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Section width
   * @param {number} height - Section height
   * @param {number} boxNumber - Box number
   * @param {number} totalBoxes - Total boxes
   */
  static drawCaseBoxSection(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    const boxWidth = Math.min(width - 5, 60);
    const boxHeight = 12;
    let currentY = y + 8;
    
    // Case Qty Box
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, currentY, boxWidth, boxHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    const caseQtyValue = labelData.caseQuantity || '___';
    const caseQtyText = `Case: ${caseQtyValue}`;
    const caseQtyWidth = pdf.getTextWidth(caseQtyText);
    pdf.text(caseQtyText, x + (boxWidth - caseQtyWidth) / 2, currentY + 8);
    
    currentY += boxHeight + 4;
    
    // Box Number Box
    pdf.rect(x, currentY, boxWidth, boxHeight);
    
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    const boxTextWidth = pdf.getTextWidth(boxText);
    pdf.text(boxText, x + (boxWidth - boxTextWidth) / 2, currentY + 8);
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
        width: Math.max(2, Math.floor(width / 50)),
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
   * Draw audit trail
   */
  static drawAuditTrail(pdf, currentUser, x, y) {
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
    pdf.setFontSize(6);
    pdf.setTextColor(102, 102, 102);
    pdf.text(auditString, x, y);
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
   * Generate test PDF for S-5492 rotated verification
   * @returns {Promise<Blob>} - Test PDF blob
   */
  static async generateTestPDF() {
    const testData = [{
      sku: 'TEST-S5492-ROT',
      barcode: 'TEST123456',
      productName: 'Curaleaf Pink Champagne Premium Cannabis Capsules [10mg THC] 30-Count Test',
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
   * Generate alignment test PDF showing rotated positioning
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
    pdf.text('S-5492 ROTATED Test - Rotate Paper 90° to Read Labels', 50, 30);

    // Draw all 4 label positions
    for (let i = 0; i < 4; i++) {
      const pos = this.calculateUlineS5492PositionRotated(i);
      
      // Label outline
      pdf.setDrawColor(255, 0, 0);
      pdf.setLineWidth(2);
      pdf.rect(pos.x, pos.y, pos.width, pos.height);
      
      // Rotation indicator
      pdf.setFontSize(10);
      pdf.setTextColor(255, 0, 0);
      pdf.text(`Label ${i + 1}`, pos.x + 5, pos.y + 15);
      pdf.text(`ROTATE 90°`, pos.x + 5, pos.y + 28);
    }

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
      labelFormat: 'S-5492 (ROTATED)',
      pageSize: 'Legal (8.5" × 14")',
      labelsPerPage: 4,
      rotationNote: 'Labels positioned sideways - rotate paper 90° for reading/peeling'
    };
  }

  /**
   * Get debug information
   */
  static getDebugInfo() {
    const positions = [];
    for (let i = 0; i < 4; i++) {
      positions.push(this.calculateUlineS5492PositionRotated(i));
    }

    return {
      migration: 'S-21846 → S-5492 (ROTATED)',
      labelSpecs: {
        dimensions: '4" × 6" (positioned sideways)',
        orientation: 'ROTATED 90°',
        labelsPerSheet: 4,
        layout: '2×2 grid (when rotated)',
        workflow: 'Print → Rotate paper 90° → Peel labels'
      },
      pageSize: {
        format: 'Legal',
        dimensions: '8.5" × 14"',
        printableArea: '588 × 984 points (HP E877 margins)'
      },
      positions: positions,
      instructions: [
        'Print PDF on legal size paper',
        'Rotate paper 90 degrees clockwise',
        'Labels are now readable and peelable',
        'Each label: 6" wide × 4" tall (in rotated view)'
      ]
    };
  }

  // Legacy compatibility
  static calculateUlineLabelPosition(labelIndex) {
    return this.calculateUlineS5492PositionRotated(labelIndex % 4);
  }
}