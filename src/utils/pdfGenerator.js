import jsPDF from 'jspdf';
import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generation utilities for Uline S-5492 label sheets
 * NEW LAYOUT: Content repositioned for optimal layout when paper is rotated 90°
 * NO PDF TRANSFORMATIONS - Simple positioning only
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

          // Draw the sideways label with NEW CONTENT LAYOUT
          await this.drawSidewaysLabelNewLayout(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
      }

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-5492 Format Labels (NEW CONTENT LAYOUT - No PDF Transformations)',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v6.3.1',
        keywords: 'cannabis, inventory, labels, uline, s-5492, new, layout, simple, positioning'
      });

      // Log generation event
      storage.addSessionEvent(
        EVENT_TYPES.LABEL_GENERATED,
        `Generated ${currentLabelIndex} S-5492 labels with new content layout (no transformations) across ${currentPage} pages`,
        `Items: ${labelDataArray.length}, Format: Uline S-5492 (New Content Layout)`
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
   * Container positioning remains unchanged - only content layout is updated
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
   * NEW LAYOUT: Draw sideways label with repositioned content (NO PDF TRANSFORMATIONS)
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Formatted label data
   * @param {Object} position - Label position and dimensions
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total number of boxes
   * @param {boolean} debug - Show debug borders
   * @param {string} currentUser - Current user
   */
  static async drawSidewaysLabelNewLayout(pdf, labelData, position, boxNumber = 1, totalBoxes = 1, debug = false, currentUser = 'Unknown') {
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
        pdf.text(`L${position.labelIndex + 1} NEW`, x + 5, y + 15);
        pdf.text(`${width}×${height}pt`, x + 5, y + 25);
        pdf.text('NO TRANSFORMS', x + 5, y + 35);
      }

      const padding = 10;
      const contentX = x + padding;
      const contentY = y + padding;
      const contentWidth = width - (padding * 2);
      const contentHeight = height - (padding * 2);

      // NEW LAYOUT SECTIONS - Simple positioning only
      
      // 1. Top section: Audit Trail (top-left) + Product Name (center-top)
      const topSectionHeight = Math.floor(contentHeight * 0.35);
      await this.drawNewTopSection(pdf, labelData, currentUser, contentX, contentY, contentWidth, topSectionHeight);
      
      // 2. Middle section: Product name overflow area if needed
      const middleSectionY = contentY + topSectionHeight;
      const middleSectionHeight = Math.floor(contentHeight * 0.35);
      // Middle section is mostly reserved for long product names
      
      // 3. Bottom section: 4-column layout (Barcode | Store Box | Dates | Case/Box)
      const bottomSectionY = contentY + topSectionHeight + middleSectionHeight;
      const bottomSectionHeight = contentHeight - topSectionHeight - middleSectionHeight;
      await this.drawNewBottomSection(pdf, labelData, contentX, bottomSectionY, contentWidth, bottomSectionHeight, boxNumber, totalBoxes);

    } catch (error) {
      console.error('Error drawing new layout label:', error);
      pdf.setFontSize(10);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Error', x + 5, y + 20);
    }
  }

  /**
   * Draw new top section: Audit Trail (top-left) + Product Name (center-top) - NO TRANSFORMATIONS
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {string} currentUser - Current user
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Available width
   * @param {number} height - Available height
   */
  static async drawNewTopSection(pdf, labelData, currentUser, x, y, width, height) {
    // 1. Audit Trail - Top-left corner (simple positioning - NO rotation)
    await this.drawTopLeftAuditTrail(pdf, currentUser, x + 5, y + 12);
    
    // 2. Product Name - Center-top, largest possible font
    const brandInfo = this.extractBrandFromProductName(labelData.productName);
    const productNameStartX = x + (width * 0.15); // Leave space for audit trail
    const productNameWidth = width * 0.85;
    
    await this.drawCenterTopProductName(pdf, brandInfo, productNameStartX, y, productNameWidth, height);
  }

  /**
   * Draw audit trail in top-left corner (NO PDF TRANSFORMATIONS - simple text)
   * @param {jsPDF} pdf - PDF document
   * @param {string} currentUser - Current user
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  static async drawTopLeftAuditTrail(pdf, currentUser, x, y) {
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
    
    // Create compact audit string for top-left positioning
    const shortUser = (currentUser || 'Unknown').substring(0, 8);
    const auditString1 = `${month}/${day}/${year}`;
    const auditString2 = `${hoursStr}:${minutes}${ampm}`;
    const auditString3 = `(${shortUser})`;
    
    // NO PDF TRANSFORMATIONS - Simple vertical text stacking
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6); // Small font for compact display
    pdf.setTextColor(102, 102, 102);
    
    // Stack the audit info vertically in top-left
    pdf.text(auditString1, x, y);
    pdf.text(auditString2, x, y + 8);
    pdf.text(auditString3, x, y + 16);
  }

  /**
   * Draw center-top product name with large fonts
   * @param {jsPDF} pdf - PDF document
   * @param {Object} brandInfo - Brand information
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Available width
   * @param {number} height - Available height
   */
  static async drawCenterTopProductName(pdf, brandInfo, x, y, width, height) {
    let currentY = y + 15;
    const lineSpacing = 1.2;

    // Draw brand name if present (larger font)
    if (brandInfo.brand) {
      const brandFontSize = Math.min(22, LabelFormatter.autoFitFontSize(brandInfo.brand, width, 30, 22));
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(brandFontSize);
      pdf.setTextColor(0, 0, 0);
      
      // Center the brand text
      const brandWidth = pdf.getTextWidth(brandInfo.brand);
      const brandX = x + (width - brandWidth) / 2;
      pdf.text(brandInfo.brand, brandX, currentY);
      currentY += brandFontSize * lineSpacing + 8;
    }

    // Draw product name (larger font)
    const remainingHeight = Math.max(25, height - (currentY - y));
    const maxProductFontSize = brandInfo.brand ? 30 : 36; // Even larger fonts
    
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
      pdf.text(line, centerX, currentY);
      currentY += productFontSize * lineSpacing;
    });
  }

  /**
   * Draw new bottom section: 4-column layout - NO TRANSFORMATIONS
   * Column 1: Barcode + numeric display
   * Column 2: Store text box with "Store:" label
   * Column 3: Harvest & Package dates (larger fonts)
   * Column 4: Case Qty & Box X/X (larger fonts)
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Available width
   * @param {number} height - Available height
   * @param {number} boxNumber - Box number
   * @param {number} totalBoxes - Total boxes
   */
  static async drawNewBottomSection(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    const columnWidth = width / 4;
    let currentX = x;
    
    // Column 1: Barcode (left)
    await this.drawNewBarcodeColumn(pdf, labelData, currentX, y, columnWidth, height);
    currentX += columnWidth;
    
    // Column 2: Store text box (center-left)
    this.drawNewStoreColumn(pdf, currentX, y, columnWidth, height);
    currentX += columnWidth;
    
    // Column 3: Dates (center-right)
    this.drawNewDatesColumn(pdf, labelData, currentX, y, columnWidth, height);
    currentX += columnWidth;
    
    // Column 4: Case/Box info (right)
    this.drawNewCaseBoxColumn(pdf, labelData, currentX, y, columnWidth, height, boxNumber, totalBoxes);
  }

  /**
   * Draw barcode column with larger numeric display above
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Column width
   * @param {number} height - Column height
   */
  static async drawNewBarcodeColumn(pdf, labelData, x, y, width, height) {
    const padding = 2;
    const innerX = x + padding;
    const innerWidth = width - (padding * 2);
    
    // Barcode numeric display (larger font, positioned above barcode)
    const spacedBarcodeDisplay = this.formatBarcodeWithSpaces(labelData.barcodeDisplay);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8); // Increased from 6
    pdf.setTextColor(102, 102, 102);
    const displayWidth = pdf.getTextWidth(spacedBarcodeDisplay);
    const displayX = innerX + Math.max(0, (innerWidth - displayWidth) / 2);
    pdf.text(spacedBarcodeDisplay, displayX, y + 12);
    
    // Barcode (larger)
    const barcodeHeight = Math.min(height * 0.7, 45); // Increased height
    await this.drawEnhancedBarcode(
      pdf, 
      labelData.barcode, 
      innerX, 
      y + 18, 
      innerWidth, 
      barcodeHeight
    );
  }

  /**
   * Draw store text box with "Store:" label above
   * @param {jsPDF} pdf - PDF document
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Column width
   * @param {number} height - Column height
   */
  static drawNewStoreColumn(pdf, x, y, width, height) {
    const padding = 2;
    const innerX = x + padding;
    const innerWidth = width - (padding * 2);
    
    // "Store:" label (larger font)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9); // Increased font
    pdf.setTextColor(0, 0, 0);
    pdf.text('Store:', innerX, y + 12);
    
    // Text box (larger)
    const boxHeight = Math.min(height * 0.75, 50);
    const boxY = y + 16;
    this.drawEnhancedManualWritingBox(pdf, innerX, boxY, innerWidth, boxHeight);
  }

  /**
   * Draw dates column with larger fonts
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Column width
   * @param {number} height - Column height
   */
  static drawNewDatesColumn(pdf, labelData, x, y, width, height) {
    const padding = 2;
    const innerX = x + padding;
    let currentY = y + 12;
    
    // Harvest Date (larger font)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10); // Increased from 8
    pdf.setTextColor(0, 0, 0);
    pdf.text('Harvest:', innerX, currentY);
    currentY += 12;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const harvestDate = labelData.harvestDate || 'MM/DD/YY';
    pdf.text(harvestDate, innerX, currentY);
    currentY += 18;
    
    // Package Date (larger font)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Package:', innerX, currentY);
    currentY += 12;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const packageDate = labelData.packagedDate || 'MM/DD/YY';
    pdf.text(packageDate, innerX, currentY);
  }

  /**
   * Draw case/box column with larger fonts
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Column width
   * @param {number} height - Column height
   * @param {number} boxNumber - Box number
   * @param {number} totalBoxes - Total boxes
   */
  static drawNewCaseBoxColumn(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    const padding = 2;
    const innerX = x + padding;
    const innerWidth = width - (padding * 2);
    let currentY = y + 12;
    
    // Case Qty (larger box and font)
    const boxHeight = 16; // Increased from 10
    
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(innerX, currentY, innerWidth, boxHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9); // Increased from 7
    pdf.setTextColor(0, 0, 0);
    const caseQtyValue = labelData.caseQuantity || '___';
    const caseQtyText = `Case: ${caseQtyValue}`;
    const caseQtyWidth = pdf.getTextWidth(caseQtyText);
    pdf.text(caseQtyText, innerX + (innerWidth - caseQtyWidth) / 2, currentY + 11);
    
    currentY += boxHeight + 10;
    
    // Box Number (larger box and font)
    pdf.rect(innerX, currentY, innerWidth, boxHeight);
    
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    const boxTextWidth = pdf.getTextWidth(boxText);
    pdf.text(boxText, innerX + (innerWidth - boxTextWidth) / 2, currentY + 11);
  }

  /**
   * Draw enhanced manual writing text box with lines
   * @param {jsPDF} pdf - PDF document
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Box width
   * @param {number} height - Box height
   */
  static drawEnhancedManualWritingBox(pdf, x, y, width, height) {
    // Main box
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, y, width, height);

    // Writing lines (more spaced for larger box)
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.5);
    
    const numLines = Math.max(3, Math.floor(height / 10)); // More lines for larger box
    for (let i = 1; i < numLines; i++) {
      const lineY = y + (i * (height / numLines));
      pdf.line(x + 2, lineY, x + width - 2, lineY);
    }
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
   * Generate test PDF for S-5492 new layout verification
   * @returns {Promise<Blob>} - Test PDF blob
   */
  static async generateTestPDF() {
    const testData = [{
      sku: 'TEST-S5492-NEW',
      barcode: 'TEST123456',
      productName: 'Curaleaf Pink Champagne Premium Cannabis Capsules [10mg THC] 30-Count Test Product with New Layout',
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
   * Generate alignment test PDF showing new content layout
   * @returns {Promise<Blob>} - Test PDF with new layout measurements
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
    pdf.text('S-5492 NEW CONTENT LAYOUT Test - Rotate Paper 90° to Read Labels', 50, 30);

    // Draw all 4 label positions with new layout indicators
    for (let i = 0; i < 4; i++) {
      const pos = this.calculateUlineS5492PositionSideways(i);
      
      // Label outline
      pdf.setDrawColor(255, 0, 0);
      pdf.setLineWidth(2);
      pdf.rect(pos.x, pos.y, pos.width, pos.height);
      
      // Position info
      pdf.setFontSize(10);
      pdf.setTextColor(255, 0, 0);
      pdf.text(`Label ${i + 1} - NEW LAYOUT`, pos.x + 5, pos.y + 15);
      pdf.text(`${pos.width}×${pos.height}pt`, pos.x + 5, pos.y + 28);
      pdf.text('Simple positioning only', pos.x + 5, pos.y + 41);
      
      // Layout sections
      pdf.setDrawColor(0, 128, 255);
      pdf.setLineWidth(1);
      // Top section (35%)
      pdf.rect(pos.x + 5, pos.y + 5, pos.width - 10, Math.floor(pos.height * 0.35));
      // Bottom section (30%)
      pdf.rect(pos.x + 5, pos.y + 5 + Math.floor(pos.height * 0.70), pos.width - 10, Math.floor(pos.height * 0.25));
    }

    // New layout instructions
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('NEW CONTENT LAYOUT (No PDF Transformations):', 50, 80);
    pdf.setFontSize(10);
    pdf.text('1. Audit Trail: Top-left corner (simple text stacking)', 50, 95);
    pdf.text('2. Product Name: Center-top, largest fonts (up to 36pt)', 50, 110);
    pdf.text('3. Bottom: Barcode | Store Box | Dates | Case/Box', 50, 125);
    pdf.text('4. All fonts increased for better visibility', 50, 140);
    pdf.text('5. Rotate paper 90° clockwise after printing', 50, 155);

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
      labelFormat: 'S-5492 (NEW CONTENT LAYOUT - No PDF Transformations)',
      pageSize: 'Legal (8.5" × 14")',
      labelsPerPage: 4,
      contentLayout: 'Repositioned content with simple positioning only',
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
      migration: 'S-5492 NEW CONTENT LAYOUT (No PDF Transformations)',
      version: '6.3.1',
      contentLayout: {
        topSection: 'Audit Trail (top-left, simple stacking) + Product Name (center, large fonts)',
        middleSection: 'Product name overflow area',
        bottomSection: 'Barcode | Store Box | Dates | Case/Box (4 columns, larger fonts)',
        improvements: [
          'Audit trail positioned top-left with simple text stacking',
          'Product name centered at top with fonts up to 36pt',
          'Store text box with "Store:" label above',
          'Dates and case/box info with larger fonts (10pt, 9pt)',
          'Barcode repositioned with larger numeric display (8pt)',
          'All content uses simple positioning - NO PDF transformations'
        ]
      },
      labelSpecs: {
        dimensions: '4" × 6" (positioned sideways)',
        orientation: 'SIDEWAYS (container), simple content positioning',
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
      technicalApproach: [
        'NO setGState() calls',
        'NO saveGraphicsState() calls', 
        'NO PDF transformation matrix functions',
        'Simple text and shape positioning only',
        'Compatible with all PDF viewers and printers',
        'Audit trail uses vertical text stacking instead of rotation'
      ]
    };
  }

  // Legacy compatibility
  static calculateUlineLabelPosition(labelIndex) {
    return this.calculateUlineS5492PositionSideways(labelIndex % 4);
  }

  // Backwards compatibility - redirect to new method
  static async drawSidewaysLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawSidewaysLabelNewLayout(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }
}