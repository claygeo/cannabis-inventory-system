// FINAL ROTATED VIEW PDF GENERATOR - Position for Physical Paper Rotation
import { jsPDF } from 'jspdf';
import 'jspdf/dist/jspdf.es.min.js';

import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generation designed for final rotated view
 * Position everything exactly where it should appear when paper is rotated 90° clockwise
 * NO PDF rotation - just strategic positioning for physical paper rotation
 */
export class PDFGenerator {
  /**
   * Generate PDF with labels positioned for Uline S-12212 sheets
   */
  static async generateLabels(labelDataArray, options = {}) {
    console.log('🏷️ Starting FINAL ROTATED VIEW PDF generation...');
    console.log('📋 Label data array length:', labelDataArray.length);
    
    const {
      format = 'legal',
      orientation = 'portrait',
      debug = false,
      currentUser = 'Unknown'
    } = options;

    // Create PDF instance - PORTRAIT mode for Uline S-12212 compatibility
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

          // Draw the label positioned for final rotated view
          await this.drawLabelForRotatedView(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
      }

      console.log(`✅ Generated ${currentLabelIndex} labels across ${currentPage} pages`);

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-12212 Format Labels (Final Rotated View)',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v8.5.0',
        keywords: 'cannabis, inventory, labels, uline, s-12212, rotated-view, physical-rotation'
      });

      return pdf.output('blob');

    } catch (error) {
      console.error('❌ PDF generation error:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Draw label positioned for final rotated view (when paper is rotated 90° clockwise)
   */
  static async drawLabelForRotatedView(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    console.log(`🎨 Drawing label positioned for final rotated view...`);
    
    const { x, y, width, height } = position;

    try {
      // Draw label border
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(1);
      pdf.rect(x, y, width, height);

      // Position content for rotated view
      await this.positionContentForRotatedView(pdf, labelData, position, boxNumber, totalBoxes, currentUser, debug);
      
      console.log('✅ Rotated view positioning successful');

    } catch (error) {
      console.error('❌ Rotated view positioning failed:', error);
      
      // Emergency fallback
      pdf.setFontSize(12);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Error', x + 5, y + 20);
    }
  }

  /**
   * Position content for rotated view - when paper is rotated 90° clockwise
   * Portrait label (4" wide × 6" tall) becomes landscape (6" wide × 4" tall)
   */
  static async positionContentForRotatedView(pdf, labelData, position, boxNumber, totalBoxes, currentUser, debug) {
    console.log(`🎨 Positioning content for rotated view`);
    
    const { x, y, width, height } = position;
    
    // Extract brand info
    const brandInfo = this.extractBrandFromProductName(labelData.productName);
    
    // When rotated 90° clockwise:
    // - Portrait width (4") becomes rotated height 
    // - Portrait height (6") becomes rotated width
    
    // ROTATED VIEW ZONES (what user sees after rotating paper):
    // TOP of rotated view = RIGHT side of portrait PDF
    // MIDDLE of rotated view = CENTER of portrait PDF  
    // BOTTOM of rotated view = LEFT side of portrait PDF
    
    const padding = 15;
    
    // TOP ZONE (Brand + Product) - RIGHT side of portrait PDF
    const topZoneX = x + width - 120; // Right side of portrait label
    let topZoneY = y + padding + 30;
    
    // Brand Name - positioned to appear at top-left of rotated view
    if (brandInfo.brand) {
      const brandFontSize = Math.min(20, Math.max(14, 24 - Math.floor(brandInfo.brand.length / 4)));
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(brandFontSize);
      pdf.setTextColor(44, 85, 48); // Dark green
      
      // Text rotated 90° clockwise to read properly when paper is rotated
      pdf.text(brandInfo.brand, topZoneX, topZoneY, { angle: 90 });
      topZoneY += 80; // Move down for next element
    }
    
    // Product Name - multiple lines, positioned for rotated view
    const productFontSize = this.calculateOptimalFontSize(brandInfo.productName, 300, 18, 12);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(productFontSize);
    pdf.setTextColor(0, 0, 0);
    
    const productLines = this.wrapText(brandInfo.productName, 40, productFontSize);
    productLines.slice(0, 3).forEach((line, index) => {
      pdf.text(line, topZoneX, topZoneY + (index * 60), { angle: 90 });
    });
    
    // MIDDLE ZONE (Store) - CENTER of portrait PDF
    const storeZoneX = x + width / 2;
    const storeZoneY = y + padding + 30;
    
    // "Store:" label - positioned to appear above textbox in rotated view
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Store:', storeZoneX - 20, storeZoneY, { angle: 90 });
    
    // Store textbox - positioned for rotated view
    const storeBoxWidth = 160; // Will become height when rotated
    const storeBoxHeight = 40;  // Will become width when rotated
    const storeBoxX = storeZoneX - storeBoxHeight / 2;
    const storeBoxY = storeZoneY + 30;
    
    // Draw textbox
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(2);
    pdf.rect(storeBoxX, storeBoxY, storeBoxHeight, storeBoxWidth);
    
    // Writing lines in textbox
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    const lineSpacing = storeBoxWidth / 3;
    for (let i = 1; i < 3; i++) {
      const lineY = storeBoxY + (i * lineSpacing);
      pdf.line(storeBoxX + 3, lineY, storeBoxX + storeBoxHeight - 3, lineY);
    }
    
    // BOTTOM ZONE (Barcode | Dates | Case/Box) - LEFT side of portrait PDF
    const bottomZoneX = x + 80; // Left side of portrait label
    const bottomRowY = y + padding + 40;
    const columnSpacing = 130; // Spacing between columns in rotated view
    
    // Column 1: Barcode - positioned for rotated view
    let col1Y = bottomRowY;
    
    // Barcode numeric (appears above barcode in rotated view)
    const spacedBarcodeDisplay = this.formatBarcodeWithSpaces(labelData.barcodeDisplay);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(102, 102, 102);
    pdf.text(spacedBarcodeDisplay, bottomZoneX, col1Y, { angle: 90 });
    
    // Barcode image
    const barcodeWidth = 80;
    const barcodeHeight = 35;
    const barcodeX = bottomZoneX - barcodeHeight / 2;
    const barcodeY = col1Y + 15;
    
    await this.drawEnhancedBarcodeForRotatedView(pdf, labelData.barcode, barcodeX, barcodeY, barcodeHeight, barcodeWidth);
    
    // Column 2: Dates - positioned for rotated view  
    let col2Y = bottomRowY;
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Harvest:', bottomZoneX, col2Y + columnSpacing, { angle: 90 });
    
    col2Y += 15;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const harvestDate = labelData.harvestDate || 'MM/DD/YY';
    pdf.text(harvestDate, bottomZoneX, col2Y + columnSpacing, { angle: 90 });
    
    col2Y += 20;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Package:', bottomZoneX, col2Y + columnSpacing, { angle: 90 });
    
    col2Y += 15;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const packageDate = labelData.packagedDate || 'MM/DD/YY';
    pdf.text(packageDate, bottomZoneX, col2Y + columnSpacing, { angle: 90 });
    
    // Column 3: Case/Box with textboxes - positioned for rotated view
    let col3Y = bottomRowY;
    
    // Case textbox
    const caseBoxSize = 15;
    const caseBoxLength = 50;
    const caseBoxX = bottomZoneX - caseBoxSize / 2;
    const caseBoxY = col3Y + (columnSpacing * 2);
    
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(caseBoxX, caseBoxY, caseBoxSize, caseBoxLength);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    const caseQtyValue = labelData.caseQuantity || '___';
    pdf.text(`Case: ${caseQtyValue}`, bottomZoneX, caseBoxY + 30, { angle: 90 });
    
    col3Y += 35;
    
    // Box textbox
    const boxBoxX = bottomZoneX - caseBoxSize / 2;
    const boxBoxY = col3Y + (columnSpacing * 2);
    
    pdf.rect(boxBoxX, boxBoxY, caseBoxSize, caseBoxLength);
    
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    pdf.text(boxText, bottomZoneX, boxBoxY + 25, { angle: 90 });
    
    // Audit trail - positioned for bottom-left of rotated view
    const auditLine = this.generateAuditLine(currentUser);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(102, 102, 102);
    
    pdf.text(auditLine, bottomZoneX, y + height - 20, { angle: 90 });
    
    if (debug) {
      // Debug: Show positioning zones
      pdf.setDrawColor(255, 0, 0);
      pdf.setLineWidth(0.5);
      
      // TOP zone (right side)
      pdf.rect(x + width - 120, y, 120, height);
      
      // MIDDLE zone (center)  
      pdf.rect(x + width/2 - 40, y, 80, height);
      
      // BOTTOM zone (left side)
      pdf.rect(x, y, 120, height);
    }
    
    console.log('✅ Content positioned for rotated view');
  }

  /**
   * Draw barcode for rotated view
   */
  static async drawEnhancedBarcodeForRotatedView(pdf, barcodeValue, x, y, width, height) {
    if (!barcodeValue) return;

    try {
      const cleanBarcodeValue = barcodeValue.replace(/[^A-Za-z0-9]/g, '');
      
      const validation = BarcodeGenerator.validateCode39(cleanBarcodeValue);
      if (!validation.isValid) {
        console.warn('Invalid barcode:', validation.error);
        this.drawBarcodeErrorForRotatedView(pdf, x, y, width, height);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width * 2;
      canvas.height = height * 2;
      
      const JsBarcode = (await import('jsbarcode')).default;
      
      JsBarcode(canvas, validation.cleanValue, {
        format: 'CODE39',
        width: Math.max(2, Math.floor(width / 30)),
        height: height * 2,
        displayValue: false,
        margin: 0,
        background: '#ffffff',
        lineColor: '#000000'
      });

      const barcodeDataURL = canvas.toDataURL('image/png');
      
      // Add barcode rotated 90° for proper orientation when paper is rotated
      pdf.addImage(barcodeDataURL, 'PNG', x, y, width, height, undefined, 'NONE', 90);

    } catch (error) {
      console.error('Barcode generation error:', error);
      this.drawBarcodeErrorForRotatedView(pdf, x, y, width, height);
    }
  }

  /**
   * Draw barcode error for rotated view
   */
  static drawBarcodeErrorForRotatedView(pdf, x, y, width, height) {
    pdf.setDrawColor(255, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, y, width, height);
    
    pdf.setFontSize(7);
    pdf.setTextColor(255, 0, 0);
    pdf.text('Barcode Error', x + width/2, y + height/2, { angle: 90, align: 'center' });
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
      
      // Layout information
      row: row,
      col: col,
      labelIndex: labelIndex,
      
      // Method info
      method: 'final_rotated_view',
      approach: 'position_for_physical_rotation',
      rotation: 'none_in_pdf'
    };
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
   * Calculate optimal font size
   */
  static calculateOptimalFontSize(text, availableSpace, maxSize = 18, minSize = 10) {
    if (!text) return maxSize;
    
    const length = text.length;
    let fontSize = maxSize;
    
    // Simple length-based sizing
    if (length > 100) fontSize = Math.max(minSize, maxSize - 6);
    else if (length > 80) fontSize = Math.max(minSize, maxSize - 5);
    else if (length > 60) fontSize = Math.max(minSize, maxSize - 4);
    else if (length > 40) fontSize = Math.max(minSize, maxSize - 3);
    else if (length > 25) fontSize = Math.max(minSize, maxSize - 2);
    
    return fontSize;
  }

  /**
   * Simple text wrapping
   */
  static wrapText(text, maxLength, fontSize) {
    if (!text) return [''];
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      if (testLine.length <= maxLength || currentLine === '') {
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
   * Generate test PDF
   */
  static async generateTestPDF() {
    console.log('🧪 Generating FINAL ROTATED VIEW test PDF...');
    
    const testData = [
      {
        sku: 'CURALEAF-PINK-CHAMPAGNE',
        barcode: 'CUR19862332',
        barcodeDisplay: 'CUR-1986-2332',
        productName: 'Curaleaf Pink Champagne Premium Cannabis Capsules [10mg THC] 30-Count',
        enhancedData: {
          labelQuantity: 1,
          caseQuantity: '8',
          boxCount: '2',
          harvestDate: '04/20/25',
          packagedDate: '07/10/25'
        },
        user: 'TestUser'
      }
    ];

    return this.generateLabels(testData, { debug: false, currentUser: 'TestUser' });
  }

  // Legacy compatibility methods
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
      labelFormat: 'Uline S-12212 (Final Rotated View)',
      approach: 'Position for physical paper rotation - no PDF rotation',
      method: 'final_rotated_view',
      compatibility: 'Uline S-12212 label sheets'
    };
  }
}