// ULINE S-12212 PDF GENERATOR - LANDSCAPE CONTENT ORIENTATION
import { jsPDF } from 'jspdf';
import 'jspdf/dist/jspdf.es.min.js';

import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generator for Uline S-12212 labels with LANDSCAPE CONTENT ORIENTATION
 * Content rotated/positioned for landscape application on boxes
 * Matches HTML visual layout exactly when labels are applied in landscape
 */
export class PDFGenerator {
  /**
   * Generate PDF labels with landscape-oriented content for Uline S-12212 sheets
   * @param {Array} labelDataArray - Array of label data objects
   * @param {Object} options - Generation options
   * @returns {Blob} - PDF blob
   */
  static async generateLabels(labelDataArray, options = {}) {
    console.log('🏷️ Starting Uline S-12212 PDF generation with LANDSCAPE CONTENT...');
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

    console.log('📄 PDF instance created for Uline S-12212 with landscape content');

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
            await this.drawS12212LabelLandscapeContent(pdf, formattedData, centerPosition, 1, 1, debug, currentUser);
            console.log('🧪 Single label with landscape content generated for debugging');
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

          // Draw the label with landscape-oriented content
          await this.drawS12212LabelLandscapeContent(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
        
        if (startWithSingle) break; // Only process first item in single mode
      }

      console.log(`✅ Generated ${currentLabelIndex} labels with landscape content across ${currentPage} pages`);

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - Uline S-12212 Landscape - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-12212 Format Labels - Landscape Content Orientation',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v8.7.0',
        keywords: 'cannabis, inventory, labels, uline, s-12212, landscape-content, rotated-layout'
      });

      return pdf.output('blob');

    } catch (error) {
      console.error('❌ PDF generation error:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Draw S-12212 label with LANDSCAPE CONTENT ORIENTATION
   * Content positioned/rotated to match HTML visual when applied in landscape
   * @param {Object} pdf - jsPDF instance
   * @param {Object} labelData - Formatted label data
   * @param {Object} position - Label position
   * @param {number} boxNumber - Box number
   * @param {number} totalBoxes - Total boxes
   * @param {boolean} debug - Debug mode
   * @param {string} currentUser - Current user
   */
  static async drawS12212LabelLandscapeContent(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    console.log(`🎨 Drawing S-12212 label with LANDSCAPE CONTENT ORIENTATION...`);
    
    const { x, y, width, height } = position;

    try {
      // Draw label border
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(1);
      pdf.rect(x, y, width, height);

      // Draw landscape-oriented content matching HTML visual
      await this.drawLandscapeOrientedContent(pdf, labelData, position, boxNumber, totalBoxes, currentUser, debug);
      
      console.log('✅ Landscape content orientation applied successfully');

    } catch (error) {
      console.error('❌ Landscape content orientation failed:', error);
      
      // Emergency fallback
      pdf.setFontSize(12);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Error', x + 5, y + 20);
    }
  }

  /**
   * Draw content in LANDSCAPE ORIENTATION to match HTML visual
   * When labels are applied to boxes in landscape, content reads correctly
   * Transform coordinates and rotate text for landscape application
   * @param {Object} pdf - jsPDF instance
   * @param {Object} labelData - Label data
   * @param {Object} position - Position
   * @param {number} boxNumber - Box number
   * @param {number} totalBoxes - Total boxes
   * @param {string} currentUser - User
   * @param {boolean} debug - Debug mode
   */
  static async drawLandscapeOrientedContent(pdf, labelData, position, boxNumber, totalBoxes, currentUser, debug) {
    console.log(`🎨 Drawing LANDSCAPE-ORIENTED content matching HTML visual`);
    
    const { x, y, width, height } = position;
    const padding = 15;
    
    // Extract brand info
    const brandInfo = this.extractBrandFromProductName(labelData.productName);
    
    // LANDSCAPE LAYOUT ZONES (when label is applied in landscape orientation):
    // Portrait PDF: 4" wide × 6" tall → Landscape Application: 6" wide × 4" tall
    // 
    // LEFT SIDE of portrait PDF = TOP of landscape application
    // CENTER of portrait PDF = CENTER of landscape application  
    // RIGHT SIDE of portrait PDF = BOTTOM of landscape application
    
    // ZONE 1: BRAND NAME (appears at TOP-LEFT in landscape - LEFT side of portrait PDF)
    if (brandInfo.brand) {
      const brandFontSize = this.calculateBrandFontSize(brandInfo.brand);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(brandFontSize);
      pdf.setTextColor(0, 0, 0); // BLACK color as specified
      
      // Position for landscape application: brand at top-left
      const brandX = x + padding;
      const brandY = y + padding + brandFontSize;
      
      // Rotate text 90° clockwise for landscape reading
      pdf.text(brandInfo.brand, brandX, brandY, { angle: 90 });
    }
    
    // ZONE 2: PRODUCT NAME (appears at TOP-CENTER in landscape - LEFT-CENTER of portrait PDF)
    const productStartX = x + padding + 60; // Space for brand
    const productStartY = y + padding + 20;
    
    const productFontSize = this.calculateLandscapeProductFontSize(brandInfo.productName);
    const productLines = this.wrapTextForLandscape(brandInfo.productName, 280, productFontSize);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(productFontSize);
    pdf.setTextColor(0, 0, 0);
    
    // Rotate product name lines 90° clockwise for landscape reading
    productLines.slice(0, 3).forEach((line, index) => {
      const lineY = productStartY + (index * (productFontSize + 8));
      pdf.text(line, productStartX, lineY, { angle: 90 });
    });
    
    // ZONE 3: STORE SECTION (appears at CENTER-LEFT in landscape - CENTER-LEFT of portrait PDF)
    const storeX = x + padding + 140;
    const storeY = y + padding + 30;
    
    // "Store:" label rotated for landscape reading
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Store:', storeX, storeY, { angle: 90 });
    
    // Store textbox positioned for landscape orientation
    const storeBoxWidth = 40;  // Will become height in landscape
    const storeBoxHeight = 120; // Will become width in landscape
    const storeBoxX = storeX - 15;
    const storeBoxY = storeY + 20;
    
    // Draw textbox
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(2);
    pdf.rect(storeBoxX, storeBoxY, storeBoxWidth, storeBoxHeight);
    
    // Writing lines in textbox (horizontal lines for landscape use)
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    const lineSpacing = storeBoxHeight / 4;
    for (let i = 1; i < 4; i++) {
      const lineY = storeBoxY + (i * lineSpacing);
      pdf.line(storeBoxX + 3, lineY, storeBoxX + storeBoxWidth - 3, lineY);
    }
    
    // ZONE 4: BOTTOM ROW FOR LANDSCAPE (appears at BOTTOM in landscape - RIGHT side of portrait PDF)
    const bottomZoneX = x + width - 120; // Right side of portrait PDF
    const bottomZoneStartY = y + padding + 30;
    
    // BARCODE SECTION (rotated for landscape reading)
    let currentBottomY = bottomZoneStartY;
    
    // Barcode numeric (rotated 90° for landscape reading)
    const spacedBarcodeDisplay = this.formatBarcodeWithSpaces(labelData.barcodeDisplay);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text(spacedBarcodeDisplay, bottomZoneX, currentBottomY, { angle: 90 });
    
    // Barcode image (rotated for landscape orientation)
    const barcodeWidth = 35;  // Will become height in landscape
    const barcodeHeight = 80; // Will become width in landscape
    const barcodeX = bottomZoneX - 20;
    const barcodeY = currentBottomY + 20;
    
    await this.drawLandscapeBarcode(pdf, labelData.barcode, barcodeX, barcodeY, barcodeWidth, barcodeHeight);
    
    currentBottomY += 120;
    
    // DATES SECTION (rotated for landscape reading)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    
    // Harvest date
    pdf.text('Harvest:', bottomZoneX, currentBottomY, { angle: 90 });
    currentBottomY += 15;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const harvestDate = labelData.harvestDate || 'MM/DD/YY';
    pdf.text(harvestDate, bottomZoneX, currentBottomY, { angle: 90 });
    currentBottomY += 25;
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Package:', bottomZoneX, currentBottomY, { angle: 90 });
    currentBottomY += 15;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const packageDate = labelData.packagedDate || 'MM/DD/YY';
    pdf.text(packageDate, bottomZoneX, currentBottomY, { angle: 90 });
    currentBottomY += 30;
    
    // CASE/BOX SECTION (rotated for landscape reading)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    
    // Case textbox (positioned for landscape orientation)
    const caseBoxWidth = 15;
    const caseBoxHeight = 40;
    const caseBoxX = bottomZoneX - 10;
    const caseBoxY = currentBottomY;
    
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1.5);
    pdf.rect(caseBoxX, caseBoxY, caseBoxWidth, caseBoxHeight);
    
    // Case label and value (rotated)
    const caseText = `Case: ${labelData.caseQuantity || '___'}`;
    pdf.text(caseText, bottomZoneX, caseBoxY + 50, { angle: 90 });
    
    currentBottomY += 70;
    
    // Box textbox (positioned for landscape orientation)
    const boxBoxX = bottomZoneX - 10;
    const boxBoxY = currentBottomY;
    
    pdf.rect(boxBoxX, boxBoxY, caseBoxWidth, caseBoxHeight);
    
    // Box label and value (rotated)
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    pdf.text(boxText, bottomZoneX, boxBoxY + 50, { angle: 90 });
    
    // AUDIT TRAIL (positioned for bottom-left in landscape - bottom-left of portrait)
    const auditLine = this.generateAuditLine(currentUser);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(102, 102, 102);
    pdf.text(auditLine, x + padding, y + height - 10);
    
    if (debug) {
      this.drawLandscapeDebugLines(pdf, position, {
        brandZone: x + padding,
        productZone: productStartX,
        storeZone: storeX,
        bottomZone: bottomZoneX
      });
    }
    
    console.log('✅ Landscape-oriented content positioned successfully');
  }

  /**
   * Draw barcode rotated for landscape orientation
   */
  static async drawLandscapeBarcode(pdf, barcodeValue, x, y, width, height) {
    if (!barcodeValue) return;

    try {
      const cleanBarcodeValue = barcodeValue.replace(/[^A-Za-z0-9]/g, '');
      
      const validation = BarcodeGenerator.validateCode39(cleanBarcodeValue);
      if (!validation.isValid) {
        console.warn('Invalid barcode:', validation.error);
        this.drawLandscapeBarcodeError(pdf, x, y, width, height);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = height * 2; // Swapped for rotation
      canvas.height = width * 2;  // Swapped for rotation
      
      const JsBarcode = (await import('jsbarcode')).default;
      
      JsBarcode(canvas, validation.cleanValue, {
        format: 'CODE39',
        width: Math.max(2, Math.floor(height / 25)), // Adjusted for rotation
        height: width * 2,
        displayValue: false,
        margin: 0,
        background: '#ffffff',
        lineColor: '#000000'
      });

      const barcodeDataURL = canvas.toDataURL('image/png');
      
      // Add barcode rotated 90° for landscape orientation
      pdf.addImage(barcodeDataURL, 'PNG', x, y, width, height, undefined, 'NONE', 90);

    } catch (error) {
      console.error('Landscape barcode generation error:', error);
      this.drawLandscapeBarcodeError(pdf, x, y, width, height);
    }
  }

  /**
   * Draw barcode error for landscape orientation
   */
  static drawLandscapeBarcodeError(pdf, x, y, width, height) {
    pdf.setDrawColor(255, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, y, width, height);
    
    pdf.setFontSize(7);
    pdf.setTextColor(255, 0, 0);
    pdf.text('Barcode Error', x, y + height/2, { angle: 90 });
  }

  /**
   * Calculate font size for landscape product names
   */
  static calculateLandscapeProductFontSize(productText) {
    if (!productText) return 24;
    
    const length = productText.length;
    let fontSize = 28; // Larger starting size for landscape
    
    // Adjust based on length for landscape reading
    if (length > 80) fontSize = 16;
    else if (length > 60) fontSize = 18;
    else if (length > 40) fontSize = 20;
    else if (length > 25) fontSize = 24;
    else if (length > 15) fontSize = 26;
    
    return Math.max(fontSize, 14);
  }

  /**
   * Wrap text optimized for landscape orientation
   */
  static wrapTextForLandscape(text, maxWidth, fontSize) {
    if (!text) return [''];
    
    // For landscape orientation, optimize line breaks differently
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
   * Draw debug lines for landscape orientation
   */
  static drawLandscapeDebugLines(pdf, position, zones) {
    const { x, y, width, height } = position;
    
    pdf.setDrawColor(255, 0, 0);
    pdf.setLineWidth(0.5);
    
    // Vertical zone dividers for landscape layout
    if (zones.brandZone) {
      pdf.line(zones.brandZone, y, zones.brandZone, y + height);
    }
    if (zones.productZone) {
      pdf.line(zones.productZone, y, zones.productZone, y + height);
    }
    if (zones.storeZone) {
      pdf.line(zones.storeZone, y, zones.storeZone, y + height);
    }
    if (zones.bottomZone) {
      pdf.line(zones.bottomZone, y, zones.bottomZone, y + height);
    }
    
    // Add zone labels for debugging
    pdf.setFontSize(8);
    pdf.setTextColor(255, 0, 0);
    pdf.text('BRAND', zones.brandZone + 5, y + 15);
    pdf.text('PRODUCT', zones.productZone + 5, y + 15);
    pdf.text('STORE', zones.storeZone + 5, y + 15);
    pdf.text('BOTTOM', zones.bottomZone + 5, y + 15);
  }

  // ============================================================================
  // UTILITY METHODS (same as before but optimized for landscape)
  // ============================================================================

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
      method: 'landscape_content_orientation',
      approach: 'connected_labels_s12212_landscape',
      format: 'Uline S-12212',
      contentOrientation: 'landscape'
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
      method: 'single_label_landscape_debug',
      centered: true,
      contentOrientation: 'landscape'
    };
  }

  /**
   * Format label data for S-12212 landscape layout
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
      displaySource: item.displaySource || '[UNK]',
      
      // Landscape orientation info
      landscapeOriented: true,
      contentRotation: 90
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
   * Calculate optimal brand font size for landscape
   */
  static calculateBrandFontSize(brandText) {
    if (!brandText) return 16;
    
    const length = brandText.length;
    if (length <= 8) return 22;
    if (length <= 12) return 20;
    if (length <= 16) return 18;
    if (length <= 20) return 16;
    return 14;
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
   * Get S-12212 specifications for landscape content
   */
  static getS12212Specs() {
    return {
      WIDTH_INCHES: 4,
      HEIGHT_INCHES: 6,
      LABELS_PER_SHEET: 4,
      SHEET_WIDTH: 8.5,
      SHEET_HEIGHT: 14,
      ORIENTATION: 'portrait_pdf_landscape_content',
      CONTENT_ORIENTATION: 'landscape',
      FORMAT: 'S-12212',
      LAYOUT: 'landscape_content_match_html_visual',
      
      // Dimensions in points
      LABEL_WIDTH_PT: 288,  // 4" × 72
      LABEL_HEIGHT_PT: 432, // 6" × 72
      PAGE_WIDTH_PT: 612,   // 8.5" × 72
      PAGE_HEIGHT_PT: 1008  // 14" × 72
    };
  }

  /**
   * Generate test PDF (single label for debugging landscape content)
   */
  static async generateTestPDF() {
    console.log('🧪 Generating S-12212 test PDF (single label with LANDSCAPE CONTENT)...');
    
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
   * Generate full sheet test PDF (4 connected labels with landscape content)
   */
  static async generateFullSheetTestPDF() {
    console.log('🧪 Generating S-12212 full sheet test PDF (LANDSCAPE CONTENT)...');
    
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
      labelFormat: 'Uline S-12212 (Landscape Content Orientation)',
      approach: 'Connected labels with landscape-oriented content matching HTML visual',
      method: 'landscape_content_orientation',
      compatibility: 'Uline S-12212 label sheets on legal paper',
      contentOrientation: 'Rotated for landscape application on boxes'
    };
  }
}