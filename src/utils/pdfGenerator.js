import jsPDF from 'jspdf';
import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generation utilities for Uline S-12212 label sheets (4" × 6")
 * VERTICAL TEXT LAYOUT: Utilize 6" dimension for text flow instead of 4" dimension
 * Text flows vertically down the 6" height for maximum visibility and font sizes
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

          // Draw the label with VERTICAL LAYOUT for 6" dimension utilization
          await this.drawVerticalLayoutLabel(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
      }

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-12212 Format Labels (Vertical Layout for 6" Dimension)',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v7.1.0',
        keywords: 'cannabis, inventory, labels, uline, s-12212, vertical-layout, 6inch'
      });

      // Log generation event
      storage.addSessionEvent(
        EVENT_TYPES.LABEL_GENERATED,
        `Generated ${currentLabelIndex} S-12212 labels with vertical layout for 6" dimension across ${currentPage} pages`,
        `Items: ${labelDataArray.length}, Format: Uline S-12212 (Vertical Layout for 6" Dimension)`
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
   * Calculate label position for Uline S-12212 positioned to utilize 6" dimension
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
    
    // S-12212 labels: 4" × 6" = Position to use 6" dimension for text flow
    const labelWidth = 288;  // 4" in points (narrow dimension)
    const labelHeight = 432; // 6" in points (wide dimension - used for text flow)
    
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
      width: labelWidth,   // 288pt (4" width)
      height: labelHeight, // 432pt (6" height - utilized for text flow)
      
      // Layout information
      row: row,
      col: col,
      labelIndex: labelIndex,
      
      // Layout info
      utilizes6InchDimension: true,
      textFlowDirection: 'vertical', // Text flows down the 6" dimension
      readingOrientation: 'turn label or head to read'
    };
  }

  /**
   * Draw label with VERTICAL LAYOUT utilizing 6" dimension for text flow
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Formatted label data
   * @param {Object} position - Label position and dimensions
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total number of boxes
   * @param {boolean} debug - Show debug borders
   * @param {string} currentUser - Current user
   */
  static async drawVerticalLayoutLabel(pdf, labelData, position, boxNumber = 1, totalBoxes = 1, debug = false, currentUser = 'Unknown') {
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
        pdf.text(`L${position.labelIndex + 1} VERT`, x + 5, y + 15);
        pdf.text(`6" FLOW`, x + 5, y + 25);
      }

      const padding = 10;
      const contentX = x + padding;
      const contentY = y + padding;
      const contentWidth = width - (padding * 2);    // 268pt (4" minus padding)
      const contentHeight = height - (padding * 2);  // 412pt (6" minus padding - THIS is our main text flow area)

      const brandInfo = this.extractBrandFromProductName(labelData.productName);

      // Vertical layout utilizing the 6" dimension (height in PDF coordinates)
      // Section 1: Brand + Product Name (Top 40% of 6" dimension)
      const section1Height = Math.floor(contentHeight * 0.40); // 165pt
      await this.drawBrandProductVertical(pdf, brandInfo, contentX, contentY, contentWidth, section1Height);

      // Section 2: Store (Middle 25% of 6" dimension)
      const section2Y = contentY + section1Height;
      const section2Height = Math.floor(contentHeight * 0.25); // 103pt
      this.drawStoreVertical(pdf, contentX, section2Y, contentWidth, section2Height);

      // Section 3: Bottom Row - Barcode | Dates | Case/Box (Bottom 30% of 6" dimension)
      const section3Y = section2Y + section2Height;
      const section3Height = Math.floor(contentHeight * 0.30); // 124pt
      await this.drawBottomVertical(pdf, labelData, contentX, section3Y, contentWidth, section3Height, boxNumber, totalBoxes);

      // Section 4: Audit Trail (Bottom 5% of 6" dimension)
      const section4Y = section3Y + section3Height;
      const section4Height = contentHeight - section1Height - section2Height - section3Height;
      this.drawAuditVertical(pdf, currentUser, contentX, section4Y, contentWidth, section4Height);

    } catch (error) {
      console.error('Error drawing vertical layout label:', error);
      pdf.setFontSize(10);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Error', x + 5, y + 20);
    }
  }

  /**
   * Draw brand and product section vertically (utilizing 6" dimension)
   */
  static async drawBrandProductVertical(pdf, brandInfo, x, y, width, height) {
    let currentY = y + 20;
    const centerX = x + width / 2;

    // Brand name (large, centered)
    if (brandInfo.brand) {
      const brandFontSize = Math.min(34, Math.max(18, 36 - Math.floor(brandInfo.brand.length / 3)));
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(brandFontSize);
      pdf.setTextColor(0, 0, 0);
      
      const brandWidth = pdf.getTextWidth(brandInfo.brand);
      const brandX = centerX - brandWidth / 2;
      pdf.text(brandInfo.brand, brandX, currentY);
      currentY += brandFontSize + 15;
    }

    // Product name (large, centered, multiple lines if needed)
    const remainingHeight = height - (currentY - y) - 15;
    const maxProductFontSize = brandInfo.brand ? 28 : 34;
    
    // Calculate optimal font size based on available space
    let productFontSize = maxProductFontSize;
    let productLines = [];
    
    // Try different font sizes to find best fit
    for (let fontSize = maxProductFontSize; fontSize >= 14; fontSize -= 2) {
      pdf.setFontSize(fontSize);
      productLines = pdf.splitTextToSize(brandInfo.productName, width - 20);
      const totalTextHeight = productLines.length * (fontSize * 1.3);
      
      if (totalTextHeight <= remainingHeight) {
        productFontSize = fontSize;
        break;
      }
    }
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(productFontSize);
    pdf.setTextColor(0, 0, 0);
    
    // Center the text block vertically in remaining space
    const lineHeight = productFontSize * 1.3;
    const totalTextHeight = productLines.length * lineHeight;
    const startY = currentY + Math.max(0, (remainingHeight - totalTextHeight) / 2);
    
    productLines.forEach((line, index) => {
      const textWidth = pdf.getTextWidth(line);
      const textX = centerX - textWidth / 2;
      const lineY = startY + (index * lineHeight);
      pdf.text(line, textX, lineY);
    });
  }

  /**
   * Draw store section vertically
   */
  static drawStoreVertical(pdf, x, y, width, height) {
    const centerX = x + width / 2;
    let currentY = y + 15;
    
    // "Store:" label centered
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16); // Larger for better visibility
    pdf.setTextColor(0, 0, 0);
    
    const storeLabel = 'Store:';
    const labelWidth = pdf.getTextWidth(storeLabel);
    const labelX = centerX - labelWidth / 2;
    pdf.text(storeLabel, labelX, currentY);
    currentY += 25;
    
    // Text box centered below label
    const boxWidth = Math.min(width * 0.9, 250);
    const boxHeight = height - 50;
    const boxX = centerX - boxWidth / 2;
    
    // Main box
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(boxX, currentY, boxWidth, boxHeight);

    // Writing lines
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.5);
    
    const numLines = 4;
    for (let i = 1; i < numLines; i++) {
      const lineY = currentY + (i * (boxHeight / numLines));
      pdf.line(boxX + 5, lineY, boxX + boxWidth - 5, lineY);
    }
  }

  /**
   * Draw bottom section vertically (3 rows stacked)
   */
  static async drawBottomVertical(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    const rowHeight = height / 3;

    // Row 1: Barcode + numeric display
    await this.drawBarcodeVertical(pdf, labelData, x, y, width, rowHeight);
    
    // Row 2: Dates (Harvest and Package)
    this.drawDatesVertical(pdf, labelData, x, y + rowHeight, width, rowHeight);
    
    // Row 3: Case quantity and Box info
    this.drawCaseBoxVertical(pdf, labelData, x, y + (rowHeight * 2), width, rowHeight, boxNumber, totalBoxes);
  }

  /**
   * Draw barcode section vertically
   */
  static async drawBarcodeVertical(pdf, labelData, x, y, width, height) {
    const centerX = x + width / 2;
    let currentY = y + 12;
    
    // Barcode numeric display
    const spacedBarcodeDisplay = this.formatBarcodeWithSpaces(labelData.barcodeDisplay);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11); // Larger for better visibility
    pdf.setTextColor(102, 102, 102);
    
    const displayWidth = pdf.getTextWidth(spacedBarcodeDisplay);
    const displayX = centerX - displayWidth / 2;
    pdf.text(spacedBarcodeDisplay, displayX, currentY);
    currentY += 18;
    
    // Barcode image
    const barcodeWidth = Math.min(width - 20, 200);
    const barcodeHeight = Math.min(height - 35, 50);
    const barcodeX = centerX - barcodeWidth / 2;
    
    await this.drawEnhancedBarcode(pdf, labelData.barcode, barcodeX, currentY, barcodeWidth, barcodeHeight);
  }

  /**
   * Draw dates section vertically
   */
  static drawDatesVertical(pdf, labelData, x, y, width, height) {
    const centerX = x + width / 2;
    let currentY = y + 15;
    
    // Harvest Date
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12); // Larger fonts
    pdf.setTextColor(0, 0, 0);
    
    const harvestLabel = 'Harvest:';
    const harvestLabelWidth = pdf.getTextWidth(harvestLabel);
    pdf.text(harvestLabel, centerX - harvestLabelWidth / 2, currentY);
    currentY += 18;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    const harvestDate = labelData.harvestDate || 'MM/DD/YY';
    const harvestDateWidth = pdf.getTextWidth(harvestDate);
    pdf.text(harvestDate, centerX - harvestDateWidth / 2, currentY);
    currentY += 25;
    
    // Package Date
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    const packageLabel = 'Package:';
    const packageLabelWidth = pdf.getTextWidth(packageLabel);
    pdf.text(packageLabel, centerX - packageLabelWidth / 2, currentY);
    currentY += 18;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    const packageDate = labelData.packagedDate || 'MM/DD/YY';
    const packageDateWidth = pdf.getTextWidth(packageDate);
    pdf.text(packageDate, centerX - packageDateWidth / 2, currentY);
  }

  /**
   * Draw case and box section vertically
   */
  static drawCaseBoxVertical(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    const centerX = x + width / 2;
    let currentY = y + 10;
    const boxWidth = Math.min(width - 20, 200);
    const boxHeight = 20;
    const boxX = centerX - boxWidth / 2;
    
    // Case Qty Box
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(boxX, currentY, boxWidth, boxHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12); // Larger font
    pdf.setTextColor(0, 0, 0);
    const caseQtyValue = labelData.caseQuantity || '___';
    const caseQtyText = `Case: ${caseQtyValue}`;
    const caseQtyWidth = pdf.getTextWidth(caseQtyText);
    pdf.text(caseQtyText, centerX - caseQtyWidth / 2, currentY + 14);
    
    currentY += boxHeight + 15;
    
    // Box Number Box
    pdf.rect(boxX, currentY, boxWidth, boxHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    const boxTextWidth = pdf.getTextWidth(boxText);
    pdf.text(boxText, centerX - boxTextWidth / 2, currentY + 14);
  }

  /**
   * Draw audit section vertically
   */
  static drawAuditVertical(pdf, currentUser, x, y, width, height) {
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
    
    // Center the audit trail
    const centerX = x + width / 2;
    const auditWidth = pdf.getTextWidth(auditLine);
    pdf.text(auditLine, centerX - auditWidth / 2, y + 12);
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
      sku: 'TEST-S12212-VERTICAL',
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
      labelFormat: 'Uline S-12212 (Vertical Layout for 6" Dimension Utilization)',
      pageSize: 'Legal (8.5" × 14")',
      labelsPerPage: 4,
      contentLayout: 'Vertical text flow utilizing 6" dimension for larger fonts',
      dimensionUtilization: 'Text flows down the 6" dimension instead of across 4" dimension',
      readingMethod: 'Turn label or head to read - maximizes text size and visibility'
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
      migration: 'Uline S-12212 Vertical Layout for 6" Dimension Utilization',
      version: '7.1.0',
      approach: {
        concept: 'Utilize 6" dimension for text flow instead of 4" dimension',
        method: 'Vertical text layout - no rotation needed',
        benefits: [
          'Much larger font sizes possible',
          'Better text visibility and readability',
          'Optimal use of available label space',
          'Simple implementation without complex rotations'
        ]
      },
      dimensionUtilization: {
        physical: '4" × 6" labels',
        current: 'Text flows down the 6" dimension',
        previous: 'Text was cramped in 4" dimension',
        improvement: 'Up to 50% larger fonts possible'
      },
      layoutSections: {
        brandProduct: 'Top 40% - Large brand and product names',
        store: 'Middle 25% - Store label and text box',
        bottomInfo: 'Bottom 30% - Barcode, dates, case info stacked',
        audit: 'Bottom 5% - Audit trail'
      },
      readingExperience: {
        orientation: 'Turn label or head to read',
        benefit: 'Much larger, more readable text',
        usability: 'Easier to scan and identify products'
      },
      positions: positions
    };
  }

  // Legacy compatibility methods
  static calculateUlineLabelPosition(labelIndex) {
    return this.calculateUlineS12212Position(labelIndex % 4);
  }

  static async drawSidewaysLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawVerticalLayoutLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }

  static async draw4LayerOptimizedLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawVerticalLayoutLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }
}