// ULINE S-12212 PDF GENERATOR - HTML Visual Layout Replication
import { jsPDF } from 'jspdf';
import 'jspdf/dist/jspdf.es.min.js';

import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generator for Uline S-12212 labels (4" × 6") 
 * Generates labels that match HTML visual layout exactly
 * Labels positioned for landscape orientation when applied to boxes
 */
export class PDFGenerator {
  /**
   * Generate PDF labels for Uline S-12212 sheets
   * @param {Array} labelDataArray - Array of label data objects
   * @param {Object} options - Generation options
   * @returns {Blob} - PDF blob
   */
  static async generateLabels(labelDataArray, options = {}) {
    console.log('🏷️ Starting Uline S-12212 PDF generation...');
    console.log('📋 Label data array length:', labelDataArray.length);
    
    const {
      format = 'legal',
      orientation = 'portrait',
      debug = false,
      currentUser = 'Unknown',
      startWithSingle = false // Start with single label for debugging
    } = options;

    // Create PDF instance - PORTRAIT mode for legal paper compatibility
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [612, 1008] // Legal size: 8.5" × 14"
    });

    console.log('📄 PDF instance created for Uline S-12212');

    let currentLabelIndex = 0;
    let currentPage = 1;
    const specs = this.getS12212Specs();

    try {
      // Process each label data item
      for (let dataIndex = 0; dataIndex < labelDataArray.length; dataIndex++) {
        const labelData = labelDataArray[dataIndex];
        console.log(`🏷️ Processing label data ${dataIndex + 1}/${labelDataArray.length}`);
        
        const formattedData = this.formatLabelDataForS12212(
          labelData,
          labelData.enhancedData || {},
          labelData.user || currentUser
        );

        // Generate the number of labels specified
        const labelsToGenerate = startWithSingle ? 1 : formattedData.labelQuantity;
        
        for (let labelCopy = 0; labelCopy < labelsToGenerate; labelCopy++) {
          console.log(`📄 Generating label copy ${labelCopy + 1}/${labelsToGenerate}`);
          
          // For single label debugging, center it on page
          if (startWithSingle) {
            const centerPosition = this.calculateSingleLabelCenterPosition();
            await this.drawS12212Label(pdf, formattedData, centerPosition, 1, 1, debug, currentUser);
            console.log('🧪 Single label generated for debugging');
            break;
          }
          
          // Check if we need a new page (4 labels per sheet)
          if (currentLabelIndex > 0 && currentLabelIndex % specs.LABELS_PER_SHEET === 0) {
            console.log('📄 Adding new page');
            pdf.addPage();
            currentPage++;
          }

          // Calculate position for connected labels (touching on all sides)
          const position = this.calculateS12212PositionConnected(currentLabelIndex % specs.LABELS_PER_SHEET);

          // Calculate which box number this label represents
          const boxNumber = Math.floor(labelCopy / Math.max(1, Math.floor(formattedData.labelQuantity / formattedData.boxCount))) + 1;

          // Draw the label matching HTML visual layout
          await this.drawS12212Label(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
        
        if (startWithSingle) break; // Only process first item in single mode
      }

      console.log(`✅ Generated ${currentLabelIndex} labels across ${currentPage} pages`);

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - Uline S-12212 - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-12212 Format Labels - HTML Visual Layout',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v8.6.0',
        keywords: 'cannabis, inventory, labels, uline, s-12212, html-visual-match'
      });

      return pdf.output('blob');

    } catch (error) {
      console.error('❌ PDF generation error:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Draw S-12212 label matching HTML visual layout exactly
   * @param {Object} pdf - jsPDF instance
   * @param {Object} labelData - Formatted label data
   * @param {Object} position - Label position
   * @param {number} boxNumber - Box number
   * @param {number} totalBoxes - Total boxes
   * @param {boolean} debug - Debug mode
   * @param {string} currentUser - Current user
   */
  static async drawS12212Label(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    console.log(`🎨 Drawing S-12212 label matching HTML visual...`);
    
    const { x, y, width, height } = position;

    try {
      // Draw label border
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(1);
      pdf.rect(x, y, width, height);

      // Draw content matching HTML visual layout
      await this.drawHTMLMatchingContent(pdf, labelData, position, boxNumber, totalBoxes, currentUser, debug);
      
      console.log('✅ HTML visual layout matched successfully');

    } catch (error) {
      console.error('❌ HTML layout matching failed:', error);
      
      // Emergency fallback
      pdf.setFontSize(12);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Error', x + 5, y + 20);
    }
  }

  /**
   * Draw content exactly matching the HTML visual layout
   * Layout: Brand (centered) → Product (large, centered) → Store → Bottom Row (Barcode | Dates | Case/Box)
   * @param {Object} pdf - jsPDF instance
   * @param {Object} labelData - Label data
   * @param {Object} position - Position
   * @param {number} boxNumber - Box number
   * @param {number} totalBoxes - Total boxes
   * @param {string} currentUser - User
   * @param {boolean} debug - Debug mode
   */
  static async drawHTMLMatchingContent(pdf, labelData, position, boxNumber, totalBoxes, currentUser, debug) {
    console.log(`🎨 Drawing HTML visual matching content`);
    
    const { x, y, width, height } = position;
    const padding = 15;
    
    // Extract brand info
    const brandInfo = this.extractBrandFromProductName(labelData.productName);
    
    // SECTION 1: BRAND NAME (centered, normal black color)
    let currentY = y + padding + 20;
    
    if (brandInfo.brand) {
      const brandFontSize = this.calculateBrandFontSize(brandInfo.brand);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(brandFontSize);
      pdf.setTextColor(0, 0, 0); // BLACK (not green as mentioned)
      
      // Center horizontally
      const brandWidth = pdf.getTextWidth(brandInfo.brand);
      const brandX = x + (width - brandWidth) / 2;
      
      pdf.text(brandInfo.brand, brandX, currentY);
      currentY += brandFontSize + 10;
    }
    
    // SECTION 2: PRODUCT NAME (large, centered, multiple lines)
    const productFontSize = this.calculateProductFontSize(brandInfo.productName, width - 30);
    const productLines = this.wrapTextToLines(brandInfo.productName, width - 30, productFontSize);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(productFontSize);
    pdf.setTextColor(0, 0, 0);
    
    // Center each line
    productLines.slice(0, 3).forEach((line, index) => {
      const lineWidth = pdf.getTextWidth(line);
      const lineX = x + (width - lineWidth) / 2;
      pdf.text(line, lineX, currentY + (index * (productFontSize + 5)));
    });
    
    currentY += (productLines.length * (productFontSize + 5)) + 15;
    
    // SECTION 3: STORE (centered label and textbox)
    const storeY = currentY;
    
    // "Store:" label - CENTERED
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    
    const storeLabelWidth = pdf.getTextWidth('Store:');
    const storeLabelX = x + (width - storeLabelWidth) / 2;
    pdf.text('Store:', storeLabelX, storeY);
    
    // Store textbox - CENTERED below label
    const storeBoxWidth = Math.min(250, width - 60);
    const storeBoxHeight = 40;
    const storeBoxX = x + (width - storeBoxWidth) / 2;
    const storeBoxY = storeY + 10;
    
    // Draw textbox with border
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(2);
    pdf.rect(storeBoxX, storeBoxY, storeBoxWidth, storeBoxHeight);
    
    // Add writing lines inside textbox
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    const lineSpacing = storeBoxHeight / 3;
    for (let i = 1; i < 3; i++) {
      const lineY = storeBoxY + (i * lineSpacing);
      pdf.line(storeBoxX + 5, lineY, storeBoxX + storeBoxWidth - 5, lineY);
    }
    
    currentY = storeBoxY + storeBoxHeight + 20;
    
    // SECTION 4: BOTTOM ROW (3 columns: Barcode | Dates | Case/Box)
    const bottomRowY = currentY;
    const bottomRowHeight = y + height - currentY - padding;
    const columnWidth = (width - (padding * 2)) / 3;
    
    // Column 1: BARCODE (left)
    const barcodeX = x + padding;
    await this.drawBarcodeColumn(pdf, labelData, barcodeX, bottomRowY, columnWidth, bottomRowHeight);
    
    // Column 2: DATES (center)
    const datesX = barcodeX + columnWidth;
    this.drawDatesColumn(pdf, labelData, datesX, bottomRowY, columnWidth, bottomRowHeight);
    
    // Column 3: CASE/BOX (right)
    const caseBoxX = datesX + columnWidth;
    this.drawCaseBoxColumn(pdf, labelData, boxNumber, totalBoxes, caseBoxX, bottomRowY, columnWidth, bottomRowHeight);
    
    // AUDIT TRAIL (bottom-left corner)
    const auditLine = this.generateAuditLine(currentUser);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(102, 102, 102);
    pdf.text(auditLine, x + padding, y + height - 10);
    
    if (debug) {
      this.drawDebugLines(pdf, position, {
        brandY: y + padding + 20,
        productY: brandInfo.brand ? y + padding + 50 : y + padding + 20,
        storeY: storeY,
        bottomRowY: bottomRowY
      });
    }
    
    console.log('✅ HTML visual content drawn successfully');
  }

  /**
   * Draw barcode column (left column)
   */
  static async drawBarcodeColumn(pdf, labelData, x, y, width, height) {
    const centerX = x + width / 2;
    
    // Barcode numeric display (above barcode)
    const spacedBarcodeDisplay = this.formatBarcodeWithSpaces(labelData.barcodeDisplay);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    
    const numericWidth = pdf.getTextWidth(spacedBarcodeDisplay);
    pdf.text(spacedBarcodeDisplay, centerX - numericWidth / 2, y + 15);
    
    // Barcode image
    const barcodeWidth = Math.min(width - 10, 80);
    const barcodeHeight = 35;
    const barcodeX = centerX - barcodeWidth / 2;
    const barcodeY = y + 25;
    
    await this.drawEnhancedBarcode(pdf, labelData.barcode, barcodeX, barcodeY, barcodeWidth, barcodeHeight);
  }

  /**
   * Draw dates column (center column)
   */
  static drawDatesColumn(pdf, labelData, x, y, width, height) {
    const centerX = x + width / 2;
    let textY = y + 15;
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    
    // Harvest date
    const harvestLabel = 'Harvest:';
    const harvestLabelWidth = pdf.getTextWidth(harvestLabel);
    pdf.text(harvestLabel, centerX - harvestLabelWidth / 2, textY);
    
    textY += 15;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const harvestDate = labelData.harvestDate || 'MM/DD/YY';
    const harvestDateWidth = pdf.getTextWidth(harvestDate);
    pdf.text(harvestDate, centerX - harvestDateWidth / 2, textY);
    
    textY += 20;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    
    // Package date
    const packageLabel = 'Package:';
    const packageLabelWidth = pdf.getTextWidth(packageLabel);
    pdf.text(packageLabel, centerX - packageLabelWidth / 2, textY);
    
    textY += 15;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const packageDate = labelData.packagedDate || 'MM/DD/YY';
    const packageDateWidth = pdf.getTextWidth(packageDate);
    pdf.text(packageDate, centerX - packageDateWidth / 2, textY);
  }

  /**
   * Draw case/box column (right column)
   */
  static drawCaseBoxColumn(pdf, labelData, boxNumber, totalBoxes, x, y, width, height) {
    const centerX = x + width / 2;
    let textY = y + 15;
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    
    // Case quantity with textbox
    const caseBoxWidth = 50;
    const caseBoxHeight = 20;
    const caseBoxX = centerX - caseBoxWidth / 2;
    
    // Draw textbox border
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1.5);
    pdf.rect(caseBoxX, textY, caseBoxWidth, caseBoxHeight);
    
    // Case label and value
    textY += 30;
    const caseText = `Case: ${labelData.caseQuantity || '___'}`;
    const caseTextWidth = pdf.getTextWidth(caseText);
    pdf.text(caseText, centerX - caseTextWidth / 2, textY);
    
    textY += 25;
    
    // Box quantity with textbox
    const boxBoxX = centerX - caseBoxWidth / 2;
    pdf.rect(boxBoxX, textY, caseBoxWidth, caseBoxHeight);
    
    textY += 30;
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    const boxTextWidth = pdf.getTextWidth(boxText);
    pdf.text(boxText, centerX - boxTextWidth / 2, textY);
  }

  /**
   * Draw enhanced barcode
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
        width: Math.max(2, Math.floor(width / 25)),
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
    const errorText = 'Barcode Error';
    const textWidth = pdf.getTextWidth(errorText);
    pdf.text(errorText, x + (width - textWidth) / 2, y + height / 2);
  }

  /**
   * Calculate S-12212 label position for connected labels (touching on all sides)
   */
  static calculateS12212PositionConnected(labelIndex) {
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
      method: 'html_visual_match',
      approach: 'connected_labels_s12212',
      format: 'Uline S-12212'
    };
  }

  /**
   * Calculate position for single label centered on page (for debugging)
   */
  static calculateSingleLabelCenterPosition() {
    const pageWidth = 612;
    const pageHeight = 1008;
    const labelWidth = 288;  // 4"
    const labelHeight = 432; // 6"
    
    return {
      x: (pageWidth - labelWidth) / 2,
      y: (pageHeight - labelHeight) / 2,
      width: labelWidth,
      height: labelHeight,
      method: 'single_label_debug',
      centered: true
    };
  }

  /**
   * Format label data for S-12212 layout
   */
  static formatLabelDataForS12212(item, enhancedData, username) {
    const timestamp = new Date();
    
    // Extract brand information
    const brandInfo = this.extractBrandFromProductName(item.productName);
    
    return {
      // Product information
      productName: item.productName || 'Product Name',
      originalProductName: item.productName,
      sku: item.sku || '',
      barcode: item.barcode || item.sku || this.generateFallbackBarcode(item),
      brand: brandInfo.brand || item.brand || '',
      
      // Enhanced data
      labelQuantity: Math.max(1, parseInt(enhancedData?.labelQuantity || '1')),
      caseQuantity: enhancedData?.caseQuantity || '',
      boxCount: Math.max(1, parseInt(enhancedData?.boxCount || '1')),
      harvestDate: this.formatDate(enhancedData?.harvestDate),
      packagedDate: this.formatDate(enhancedData?.packagedDate),
      
      // Display formats
      barcodeDisplay: this.formatBarcodeDisplay(item.barcode || item.sku || ''),
      
      // Audit information
      username: username || 'Unknown',
      timestamp,
      
      // Source information
      source: item.source || 'Unknown',
      displaySource: item.displaySource || '[UNK]'
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
   * Calculate optimal brand font size
   */
  static calculateBrandFontSize(brandText) {
    if (!brandText) return 16;
    
    const length = brandText.length;
    if (length <= 8) return 20;
    if (length <= 12) return 18;
    if (length <= 16) return 16;
    if (length <= 20) return 14;
    return 12;
  }

  /**
   * Calculate optimal product font size
   */
  static calculateProductFontSize(productText, availableWidth) {
    if (!productText) return 24;
    
    const length = productText.length;
    let fontSize = 24;
    
    // Adjust based on length
    if (length > 80) fontSize = 14;
    else if (length > 60) fontSize = 16;
    else if (length > 40) fontSize = 18;
    else if (length > 25) fontSize = 20;
    else if (length > 15) fontSize = 22;
    
    return Math.max(fontSize, 12);
  }

  /**
   * Wrap text to fit within specified width
   */
  static wrapTextToLines(text, maxWidth, fontSize) {
    if (!text) return [''];
    
    // Estimate character width (rough approximation)
    const avgCharWidth = fontSize * 0.6;
    const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth);
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
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
   * Format barcode display with spaces
   */
  static formatBarcodeWithSpaces(barcodeDisplay) {
    if (!barcodeDisplay) return '';
    return barcodeDisplay.replace(/-/g, ' ');
  }

  /**
   * Format barcode for display
   */
  static formatBarcodeDisplay(barcode) {
    if (!barcode) return '';
    
    const clean = barcode.replace(/[^A-Za-z0-9]/g, '');
    
    if (clean.length <= 6) {
      return clean.replace(/(.{2})/g, '$1-').replace(/-$/, '');
    } else if (clean.length <= 12) {
      return clean.replace(/(.{3})/g, '$1-').replace(/-$/, '');
    } else {
      return clean.replace(/(.{4})/g, '$1-').replace(/-$/, '');
    }
  }

  /**
   * Format date string
   */
  static formatDate(dateStr) {
    if (!dateStr) return '';
    
    const cleaned = dateStr.toString().replace(/[^\d\/\-]/g, '');
    
    // Convert to MM/DD/YY format
    const formats = [
      { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, format: (m, d, y) => `${m.padStart(2, '0')}/${d.padStart(2, '0')}/${y.slice(-2)}` },
      { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/, format: (m, d, y) => `${m.padStart(2, '0')}/${d.padStart(2, '0')}/${y}` },
      { regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, format: (m, d, y) => `${m.padStart(2, '0')}/${d.padStart(2, '0')}/${y.slice(-2)}` },
      { regex: /^(\d{1,2})-(\d{1,2})-(\d{2})$/, format: (m, d, y) => `${m.padStart(2, '0')}/${d.padStart(2, '0')}/${y}` },
      { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, format: (y, m, d) => `${m.padStart(2, '0')}/${d.padStart(2, '0')}/${y.slice(-2)}` },
    ];
    
    for (const format of formats) {
      if (format.regex.test(cleaned)) {
        if (typeof format.format === 'function') {
          const match = cleaned.match(format.regex);
          return format.format(...match.slice(1));
        }
      }
    }
    
    return cleaned.replace(/-/g, '/');
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
   * Generate fallback barcode
   */
  static generateFallbackBarcode(item) {
    const base = item.sku || item.productName || 'UNKNOWN';
    const clean = base.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const truncated = clean.substring(0, 10);
    const timestamp = Date.now().toString().slice(-4);
    return truncated + timestamp;
  }

  /**
   * Draw debug lines
   */
  static drawDebugLines(pdf, position, sections) {
    const { x, y, width, height } = position;
    
    pdf.setDrawColor(255, 0, 0);
    pdf.setLineWidth(0.5);
    
    // Section dividers
    if (sections.brandY) {
      pdf.line(x, sections.brandY, x + width, sections.brandY);
    }
    if (sections.productY) {
      pdf.line(x, sections.productY, x + width, sections.productY);
    }
    if (sections.storeY) {
      pdf.line(x, sections.storeY, x + width, sections.storeY);
    }
    if (sections.bottomRowY) {
      pdf.line(x, sections.bottomRowY, x + width, sections.bottomRowY);
    }
    
    // Column dividers
    const columnWidth = width / 3;
    pdf.line(x + columnWidth, sections.bottomRowY, x + columnWidth, y + height);
    pdf.line(x + (columnWidth * 2), sections.bottomRowY, x + (columnWidth * 2), y + height);
  }

  /**
   * Get S-12212 specifications
   */
  static getS12212Specs() {
    return {
      WIDTH_INCHES: 4,
      HEIGHT_INCHES: 6,
      LABELS_PER_SHEET: 4,
      SHEET_WIDTH: 8.5,
      SHEET_HEIGHT: 14,
      ORIENTATION: 'portrait',
      FORMAT: 'S-12212',
      LAYOUT: 'html_visual_match',
      
      // Dimensions in points
      LABEL_WIDTH_PT: 288,  // 4" × 72
      LABEL_HEIGHT_PT: 432, // 6" × 72
      PAGE_WIDTH_PT: 612,   // 8.5" × 72
      PAGE_HEIGHT_PT: 1008  // 14" × 72
    };
  }

  /**
   * Generate test PDF (single label for debugging)
   */
  static async generateTestPDF() {
    console.log('🧪 Generating S-12212 test PDF (single label)...');
    
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

    return this.generateLabels(testData, { 
      debug: true, 
      currentUser: 'TestUser', 
      startWithSingle: true 
    });
  }

  /**
   * Generate full sheet test PDF (4 connected labels)
   */
  static async generateFullSheetTestPDF() {
    console.log('🧪 Generating S-12212 full sheet test PDF...');
    
    const testData = [
      {
        sku: 'CURALEAF-PINK-CHAMPAGNE',
        barcode: 'CUR19862332',
        barcodeDisplay: 'CUR-1986-2332',
        productName: 'Curaleaf Pink Champagne Premium Cannabis Capsules [10mg THC] 30-Count',
        enhancedData: {
          labelQuantity: 4,
          caseQuantity: '8',
          boxCount: '2',
          harvestDate: '04/20/25',
          packagedDate: '07/10/25'
        },
        user: 'TestUser'
      }
    ];

    return this.generateLabels(testData, { 
      debug: false, 
      currentUser: 'TestUser'
    });
  }

  // Legacy compatibility methods
  static calculateUlineLabelPosition(labelIndex) {
    return this.calculateS12212PositionConnected(labelIndex % 4);
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
      labelFormat: 'Uline S-12212 (HTML Visual Match)',
      approach: 'Connected labels matching HTML visual layout exactly',
      method: 'html_visual_match',
      compatibility: 'Uline S-12212 label sheets on legal paper'
    };
  }
}