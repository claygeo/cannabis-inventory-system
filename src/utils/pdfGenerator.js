import jsPDF from 'jspdf';
import { BarcodeGenerator } from './barcodeGenerator.js';
import { LabelFormatter } from './labelFormatter.js';

/**
 * PDF Generator for Uline S-5627 Label Sheets
 * Exact dimensions: 4" × 1.5" labels, 2 columns × 6 rows = 12 labels per sheet
 */
export class PDFGenerator {
  // Uline S-5627 specifications (in points - 1 inch = 72 points)
  static SHEET_SPECS = {
    PAGE_WIDTH: 612,      // 8.5" × 72pt
    PAGE_HEIGHT: 792,     // 11" × 72pt
    LABEL_WIDTH: 288,     // 4" × 72pt  
    LABEL_HEIGHT: 108,    // 1.5" × 72pt
    COLUMNS: 2,
    ROWS: 6,
    LABELS_PER_SHEET: 12,
    
    // Calculated positioning (matching your sheet image exactly)
    LEFT_MARGIN: 18,      // Left edge margin
    TOP_MARGIN: 72,       // Top edge margin (centered vertically)
    COLUMN_GAP: 18,       // Gap between the two columns
    ROW_GAP: 0           // NO gaps between rows - labels touch
  };

  /**
   * Generate PDF with labels positioned exactly for Uline S-5627 sheets
   * @param {Array} labelDataArray - Array of label data objects
   * @returns {Promise<Blob>} - PDF blob
   */
  static async generateLabels(labelDataArray) {
    console.log('🏷️ Starting PDF generation for', labelDataArray.length, 'items');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [this.SHEET_SPECS.PAGE_WIDTH, this.SHEET_SPECS.PAGE_HEIGHT]
    });

    let currentPage = 1;
    let labelPosition = 0;

    // Process each label data item
    for (let i = 0; i < labelDataArray.length; i++) {
      const labelData = labelDataArray[i];
      const labelQuantity = parseInt(labelData.enhancedData?.labelQuantity || 1);

      console.log(`📄 Processing item ${i + 1}: ${labelData.sku} (${labelQuantity} labels)`);

      // Generate the specified number of labels for this item
      for (let labelNum = 0; labelNum < labelQuantity; labelNum++) {
        // Start new page if we've filled the current one
        if (labelPosition >= this.SHEET_SPECS.LABELS_PER_SHEET) {
          pdf.addPage();
          currentPage++;
          labelPosition = 0;
          console.log(`📄 Started page ${currentPage}`);
        }

        // Calculate exact position for this label
        const position = this.calculateLabelPosition(labelPosition);
        
        console.log(`🏷️ Placing label ${labelNum + 1}/${labelQuantity} for ${labelData.sku} at position ${labelPosition} (${position.x}, ${position.y})`);

        // Draw the label at calculated position
        await this.drawLabel(pdf, labelData, position, labelNum + 1, labelQuantity);

        labelPosition++;
      }
    }

    console.log('✅ PDF generation complete');
    return pdf.output('blob');
  }

  /**
   * Calculate exact label position on sheet (matching Uline S-5627 layout)
   * @param {number} labelIndex - Label index (0-11)
   * @returns {Object} - Position coordinates
   */
  static calculateLabelPosition(labelIndex) {
    const specs = this.SHEET_SPECS;
    
    // Determine column (0 or 1) and row (0-5)
    const column = labelIndex % 2;
    const row = Math.floor(labelIndex / 2);
    
    // Calculate exact x position
    let x = specs.LEFT_MARGIN; // Start with left margin
    if (column === 1) {
      // Second column: left margin + first label width + column gap
      x = specs.LEFT_MARGIN + specs.LABEL_WIDTH + specs.COLUMN_GAP;
    }
    
    // Calculate exact y position (labels touch vertically - no row gap)
    const y = specs.TOP_MARGIN + (row * specs.LABEL_HEIGHT);
    
    console.log(`📐 Position calculation: labelIndex=${labelIndex}, column=${column}, row=${row}, x=${x}, y=${y}`);
    
    return {
      x: x,
      y: y,
      width: specs.LABEL_WIDTH,
      height: specs.LABEL_HEIGHT,
      column: column,
      row: row
    };
  }

  /**
   * Draw individual label with all content
   * @param {jsPDF} pdf - PDF document
   * @param {Object} labelData - Label data
   * @param {Object} position - Label position
   * @param {number} labelNumber - Current label number
   * @param {number} totalLabels - Total labels for this item
   */
  static async drawLabel(pdf, labelData, position, labelNumber, totalLabels) {
    const { x, y, width, height } = position;
    
    // DEBUG: Draw label border (remove for production)
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.rect(x, y, width, height);

    try {
      // 1. HEADER SECTION (Company info)
      const headerHeight = 16;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      
      const headerText = 'CANNABIS INVENTORY SYSTEM';
      const headerX = x + (width / 2);
      const headerY = y + 10;
      
      pdf.text(headerText, headerX, headerY, { align: 'center' });

      // 2. PRODUCT NAME SECTION
      const productStartY = y + headerHeight + 8;
      const productHeight = 24;
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      
      const productName = labelData.productName || 'Product Name';
      const productLines = pdf.splitTextToSize(productName, width - 16);
      
      let currentProductY = productStartY;
      productLines.slice(0, 2).forEach(line => {
        pdf.text(line, x + 8, currentProductY, { align: 'left' });
        currentProductY += 10;
      });

      // 3. BARCODE SECTION (centered)
      const barcodeStartY = productStartY + productHeight + 4;
      const barcodeHeight = 28;
      
      if (labelData.barcode || labelData.sku) {
        try {
          const barcodeValue = labelData.barcode || labelData.sku;
          const barcodeDataURL = BarcodeGenerator.generateDataURL(barcodeValue, {
            width: 1.5,
            height: 25,
            displayValue: false,
            margin: 0
          });

          const barcodeWidth = 200;
          const barcodeX = x + (width - barcodeWidth) / 2;
          
          pdf.addImage(barcodeDataURL, 'PNG', barcodeX, barcodeStartY, barcodeWidth, barcodeHeight);
        } catch (error) {
          console.error('Barcode generation failed:', error);
          // Fallback to text
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(labelData.barcode || labelData.sku || '', x + (width / 2), barcodeStartY + 14, { align: 'center' });
        }
      }

      // 4. PRODUCT DETAILS SECTION
      const detailsStartY = barcodeStartY + barcodeHeight + 6;
      
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      
      // Left column details
      let leftDetailsY = detailsStartY;
      const leftColumnX = x + 8;
      
      if (labelData.sku) {
        pdf.text(`SKU: ${labelData.sku}`, leftColumnX, leftDetailsY);
        leftDetailsY += 8;
      }
      
      if (labelData.brand) {
        pdf.text(`Brand: ${labelData.brand}`, leftColumnX, leftDetailsY);
        leftDetailsY += 8;
      }

      // Right column details  
      let rightDetailsY = detailsStartY;
      const rightColumnX = x + (width / 2) + 8;
      
      if (labelData.enhancedData?.harvestDate) {
        pdf.text(`Harvest: ${labelData.enhancedData.harvestDate}`, rightColumnX, rightDetailsY);
        rightDetailsY += 8;
      }
      
      if (labelData.enhancedData?.packagedDate) {
        pdf.text(`Packaged: ${labelData.enhancedData.packagedDate}`, rightColumnX, rightDetailsY);
        rightDetailsY += 8;
      }

      // 5. FOOTER SECTION
      const footerY = y + height - 8;
      
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      
      // Left side: Label count
      if (totalLabels > 1) {
        pdf.text(`${labelNumber}/${totalLabels}`, x + 8, footerY);
      }
      
      // Right side: Generation info
      const timestamp = new Date().toLocaleDateString();
      const footerRight = `${timestamp} | ${labelData.user || 'System'}`;
      pdf.text(footerRight, x + width - 8, footerY, { align: 'right' });

    } catch (error) {
      console.error('Error drawing label:', error);
      
      // Fallback: Just draw basic info
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Label Generation Error', x + (width / 2), y + (height / 2), { align: 'center' });
      pdf.text(labelData.sku || 'Unknown SKU', x + (width / 2), y + (height / 2) + 12, { align: 'center' });
    }
  }

  /**
   * Validate label data before generation
   * @param {Array} labelDataArray - Array of label data
   * @returns {Object} - Validation result
   */
  static validateGenerationData(labelDataArray) {
    const errors = [];
    const warnings = [];
    let totalLabels = 0;

    if (!Array.isArray(labelDataArray) || labelDataArray.length === 0) {
      errors.push('No label data provided');
      return { isValid: false, errors, warnings, totalLabels: 0, estimatedPages: 0 };
    }

    labelDataArray.forEach((labelData, index) => {
      if (!labelData.sku && !labelData.barcode) {
        errors.push(`Item ${index + 1}: Missing SKU and barcode`);
      }

      if (!labelData.productName) {
        warnings.push(`Item ${index + 1}: Missing product name`);
      }

      const quantity = parseInt(labelData.enhancedData?.labelQuantity || 1);
      if (quantity < 1 || quantity > 50) {
        errors.push(`Item ${index + 1}: Invalid label quantity (${quantity})`);
      } else {
        totalLabels += quantity;
      }
    });

    const estimatedPages = Math.ceil(totalLabels / this.SHEET_SPECS.LABELS_PER_SHEET);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalLabels,
      estimatedPages
    };
  }

  /**
   * Get label specifications
   * @returns {Object} - Label specifications
   */
  static getLabelSpecs() {
    return {
      ...this.SHEET_SPECS,
      format: 'Uline S-5627',
      dimensions: '4" × 1.5"',
      layout: '2 columns × 6 rows'
    };
  }
}