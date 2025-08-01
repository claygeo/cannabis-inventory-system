// DIRECT PORTRAIT DRAWING PDF GENERATOR - Exact HTML Visualization Replication
import { jsPDF } from 'jspdf';
import 'jspdf/dist/jspdf.es.min.js';

import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generation using Direct Portrait Drawing approach
 * No coordinate transformations - calculate exact positions and draw directly
 * Replicates HTML visualization exactly with individual element positioning
 */
export class PDFGenerator {
  /**
   * Generate PDF with labels positioned for Uline S-12212 sheets
   */
  static async generateLabels(labelDataArray, options = {}) {
    console.log('🏷️ Starting DIRECT PORTRAIT DRAWING PDF generation...');
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

          // Draw the label using DIRECT PORTRAIT DRAWING
          await this.drawLabelWithDirectPortraitDrawing(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
      }

      console.log(`✅ Generated ${currentLabelIndex} labels across ${currentPage} pages`);

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-12212 Format Labels (Direct Portrait Drawing)',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v8.5.0',
        keywords: 'cannabis, inventory, labels, uline, s-12212, direct-drawing, portrait-positioning'
      });

      return pdf.output('blob');

    } catch (error) {
      console.error('❌ PDF generation error:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * DIRECT PORTRAIT DRAWING: Draw label by calculating exact positions for each element
   */
  static async drawLabelWithDirectPortraitDrawing(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    console.log(`🎨 Drawing label with DIRECT PORTRAIT DRAWING...`);
    
    const { x, y, width, height } = position;

    try {
      // Draw label border
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(1);
      pdf.rect(x, y, width, height);

      // Debug border if requested
      if (debug) {
        pdf.setDrawColor(255, 0, 0);
        pdf.setLineWidth(0.5);
        pdf.rect(x + 2, y + 2, width - 4, height - 4);
      }

      // Calculate landscape content positioning within portrait label
      await this.drawLandscapeContentUsingDirectPositioning(pdf, labelData, position, boxNumber, totalBoxes, currentUser, debug);
      
      console.log('✅ Direct portrait drawing successful');

    } catch (error) {
      console.error('❌ Direct portrait drawing failed:', error);
      
      // Emergency fallback
      pdf.setFontSize(12);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Error', x + 5, y + 20);
    }
  }

  /**
   * Draw landscape content using direct positioning calculations
   * Replicates the HTML visualization exactly
   */
  static async drawLandscapeContentUsingDirectPositioning(pdf, labelData, position, boxNumber, totalBoxes, currentUser, debug) {
    console.log(`🎨 Drawing landscape content using direct positioning calculations`);
    
    const { x, y, width, height } = position;
    
    // Extract brand info
    const brandInfo = this.extractBrandFromProductName(labelData.productName);
    
    // Calculate content area (landscape: 6" wide × 4" tall when rotated)
    const landscapeWidth = height;  // 432pt (6" when rotated)
    const landscapeHeight = width;  // 288pt (4" when rotated)
    const padding = 15;
    
    // Content sections (percentages from HTML visualization)
    const topSectionHeight = Math.floor((landscapeHeight - padding * 2) * 0.35);    // 35%
    const middleSectionHeight = Math.floor((landscapeHeight - padding * 2) * 0.35); // 35%
    const bottomSectionHeight = (landscapeHeight - padding * 2) - topSectionHeight - middleSectionHeight; // 30%
    
    // Calculate center points and positioning anchors
    const labelCenterX = x + width / 2;
    const labelCenterY = y + height / 2;
    
    // TOP SECTION: Brand Name + Product Name (CENTERED)
    let contentYOffset = -landscapeHeight / 2 + padding + 20; // Start from top of landscape area
    
    // Brand Name - CENTERED and ROTATED 90° clockwise
    if (brandInfo.brand) {
      const brandFontSize = Math.min(24, Math.max(16, 28 - Math.floor(brandInfo.brand.length / 4)));
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(brandFontSize);
      pdf.setTextColor(44, 85, 48); // Dark green
      
      // Position: Center of label, rotated 90° clockwise
      pdf.text(brandInfo.brand, labelCenterX, labelCenterY + contentYOffset, { 
        angle: 90, 
        align: 'center' 
      });
      
      contentYOffset += brandFontSize + 8;
    }
    
    // Product Name - CENTERED and ROTATED 90° clockwise with line wrapping
    const productFontSize = this.calculateOptimalFontSize(brandInfo.productName, landscapeWidth * 0.9, 28, 14);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(productFontSize);
    pdf.setTextColor(0, 0, 0);
    
    const productLines = this.wrapText(brandInfo.productName, landscapeWidth * 0.9, productFontSize);
    productLines.slice(0, 3).forEach((line, index) => {
      pdf.text(line, labelCenterX, labelCenterY + contentYOffset + (index * (productFontSize + 2)), { 
        angle: 90, 
        align: 'center' 
      });
    });
    
    // MIDDLE SECTION: Store Label + Textbox
    const storeYOffset = -landscapeHeight / 2 + padding + topSectionHeight + 25;
    
    // "Store:" label - positioned above textbox (rotated 90°)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    
    // Position Store label above and to the left of the textbox area
    const storeLabelX = labelCenterX - 60; // Offset to left of textbox
    pdf.text('Store:', storeLabelX, labelCenterY + storeYOffset, { 
      angle: 90, 
      align: 'left' 
    });
    
    // Store textbox - CENTERED (landscape coordinates converted to portrait)
    const storeBoxWidth = Math.min(landscapeWidth * 0.7, 300);  // 300pt max width
    const storeBoxHeight = 45;
    
    // Calculate textbox position (centered in landscape view, converted to portrait coordinates)
    const storeBoxX = labelCenterX - storeBoxHeight / 2; // In portrait, height becomes width
    const storeBoxY = labelCenterY + storeYOffset + 10;
    const storeBoxPortraitWidth = storeBoxHeight;  // Rotated dimensions
    const storeBoxPortraitHeight = storeBoxWidth;
    
    // Draw main textbox (rotated rectangle)
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(2);
    pdf.rect(storeBoxX, storeBoxY, storeBoxPortraitWidth, storeBoxPortraitHeight);
    
    // Draw writing lines inside textbox (rotated)
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    const lineSpacing = storeBoxPortraitHeight / 3;
    for (let i = 1; i < 3; i++) {
      const lineY = storeBoxY + (i * lineSpacing);
      pdf.line(storeBoxX + 4, lineY, storeBoxX + storeBoxPortraitWidth - 4, lineY);
    }
    
    // BOTTOM SECTION: Three-column layout (Barcode | Dates | Case/Box)
    const bottomYOffset = -landscapeHeight / 2 + padding + topSectionHeight + middleSectionHeight + 15;
    const columnWidth = landscapeWidth / 3;
    
    // Column 1: Barcode with numeric display ABOVE barcode
    const col1XOffset = -landscapeWidth / 2 + padding + (columnWidth / 2);
    
    // Barcode numeric display (ABOVE barcode, rotated 90°)
    const spacedBarcodeDisplay = this.formatBarcodeWithSpaces(labelData.barcodeDisplay);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(102, 102, 102);
    
    pdf.text(spacedBarcodeDisplay, labelCenterX + col1XOffset, labelCenterY + bottomYOffset, { 
      angle: 90, 
      align: 'center' 
    });
    
    // Barcode image (LARGER size: 120×50pt landscape = 50×120pt portrait)
    const barcodeWidthLandscape = 120;
    const barcodeHeightLandscape = 50;
    const barcodeXPortrait = labelCenterX + col1XOffset - barcodeHeightLandscape / 2;
    const barcodeYPortrait = labelCenterY + bottomYOffset + 8;
    
    await this.drawEnhancedBarcodeRotated(pdf, labelData.barcode, barcodeXPortrait, barcodeYPortrait, barcodeHeightLandscape, barcodeWidthLandscape);
    
    // Column 2: Dates (centered, rotated 90°)
    const col2XOffset = -landscapeWidth / 2 + padding + columnWidth + (columnWidth / 2);
    
    let dateYOffset = bottomYOffset;
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Harvest:', labelCenterX + col2XOffset, labelCenterY + dateYOffset, { 
      angle: 90, 
      align: 'center' 
    });
    
    dateYOffset += 18;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(13);
    const harvestDate = labelData.harvestDate || 'MM/DD/YY';
    pdf.text(harvestDate, labelCenterX + col2XOffset, labelCenterY + dateYOffset, { 
      angle: 90, 
      align: 'center' 
    });
    
    dateYOffset += 25;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Package:', labelCenterX + col2XOffset, labelCenterY + dateYOffset, { 
      angle: 90, 
      align: 'center' 
    });
    
    dateYOffset += 18;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(13);
    const packageDate = labelData.packagedDate || 'MM/DD/YY';
    pdf.text(packageDate, labelCenterX + col2XOffset, labelCenterY + dateYOffset, { 
      angle: 90, 
      align: 'center' 
    });
    
    // Column 3: Case/Box with TEXTBOXES (as requested)
    const col3XOffset = -landscapeWidth / 2 + padding + (columnWidth * 2) + (columnWidth / 2);
    
    let caseYOffset = bottomYOffset;
    
    // Case textbox (with border as requested)
    const caseBoxWidth = columnWidth * 0.8;
    const caseBoxHeight = 22;
    
    // Calculate rotated textbox position
    const caseBoxXPortrait = labelCenterX + col3XOffset - caseBoxHeight / 2;
    const caseBoxYPortrait = labelCenterY + caseYOffset - 3;
    
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(caseBoxXPortrait, caseBoxYPortrait, caseBoxHeight, caseBoxWidth); // Rotated dimensions
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    const caseQtyValue = labelData.caseQuantity || '___';
    pdf.text(`Case: ${caseQtyValue}`, labelCenterX + col3XOffset, labelCenterY + caseYOffset + 10, { 
      angle: 90, 
      align: 'center' 
    });
    
    caseYOffset += 28;
    
    // Box textbox (with border as requested)
    const boxBoxXPortrait = labelCenterX + col3XOffset - caseBoxHeight / 2;
    const boxBoxYPortrait = labelCenterY + caseYOffset - 3;
    
    pdf.rect(boxBoxXPortrait, boxBoxYPortrait, caseBoxHeight, caseBoxWidth); // Rotated dimensions
    
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    pdf.text(boxText, labelCenterX + col3XOffset, labelCenterY + caseYOffset + 10, { 
      angle: 90, 
      align: 'center' 
    });
    
    // Audit trail (bottom-left corner, rotated 90°)
    const auditLine = this.generateAuditLine(currentUser);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(102, 102, 102);
    
    const auditXOffset = -landscapeWidth / 2 + padding;
    const auditYOffset = landscapeHeight / 2 - 5;
    
    pdf.text(auditLine, labelCenterX + auditXOffset, labelCenterY + auditYOffset, { 
      angle: 90, 
      align: 'left' 
    });
    
    if (debug) {
      // Debug: Show landscape content area boundaries
      pdf.setDrawColor(0, 255, 0);
      pdf.setLineWidth(1);
      
      // Draw content area outline (rotated)
      const debugX = labelCenterX - landscapeHeight / 2;
      const debugY = labelCenterY - landscapeWidth / 2;
      pdf.rect(debugX, debugY, landscapeHeight, landscapeWidth);
      
      // Section divisions
      pdf.setDrawColor(0, 0, 255);
      pdf.setLineWidth(0.5);
      
      // Top section
      pdf.line(debugX + padding, debugY + padding + topSectionHeight, 
               debugX + landscapeHeight - padding, debugY + padding + topSectionHeight);
      
      // Middle section
      pdf.line(debugX + padding, debugY + padding + topSectionHeight + middleSectionHeight, 
               debugX + landscapeHeight - padding, debugY + padding + topSectionHeight + middleSectionHeight);
    }
    
    console.log('✅ Direct portrait drawing landscape content completed');
  }

  /**
   * Draw enhanced barcode in rotated position
   */
  static async drawEnhancedBarcodeRotated(pdf, barcodeValue, x, y, width, height) {
    if (!barcodeValue) return;

    try {
      const cleanBarcodeValue = barcodeValue.replace(/[^A-Za-z0-9]/g, '');
      
      const validation = BarcodeGenerator.validateCode39(cleanBarcodeValue);
      if (!validation.isValid) {
        console.warn('Invalid barcode:', validation.error);
        this.drawBarcodeErrorRotated(pdf, x, y, width, height);
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
      
      // Add rotated barcode image (90° clockwise rotation)
      pdf.addImage(barcodeDataURL, 'PNG', x, y, width, height, undefined, 'NONE', 90);

    } catch (error) {
      console.error('Barcode generation error:', error);
      this.drawBarcodeErrorRotated(pdf, x, y, width, height);
    }
  }

  /**
   * Draw barcode error placeholder (rotated)
   */
  static drawBarcodeErrorRotated(pdf, x, y, width, height) {
    pdf.setDrawColor(255, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, y, width, height);
    
    pdf.setFontSize(10);
    pdf.setTextColor(255, 0, 0);
    pdf.text('Barcode Error', x + width/2, y + height/2, { 
      angle: 90, 
      align: 'center' 
    });
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
      
      // Content design dimensions (landscape orientation)
      contentDesignWidth: labelHeight,  // 432pt (6" wide in landscape)
      contentDesignHeight: labelWidth,  // 288pt (4" tall in landscape)
      
      // Layout information
      row: row,
      col: col,
      labelIndex: labelIndex,
      
      // Connection info
      connected: true,
      connectedSides: this.getConnectedSides(labelIndex),
      
      // Method info
      method: 'direct_portrait_drawing',
      approach: 'individual_element_positioning',
      reliability: 'high'
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
   * Generate test PDF - Creates 4 different labels using direct portrait drawing
   */
  static async generateTestPDF() {
    console.log('🧪 Generating DIRECT PORTRAIT DRAWING test PDF...');
    
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
      },
      {
        sku: 'GRASSROOTS-BIRTHDAY-CAKE',
        barcode: 'GRS19873344',
        barcodeDisplay: 'GRS-1987-3344',
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
        barcodeDisplay: 'FND-1988-4455',
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
        barcodeDisplay: 'BNB-1989-5566',
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
      labelFormat: 'Uline S-12212 (Direct Portrait Drawing)',
      approach: 'Individual element positioning with exact coordinate calculations',
      method: 'direct_portrait_drawing',
      reliability: 'High - No coordinate transformations'
    };
  }
}