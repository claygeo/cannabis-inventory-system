import jsPDF from 'jspdf';
import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generation utilities for Uline S-5492 label sheets (4" × 6" HORIZONTAL)
 * Complete redesign for legal size paper with 2×2 grid layout
 */
export class PDFGenerator {
  /**
   * Generate PDF with labels positioned for Uline S-5492 sheets
   * @param {Array} labelDataArray - Array of label data objects
   * @param {Object} options - Generation options
   * @returns {Promise<Blob>} - PDF blob
   */
  static async generateLabels(labelDataArray, options = {}) {
    const {
      format = 'legal', // Legal size for S-5492
      orientation = 'portrait',
      debug = false,
      currentUser = 'Unknown'
    } = options;

    // Legal size sheets for S-5492 (8.5" × 14")
    const pdf = new jsPDF({
      orientation,
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
          // Check if we need a new page (S-5492 has 4 labels per sheet)
          if (currentLabelIndex > 0 && currentLabelIndex % specs.LABELS_PER_SHEET === 0) {
            pdf.addPage();
            currentPage++;
          }

          // Calculate position for this label
          const position = this.calculateUlineS5492Position(currentLabelIndex % specs.LABELS_PER_SHEET);

          // Calculate which box number this label represents
          const boxNumber = Math.floor(labelCopy / Math.max(1, Math.floor(formattedData.labelQuantity / formattedData.boxCount))) + 1;

          // Draw the label with S-5492 horizontal layout
          await this.drawHorizontalLabel(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
      }

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-5492 Format Labels (4" × 6" Horizontal)',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v6.0.0',
        keywords: 'cannabis, inventory, labels, uline, s-5492, horizontal, 4x6, legal'
      });

      // Log generation event
      storage.addSessionEvent(
        EVENT_TYPES.LABEL_GENERATED,
        `Generated ${currentLabelIndex} S-5492 labels across ${currentPage} pages`,
        `Items: ${labelDataArray.length}, Format: Uline S-5492 (4" × 6" Horizontal)`
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
   * Calculate exact label position for Uline S-5492 (4" × 6" horizontal, 4 per legal sheet)
   * Based on physical Uline S-5492 specifications for 8.5" × 14" legal size
   * @param {number} labelIndex - Index of label (0-3 for 4 labels per sheet)
   * @returns {Object} - Position coordinates in points
   */
  static calculateUlineS5492Position(labelIndex) {
    // Legal size sheet dimensions
    const pageWidth = 612;   // 8.5" in points  
    const pageHeight = 1008; // 14" in points
    
    // HP E877 printer margins (0.167" = 12pt)
    const printerMargin = 12;
    const printableWidth = pageWidth - (printerMargin * 2);   // 588pt
    const printableHeight = pageHeight - (printerMargin * 2); // 984pt
    
    // S-5492 label dimensions (4" × 6" oriented horizontally = 6" wide × 4" tall)
    const labelWidth = 432;  // 6" in points (horizontal orientation)
    const labelHeight = 288; // 4" in points
    
    // Grid layout: 2 columns × 2 rows
    const cols = 2;
    const rows = 2;
    const row = Math.floor(labelIndex / cols);
    const col = labelIndex % cols;
    
    // Calculate spacing for physical S-5492 sheet alignment
    // Total width needed: 2 × 432pt = 864pt (exceeds 588pt printable)
    // Solution: Scale labels to fit while maintaining aspect ratio
    const maxLabelWidth = Math.floor(printableWidth / cols) - 6; // 6pt gap between columns
    const actualLabelWidth = Math.min(labelWidth, maxLabelWidth);
    const scaleFactor = actualLabelWidth / labelWidth;
    const actualLabelHeight = Math.floor(labelHeight * scaleFactor);
    
    // Center the label grid on the page
    const totalGridWidth = (actualLabelWidth * cols) + 6; // 6pt between columns
    const totalGridHeight = (actualLabelHeight * rows) + 12; // 12pt between rows
    
    const startX = printerMargin + (printableWidth - totalGridWidth) / 2;
    const startY = printerMargin + (printableHeight - totalGridHeight) / 2;
    
    // Calculate individual label position
    const xPos = startX + (col * (actualLabelWidth + 6));
    const yPos = startY + (row * (actualLabelHeight + 12));
    
    return {
      x: Math.floor(xPos),
      y: Math.floor(yPos),
      width: actualLabelWidth,
      height: actualLabelHeight,
      scaleFactor: scaleFactor,
      originalWidth: labelWidth,
      originalHeight: labelHeight
    };
  }

  /**
   * Alternative precise positioning method for physical sheet alignment
   * Use this method if labels don't align with actual S-5492 perforations
   * @param {number} labelIndex - Index of label (0-3)
   * @returns {Object} - Position coordinates optimized for physical alignment
   */
  static calculateUlineS5492PositionPrecise(labelIndex) {
    // Physical measurements based on actual Uline S-5492 sheets
    const measurements = {
      pageWidth: 612,    // 8.5" legal width
      pageHeight: 1008,  // 14" legal height
      
      // Physical label dimensions on S-5492 sheets
      labelWidth: 288,   // 4" physical width
      labelHeight: 432,  // 6" physical height (vertical orientation on sheet)
      
      // Measured margins from actual S-5492 template
      topMargin: 36,     // 0.5" from top edge
      bottomMargin: 36,  // 0.5" from bottom edge  
      leftMargin: 18,    // 0.25" from left edge
      rightMargin: 18,   // 0.25" from right edge
      
      // Gaps between labels
      columnGap: 18,     // 0.25" between columns
      rowGap: 12         // ~0.167" between rows
    };
    
    const cols = 2;
    const row = Math.floor(labelIndex / cols);
    const col = labelIndex % cols;
    
    // Calculate positions using physical measurements
    const xPos = measurements.leftMargin + (col * (measurements.labelWidth + measurements.columnGap));
    const yPos = measurements.topMargin + (row * (measurements.labelHeight + measurements.rowGap));
    
    return {
      x: xPos,
      y: yPos,
      width: measurements.labelWidth,
      height: measurements.labelHeight,
      layout: 'vertical', // Content flows vertically in tall labels
      orientation: 'portrait' // Each label is taller than wide
    };
  }

  /**
   * Draw horizontal 4×6 label with bottom-focused layout and brand separation
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Formatted label data
   * @param {Object} position - Label position and dimensions
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total number of boxes
   * @param {boolean} debug - Show debug borders
   * @param {string} currentUser - Current user generating the labels
   */
  static async drawHorizontalLabel(pdf, labelData, position, boxNumber = 1, totalBoxes = 1, debug = false, currentUser = 'Unknown') {
    const { x, y, width, height } = position;

    // Draw label border
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, y, width, height);

    // Debug border and info
    if (debug) {
      pdf.setDrawColor(255, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.rect(x + 2, y + 2, width - 4, height - 4);
      
      // Debug text
      pdf.setFontSize(8);
      pdf.setTextColor(255, 0, 0);
      pdf.text(`${width.toFixed(0)}×${height.toFixed(0)}pt`, x + 5, y + 15);
    }

    const padding = 8;
    const contentX = x + padding;
    const contentY = y + padding;
    const contentWidth = width - (padding * 2);
    const contentHeight = height - (padding * 2);

    try {
      // Determine layout based on label dimensions
      if (width > height) {
        // Horizontal layout (wider than tall)
        await this.drawHorizontalContentLayout(pdf, labelData, contentX, contentY, contentWidth, contentHeight, boxNumber, totalBoxes, currentUser);
      } else {
        // Vertical layout (taller than wide) 
        await this.drawVerticalContentLayout(pdf, labelData, contentX, contentY, contentWidth, contentHeight, boxNumber, totalBoxes, currentUser);
      }

    } catch (error) {
      console.error('Error drawing label components:', error);
      pdf.setFontSize(10);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Error', contentX + 5, contentY + 20);
    }
  }

  /**
   * Draw content in horizontal layout (for wide labels)
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - Content X position
   * @param {number} y - Content Y position
   * @param {number} width - Content width
   * @param {number} height - Content height
   * @param {number} boxNumber - Box number
   * @param {number} totalBoxes - Total boxes
   * @param {string} currentUser - Current user
   */
  static async drawHorizontalContentLayout(pdf, labelData, x, y, width, height, boxNumber, totalBoxes, currentUser) {
    // 1. MASSIVE Product Name with Brand Separation (Top 60% of height)
    const productNameHeight = Math.floor(height * 0.6);
    const brandInfo = this.extractBrandFromProductName(labelData.productName);
    await this.drawMassiveProductNameWithBrand(pdf, brandInfo, x, y, width, productNameHeight);

    // 2. Bottom section layout (bottom 40% of height)
    const bottomSectionY = y + productNameHeight + 5;
    const bottomSectionHeight = height - productNameHeight - 5;
    
    // 3. Audit Trail (absolute bottom)
    this.drawAuditTrail(pdf, currentUser, x, y + height - 5);

    // 4. Bottom row with larger elements (above audit trail)
    await this.drawBottomRowElements(pdf, labelData, x, bottomSectionY, width, bottomSectionHeight - 15, boxNumber, totalBoxes);
  }

  /**
   * Draw content in vertical layout (for tall labels)
   * @param {jsPDF} pdf - PDF document  
   * @param {Object} labelData - Label data
   * @param {number} x - Content X position
   * @param {number} y - Content Y position
   * @param {number} width - Content width
   * @param {number} height - Content height
   * @param {number} boxNumber - Box number
   * @param {number} totalBoxes - Total boxes
   * @param {string} currentUser - Current user
   */
  static async drawVerticalContentLayout(pdf, labelData, x, y, width, height, boxNumber, totalBoxes, currentUser) {
    let currentY = y;
    
    // 1. Product Name (top section - 40% of height)
    const productNameHeight = Math.floor(height * 0.4);
    const brandInfo = this.extractBrandFromProductName(labelData.productName);
    await this.drawMassiveProductNameWithBrand(pdf, brandInfo, x, currentY, width, productNameHeight);
    currentY += productNameHeight + 10;
    
    // 2. Barcode section (middle)
    const barcodeHeight = 60;
    await this.drawBarcodeSection(pdf, labelData, x, currentY, width, barcodeHeight);
    currentY += barcodeHeight + 10;
    
    // 3. Information section
    const infoHeight = 80;
    this.drawVerticalInfoSection(pdf, labelData, x, currentY, width, infoHeight, boxNumber, totalBoxes);
    currentY += infoHeight + 10;
    
    // 4. Audit trail (bottom)
    this.drawAuditTrail(pdf, currentUser, x, y + height - 5);
  }

  /**
   * Extract brand from product name for separate display
   * @param {string} productName - Full product name
   * @returns {Object} - Brand and remaining product name
   */
  static extractBrandFromProductName(productName) {
    if (!productName) return { brand: '', productName: 'Product Name' };

    // Common cannabis brands (expanded list)
    const brands = [
      'Curaleaf', 'Grassroots', 'Reef', 'B-Noble', 'Cresco', 'Rythm', 'GTI',
      'Verano', 'Aeriz', 'Revolution', 'Cookies', 'Jeeter', 'Raw Garden',
      'Stiiizy', 'Select', 'Heavy Hitters', 'Papa & Barkley', 'Kiva',
      'Wyld', 'Wana', 'Plus Products', 'Legion of Bloom', 'AbsoluteXtracts',
      'Matter', 'Pharmacann', 'Green Thumb', 'Columbia Care', 'Trulieve',
      'MedMen', 'Harvest', 'Acreage', 'Canopy Growth', 'Tilray', 'Aphria',
      'Aurora', 'Hexo', 'Cronos', 'OrganiGram', 'Village Farms', 'TerrAscend'
    ];

    const trimmed = productName.trim();
    
    // Check if product name starts with any known brand
    for (const brand of brands) {
      const regex = new RegExp(`^${brand}\\s+`, 'i');
      if (regex.test(trimmed)) {
        const remaining = trimmed.replace(regex, '').trim();
        return {
          brand: brand,
          productName: remaining || trimmed
        };
      }
    }

    // Check for common patterns like "Brand Name - Product" or "Brand: Product"
    const dashMatch = trimmed.match(/^([A-Za-z\s&'-]+?)\s*[-–:]\s*(.+)$/);
    if (dashMatch && dashMatch[1].length <= 25) {
      return {
        brand: dashMatch[1].trim(),
        productName: dashMatch[2].trim()
      };
    }

    // No brand detected
    return {
      brand: '',
      productName: trimmed
    };
  }

  /**
   * Draw massive product name with brand separation
   * @param {jsPDF} pdf - PDF document
   * @param {Object} brandInfo - Brand and product name info
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Available width
   * @param {number} height - Available height
   */
  static async drawMassiveProductNameWithBrand(pdf, brandInfo, x, y, width, height) {
    let currentY = y;
    const lineSpacing = 1.1;

    // Draw brand name if present (larger, bold)
    if (brandInfo.brand) {
      const maxBrandFontSize = Math.min(36, height * 0.3); // Max 30% of available height
      const brandFontSize = LabelFormatter.autoFitFontSize(brandInfo.brand, width, maxBrandFontSize, maxBrandFontSize);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(brandFontSize);
      pdf.setTextColor(0, 0, 0);
      
      const brandLines = pdf.splitTextToSize(brandInfo.brand, width);
      brandLines.forEach((line) => {
        const textWidth = pdf.getTextWidth(line);
        const centerX = x + (width - textWidth) / 2;
        pdf.text(line, centerX, currentY + (brandFontSize * 0.8));
        currentY += brandFontSize * lineSpacing;
      });
      
      currentY += 8; // Gap between brand and product name
    }

    // Draw product name (maximum possible size)
    const remainingHeight = Math.max(20, height - (currentY - y));
    const maxProductFontSize = brandInfo.brand ? 
      Math.min(32, remainingHeight * 0.4) : 
      Math.min(40, remainingHeight * 0.3);
    
    const productFontSize = LabelFormatter.autoFitFontSize(
      brandInfo.productName, 
      width, 
      remainingHeight, 
      maxProductFontSize
    );
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(productFontSize);
    pdf.setTextColor(0, 0, 0);
    
    const productLines = pdf.splitTextToSize(brandInfo.productName, width);
    productLines.forEach((line) => {
      const textWidth = pdf.getTextWidth(line);
      const centerX = x + (width - textWidth) / 2;
      pdf.text(line, centerX, currentY + (productFontSize * 0.8));
      currentY += productFontSize * lineSpacing;
    });
  }

  /**
   * Draw bottom row elements for horizontal layout
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position
   * @param {number} y - Y position  
   * @param {number} width - Available width
   * @param {number} height - Available height
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total boxes
   */
  static async drawBottomRowElements(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    // Calculate section widths for horizontal layout
    const barcodeWidth = Math.min(120, width * 0.3);
    const textBoxWidth = Math.min(100, width * 0.25);
    const rightInfoWidth = width - barcodeWidth - textBoxWidth - 20; // 20pt gaps
    
    let currentX = x;
    
    // 1. Barcode section (left)
    await this.drawBarcodeSection(pdf, labelData, currentX, y, barcodeWidth, height);
    currentX += barcodeWidth + 10;
    
    // 2. Text box (middle)  
    this.drawManualWritingBox(pdf, currentX, y + height - 40, textBoxWidth, 35);
    currentX += textBoxWidth + 10;
    
    // 3. Right info section (dates and boxes) - LARGER FONTS
    this.drawLargerRightInfo(pdf, labelData, currentX, y, rightInfoWidth, height, boxNumber, totalBoxes);
  }

  /**
   * Draw barcode section with display text
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Section width
   * @param {number} height - Section height
   */
  static async drawBarcodeSection(pdf, labelData, x, y, width, height) {
    const barcodeHeight = Math.min(40, height * 0.6);
    const displayHeight = 15;
    
    // Barcode display text (spaced format)
    const spacedBarcodeDisplay = this.formatBarcodeWithSpaces(labelData.barcodeDisplay);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(102, 102, 102);
    const displayWidth = pdf.getTextWidth(spacedBarcodeDisplay);
    const displayCenterX = x + Math.max(0, (width - displayWidth) / 2);
    pdf.text(spacedBarcodeDisplay, displayCenterX, y + displayHeight);
    
    // Draw barcode
    await this.drawEnhancedBarcode(
      pdf, 
      labelData.barcode, 
      x, 
      y + displayHeight + 5, 
      width, 
      barcodeHeight
    );
  }

  /**
   * Draw vertical info section for tall labels
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Available width
   * @param {number} height - Available height
   * @param {number} boxNumber - Box number
   * @param {number} totalBoxes - Total boxes
   */
  static drawVerticalInfoSection(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    let currentY = y;
    const fontSize = 11;
    const lineHeight = fontSize * 1.3;
    
    // Harvest Date
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(fontSize);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Harvest: ${labelData.harvestDate || 'MM/DD/YYYY'}`, x, currentY + fontSize);
    currentY += lineHeight;
    
    // Packaged Date
    pdf.setFont('helvetica', 'normal');  
    pdf.text(`Packaged: ${labelData.packagedDate || 'MM/DD/YYYY'}`, x, currentY + fontSize);
    currentY += lineHeight;
    
    // Case Qty and Box info
    const boxWidth = Math.min(80, width * 0.8);
    const boxHeight = 16;
    
    // Case Qty Box
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, currentY, boxWidth, boxHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    const caseQtyValue = labelData.caseQuantity || '___';
    const caseQtyText = `Case: ${caseQtyValue}`;
    pdf.text(caseQtyText, x + 4, currentY + boxHeight - 4);
    currentY += boxHeight + 4;
    
    // Box Number Box
    pdf.rect(x, currentY, boxWidth, boxHeight);
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    pdf.text(boxText, x + 4, currentY + boxHeight - 4);
  }

  /**
   * Draw larger right side information for horizontal layout
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Available width
   * @param {number} height - Available height
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total boxes
   */
  static drawLargerRightInfo(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    let currentY = y;
    
    // Harvest Date (LARGER)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    const harvestText = `Harvest: ${labelData.harvestDate || 'MM/DD/YYYY'}`;
    pdf.text(harvestText, x, currentY + 12);
    currentY += 16;
    
    // Packaged Date (LARGER)
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    const packagedText = `Packaged: ${labelData.packagedDate || 'MM/DD/YYYY'}`;
    pdf.text(packagedText, x, currentY + 12);
    currentY += 18;
    
    // Case Qty and Box info (LARGER BOXES and TEXT)
    const boxWidth = Math.min(70, width * 0.9);
    const boxHeight = 16;
    const boxGap = 6;
    
    // Case Qty Box
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, currentY, boxWidth, boxHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    const caseQtyValue = labelData.caseQuantity || '___';
    const caseQtyText = `Case: ${caseQtyValue}`;
    pdf.text(caseQtyText, x + 4, currentY + boxHeight - 4);
    currentY += boxHeight + boxGap;
    
    // Box Number Box
    pdf.rect(x, currentY, boxWidth, boxHeight);
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    pdf.text(boxText, x + 4, currentY + boxHeight - 4);
  }

  /**
   * Format barcode display with spaces instead of hyphens
   * @param {string} barcodeDisplay - Hyphenated barcode display
   * @returns {string} - Spaced barcode display
   */
  static formatBarcodeWithSpaces(barcodeDisplay) {
    if (!barcodeDisplay) return '';
    return barcodeDisplay.replace(/-/g, ' ');
  }

  /**
   * Draw enhanced scannable barcode
   * @param {jsPDF} pdf - PDF document
   * @param {string} barcodeValue - Barcode value
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Barcode width
   * @param {number} height - Barcode height
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
        width: Math.max(2, Math.floor(width / 100)), // Responsive bar width
        height: height * 2,
        displayValue: false,
        margin: 0,
        background: '#ffffff',
        lineColor: '#000000'
      });

      const barcodeDataURL = canvas.toDataURL('image/png');
      pdf.addImage(barcodeDataURL, 'PNG', x, y, width, height);

    } catch (error) {
      console.error('Enhanced barcode generation error:', error);
      this.drawBarcodeError(pdf, x, y, width, height);
    }
  }

  /**
   * Draw text box for manual writing
   * @param {jsPDF} pdf - PDF document
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Box width
   * @param {number} height - Box height
   */
  static drawManualWritingBox(pdf, x, y, width, height) {
    // Draw box border
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, y, width, height);

    // Add grid lines
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.5);
    
    const lineSpacing = height / 3;
    for (let i = 1; i < 3; i++) {
      const lineY = y + (i * lineSpacing);
      pdf.line(x, lineY, x + width, lineY);
    }
  }

  /**
   * Draw audit trail
   * @param {jsPDF} pdf - PDF document
   * @param {string} currentUser - Current user
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  static drawAuditTrail(pdf, currentUser, x, y) {
    const now = new Date();
    const estOffset = -5;
    const estTime = new Date(now.getTime() + (estOffset * 60 * 60 * 1000));
    
    const month = (estTime.getMonth() + 1).toString().padStart(2, '0');
    const day = estTime.getDate().toString().padStart(2, '0');
    const year = estTime.getFullYear().toString().slice(-2);
    
    let hours = estTime.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = hours.toString();
    
    const minutes = estTime.getMinutes().toString().padStart(2, '0');
    
    const auditString = `${month}/${day}/${year} ${hoursStr}:${minutes} ${ampm} EST (${currentUser})`;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(102, 102, 102);
    pdf.text(auditString, x, y);
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
   * Generate test PDF for S-5492 verification and alignment checking
   * @returns {Promise<Blob>} - Test PDF blob
   */
  static async generateTestPDF() {
    const testData = [{
      sku: 'TEST-S5492-001',
      barcode: 'TEST123456',
      productName: 'Curaleaf Pink Champagne Premium Cannabis Capsules [10mg THC] 30-Count Bottle',
      brand: 'Test Brand',
      enhancedData: {
        labelQuantity: 4,
        caseQuantity: '48',
        boxCount: '2',
        harvestDate: '01/15/2025',
        packagedDate: '02/20/2025'
      },
      user: 'TestUser'
    }];

    return this.generateLabels(testData, { debug: true, currentUser: 'TestUser' });
  }

  /**
   * Generate alignment test PDF with measurement guides
   * @returns {Promise<Blob>} - Alignment test PDF
   */
  static async generateAlignmentTestPDF() {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt', 
      format: [612, 1008] // Legal size
    });

    // Draw page outline
    pdf.setDrawColor(0, 0, 255);
    pdf.setLineWidth(1);
    pdf.rect(12, 12, 588, 984); // Printable area

    // Draw measurement guides
    pdf.setDrawColor(128, 128, 128);
    pdf.setLineWidth(0.5);
    
    // Horizontal guides every inch
    for (let i = 72; i < 1008; i += 72) {
      pdf.line(0, i, 612, i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`${Math.round(i/72)}"`, 5, i - 2);
    }
    
    // Vertical guides every inch
    for (let i = 72; i < 612; i += 72) {
      pdf.line(i, 0, i, 1008);
      pdf.text(`${Math.round(i/72)}"`, i + 2, 15);
    }

    // Draw all 4 label positions
    for (let i = 0; i < 4; i++) {
      const pos = this.calculateUlineS5492Position(i);
      
      // Label outline
      pdf.setDrawColor(255, 0, 0);
      pdf.setLineWidth(2);
      pdf.rect(pos.x, pos.y, pos.width, pos.height);
      
      // Label info
      pdf.setFontSize(12);
      pdf.setTextColor(255, 0, 0);
      pdf.text(`Label ${i + 1}`, pos.x + 10, pos.y + 20);
      pdf.text(`${pos.width.toFixed(0)} × ${pos.height.toFixed(0)} pt`, pos.x + 10, pos.y + 35);
      pdf.text(`${(pos.width/72).toFixed(2)}" × ${(pos.height/72).toFixed(2)}"`, pos.x + 10, pos.y + 50);
    }

    // Title
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Uline S-5492 Alignment Test - Legal Size (8.5" × 14")', 50, 40);

    return pdf.output('blob');
  }

  /**
   * Validation method for label data
   * @param {Array} labelDataArray - Label data to validate
   * @returns {Object} - Validation result
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

    const specs = LabelFormatter.getLabelSpecs();

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalLabels,
      estimatedPages: Math.ceil(totalLabels / specs.LABELS_PER_SHEET),
      labelFormat: 'S-5492',
      pageSize: 'Legal (8.5" × 14")',
      labelsPerPage: specs.LABELS_PER_SHEET
    };
  }

  /**
   * Get debug information about the S-5492 migration
   * @returns {Object} - Debug information
   */
  static getDebugInfo() {
    const specs = LabelFormatter.getLabelSpecs();
    const positions = [];

    for (let i = 0; i < specs.LABELS_PER_SHEET; i++) {
      positions.push({
        index: i,
        standard: this.calculateUlineS5492Position(i),
        precise: this.calculateUlineS5492PositionPrecise(i)
      });
    }

    return {
      migration: {
        from: 'S-21846 (7.75" × 4.75", 2 per sheet)',
        to: 'S-5492 (6" × 4" horizontal, 4 per sheet)',
        pageSize: 'Legal (8.5" × 14")',
        status: 'Complete'
      },
      pageSize: { width: 612, height: 1008 },
      printableArea: { width: 588, height: 984 },
      labelSpecs: specs,
      positioning: {
        methods: ['standard', 'precise'],
        totalLabelsPerSheet: specs.LABELS_PER_SHEET,
        positions: positions
      },
      features: {
        brandDetection: 'Automatic separation of known cannabis brands',
        massiveFonts: 'Product names up to 40pt for visibility',
        horizontalLayout: 'Optimized for 6" wide × 4" tall labels',
        bottomFocused: 'Important info in easily accessible bottom section',
        legalSize: 'Full legal size sheet utilization'
      },
      validation: {
        physicalAlignment: 'Designed for exact Uline S-5492 perforation alignment',
        printerCompatibility: 'HP E877 with 0.167" margins',
        printSettings: 'Actual Size (no scaling) recommended'
      }
    };
  }

  // Legacy method compatibility
  static calculateUlineLabelPosition(labelIndex) {
    return this.calculateUlineS5492Position(labelIndex % 4);
  }

  static calculateUlineS21846Position(labelIndex) {
    return this.calculateUlineS5492Position(labelIndex % 4);
  }
}