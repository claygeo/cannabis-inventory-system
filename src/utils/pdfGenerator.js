// ULINE S-12212 PDF GENERATOR - EXACT HTML VISUAL LAYOUT MATCH
import { jsPDF } from 'jspdf';
import 'jspdf/dist/jspdf.es.min.js';

import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generator for Uline S-12212 labels 
 * Creates labels that match HTML visual layout EXACTLY
 * Portrait PDF (4" × 6") positioned for landscape application (6" × 4")
 */
export class PDFGenerator {
  /**
   * Generate PDF labels matching HTML visual layout exactly
   * @param {Array} labelDataArray - Array of label data objects
   * @param {Object} options - Generation options
   * @returns {Blob} - PDF blob
   */
  static async generateLabels(labelDataArray, options = {}) {
    console.log('🏷️ Starting Uline S-12212 PDF generation - HTML VISUAL MATCH...');
    console.log('📋 Label data array length:', labelDataArray.length);
    
    const {
      format = 'legal',
      orientation = 'portrait',
      debug = false,
      currentUser = 'Unknown',
      startWithSingle = false
    } = options;

    // Create PDF instance - PORTRAIT mode for legal paper
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [612, 1008] // Legal size: 8.5" × 14"
    });

    console.log('📄 PDF instance created for HTML visual match');

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

        // Generate labels
        const labelsToGenerate = startWithSingle ? 1 : formattedData.labelQuantity;
        
        for (let labelCopy = 0; labelCopy < labelsToGenerate; labelCopy++) {
          console.log(`📄 Generating label copy ${labelCopy + 1}/${labelsToGenerate}`);
          
          // For single label debugging, center it on page
          if (startWithSingle) {
            const centerPosition = this.calculateSingleLabelCenterPosition();
            await this.drawHTMLVisualMatchLabel(pdf, formattedData, centerPosition, 1, 1, debug, currentUser);
            console.log('🧪 Single HTML visual match label generated');
            break;
          }
          
          // Check if we need a new page (4 labels per sheet)
          if (currentLabelIndex > 0 && currentLabelIndex % specs.LABELS_PER_SHEET === 0) {
            console.log('📄 Adding new page');
            pdf.addPage();
            currentPage++;
          }

          // Calculate position for connected labels
          const position = this.calculateS12212PositionConnected(currentLabelIndex % specs.LABELS_PER_SHEET);

          // Calculate box number
          const boxNumber = Math.floor(labelCopy / Math.max(1, Math.floor(formattedData.labelQuantity / formattedData.boxCount))) + 1;

          // Draw label matching HTML visual exactly
          await this.drawHTMLVisualMatchLabel(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
        
        if (startWithSingle) break;
      }

      console.log(`✅ Generated ${currentLabelIndex} HTML visual match labels across ${currentPage} pages`);

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - HTML Visual Match - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-12212 Labels - Exact HTML Visual Layout',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v8.8.0',
        keywords: 'cannabis, inventory, labels, uline, s-12212, html-visual-exact-match'
      });

      return pdf.output('blob');

    } catch (error) {
      console.error('❌ PDF generation error:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Draw label matching HTML visual layout EXACTLY
   * Layout positioned for landscape application to match HTML visual
   * @param {Object} pdf - jsPDF instance
   * @param {Object} labelData - Formatted label data
   * @param {Object} position - Label position
   * @param {number} boxNumber - Box number
   * @param {number} totalBoxes - Total boxes
   * @param {boolean} debug - Debug mode
   * @param {string} currentUser - Current user
   */
  static async drawHTMLVisualMatchLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    console.log(`🎨 Drawing HTML visual match label...`);
    
    const { x, y, width, height } = position;

    try {
      // Draw label border
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(1);
      pdf.rect(x, y, width, height);

      // Draw content matching HTML visual exactly
      await this.drawHTMLVisualContent(pdf, labelData, position, boxNumber, totalBoxes, currentUser, debug);
      
      console.log('✅ HTML visual content drawn successfully');

    } catch (error) {
      console.error('❌ HTML visual content failed:', error);
      
      // Emergency fallback
      pdf.setFontSize(12);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Error', x + 10, y + 30);
    }
  }

  /**
   * Draw content exactly matching HTML visual layout
   * Portrait PDF positioned for landscape application
   * HTML Visual Layout:
   * - Brand (centered top)
   * - Product Name (large, centered, multi-line)  
   * - Store section (centered with textbox)
   * - Bottom row: Barcode | Dates | Case/Box
   * - Audit trail (bottom-left)
   */
  static async drawHTMLVisualContent(pdf, labelData, position, boxNumber, totalBoxes, currentUser, debug) {
    console.log(`🎨 Drawing HTML visual content structure`);
    
    const { x, y, width, height } = position;
    const padding = 15;
    
    // Extract brand info
    const brandInfo = this.extractBrandFromProductName(labelData.productName);
    
    // For landscape application (6" wide × 4" tall), content must be positioned
    // in portrait PDF (4" wide × 6" tall) and then rotated 90° clockwise
    
    // Save the graphics state
    pdf.saveGraphicsState();
    
    // Transform coordinate system: rotate 90° clockwise around label center
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    
    // Apply rotation transformation
    pdf.setCurrentTransformationMatrix(
      Math.cos(Math.PI / 2),   // cos(90°) = 0
      Math.sin(Math.PI / 2),   // sin(90°) = 1  
      -Math.sin(Math.PI / 2),  // -sin(90°) = -1
      Math.cos(Math.PI / 2),   // cos(90°) = 0
      centerX - centerY,       // translation x
      centerY + centerX        // translation y
    );
    
    // Now draw in the rotated coordinate system
    // After rotation: width and height are swapped for our drawing
    const rotatedWidth = height;  // 6" (432pt) wide in landscape
    const rotatedHeight = width;  // 4" (288pt) tall in landscape
    const rotatedX = -rotatedWidth / 2;
    const rotatedY = -rotatedHeight / 2;
    
    // SECTION 1: BRAND NAME (centered at top)
    let currentY = rotatedY + padding + 25;
    
    if (brandInfo.brand) {
      const brandFontSize = this.calculateBrandFontSize(brandInfo.brand);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(brandFontSize);
      pdf.setTextColor(0, 0, 0);
      
      // Center brand name horizontally
      const brandWidth = pdf.getTextWidth(brandInfo.brand);
      const brandX = rotatedX + (rotatedWidth - brandWidth) / 2;
      
      pdf.text(brandInfo.brand, brandX, currentY);
      currentY += brandFontSize + 15;
    }
    
    // SECTION 2: PRODUCT NAME (large, centered, multiple lines)
    const productFontSize = this.calculateProductFontSize(brandInfo.productName, rotatedWidth - 60);
    const productLines = this.wrapTextToLines(brandInfo.productName, rotatedWidth - 60, productFontSize);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(productFontSize);
    pdf.setTextColor(0, 0, 0);
    
    // Center each product line
    productLines.slice(0, 3).forEach((line, index) => {
      const lineWidth = pdf.getTextWidth(line);
      const lineX = rotatedX + (rotatedWidth - lineWidth) / 2;
      pdf.text(line, lineX, currentY + (index * (productFontSize + 3)));
    });
    
    currentY += (productLines.length * (productFontSize + 3)) + 25;
    
    // SECTION 3: STORE (centered label and textbox)
    // "Store:" label - centered
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    
    const storeLabelWidth = pdf.getTextWidth('Store:');
    const storeLabelX = rotatedX + (rotatedWidth - storeLabelWidth) / 2;
    pdf.text('Store:', storeLabelX, currentY);
    
    // Store textbox - centered below label
    const storeBoxWidth = Math.min(200, rotatedWidth - 60);
    const storeBoxHeight = 35;
    const storeBoxX = rotatedX + (rotatedWidth - storeBoxWidth) / 2;
    const storeBoxY = currentY + 10;
    
    // Draw textbox
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(2);
    pdf.rect(storeBoxX, storeBoxY, storeBoxWidth, storeBoxHeight);
    
    // Writing lines in textbox
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    const lineSpacing = storeBoxHeight / 3;
    for (let i = 1; i < 3; i++) {
      const lineY = storeBoxY + (i * lineSpacing);
      pdf.line(storeBoxX + 5, lineY, storeBoxX + storeBoxWidth - 5, lineY);
    }
    
    currentY = storeBoxY + storeBoxHeight + 25;
    
    // SECTION 4: BOTTOM ROW (3 columns: Barcode | Dates | Case/Box)
    const bottomRowY = currentY;
    const bottomRowHeight = rotatedY + rotatedHeight - currentY - padding - 20; // Leave space for audit
    const columnWidth = rotatedWidth / 3;
    
    // Column 1: BARCODE (left)
    const barcodeX = rotatedX + padding;
    await this.drawBarcodeColumn(pdf, labelData, barcodeX, bottomRowY, columnWidth, bottomRowHeight);
    
    // Column 2: DATES (center)
    const datesX = rotatedX + columnWidth;
    this.drawDatesColumn(pdf, labelData, datesX, bottomRowY, columnWidth, bottomRowHeight);
    
    // Column 3: CASE/BOX (right)
    const caseBoxX = rotatedX + (columnWidth * 2);
    this.drawCaseBoxColumn(pdf, labelData, boxNumber, totalBoxes, caseBoxX, bottomRowY, columnWidth, bottomRowHeight);
    
    // AUDIT TRAIL (bottom-left)
    const auditLine = this.generateAuditLine(currentUser);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(102, 102, 102);
    pdf.text(auditLine, rotatedX + padding, rotatedY + rotatedHeight - 10);
    
    // Restore graphics state
    pdf.restoreGraphicsState();
    
    if (debug) {
      this.drawDebugInfo(pdf, position, {
        rotatedWidth,
        rotatedHeight,
        transformation: 'rotated_90_clockwise'
      });
    }
    
    console.log('✅ HTML visual content structure complete');
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
    const barcodeWidth = Math.min(width - 20, 100);
    const barcodeHeight = 30;
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
    
    textY += 25;
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
    const caseBoxWidth = 60;
    const caseBoxHeight = 18;
    const caseBoxX = centerX - caseBoxWidth / 2;
    
    // Draw textbox border
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1.5);
    pdf.rect(caseBoxX, textY, caseBoxWidth, caseBoxHeight);
    
    // Case label and value
    textY += 28;
    const caseText = `Case: ${labelData.caseQuantity || '___'}`;
    const caseTextWidth = pdf.getTextWidth(caseText);
    pdf.text(caseText, centerX - caseTextWidth / 2, textY);
    
    textY += 25;
    
    // Box quantity with textbox
    const boxBoxX = centerX - caseBoxWidth / 2;
    pdf.rect(boxBoxX, textY, caseBoxWidth, caseBoxHeight);
    
    textY += 28;
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
   * Draw debug information
   */
  static drawDebugInfo(pdf, position, info) {
    const { x, y, width, height } = position;
    
    pdf.setDrawColor(255, 0, 0);
    pdf.setLineWidth(0.5);
    
    // Draw original label border in red
    pdf.rect(x, y, width, height);
    
    // Add debug text
    pdf.setFontSize(8);
    pdf.setTextColor(255, 0, 0);
    pdf.text(`DEBUG: ${info.transformation}`, x + 5, y - 5);
    pdf.text(`Rotated: ${info.rotatedWidth}×${info.rotatedHeight}pt`, x + 5, y - 15);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Calculate S-12212 label position for connected labels
   */
  static calculateS12212PositionConnected(labelIndex) {
    const pageWidth = 612;   // 8.5" in points  
    const pageHeight = 1008; // 14" in points
    const labelWidth = 288;  // 4" in points
    const labelHeight = 432; // 6" in points
    
    const cols = 2;
    const rows = 2;
    const row = Math.floor(labelIndex / cols);
    const col = labelIndex % cols;
    
    const totalLabelsWidth = cols * labelWidth;
    const totalLabelsHeight = rows * labelHeight;
    
    const startX = (pageWidth - totalLabelsWidth) / 2;
    const startY = (pageHeight - totalLabelsHeight) / 2;
    
    const xPos = startX + (col * labelWidth);
    const yPos = startY + (row * labelHeight);
    
    return {
      x: Math.floor(xPos),
      y: Math.floor(yPos),
      width: labelWidth,
      height: labelHeight,
      row, col, labelIndex,
      method: 'html_visual_exact_match'
    };
  }

  /**
   * Calculate single label center position
   */
  static calculateSingleLabelCenterPosition() {
    const pageWidth = 612;
    const pageHeight = 1008;
    const labelWidth = 288;
    const labelHeight = 432;
    
    return {
      x: (pageWidth - labelWidth) / 2,
      y: (pageHeight - labelHeight) / 2,
      width: labelWidth,
      height: labelHeight,
      method: 'single_label_html_visual_debug',
      centered: true
    };
  }

  /**
   * Format label data
   */
  static formatLabelDataForS12212(item, enhancedData, username) {
    const timestamp = new Date();
    const brandInfo = this.extractBrandFromProductName(item.productName);
    
    return {
      productName: item.productName || 'Product Name',
      originalProductName: item.productName,
      sku: item.sku || '',
      barcode: item.barcode || item.sku || this.generateFallbackBarcode(item),
      brand: brandInfo.brand || item.brand || '',
      
      labelQuantity: Math.max(1, parseInt(enhancedData?.labelQuantity || '1')),
      caseQuantity: enhancedData?.caseQuantity || '',
      boxCount: Math.max(1, parseInt(enhancedData?.boxCount || '1')),
      harvestDate: this.formatDate(enhancedData?.harvestDate),
      packagedDate: this.formatDate(enhancedData?.packagedDate),
      
      barcodeDisplay: this.formatBarcodeDisplay(item.barcode || item.sku || ''),
      
      username: username || 'Unknown',
      timestamp,
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
   * Calculate brand font size
   */
  static calculateBrandFontSize(brandText) {
    if (!brandText) return 18;
    const length = brandText.length;
    if (length <= 8) return 20;
    if (length <= 12) return 18;
    if (length <= 16) return 16;
    return 14;
  }

  /**
   * Calculate product font size
   */
  static calculateProductFontSize(productText, availableWidth) {
    if (!productText) return 24;
    
    const length = productText.length;
    let fontSize = 24;
    
    if (length > 80) fontSize = 14;
    else if (length > 60) fontSize = 16;
    else if (length > 40) fontSize = 18;
    else if (length > 25) fontSize = 20;
    else if (length > 15) fontSize = 22;
    
    return Math.max(fontSize, 12);
  }

  /**
   * Wrap text to lines
   */
  static wrapTextToLines(text, maxWidth, fontSize) {
    if (!text) return [''];
    
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
   * Format barcode with spaces
   */
  static formatBarcodeWithSpaces(barcodeDisplay) {
    if (!barcodeDisplay) return '';
    return barcodeDisplay.replace(/-/g, ' ');
  }

  /**
   * Format barcode display
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
   * Format date
   */
  static formatDate(dateStr) {
    if (!dateStr) return '';
    
    const cleaned = dateStr.toString().replace(/[^\d\/\-]/g, '');
    
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
   * Get S-12212 specifications
   */
  static getS12212Specs() {
    return {
      WIDTH_INCHES: 4,
      HEIGHT_INCHES: 6,
      LABELS_PER_SHEET: 4,
      SHEET_WIDTH: 8.5,
      SHEET_HEIGHT: 14,
      ORIENTATION: 'portrait_pdf_landscape_application',
      FORMAT: 'S-12212',
      LAYOUT: 'html_visual_exact_match',
      
      LABEL_WIDTH_PT: 288,
      LABEL_HEIGHT_PT: 432,
      PAGE_WIDTH_PT: 612,
      PAGE_HEIGHT_PT: 1008
    };
  }

  /**
   * Generate test PDF (single label)
   */
  static async generateTestPDF() {
    console.log('🧪 Generating S-12212 test PDF (HTML visual match)...');
    
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
   * Generate full sheet test PDF
   */
  static async generateFullSheetTestPDF() {
    console.log('🧪 Generating S-12212 full sheet test PDF (HTML visual match)...');
    
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

  // Legacy compatibility
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
      labelFormat: 'Uline S-12212 (HTML Visual Exact Match)',
      approach: 'Portrait PDF with 90° rotation for landscape application',
      method: 'html_visual_exact_match',
      compatibility: 'Uline S-12212 label sheets on legal paper'
    };
  }
}