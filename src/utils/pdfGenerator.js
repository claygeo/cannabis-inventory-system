// FIXED PDF GENERATION with Working Landscape Content Layout
import { jsPDF } from 'jspdf';
import 'jspdf/dist/jspdf.es.min.js';

import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generation utilities for Uline S-12212 label sheets (4" × 6")
 * FIXED LANDSCAPE CONTENT LAYOUT: 6" wide × 4" tall when rotated 90° clockwise
 * Content is drawn in landscape orientation, then rotated as a complete unit
 */
export class PDFGenerator {
  /**
   * Generate PDF with labels positioned for Uline S-12212 sheets
   */
  static async generateLabels(labelDataArray, options = {}) {
    console.log('🏷️ Starting FIXED PDF generation with working landscape layout...');
    console.log('📋 Label data array length:', labelDataArray.length);
    
    const {
      format = 'legal',
      orientation = 'portrait',
      debug = false,
      currentUser = 'Unknown'
    } = options;

    // Create PDF instance
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [612, 1008]
    });

    console.log('📄 PDF instance created successfully');

    let currentLabelIndex = 0;
    let currentPage = 1;
    const specs = LabelFormatter.getLabelSpecs();

    try {
      // Process each label data item
      for (let dataIndex = 0; dataIndex < labelDataArray.length; dataIndex++) {
        const labelData = labelDataArray[dataIndex];
        console.log(`🏷️ Processing label data ${dataIndex + 1}/${labelDataArray.length}`);
        
        const formattedData = LabelFormatter.formatLabelData(
          labelData,
          labelData.enhancedData || {},
          labelData.user || currentUser
        );

        // Generate the number of labels specified
        for (let labelCopy = 0; labelCopy < formattedData.labelQuantity; labelCopy++) {
          console.log(`📄 Generating label copy ${labelCopy + 1}/${formattedData.labelQuantity}`);
          
          // Check if we need a new page (4 labels per sheet)
          if (currentLabelIndex > 0 && currentLabelIndex % specs.LABELS_PER_SHEET === 0) {
            console.log('📄 Adding new page');
            pdf.addPage();
            currentPage++;
          }

          // Calculate position for this label (labels touching on all sides)
          const position = this.calculateUlineS12212PositionConnected(currentLabelIndex % specs.LABELS_PER_SHEET);

          // Calculate which box number this label represents
          const boxNumber = Math.floor(labelCopy / Math.max(1, Math.floor(formattedData.labelQuantity / formattedData.boxCount))) + 1;

          // Draw the label using FIXED method
          await this.drawLabelWithFixedLandscapeLayout(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
      }

      console.log(`✅ Generated ${currentLabelIndex} labels across ${currentPage} pages`);

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-12212 Format Labels (Fixed Landscape Content)',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v8.5.0',
        keywords: 'cannabis, inventory, labels, uline, s-12212, fixed-landscape, working-transformation'
      });

      return pdf.output('blob');

    } catch (error) {
      console.error('❌ PDF generation error:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * FIXED: Draw label with working landscape content layout
   */
  static async drawLabelWithFixedLandscapeLayout(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    console.log(`🎨 Drawing label with FIXED landscape layout method...`);
    
    const { x, y, width, height } = position;

    try {
      // Draw label border first (outside transformation)
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(1);
      pdf.rect(x, y, width, height);

      // Debug border if requested
      if (debug) {
        pdf.setDrawColor(255, 0, 0);
        pdf.setLineWidth(0.5);
        pdf.rect(x + 1, y + 1, width - 2, height - 2);
      }

      // Use FIXED transformation method
      await this.drawWithFixedTransformation(pdf, labelData, position, boxNumber, totalBoxes, currentUser, debug);
      console.log('✅ Fixed transformation successful');

    } catch (error) {
      console.error('❌ Fixed transformation failed:', error);
      
      // Emergency fallback - draw basic content without transformation
      pdf.setFontSize(12);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Error - Using Fallback', x + 5, y + 20);
      
      // Extract brand info
      const brandInfo = this.extractBrandFromProductName(labelData.productName);
      
      // Simple product name
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      const productName = brandInfo.productName || 'Product Name';
      const lines = this.wrapText(productName, width - 20, 14);
      lines.slice(0, 3).forEach((line, index) => {
        pdf.text(line, x + 10, y + 50 + (index * 18));
      });
    }
  }

  /**
   * FIXED transformation method with correct coordinate handling
   */
  static async drawWithFixedTransformation(pdf, labelData, position, boxNumber, totalBoxes, currentUser, debug) {
    console.log('🔧 FIXED transformation with correct coordinate handling');
    const { x, y, width, height } = position;
    
    // Save graphics state
    pdf.internal.write('q');
    
    try {
      // FIXED APPROACH: Single transformation matrix
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      
      // Single transformation: translate to center, rotate 90°, translate to origin
      // This creates a coordinate system where (0,0) is at the center of our landscape content
      const tx = centerX;
      const ty = centerY;
      
      // Apply transformation: translate to center, then rotate 90° clockwise
      pdf.internal.write(`0 1 -1 0 ${tx} ${ty} cm`);
      
      // Now draw content in the transformed coordinate system
      // Content dimensions in landscape orientation
      const contentWidth = height;  // 432pt (6" when rotated)
      const contentHeight = width;  // 288pt (4" when rotated)
      
      console.log(`🎨 Drawing landscape content: ${contentWidth} × ${contentHeight}pt`);
      
      // Draw landscape content with coordinates relative to center (0,0)
      await this.drawLandscapeContentFixed(pdf, labelData, contentWidth, contentHeight, boxNumber, totalBoxes, currentUser, debug);
      
    } finally {
      // Always restore graphics state
      pdf.internal.write('Q');
    }
  }

  /**
   * FIXED landscape content drawing with correct coordinate calculations
   */
  static async drawLandscapeContentFixed(pdf, labelData, width, height, boxNumber, totalBoxes, currentUser, debug) {
    console.log(`🎨 Drawing FIXED landscape content - ${width}×${height}pt`);
    
    // Content area calculations (coordinates relative to center)
    const padding = 15;
    const contentLeft = -width / 2 + padding;   // Start from left edge
    const contentTop = -height / 2 + padding;   // Start from top edge
    const contentWidth = width - (padding * 2);
    const contentHeight = height - (padding * 2);

    // Extract brand info
    const brandInfo = this.extractBrandFromProductName(labelData.productName);

    // Layout sections
    const topSectionHeight = Math.floor(contentHeight * 0.4);      // 40% for product info
    const middleSectionHeight = Math.floor(contentHeight * 0.25);  // 25% for store
    const bottomSectionHeight = contentHeight - topSectionHeight - middleSectionHeight; // 35% for bottom row

    let currentY = contentTop;

    // TOP SECTION: Brand + Product Name (centered)
    if (brandInfo.brand) {
      const brandFontSize = Math.min(24, Math.max(16, 28 - Math.floor(brandInfo.brand.length / 4)));
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(brandFontSize);
      pdf.setTextColor(44, 85, 48); // Dark green
      
      // Center brand name
      pdf.text(brandInfo.brand, 0, currentY + 25, { align: 'center' });
      currentY += brandFontSize + 8;
    }

    // Product name (centered with larger fonts)
    const productFontSize = this.calculateOptimalFontSize(brandInfo.productName, contentWidth * 0.9, 28, 14);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(productFontSize);
    pdf.setTextColor(0, 0, 0);
    
    const productLines = this.wrapText(brandInfo.productName, contentWidth * 0.9, productFontSize);
    productLines.slice(0, 3).forEach((line, index) => {
      pdf.text(line, 0, currentY + 25 + (index * (productFontSize + 2)), { align: 'center' });
    });

    // MIDDLE SECTION: Store area
    const storeY = contentTop + topSectionHeight + 15;
    
    // "Store:" label
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Store:', contentLeft + 15, storeY);
    
    // Single centered textbox
    const boxWidth = Math.min(contentWidth * 0.7, 300);
    const boxHeight = 45;
    const boxX = -boxWidth / 2; // Center horizontally
    const boxY = storeY + 8;
    
    // Main textbox
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(2);
    pdf.rect(boxX, boxY, boxWidth, boxHeight);
    
    // Writing lines inside textbox
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    for (let i = 1; i < 3; i++) {
      const lineY = boxY + (i * (boxHeight / 3));
      pdf.line(boxX + 8, lineY, boxX + boxWidth - 8, lineY);
    }

    // BOTTOM SECTION: Three-column layout
    const bottomY = contentTop + topSectionHeight + middleSectionHeight + 10;
    const colWidth = contentWidth / 3;

    // Column 1: Barcode (left)
    const col1X = contentLeft + (colWidth / 2);
    
    // Barcode numeric display (above barcode)
    const spacedBarcodeDisplay = this.formatBarcodeWithSpaces(labelData.barcodeDisplay);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(102, 102, 102);
    pdf.text(spacedBarcodeDisplay, col1X, bottomY, { align: 'center' });
    
    // Barcode image (larger size)
    const barcodeWidth = 120;
    const barcodeHeight = 50;
    const barcodeX = col1X - barcodeWidth / 2;
    const barcodeY = bottomY + 8;
    
    await this.drawEnhancedBarcode(pdf, labelData.barcode, barcodeX, barcodeY, barcodeWidth, barcodeHeight);

    // Column 2: Dates (center)
    const col2X = contentLeft + colWidth + (colWidth / 2);
    let dateY = bottomY;
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Harvest:', col2X, dateY, { align: 'center' });
    
    dateY += 18;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(13);
    const harvestDate = labelData.harvestDate || 'MM/DD/YY';
    pdf.text(harvestDate, col2X, dateY, { align: 'center' });
    
    dateY += 25;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Package:', col2X, dateY, { align: 'center' });
    
    dateY += 18;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(13);
    const packageDate = labelData.packagedDate || 'MM/DD/YY';
    pdf.text(packageDate, col2X, dateY, { align: 'center' });

    // Column 3: Case/Box (right)
    const col3X = contentLeft + (colWidth * 2) + (colWidth / 2);
    let caseY = bottomY;
    
    // Case textbox
    const caseBoxWidth = colWidth * 0.8;
    const caseBoxHeight = 22;
    const caseBoxX = col3X - caseBoxWidth / 2;
    
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(caseBoxX, caseY - 3, caseBoxWidth, caseBoxHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    const caseQtyValue = labelData.caseQuantity || '___';
    pdf.text(`Case: ${caseQtyValue}`, col3X, caseY + 10, { align: 'center' });
    
    caseY += 28;
    
    // Box textbox
    pdf.rect(caseBoxX, caseY - 3, caseBoxWidth, caseBoxHeight);
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    pdf.text(boxText, col3X, caseY + 10, { align: 'center' });

    // Audit trail (bottom-left corner)
    const auditLine = this.generateAuditLine(currentUser);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(102, 102, 102);
    pdf.text(auditLine, contentLeft, contentTop + contentHeight - 5);

    if (debug) {
      // Debug content area boundary
      pdf.setDrawColor(0, 255, 0);
      pdf.setLineWidth(0.5);
      pdf.rect(contentLeft, contentTop, contentWidth, contentHeight);
      
      // Debug section divisions
      pdf.setDrawColor(0, 0, 255);
      pdf.line(contentLeft, contentTop + topSectionHeight, contentLeft + contentWidth, contentTop + topSectionHeight);
      pdf.line(contentLeft, contentTop + topSectionHeight + middleSectionHeight, contentLeft + contentWidth, contentTop + topSectionHeight + middleSectionHeight);
    }

    console.log('✅ Fixed landscape content drawing completed');
  }

  /**
   * Calculate label position for Uline S-12212 on legal paper - LABELS CONNECTED ON ALL SIDES
   */
  static calculateUlineS12212PositionConnected(labelIndex) {
    // Legal size sheet dimensions (8.5" × 14")
    const pageWidth = 612;   // 8.5" in points  
    const pageHeight = 1008; // 14" in points
    
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
      contentRotation: 90,
      postcardStyle: true,
      optimalSpaceUsage: true,
      fixed: true
    };
  }

  /**
   * Get which sides of the label are connected to other labels
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
   * Generate audit line
   */
  static generateAuditLine(currentUser) {
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
    
    return `${month}/${day}/${year} ${hoursStr}:${minutes}${ampm} EST (${(currentUser || 'Unknown').substring(0, 8)})`;
  }

  /**
   * Calculate optimal font size for available space
   */
  static calculateOptimalFontSize(text, availableWidth, maxSize = 28, minSize = 14) {
    if (!text) return maxSize;
    
    const length = text.length;
    let fontSize = maxSize;
    
    // Adjust based on text length
    if (length > 100) fontSize = Math.max(minSize, maxSize - 12);
    else if (length > 80) fontSize = Math.max(minSize, maxSize - 10);
    else if (length > 60) fontSize = Math.max(minSize, maxSize - 8);
    else if (length > 40) fontSize = Math.max(minSize, maxSize - 6);
    else if (length > 25) fontSize = Math.max(minSize, maxSize - 4);
    else if (length > 15) fontSize = Math.max(minSize, maxSize - 2);
    
    // Check if it fits in available space
    const estimatedWidth = length * (fontSize * 0.6);
    if (estimatedWidth > availableWidth) {
      fontSize = Math.max(minSize, Math.floor((availableWidth / length) * 1.4));
    }
    
    return Math.min(fontSize, maxSize);
  }

  /**
   * Wrap text to fit within specified width
   */
  static wrapText(text, maxWidth, fontSize) {
    if (!text) return [''];
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    const charWidth = fontSize * 0.6;
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
   * Generate test PDF - Creates 4 different labels
   */
  static async generateTestPDF() {
    console.log('🧪 Generating FIXED test PDF with working landscape layout...');
    
    const testData = [
      {
        sku: 'CURALEAF-PINK-CHAMPAGNE',
        barcode: 'CUR19862332',
        productName: 'Curaleaf Pink Champagne Premium Cannabis Capsules [10mg THC] 30-Count',
        enhancedData: {
          labelQuantity: 1,
          caseQuantity: '8',
          boxCount: '2',
          harvestDate: '04/20/25',
          packagedDate: '07/10/25'
        },
        user: 'TestUser'
      },
      {
        sku: 'GRASSROOTS-BIRTHDAY-CAKE',
        barcode: 'GRS19873344',
        productName: 'Grassroots Birthday Cake Live Resin [1g]',
        enhancedData: {
          labelQuantity: 1,
          caseQuantity: '12',
          boxCount: '8',
          harvestDate: '03/15/25',
          packagedDate: '06/20/25'
        },
        user: 'TestUser'
      },
      {
        sku: 'FIND-CLEMENTINE-CART',
        barcode: 'FND19884455',
        productName: 'FIND Clementine Cartridge [0.5g]',
        enhancedData: {
          labelQuantity: 1,
          caseQuantity: '6',
          boxCount: '24',
          harvestDate: '02/10/25',
          packagedDate: '05/15/25'
        },
        user: 'TestUser'
      },
      {
        sku: 'BNOBLE-BLUE-DREAM',
        barcode: 'BNB19895566',
        productName: 'B-Noble Blue Dream Flower [3.5g]',
        enhancedData: {
          labelQuantity: 1,
          caseQuantity: '15',
          boxCount: '6',
          harvestDate: '01/05/25',
          packagedDate: '04/10/25'
        },
        user: 'TestUser'
      }
    ];

    return this.generateLabels(testData, { debug: true, currentUser: 'TestUser' });
  }

  // Legacy methods for compatibility
  static calculateUlineLabelPosition(labelIndex) {
    return this.calculateUlineS12212PositionConnected(labelIndex % 4);
  }

  static validateGenerationData(labelDataArray) {
    const errors = [];
    const warnings = [];

    if (!Array.isArray(labelDataArray) || labelDataArray.length === 0) {
      errors.push('No label data provided');
      return { isValid: false, errors, warnings };
    }

    return {
      isValid: true,
      errors,
      warnings,
      totalLabels: labelDataArray.length,
      estimatedPages: Math.ceil(labelDataArray.length / 4),
      labelFormat: 'Uline S-12212 (FIXED Landscape Content Layout)',
      approach: 'Fixed single transformation matrix with corrected coordinate system'
    };
  }
}