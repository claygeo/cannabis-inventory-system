import React from 'react';
import { BarcodeGenerator } from '../../utils/barcodeGenerator.js';

/**
 * Uline S-5627 Label Component
 * Dimensions: 4" x 1.5" (288pt x 108pt at 72 DPI)
 * Professional cannabis inventory label with Uline-style border and layout
 */
export default function UlineS5627Label({ 
  item, 
  enhancedData, 
  user, 
  boxNumber = 1, 
  totalBoxes = 1,
  preview = false 
}) {
  // Label dimensions in points (72 DPI)
  const LABEL_WIDTH = 288; // 4 inches
  const LABEL_HEIGHT = 108; // 1.5 inches

  // Calculate font sizes based on product name length
  const getProductNameFontSize = (text) => {
    if (!text) return 16;
    const length = text.length;
    if (length <= 20) return 18;
    if (length <= 30) return 16;
    if (length <= 40) return 14;
    if (length <= 50) return 12;
    return 10;
  };

  // Format barcode for display (with hyphens)
  const formatBarcodeDisplay = (barcode) => {
    if (!barcode) return '';
    const clean = barcode.replace(/[^A-Za-z0-9]/g, '');
    return clean.replace(/(.{3})/g, '$1-').replace(/-$/, '');
  };

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return 'MM/DD/YYYY';
    // Handle various date formats
    const cleaned = dateStr.replace(/[^\d\/\-]/g, '');
    if (cleaned.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      return cleaned;
    }
    if (cleaned.match(/^\d{1,2}\/\d{1,2}\/\d{2}$/)) {
      return cleaned;
    }
    return dateStr;
  };

  // Generate barcode SVG
  const barcodeValue = item.barcode || item.sku || '';
  let barcodeSVG = '';
  
  if (barcodeValue) {
    try {
      barcodeSVG = BarcodeGenerator.generateForLabel(barcodeValue, {
        width: 1.8, // Increased from 1.2 to 1.8 (1.5x)
        height: 52,  // Increased from 35 to 52 (1.5x)
        margin: 0,
        displayValue: false // Remove the number value underneath
      });
    } catch (error) {
      console.error('Barcode generation error:', error);
      barcodeSVG = `<svg width="120" height="52"><text x="60" y="26" text-anchor="middle" font-size="8" fill="red">Error</text></svg>`;
    }
  }

  // Create audit trail with EST timezone
  const now = new Date();
  // Convert to EST (UTC-5) or EDT (UTC-4) - using a simple approach
  const estOffset = -5; // EST is UTC-5
  const estTime = new Date(now.getTime() + (estOffset * 60 * 60 * 1000));
  
  const auditTimestamp = `${(estTime.getMonth() + 1).toString().padStart(2, '0')}/${estTime.getDate().toString().padStart(2, '0')}/${estTime.getFullYear().toString().slice(-2)} ${estTime.getHours().toString().padStart(2, '0')}:${estTime.getMinutes().toString().padStart(2, '0')} EST`;
  const auditText = `${auditTimestamp} (${user?.username || 'Unknown'})`;

  const productNameFontSize = getProductNameFontSize(item.productName);
  const barcodeDisplay = formatBarcodeDisplay(barcodeValue);

  const labelStyle = {
    width: preview ? '400px' : `${LABEL_WIDTH}pt`,
    height: preview ? '150px' : `${LABEL_HEIGHT}pt`,
    border: preview ? '2px solid #000' : '1pt solid #000', // Uline-style border
    fontSize: preview ? '12px' : '8pt',
    fontFamily: 'Arial, sans-serif',
    position: 'relative',
    backgroundColor: 'white',
    padding: preview ? '8px' : '4pt',
    boxSizing: 'border-box',
    overflow: 'hidden'
  };

  return (
    <div style={labelStyle}>
      {/* Product Name - Top Section */}
      <div style={{
        position: 'absolute',
        top: preview ? '4px' : '2pt',
        left: preview ? '4px' : '2pt',
        right: preview ? '4px' : '2pt',
        textAlign: 'center',
        fontSize: preview ? `${productNameFontSize}px` : `${productNameFontSize * 0.75}pt`,
        fontWeight: 'bold',
        lineHeight: preview ? '1.1' : '0.9',
        maxHeight: preview ? '36px' : '24pt',
        overflow: 'hidden',
        wordWrap: 'break-word'
      }}>
        {item.productName || 'Product Name'}
      </div>

      {/* Hyphenated Barcode Display */}
      <div style={{
        position: 'absolute',
        top: preview ? '42px' : '28pt',
        left: preview ? '4px' : '2pt',
        right: preview ? '4px' : '2pt',
        textAlign: 'center',
        fontSize: preview ? '11px' : '8pt',
        color: '#666',
        lineHeight: '1'
      }}>
        {barcodeDisplay}
      </div>

      {/* Barcode - Left Side (Now larger) */}
      <div style={{
        position: 'absolute',
        top: preview ? '58px' : '42pt',
        left: preview ? '4px' : '2pt',
        width: preview ? '150px' : '105pt', // Increased from 100px/70pt
        height: preview ? '60px' : '42pt'   // Increased from 40px/30pt
      }}>
        <div 
          dangerouslySetInnerHTML={{ __html: barcodeSVG }}
          style={{
            width: '100%',
            height: '100%'
          }}
        />
      </div>

      {/* Right Side Information - Moved all the way to the right */}
      <div style={{
        position: 'absolute',
        top: preview ? '58px' : '42pt',
        right: preview ? '4px' : '2pt',
        width: preview ? '120px' : '90pt' // Reduced width since we have more space
      }}>
        {/* Harvest Date - Bold */}
        <div style={{
          marginBottom: preview ? '4px' : '3pt',
          fontSize: preview ? '9px' : '7pt',
          textAlign: 'right'
        }}>
          <div style={{ fontWeight: 'bold' }}>
            Harvest: {formatDate(enhancedData?.harvestDate)}
          </div>
        </div>

        {/* Packaged Date - Non-bold */}
        <div style={{
          marginBottom: preview ? '8px' : '6pt',
          fontSize: preview ? '9px' : '7pt',
          textAlign: 'right'
        }}>
          <div style={{ fontWeight: 'normal' }}>
            Packaged: {formatDate(enhancedData?.packagedDate)}
          </div>
        </div>
      </div>

      {/* Bottom Right Corner - Case Qty and Box Info Stacked */}
      <div style={{
        position: 'absolute',
        bottom: preview ? '20px' : '15pt',
        right: preview ? '4px' : '2pt',
        display: 'flex',
        flexDirection: 'column',
        gap: preview ? '4px' : '3pt'
      }}>
        {/* Case Qty Box */}
        <div style={{
          border: '1px solid #000',
          padding: preview ? '3px 6px' : '2pt 4pt',
          width: preview ? '80px' : '60pt',
          textAlign: 'center',
          fontSize: preview ? '8px' : '6pt'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: preview ? '2px' : '1pt' }}>
            Case Qty:
          </div>
          <div style={{ fontSize: preview ? '10px' : '7pt' }}>
            {enhancedData?.caseQuantity || '___'}
          </div>
        </div>

        {/* Box Number Box - Same size as Case Qty */}
        <div style={{
          border: '1px solid #000',
          padding: preview ? '3px 6px' : '2pt 4pt',
          width: preview ? '80px' : '60pt',
          textAlign: 'center',
          fontSize: preview ? '8px' : '6pt'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: preview ? '2px' : '1pt' }}>
            Box {boxNumber} of {totalBoxes || enhancedData?.boxCount || 1}
          </div>
        </div>
      </div>

      {/* Audit Trail - Bottom Left with EST time */}
      <div style={{
        position: 'absolute',
        bottom: preview ? '4px' : '2pt',
        left: preview ? '4px' : '2pt',
        fontSize: preview ? '7px' : '5pt',
        color: '#666',
        lineHeight: '1'
      }}>
        {auditText}
      </div>
    </div>
  );
}