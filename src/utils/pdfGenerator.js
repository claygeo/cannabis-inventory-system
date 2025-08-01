// SIMPLE VISUAL-FIRST PDF GENERATOR - Direct HTML Layout Replication
import { jsPDF } from 'jspdf';
import 'jspdf/dist/jspdf.es.min.js';

import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generation using Simple Visual-First approach
 * Directly replicate the HTML layout without complex coordinate math
 * Position elements exactly where they visually appear in the final result
 */
export class PDFGenerator {
  /**
   * Generate PDF with labels positioned for Uline S-12212 sheets
   */
  static async generateLabels(labelDataArray, options = {}) {
    console.log('🏷️ Starting SIMPLE VISUAL-FIRST PDF generation...');
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

          // Draw the label using SIMPLE VISUAL approach
          await this.drawLabelWithSimpleVisualApproach(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
      }

      console.log(`✅ Generated ${currentLabelIndex} labels across ${currentPage} pages`);

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-12212 Format Labels (Simple Visual-First)',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v8.5.0',
        keywords: 'cannabis, inventory, labels, uline, s-12212, simple-visual, direct-replication'
      });

      return pdf.output('blob');

    } catch (error) {
      console.error('❌ PDF generation error:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * SIMPLE VISUAL APPROACH: Draw exactly what the HTML shows
   */
  static async drawLabelWithSimpleVisualApproach(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    console.log(`🎨 Drawing label with SIMPLE VISUAL approach...`);
    
    const { x, y, width, height } = position;

    try {
      // Draw label border
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(1);
      pdf.rect(x, y, width, height);

      // Draw the content exactly as it appears in HTML
      await this.drawSimpleVisualContent(pdf, labelData, position, boxNumber, totalBoxes, currentUser, debug);
      
      console.log('✅ Simple visual approach successful');

    } catch (error) {
      console.error('❌ Simple visual approach failed:', error);
      
      // Emergency fallback
      pdf.setFontSize(12);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Error', x + 5, y + 20);
    }
  }

  /**
   * Draw content using simple visual positioning - replicate HTML exactly
   */
  static async drawSimpleVisualContent(pdf, labelData, position, boxNumber, totalBoxes, currentUser, debug) {
    console.log(`🎨 Drawing simple visual content - replicating HTML layout`);
    
    const { x, y, width, height } = position;
    
    // Extract brand info
    const brandInfo = this.extractBrandFromProductName(labelData.productName);
    
    // Simple visual zones (matching HTML percentages)
    const topZone = Math.floor(height * 0.35);      // 35% - Brand + Product
    const middleZone = Math.floor(height * 0.35);   // 35% - Store
    const bottomZone = height - topZone - middleZone; // 30% - Barcode/Dates/Case
    
    const padding = 15;
    
    // TOP ZONE: Brand + Product (centered horizontally when rotated)
    let currentTopY = y + padding + 25;
    
    // Brand Name - positioned to appear centered when paper is rotated
    if (brandInfo.brand) {
      const brandFontSize = Math.min(22, Math.max(16, 26 - Math.floor(brandInfo.brand.length / 4)));
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(brandFontSize);
      pdf.setTextColor(44, 85, 48); // Dark green
      
      // Position for horizontal centering when rotated 90° clockwise
      const brandX = x + width / 2;
      pdf.text(brandInfo.brand, brandX, currentTopY, { angle: 90, align: 'center' });
      
      currentTopY += brandFontSize + 10;
    }
    
    // Product Name - multi-line, centered
    const productFontSize = this.calculateOptimalFontSize(brandInfo.productName, height * 0.8, 24, 14);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(productFontSize);
    pdf.setTextColor(0, 0, 0);
    
    const productLines = this.wrapText(brandInfo.productName, height * 0.75, productFontSize);
    const productX = x + width / 2;
    
    productLines.slice(0, 3).forEach((line, index) => {
      pdf.text(line, productX, currentTopY + (index * (productFontSize + 3)), { 
        angle: 90, 
        align: 'center' 
      });
    });
    
    // MIDDLE ZONE: Store Label + Textbox
    const middleStartY = y + topZone + padding;
    
    // "Store:" label - positioned above textbox area
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    
    const storeLabelX = x + 30; // Left side positioning
    pdf.text('Store:', storeLabelX, middleStartY + 20, { angle: 90 });
    
    // Store textbox - centered horizontally, below label
    const boxWidth = Math.min(width * 0.7, 200);
    const boxHeight = 45;
    const boxX = x + (width - boxHeight) / 2; // Center the rotated box
    const boxY = middleStartY + 35;
    
    // Draw textbox (appears horizontal when rotated)
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(2);
    pdf.rect(boxX, boxY, boxHeight, boxWidth); // Swapped for rotation effect
    
    // Writing lines in textbox
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    const lineSpacing = boxWidth / 3;
    for (let i = 1; i < 3; i++) {
      const lineY = boxY + (i * lineSpacing);
      pdf.line(boxX + 4, lineY, boxX + boxHeight - 4, lineY);
    }
    
    // BOTTOM ZONE: Three columns (Barcode | Dates | Case/Box)
    const bottomStartY = y + topZone + middleZone + padding;
    const columnSpacing = width / 3;
    
    // Column 1: Barcode (left third)
    const col1X = x + columnSpacing * 0.5;
    
    // Barcode numeric (above barcode when rotated)
    const spacedBarcodeDisplay = this.formatBarcodeWithSpaces(labelData.barcodeDisplay);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(102, 102, 102);
    
    pdf.text(spacedBarcodeDisplay, col1X, bottomStartY + 15, { angle: 90, align: 'center' });
    
    // Barcode image
    const barcodeWidth = 100;
    const barcodeHeight = 40;
    const barcodeX = col1X - barcodeHeight / 2;
    const barcodeY = bottomStartY + 25;
    
    await this.drawEnhancedBarcodeSimple(pdf, labelData.barcode, barcodeX, barcodeY, barcodeHeight, barcodeWidth);
    
    // Column 2: Dates (center third)
    const col2X = x + columnSpacing * 1.5;
    
    let dateY = bottomStartY + 15;
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Harvest:', col2X, dateY, { angle: 90, align: 'center' });
    
    dateY += 16;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    const harvestDate = labelData.harvestDate || 'MM/DD/YY';
    pdf.text(harvestDate, col2X, dateY, { angle: 90, align: 'center' });
    
    dateY += 22;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Package:', col2X, dateY, { angle: 90, align: 'center' });
    
    dateY += 16;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    const packageDate = labelData.packagedDate || 'MM/DD/YY';
    pdf.text(packageDate, col2X, dateY, { angle: 90, align: 'center' });
    
    // Column 3: Case/Box (right third)
    const col3X = x + columnSpacing * 2.5;
    
    let caseY = bottomStartY + 15;
    
    // Case textbox
    const caseBoxSize = 18;
    const caseBoxX = col3X - caseBoxSize / 2;
    
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(caseBoxX, caseY - 2, caseBoxSize, 60); // Vertical box for rotation
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    const caseQtyValue = labelData.caseQuantity || '___';
    pdf.text(`Case: ${caseQtyValue}`, col3X, caseY + 25, { angle: 90, align: 'center' });
    
    caseY += 35;
    
    // Box textbox
    const boxBoxX = col3X - caseBoxSize / 2;
    pdf.rect(boxBoxX, caseY - 2, caseBoxSize, 60); // Vertical box for rotation
    
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    pdf.text(boxText, col3X, caseY + 25, { angle: 90, align: 'center' });
    
    // Audit trail (bottom-left corner)
    const auditLine = this.generateAuditLine(currentUser);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(102, 102, 102);
    
    pdf.text(auditLine, x + 20, y + height - 10, { angle: 90 });
    
    if (debug) {
      // Debug zones
      pdf.setDrawColor(255, 0, 0);
      pdf.setLineWidth(0.5);
      
      // Zone boundaries
      pdf.line(x, y + topZone, x + width, y + topZone); // Top zone
      pdf.line(x, y + topZone + middleZone, x + width, y + topZone + middleZone); // Middle zone
      
      // Column boundaries
      pdf.line(x + columnSpacing, y + topZone + middleZone, x + columnSpacing, y + height);
      pdf.line(x + columnSpacing * 2, y + topZone + middleZone, x + columnSpacing * 2, y + height);
    }
    
    console.log('✅ Simple visual content completed');
  }

  /**
   * Draw barcode using simple approach
   */
  static async drawEnhancedBarcodeSimple(pdf, barcodeValue, x, y, width, height) {
    if (!barcodeValue) return;

    try {
      const cleanBarcodeValue = barcodeValue.replace(/[^A-Za-z0-9]/g, '');
      
      const validation = BarcodeGenerator.validateCode39(cleanBarcodeValue);
      if (!validation.isValid) {
        console.warn('Invalid barcode:', validation.error);
        this.drawBarcodeErrorSimple(pdf, x, y, width, height);
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
      
      // Add barcode image rotated 90°
      pdf.addImage(barcodeDataURL, 'PNG', x, y, width, height, undefined, 'NONE', 90);

    } catch (error) {
      console.error('Barcode generation error:', error);
      this.drawBarcodeErrorSimple(pdf, x, y, width, height);
    }
  }

  /**
   * Draw barcode error placeholder
   */
  static drawBarcodeErrorSimple(pdf, x, y, width, height) {
    pdf.setDrawColor(255, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, y, width, height);
    
    pdf.setFontSize(8);
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
      method: 'simple_visual',
      approach: 'direct_html_replication',
      complexity: 'low'
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
   * Calculate optimal font size for available space
   */
  static calculateOptimalFontSize(text, availableSpace, maxSize = 24, minSize = 12) {
    if (!text) return maxSize;
    
    const length = text.length;
    let fontSize = maxSize;
    
    // Simple length-based sizing
    if (length > 100) fontSize = Math.max(minSize, maxSize - 10);
    else if (length > 80) fontSize = Math.max(minSize, maxSize - 8);
    else if (length > 60) fontSize = Math.max(minSize, maxSize - 6);
    else if (length > 40) fontSize = Math.max(minSize, maxSize - 4);
    else if (length > 25) fontSize = Math.max(minSize, maxSize - 2);
    
    return fontSize;
  }

  /**
   * Simple text wrapping
   */
  static wrapText(text, maxSpace, fontSize) {
    if (!text) return [''];
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    const maxCharsPerLine = Math.floor(maxSpace / (fontSize * 0.5));
    
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
   * Generate test PDF
   */
  static async generateTestPDF() {
    console.log('🧪 Generating SIMPLE VISUAL test PDF...');
    
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
      labelFormat: 'Uline S-12212 (Simple Visual-First)',
      approach: 'Direct HTML replication with simplified positioning',
      method: 'simple_visual_first',
      complexity: 'Low'
    };
  }
}