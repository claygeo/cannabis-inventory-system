import jsPDF from 'jspdf';
import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generation utilities for Uline S-5492 label sheets
 * FINAL LAYOUT: Enhanced with larger elements and optimal positioning
 * Content positioned for perfect rotated view with enlarged components
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

          // Draw the sideways label with FINAL ENHANCED LAYOUT
          await this.drawSidewaysLabelFinalLayout(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
      }

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-5492 Format Labels (FINAL ENHANCED LAYOUT)',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v6.4.0',
        keywords: 'cannabis, inventory, labels, uline, s-5492, final, enhanced, larger'
      });

      // Log generation event
      storage.addSessionEvent(
        EVENT_TYPES.LABEL_GENERATED,
        `Generated ${currentLabelIndex} S-5492 labels with final enhanced layout across ${currentPage} pages`,
        `Items: ${labelDataArray.length}, Format: Uline S-5492 (Final Enhanced Layout)`
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
   * Container positioning remains unchanged - only content layout is enhanced
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
   * FINAL ENHANCED LAYOUT: Draw sideways label with enlarged elements
   * Content positioned for optimal rotated view with larger components
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Formatted label data
   * @param {Object} position - Label position and dimensions
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total number of boxes
   * @param {boolean} debug - Show debug borders
   * @param {string} currentUser - Current user
   */
  static async drawSidewaysLabelFinalLayout(pdf, labelData, position, boxNumber = 1, totalBoxes = 1, debug = false, currentUser = 'Unknown') {
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
        pdf.text(`L${position.labelIndex + 1} FINAL`, x + 5, y + 15);
        pdf.text(`PDF: ${width}×${height}pt`, x + 5, y + 25);
        pdf.text('Enhanced Layout', x + 5, y + 35);
      }

      const padding = 8;
      const contentX = x + padding;
      const contentY = y + padding;
      const contentWidth = width - (padding * 2);    // 272pt
      const contentHeight = height - (padding * 2);  // 416pt

      const brandInfo = this.extractBrandFromProductName(labelData.productName);

      // 1. AUDIT TRAIL: All the way to bottom-left (top-left when rotated)
      await this.drawAuditTrailBottomLeft(pdf, currentUser, contentX, contentY + contentHeight - 8);

      // 2. ENLARGED PRODUCT NAME SECTION: Larger area, bigger fonts (top when rotated)
      const productNameHeight = 160; // Increased from 120
      await this.drawEnlargedProductNameSection(pdf, brandInfo, contentX + 15, contentY + contentHeight - productNameHeight - 10, contentWidth - 15, productNameHeight);

      // 3. ENLARGED BARCODE: Bottom-left when rotated (top-left in PDF)
      await this.drawEnlargedBarcodeSection(pdf, labelData, contentX + 5, contentY + 5, 75, 100); // Increased size

      // 4. CENTERED STORE BOX: More centered position (bottom-center-left when rotated)
      this.drawCenteredStoreBox(pdf, contentX + 85, contentY + 5, 70, 100); // More centered, larger

      // 5. ENLARGED DATES: Bigger fonts (bottom-center-right when rotated)
      this.drawEnlargedDatesSection(pdf, labelData, contentX + 160, contentY + 5, 75, 100); // Increased size and fonts

      // 6. ENLARGED CASE/BOX: Bigger fonts and boxes (bottom-right when rotated)
      this.drawEnlargedCaseBoxSection(pdf, labelData, contentX + 240, contentY + 5, 65, 100, boxNumber, totalBoxes); // Increased size

    } catch (error) {
      console.error('Error drawing final enhanced layout label:', error);
      pdf.setFontSize(10);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Error', x + 5, y + 20);
    }
  }

  /**
   * Draw audit trail all the way to bottom-left corner (top-left when rotated)
   * @param {jsPDF} pdf - PDF document  
   * @param {string} currentUser - Current user
   * @param {number} x - X position in PDF coordinates
   * @param {number} y - Y position in PDF coordinates  
   */
  static async drawAuditTrailBottomLeft(pdf, currentUser, x, y) {
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
    
    // Very compact audit info in the corner
    const auditLine = `${month}/${day}/${year} ${hoursStr}:${minutes}${ampm} (${(currentUser || 'Unknown').substring(0, 5)})`;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5); // Very small to fit in corner
    pdf.setTextColor(102, 102, 102);
    pdf.text(auditLine, x, y);
  }

  /**
   * Draw enlarged product name section (top when rotated, bottom in PDF)
   * @param {jsPDF} pdf - PDF document
   * @param {Object} brandInfo - Brand information  
   * @param {number} x - X position in PDF coordinates
   * @param {number} y - Y position in PDF coordinates
   * @param {number} width - Available width
   * @param {number} height - Available height (enlarged)
   */
  static async drawEnlargedProductNameSection(pdf, brandInfo, x, y, width, height) {
    let currentY = y + height - 15; // Start from bottom and work up
    const lineSpacing = 1.3;

    // Draw brand name if present (ENLARGED FONTS)
    if (brandInfo.brand) {
      const brandFontSize = Math.min(26, LabelFormatter.autoFitFontSize(brandInfo.brand, width, 35, 26)); // Increased from 20
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(brandFontSize);
      pdf.setTextColor(0, 0, 0);
      
      // Center the brand text
      const brandWidth = pdf.getTextWidth(brandInfo.brand);
      const brandX = x + (width - brandWidth) / 2;
      pdf.text(brandInfo.brand, brandX, currentY);
      currentY -= brandFontSize * lineSpacing + 12; // More spacing
    }

    // Draw product name (ENLARGED FONTS)
    const remainingHeight = Math.max(30, currentY - y);
    const maxProductFontSize = brandInfo.brand ? 36 : 42; // Increased significantly
    
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
   * Draw enlarged barcode section (bottom-left when rotated, top-left in PDF)
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position in PDF coordinates
   * @param {number} y - Y position in PDF coordinates
   * @param {number} width - Available width (enlarged) 
   * @param {number} height - Available height (enlarged)
   */
  static async drawEnlargedBarcodeSection(pdf, labelData, x, y, width, height) {
    // ENLARGED barcode numeric display
    const spacedBarcodeDisplay = this.formatBarcodeWithSpaces(labelData.barcodeDisplay);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9); // Increased from 7
    pdf.setTextColor(102, 102, 102);
    const displayWidth = pdf.getTextWidth(spacedBarcodeDisplay);
    const displayX = x + Math.max(0, (width - displayWidth) / 2);
    pdf.text(spacedBarcodeDisplay, displayX, y + 15);
    
    // ENLARGED barcode image
    const barcodeHeight = Math.min(height - 25, 70); // Increased significantly
    await this.drawEnhancedBarcode(
      pdf, 
      labelData.barcode, 
      x, 
      y + 20, 
      width, 
      barcodeHeight
    );
  }

  /**
   * Draw centered store box (bottom-center-left when rotated, top-center-left in PDF)
   * @param {jsPDF} pdf - PDF document
   * @param {number} x - X position in PDF coordinates (more centered)
   * @param {number} y - Y position in PDF coordinates  
   * @param {number} width - Available width
   * @param {number} height - Available height
   */
  static drawCenteredStoreBox(pdf, x, y, width, height) {
    // "Store:" label with larger font
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11); // Increased from 9
    pdf.setTextColor(0, 0, 0);
    pdf.text('Store:', x, y + 15);
    
    // Larger text box with lines
    const boxHeight = Math.min(height - 25, 70); // Larger box
    const boxY = y + 20;
    
    // Main box
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, boxY, width, boxHeight);

    // Writing lines
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.5);
    
    const numLines = 5; // More lines
    for (let i = 1; i < numLines; i++) {
      const lineY = boxY + (i * (boxHeight / numLines));
      pdf.line(x + 2, lineY, x + width - 2, lineY);
    }
  }

  /**
   * Draw enlarged dates section (bottom-center-right when rotated, top-center-right in PDF)
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position in PDF coordinates
   * @param {number} y - Y position in PDF coordinates
   * @param {number} width - Available width
   * @param {number} height - Available height
   */
  static drawEnlargedDatesSection(pdf, labelData, x, y, width, height) {
    let currentY = y + 15;
    
    // ENLARGED Harvest Date
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11); // Increased from 9
    pdf.setTextColor(0, 0, 0);
    pdf.text('Harvest:', x, currentY);
    currentY += 15; // More spacing
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11); // Increased from 9
    const harvestDate = labelData.harvestDate || 'MM/DD/YY';
    pdf.text(harvestDate, x, currentY);
    currentY += 22; // More spacing
    
    // ENLARGED Package Date
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11); // Increased from 9
    pdf.text('Package:', x, currentY);
    currentY += 15; // More spacing
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11); // Increased from 9
    const packageDate = labelData.packagedDate || 'MM/DD/YY';
    pdf.text(packageDate, x, currentY);
  }

  /**
   * Draw enlarged case/box section (bottom-right when rotated, top-right in PDF)
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position in PDF coordinates
   * @param {number} y - Y position in PDF coordinates
   * @param {number} width - Available width
   * @param {number} height - Available height
   * @param {number} boxNumber - Box number
   * @param {number} totalBoxes - Total boxes
   */
  static drawEnlargedCaseBoxSection(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    let currentY = y + 15;
    const boxHeight = 18; // Increased from 14
    
    // ENLARGED Case Qty Box
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, currentY, width, boxHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10); // Increased from 8
    pdf.setTextColor(0, 0, 0);
    const caseQtyValue = labelData.caseQuantity || '___';
    const caseQtyText = `Case: ${caseQtyValue}`;
    const caseQtyWidth = pdf.getTextWidth(caseQtyText);
    pdf.text(caseQtyText, x + (width - caseQtyWidth) / 2, currentY + 12);
    
    currentY += boxHeight + 12; // More spacing
    
    // ENLARGED Box Number Box
    pdf.rect(x, currentY, width, boxHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10); // Increased from 8
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    const boxTextWidth = pdf.getTextWidth(boxText);
    pdf.text(boxText, x + (width - boxTextWidth) / 2, currentY + 12);
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
        width: Math.max(2, Math.floor(width / 35)), // Slightly wider bars
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
   * Generate test PDF for S-5492 final enhanced layout verification
   * @returns {Promise<Blob>} - Test PDF blob
   */
  static async generateTestPDF() {
    const testData = [{
      sku: 'TEST-S5492-FINAL',
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
   * Generate alignment test PDF showing final enhanced layout
   * @returns {Promise<Blob>} - Test PDF with final layout
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
    pdf.text('S-5492 FINAL ENHANCED LAYOUT Test', 50, 30);

    // Draw all 4 label positions with enhanced layout indicators
    for (let i = 0; i < 4; i++) {
      const pos = this.calculateUlineS5492PositionSideways(i);
      
      // Label outline
      pdf.setDrawColor(255, 0, 0);
      pdf.setLineWidth(2);
      pdf.rect(pos.x, pos.y, pos.width, pos.height);
      
      // Position info
      pdf.setFontSize(10);
      pdf.setTextColor(255, 0, 0);
      pdf.text(`Label ${i + 1} - FINAL ENHANCED`, pos.x + 5, pos.y + 15);
      pdf.text(`PDF: ${pos.width}×${pos.height}pt`, pos.x + 5, pos.y + 28);
      pdf.text('All elements enlarged', pos.x + 5, pos.y + 41);
      
      // Show enhanced content zones
      pdf.setDrawColor(0, 128, 255);
      pdf.setLineWidth(1);
      
      // Enhanced Product Name area (enlarged)
      pdf.rect(pos.x + 15, pos.y + pos.height - 170, pos.width - 20, 160);
      pdf.setFontSize(8);
      pdf.text('ENLARGED Product Name', pos.x + 25, pos.y + pos.height - 100);
      
      // Enhanced Controls area (enlarged)
      pdf.rect(pos.x + 5, pos.y + 5, pos.width - 10, 105);
      pdf.text('ENLARGED Controls', pos.x + 15, pos.y + 60);
      
      // Audit corner
      pdf.rect(pos.x + 5, pos.y + pos.height - 15, 80, 10);
      pdf.text('Audit Corner', pos.x + 10, pos.y + pos.height - 8);
    }

    // Final enhanced layout instructions
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('FINAL ENHANCED LAYOUT FEATURES:', 50, 80);
    pdf.setFontSize(10);
    pdf.text('1. Audit Trail: Bottom-left corner (very small, out of the way)', 50, 95);
    pdf.text('2. Product Name: ENLARGED section with fonts up to 42pt', 50, 110);
    pdf.text('3. Barcode: ENLARGED with bigger numeric display (9pt)', 50, 125);
    pdf.text('4. Store Box: CENTERED with larger box and 11pt fonts', 50, 140);
    pdf.text('5. Dates: ENLARGED fonts (11pt) with more spacing', 50, 155);
    pdf.text('6. Case/Box: ENLARGED boxes and 10pt fonts', 50, 170);

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
      labelFormat: 'S-5492 (FINAL ENHANCED LAYOUT)',
      pageSize: 'Legal (8.5" × 14")',
      labelsPerPage: 4,
      contentLayout: 'All elements enlarged with optimal positioning',
      rotationNote: 'Labels positioned sideways - rotate paper 90° clockwise for enhanced layout'
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
      migration: 'S-5492 FINAL ENHANCED LAYOUT',
      version: '6.4.0',
      enhancedFeatures: {
        auditTrail: 'Bottom-left corner, very small (5pt), out of the way',
        productName: 'ENLARGED section (160pt height), fonts up to 42pt',
        barcode: 'ENLARGED (75×100pt), numeric display 9pt',
        storeBox: 'CENTERED position (85pt from left), 11pt fonts, larger box',
        dates: 'ENLARGED fonts (11pt), more spacing between elements',
        caseBox: 'ENLARGED boxes (18pt height), 10pt fonts'
      },
      sizingComparisons: {
        productNameSection: 'Increased from 120pt to 160pt height',
        barcodeSection: 'Increased from 65×80pt to 75×100pt',
        storeBox: 'Increased from 60×80pt to 70×100pt, more centered',
        productNameFont: 'Increased from 32pt to 42pt maximum',
        barcodeNumeric: 'Increased from 7pt to 9pt',
        datesFont: 'Increased from 9pt to 11pt',
        caseBoxFont: 'Increased from 8pt to 10pt'
      },
      coordinateMapping: {
        concept: 'Content positioned in PDF to appear correctly when paper rotated 90° clockwise',
        auditTrail: 'PDF bottom-left corner → Rotated top-left corner',
        productName: 'PDF bottom-center/right → Rotated top-center/right',
        barcode: 'PDF top-left → Rotated bottom-left',
        storeBox: 'PDF top-center-left → Rotated bottom-center-left',
        dates: 'PDF top-center-right → Rotated bottom-center-right',
        caseBox: 'PDF top-right → Rotated bottom-right'
      },
      layoutSpecs: {
        dimensions: '4" × 6" (positioned sideways)',
        orientation: 'SIDEWAYS containers with enhanced content',
        labelsPerSheet: 4,
        layout: '2×2 grid of sideways labels',
        workflow: 'Print → Rotate paper 90° clockwise → Perfect enhanced layout'
      },
      positions: positions
    };
  }

  // Legacy compatibility
  static calculateUlineLabelPosition(labelIndex) {
    return this.calculateUlineS5492PositionSideways(labelIndex % 4);
  }

  // Backwards compatibility - redirect to final method
  static async drawSidewaysLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawSidewaysLabelFinalLayout(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }
}