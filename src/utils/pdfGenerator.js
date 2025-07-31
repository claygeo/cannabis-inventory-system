import jsPDF from 'jspdf';
import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generation utilities for Uline S-5492 label sheets
 * CORRECTED: 4" × 6" = 6" WIDE × 4" TALL HORIZONTAL labels on legal paper
 */
export class PDFGenerator {
  /**
   * Generate PDF with labels positioned for Uline S-5492 sheets
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

    // Legal size sheets for S-5492 (8.5" × 14")
    const pdf = new jsPDF({
      orientation,
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

          // Calculate position for this label
          const position = this.calculateUlineS5492Position(currentLabelIndex % specs.LABELS_PER_SHEET);

          // Calculate which box number this label represents
          const boxNumber = Math.floor(labelCopy / Math.max(1, Math.floor(formattedData.labelQuantity / formattedData.boxCount))) + 1;

          // Draw the horizontal label
          await this.drawHorizontalLabel(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
      }

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-5492 Format Labels (6" WIDE × 4" TALL Horizontal)',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v6.0.0',
        keywords: 'cannabis, inventory, labels, uline, s-5492, horizontal, 6x4, legal'
      });

      // Log generation event
      storage.addSessionEvent(
        EVENT_TYPES.LABEL_GENERATED,
        `Generated ${currentLabelIndex} S-5492 labels across ${currentPage} pages`,
        `Items: ${labelDataArray.length}, Format: Uline S-5492 (6" WIDE × 4" TALL Horizontal)`
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
   * Calculate EXACT label position for Uline S-5492 HORIZONTAL labels
   * CRITICAL: Uline 4" × 6" = 6" WIDE × 4" TALL (432pt WIDE × 288pt TALL)
   * @param {number} labelIndex - Index of label (0-3 for 4 labels per sheet)
   * @returns {Object} - Position coordinates in points
   */
  static calculateUlineS5492Position(labelIndex) {
    // Legal size sheet dimensions
    const pageWidth = 612;   // 8.5" in points  
    const pageHeight = 1008; // 14" in points
    
    // ULINE S-5492 TRUE DIMENSIONS: 6" WIDE × 4" TALL (HORIZONTAL orientation)
    const labelWidth = 432;  // 6" WIDE in points
    const labelHeight = 288; // 4" TALL in points
    
    // Grid layout: 2 columns × 2 rows on legal size
    const cols = 2;
    const rows = 2;
    const row = Math.floor(labelIndex / cols);
    const col = labelIndex % cols;
    
    // PROBLEM: 2 × 432pt = 864pt > 612pt page width
    // SOLUTION: Scale proportionally to fit on legal paper
    
    // Calculate maximum space available (with margins)
    const margins = 18; // 0.25" margins on each side
    const availableWidth = pageWidth - (margins * 2);   // 576pt
    const availableHeight = pageHeight - (margins * 2); // 972pt
    
    // Calculate required space for 2×2 grid
    const requiredWidth = cols * labelWidth;   // 864pt
    const requiredHeight = rows * labelHeight; // 576pt
    
    // Calculate scale factors
    const scaleX = availableWidth / requiredWidth;   // 576/864 = 0.667
    const scaleY = availableHeight / requiredHeight; // 972/576 = 1.69
    const scaleFactor = Math.min(scaleX, scaleY);    // Use smaller scale = 0.667
    
    // Apply scaling
    const actualLabelWidth = Math.floor(labelWidth * scaleFactor);   // 288pt
    const actualLabelHeight = Math.floor(labelHeight * scaleFactor); // 192pt
    
    // Calculate grid positioning (centered on page)
    const totalGridWidth = cols * actualLabelWidth;   // 576pt
    const totalGridHeight = rows * actualLabelHeight; // 384pt
    
    const startX = (pageWidth - totalGridWidth) / 2;   // Center horizontally
    const startY = (pageHeight - totalGridHeight) / 2; // Center vertically
    
    // Calculate individual label position (no gaps - labels are adjacent)
    const xPos = startX + (col * actualLabelWidth);
    const yPos = startY + (row * actualLabelHeight);
    
    return {
      x: Math.floor(xPos),
      y: Math.floor(yPos),
      width: actualLabelWidth,
      height: actualLabelHeight,
      
      // Scaling information
      scaleFactor: scaleFactor,
      isScaled: scaleFactor < 1.0,
      originalWidth: labelWidth,
      originalHeight: labelHeight,
      
      // Orientation confirmation
      orientation: 'horizontal',
      isHorizontal: actualLabelWidth > actualLabelHeight,
      
      // Grid information
      row: row,
      col: col,
      labelIndex: labelIndex
    };
  }

  /**
   * Alternative method: No scaling - let labels extend or use spacing
   * @param {number} labelIndex - Index of label (0-3)
   * @returns {Object} - Position coordinates without scaling
   */
  static calculateUlineS5492PositionNoScale(labelIndex) {
    // Legal size sheet dimensions
    const pageWidth = 612;   // 8.5"
    const pageHeight = 1008; // 14"
    
    // ULINE S-5492 TRUE DIMENSIONS: 6" WIDE × 4" TALL
    const labelWidth = 432;  // 6" WIDE
    const labelHeight = 288; // 4" TALL
    
    // Grid layout
    const cols = 2;
    const rows = 2; 
    const row = Math.floor(labelIndex / cols);
    const col = labelIndex % cols;
    
    // Physical spacing approach - smaller margins to fit
    const topMargin = 72;    // 1" from top
    const leftMargin = 0;    // No left margin (will extend beyond)
    const columnGap = 0;     // No gap between columns
    const rowGap = 36;       // 0.5" between rows
    
    // Calculate positions
    const xPos = leftMargin + (col * labelWidth);
    const yPos = topMargin + (row * (labelHeight + rowGap));
    
    // Check boundaries
    const rightEdge = xPos + labelWidth;
    const bottomEdge = yPos + labelHeight;
    const extendsRight = rightEdge > pageWidth;
    const extendsBottom = bottomEdge > pageHeight;
    
    return {
      x: Math.floor(xPos),
      y: Math.floor(yPos),
      width: labelWidth,
      height: labelHeight,
      
      // No scaling
      scaleFactor: 1.0,
      isScaled: false,
      originalWidth: labelWidth,
      originalHeight: labelHeight,
      
      // Orientation
      orientation: 'horizontal',
      isHorizontal: labelWidth > labelHeight,
      
      // Grid information
      row: row,
      col: col,
      labelIndex: labelIndex,
      
      // Boundary warnings
      extendsRight: extendsRight,
      extendsBottom: extendsBottom,
      warnings: [
        ...(extendsRight ? ['Label extends beyond right page boundary'] : []),
        ...(extendsBottom ? ['Label extends beyond bottom page boundary'] : [])
      ]
    };
  }

  /**
   * Draw HORIZONTAL 6"×4" label with proper horizontal content layout
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Formatted label data
   * @param {Object} position - Label position and dimensions
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total number of boxes
   * @param {boolean} debug - Show debug borders
   * @param {string} currentUser - Current user
   */
  static async drawHorizontalLabel(pdf, labelData, position, boxNumber = 1, totalBoxes = 1, debug = false, currentUser = 'Unknown') {
    const { x, y, width, height } = position;

    // Draw label border
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, y, width, height);

    // Debug info
    if (debug) {
      pdf.setDrawColor(255, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.rect(x + 2, y + 2, width - 4, height - 4);
      
      // Debug measurements
      pdf.setFontSize(8);
      pdf.setTextColor(255, 0, 0);
      pdf.text(`${(width/72).toFixed(2)}" WIDE × ${(height/72).toFixed(2)}" TALL`, x + 5, y + 12);
      pdf.text(`${width}×${height}pt (HORIZONTAL)`, x + 5, y + 22);
      pdf.text(`Label ${position.labelIndex + 1}`, x + 5, y + 32);
      
      if (position.isScaled) {
        pdf.text(`Scaled: ${(position.scaleFactor * 100).toFixed(1)}%`, x + 5, y + 42);
      }
    }

    const padding = 6;
    const contentX = x + padding;
    const contentY = y + padding;
    const contentWidth = width - (padding * 2);
    const contentHeight = height - (padding * 2);

    try {
      // HORIZONTAL LAYOUT (bottom to top as requested):
      
      // 1. Audit trail (absolute bottom)
      const auditY = y + height - 6;
      this.drawAuditTrail(pdf, currentUser, contentX, auditY);
      
      // 2. Bottom section: Barcode, text box, dates, case info
      const bottomSectionHeight = Math.min(60, contentHeight * 0.4);
      const bottomSectionY = y + height - bottomSectionHeight - 12;
      await this.drawBottomHorizontalSection(pdf, labelData, contentX, bottomSectionY, contentWidth, bottomSectionHeight, boxNumber, totalBoxes);
      
      // 3. Top section: MASSIVE Product Name with Brand
      const productNameHeight = contentHeight - bottomSectionHeight - 18;
      const brandInfo = this.extractBrandFromProductName(labelData.productName);
      await this.drawMassiveProductNameHorizontal(pdf, brandInfo, contentX, contentY, contentWidth, productNameHeight);

    } catch (error) {
      console.error('Error drawing horizontal label:', error);
      pdf.setFontSize(8);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Error', contentX + 5, contentY + 15);
    }
  }

  /**
   * Draw bottom horizontal section with all info laid out horizontally
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Available width
   * @param {number} height - Available height
   * @param {number} boxNumber - Box number
   * @param {number} totalBoxes - Total boxes
   */
  static async drawBottomHorizontalSection(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    // Divide horizontal space into 4 sections
    const sectionWidth = width / 4;
    let currentX = x;
    
    // Section 1: Barcode (far left)
    await this.drawBarcodeSection(pdf, labelData, currentX, y, sectionWidth, height);
    currentX += sectionWidth;
    
    // Section 2: Text box for manual writing
    this.drawManualWritingBox(pdf, currentX, y + height - 35, sectionWidth - 5, 30);
    currentX += sectionWidth;
    
    // Section 3: Dates
    this.drawDatesSection(pdf, labelData, currentX, y, sectionWidth, height);
    currentX += sectionWidth;
    
    // Section 4: Case/Box info (far right)
    this.drawCaseBoxSection(pdf, labelData, currentX, y, sectionWidth, height, boxNumber, totalBoxes);
  }

  /**
   * Draw massive product name optimized for horizontal 6×4 labels
   * @param {jsPDF} pdf - PDF document
   * @param {Object} brandInfo - Brand and product info
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Available width
   * @param {number} height - Available height
   */
  static async drawMassiveProductNameHorizontal(pdf, brandInfo, x, y, width, height) {
    let currentY = y;
    const lineSpacing = 1.1;

    // Draw brand name if present (top line)
    if (brandInfo.brand) {
      const brandFontSize = Math.min(24, LabelFormatter.autoFitFontSize(brandInfo.brand, width, 30, 24));
      
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
      
      currentY += 6; // Gap between brand and product
    }

    // Draw product name (MASSIVE - use remaining space)
    const remainingHeight = Math.max(15, height - (currentY - y));
    const maxProductFontSize = brandInfo.brand ? 28 : 36; // Larger if no brand
    
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
   * Draw barcode section
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Section width
   * @param {number} height - Section height
   */
  static async drawBarcodeSection(pdf, labelData, x, y, width, height) {
    const barcodeHeight = Math.min(35, height * 0.7);
    
    // Barcode display text
    const spacedBarcodeDisplay = this.formatBarcodeWithSpaces(labelData.barcodeDisplay);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(102, 102, 102);
    const displayWidth = pdf.getTextWidth(spacedBarcodeDisplay);
    const displayCenterX = x + Math.max(0, (width - displayWidth) / 2);
    pdf.text(spacedBarcodeDisplay, displayCenterX, y + 10);
    
    // Draw barcode
    await this.drawEnhancedBarcode(
      pdf, 
      labelData.barcode, 
      x, 
      y + 14, 
      width - 2, 
      barcodeHeight
    );
  }

  /**
   * Draw dates section
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Section width
   * @param {number} height - Section height
   */
  static drawDatesSection(pdf, labelData, x, y, width, height) {
    let currentY = y + 12;
    
    // Harvest Date (LARGER as requested)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    const harvestText = `Harvest: ${labelData.harvestDate || 'MM/DD/YY'}`;
    pdf.text(harvestText, x, currentY);
    currentY += 14;
    
    // Packaged Date (LARGER as requested)
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const packagedText = `Packaged: ${labelData.packagedDate || 'MM/DD/YY'}`;
    pdf.text(packagedText, x, currentY);
  }

  /**
   * Draw case/box section
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
    const boxWidth = Math.min(width - 5, 70);
    const boxHeight = 14;
    let currentY = y + 8;
    
    // Case Qty Box (LARGER as requested)
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, currentY, boxWidth, boxHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    const caseQtyValue = labelData.caseQuantity || '___';
    const caseQtyText = `Case: ${caseQtyValue}`;
    const caseQtyWidth = pdf.getTextWidth(caseQtyText);
    pdf.text(caseQtyText, x + (boxWidth - caseQtyWidth) / 2, currentY + 10);
    
    currentY += boxHeight + 4;
    
    // Box Number Box (LARGER as requested)
    pdf.rect(x, currentY, boxWidth, boxHeight);
    
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    const boxTextWidth = pdf.getTextWidth(boxText);
    pdf.text(boxText, x + (boxWidth - boxTextWidth) / 2, currentY + 10);
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
    
    // Check if product name starts with any known brand
    for (const brand of brands) {
      const regex = new RegExp(`^${brand}\\s+`, 'i');
      if (regex.test(trimmed)) {
        const remaining = trimmed.replace(regex, '').trim();
        return {
          brand: brand,
          productName: remaining || trimmed
        };
      }
    }

    // Check for common patterns
    const dashMatch = trimmed.match(/^([A-Za-z\s&'-]+?)\s*[-–:]\s*(.+)$/);
    if (dashMatch && dashMatch[1].length <= 25) {
      return {
        brand: dashMatch[1].trim(),
        productName: dashMatch[2].trim()
      };
    }

    return { brand: '', productName: trimmed };
  }

  /**
   * Format barcode display with spaces
   * @param {string} barcodeDisplay - Barcode display
   * @returns {string} - Spaced barcode display
   */
  static formatBarcodeWithSpaces(barcodeDisplay) {
    if (!barcodeDisplay) return '';
    return barcodeDisplay.replace(/-/g, ' ');
  }

  /**
   * Draw enhanced scannable barcode
   * @param {jsPDF} pdf - PDF document
   * @param {string} barcodeValue - Barcode value
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Barcode width
   * @param {number} height - Barcode height
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
        width: Math.max(2, Math.floor(width / 60)),
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
   * @param {jsPDF} pdf - PDF document
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Box width
   * @param {number} height - Box height
   */
  static drawManualWritingBox(pdf, x, y, width, height) {
    // Draw box border
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, y, width, height);

    // Add light grid lines
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.5);
    
    const lineSpacing = height / 3;
    for (let i = 1; i < 3; i++) {
      const lineY = y + (i * lineSpacing);
      pdf.line(x, lineY, x + width, lineY);
    }
  }

  /**
   * Draw audit trail at bottom
   * @param {jsPDF} pdf - PDF document
   * @param {string} currentUser - Current user
   * @param {number} x - X position
   * @param {number} y - Y position
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
   * Generate test PDF for S-5492 verification
   * @returns {Promise<Blob>} - Test PDF blob
   */
  static async generateTestPDF() {
    const testData = [{
      sku: 'TEST-S5492-001',
      barcode: 'TEST123456',
      productName: 'Curaleaf Pink Champagne Premium Cannabis Capsules [10mg THC] 30-Count Bottle Test Product',
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
   * Generate measurement test PDF showing exact dimensions
   * @returns {Promise<Blob>} - Test PDF with measurements
   */
  static async generateMeasurementTestPDF() {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [612, 1008] // Legal size
    });

    // Draw page outline
    pdf.setDrawColor(0, 0, 255);
    pdf.setLineWidth(1);
    pdf.rect(0, 0, 612, 1008);

    // Title
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Uline S-5492 Test - HORIZONTAL Labels (6" WIDE × 4" TALL)', 50, 30);

    // Draw all 4 label positions with measurements
    for (let i = 0; i < 4; i++) {
      const pos = this.calculateUlineS5492Position(i);
      
      // Label outline in red
      pdf.setDrawColor(255, 0, 0);
      pdf.setLineWidth(2);
      pdf.rect(pos.x, pos.y, pos.width, pos.height);
      
      // Measurements
      pdf.setFontSize(10);
      pdf.setTextColor(255, 0, 0);
      pdf.text(`Label ${i + 1} (HORIZONTAL)`, pos.x + 5, pos.y + 15);
      pdf.text(`${(pos.width/72).toFixed(2)}" WIDE × ${(pos.height/72).toFixed(2)}" TALL`, pos.x + 5, pos.y + 28);
      pdf.text(`${pos.width} × ${pos.height} points`, pos.x + 5, pos.y + 41);
      
      if (pos.isScaled) {
        pdf.text(`Scaled: ${(pos.scaleFactor * 100).toFixed(1)}%`, pos.x + 5, pos.y + 54);
      }
      
      // Center cross marks
      const centerX = pos.x + pos.width / 2;
      const centerY = pos.y + pos.height / 2;
      pdf.setDrawColor(0, 255, 0);
      pdf.line(centerX - 10, centerY, centerX + 10, centerY);
      pdf.line(centerX, centerY - 10, centerX, centerY + 10);
    }

    // Page info
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Legal Size: 8.5" × 14" (612 × 1008 pt)', 50, 50);
    pdf.text('Original Label Size: 6" WIDE × 4" TALL (432 × 288 pt)', 50, 65);

    return pdf.output('blob');
  }

  /**
   * Validation method
   * @param {Array} labelDataArray - Label data to validate
   * @returns {Object} - Validation result
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

    const specs = LabelFormatter.getLabelSpecs();

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalLabels,
      estimatedPages: Math.ceil(totalLabels / specs.LABELS_PER_SHEET),
      labelFormat: 'S-5492',
      pageSize: 'Legal (8.5" × 14")',
      labelsPerPage: specs.LABELS_PER_SHEET,
      labelDimensions: '6" WIDE × 4" TALL (HORIZONTAL)'
    };
  }

  /**
   * Get debug information
   * @returns {Object} - Debug information
   */
  static getDebugInfo() {
    const positions = [];
    for (let i = 0; i < 4; i++) {
      positions.push(this.calculateUlineS5492Position(i));
    }

    return {
      migration: 'Complete - S-21846 → S-5492',
      labelSpecs: {
        dimensions: '6" WIDE × 4" TALL',
        dimensionsPoints: '432pt WIDE × 288pt TALL',
        orientation: 'HORIZONTAL',
        labelsPerSheet: 4,
        layout: '2×2 grid'
      },
      pageSize: {
        format: 'Legal',
        dimensions: '8.5" × 14"',
        dimensionsPoints: '612pt × 1008pt'
      },
      positions: positions,
      features: [
        'HORIZONTAL 6" WIDE × 4" TALL labels',
        'Proportional scaling to fit legal paper',
        'Bottom-focused content layout',
        'Massive product names',
        'Brand detection and separation'
      ]
    };
  }

  // Legacy compatibility methods
  static calculateUlineLabelPosition(labelIndex) {
    return this.calculateUlineS5492Position(labelIndex % 4);
  }
}