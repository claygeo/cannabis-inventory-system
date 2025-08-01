// COMPREHENSIVE IMPORT STRATEGY - Try multiple approaches
import { jsPDF } from 'jspdf';
// Try to import additional modules that might contain transformations
import 'jspdf/dist/jspdf.es.min.js';

import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generation utilities for Uline S-12212 label sheets (4" × 6")
 * LANDSCAPE CONTENT OPTIMIZATION: Content designed for 6" wide × 4" tall, then rotated as complete unit
 * COMPREHENSIVE TRANSFORMATION APPROACH: Multiple methods to achieve rotation
 */
export class PDFGenerator {
  /**
   * COMPREHENSIVE DEBUG: Test all possible transformation approaches
   */
  static debugAllTransformationApproaches() {
    console.log('🔍 COMPREHENSIVE TRANSFORMATION DEBUG...');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [612, 1008]
    });
    
    console.log('📋 PDF instance:', pdf);
    console.log('📋 PDF constructor:', pdf.constructor);
    console.log('📋 PDF prototype:', Object.getPrototypeOf(pdf));
    
    // Method 1: Check standard transformation methods
    const standardMethods = ['save', 'restore', 'translate', 'rotate'];
    console.log('🔄 Standard transformation methods:');
    standardMethods.forEach(method => {
      const exists = typeof pdf[method] === 'function';
      console.log(`  - ${method}: ${typeof pdf[method]} ${exists ? '✅' : '❌'}`);
      if (exists) {
        console.log(`    Function source: ${pdf[method].toString().substring(0, 150)}...`);
      }
    });
    
    // Method 2: Check alternative method names
    const altMethods = [
      'saveState', 'restoreState', 'saveGraphicsState', 'restoreGraphicsState',
      'translatePage', 'rotatePage', 'transformPage', 'setCurrentTransformationMatrix',
      'saveGState', 'restoreGState', 'cm', 'q', 'Q'
    ];
    console.log('🔄 Alternative method names:');
    altMethods.forEach(method => {
      if (pdf[method]) {
        console.log(`  - ${method}: ${typeof pdf[method]} ✅`);
        console.log(`    Function source: ${pdf[method].toString().substring(0, 150)}...`);
      }
    });
    
    // Method 3: Check internal properties
    console.log('🔄 Internal properties:');
    if (pdf.internal) {
      console.log('  - pdf.internal exists ✅');
      console.log('  - pdf.internal keys:', Object.keys(pdf.internal));
      
      if (pdf.internal.write) {
        console.log('  - pdf.internal.write exists ✅ (raw PDF commands)');
      }
      
      if (pdf.internal.getCurrentPageInfo) {
        console.log('  - pdf.internal.getCurrentPageInfo exists ✅');
      }
    }
    
    // Method 4: Check for transformation matrix support
    if (pdf.setCurrentTransformationMatrix || pdf.internal?.write) {
      console.log('✅ Matrix transformation approach available');
    }
    
    // Method 5: Check window global
    if (typeof window !== 'undefined' && window.jspdf) {
      console.log('🌐 Window global jsPDF:', window.jspdf);
    }
    
    return pdf;
  }

  /**
   * ATTEMPT: Use raw PDF commands for transformation
   */
  static async testRawPDFCommands() {
    console.log('🧪 Testing raw PDF transformation commands...');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [612, 1008]
    });
    
    try {
      // Method 1: Try using internal write to add raw PDF commands
      if (pdf.internal && pdf.internal.write) {
        console.log('✅ Using raw PDF commands');
        
        // Raw PDF commands for transformation
        // q = save graphics state, Q = restore graphics state
        // cm = concatenate matrix (for transformations)
        
        // Save graphics state
        pdf.internal.write('q');
        
        // Move coordinates and rotate (translate to center, rotate 90°, translate back)
        const centerX = 144; // 2" from left
        const centerY = 216; // 3" from top
        
        // Transformation matrix for 90° rotation around center point
        // Format: a b c d e f cm (where matrix = [a b c d e f])
        // For 90° rotation: [0 1 -1 0 tx ty]
        const a = 0, b = 1, c = -1, d = 0;
        const e = centerX + centerY; // tx
        const f = centerY - centerX; // ty
        
        pdf.internal.write(`${a} ${b} ${c} ${d} ${e} ${f} cm`);
        
        // Draw some test content
        pdf.setFontSize(20);
        pdf.text('ROTATED TEST', 0, 20);
        
        // Restore graphics state
        pdf.internal.write('Q');
        
        console.log('✅ Raw PDF commands executed successfully');
        return pdf.output('blob');
      }
      
      // Method 2: Try matrix transformation if available
      if (pdf.setCurrentTransformationMatrix) {
        console.log('✅ Using setCurrentTransformationMatrix');
        
        // Create transformation matrix for 90° rotation
        const matrix = [0, 1, -1, 0, 300, 200]; // [a, b, c, d, e, f]
        pdf.setCurrentTransformationMatrix(matrix);
        
        pdf.setFontSize(20);
        pdf.text('MATRIX ROTATED TEST', 0, 20);
        
        console.log('✅ Matrix transformation executed successfully');
        return pdf.output('blob');
      }
      
      console.log('❌ No transformation methods available');
      return null;
      
    } catch (error) {
      console.error('❌ Raw PDF commands failed:', error);
      throw error;
    }
  }

  /**
   * ENHANCED: Manual coordinate calculation for perfect landscape positioning
   */
  static calculateManualLandscapePositions(labelIndex, contentType, x, y, width, height) {
    console.log(`🧮 Calculating manual landscape positions for label ${labelIndex}, content: ${contentType}`);
    
    // Simulate rotating the content area 90° clockwise
    // Original: 4" wide × 6" tall (288pt × 432pt)
    // Rotated: 6" wide × 4" tall (432pt × 288pt)
    
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    
    // Content dimensions when "rotated"
    const contentWidth = height; // 432pt (6" wide in landscape)
    const contentHeight = width;  // 288pt (4" tall in landscape)
    
    const padding = 15;
    const usableWidth = contentWidth - (padding * 2);   // 402pt
    const usableHeight = contentHeight - (padding * 2); // 258pt
    
    // Section heights (landscape orientation)
    const topSectionHeight = Math.floor(usableHeight * 0.35);     // ~90pt
    const middleSectionHeight = Math.floor(usableHeight * 0.35);  // ~90pt
    const bottomSectionHeight = usableHeight - topSectionHeight - middleSectionHeight; // ~78pt
    
    // Calculate positions as if content is landscape, then position in portrait label
    const positions = {};
    
    switch (contentType) {
      case 'brand':
        // Brand at top-center of landscape layout
        positions.x = centerX;
        positions.y = y + padding + 30;
        positions.align = 'center';
        positions.maxWidth = usableWidth * 0.8;
        break;
        
      case 'product':
        // Product name centered in top section
        positions.x = centerX;
        positions.y = y + padding + 60;
        positions.align = 'center';
        positions.maxWidth = usableWidth * 0.9;
        positions.maxLines = 3;
        break;
        
      case 'store-label':
        // "Store:" label positioned above textbox
        positions.x = x + padding + 20;
        positions.y = y + padding + topSectionHeight + 25;
        positions.align = 'left';
        break;
        
      case 'store-box':
        // Store textbox centered in middle section
        positions.x = centerX - (Math.min(usableWidth * 0.7, 280) / 2);
        positions.y = y + padding + topSectionHeight + 35;
        positions.width = Math.min(usableWidth * 0.7, 280);
        positions.height = 50;
        break;
        
      case 'barcode-numeric':
        // Barcode numeric above barcode in left column
        const col1X = x + padding + (usableWidth / 6);
        positions.x = col1X;
        positions.y = y + padding + topSectionHeight + middleSectionHeight + 15;
        positions.align = 'center';
        break;
        
      case 'barcode':
        // Barcode image in left column
        positions.x = col1X - 55; // Center 110px wide barcode
        positions.y = y + padding + topSectionHeight + middleSectionHeight + 20;
        positions.width = 110;
        positions.height = 50;
        break;
        
      case 'dates':
        // Dates in center column
        const col2X = x + padding + (usableWidth / 2);
        positions.x = col2X;
        positions.y = y + padding + topSectionHeight + middleSectionHeight + 20;
        positions.align = 'center';
        positions.spacing = 18;
        break;
        
      case 'case-box':
        // Case/Box in right column with textboxes
        const col3X = x + padding + (usableWidth * 5/6);
        positions.x = col3X - 40; // Center 80px wide boxes
        positions.y = y + padding + topSectionHeight + middleSectionHeight + 15;
        positions.width = 80;
        positions.height = 20;
        positions.spacing = 25;
        break;
        
      case 'audit':
        // Audit trail at bottom-left
        positions.x = x + padding;
        positions.y = y + height - 15;
        positions.align = 'left';
        break;
        
      default:
        positions.x = centerX;
        positions.y = centerY;
        positions.align = 'center';
    }
    
    console.log(`📍 ${contentType} positions:`, positions);
    return positions;
  }

  /**
   * PERFECT LANDSCAPE CONTENT: Manual positioning approach
   */
  static async drawPerfectLandscapeContent(pdf, labelData, x, y, width, height, boxNumber, totalBoxes, currentUser, debug) {
    console.log('🎨 Drawing PERFECT landscape content with manual positioning...');
    
    // Extract brand info
    const brandInfo = this.extractBrandFromProductName(labelData.productName);
    
    // Brand name - perfectly positioned for landscape feel
    if (brandInfo.brand) {
      const brandPos = this.calculateManualLandscapePositions(0, 'brand', x, y, width, height);
      const brandFontSize = Math.min(24, Math.max(16, 28 - Math.floor(brandInfo.brand.length / 4)));
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(brandFontSize);
      pdf.setTextColor(44, 85, 48);
      pdf.text(brandInfo.brand, brandPos.x, brandPos.y, { align: brandPos.align });
    }
    
    // Product name - centered with optimal spacing
    const productPos = this.calculateManualLandscapePositions(0, 'product', x, y, width, height);
    const productFontSize = this.calculateOptimalProductFontSize(brandInfo.productName, productPos.maxWidth);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(productFontSize);
    pdf.setTextColor(0, 0, 0);
    
    const productLines = this.wrapTextOptimal(brandInfo.productName, productPos.maxWidth, productFontSize);
    productLines.forEach((line, index) => {
      if (index < productPos.maxLines) {
        pdf.text(line, productPos.x, productPos.y + (index * (productFontSize + 4)), { align: productPos.align });
      }
    });
    
    // Store section - "Store:" label above centered textbox
    const storeLabelPos = this.calculateManualLandscapePositions(0, 'store-label', x, y, width, height);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Store:', storeLabelPos.x, storeLabelPos.y, { align: storeLabelPos.align });
    
    const storeBoxPos = this.calculateManualLandscapePositions(0, 'store-box', x, y, width, height);
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(2);
    pdf.rect(storeBoxPos.x, storeBoxPos.y, storeBoxPos.width, storeBoxPos.height);
    
    // Writing lines in store box
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    for (let i = 1; i < 3; i++) {
      const lineY = storeBoxPos.y + (i * (storeBoxPos.height / 3));
      pdf.line(storeBoxPos.x + 8, lineY, storeBoxPos.x + storeBoxPos.width - 8, lineY);
    }
    
    // Bottom section - 3 columns with perfect landscape spacing
    
    // Column 1: Barcode with numeric above (larger)
    const barcodeNumericPos = this.calculateManualLandscapePositions(0, 'barcode-numeric', x, y, width, height);
    const spacedBarcodeDisplay = this.formatBarcodeWithSpaces(labelData.barcodeDisplay);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(102, 102, 102);
    pdf.text(spacedBarcodeDisplay, barcodeNumericPos.x, barcodeNumericPos.y, { align: barcodeNumericPos.align });
    
    const barcodePos = this.calculateManualLandscapePositions(0, 'barcode', x, y, width, height);
    await this.drawEnhancedBarcode(pdf, labelData.barcode, barcodePos.x, barcodePos.y, barcodePos.width, barcodePos.height);
    
    // Column 2: Dates - perfectly centered
    const datesPos = this.calculateManualLandscapePositions(0, 'dates', x, y, width, height);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Harvest:', datesPos.x, datesPos.y, { align: datesPos.align });
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(13);
    const harvestDate = labelData.harvestDate || 'MM/DD/YY';
    pdf.text(harvestDate, datesPos.x, datesPos.y + datesPos.spacing, { align: datesPos.align });
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Package:', datesPos.x, datesPos.y + (datesPos.spacing * 2), { align: datesPos.align });
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(13);
    const packageDate = labelData.packagedDate || 'MM/DD/YY';
    pdf.text(packageDate, datesPos.x, datesPos.y + (datesPos.spacing * 3), { align: datesPos.align });
    
    // Column 3: Case/Box with textboxes
    const casePos = this.calculateManualLandscapePositions(0, 'case-box', x, y, width, height);
    
    // Case textbox
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(casePos.x, casePos.y, casePos.width, casePos.height);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    const caseQtyValue = labelData.caseQuantity || '___';
    pdf.text(`Case: ${caseQtyValue}`, casePos.x + casePos.width/2, casePos.y + 14, { align: 'center' });
    
    // Box textbox
    pdf.rect(casePos.x, casePos.y + casePos.spacing, casePos.width, casePos.height);
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    pdf.text(boxText, casePos.x + casePos.width/2, casePos.y + casePos.spacing + 14, { align: 'center' });
    
    // Audit trail - bottom left
    const auditPos = this.calculateManualLandscapePositions(0, 'audit', x, y, width, height);
    const auditLine = this.generateAuditLine(currentUser);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(102, 102, 102);
    pdf.text(auditLine, auditPos.x, auditPos.y, { align: auditPos.align });
    
    if (debug) {
      // Debug: Show the "landscape" content area
      pdf.setDrawColor(0, 255, 0);
      pdf.setLineWidth(1);
      pdf.rect(x + 15, y + 15, height - 30, width - 30); // Swapped dimensions to show landscape area
    }
    
    console.log('✅ Perfect landscape content completed');
  }

  /**
   * Calculate optimal product font size for available space
   */
  static calculateOptimalProductFontSize(text, availableWidth) {
    if (!text) return 20;
    
    const length = text.length;
    let fontSize = 22; // Larger starting size for landscape feel
    
    // Adjust based on text length
    if (length > 80) fontSize = 16;
    else if (length > 60) fontSize = 17;
    else if (length > 40) fontSize = 18;
    else if (length > 25) fontSize = 19;
    else if (length > 15) fontSize = 21;
    
    // Check if it fits in available space
    const estimatedWidth = length * (fontSize * 0.6);
    if (estimatedWidth > availableWidth) {
      fontSize = Math.max(14, Math.floor((availableWidth / length) * 1.4));
    }
    
    return Math.min(fontSize, 22);
  }

  /**
   * Optimal text wrapping for landscape layout
   */
  static wrapTextOptimal(text, maxWidth, fontSize) {
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
   * Generate PDF with labels positioned for Uline S-12212 sheets
   */
  static async generateLabels(labelDataArray, options = {}) {
    console.log('🏷️ Starting COMPREHENSIVE PDF generation with multiple approaches...');
    console.log('📋 Label data array length:', labelDataArray.length);
    
    const {
      format = 'legal',
      orientation = 'portrait',
      debug = false,
      currentUser = 'Unknown'
    } = options;

    // Comprehensive debugging first
    if (debug) {
      this.debugAllTransformationApproaches();
      await this.testRawPDFCommands();
    }

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

          // Draw the label using the BEST available method
          await this.drawLabelWithBestMethod(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
      }

      console.log(`✅ Generated ${currentLabelIndex} labels across ${currentPage} pages`);

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-12212 Format Labels (Perfect Landscape Content)',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v8.4.0',
        keywords: 'cannabis, inventory, labels, uline, s-12212, perfect-landscape, comprehensive-approach'
      });

      return pdf.output('blob');

    } catch (error) {
      console.error('❌ PDF generation error:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Draw label using the best available transformation method
   */
  static async drawLabelWithBestMethod(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    console.log(`🎨 Drawing label using BEST available method...`);
    
    const { x, y, width, height } = position;

    try {
      // Draw label border
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(1);
      pdf.rect(x, y, width, height);

      // Debug connected sides
      if (debug) {
        pdf.setDrawColor(0, 255, 0);
        pdf.setLineWidth(2);
        position.connectedSides.forEach(side => {
          switch (side) {
            case 'top': pdf.line(x, y, x + width, y); break;
            case 'right': pdf.line(x + width, y, x + width, y + height); break;
            case 'bottom': pdf.line(x, y + height, x + width, y + height); break;
            case 'left': pdf.line(x, y, x, y + height); break;
          }
        });
      }

      // Try Method 1: Raw PDF commands
      if (pdf.internal && pdf.internal.write) {
        console.log('🔄 Attempting Method 1: Raw PDF commands');
        
        try {
          await this.drawWithRawPDFCommands(pdf, labelData, position, boxNumber, totalBoxes, currentUser, debug);
          console.log('✅ Method 1 successful: Raw PDF commands');
          return;
        } catch (error) {
          console.log('❌ Method 1 failed:', error.message);
        }
      }

      // Try Method 2: Matrix transformations
      if (pdf.setCurrentTransformationMatrix) {
        console.log('🔄 Attempting Method 2: Matrix transformations');
        
        try {
          await this.drawWithMatrixTransform(pdf, labelData, position, boxNumber, totalBoxes, currentUser, debug);
          console.log('✅ Method 2 successful: Matrix transformations');
          return;
        } catch (error) {
          console.log('❌ Method 2 failed:', error.message);
        }
      }

      // Method 3: Perfect manual positioning (our best fallback)
      console.log('🔄 Using Method 3: Perfect manual landscape positioning');
      await this.drawPerfectLandscapeContent(pdf, labelData, x, y, width, height, boxNumber, totalBoxes, currentUser, debug);
      console.log('✅ Method 3 successful: Perfect manual positioning');

    } catch (error) {
      console.error('❌ All methods failed:', error);
      
      // Emergency fallback
      pdf.setFontSize(10);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Error', x + 5, y + 20);
    }
  }

  /**
   * Method 1: Draw using raw PDF commands
   */
  static async drawWithRawPDFCommands(pdf, labelData, position, boxNumber, totalBoxes, currentUser, debug) {
    const { x, y, width, height } = position;
    
    // Save graphics state
    pdf.internal.write('q');
    
    // Calculate transformation for 90° rotation around label center
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    
    // Transformation matrix for 90° clockwise rotation
    // Matrix format: [a b c d e f] where:
    // a c e     cos(θ) -sin(θ) tx
    // b d f  =  sin(θ)  cos(θ) ty
    // 0 0 1     0      0      1
    
    const angle = Math.PI / 2; // 90° in radians
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    // For rotation around center point
    const a = cos;   // 0
    const b = sin;   // 1
    const c = -sin;  // -1
    const d = cos;   // 0
    const e = centerX - (a * centerX + c * centerY); // tx
    const f = centerY - (b * centerX + d * centerY); // ty
    
    // Apply transformation matrix
    pdf.internal.write(`${a} ${b} ${c} ${d} ${e} ${f} cm`);
    
    // Now draw content in landscape coordinates
    const contentWidth = height; // 432pt (6" wide in landscape)
    const contentHeight = width;  // 288pt (4" tall in landscape)
    
    await this.drawLandscapeContent(pdf, labelData, contentWidth, contentHeight, boxNumber, totalBoxes, currentUser, debug);
    
    // Restore graphics state
    pdf.internal.write('Q');
  }

  /**
   * Method 2: Draw using matrix transformations
   */
  static async drawWithMatrixTransform(pdf, labelData, position, boxNumber, totalBoxes, currentUser, debug) {
    const { x, y, width, height } = position;
    
    // Calculate transformation matrix for 90° rotation around center
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    
    // 90° clockwise rotation matrix
    const matrix = [0, 1, -1, 0, centerX + centerY, centerY - centerX];
    
    // Apply matrix transformation
    pdf.setCurrentTransformationMatrix(matrix);
    
    // Draw content in landscape coordinates
    const contentWidth = height; // 432pt
    const contentHeight = width;  // 288pt
    
    await this.drawLandscapeContent(pdf, labelData, contentWidth, contentHeight, boxNumber, totalBoxes, currentUser, debug);
    
    // Reset transformation matrix
    pdf.setCurrentTransformationMatrix([1, 0, 0, 1, 0, 0]);
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
      optimalSpaceUsage: true
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
   * Generate test PDF - Creates 4 different labels
   */
  static async generateTestPDF() {
    console.log('🧪 Generating COMPREHENSIVE test PDF with all transformation approaches...');
    
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

  // Include the drawLandscapeContent method from previous version for compatibility
  static async drawLandscapeContent(pdf, labelData, width, height, boxNumber, totalBoxes, currentUser, debug) {
    // This is a simplified version for transformation methods
    // The main content drawing is handled by drawPerfectLandscapeContent
    console.log(`🎨 Drawing simple landscape content for transformation - ${width}x${height}pt`);
    
    const padding = 15;
    const brandInfo = this.extractBrandFromProductName(labelData.productName);
    
    // Simple content for transformation context
    let currentY = padding + 20;
    
    // Brand
    if (brandInfo.brand) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(24);
      pdf.setTextColor(44, 85, 48);
      pdf.text(brandInfo.brand, width / 2, currentY, { align: 'center' });
      currentY += 30;
    }
    
    // Product
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(0, 0, 0);
    const lines = this.wrapTextOptimal(brandInfo.productName, width - 40, 18);
    lines.forEach(line => {
      pdf.text(line, width / 2, currentY, { align: 'center' });
      currentY += 22;
    });
    
    // Store
    currentY += 20;
    pdf.setFontSize(14);
    pdf.text('Store:', padding, currentY);
    pdf.rect(padding + 50, currentY - 10, width - 100, 30);
    
    // Bottom info
    currentY += 50;
    pdf.setFontSize(12);
    pdf.text(`Harvest: ${labelData.harvestDate || 'MM/DD/YY'}`, padding, currentY);
    pdf.text(`Case: ${labelData.caseQuantity || '___'}`, width - 80, currentY);
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
      labelFormat: 'Uline S-12212 (Perfect Landscape Content - Comprehensive Approach)',
      approach: 'Multiple transformation methods with perfect manual positioning fallback'
    };
  }
}