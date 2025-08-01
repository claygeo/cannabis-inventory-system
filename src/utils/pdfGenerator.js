import jsPDF from 'jspdf';
import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generation utilities for Uline S-12212 label sheets (4" × 6")
 * LANDSCAPE CONTENT OPTIMIZATION: Content designed for 6" wide × 4" tall, then rotated as complete unit
 * When paper is rotated, content reads like a postcard with optimal space utilization
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

          // Calculate position for this label (labels touching on all sides)
          const position = this.calculateUlineS12212PositionConnected(currentLabelIndex % specs.LABELS_PER_SHEET);

          // Calculate which box number this label represents
          const boxNumber = Math.floor(labelCopy / Math.max(1, Math.floor(formattedData.labelQuantity / formattedData.boxCount))) + 1;

          // Draw the label with LANDSCAPE CONTENT ROTATED AS COMPLETE UNIT
          await this.drawLandscapeContentLabel(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
      }

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-12212 Format Labels (Landscape Content Rotated as Complete Unit)',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v8.0.0',
        keywords: 'cannabis, inventory, labels, uline, s-12212, landscape-content, rotated-layout, postcard-style'
      });

      // Log generation event
      storage.addSessionEvent(
        EVENT_TYPES.LABEL_GENERATED,
        `Generated ${currentLabelIndex} S-12212 labels with landscape content optimization across ${currentPage} pages`,
        `Items: ${labelDataArray.length}, Format: Uline S-12212 (Landscape Content, Complete Unit Rotation)`
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
   * Calculate label position for Uline S-12212 on legal paper - LABELS CONNECTED ON ALL SIDES
   * @param {number} labelIndex - Index of label (0-3 for 4 labels per sheet)
   * @returns {Object} - Position coordinates in points
   */
  static calculateUlineS12212PositionConnected(labelIndex) {
    // Legal size sheet dimensions (8.5" × 14")
    const pageWidth = 612;   // 8.5" in points  
    const pageHeight = 1008; // 14" in points
    
    // HP E877 printer margins: 0.167" on all sides
    const printerMargin = 12; // 0.167" = 12pt
    
    // S-12212 labels: 4" × 6" 
    const labelWidth = 288;  // 4" in points
    const labelHeight = 432; // 6" in points
    
    // Grid layout: 2 columns × 2 rows - LABELS TOUCHING (NO GAPS)
    const cols = 2;
    const rows = 2;
    const row = Math.floor(labelIndex / cols);
    const col = labelIndex % cols;
    
    // Calculate total area needed
    const totalLabelsWidth = cols * labelWidth;   // 576pt (8")
    const totalLabelsHeight = rows * labelHeight; // 864pt (12")
    
    // Center the connected label block on page
    const startX = (pageWidth - totalLabelsWidth) / 2;
    const startY = (pageHeight - totalLabelsHeight) / 2;
    
    // Individual label position - CONNECTED (no spacing between labels)
    const xPos = startX + (col * labelWidth);
    const yPos = startY + (row * labelHeight);
    
    return {
      x: Math.floor(xPos),
      y: Math.floor(yPos),
      width: labelWidth,   // 288pt (4")
      height: labelHeight, // 432pt (6")
      
      // Content design dimensions (landscape orientation before rotation)
      contentDesignWidth: labelHeight,  // 432pt (6" wide in landscape)
      contentDesignHeight: labelWidth,  // 288pt (4" tall in landscape)
      
      // Layout information
      row: row,
      col: col,
      labelIndex: labelIndex,
      
      // Connection info
      connected: true,
      connectedSides: this.getConnectedSides(labelIndex),
      
      // Content optimization info
      landscapeContent: true,
      contentRotation: 90, // Entire content rotated 90° clockwise
      postcardStyle: true,
      optimalSpaceUsage: true
    };
  }

  /**
   * Get which sides of the label are connected to other labels
   * @param {number} labelIndex - Label index (0-3)
   * @returns {Array} - Array of connected sides
   */
  static getConnectedSides(labelIndex) {
    const connected = [];
    
    switch (labelIndex) {
      case 0: // Top-left
        connected.push('right', 'bottom');
        break;
      case 1: // Top-right
        connected.push('left', 'bottom');
        break;
      case 2: // Bottom-left
        connected.push('right', 'top');
        break;
      case 3: // Bottom-right
        connected.push('left', 'top');
        break;
    }
    
    return connected;
  }

  /**
   * Draw label with LANDSCAPE CONTENT designed for 6" wide × 4" tall, rotated as complete unit
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Formatted label data
   * @param {Object} position - Label position and dimensions
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total number of boxes
   * @param {boolean} debug - Show debug borders
   * @param {string} currentUser - Current user
   */
  static async drawLandscapeContentLabel(pdf, labelData, position, boxNumber = 1, totalBoxes = 1, debug = false, currentUser = 'Unknown') {
    const { x, y, width, height, contentDesignWidth, contentDesignHeight } = position;

    try {
      // Draw label border (connected labels)
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(1);
      pdf.rect(x, y, width, height);

      // Debug info
      if (debug) {
        pdf.setDrawColor(255, 0, 0);
        pdf.setLineWidth(0.5);
        pdf.rect(x + 2, y + 2, width - 4, height - 4);
        
        // Show connected sides
        pdf.setDrawColor(0, 255, 0);
        pdf.setLineWidth(2);
        position.connectedSides.forEach(side => {
          switch (side) {
            case 'top':
              pdf.line(x, y, x + width, y);
              break;
            case 'right':
              pdf.line(x + width, y, x + width, y + height);
              break;
            case 'bottom':
              pdf.line(x, y + height, x + width, y + height);
              break;
            case 'left':
              pdf.line(x, y, x, y + height);
              break;
          }
        });
        
        pdf.setFontSize(8);
        pdf.setTextColor(255, 0, 0);
        pdf.text(`L${position.labelIndex + 1} LANDSCAPE`, x + 5, y + 20);
      }

      // Save current state before rotation
      pdf.save();

      // Transform coordinate system for landscape content
      // Move to center of label, rotate 90° clockwise, then translate for content positioning
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      
      pdf.translate(centerX, centerY);
      pdf.rotate(90 * Math.PI / 180); // 90° clockwise rotation
      pdf.translate(-contentDesignWidth / 2, -contentDesignHeight / 2);

      // Now draw content in landscape orientation (6" wide × 4" tall)
      await this.drawLandscapeContent(pdf, labelData, contentDesignWidth, contentDesignHeight, boxNumber, totalBoxes, currentUser, debug);

      // Restore coordinate system
      pdf.restore();

    } catch (error) {
      console.error('Error drawing landscape content label:', error);
      pdf.restore(); // Ensure we restore even on error
      
      pdf.setFontSize(10);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Error', x + 5, y + 20);
    }
  }

  /**
   * Draw content in landscape orientation (6" wide × 4" tall)
   * This content will be rotated 90° clockwise as a complete unit
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} width - Content width (432pt = 6")
   * @param {number} height - Content height (288pt = 4")
   * @param {number} boxNumber - Box number
   * @param {number} totalBoxes - Total boxes
   * @param {string} currentUser - Current user
   * @param {boolean} debug - Debug mode
   */
  static async drawLandscapeContent(pdf, labelData, width, height, boxNumber, totalBoxes, currentUser, debug) {
    const padding = 15;
    const contentWidth = width - (padding * 2);    // 402pt
    const contentHeight = height - (padding * 2);  // 258pt

    // Extract brand info
    const brandInfo = this.extractBrandFromProductName(labelData.productName);

    // Layout sections for landscape content (percentages from labelFormatter.js)
    const topSectionHeight = Math.floor(contentHeight * 0.35);     // ~90pt
    const middleSectionHeight = Math.floor(contentHeight * 0.35);  // ~90pt  
    const bottomSectionHeight = contentHeight - topSectionHeight - middleSectionHeight; // ~78pt

    // Section 1: Brand + Product Name (Top - 35%)
    await this.drawLandscapeTopSection(pdf, brandInfo, padding, padding, contentWidth, topSectionHeight);

    // Section 2: Store Box (Middle - 35%)
    this.drawLandscapeStoreSection(pdf, padding, padding + topSectionHeight, contentWidth, middleSectionHeight);

    // Section 3: Bottom Info - Barcode, Dates, Case (Bottom - 30%)
    await this.drawLandscapeBottomSection(pdf, labelData, padding, padding + topSectionHeight + middleSectionHeight, contentWidth, bottomSectionHeight, boxNumber, totalBoxes);

    // Audit trail (bottom-left corner)
    this.drawLandscapeAuditTrail(pdf, currentUser, padding, padding + contentHeight - 15);

    if (debug) {
      // Debug sections
      pdf.setDrawColor(0, 0, 255);
      pdf.setLineWidth(0.5);
      pdf.rect(padding, padding, contentWidth, topSectionHeight); // Top
      pdf.rect(padding, padding + topSectionHeight, contentWidth, middleSectionHeight); // Middle
      pdf.rect(padding, padding + topSectionHeight + middleSectionHeight, contentWidth, bottomSectionHeight); // Bottom
    }
  }

  /**
   * Draw top section in landscape layout - Brand and Product Name
   */
  static async drawLandscapeTopSection(pdf, brandInfo, x, y, width, height) {
    let currentY = y + 20;
    
    // Brand name (if detected)
    if (brandInfo.brand) {
      const brandFontSize = Math.min(28, Math.max(16, 32 - Math.floor(brandInfo.brand.length / 4)));
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(brandFontSize);
      pdf.setTextColor(44, 85, 48); // Dark green
      
      pdf.text(brandInfo.brand, x, currentY);
      currentY += brandFontSize + 10;
    }

    // Product name - can use much larger fonts in landscape
    const availableWidth = width - 20;
    const availableHeight = height - (currentY - y) - 10;
    
    const productFontSize = this.calculateLandscapeProductFontSize(brandInfo.productName, availableWidth, availableHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(productFontSize);
    pdf.setTextColor(0, 0, 0);
    
    // Handle line wrapping for long product names
    const lines = this.wrapTextForLandscape(brandInfo.productName, availableWidth, productFontSize);
    
    lines.forEach((line, index) => {
      if (currentY + (productFontSize * (index + 1)) <= y + height - 5) {
        pdf.text(line, x, currentY);
        currentY += productFontSize + 4;
      }
    });
  }

  /**
   * Draw store section in landscape layout
   */
  static drawLandscapeStoreSection(pdf, x, y, width, height) {
    // "Store:" label
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Store:', x, y + 20);
    
    // Store text boxes - two lines for landscape layout
    const boxHeight = 25;
    const boxWidth = width - 80;
    const startX = x + 60;
    
    // First line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(startX, y + 5, boxWidth, boxHeight);
    
    // Second line  
    pdf.rect(startX, y + 35, boxWidth, boxHeight);
    
    // Writing lines
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    
    for (let i = 0; i < 2; i++) {
      const boxY = y + 5 + (i * 30);
      const numLines = 3;
      for (let j = 1; j < numLines; j++) {
        const lineY = boxY + (j * (boxHeight / numLines));
        pdf.line(startX + 5, lineY, startX + boxWidth - 5, lineY);
      }
    }
  }

  /**
   * Draw bottom section in landscape layout - 3 columns: Barcode | Dates | Case/Box
   */
  static async drawLandscapeBottomSection(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    const colWidth = width / 3;

    // Column 1: Barcode
    await this.drawLandscapeBarcodeColumn(pdf, labelData, x, y, colWidth, height);
    
    // Column 2: Dates  
    this.drawLandscapeDatesColumn(pdf, labelData, x + colWidth, y, colWidth, height);
    
    // Column 3: Case/Box
    this.drawLandscapeCaseColumn(pdf, labelData, x + (colWidth * 2), y, colWidth, height, boxNumber, totalBoxes);
  }

  /**
   * Draw barcode column in landscape layout
   */
  static async drawLandscapeBarcodeColumn(pdf, labelData, x, y, width, height) {
    // Barcode numeric display
    const spacedBarcodeDisplay = this.formatBarcodeWithSpaces(labelData.barcodeDisplay);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(102, 102, 102);
    pdf.text(spacedBarcodeDisplay, x + 5, y + height - 5);
    
    // Barcode image - larger in landscape
    const barcodeWidth = Math.min(width - 20, 100);
    const barcodeHeight = Math.min(height - 25, 45);
    const barcodeX = x + (width - barcodeWidth) / 2;
    const barcodeY = y + 10;
    
    await this.drawEnhancedBarcode(pdf, labelData.barcode, barcodeX, barcodeY, barcodeWidth, barcodeHeight);
  }

  /**
   * Draw dates column in landscape layout
   */
  static drawLandscapeDatesColumn(pdf, labelData, x, y, width, height) {
    const centerX = x + width / 2;
    let currentY = y + 20;
    
    // Harvest date
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Harvest:', centerX - 30, currentY, { align: 'left' });
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(13);
    const harvestDate = labelData.harvestDate || 'MM/DD/YY';
    pdf.text(harvestDate, centerX + 15, currentY);
    
    currentY += 25;
    
    // Package date
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Package:', centerX - 30, currentY, { align: 'left' });
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(13);
    const packageDate = labelData.packagedDate || 'MM/DD/YY';
    pdf.text(packageDate, centerX + 15, currentY);
  }

  /**
   * Draw case/box column in landscape layout
   */
  static drawLandscapeCaseColumn(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    const centerX = x + width / 2;
    let currentY = y + 20;
    
    // Case quantity
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    
    const caseQtyValue = labelData.caseQuantity || '___';
    pdf.text(`Case: ${caseQtyValue}`, centerX, currentY, { align: 'center' });
    
    currentY += 25;
    
    // Box info
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    pdf.text(boxText, centerX, currentY, { align: 'center' });
  }

  /**
   * Draw audit trail in landscape layout (bottom-left)
   */
  static drawLandscapeAuditTrail(pdf, currentUser, x, y) {
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
    pdf.setFontSize(9);
    pdf.setTextColor(102, 102, 102);
    
    pdf.text(auditLine, x, y);
  }

  /**
   * Calculate optimal font size for landscape product names
   */
  static calculateLandscapeProductFontSize(text, availableWidth, availableHeight) {
    if (!text) return 24;
    
    const length = text.length;
    let fontSize = 28; // Start larger for landscape
    
    // Adjust based on text length
    if (length > 80) fontSize = 18;
    else if (length > 60) fontSize = 20;
    else if (length > 40) fontSize = 22;
    else if (length > 25) fontSize = 24;
    else if (length > 15) fontSize = 26;
    
    // Check if it fits in available space
    const estimatedWidth = length * (fontSize * 0.6);
    if (estimatedWidth > availableWidth) {
      fontSize = Math.max(16, Math.floor((availableWidth / length) * 1.4));
    }
    
    return Math.min(fontSize, 28);
  }

  /**
   * Wrap text for landscape layout
   */
  static wrapTextForLandscape(text, maxWidth, fontSize) {
    if (!text) return [''];
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    const charWidth = fontSize * 0.6; // Approximate character width
    const maxCharsPerLine = Math.floor(maxWidth / charWidth);
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      if (testLine.length <= maxCharsPerLine || currentLine === '') {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    });
    
    if (currentLine) lines.push(currentLine);
    
    return lines.length > 0 ? lines : [''];
  }

  /**
   * Enhanced barcode generation for landscape layout
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
    
    pdf.setFontSize(10);
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
      sku: 'TEST-S12212-LANDSCAPE-CONTENT',
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
      labelFormat: 'Uline S-12212 (Landscape Content with Complete Unit Rotation)',
      pageSize: 'Legal (8.5" × 14")',
      labelsPerPage: 4,
      contentLayout: 'Landscape content (6" wide × 4" tall) rotated 90° clockwise as complete unit',
      optimization: 'Postcard-style reading when labels are applied sideways',
      contentDesign: 'Designed for 6" width utilization with larger fonts and better spacing',
      labelsConnected: 'All labels connected on adjacent sides (no gaps)'
    };
  }

  /**
   * Get debug information
   */
  static getDebugInfo() {
    const positions = [];
    for (let i = 0; i < 4; i++) {
      positions.push(this.calculateUlineS12212PositionConnected(i));
    }

    return {
      migration: 'Uline S-12212 Landscape Content with Complete Rotation',
      version: '8.0.0',
      approach: {
        concept: 'Content designed for landscape (6" wide × 4" tall), rotated as complete unit',
        method: 'PDF coordinate transformation with save/restore for entire content area rotation',
        benefits: [
          'Content designed for optimal 6" width utilization',
          'Larger fonts possible across all elements',
          'Postcard-style reading when labels applied sideways',
          'Professional landscape layout when paper is rotated',
          'Labels connected on all sides matching Uline template'
        ]
      },
      contentRotation: {
        method: 'Complete unit transformation',
        steps: [
          'Save PDF state',
          'Translate to label center',
          'Rotate coordinate system 90° clockwise', 
          'Draw content in landscape orientation',  
          'Restore PDF state'
        ],
        advantages: [
          'Entire content area rotated together',
          'Content designed specifically for landscape layout',
          'Better space utilization than individual text rotation',
          'Maintains professional appearance'
        ]
      },
      landscapeLayout: {
        designDimensions: '6" wide × 4" tall (432pt × 288pt)',
        sections: {
          top: 'Brand + Product Name (35% height, larger fonts)',
          middle: 'Store section with dual text boxes (35% height)',
          bottom: 'Barcode | Dates | Case/Box in 3 columns (30% height)'
        },
        fontSizes: {
          brand: 'Up to 28pt',
          productName: 'Up to 28pt with line wrapping',
          storeLabel: '16pt',
          dates: '14pt labels, 13pt values',
          case: '14pt',
          audit: '9pt',
          barcodeNumeric: '12pt'
        }
      },
      labelConnection: {
        connected: true,
        method: 'No gaps between labels',
        gridLayout: '2×2 with touching edges',
        matchesUlineTemplate: true
      },
      positions: positions
    };
  }

  // Legacy compatibility methods
  static calculateUlineLabelPosition(labelIndex) {
    return this.calculateUlineS12212PositionConnected(labelIndex % 4);
  }

  static async drawSidewaysLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawLandscapeContentLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }

  static async draw4LayerOptimizedLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawLandscapeContentLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }

  static async drawRotatedTextLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawLandscapeContentLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }
}