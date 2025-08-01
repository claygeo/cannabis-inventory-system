// REFINED CANVAS-BASED PDF GENERATOR - Fixed textbox positioning
import { jsPDF } from 'jspdf';
import 'jspdf/dist/jspdf.es.min.js';

import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * Refined Canvas-based PDF Generator for Uline S-12212 labels
 * Fixed textbox positioning and enlarged harvest/package text
 */
export class PDFGenerator {
  /**
   * Generate PDF labels using refined Canvas approach
   * @param {Array} labelDataArray - Array of label data objects
   * @param {Object} options - Generation options
   * @returns {Blob} - PDF blob
   */
  static async generateLabels(labelDataArray, options = {}) {
    console.log('🎨 Starting REFINED Canvas-based PDF generation...');
    console.log('📋 Label data array length:', labelDataArray.length);
    
    const {
      format = 'legal',
      orientation = 'portrait',
      debug = false,
      currentUser = 'Unknown',
      startWithSingle = false
    } = options;

    // Create PDF instance
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [612, 1008] // Legal size: 8.5" × 14"
    });

    console.log('📄 PDF instance created for refined Canvas generation');

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
            await this.drawRefinedCanvasLabel(pdf, formattedData, centerPosition, 1, 1, debug, currentUser);
            console.log('🧪 Single refined Canvas label generated');
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

          // Draw the label using refined Canvas approach
          await this.drawRefinedCanvasLabel(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
        
        if (startWithSingle) break;
      }

      console.log(`✅ Generated ${currentLabelIndex} refined Canvas labels across ${currentPage} pages`);

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - Refined Canvas - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-12212 Labels - Refined Canvas Generation',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v9.1.0',
        keywords: 'cannabis, inventory, labels, uline, s-12212, refined-canvas'
      });

      return pdf.output('blob');

    } catch (error) {
      console.error('❌ Refined Canvas PDF generation error:', error);
      throw new Error(`Refined Canvas PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Draw label using refined Canvas approach
   * @param {Object} pdf - jsPDF instance
   * @param {Object} labelData - Formatted label data
   * @param {Object} position - Label position
   * @param {number} boxNumber - Box number
   * @param {number} totalBoxes - Total boxes
   * @param {boolean} debug - Debug mode
   * @param {string} currentUser - Current user
   */
  static async drawRefinedCanvasLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    console.log(`🎨 Drawing refined Canvas label...`);
    
    const { x, y, width, height } = position;

    try {
      // Create high-resolution canvas
      const canvas = document.createElement('canvas');
      const dpr = window.devicePixelRatio || 1;
      const canvasWidth = width * 2; // High resolution
      const canvasHeight = height * 2;
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      
      const ctx = canvas.getContext('2d');
      ctx.scale(2, 2); // Scale for high DPI
      
      // Clear canvas with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      // Draw label border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, width, height);
      
      // Draw refined content for landscape application
      await this.drawRefinedCanvasContent(ctx, labelData, width, height, boxNumber, totalBoxes, currentUser, debug);
      
      // Convert canvas to image and add to PDF
      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', x, y, width, height, undefined, 'NONE');
      
      // Clean up
      canvas.remove();
      
      console.log('✅ Refined Canvas label drawn successfully');

    } catch (error) {
      console.error('❌ Refined Canvas label drawing failed:', error);
      
      // Emergency fallback - simple text
      pdf.setFontSize(12);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Generation Error', x + 10, y + 30);
      pdf.text('Canvas Fallback Mode', x + 10, y + 50);
    }
  }

  /**
   * Draw refined content on canvas for landscape application
   * Fixed textbox positioning and enlarged harvest/package text
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} labelData - Label data
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} boxNumber - Box number
   * @param {number} totalBoxes - Total boxes
   * @param {string} currentUser - Current user
   * @param {boolean} debug - Debug mode
   */
  static async drawRefinedCanvasContent(ctx, labelData, width, height, boxNumber, totalBoxes, currentUser, debug) {
    console.log(`🎨 Drawing refined Canvas content for landscape application`);
    
    // Save context state
    ctx.save();
    
    // Transform for landscape application
    // Rotate 90° clockwise and adjust positioning
    ctx.translate(width / 2, height / 2);
    ctx.rotate(Math.PI / 2); // 90° clockwise
    ctx.translate(-height / 2, -width / 2);
    
    // After rotation: width becomes height, height becomes width
    const landscapeWidth = height; // 432pt (6" wide when applied)
    const landscapeHeight = width; // 288pt (4" tall when applied)
    
    // Extract brand info
    const brandInfo = this.extractBrandFromProductName(labelData.productName);
    
    // Set up text rendering
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#000000';
    
    const padding = 15;
    let currentY = padding;
    
    // SECTION 1: BRAND NAME (centered at top)
    if (brandInfo.brand) {
      const brandFontSize = this.calculateBrandFontSize(brandInfo.brand);
      ctx.font = `bold ${brandFontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      
      ctx.fillText(brandInfo.brand, landscapeWidth / 2, currentY);
      currentY += brandFontSize + 15;
    }
    
    // SECTION 2: PRODUCT NAME (large, centered, multi-line)
    const productFontSize = this.calculateProductFontSize(brandInfo.productName);
    ctx.font = `bold ${productFontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    
    const productLines = this.wrapTextForCanvas(ctx, brandInfo.productName, landscapeWidth - 60);
    productLines.slice(0, 3).forEach((line, index) => {
      ctx.fillText(line, landscapeWidth / 2, currentY + (index * (productFontSize + 5)));
    });
    currentY += (productLines.length * (productFontSize + 5)) + 25;
    
    // SECTION 3: STORE SECTION (centered)
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Store:', landscapeWidth / 2, currentY);
    currentY += 20;
    
    // Store textbox
    const storeBoxWidth = Math.min(200, landscapeWidth - 60);
    const storeBoxHeight = 35;
    const storeBoxX = (landscapeWidth - storeBoxWidth) / 2;
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(storeBoxX, currentY, storeBoxWidth, storeBoxHeight);
    
    // Writing lines in store box
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 0.5;
    const lineSpacing = storeBoxHeight / 3;
    for (let i = 1; i < 3; i++) {
      const lineY = currentY + (i * lineSpacing);
      ctx.beginPath();
      ctx.moveTo(storeBoxX + 5, lineY);
      ctx.lineTo(storeBoxX + storeBoxWidth - 5, lineY);
      ctx.stroke();
    }
    currentY += storeBoxHeight + 25;
    
    // SECTION 4: BOTTOM ROW (3 columns: Barcode | Dates | Case/Box)
    const bottomRowY = currentY;
    const bottomRowHeight = landscapeHeight - currentY - padding - 20; // Space for audit
    const columnWidth = landscapeWidth / 3;
    
    // Column 1: BARCODE (left)
    await this.drawRefinedBarcodeColumn(ctx, labelData, padding, bottomRowY, columnWidth, bottomRowHeight);
    
    // Column 2: DATES (center) - ENLARGED TEXT
    this.drawRefinedDatesColumn(ctx, labelData, columnWidth, bottomRowY, columnWidth, bottomRowHeight);
    
    // Column 3: CASE/BOX (right) - FIXED TEXTBOX POSITIONING
    this.drawRefinedCaseBoxColumn(ctx, labelData, boxNumber, totalBoxes, columnWidth * 2, bottomRowY, columnWidth, bottomRowHeight);
    
    // AUDIT TRAIL (bottom-left)
    const auditLine = this.generateAuditLine(currentUser);
    ctx.font = '6px Arial, sans-serif';
    ctx.fillStyle = '#666666';
    ctx.textAlign = 'left';
    ctx.fillText(auditLine, padding, landscapeHeight - 10);
    
    // Debug overlay
    if (debug) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      
      // Section dividers
      ctx.strokeRect(padding, padding, landscapeWidth - (padding * 2), landscapeHeight - (padding * 2));
      
      // Column dividers
      ctx.beginPath();
      ctx.moveTo(columnWidth, bottomRowY);
      ctx.lineTo(columnWidth, bottomRowY + bottomRowHeight);
      ctx.moveTo(columnWidth * 2, bottomRowY);
      ctx.lineTo(columnWidth * 2, bottomRowY + bottomRowHeight);
      ctx.stroke();
      
      // Add debug labels
      ctx.setLineDash([]);
      ctx.fillStyle = '#ff0000';
      ctx.font = '8px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('BARCODE', padding + 5, bottomRowY + 10);
      ctx.fillText('DATES', columnWidth + 5, bottomRowY + 10);
      ctx.fillText('CASE/BOX', columnWidth * 2 + 5, bottomRowY + 10);
    }
    
    // Restore context state
    ctx.restore();
    
    console.log('✅ Refined Canvas content drawn for landscape application');
  }

  /**
   * Draw refined barcode column on canvas
   */
  static async drawRefinedBarcodeColumn(ctx, labelData, x, y, width, height) {
    const centerX = x + width / 2;
    
    // Barcode numeric display
    ctx.font = '10px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000000';
    const spacedBarcode = this.formatBarcodeWithSpaces(labelData.barcodeDisplay);
    ctx.fillText(spacedBarcode, centerX, y + 15);
    
    // Enhanced barcode generation
    const barcodeY = y + 30;
    const barcodeWidth = Math.min(width - 20, 100);
    const barcodeHeight = 30;
    const barcodeX = centerX - barcodeWidth / 2;
    
    try {
      // Try to generate proper barcode using existing BarcodeGenerator
      await this.drawCanvasBarcode(ctx, labelData.barcode, barcodeX, barcodeY, barcodeWidth, barcodeHeight);
    } catch (error) {
      console.warn('Barcode generation failed, using fallback:', error);
      // Fallback: simple bar pattern
      this.drawFallbackBarcode(ctx, barcodeX, barcodeY, barcodeWidth, barcodeHeight);
    }
  }

  /**
   * Draw enhanced barcode on canvas
   */
  static async drawCanvasBarcode(ctx, barcodeValue, x, y, width, height) {
    if (!barcodeValue) {
      this.drawFallbackBarcode(ctx, x, y, width, height);
      return;
    }

    try {
      const cleanBarcodeValue = barcodeValue.replace(/[^A-Za-z0-9]/g, '');
      
      // Use existing BarcodeGenerator validation
      const validation = BarcodeGenerator.validateCode39(cleanBarcodeValue);
      if (!validation.isValid) {
        console.warn('Invalid barcode:', validation.error);
        this.drawFallbackBarcode(ctx, x, y, width, height);
        return;
      }

      // Create temporary canvas for barcode
      const barcodeCanvas = document.createElement('canvas');
      barcodeCanvas.width = width * 2;
      barcodeCanvas.height = height * 2;
      
      // Import and use JsBarcode
      const JsBarcode = (await import('jsbarcode')).default;
      
      JsBarcode(barcodeCanvas, validation.cleanValue, {
        format: 'CODE39',
        width: Math.max(2, Math.floor(width / 25)),
        height: height * 2,
        displayValue: false,
        margin: 0,
        background: '#ffffff',
        lineColor: '#000000'
      });

      // Draw barcode canvas onto main canvas
      ctx.drawImage(barcodeCanvas, x, y, width, height);

    } catch (error) {
      console.error('Canvas barcode generation error:', error);
      this.drawFallbackBarcode(ctx, x, y, width, height);
    }
  }

  /**
   * Draw fallback barcode pattern
   */
  static drawFallbackBarcode(ctx, x, y, width, height) {
    ctx.fillStyle = '#000000';
    const barWidth = 2;
    const barcodePattern = [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0];
    
    for (let i = 0; i < Math.min(barcodePattern.length, Math.floor(width / barWidth)); i++) {
      if (barcodePattern[i] === 1) {
        ctx.fillRect(x + (i * barWidth), y, barWidth, height);
      }
    }
  }

  /**
   * Draw refined dates column on canvas - ENLARGED TEXT
   */
  static drawRefinedDatesColumn(ctx, labelData, x, y, width, height) {
    const centerX = x + width / 2;
    let textY = y + 15;
    
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000000';
    
    // Harvest date - ENLARGED
    ctx.font = 'bold 13px Arial, sans-serif'; // Increased from 11px
    ctx.fillText('Harvest:', centerX, textY);
    textY += 18; // Increased spacing
    
    ctx.font = '12px Arial, sans-serif'; // Increased from 10px
    ctx.fillText(labelData.harvestDate || 'MM/DD/YY', centerX, textY);
    textY += 28; // Increased spacing
    
    // Package date - ENLARGED
    ctx.font = 'bold 13px Arial, sans-serif'; // Increased from 11px
    ctx.fillText('Package:', centerX, textY);
    textY += 18; // Increased spacing
    
    ctx.font = '12px Arial, sans-serif'; // Increased from 10px
    ctx.fillText(labelData.packagedDate || 'MM/DD/YY', centerX, textY);
  }

  /**
   * Draw refined case/box column on canvas - FIXED TEXTBOX POSITIONING
   */
  static drawRefinedCaseBoxColumn(ctx, labelData, boxNumber, totalBoxes, x, y, width, height) {
    const centerX = x + width / 2;
    let textY = y + 15;
    
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000000';
    
    // Case quantity with textbox - FIXED POSITIONING
    const caseBoxWidth = 65;  // Slightly wider
    const caseBoxHeight = 20; // Slightly taller
    const caseBoxX = centerX - caseBoxWidth / 2;
    
    // Draw case textbox
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(caseBoxX, textY, caseBoxWidth, caseBoxHeight);
    
    // Case label - POSITIONED ABOVE THE TEXTBOX
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('Case:', centerX, textY - 12); // Above the textbox
    
    // Case value - POSITIONED INSIDE THE TEXTBOX
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.textBaseline = 'middle'; // Center vertically
    ctx.fillText(labelData.caseQuantity || '___', centerX, textY + caseBoxHeight / 2);
    
    textY += caseBoxHeight + 25; // Move down for next section
    
    // Box quantity with textbox - FIXED POSITIONING
    const boxBoxX = centerX - caseBoxWidth / 2;
    
    // Draw box textbox
    ctx.strokeRect(boxBoxX, textY, caseBoxWidth, caseBoxHeight);
    
    // Box label - POSITIONED ABOVE THE TEXTBOX
    ctx.textBaseline = 'top'; // Reset baseline
    ctx.fillText('Box:', centerX, textY - 12); // Above the textbox
    
    // Box value - POSITIONED INSIDE THE TEXTBOX
    ctx.textBaseline = 'middle'; // Center vertically
    ctx.fillText(`${boxNumber}/${totalBoxes}`, centerX, textY + caseBoxHeight / 2);
    
    // Reset text baseline
    ctx.textBaseline = 'top';
  }

  /**
   * Wrap text for canvas with accurate measurements
   */
  static wrapTextForCanvas(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) lines.push(currentLine);
    return lines.length > 0 ? lines : [''];
  }

  // ============================================================================
  // UTILITY METHODS (maintaining existing interface)
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
      method: 'refined_canvas_s12212'
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
      method: 'single_label_refined_canvas_debug',
      centered: true
    };
  }

  /**
   * Format label data for S-12212
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
  static calculateProductFontSize(productText) {
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
   * Format date string
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
      ORIENTATION: 'portrait_pdf_refined_canvas',
      FORMAT: 'S-12212',
      LAYOUT: 'refined_canvas_landscape_content',
      
      LABEL_WIDTH_PT: 288,
      LABEL_HEIGHT_PT: 432,
      PAGE_WIDTH_PT: 612,
      PAGE_HEIGHT_PT: 1008
    };
  }

  /**
   * Generate test PDF (single label for debugging)
   */
  static async generateTestPDF() {
    console.log('🧪 Generating refined Canvas test PDF (single label)...');
    
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
    console.log('🧪 Generating refined Canvas full sheet test PDF...');
    
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

  // ============================================================================
  // LEGACY COMPATIBILITY METHODS (maintain existing interface)
  // ============================================================================

  /**
   * Legacy method - maintain compatibility
   */
  static calculateUlineLabelPosition(labelIndex) {
    return this.calculateS12212PositionConnected(labelIndex % 4);
  }

  /**
   * Validate generation data - maintain compatibility
   */
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
      labelFormat: 'Uline S-12212 (Refined Canvas Generation)',
      approach: 'Refined Canvas-based rendering with fixed textbox positioning',
      method: 'refined_canvas_reliable',
      compatibility: 'Uline S-12212 label sheets on legal paper'
    };
  }
}