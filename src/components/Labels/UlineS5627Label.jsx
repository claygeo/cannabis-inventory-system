import React, { useState } from 'react';

/**
 * Uline S-5492 Label Component (ROTATED LAYOUT)
 * Labels positioned sideways on legal paper - rotate paper 90° to read/peel
 */
class UlineS5492Label extends React.Component {
  /**
   * Calculate label position for Uline S-5492 ROTATED on legal paper
   * Labels are positioned sideways - paper must be rotated 90° for reading/peeling
   * @param {number} labelIndex - Index of label (0-3 for 4 labels per sheet)
   * @returns {Object} - Position coordinates in points
   */
  static calculateUlineS5492PositionRotated(labelIndex) {
    // Legal size sheet dimensions (8.5" × 14")
    const pageWidth = 612;   // 8.5" in points  
    const pageHeight = 1008; // 14" in points
    
    // HP E877 printer margins: 0.167" on all sides
    const printerMargin = 12; // 0.167" = 12pt
    const printableWidth = pageWidth - (printerMargin * 2);   // 588pt
    const printableHeight = pageHeight - (printerMargin * 2); // 984pt
    
    // In rotated coordinate system (after rotating paper 90°):
    // - Available width: printableHeight = 984pt (14" - margins)
    // - Available height: printableWidth = 588pt (8.5" - margins)
    const rotatedPageWidth = printableHeight;  // 984pt
    const rotatedPageHeight = printableWidth;  // 588pt
    
    // Label dimensions in rotated view (6" wide × 4" tall)
    const labelWidth = 432;  // 6" wide in rotated view
    const labelHeight = 288; // 4" tall in rotated view
    
    // Grid layout: 2 columns × 2 rows in rotated view
    const cols = 2;
    const rows = 2;
    const row = Math.floor(labelIndex / cols);
    const col = labelIndex % cols;
    
    // Calculate scale factor if needed
    const requiredWidth = cols * labelWidth;   // 864pt
    const requiredHeight = rows * labelHeight; // 576pt
    
    const scaleX = rotatedPageWidth / requiredWidth;   // 984/864 = 1.14
    const scaleY = rotatedPageHeight / requiredHeight; // 588/576 = 1.02
    const scaleFactor = Math.min(scaleX, scaleY, 1.0); // Use 1.02 but cap at 1.0
    
    // Labels fit without scaling!
    const actualLabelWidth = labelWidth;
    const actualLabelHeight = labelHeight;
    
    // Calculate positions in rotated coordinate system
    const rotatedX = col * actualLabelWidth + (rotatedPageWidth - (cols * actualLabelWidth)) / 2;
    const rotatedY = row * actualLabelHeight + (rotatedPageHeight - (rows * actualLabelHeight)) / 2;
    
    // Transform back to PDF coordinate system (unrotated)
    // For 90° clockwise rotation: x' = y, y' = pageWidth - x - width
    const pdfX = printerMargin + rotatedY;
    const pdfY = printerMargin + (rotatedPageWidth - rotatedX - actualLabelWidth);
    
    return {
      x: Math.floor(pdfX),
      y: Math.floor(pdfY),
      width: actualLabelHeight,  // In PDF coords: height becomes width
      height: actualLabelWidth,  // In PDF coords: width becomes height
      
      // Rotation information
      isRotated: true,
      rotationAngle: 90,
      rotatedWidth: actualLabelWidth,   // Width when rotated (6")
      rotatedHeight: actualLabelHeight, // Height when rotated (4")
      
      // Scaling info
      scaleFactor: scaleFactor,
      isScaled: scaleFactor < 1.0,
      fitsWithoutScaling: scaleFactor >= 1.0,
      
      // Grid information
      row: row,
      col: col,
      labelIndex: labelIndex,
      
      // Debug info
      rotatedCoords: { x: rotatedX, y: rotatedY },
      rotatedPageSize: { width: rotatedPageWidth, height: rotatedPageHeight },
      
      // Workflow info
      workflow: 'print_rotate_peel',
      instructions: [
        'Print on legal paper (8.5" × 14")',
        'Rotate paper 90° clockwise',
        'Labels are now readable and peelable'
      ]
    };
  }

  /**
   * Alternative positioning method with custom spacing
   * @param {number} labelIndex - Index of label (0-3)
   * @param {Object} options - Positioning options
   * @returns {Object} - Position coordinates with custom spacing
   */
  static calculateUlineS5492PositionWithSpacing(labelIndex, options = {}) {
    const {
      columnGap = 12,  // 12pt gap between columns
      rowGap = 12,     // 12pt gap between rows
      topMargin = 50,  // Extra top margin
      leftMargin = 50  // Extra left margin
    } = options;
    
    // Start with base rotated positioning
    const basePosition = this.calculateUlineS5492PositionRotated(labelIndex);
    
    // Apply custom spacing in rotated coordinate system
    const cols = 2;
    const row = Math.floor(labelIndex / cols);
    const col = labelIndex % cols;
    
    const rotatedX = leftMargin + col * (basePosition.rotatedWidth + columnGap);
    const rotatedY = topMargin + row * (basePosition.rotatedHeight + rowGap);
    
    // Transform back to PDF coordinates
    const printerMargin = 12;
    const rotatedPageWidth = 984; // printableHeight
    
    const pdfX = printerMargin + rotatedY;
    const pdfY = printerMargin + (rotatedPageWidth - rotatedX - basePosition.rotatedWidth);
    
    return {
      ...basePosition,
      x: Math.floor(pdfX),
      y: Math.floor(pdfY),
      method: 'custom_spacing',
      spacing: { columnGap, rowGap, topMargin, leftMargin },
      rotatedCoords: { x: rotatedX, y: rotatedY }
    };
  }

  /**
   * Generate alignment test data for all 4 rotated label positions
   * @param {Object} options - Test options
   * @returns {Object} - Position test data
   */
  static generateRotatedAlignmentTestData(options = {}) {
    const { method = 'rotated', includeDebug = true } = options;
    
    const positions = [];
    
    for (let i = 0; i < 4; i++) {
      let position;
      
      switch (method) {
        case 'spacing':
          position = this.calculateUlineS5492PositionWithSpacing(i, options);
          break;
        default:
          position = this.calculateUlineS5492PositionRotated(i);
      }
      
      positions.push({
        labelIndex: i,
        position: position,
        centerX: position.x + position.width / 2,
        centerY: position.y + position.height / 2,
        corners: {
          topLeft: { x: position.x, y: position.y },
          topRight: { x: position.x + position.width, y: position.y },
          bottomLeft: { x: position.x, y: position.y + position.height },
          bottomRight: { x: position.x + position.width, y: position.y + position.height }
        },
        // Rotated view info
        rotatedDimensions: {
          width: position.rotatedWidth,
          height: position.rotatedHeight,
          widthInches: (position.rotatedWidth / 72).toFixed(2),
          heightInches: (position.rotatedHeight / 72).toFixed(2)
        },
        isProperlyRotated: position.isRotated,
        fitsWithoutScaling: position.fitsWithoutScaling
      });
    }
    
    return {
      positions: positions,
      method: method,
      pageSize: { width: 612, height: 1008 },
      labelCount: 4,
      gridLayout: '2×2 (when rotated)',
      sheetFormat: 'Legal (8.5" × 14")',
      labelSize: '6" wide × 4" tall (when rotated)',
      orientation: 'rotated',
      rotationAngle: 90,
      workflow: 'Print → Rotate 90° → Peel',
      generatedAt: new Date().toISOString(),
      validation: {
        allRotated: positions.every(p => p.isProperlyRotated),
        allFitWithoutScaling: positions.every(p => p.fitsWithoutScaling),
        averageRotatedWidth: positions.reduce((sum, p) => sum + p.rotatedDimensions.width, 0) / positions.length,
        averageRotatedHeight: positions.reduce((sum, p) => sum + p.rotatedDimensions.height, 0) / positions.length
      }
    };
  }

  /**
   * Validate rotated positioning calculations
   * @param {Object} positionData - Position data to validate
   * @returns {Object} - Validation results
   */
  static validateRotatedPositioning(positionData) {
    const { positions } = positionData;
    const issues = [];
    const warnings = [];
    
    positions.forEach((pos, index) => {
      const { position } = pos;
      
      // Check rotation status
      if (!pos.isProperlyRotated) {
        issues.push(`Label ${index}: Not marked as rotated`);
      }
      
      // Check if labels fit on page
      if (position.x < 0) issues.push(`Label ${index}: X position is negative (${position.x})`);
      if (position.y < 0) issues.push(`Label ${index}: Y position is negative (${position.y})`);
      if (position.x + position.width > 612) {
        warnings.push(`Label ${index}: Extends beyond page width by ${(position.x + position.width - 612).toFixed(0)}pt`);
      }
      if (position.y + position.height > 1008) {
        issues.push(`Label ${index}: Extends beyond page height by ${(position.y + position.height - 1008).toFixed(0)}pt`);
      }
      
      // Check printer margins (12pt on all sides)
      if (position.x < 12) warnings.push(`Label ${index}: Within printer margin (left)`);
      if (position.y < 12) warnings.push(`Label ${index}: Within printer margin (top)`);
      if (612 - (position.x + position.width) < 12) warnings.push(`Label ${index}: Within printer margin (right)`);
      if (1008 - (position.y + position.height) < 12) warnings.push(`Label ${index}: Within printer margin (bottom)`);
      
      // Check rotated dimensions
      if (pos.rotatedDimensions.width < 300) {
        warnings.push(`Label ${index}: Rotated width is small (${pos.rotatedDimensions.widthInches}")`);
      }
      if (pos.rotatedDimensions.height < 200) {
        warnings.push(`Label ${index}: Rotated height is small (${pos.rotatedDimensions.heightInches}")`);
      }
      
      // Check if scaling is needed but not applied
      if (!pos.fitsWithoutScaling && !position.isScaled) {
        warnings.push(`Label ${index}: May need scaling but none applied`);
      }
    });
    
    // Check for overlapping labels
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const pos1 = positions[i].position;
        const pos2 = positions[j].position;
        
        const overlapX = pos1.x < pos2.x + pos2.width && pos2.x < pos1.x + pos1.width;
        const overlapY = pos1.y < pos2.y + pos2.height && pos2.y < pos1.y + pos1.height;
        
        if (overlapX && overlapY) {
          issues.push(`Labels ${i} and ${j} appear to overlap`);
        }
      }
    }
    
    // Overall rotation validation
    if (!positionData.validation.allRotated) {
      issues.push('Not all labels are properly marked as rotated');
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues,
      warnings: warnings,
      summary: {
        totalLabels: positions.length,
        rotatedLabels: positions.filter(p => p.isProperlyRotated).length,
        labelsWithIssues: issues.length,
        labelsWithWarnings: warnings.length,
        fitWithoutScaling: positions.filter(p => p.fitsWithoutScaling).length
      }
    };
  }

  /**
   * Get debug information for rotated positioning
   * @param {string} method - Positioning method to analyze
   * @returns {Object} - Detailed debug information
   */
  static getRotatedDebugInfo(method = 'rotated') {
    const testData = this.generateRotatedAlignmentTestData({ method: method, includeDebug: true });
    const validation = this.validateRotatedPositioning(testData);
    
    return {
      migrationInfo: {
        from: 'S-21846 (7-3/4" × 4-3/4", 2 per sheet, letter)',
        to: 'S-5492 (4" × 6" positioned sideways, 4 per sheet, legal)',
        status: 'ROTATED LAYOUT - Print then rotate paper 90°',
        version: '6.1.0'
      },
      positioningMethod: method,
      testData: testData,
      validation: validation,
      rotationInfo: {
        angle: 90,
        direction: 'clockwise',
        workflow: 'Print PDF → Rotate paper 90° → Read/peel labels',
        afterRotation: {
          effectivePageSize: '14" × 8.5" (rotated view)',
          labelSize: '6" wide × 4" tall',
          readableOrientation: true
        }
      },
      printerInfo: {
        model: 'HP E877',
        margins: '0.167" on all sides',
        printableArea: '588 × 984 points',
        recommendedSetting: 'Actual Size (no scaling)'
      },
      physicalAlignment: {
        labelSheet: 'Uline S-5492',
        positioning: 'Sideways on legal paper',
        peelDirection: 'After 90° rotation',
        expectedFit: validation.summary.fitWithoutScaling === 4 ? 'Perfect' : 'Needs adjustment'
      },
      recommendations: this.generateRotatedPositioningRecommendations(testData, validation)
    };
  }

  /**
   * Generate positioning recommendations for rotated layout
   * @param {Object} testData - Test positioning data
   * @param {Object} validation - Validation results
   * @returns {Array} - Array of recommendations
   */
  static generateRotatedPositioningRecommendations(testData, validation) {
    const recommendations = [];
    
    if (validation.issues.length > 0) {
      recommendations.push('CRITICAL: Positioning issues detected for rotated layout');
      recommendations.push('Verify calculations and test print alignment');
    }
    
    if (validation.warnings.length > 0) {
      recommendations.push('Positioning warnings detected - check printer margins');
    }
    
    // Check rotation status
    if (testData.validation.allRotated) {
      recommendations.push('✓ All labels are properly configured for rotation');
    } else {
      recommendations.push('✗ Some labels are not configured for rotation');
    }
    
    // Check scaling requirements
    if (testData.validation.allFitWithoutScaling) {
      recommendations.push('✓ Labels fit without scaling - optimal quality');
    } else {
      recommendations.push('⚠ Some labels may require scaling');
    }
    
    // Workflow recommendations
    recommendations.push('WORKFLOW: Print → Rotate paper 90° clockwise → Peel labels');
    recommendations.push('Each label will be 6" wide × 4" tall when paper is rotated');
    recommendations.push('Use HP E877 with "Actual Size" print setting');
    recommendations.push('Test alignment with physical Uline S-5492 sheets');
    
    if (validation.summary.labelsWithIssues === 0 && validation.summary.labelsWithWarnings === 0) {
      recommendations.push('✓ Rotated positioning looks correct - ready for test printing');
    }
    
    return recommendations;
  }

  /**
   * Export rotated positioning data
   * @param {string} method - Positioning method
   * @param {string} format - Export format ('json', 'csv', 'debug')
   * @returns {string} - Formatted export data
   */
  static exportRotatedPositioningData(method = 'rotated', format = 'json') {
    const debugInfo = this.getRotatedDebugInfo(method);
    
    switch (format) {
      case 'csv':
        let csv = 'Label,PDFx,PDFy,PDFWidth,PDFHeight,RotatedWidth,RotatedHeight,RotatedWidthInches,RotatedHeightInches\n';
        debugInfo.testData.positions.forEach((pos, index) => {
          const p = pos.position;
          const r = pos.rotatedDimensions;
          csv += `${index},${p.x},${p.y},${p.width},${p.height},${r.width},${r.height},${r.widthInches},${r.heightInches}\n`;
        });
        return csv;
        
      case 'debug':
        return JSON.stringify(debugInfo, null, 2);
        
      default: // json
        return JSON.stringify({
          method: method,
          orientation: 'rotated',
          rotationAngle: 90,
          workflow: 'print_rotate_peel',
          positions: debugInfo.testData.positions.map(pos => ({
            ...pos.position,
            rotatedDimensions: pos.rotatedDimensions
          })),
          validation: debugInfo.validation
        }, null, 2);
    }
  }

  // Legacy compatibility methods
  static calculateUlineLabelPosition(labelIndex) {
    return this.calculateUlineS5492PositionRotated(labelIndex % 4);
  }

  static getSpacingDebugInfo() {
    return this.getRotatedDebugInfo('rotated');
  }

  // React Component Methods
  
  constructor(props) {
    super(props);
    this.state = {
      selectedMethod: 'rotated',
      showDebugInfo: false,
      testPositions: null,
      rotationValid: null
    };
  }

  componentDidMount() {
    this.updateTestPositions();
  }

  updateTestPositions = () => {
    const testData = UlineS5492Label.generateRotatedAlignmentTestData({ 
      method: this.state.selectedMethod 
    });
    const validation = UlineS5492Label.validateRotatedPositioning(testData);
    
    this.setState({ 
      testPositions: testData,
      rotationValid: validation.summary.rotatedLabels === 4
    });
  }

  handleMethodChange = (method) => {
    this.setState({ selectedMethod: method }, this.updateTestPositions);
  }

  toggleDebugInfo = () => {
    this.setState({ showDebugInfo: !this.state.showDebugInfo });
  }

  render() {
    const { selectedMethod, showDebugInfo, testPositions, rotationValid } = this.state;
    
    return (
      <div className="uline-s5492-label-component p-6">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="bg-purple-600 text-white px-6 py-4 rounded-t-lg">
            <h2 className="text-2xl font-bold">Uline S-5492 Label Configuration (ROTATED)</h2>
            <p className="text-purple-100">Labels positioned SIDEWAYS - Rotate paper 90° to read/peel</p>
          </div>
          
          <div className="p-6">
            {/* Rotation Status */}
            {rotationValid !== null && (
              <div className={`mb-4 p-3 rounded-lg ${
                rotationValid 
                  ? 'bg-green-100 border border-green-200' 
                  : 'bg-red-100 border border-red-200'
              }`}>
                <div className={`font-medium ${rotationValid ? 'text-green-800' : 'text-red-800'}`}>
                  {rotationValid ? '✓ Labels configured for ROTATION (correct)' : '✗ Labels NOT configured for rotation (issue)'}
                </div>
                <div className={`text-sm ${rotationValid ? 'text-green-700' : 'text-red-700'}`}>
                  Workflow: Print PDF → Rotate paper 90° clockwise → Read/peel labels
                </div>
              </div>
            )}

            {/* Workflow Instructions */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Rotated Label Workflow</h3>
              <ol className="list-decimal list-inside text-blue-700 space-y-1">
                <li>Print PDF on legal size paper (8.5" × 14")</li>
                <li>Use HP E877 with "Actual Size" setting</li>
                <li><strong>Rotate the printed paper 90° clockwise</strong></li>
                <li>Labels are now readable and properly oriented for peeling</li>
                <li>Each label: 6" wide × 4" tall (in rotated view)</li>
              </ol>
            </div>

            {/* Method Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Positioning Method:
              </label>
              <div className="flex space-x-4">
                {['rotated', 'spacing'].map(method => (
                  <button
                    key={method}
                    onClick={() => this.handleMethodChange(method)}
                    className={`px-4 py-2 rounded-md font-medium ${
                      selectedMethod === method
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </button>
                ))}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <strong>Rotated:</strong> Optimized sideways positioning | 
                <strong> Spacing:</strong> Custom gaps and margins
              </div>
            </div>

            {/* Position Preview */}
            {testPositions && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Rotated Label Positions Preview</h3>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {testPositions.positions.map((pos, index) => (
                      <div key={index} className={`p-3 rounded border ${
                        pos.isProperlyRotated ? 'bg-white' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="font-medium mb-2">Label {index + 1} (ROTATED)</div>
                        <div className="text-gray-600">
                          <div><strong>PDF Position:</strong> {pos.position.x}, {pos.position.y} pt</div>
                          <div><strong>PDF Size:</strong> {pos.position.width} × {pos.position.height} pt</div>
                          <div className="mt-2 p-2 bg-blue-50 rounded">
                            <div className="text-blue-800 font-medium">After 90° Rotation:</div>
                            <div className="text-blue-700">
                              <div>Size: {pos.rotatedDimensions.widthInches}" × {pos.rotatedDimensions.heightInches}"</div>
                              <div>({pos.rotatedDimensions.width} × {pos.rotatedDimensions.height} pt)</div>
                            </div>
                          </div>
                          <div className={pos.isProperlyRotated ? 'text-green-600' : 'text-red-600'}>
                            {pos.isProperlyRotated ? '✓ Rotated' : '✗ Not rotated'}
                          </div>
                          <div className={pos.fitsWithoutScaling ? 'text-green-600' : 'text-orange-600'}>
                            {pos.fitsWithoutScaling ? '✓ Fits perfectly' : '⚠ May need scaling'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Debug Toggle */}
            <div className="mb-4">
              <button
                onClick={this.toggleDebugInfo}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                {showDebugInfo ? 'Hide' : 'Show'} Debug Information
              </button>
            </div>

            {/* Debug Information */}
            {showDebugInfo && (
              <div className="bg-gray-100 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Debug Information</h3>
                <pre className="text-xs overflow-auto bg-white p-3 rounded border max-h-96">
                  {JSON.stringify(UlineS5492Label.getRotatedDebugInfo(selectedMethod), null, 2)}
                </pre>
              </div>
            )}

            {/* Migration Information */}
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 mb-2">S-5492 ROTATED Migration Complete</h3>
              <div className="text-green-700 text-sm">
                <p><strong>From:</strong> S-21846 (7-3/4" × 4-3/4", 2 labels per letter sheet)</p>
                <p><strong>To:</strong> S-5492 (4" × 6" positioned sideways, 4 labels per legal sheet)</p>
                <p className="mt-2"><strong>Key Features:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Labels positioned SIDEWAYS on legal paper</li>
                  <li>Print-rotate-peel workflow</li>
                  <li>6" wide × 4" tall when paper is rotated</li>
                  <li>HP E877 printer margin compensation</li>
                  <li>No scaling required - labels fit perfectly</li>
                </ul>
              </div>
            </div>

            {/* Visual Rotation Guide */}
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Visual Rotation Guide</h3>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="w-16 h-24 bg-white border-2 border-gray-400 rounded flex items-center justify-center text-xs">
                    <div className="transform -rotate-90">Labels</div>
                  </div>
                  <div className="text-sm mt-1">1. Print</div>
                </div>
                <div className="text-2xl">→</div>
                <div className="text-center">
                  <div className="w-24 h-16 bg-white border-2 border-gray-400 rounded flex items-center justify-center text-xs">
                    Labels
                  </div>
                  <div className="text-sm mt-1">2. Rotate 90°</div>
                </div>
                <div className="text-2xl">→</div>
                <div className="text-center">
                  <div className="w-20 h-12 bg-green-100 border-2 border-green-400 rounded flex items-center justify-center text-xs">
                    Peel
                  </div>
                  <div className="text-sm mt-1">3. Use</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default UlineS5492Label;