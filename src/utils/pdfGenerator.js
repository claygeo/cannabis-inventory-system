// FIXED IMPORT - Use named import instead of default import
import { jsPDF } from 'jspdf';
import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';
import { EVENT_TYPES } from '../constants.js';
import storage from './storage.js';

/**
 * PDF Generation utilities for Uline S-12212 label sheets (4" × 6")
 * LANDSCAPE CONTENT OPTIMIZATION: Content designed for 6" wide × 4" tall, then rotated as complete unit
 * When paper is rotated, content reads like a postcard with optimal space utilization
 */
export class PDFGenerator {
  /**
   * DEBUG: Check what methods are available on jsPDF instance
   */
  static debugJsPDFInstance() {
    console.log('🔍 Debugging jsPDF instance with FIXED import...');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [612, 1008]
    });
    
    console.log('📋 PDF instance type:', typeof pdf);
    console.log('📋 PDF constructor:', pdf.constructor.name);
    
    // Check specific transformation methods
    const transformMethods = ['save', 'restore', 'translate', 'rotate'];
    console.log('🔄 Transformation methods check with FIXED import:');
    transformMethods.forEach(method => {
      const exists = typeof pdf[method] === 'function';
      console.log(`  - ${method}: ${typeof pdf[method]} ${exists ? '✅' : '❌'}`);
      if (exists) {
        console.log(`    Function: ${pdf[method].toString().substring(0, 100)}...`);
      }
    });
    
    // Check if methods exist with different names
    const alternativeNames = [
      'saveState', 'restoreState', 'translatePage', 'rotatePage',
      'saveGraphicsState', 'restoreGraphicsState', 'setCurrentTransformationMatrix'
    ];
    console.log('🔄 Alternative method names:');
    alternativeNames.forEach(method => {
      if (pdf[method]) {
        console.log(`  - ${method}: ${typeof pdf[method]} ✅`);
      }
    });
    
    return pdf;
  }

  /**
   * TEST: Try transformation methods with fixed import
   */
  static async testTransformationMethods() {
    console.log('🧪 Testing transformation methods with FIXED import...');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [612, 1008]
    });
    
    try {
      console.log('📝 Testing transformation methods...');
      
      if (typeof pdf.save === 'function') {
        console.log('✅ pdf.save() exists - calling it...');
        pdf.save();
        
        if (typeof pdf.translate === 'function') {
          console.log('✅ pdf.translate() exists - calling it...');
          pdf.translate(100, 100);
          
          if (typeof pdf.rotate === 'function') {
            console.log('✅ pdf.rotate() exists - calling it...');
            pdf.rotate(Math.PI / 2);
            
            pdf.setFontSize(20);
            pdf.text('Test Rotated Text', 0, 0);
          }
        }
        
        if (typeof pdf.restore === 'function') {
          console.log('✅ pdf.restore() exists - calling it...');
          pdf.restore();
        }
      }
      
      console.log('✅ Transformation test completed successfully');
      return pdf.output('blob');
      
    } catch (error) {
      console.error('❌ Transformation test failed:', error);
      throw error;
    }
  }

  /**
   * DEBUGGING METHOD: Generate simple test PDF to isolate issues
   */
  static async generateDebugPDF() {
    console.log('🔍 Starting debug PDF generation...');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [612, 1008] // Legal size
    });

    try {
      // Step 1: Test basic positioning without rotation
      console.log('📍 Testing basic label positioning...');
      
      for (let i = 0; i < 4; i++) {
        const position = this.calculateUlineS12212PositionConnected(i);
        console.log(`Label ${i}:`, position);
        
        // Draw basic rectangle for each label
        pdf.setDrawColor(255, 0, 0); // Red border
        pdf.setLineWidth(2);
        pdf.rect(position.x, position.y, position.width, position.height);
        
        // Add label number
        pdf.setFontSize(20);
        pdf.setTextColor(255, 0, 0);
        pdf.text(`Label ${i + 1}`, position.x + 10, position.y + 30);
        
        // Show dimensions
        pdf.setFontSize(12);
        pdf.text(`${position.width}x${position.height}`, position.x + 10, position.y + 50);
        pdf.text(`(${position.x}, ${position.y})`, position.x + 10, position.y + 70);
      }
      
      console.log('✅ Basic positioning test complete');
      return pdf.output('blob');
      
    } catch (error) {
      console.error('❌ Debug PDF generation failed:', error);
      throw error;
    }
  }

  /**
   * DEBUGGING METHOD: Test rotation with fixed import
   */
  static async generateRotationTestPDF() {
    console.log('🔄 Testing rotation mechanics with FIXED import...');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [612, 1008]
    });

    try {
      for (let i = 0; i < 4; i++) {
        const position = this.calculateUlineS12212PositionConnected(i);
        
        // Draw label border
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(1);
        pdf.rect(position.x, position.y, position.width, position.height);
        
        // Test rotation
        console.log(`🔄 Testing rotation for label ${i}...`);
        
        if (typeof pdf.save === 'function' && typeof pdf.restore === 'function' && 
            typeof pdf.translate === 'function' && typeof pdf.rotate === 'function') {
          
          console.log('✅ All transformation methods available');
          pdf.save();
          
          const centerX = position.x + position.width / 2;
          const centerY = position.y + position.height / 2;
          
          console.log(`Label ${i} - Center: (${centerX}, ${centerY})`);
          
          pdf.translate(centerX, centerY);
          pdf.rotate(90 * Math.PI / 180);
          pdf.translate(-position.contentDesignWidth / 2, -position.contentDesignHeight / 2);
          
          // Draw rotated content area
          pdf.setDrawColor(0, 255, 0); // Green
          pdf.setLineWidth(2);
          pdf.rect(0, 0, position.contentDesignWidth, position.contentDesignHeight);
          
          // Add rotated text
          pdf.setFontSize(16);
          pdf.setTextColor(0, 255, 0);
          pdf.text(`Rotated ${i + 1}`, 20, 30);
          pdf.text(`6" wide x 4" tall`, 20, 50);
          
          pdf.restore();
          console.log(`✅ Rotation test ${i} completed`);
        } else {
          console.log('❌ Transformation methods not available');
          // Fallback: just add text without rotation
          pdf.setFontSize(16);
          pdf.setTextColor(255, 0, 0);
          pdf.text(`No Rotation ${i + 1}`, position.x + 10, position.y + 100);
        }
      }
      
      console.log('✅ Rotation test complete');
      return pdf.output('blob');
      
    } catch (error) {
      console.error('❌ Rotation test failed:', error);
      throw error;
    }
  }

  /**
   * DEBUGGING METHOD: Check positioning calculations
   */
  static debugPositions() {
    console.log('🧮 Debugging position calculations...');
    
    for (let i = 0; i < 4; i++) {
      const pos = this.calculateUlineS12212PositionConnected(i);
      
      console.log(`Label ${i}:`, {
        position: `(${pos.x}, ${pos.y})`,
        size: `${pos.width} x ${pos.height}`,
        contentSize: `${pos.contentDesignWidth} x ${pos.contentDesignHeight}`,
        row: pos.row,
        col: pos.col,
        connectedSides: pos.connectedSides
      });
      
      // Check if positions are valid
      if (pos.x < 0 || pos.y < 0) {
        console.warn(`⚠️ Label ${i} has negative position!`);
      }
      
      if (pos.x + pos.width > 612) {
        console.warn(`⚠️ Label ${i} extends beyond page width!`);
      }
      
      if (pos.y + pos.height > 1008) {
        console.warn(`⚠️ Label ${i} extends beyond page height!`);
      }
    }
    
    console.log('✅ Position debugging complete');
  }

  /**
   * Generate PDF with labels positioned for Uline S-12212 sheets
   * @param {Array} labelDataArray - Array of label data objects
   * @param {Object} options - Generation options
   * @returns {Promise<Blob>} - PDF blob
   */
  static async generateLabels(labelDataArray, options = {}) {
    console.log('🏷️ Starting PDF generation with FIXED import and options:', options);
    console.log('📋 Label data array length:', labelDataArray.length);
    
    const {
      format = 'legal',
      orientation = 'portrait',
      debug = false,
      currentUser = 'Unknown'
    } = options;

    // Debug jsPDF instance first
    if (debug) {
      this.debugJsPDFInstance();
      this.debugPositions();
    }

    // Legal size sheets for S-12212 (8.5" × 14") - USING FIXED IMPORT
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [612, 1008] // Legal size in points
    });

    console.log('📄 PDF instance created successfully with FIXED import');

    let currentLabelIndex = 0;
    let currentPage = 1;
    const specs = LabelFormatter.getLabelSpecs();

    console.log('📊 Label specs:', specs);

    try {
      // Process each label data item
      for (let dataIndex = 0; dataIndex < labelDataArray.length; dataIndex++) {
        const labelData = labelDataArray[dataIndex];
        console.log(`🏷️ Processing label data ${dataIndex + 1}/${labelDataArray.length}:`, labelData);
        
        const formattedData = LabelFormatter.formatLabelData(
          labelData,
          labelData.enhancedData || {},
          labelData.user || currentUser
        );

        console.log('📝 Formatted data:', formattedData);

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
          console.log(`📍 Label ${currentLabelIndex} position:`, position);

          // Calculate which box number this label represents
          const boxNumber = Math.floor(labelCopy / Math.max(1, Math.floor(formattedData.labelQuantity / formattedData.boxCount))) + 1;
          console.log(`📦 Box number: ${boxNumber}/${formattedData.boxCount}`);

          // Draw the label with LANDSCAPE CONTENT ROTATED AS COMPLETE UNIT
          await this.drawLandscapeContentLabel(pdf, formattedData, position, boxNumber, formattedData.boxCount, debug, currentUser);

          currentLabelIndex++;
        }
      }

      console.log(`✅ Generated ${currentLabelIndex} labels across ${currentPage} pages`);

      // Add metadata
      pdf.setDocumentProperties({
        title: `Cannabis Inventory Labels - ${new Date().toISOString().slice(0, 10)}`,
        subject: 'Uline S-12212 Format Labels (Landscape Content Rotated as Complete Unit)',
        author: 'Cannabis Inventory Management System',
        creator: 'Cannabis Inventory Management System v8.3.0',
        keywords: 'cannabis, inventory, labels, uline, s-12212, landscape-content, rotated-layout, postcard-style'
      });

      // Log generation event
      storage.addSessionEvent(
        EVENT_TYPES.LABEL_GENERATED,
        `Generated ${currentLabelIndex} S-12212 labels with landscape content optimization across ${currentPage} pages`,
        `Items: ${labelDataArray.length}, Format: Uline S-12212 (Landscape Content, Complete Unit Rotation)`
      );

      return pdf.output('blob');

    } catch (error) {
      console.error('❌ PDF generation error:', error);
      console.error('❌ Error stack:', error.stack);
      
      storage.addSessionEvent(
        EVENT_TYPES.ERROR_OCCURRED,
        `PDF generation failed: ${error.message}`,
        `Items attempted: ${labelDataArray.length}`
      );

      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Calculate label position for Uline S-12212 on legal paper - LABELS CONNECTED ON ALL SIDES
   * @param {number} labelIndex - Index of label (0-3 for 4 labels per sheet)
   * @returns {Object} - Position coordinates in points
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
      contentRotation: 90, // Entire content rotated 90° clockwise
      postcardStyle: true,
      optimalSpaceUsage: true
    };
  }

  /**
   * Get which sides of the label are connected to other labels
   * @param {number} labelIndex - Label index (0-3)
   * @returns {Array} - Array of connected sides
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
   * Draw label with LANDSCAPE CONTENT designed for 6" wide × 4" tall, rotated as complete unit
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Formatted label data
   * @param {Object} position - Label position and dimensions
   * @param {number} boxNumber - Current box number
   * @param {number} totalBoxes - Total number of boxes
   * @param {boolean} debug - Show debug borders
   * @param {string} currentUser - Current user
   */
  static async drawLandscapeContentLabel(pdf, labelData, position, boxNumber = 1, totalBoxes = 1, debug = false, currentUser = 'Unknown') {
    console.log(`🎨 Drawing landscape content label at position:`, position);
    
    const { x, y, width, height, contentDesignWidth, contentDesignHeight } = position;

    try {
      // Draw label border (connected labels)
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(1);
      pdf.rect(x, y, width, height);

      // Debug info
      if (debug) {
        pdf.setDrawColor(255, 0, 0);
        pdf.setLineWidth(0.5);
        pdf.rect(x + 2, y + 2, width - 4, height - 4);
        
        // Show connected sides
        pdf.setDrawColor(0, 255, 0);
        pdf.setLineWidth(2);
        position.connectedSides.forEach(side => {
          switch (side) {
            case 'top':
              pdf.line(x, y, x + width, y);
              break;
            case 'right':
              pdf.line(x + width, y, x + width, y + height);
              break;
            case 'bottom':
              pdf.line(x, y + height, x + width, y + height);
              break;
            case 'left':
              pdf.line(x, y, x, y + height);
              break;
          }
        });
        
        pdf.setFontSize(8);
        pdf.setTextColor(255, 0, 0);
        pdf.text(`L${position.labelIndex + 1} LANDSCAPE`, x + 5, y + 20);
      }

      // Check if transformation methods are available WITH FIXED IMPORT
      const hasTransformMethods = typeof pdf.save === 'function' && 
                                  typeof pdf.restore === 'function' && 
                                  typeof pdf.translate === 'function' && 
                                  typeof pdf.rotate === 'function';

      console.log(`🔄 Transform methods available with FIXED import: ${hasTransformMethods}`);

      if (hasTransformMethods) {
        console.log('✅ Using PDF transformations for rotation');
        
        // Save current state before rotation
        pdf.save();

        // Transform coordinate system for landscape content
        // Move to center of label, rotate 90° clockwise, then translate for content positioning
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        console.log(`📍 Transforming to center (${centerX}, ${centerY})`);
        
        pdf.translate(centerX, centerY);
        pdf.rotate(90 * Math.PI / 180); // 90° clockwise rotation
        pdf.translate(-contentDesignWidth / 2, -contentDesignHeight / 2);

        // Now draw content in landscape orientation (6" wide × 4" tall)
        await this.drawLandscapeContent(pdf, labelData, contentDesignWidth, contentDesignHeight, boxNumber, totalBoxes, currentUser, debug);

        // Restore coordinate system
        pdf.restore();
        console.log('✅ PDF transformation completed successfully');
        
      } else {
        console.log('⚠️ PDF transformations not available - using enhanced fallback method');
        
        // Enhanced fallback: Draw content designed for landscape but positioned manually
        await this.drawEnhancedFallbackContent(pdf, labelData, x, y, width, height, boxNumber, totalBoxes, currentUser, debug);
      }

    } catch (error) {
      console.error('❌ Error drawing landscape content label:', error);
      console.error('❌ Error details:', {
        position,
        labelData: labelData.productName,
        error: error.message,
        stack: error.stack
      });
      
      // Ensure we restore PDF state even on error
      if (typeof pdf.restore === 'function') {
        try {
          pdf.restore();
        } catch (restoreError) {
          console.error('❌ Error restoring PDF state:', restoreError);
        }
      }
      
      // Draw error indicator
      pdf.setFontSize(10);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Label Error', x + 5, y + 20);
      pdf.text(error.message.substring(0, 30), x + 5, y + 35);
    }
  }

  /**
   * Draw content in landscape orientation (6" wide × 4" tall)
   * This content will be rotated 90° clockwise as a complete unit
   */
  static async drawLandscapeContent(pdf, labelData, width, height, boxNumber, totalBoxes, currentUser, debug) {
    console.log(`🎨 Drawing landscape content - ${width}x${height}pt`);
    
    const padding = 15;
    const contentWidth = width - (padding * 2);    // 402pt
    const contentHeight = height - (padding * 2);  // 258pt

    // Extract brand info
    const brandInfo = this.extractBrandFromProductName(labelData.productName);
    console.log('🏷️ Brand info:', brandInfo);

    // Layout sections for landscape content (percentages from labelFormatter.js)
    const topSectionHeight = Math.floor(contentHeight * 0.35);     // ~90pt
    const middleSectionHeight = Math.floor(contentHeight * 0.35);  // ~90pt  
    const bottomSectionHeight = contentHeight - topSectionHeight - middleSectionHeight; // ~78pt

    console.log('📏 Section heights:', { topSectionHeight, middleSectionHeight, bottomSectionHeight });

    // Section 1: Brand + Product Name (Top - 35%) - CENTERED
    await this.drawLandscapeTopSection(pdf, brandInfo, padding, padding, contentWidth, topSectionHeight);

    // Section 2: Store Box (Middle - 35%) - UPDATED LAYOUT
    this.drawLandscapeStoreSection(pdf, padding, padding + topSectionHeight, contentWidth, middleSectionHeight);

    // Section 3: Bottom Info - Barcode, Dates, Case (Bottom - 30%) - UPDATED LAYOUT
    await this.drawLandscapeBottomSection(pdf, labelData, padding, padding + topSectionHeight + middleSectionHeight, contentWidth, bottomSectionHeight, boxNumber, totalBoxes);

    // Audit trail (bottom-left corner)
    this.drawLandscapeAuditTrail(pdf, currentUser, padding, padding + contentHeight - 15);

    if (debug) {
      // Debug sections
      pdf.setDrawColor(0, 0, 255);
      pdf.setLineWidth(0.5);
      pdf.rect(padding, padding, contentWidth, topSectionHeight); // Top
      pdf.rect(padding, padding + topSectionHeight, contentWidth, middleSectionHeight); // Middle
      pdf.rect(padding, padding + topSectionHeight + middleSectionHeight, contentWidth, bottomSectionHeight); // Bottom
    }

    console.log('✅ Landscape content drawing completed');
  }

  /**
   * Enhanced fallback content drawing method - mimics landscape layout as much as possible
   */
  static async drawEnhancedFallbackContent(pdf, labelData, x, y, width, height, boxNumber, totalBoxes, currentUser, debug) {
    console.log('⚠️ Drawing enhanced fallback content (landscape-inspired layout)');
    
    const padding = 20;
    
    // Extract brand info
    const brandInfo = this.extractBrandFromProductName(labelData.productName);
    
    let currentY = y + padding + 20;
    
    // Brand name - CENTERED
    if (brandInfo.brand) {
      const brandFontSize = Math.min(20, Math.max(14, 24 - Math.floor(brandInfo.brand.length / 4)));
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(brandFontSize);
      pdf.setTextColor(44, 85, 48);
      pdf.text(brandInfo.brand, x + width / 2, currentY, { align: 'center' });
      currentY += brandFontSize + 8;
    }
    
    // Product name - CENTERED with larger fonts
    const productFontSize = this.calculateFallbackProductFontSize(brandInfo.productName, width - 40);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(productFontSize);
    pdf.setTextColor(0, 0, 0);
    
    const lines = this.wrapTextForFallback(brandInfo.productName, width - 40);
    lines.forEach(line => {
      pdf.text(line, x + width / 2, currentY, { align: 'center' });
      currentY += productFontSize + 4;
    });
    
    currentY += 15;
    
    // Store section - UPDATED LAYOUT
    pdf.setFontSize(14);
    pdf.text('Store:', x + padding + 10, currentY);
    
    const storeBoxWidth = Math.min(width - 60, 200);
    const storeBoxX = x + (width - storeBoxWidth) / 2; // Center the box
    currentY += 5;
    
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(2);
    pdf.rect(storeBoxX, currentY, storeBoxWidth, 40);
    
    // Writing lines inside store box
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    const numLines = 3;
    for (let i = 1; i < numLines; i++) {
      const lineY = currentY + (i * (40 / numLines));
      pdf.line(storeBoxX + 8, lineY, storeBoxX + storeBoxWidth - 8, lineY);
    }
    
    currentY += 60;
    
    // Bottom section - 3 columns layout (mimicking landscape)
    const colWidth = (width - 40) / 3;
    const startX = x + 20;
    
    // Column 1: Barcode (larger, numeric above)
    const barcodeX = startX + colWidth / 2;
    
    // Barcode numeric ABOVE
    const spacedBarcodeDisplay = this.formatBarcodeWithSpaces(labelData.barcodeDisplay);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(102, 102, 102);
    pdf.text(spacedBarcodeDisplay, barcodeX, currentY, { align: 'center' });
    
    // Larger barcode
    const barcodeWidth = Math.min(colWidth - 10, 80);
    const barcodeHeight = 35;
    await this.drawEnhancedBarcode(pdf, labelData.barcode, barcodeX - barcodeWidth / 2, currentY + 5, barcodeWidth, barcodeHeight);
    
    // Column 2: Dates
    const datesX = startX + colWidth + colWidth / 2;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Harvest:', datesX, currentY, { align: 'center' });
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.text(labelData.harvestDate || 'MM/DD/YY', datesX, currentY + 15, { align: 'center' });
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Package:', datesX, currentY + 30, { align: 'center' });
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.text(labelData.packagedDate || 'MM/DD/YY', datesX, currentY + 45, { align: 'center' });
    
    // Column 3: Case/Box with textboxes
    const caseX = startX + (colWidth * 2);
    const caseBoxWidth = colWidth - 20;
    const boxHeight = 18;
    
    // Case textbox
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(caseX + 10, currentY - 5, caseBoxWidth, boxHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    const caseQtyValue = labelData.caseQuantity || '___';
    pdf.text(`Case: ${caseQtyValue}`, caseX + colWidth / 2, currentY + 8, { align: 'center' });
    
    // Box textbox
    pdf.rect(caseX + 10, currentY + 20, caseBoxWidth, boxHeight);
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    pdf.text(boxText, caseX + colWidth / 2, currentY + 33, { align: 'center' });
    
    // Audit trail
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
    const auditLine = `${month}/${day}/${year} ${hoursStr}:${minutes}${ampm} EST (${(currentUser || 'Unknown').substring(0, 8)})`;
    
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(auditLine, x + padding, y + height - 15);
    
    console.log('✅ Enhanced fallback content drawing completed');
  }

  /**
   * Calculate font size for fallback product names
   */
  static calculateFallbackProductFontSize(text, availableWidth) {
    if (!text) return 16;
    
    const length = text.length;
    let fontSize = 18; // Start with reasonable size for fallback
    
    // Adjust based on text length
    if (length > 80) fontSize = 12;
    else if (length > 60) fontSize = 14;
    else if (length > 40) fontSize = 15;
    else if (length > 25) fontSize = 16;
    else if (length > 15) fontSize = 17;
    
    // Check if it fits in available space
    const estimatedWidth = length * (fontSize * 0.6);
    if (estimatedWidth > availableWidth) {
      fontSize = Math.max(10, Math.floor((availableWidth / length) * 1.4));
    }
    
    return Math.min(fontSize, 18);
  }

  /**
   * Draw top section in landscape layout - Brand and Product Name (CENTERED)
   */
  static async drawLandscapeTopSection(pdf, brandInfo, x, y, width, height) {
    console.log('🎨 Drawing landscape top section');
    
    let currentY = y + 20;
    
    // Brand name (CENTERED)
    if (brandInfo.brand) {
      const brandFontSize = Math.min(28, Math.max(16, 32 - Math.floor(brandInfo.brand.length / 4)));
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(brandFontSize);
      pdf.setTextColor(44, 85, 48); // Dark green
      
      // CENTER the brand name
      pdf.text(brandInfo.brand, x + width / 2, currentY, { align: 'center' });
      currentY += brandFontSize + 10;
    }

    // Product name - CENTERED with larger fonts in landscape
    const availableWidth = width - 20;
    const availableHeight = height - (currentY - y) - 10;
    
    const productFontSize = this.calculateLandscapeProductFontSize(brandInfo.productName, availableWidth, availableHeight);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(productFontSize);
    pdf.setTextColor(0, 0, 0);
    
    // Handle line wrapping for long product names - CENTERED
    const lines = this.wrapTextForLandscape(brandInfo.productName, availableWidth, productFontSize);
    
    lines.forEach((line, index) => {
      if (currentY + (productFontSize * (index + 1)) <= y + height - 5) {
        // CENTER each line
        pdf.text(line, x + width / 2, currentY, { align: 'center' });
        currentY += productFontSize + 4;
      }
    });
  }

  /**
   * Draw store section in landscape layout - UPDATED: Store label above single textbox
   */
  static drawLandscapeStoreSection(pdf, x, y, width, height) {
    console.log('🎨 Drawing landscape store section');
    
    // "Store:" label - positioned above and to the left of textbox
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Store:', x + 10, y + 25);
    
    // Single centered textbox (larger than before)
    const boxWidth = Math.min(width - 40, 280);
    const boxHeight = 50;
    const boxX = x + (width - boxWidth) / 2; // Center the textbox
    const boxY = y + 35;
    
    // Main textbox
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(2);
    pdf.rect(boxX, boxY, boxWidth, boxHeight);
    
    // Writing lines inside textbox
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    
    const numLines = 3;
    for (let i = 1; i < numLines; i++) {
      const lineY = boxY + (i * (boxHeight / numLines));
      pdf.line(boxX + 8, lineY, boxX + boxWidth - 8, lineY);
    }
  }

  /**
   * Draw bottom section in landscape layout - 3 columns: Barcode | Dates | Case/Box
   * UPDATED: Larger barcode, numeric above, textboxes around case/box
   */
  static async drawLandscapeBottomSection(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    console.log('🎨 Drawing landscape bottom section');
    
    const colWidth = width / 3;

    // Column 1: Barcode - UPDATED LAYOUT
    await this.drawLandscapeBarcodeColumn(pdf, labelData, x, y, colWidth, height);
    
    // Column 2: Dates  
    this.drawLandscapeDatesColumn(pdf, labelData, x + colWidth, y, colWidth, height);
    
    // Column 3: Case/Box - UPDATED WITH TEXTBOXES
    this.drawLandscapeCaseColumn(pdf, labelData, x + (colWidth * 2), y, colWidth, height, boxNumber, totalBoxes);
  }

  /**
   * Draw barcode column in landscape layout - UPDATED: Larger barcode, numeric above
   */
  static async drawLandscapeBarcodeColumn(pdf, labelData, x, y, width, height) {
    console.log('🎨 Drawing landscape barcode column');
    
    const centerX = x + width / 2;
    
    // Barcode numeric display ABOVE barcode
    const spacedBarcodeDisplay = this.formatBarcodeWithSpaces(labelData.barcodeDisplay);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(102, 102, 102);
    pdf.text(spacedBarcodeDisplay, centerX, y + 15, { align: 'center' });
    
    // Barcode image - LARGER
    const barcodeWidth = Math.min(width - 10, 110); // Increased size
    const barcodeHeight = Math.min(height - 25, 50); // Increased size
    const barcodeX = centerX - barcodeWidth / 2;
    const barcodeY = y + 20;
    
    await this.drawEnhancedBarcode(pdf, labelData.barcode, barcodeX, barcodeY, barcodeWidth, barcodeHeight);
  }

  /**
   * Draw dates column in landscape layout
   */
  static drawLandscapeDatesColumn(pdf, labelData, x, y, width, height) {
    console.log('🎨 Drawing landscape dates column');
    
    const centerX = x + width / 2;
    let currentY = y + 20;
    
    // Harvest date
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Harvest:', centerX, currentY, { align: 'center' });
    
    currentY += 18;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(13);
    const harvestDate = labelData.harvestDate || 'MM/DD/YY';
    pdf.text(harvestDate, centerX, currentY, { align: 'center' });
    
    currentY += 25;
    
    // Package date
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Package:', centerX, currentY, { align: 'center' });
    
    currentY += 18;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(13);
    const packageDate = labelData.packagedDate || 'MM/DD/YY';
    pdf.text(packageDate, centerX, currentY, { align: 'center' });
  }

  /**
   * Draw case/box column in landscape layout - WITH TEXTBOXES
   */
  static drawLandscapeCaseColumn(pdf, labelData, x, y, width, height, boxNumber, totalBoxes) {
    console.log('🎨 Drawing landscape case column');
    
    const centerX = x + width / 2;
    let currentY = y + 15;
    
    // Case quantity with textbox
    const caseQtyValue = labelData.caseQuantity || '___';
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    
    // Case textbox
    const caseBoxWidth = width - 20;
    const boxHeight = 22;
    const caseBoxX = x + (width - caseBoxWidth) / 2;
    
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(caseBoxX, currentY, caseBoxWidth, boxHeight);
    
    pdf.text(`Case: ${caseQtyValue}`, centerX, currentY + 15, { align: 'center' });
    
    currentY += boxHeight + 10;
    
    // Box info with textbox
    const boxText = `Box ${boxNumber}/${totalBoxes}`;
    
    pdf.rect(caseBoxX, currentY, caseBoxWidth, boxHeight);
    pdf.text(boxText, centerX, currentY + 15, { align: 'center' });
  }

  /**
   * Draw audit trail in landscape layout (bottom-left)
   */
  static drawLandscapeAuditTrail(pdf, currentUser, x, y) {
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
    
    const auditLine = `${month}/${day}/${year} ${hoursStr}:${minutes}${ampm} EST (${(currentUser || 'Unknown').substring(0, 8)})`;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(102, 102, 102);
    
    pdf.text(auditLine, x, y);
  }

  /**
   * Calculate optimal font size for landscape product names
   */
  static calculateLandscapeProductFontSize(text, availableWidth, availableHeight) {
    if (!text) return 24;
    
    const length = text.length;
    let fontSize = 28; // Start larger for landscape
    
    // Adjust based on text length
    if (length > 80) fontSize = 18;
    else if (length > 60) fontSize = 20;
    else if (length > 40) fontSize = 22;
    else if (length > 25) fontSize = 24;
    else if (length > 15) fontSize = 26;
    
    // Check if it fits in available space
    const estimatedWidth = length * (fontSize * 0.6);
    if (estimatedWidth > availableWidth) {
      fontSize = Math.max(16, Math.floor((availableWidth / length) * 1.4));
    }
    
    return Math.min(fontSize, 28);
  }

  /**
   * Wrap text for landscape layout
   */
  static wrapTextForLandscape(text, maxWidth, fontSize) {
    if (!text) return [''];
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    const charWidth = fontSize * 0.6; // Approximate character width
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
   * Wrap text for fallback method
   */
  static wrapTextForFallback(text, maxWidth) {
    if (!text) return [''];
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    const maxCharsPerLine = Math.floor(maxWidth / 8); // Approximate
    
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
   * Enhanced barcode generation for landscape layout
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
   * Generate test PDF - FIXED: Creates 4 different labels
   */
  static async generateTestPDF() {
    console.log('🧪 Generating test PDF with FIXED import and 4 different products...');
    
    const testData = [
      {
        sku: 'CURALEAF-PINK-CHAMPAGNE',
        barcode: 'CUR19862332',
        productName: 'Curaleaf Pink Champagne Premium Cannabis Capsules [10mg THC] 30-Count',
        enhancedData: {
          labelQuantity: 1, // 1 label per product
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

    console.log('📋 Test data created with FIXED import:', testData.length, 'products');
    return this.generateLabels(testData, { debug: true, currentUser: 'TestUser' });
  }

  /**
   * Validation method
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

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalLabels,
      estimatedPages: Math.ceil(totalLabels / 4),
      labelFormat: 'Uline S-12212 (Landscape Content with Complete Unit Rotation)',
      pageSize: 'Legal (8.5" × 14")',
      labelsPerPage: 4,
      contentLayout: 'Landscape content (6" wide × 4" tall) rotated 90° clockwise as complete unit',
      optimization: 'Postcard-style reading when labels are applied sideways',
      contentDesign: 'Designed for 6" width utilization with larger fonts and better spacing',
      labelsConnected: 'All labels connected on adjacent sides (no gaps)'
    };
  }

  /**
   * Get debug information
   */
  static getDebugInfo() {
    const positions = [];
    for (let i = 0; i < 4; i++) {
      positions.push(this.calculateUlineS12212PositionConnected(i));
    }

    return {
      migration: 'Uline S-12212 Landscape Content with Complete Rotation',
      version: '8.3.0',
      importMethod: 'Named import: import { jsPDF } from "jspdf"',
      approach: {
        concept: 'Content designed for landscape (6" wide × 4" tall), rotated as complete unit',
        method: 'PDF coordinate transformation with save/restore for entire content area rotation',
        benefits: [
          'Content designed for optimal 6" width utilization',
          'Larger fonts possible across all elements',
          'Postcard-style reading when labels applied sideways',
          'Professional landscape layout when paper is rotated',
          'Labels connected on all sides matching Uline template'
        ]
      },
      contentRotation: {
        method: 'Complete unit transformation',
        steps: [
          'Save PDF state',
          'Translate to label center',
          'Rotate coordinate system 90° clockwise', 
          'Draw content in landscape orientation',  
          'Restore PDF state'
        ],
        advantages: [
          'Entire content area rotated together',
          'Content designed specifically for landscape layout',
          'Better space utilization than individual text rotation',
          'Maintains professional appearance'
        ]
      },
      landscapeLayout: {
        designDimensions: '6" wide × 4" tall (432pt × 288pt)',
        sections: {
          top: 'Brand + Product Name (35% height, CENTERED, larger fonts)',
          middle: 'Store section with single centered textbox and "Store:" label above (35% height)',
          bottom: 'Barcode (LARGER, numeric above) | Dates | Case/Box (with textboxes) in 3 columns (30% height)'
        },
        fontSizes: {
          brand: 'Up to 28pt (centered)',
          productName: 'Up to 28pt with line wrapping (centered)',
          storeLabel: '16pt',
          dates: '14pt labels, 13pt values',
          case: '14pt (in textboxes)',
          audit: '9pt',
          barcodeNumeric: '12pt (above barcode)'
        }
      },
      labelConnection: {
        connected: true,
        method: 'No gaps between labels',
        gridLayout: '2×2 with touching edges',
        matchesUlineTemplate: true
      },
      positions: positions
    };
  }

  // Legacy compatibility methods
  static calculateUlineLabelPosition(labelIndex) {
    return this.calculateUlineS12212PositionConnected(labelIndex % 4);
  }

  static async drawSidewaysLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawLandscapeContentLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }

  static async draw4LayerOptimizedLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawLandscapeContentLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }

  static async drawRotatedTextLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser) {
    return this.drawLandscapeContentLabel(pdf, labelData, position, boxNumber, totalBoxes, debug, currentUser);
  }
}