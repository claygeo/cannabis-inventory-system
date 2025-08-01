// CANVAS-BASED LABEL GENERATOR - Much more reliable than PDF transformations
import { jsPDF } from 'jspdf';

/**
 * Canvas-based label generator - draw on HTML canvas, then export to PDF
 * This approach is much more predictable and reliable
 */
export class CanvasLabelGenerator {
  /**
   * Generate labels using HTML Canvas approach
   * @param {Array} labelDataArray - Label data
   * @param {Object} options - Options
   * @returns {Blob} - PDF blob
   */
  static async generateLabels(labelDataArray, options = {}) {
    console.log('🎨 Starting Canvas-based label generation...');
    
    const {
      debug = false,
      currentUser = 'Unknown',
      startWithSingle = false
    } = options;

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [612, 1008]
    });

    let currentLabelIndex = 0;
    let currentPage = 1;

    try {
      for (let dataIndex = 0; dataIndex < labelDataArray.length; dataIndex++) {
        const labelData = labelDataArray[dataIndex];
        const formattedData = this.formatLabelData(
          labelData,
          labelData.enhancedData || {},
          labelData.user || currentUser
        );

        const labelsToGenerate = startWithSingle ? 1 : formattedData.labelQuantity;
        
        for (let labelCopy = 0; labelCopy < labelsToGenerate; labelCopy++) {
          // Check if we need a new page
          if (currentLabelIndex > 0 && currentLabelIndex % 4 === 0) {
            pdf.addPage();
            currentPage++;
          }

          // Calculate position
          const position = startWithSingle ? 
            this.calculateSingleLabelPosition() : 
            this.calculateLabelPosition(currentLabelIndex % 4);

          // Calculate box number
          const boxNumber = Math.floor(labelCopy / Math.max(1, Math.floor(formattedData.labelQuantity / formattedData.boxCount))) + 1;

          // Draw label using canvas
          await this.drawCanvasLabel(pdf, formattedData, position, boxNumber, formattedData.boxCount, currentUser, debug);

          currentLabelIndex++;
        }
        
        if (startWithSingle) break;
      }

      console.log(`✅ Generated ${currentLabelIndex} canvas-based labels`);
      return pdf.output('blob');

    } catch (error) {
      console.error('❌ Canvas label generation error:', error);
      throw new Error(`Canvas label generation failed: ${error.message}`);
    }
  }

  /**
   * Draw label using HTML Canvas (then convert to PDF)
   */
  static async drawCanvasLabel(pdf, labelData, position, boxNumber, totalBoxes, currentUser, debug) {
    const { x, y, width, height } = position;
    
    // Create canvas with high DPI for quality
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
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Draw border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);
    
    // FOR LANDSCAPE APPLICATION: Rotate canvas content 90° clockwise
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(Math.PI / 2); // 90° clockwise
    ctx.translate(-height / 2, -width / 2);
    
    // Now draw in landscape orientation (swapped dimensions)
    const landscapeWidth = height; // 432pt (6")
    const landscapeHeight = width; // 288pt (4") 
    
    await this.drawLandscapeContent(ctx, labelData, landscapeWidth, landscapeHeight, boxNumber, totalBoxes, currentUser);
    
    ctx.restore();
    
    // Add canvas to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', x, y, width, height);
    
    if (debug) {
      // Add debug border
      pdf.setDrawColor(255, 0, 0);
      pdf.setLineWidth(2);
      pdf.rect(x, y, width, height);
    }
  }

  /**
   * Draw content in landscape orientation on canvas
   */
  static async drawLandscapeContent(ctx, labelData, width, height, boxNumber, totalBoxes, currentUser) {
    const padding = 15;
    const brandInfo = this.extractBrandFromProductName(labelData.productName);
    
    // Set text properties
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#000000';
    
    let currentY = padding;
    
    // SECTION 1: BRAND NAME (centered at top)
    if (brandInfo.brand) {
      const brandFontSize = this.calculateBrandFontSize(brandInfo.brand);
      ctx.font = `bold ${brandFontSize}px Arial`;
      ctx.fillText(brandInfo.brand, width / 2, currentY);
      currentY += brandFontSize + 15;
    }
    
    // SECTION 2: PRODUCT NAME (large, centered, multi-line)
    const productFontSize = this.calculateProductFontSize(brandInfo.productName);
    ctx.font = `bold ${productFontSize}px Arial`;
    
    const productLines = this.wrapTextForCanvas(ctx, brandInfo.productName, width - 60);
    productLines.slice(0, 3).forEach((line, index) => {
      ctx.fillText(line, width / 2, currentY + (index * (productFontSize + 5)));
    });
    currentY += (productLines.length * (productFontSize + 5)) + 25;
    
    // SECTION 3: STORE SECTION (centered)
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Store:', width / 2, currentY);
    currentY += 20;
    
    // Store textbox
    const storeBoxWidth = Math.min(200, width - 60);
    const storeBoxHeight = 35;
    const storeBoxX = (width - storeBoxWidth) / 2;
    
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
    
    // SECTION 4: BOTTOM ROW (3 columns)
    const bottomRowHeight = height - currentY - padding - 20; // Space for audit
    const columnWidth = width / 3;
    
    // Column 1: BARCODE
    await this.drawBarcodeColumn(ctx, labelData, padding, currentY, columnWidth, bottomRowHeight);
    
    // Column 2: DATES
    this.drawDatesColumn(ctx, labelData, columnWidth, currentY, columnWidth, bottomRowHeight);
    
    // Column 3: CASE/BOX
    this.drawCaseBoxColumn(ctx, labelData, boxNumber, totalBoxes, columnWidth * 2, currentY, columnWidth, bottomRowHeight);
    
    // AUDIT TRAIL (bottom-left)
    const auditLine = this.generateAuditLine(currentUser);
    ctx.font = '6px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#666666';
    ctx.fillText(auditLine, padding, height - 10);
  }

  /**
   * Draw barcode column on canvas
   */
  static async drawBarcodeColumn(ctx, labelData, x, y, width, height) {
    const centerX = x + width / 2;
    
    // Barcode numeric
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000000';
    const spacedBarcode = labelData.barcodeDisplay.replace(/-/g, ' ');
    ctx.fillText(spacedBarcode, centerX, y + 10);
    
    // Simple barcode representation (black bars)
    const barcodeY = y + 25;
    const barcodeWidth = Math.min(width - 20, 100);
    const barcodeHeight = 30;
    const barcodeX = centerX - barcodeWidth / 2;
    
    // Draw simple barcode pattern
    ctx.fillStyle = '#000000';
    const barWidth = 2;
    const barcodeValue = labelData.barcode || 'UNKNOWN';
    
    for (let i = 0; i < Math.min(barcodeValue.length * 3, Math.floor(barcodeWidth / barWidth)); i++) {
      if (i % 2 === 0) { // Every other bar
        ctx.fillRect(barcodeX + (i * barWidth), barcodeY, barWidth, barcodeHeight);
      }
    }
  }

  /**
   * Draw dates column on canvas
   */
  static drawDatesColumn(ctx, labelData, x, y, width, height) {
    const centerX = x + width / 2;
    let textY = y + 15;
    
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000000';
    
    // Harvest
    ctx.font = 'bold 11px Arial';
    ctx.fillText('Harvest:', centerX, textY);
    textY += 15;
    
    ctx.font = '10px Arial';
    ctx.fillText(labelData.harvestDate || 'MM/DD/YY', centerX, textY);
    textY += 25;
    
    // Package
    ctx.font = 'bold 11px Arial';
    ctx.fillText('Package:', centerX, textY);
    textY += 15;
    
    ctx.font = '10px Arial';
    ctx.fillText(labelData.packagedDate || 'MM/DD/YY', centerX, textY);
  }

  /**
   * Draw case/box column on canvas
   */
  static drawCaseBoxColumn(ctx, labelData, boxNumber, totalBoxes, x, y, width, height) {
    const centerX = x + width / 2;
    let textY = y + 15;
    
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000000';
    
    // Case textbox
    const caseBoxWidth = 60;
    const caseBoxHeight = 18;
    const caseBoxX = centerX - caseBoxWidth / 2;
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(caseBoxX, textY, caseBoxWidth, caseBoxHeight);
    
    textY += 28;
    ctx.font = 'bold 10px Arial';
    ctx.fillText(`Case: ${labelData.caseQuantity || '___'}`, centerX, textY);
    
    textY += 25;
    
    // Box textbox
    ctx.strokeRect(caseBoxX, textY, caseBoxWidth, caseBoxHeight);
    
    textY += 28;
    ctx.fillText(`Box ${boxNumber}/${totalBoxes}`, centerX, textY);
  }

  /**
   * Wrap text for canvas
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
    return lines;
  }

  // Utility methods (same as before)
  static calculateLabelPosition(labelIndex) {
    const pageWidth = 612, pageHeight = 1008;
    const labelWidth = 288, labelHeight = 432;
    const cols = 2, rows = 2;
    
    const row = Math.floor(labelIndex / cols);
    const col = labelIndex % cols;
    
    const totalWidth = cols * labelWidth;
    const totalHeight = rows * labelHeight;
    const startX = (pageWidth - totalWidth) / 2;
    const startY = (pageHeight - totalHeight) / 2;
    
    return {
      x: startX + (col * labelWidth),
      y: startY + (row * labelHeight),
      width: labelWidth,
      height: labelHeight
    };
  }

  static calculateSingleLabelPosition() {
    return {
      x: (612 - 288) / 2,
      y: (1008 - 432) / 2,
      width: 288,
      height: 432
    };
  }

  static formatLabelData(item, enhancedData, username) {
    const brandInfo = this.extractBrandFromProductName(item.productName);
    
    return {
      productName: item.productName || 'Product Name',
      barcode: item.barcode || item.sku || 'UNKNOWN',
      barcodeDisplay: this.formatBarcodeDisplay(item.barcode || item.sku || ''),
      brand: brandInfo.brand,
      
      labelQuantity: Math.max(1, parseInt(enhancedData?.labelQuantity || '1')),
      caseQuantity: enhancedData?.caseQuantity || '',
      boxCount: Math.max(1, parseInt(enhancedData?.boxCount || '1')),
      harvestDate: this.formatDate(enhancedData?.harvestDate),
      packagedDate: this.formatDate(enhancedData?.packagedDate),
      
      username: username || 'Unknown',
      timestamp: new Date()
    };
  }

  static extractBrandFromProductName(productName) {
    if (!productName) return { brand: '', productName: 'Product Name' };

    const brands = [
      'Curaleaf', 'Grassroots', 'Reef', 'B-Noble', 'Cresco', 'Rythm', 'GTI',
      'Verano', 'Aeriz', 'Revolution', 'Cookies', 'Jeeter', 'Raw Garden'
    ];

    const trimmed = productName.trim();
    
    for (const brand of brands) {
      const regex = new RegExp(`^${brand}\\s+`, 'i');
      if (regex.test(trimmed)) {
        const remaining = trimmed.replace(regex, '').trim();
        return { brand: brand, productName: remaining || trimmed };
      }
    }

    return { brand: '', productName: trimmed };
  }

  static calculateBrandFontSize(brandText) {
    const length = brandText.length;
    if (length <= 8) return 20;
    if (length <= 12) return 18;
    if (length <= 16) return 16;
    return 14;
  }

  static calculateProductFontSize(productText) {
    const length = productText.length;
    if (length > 80) return 14;
    if (length > 60) return 16;
    if (length > 40) return 18;
    if (length > 25) return 20;
    return 22;
  }

  static formatBarcodeDisplay(barcode) {
    if (!barcode) return '';
    const clean = barcode.replace(/[^A-Za-z0-9]/g, '');
    if (clean.length <= 12) {
      return clean.replace(/(.{3})/g, '$1-').replace(/-$/, '');
    }
    return clean.replace(/(.{4})/g, '$1-').replace(/-$/, '');
  }

  static formatDate(dateStr) {
    if (!dateStr) return '';
    const cleaned = dateStr.toString().replace(/[^\d\/\-]/g, '');
    return cleaned.replace(/-/g, '/');
  }

  static generateAuditLine(currentUser) {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const year = now.getFullYear().toString().slice(-2);
    
    let hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const minutes = now.getMinutes().toString().padStart(2, '0');
    
    return `${month}/${day}/${year} ${hours}:${minutes}${ampm} EST (${currentUser.substring(0, 8)})`;
  }

  // Main methods
  static async generateTestPDF() {
    const testData = [{
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
    }];

    return this.generateLabels(testData, { 
      debug: true, 
      currentUser: 'TestUser', 
      startWithSingle: true 
    });
  }
}