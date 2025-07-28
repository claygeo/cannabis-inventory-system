import React, { useEffect, useRef } from 'react';
import { BarcodeGenerator } from '../../utils/barcodeGenerator.js';
import { ValidationHelper } from '../../utils/validation.js';

export default function UlineS5627Label({ data }) {
  const barcodeRef = useRef(null);

  // Generate barcode on mount and when data changes
  useEffect(() => {
    if (barcodeRef.current && data.barcode) {
      const canvas = document.createElement('canvas');
      const success = BarcodeGenerator.generateToCanvas(canvas, data.barcode, {
        width: 1.5,
        height: 40,
        displayValue: false,
        margin: 0
      });

      if (success) {
        // Clear previous content
        barcodeRef.current.innerHTML = '';
        // Add canvas to container
        barcodeRef.current.appendChild(canvas);
      }
    }
  }, [data.barcode]);

  // Format barcode for display with hyphens
  const formatBarcodeForDisplay = (barcode) => {
    return ValidationHelper.formatBarcodeForDisplay(barcode);
  };

  // Get current date/time in EST
  const getCurrentDateTime = () => {
    const now = new Date();
    // Convert to EST (UTC-5, or UTC-4 during DST)
    const est = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    return est.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: '2-digit' 
    }) + ' ' + est.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Calculate box display
  const getBoxDisplay = () => {
    const boxCount = data.enhancedData?.boxCount;
    const labelNumber = data.labelNumber || 1;
    
    if (boxCount && parseInt(boxCount) > 0) {
      return `Box ${labelNumber} of ${boxCount}`;
    }
    
    return `Box ${labelNumber} of ${data.totalLabels || 1}`;
  };

  return (
    <div 
      className="uline-s5627-label"
      style={{
        width: '4in',
        height: '1.5in',
        border: '1px solid #000',
        fontFamily: 'Arial, sans-serif',
        fontSize: '10px',
        lineHeight: '1.2',
        backgroundColor: 'white',
        color: 'black',
        position: 'relative',
        padding: '0',
        margin: '0',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      {/* Product Name - Top line, bold, centered */}
      <div 
        style={{
          position: 'absolute',
          top: '2px',
          left: '2px',
          right: '2px',
          height: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 'bold',
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {data.productName}
      </div>

      {/* Hyphenated Barcode Number */}
      <div 
        style={{
          position: 'absolute',
          top: '20px',
          left: '2px',
          right: '2px',
          height: '15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 'bold',
          textAlign: 'center',
          fontFamily: 'monospace'
        }}
      >
        {formatBarcodeForDisplay(data.barcode)}
      </div>

      {/* Main Content Row */}
      <div 
        style={{
          position: 'absolute',
          top: '35px',
          left: '2px',
          right: '2px',
          height: '50px',
          display: 'flex'
        }}
      >
        {/* Left Side - Scannable Barcode */}
        <div 
          style={{
            width: '60%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start'
          }}
        >
          {/* Barcode */}
          <div 
            ref={barcodeRef}
            style={{
              height: '35px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start'
            }}
          />
          
          {/* Audit Trail under barcode */}
          <div 
            style={{
              fontSize: '7px',
              fontStyle: 'italic',
              color: '#666',
              lineHeight: '1.1',
              marginTop: '2px'
            }}
          >
            <div>{getCurrentDateTime()} EST</div>
            <div>{data.user}</div>
          </div>
        </div>

        {/* Right Side - Dates and Box Info */}
        <div 
          style={{
            width: '40%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            paddingLeft: '4px'
          }}
        >
          {/* Harvest Date */}
          <div 
            style={{
              fontSize: '8px',
              fontWeight: 'bold',
              marginBottom: '2px'
            }}
          >
            Harvest: {data.enhancedData?.harvestDate || ''}
          </div>

          {/* Packaged Date */}
          <div 
            style={{
              fontSize: '8px',
              marginBottom: '8px'
            }}
          >
            Packaged: {data.enhancedData?.packagedDate || ''}
          </div>

          {/* Box Count */}
          <div 
            style={{
              fontSize: '8px',
              fontWeight: 'bold',
              textAlign: 'center',
              border: '1px solid #000',
              padding: '2px',
              marginBottom: '2px',
              backgroundColor: 'white'
            }}
          >
            {getBoxDisplay()}
          </div>

          {/* Case Quantity */}
          <div 
            style={{
              fontSize: '8px',
              textAlign: 'center',
              border: '1px solid #000',
              padding: '2px',
              backgroundColor: 'white'
            }}
          >
            Case Qty: {data.enhancedData?.caseQuantity || ''}
          </div>
        </div>
      </div>

      {/* Source Indicator Border */}
      <div 
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          height: '2px',
          backgroundColor: data.source === 'Sweed Report' ? '#8B0000' : '#00008B'
        }}
      />
      
      <div 
        style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          height: '2px',
          backgroundColor: data.source === 'Sweed Report' ? '#8B0000' : '#00008B'
        }}
      />

      {/* Custom CSS for print optimization */}
      <style jsx>{`
        .uline-s5627-label {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
        
        @media print {
          .uline-s5627-label {
            width: 4in !important;
            height: 1.5in !important;
            border: 1px solid #000 !important;
            background: white !important;
            color: black !important;
            font-size: 10px !important;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}