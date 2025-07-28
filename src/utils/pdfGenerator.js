import jsPDF from 'jspdf';
import { LABEL_SPECS } from '../constants.js';
import { LabelFormatter } from './labelFormatter.js';
import { BarcodeGenerator } from './barcodeGenerator.js';

/**
 * PDF generation utilities for Cannabis Inventory Management System
 * Generates fixed-dimension label PDFs for Uline S-5627 sheets
 */

export class PDFGenerator {
  /**
   * Generate PDF for label sheets
   * @param {Object} labelData - Label generation data
   * @param {Object} options - PDF generation options
   * @returns {Promise<Object>} - PDF generation result
   */
  static async generateLabelPDF(labelData, options = {}) {
    try {
      const {
        filename = `labels_${labelData.item.sku}_${Date.now()}.pdf`,
        autoDownload = true,
        quality = 'high'
      } = options;

      // Create PDF with letter size (8.5" x 11")
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: 'letter',
        putOnlyUsedFonts: true,
        compress: true
      });

      // Set PDF metadata
      pdf.setProperties({
        title: `Cannabis Labels - ${labelData.item.sku}`,
        subject: 'Cannabis Inventory Labels',
        author: labelData.generatedBy || 'Cannabis Inventory System',
        creator: 'Cannabis Inventory Management System v5.3',
        producer: 'jsPDF'
      });

      let currentPage = 1;

      // Process each sheet
      for (const sheet of labelData.sheets) {
        if (currentPage > 1) {
          pdf.addPage();
        }

        await this.renderLabelSheet(pdf, sheet, quality);
        currentPage++;
      }

      // Generate PDF blob
      const pdfBlob = pdf.output('blob');
      const pdfDataURL = pdf.output('dataurlstring');

      // Auto-download if requested
      if (autoDownload) {
        this.downloadPDF(pdf, filename);
      }

      return {
        success: true,
        pdf,
        blob: pdfBlob,
        dataURL: pdfDataURL,
        filename,
        pageCount: labelData.sheets.length,
        totalLabels: labelData.totalLabels
      };

    } catch (error) {
      console.error('PDF generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Render a single label sheet
   * @param {jsPDF} pdf - PDF instance
   * @param {Object} sheet - Sheet data
   * @param {string} quality - Rendering quality
   */
  static async renderLabelSheet(pdf, sheet, quality = 'high') {
    // Sheet dimensions (8.5" x 11" with margins)
    const sheetWidth = 8.5;
    const sheetHeight = 11;
    const marginX = 0.25;
    const marginY = 0.5;

    // Label dimensions (4" x 1.5")
    const labelWidth = 4;
    const labelHeight = 1.5;
    const labelSpacing = 0.125;

    // Calculate positions for 2x6 grid
    const positions = [];
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 2; col++) {
        positions.push({
          x: marginX + col * (labelWidth + labelSpacing),
          y: marginY + row * (labelHeight + labelSpacing),
          row,
          col
        });
      }
    }

    // Render each label
    for (let i = 0; i < sheet.labels.length && i < positions.length; i++) {
      const label = sheet.labels[i];
      const position = positions[i];

      if (!label.empty) {
        await this.renderSingleLabel(pdf, label, position, quality);
      }

      // Draw label border for alignment (optional, can be removed for production)
      if (quality === 'high') {
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.01);
        pdf.rect(position.x, position.y, labelWidth, labelHeight);
      }
    }

    // Add sheet information footer
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Sheet ${sheet.sheetNumber} - Generated: ${new Date().toLocaleString()} - Uline S-5627 Format`,
      marginX,
      sheetHeight - 0.2
    );
  }

  /**
   * Render a single label
   * @param {jsPDF} pdf - PDF instance
   * @param {Object} label - Label data
   * @param {Object} position - Label position
   * @param {string} quality - Rendering quality
   */
  static async renderSingleLabel(pdf, label, position, quality) {
    const { x, y } = position;
    const labelWidth = 4;
    const labelHeight = 1.5;
    const padding = 0.1;

    // Generate formatted label content
    const content = LabelFormatter.generateLabelContent(
      label,
      {
        labelQuantity: label.labelQuantity,
        caseQuantity: label.caseQuantity,
        boxCount: label.boxCount,
        harvestDate: label.harvestDate,
        packagedDate: label.packagedDate
      },
      label.labelNumber
    );

    // Set default text color
    pdf.setTextColor(0, 0, 0);

    // Render label border
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.02);
    pdf.rect(x, y, labelWidth, labelHeight);

    // Header section (SKU and Source)
    const headerY = y + padding;
    
    // SKU (left side)
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(content.sku, x + padding, headerY + 0.1);

    // Source badge (right side)
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setFillColor(0, 0, 0);
    pdf.setTextColor(255, 255, 255);
    
    const sourceWidth = 0.6;
    const sourceHeight = 0.15;
    const sourceX = x + labelWidth - padding - sourceWidth;
    
    pdf.rect(sourceX, headerY, sourceWidth, sourceHeight, 'F');
    pdf.text(content.source, sourceX + 0.05, headerY + 0.1, { align: 'left' });

    // Reset text color
    pdf.setTextColor(0, 0, 0);

    // Body section
    const bodyY = headerY + 0.3;
    const bodyHeight = 0.8;
    const infoWidth = 2.4;
    const barcodeWidth = 1.3;
    const barcodeX = x + labelWidth - padding - barcodeWidth;

    // Product information (left side)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    
    // Product name (multi-line if needed)
    const productNameLines = pdf.splitTextToSize(content.productName, infoWidth);
    pdf.text(productNameLines.slice(0, 2), x + padding, bodyY + 0.1); // Max 2 lines

    // Brand
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(50, 50, 50);
    pdf.text(content.brand, x + padding, bodyY + 0.35);

    // Size
    pdf.setTextColor(100, 100, 100);
    pdf.text(content.size, x + padding, bodyY + 0.5);

    // Strain
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(80, 80, 80);
    pdf.text(content.strain, x + padding, bodyY + 0.65);

    // Barcode section (right side)
    await this.renderBarcode(pdf, label.barcode, {
      x: barcodeX,
      y: bodyY,
      width: barcodeWidth,
      height: 0.6
    }, quality);

    // Barcode text
    pdf.setFont('courier', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(0, 0, 0);
    pdf.text(content.barcodeDisplay, barcodeX + (barcodeWidth / 2), bodyY + 0.7, { align: 'center' });

    // Footer section
    const footerY = y + labelHeight - 0.25;
    
    // Draw footer separator line
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.01);
    pdf.line(x + padding, footerY, x + labelWidth - padding, footerY);

    // Footer content
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(100, 100, 100);

    // Dates (left side)
    let dateY = footerY + 0.08;
    if (content.harvestDate) {
      pdf.text(`H: ${content.harvestDate}`, x + padding, dateY);
      dateY += 0.08;
    }
    if (content.packagedDate) {
      pdf.text(`P: ${content.packagedDate}`, x + padding, dateY);
    }

    // Quantities (right side)
    let quantityY = footerY + 0.08;
    if (content.caseQuantity) {
      pdf.text(`Units: ${content.caseQuantity}`, x + labelWidth - padding, quantityY, { align: 'right' });
      quantityY += 0.08;
    }
    if (content.boxCount) {
      pdf.text(`Boxes: ${content.boxCount}`, x + labelWidth - padding, quantityY, { align: 'right' });
    }
  }

  /**
   * Render barcode in PDF
   * @param {jsPDF} pdf - PDF instance
   * @param {string} barcodeValue - Barcode value
   * @param {Object} position - Barcode position and dimensions
   * @param {string} quality - Rendering quality
   */
  static async renderBarcode(pdf, barcodeValue, position, quality) {
    try {
      const { x, y, width, height } = position;

      // Generate barcode as data URL
      const barcodeOptions = {
        width: 2,
        height: Math.floor(height * 72), // Convert inches to pixels (72 DPI)
        displayValue: false,
        margin: 0,
        background: '#ffffff',
        lineColor: '#000000'
      };

      const barcodeDataURL = BarcodeGenerator.generateDataURL(`*${barcodeValue}*`, barcodeOptions);

      if (barcodeDataURL && !barcodeDataURL.includes('error')) {
        // Add barcode image to PDF
        pdf.addImage(
          barcodeDataURL,
          'PNG',
          x,
          y,
          width,
          height,
          undefined,
          quality === 'high' ? 'MEDIUM' : 'FAST'
        );
      } else {
        // Fallback: draw error placeholder
        pdf.setDrawColor(255, 0, 0);
        pdf.setLineWidth(0.01);
        pdf.rect(x, y, width, height);
        pdf.setFontSize(6);
        pdf.setTextColor(255, 0, 0);
        pdf.text('BARCODE ERROR', x + width/2, y + height/2, { align: 'center' });
      }

    } catch (error) {
      console.error('Barcode rendering error:', error);
      
      // Draw error placeholder
      pdf.setDrawColor(255, 0, 0);
      pdf.setFillColor(255, 240, 240);
      pdf.rect(position.x, position.y, position.width, position.height, 'FD');
      pdf.setFontSize(6);
      pdf.setTextColor(255, 0, 0);
      pdf.text('ERROR', position.x + position.width/2, position.y + position.height/2, { align: 'center' });
    }
  }

  /**
   * Download PDF file
   * @param {jsPDF} pdf - PDF instance
   * @param {string} filename - Download filename
   */
  static downloadPDF(pdf, filename) {
    try {
      pdf.save(filename);
    } catch (error) {
      console.error('PDF download error:', error);
      
      // Fallback: create download link
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Preview PDF in new window
   * @param {jsPDF} pdf - PDF instance
   * @param {string} title - Window title
   */
  static previewPDF(pdf, title = 'Label Preview') {
    try {
      const pdfDataUri = pdf.output('datauristring');
      const newWindow = window.open('', '_blank');
      
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${title}</title>
            <style>
              body { margin: 0; padding: 20px; background: #f5f5f5; }
              iframe { width: 100%; height: calc(100vh - 40px); border: 1px solid #ddd; }
            </style>
          </head>
          <body>
            <iframe src="${pdfDataUri}" type="application/pdf"></iframe>
          </body>
          </html>
        `);
        newWindow.document.close();
      } else {
        // Fallback: download if popup blocked
        this.downloadPDF(pdf, `${title.replace(/\s+/g, '_')}.pdf`);
      }
    } catch (error) {
      console.error('PDF preview error:', error);
      throw error;
    }
  }

  /**
   * Generate test label sheet for alignment checking
   * @param {Object} options - Test options
   * @returns {Promise<Object>} - Test PDF result
   */
  static async generateTestSheet(options = {}) {
    try {
      const {
        filename = `test_alignment_${Date.now()}.pdf`,
        autoDownload = true
      } = options;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: 'letter'
      });

      // Set PDF metadata
      pdf.setProperties({
        title: 'Uline S-5627 Alignment Test',
        subject: 'Label Alignment Test Sheet',
        author: 'Cannabis Inventory System',
        creator: 'Cannabis Inventory Management System v5.3'
      });

      // Sheet dimensions
      const marginX = 0.25;
      const marginY = 0.5;
      const labelWidth = 4;
      const labelHeight = 1.5;
      const labelSpacing = 0.125;

      // Draw grid and labels
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 2; col++) {
          const x = marginX + col * (labelWidth + labelSpacing);
          const y = marginY + row * (labelHeight + labelSpacing);
          const labelNum = row * 2 + col + 1;

          // Draw label border
          pdf.setDrawColor(0, 0, 0);
          pdf.setLineWidth(0.02);
          pdf.rect(x, y, labelWidth, labelHeight);

          // Draw alignment markers at corners
          pdf.setFillColor(0, 0, 0);
          const markerSize = 0.05;
          
          // Top-left
          pdf.rect(x, y, markerSize, markerSize, 'F');
          // Top-right  
          pdf.rect(x + labelWidth - markerSize, y, markerSize, markerSize, 'F');
          // Bottom-left
          pdf.rect(x, y + labelHeight - markerSize, markerSize, markerSize, 'F');
          // Bottom-right
          pdf.rect(x + labelWidth - markerSize, y + labelHeight - markerSize, markerSize, markerSize, 'F');

          // Center crosshairs
          pdf.setLineWidth(0.01);
          pdf.line(x + labelWidth/2 - 0.1, y + labelHeight/2, x + labelWidth/2 + 0.1, y + labelHeight/2);
          pdf.line(x + labelWidth/2, y + labelHeight/2 - 0.1, x + labelWidth/2, y + labelHeight/2 + 0.1);

          // Label information
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`LABEL ${labelNum}`, x + labelWidth/2, y + labelHeight/2 - 0.2, { align: 'center' });
          
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`4.0" x 1.5"`, x + labelWidth/2, y + labelHeight/2, { align: 'center' });
          pdf.text(`Row ${row + 1}, Col ${col + 1}`, x + labelWidth/2, y + labelHeight/2 + 0.15, { align: 'center' });
        }
      }

      // Add instructions
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('ULINE S-5627 ALIGNMENT TEST SHEET', 4.25, 0.3, { align: 'center' });
      
      pdf.setFontSize(8);
      pdf.text('Print this sheet and verify that the borders align with your Uline S-5627 label sheets.', 4.25, 10.5, { align: 'center' });
      pdf.text('Each label should measure exactly 4.0" x 1.5" with proper spacing.', 4.25, 10.7, { align: 'center' });

      // Generate result
      const pdfBlob = pdf.output('blob');
      
      if (autoDownload) {
        this.downloadPDF(pdf, filename);
      }

      return {
        success: true,
        pdf,
        blob: pdfBlob,
        filename
      };

    } catch (error) {
      console.error('Test sheet generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get PDF generation capabilities and limits
   * @returns {Object} - Capabilities information
   */
  static getCapabilities() {
    return {
      maxLabelsPerSheet: LABEL_SPECS.LABELS_PER_SHEET,
      maxSheetsPerPDF: 50, // Reasonable limit for performance
      supportedFormats: ['PDF'],
      supportedQualities: ['high', 'medium', 'low'],
      labelDimensions: {
        width: LABEL_SPECS.WIDTH_INCHES,
        height: LABEL_SPECS.HEIGHT_INCHES,
        unit: 'inches'
      },
      sheetDimensions: {
        width: 8.5,
        height: 11,
        unit: 'inches',
        format: 'Letter'
      },
      features: {
        barcodes: true,
        multipleSheets: true,
        customData: true,
        alignmentTest: true,
        preview: true,
        download: true
      }
    };
  }

  /**
   * Validate label data for PDF generation
   * @param {Object} labelData - Label data to validate
   * @returns {Object} - Validation result
   */
  static validateLabelData(labelData) {
    const errors = [];
    const warnings = [];

    if (!labelData) {
      errors.push('Label data is required');
      return { isValid: false, errors, warnings };
    }

    if (!labelData.item) {
      errors.push('Item data is required');
    }

    if (!labelData.sheets || !Array.isArray(labelData.sheets)) {
      errors.push('Sheet data is required');
    }

    if (labelData.sheets && labelData.sheets.length > 50) {
      warnings.push('Large number of sheets may affect performance');
    }

    // Validate each sheet
    labelData.sheets?.forEach((sheet, sheetIndex) => {
      if (!sheet.labels || !Array.isArray(sheet.labels)) {
        errors.push(`Sheet ${sheetIndex + 1}: Missing labels array`);
      }

      if (sheet.labels && sheet.labels.length > LABEL_SPECS.LABELS_PER_SHEET) {
        errors.push(`Sheet ${sheetIndex + 1}: Too many labels (max ${LABEL_SPECS.LABELS_PER_SHEET})`);
      }

      // Validate individual labels
      sheet.labels?.forEach((label, labelIndex) => {
        if (!label.empty) {
          if (!label.barcode) {
            errors.push(`Sheet ${sheetIndex + 1}, Label ${labelIndex + 1}: Missing barcode`);
          }
          
          if (!label.sku) {
            warnings.push(`Sheet ${sheetIndex + 1}, Label ${labelIndex + 1}: Missing SKU`);
          }
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Calculate PDF file size estimate
   * @param {Object} labelData - Label data
   * @returns {Object} - Size estimate
   */
  static estimateFileSize(labelData) {
    const baseSize = 50; // KB base PDF size
    const perLabelSize = 15; // KB per label with barcode
    const perSheetSize = 5; // KB per sheet overhead
    
    const totalLabels = labelData.totalLabels || 0;
    const totalSheets = labelData.sheets?.length || 0;
    
    const estimatedSizeKB = baseSize + (totalLabels * perLabelSize) + (totalSheets * perSheetSize);
    const estimatedSizeMB = estimatedSizeKB / 1024;

    return {
      sizeKB: Math.round(estimatedSizeKB),
      sizeMB: Math.round(estimatedSizeMB * 100) / 100,
      totalLabels,
      totalSheets,
      averageSizePerLabel: Math.round(estimatedSizeKB / Math.max(totalLabels, 1))
    };
  }
}