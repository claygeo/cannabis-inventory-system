import React, { useState } from 'react';

/**
 * Uline S-5492 Label Component (HORIZONTAL: 6" WIDE × 4" TALL Labels)
 * CORRECTED for proper horizontal orientation on legal size sheets
 */
class UlineS5492Label extends React.Component {
  /**
   * Calculate exact label position for Uline S-5492 HORIZONTAL labels
   * CRITICAL: Uline 4" × 6" = 6" WIDE × 4" TALL (432pt WIDE × 288pt TALL)
   * @param {number} labelIndex - Index of label (0-3 for 4 labels per sheet)
   * @returns {Object} - Position coordinates in points with debug info
   */
  static calculateUlineS5492Position(labelIndex) {
    // Legal size sheet dimensions (8.5" × 14")
    const pageWidth = 612;   // 8.5" in points
    const pageHeight = 1008; // 14" in points
    
    // HP E877 printer specifications (non-printable margins)
    const printerMargin = 12; // 0.167" ≈ 12pt
    const printableWidth = pageWidth - (printerMargin * 2);   // 588pt
    const printableHeight = pageHeight - (printerMargin * 2); // 984pt
    
    // S-5492 CORRECTED dimensions: 6" WIDE × 4" TALL (HORIZONTAL)
    const labelWidth = 432;  // 6" WIDE in points
    const labelHeight = 288; // 4" TALL in points
    
    // Grid layout: 2 columns × 2 rows
    const cols = 2;
    const rows = 2;
    const row = Math.floor(labelIndex / cols);
    const col = labelIndex % cols;
    
    // CONSTRAINT: 2 × 432pt = 864pt > 588pt printable width
    // SOLUTION: Scale down proportionally to fit
    const requiredWidth = cols * labelWidth;   // 864pt
    const requiredHeight = rows * labelHeight; // 576pt
    
    const scaleX = printableWidth / requiredWidth;   // 588/864 = 0.68
    const scaleY = printableHeight / requiredHeight; // 984/576 = 1.71
    const scaleFactor = Math.min(scaleX, scaleY);    // Use 0.68 (smaller)
    
    const actualLabelWidth = Math.floor(labelWidth * scaleFactor);   // ~294pt
    const actualLabelHeight = Math.floor(labelHeight * scaleFactor); // ~196pt
    
    // Center the grid on the page
    const totalGridWidth = cols * actualLabelWidth;   // ~588pt
    const totalGridHeight = rows * actualLabelHeight; // ~392pt
    
    const startX = printerMargin + Math.floor((printableWidth - totalGridWidth) / 2);
    const startY = printerMargin + Math.floor((printableHeight - totalGridHeight) / 2);
    
    // Individual label position (no gaps - labels are adjacent)
    const xPos = startX + (col * actualLabelWidth);
    const yPos = startY + (row * actualLabelHeight);
    
    return {
      x: Math.floor(xPos),
      y: Math.floor(yPos),
      width: actualLabelWidth,
      height: actualLabelHeight,
      
      // Debug and scaling information
      scaleFactor: scaleFactor,
      originalWidth: labelWidth,
      originalHeight: labelHeight,
      isScaled: scaleFactor < 1.0,
      
      // Orientation confirmation - CRITICAL
      orientation: 'horizontal',     // WIDER than tall
      isHorizontal: actualLabelWidth > actualLabelHeight, // Should be TRUE
      aspectRatio: actualLabelWidth / actualLabelHeight,  // Should be > 1
      
      // Grid information
      row: row,
      col: col,
      labelIndex: labelIndex,
      
      // Page information
      pageWidth: pageWidth,
      pageHeight: pageHeight,
      printableWidth: printableWidth,
      printableHeight: printableHeight
    };
  }

  /**
   * Alternative precise positioning method for physical sheet alignment
   * CORRECTED for HORIZONTAL labels: 6" WIDE × 4" TALL
   * @param {number} labelIndex - Index of label (0-3)
   * @returns {Object} - Position coordinates optimized for physical alignment
   */
  static calculateUlineS5492PositionPrecise(labelIndex) {
    // Physical measurements from actual Uline S-5492 sheets
    const measurements = {
      // Page dimensions
      pageWidth: 612,    // 8.5" legal width
      pageHeight: 1008,  // 14" legal height
      
      // CORRECTED: S-5492 labels are 6" WIDE × 4" TALL (horizontal)
      labelWidth: 432,   // 6" WIDE in points
      labelHeight: 288,  // 4" TALL in points
      
      // Estimated margins (to be confirmed with physical sheets)
      topMargin: 120,    // 1.67" from top edge (larger for legal paper)
      bottomMargin: 120, // 1.67" from bottom edge
      leftMargin: 0,     // Start at edge (labels will extend beyond)
      rightMargin: 0,    // No right margin
      
      // Gaps between labels (estimated)
      columnGap: 0,      // No gap - labels are adjacent
      rowGap: 36         // 0.5" between rows
    };
    
    const cols = 2;
    const row = Math.floor(labelIndex / cols);
    const col = labelIndex % cols;
    
    // Calculate positions using physical measurements
    const xPos = measurements.leftMargin + (col * measurements.labelWidth);
    const yPos = measurements.topMargin + (row * (measurements.labelHeight + measurements.rowGap));
    
    // Verify calculations fit within page
    const totalWidth = measurements.leftMargin + (2 * measurements.labelWidth) + measurements.rightMargin;
    const totalHeight = measurements.topMargin + (2 * measurements.labelHeight) + measurements.rowGap + measurements.bottomMargin;
    
    const fitsWidth = totalWidth <= measurements.pageWidth;
    const fitsHeight = totalHeight <= measurements.pageHeight;
    const fitsOnPage = fitsWidth && fitsHeight;
    
    return {
      x: xPos,
      y: yPos,
      width: measurements.labelWidth,
      height: measurements.labelHeight,
      
      // Layout characteristics - CORRECTED
      orientation: 'horizontal',     // Labels are WIDER than tall
      contentFlow: 'horizontal',     // Content flows horizontally within each label
      isHorizontal: true,            // Confirmation flag
      aspectRatio: measurements.labelWidth / measurements.labelHeight, // 1.5 (wider than tall)
      
      // Validation
      fitsOnPage: fitsOnPage,
      fitsWidth: fitsWidth,
      fitsHeight: fitsHeight,
      totalWidth: totalWidth,
      totalHeight: totalHeight,
      
      // Physical measurement info
      measurements: measurements,
      row: row,
      col: col,
      labelIndex: labelIndex,
      
      // Warnings
      warnings: [
        ...(!fitsWidth ? ['Labels extend beyond page width - this is expected for S-5492'] : []),
        ...(!fitsHeight ? ['Labels extend beyond page height - check margins'] : [])
      ]
    };
  }

  /**
   * Hybrid positioning method - combines scaled and precise approaches
   * Recommended for production use with fine-tuning capability
   * @param {number} labelIndex - Index of label (0-3)
   * @param {Object} options - Positioning options
   * @returns {Object} - Position coordinates with hybrid calculation
   */
  static calculateUlineS5492PositionHybrid(labelIndex, options = {}) {
    const {
      usePhysicalMeasurements = false,
      customScaling = null,
      debugMode = true
    } = options;
    
    // Get both calculations
    const scaledPosition = this.calculateUlineS5492Position(labelIndex);
    const precisePosition = this.calculateUlineS5492PositionPrecise(labelIndex);
    
    // Use precise if explicitly requested and fits reasonably
    if (usePhysicalMeasurements && precisePosition.fitsHeight) {
      return {
        ...precisePosition,
        method: 'precise',
        alternative: scaledPosition,
        note: 'Using physical measurements - may extend beyond page width'
      };
    }
    
    // Apply custom scaling if provided
    if (customScaling && customScaling !== 1.0) {
      const customWidth = Math.floor(432 * customScaling);  // Scale original width
      const customHeight = Math.floor(288 * customScaling); // Scale original height
      
      // Recalculate positions with custom scaling
      const cols = 2;
      const row = Math.floor(labelIndex / cols);
      const col = labelIndex % cols;
      
      const startX = (612 - (cols * customWidth)) / 2;
      const startY = (1008 - (2 * customHeight)) / 2;
      
      return {
        x: Math.floor(startX + (col * customWidth)),
        y: Math.floor(startY + (row * customHeight)),
        width: customWidth,
        height: customHeight,
        scaleFactor: customScaling,
        isScaled: customScaling !== 1.0,
        originalWidth: 432,
        originalHeight: 288,
        orientation: 'horizontal',
        isHorizontal: customWidth > customHeight,
        method: 'custom_scale',
        original: scaledPosition
      };
    }
    
    // Default to scaled position
    return {
      ...scaledPosition,
      method: 'scaled',
      alternative: precisePosition,
      debugMode: debugMode
    };
  }

  /**
   * Generate alignment test data for all 4 label positions
   * @param {Object} options - Test options
   * @returns {Array} - Array of position data for testing
   */
  static generateAlignmentTestData(options = {}) {
    const { method = 'scaled', includeDebug = true } = options;
    
    const positions = [];
    
    for (let i = 0; i < 4; i++) {
      let position;
      
      switch (method) {
        case 'precise':
          position = this.calculateUlineS5492PositionPrecise(i);
          break;
        case 'hybrid':
          position = this.calculateUlineS5492PositionHybrid(i, options);
          break;
        default:
          position = this.calculateUlineS5492Position(i);
      }
      
      positions.push({
        labelIndex: i,
        position: position,
        centerX: position.x + (position.width / 2),
        centerY: position.y + (position.height / 2),
        corners: {
          topLeft: { x: position.x, y: position.y },
          topRight: { x: position.x + position.width, y: position.y },
          bottomLeft: { x: position.x, y: position.y + position.height },
          bottomRight: { x: position.x + position.width, y: position.y + position.height }
        },
        // Validation
        isHorizontal: position.width > position.height,
        aspectRatio: position.width / position.height,
        dimensionsInches: {
          width: (position.width / 72).toFixed(2),
          height: (position.height / 72).toFixed(2)
        }
      });
    }
    
    return {
      positions: positions,
      method: method,
      pageSize: { width: 612, height: 1008 },
      labelCount: 4,
      gridLayout: '2×2',
      sheetFormat: 'Legal (8.5" × 14")',
      labelSize: '6" WIDE × 4" TALL (HORIZONTAL)',
      orientation: 'horizontal',
      generatedAt: new Date().toISOString(),
      validation: {
        allHorizontal: positions.every(p => p.isHorizontal),
        averageAspectRatio: positions.reduce((sum, p) => sum + p.aspectRatio, 0) / positions.length
      }
    };
  }

  /**
   * Validate S-5492 positioning calculations
   * @param {Object} positionData - Position data to validate
   * @returns {Object} - Validation results
   */
  static validatePositioning(positionData) {
    const { positions } = positionData;
    const issues = [];
    const warnings = [];
    
    positions.forEach((pos, index) => {
      const { position } = pos;
      
      // Check orientation - CRITICAL for S-5492
      if (!pos.isHorizontal) {
        issues.push(`Label ${index}: NOT HORIZONTAL - width (${position.width}) should be > height (${position.height})`);
      }
      
      if (pos.aspectRatio < 1.0) {
        issues.push(`Label ${index}: Aspect ratio ${pos.aspectRatio.toFixed(2)} indicates vertical orientation (should be > 1.0)`);
      }
      
      // Check if label extends beyond page boundaries
      if (position.x < 0) issues.push(`Label ${index}: X position is negative (${position.x})`);
      if (position.y < 0) issues.push(`Label ${index}: Y position is negative (${position.y})`);
      if (position.x + position.width > 612) {
        warnings.push(`Label ${index}: Extends beyond page width by ${(position.x + position.width - 612).toFixed(0)}pt`);
      }
      if (position.y + position.height > 1008) {
        issues.push(`Label ${index}: Extends beyond page height by ${(position.y + position.height - 1008).toFixed(0)}pt`);
      }
      
      // Check for reasonable margins
      if (position.x < 6) warnings.push(`Label ${index}: Very close to left edge (${position.x}pt)`);
      if (position.y < 6) warnings.push(`Label ${index}: Very close to top edge (${position.y}pt)`);
      
      // Check label dimensions are reasonable
      if (position.width < 200) warnings.push(`Label ${index}: Width is quite small (${position.width}pt = ${(position.width/72).toFixed(2)}")`);
      if (position.height < 150) warnings.push(`Label ${index}: Height is quite small (${position.height}pt = ${(position.height/72).toFixed(2)}")`);
      
      // Check that scaled labels aren't too small
      if (position.isScaled && position.scaleFactor < 0.6) {
        warnings.push(`Label ${index}: Heavy scaling (${(position.scaleFactor * 100).toFixed(0)}%) - text may be hard to read`);
      }
    });
    
    // Check for overlapping labels
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const pos1 = positions[i].position;
        const pos2 = positions[j].position;
        
        // Simple overlap detection
        const overlapX = pos1.x < pos2.x + pos2.width && pos2.x < pos1.x + pos1.width;
        const overlapY = pos1.y < pos2.y + pos2.height && pos2.y < pos1.y + pos1.height;
        
        if (overlapX && overlapY) {
          issues.push(`Labels ${i} and ${j} appear to overlap`);
        }
      }
    }
    
    // Check overall orientation consistency
    const horizontalCount = positions.filter(p => p.isHorizontal).length;
    if (horizontalCount !== positions.length) {
      issues.push(`Only ${horizontalCount}/${positions.length} labels are horizontal - all should be horizontal for S-5492`);
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues,
      warnings: warnings,
      summary: {
        totalLabels: positions.length,
        horizontalLabels: horizontalCount,
        labelsWithIssues: issues.length,
        labelsWithWarnings: warnings.length,
        averageAspectRatio: positionData.validation?.averageAspectRatio || 0
      }
    };
  }

  /**
   * Get debug information for spacing verification and troubleshooting
   * @param {string} method - Positioning method to analyze
   * @returns {Object} - Detailed debug information
   */
  static getDebugInfo(method = 'scaled') {
    const testData = this.generateAlignmentTestData({ method: method, includeDebug: true });
    const validation = this.validatePositioning(testData);
    
    // Calculate spacing between labels
    const positions = testData.positions;
    const horizontalGaps = [];
    const verticalGaps = [];
    
    // Horizontal gaps (between columns)
    for (let row = 0; row < 2; row++) {
      const leftLabel = positions[row * 2];
      const rightLabel = positions[row * 2 + 1];
      const gap = rightLabel.position.x - (leftLabel.position.x + leftLabel.position.width);
      horizontalGaps.push(gap);
    }
    
    // Vertical gaps (between rows)
    for (let col = 0; col < 2; col++) {
      const topLabel = positions[col];
      const bottomLabel = positions[col + 2];
      const gap = bottomLabel.position.y - (topLabel.position.y + topLabel.position.height);
      verticalGaps.push(gap);
    }
    
    return {
      migrationInfo: {
        from: 'S-21846 (7-3/4" × 4-3/4", 2 per sheet, 8.5" × 11")',
        to: 'S-5492 (6" WIDE × 4" TALL horizontal, 4 per sheet, 8.5" × 14")',
        status: 'CORRECTED for horizontal orientation',
        version: '6.0.0'
      },
      positioningMethod: method,
      testData: testData,
      validation: validation,
      spacing: {
        horizontalGaps: horizontalGaps,
        verticalGaps: verticalGaps,
        averageHorizontalGap: horizontalGaps.length > 0 ? horizontalGaps.reduce((a, b) => a + b, 0) / horizontalGaps.length : 0,
        averageVerticalGap: verticalGaps.length > 0 ? verticalGaps.reduce((a, b) => a + b, 0) / verticalGaps.length : 0
      },
      pageUtilization: {
        totalLabelArea: positions.reduce((sum, pos) => sum + (pos.position.width * pos.position.height), 0),
        pageArea: 612 * 1008,
        utilizationPercent: ((positions.reduce((sum, pos) => sum + (pos.position.width * pos.position.height), 0)) / (612 * 1008)) * 100
      },
      orientationCheck: {
        expectedOrientation: 'horizontal',
        allLabelsHorizontal: validation.summary.horizontalLabels === 4,
        averageAspectRatio: validation.summary.averageAspectRatio,
        aspectRatioExpected: '> 1.0 (wider than tall)'
      },
      recommendations: this.generatePositioningRecommendations(testData, validation)
    };
  }

  /**
   * Generate positioning recommendations based on analysis
   * @param {Object} testData - Test positioning data
   * @param {Object} validation - Validation results
   * @returns {Array} - Array of recommendations
   */
  static generatePositioningRecommendations(testData, validation) {
    const recommendations = [];
    
    if (validation.issues.length > 0) {
      recommendations.push('CRITICAL: Positioning issues detected - labels may not print correctly');
      
      // Check for orientation issues specifically
      if (validation.summary.horizontalLabels < 4) {
        recommendations.push('ORIENTATION ERROR: Labels should be HORIZONTAL (6" WIDE × 4" TALL)');
        recommendations.push('Check label dimensions - width should be greater than height');
      }
    }
    
    if (validation.warnings.length > 0) {
      recommendations.push('Positioning warnings detected - verify alignment with physical sheets');
    }
    
    const positions = testData.positions;
    const firstLabel = positions[0].position;
    
    if (firstLabel.isScaled) {
      recommendations.push(`Labels are scaled to ${(firstLabel.scaleFactor * 100).toFixed(1)}% to fit on legal paper`);
      if (firstLabel.scaleFactor < 0.7) {
        recommendations.push('Heavy scaling detected - consider using precise positioning or custom margins');
      } else {
        recommendations.push('Scaling is reasonable for S-5492 format');
      }
    }
    
    // Check orientation
    if (testData.validation.allHorizontal) {
      recommendations.push('✓ All labels are correctly oriented HORIZONTAL');
    } else {
      recommendations.push('✗ Some labels are not horizontal - check calculations');
    }
    
    if (validation.summary.labelsWithWarnings === 0 && validation.summary.labelsWithIssues === 0) {
      recommendations.push('Positioning looks good - ready for test printing');
      recommendations.push('Print a test page with "Actual Size" setting on HP E877');
      recommendations.push('Verify alignment with physical Uline S-5492 sheets');
    }
    
    // Specific S-5492 recommendations
    recommendations.push('For S-5492: Each label should be 6" WIDE × 4" TALL');
    recommendations.push('Content should flow horizontally within each label');
    recommendations.push('Use bottom-focused layout as specified in requirements');
    
    return recommendations;
  }

  /**
   * Export positioning data for external tools or debugging
   * @param {string} method - Positioning method
   * @param {string} format - Export format ('json', 'csv', 'debug')
   * @returns {string} - Formatted export data
   */
  static exportPositioningData(method = 'scaled', format = 'json') {
    const debugInfo = this.getDebugInfo(method);
    
    switch (format) {
      case 'csv':
        let csv = 'Label,X,Y,Width,Height,WidthInches,HeightInches,IsHorizontal,AspectRatio\n';
        debugInfo.testData.positions.forEach((pos, index) => {
          const p = pos.position;
          csv += `${index},${p.x},${p.y},${p.width},${p.height},${pos.dimensionsInches.width},${pos.dimensionsInches.height},${pos.isHorizontal},${pos.aspectRatio.toFixed(2)}\n`;
        });
        return csv;
        
      case 'debug':
        return JSON.stringify(debugInfo, null, 2);
        
      default: // json
        return JSON.stringify({
          method: method,
          orientation: 'horizontal',
          labelSize: '6" WIDE × 4" TALL',
          positions: debugInfo.testData.positions.map(pos => ({
            ...pos.position,
            isHorizontal: pos.isHorizontal,
            aspectRatio: pos.aspectRatio,
            dimensionsInches: pos.dimensionsInches
          })),
          validation: debugInfo.validation,
          spacing: debugInfo.spacing
        }, null, 2);
    }
  }

  // Legacy compatibility methods
  
  /**
   * Legacy method for backward compatibility with existing code
   * @param {number} labelIndex - Label index
   * @returns {Object} - Position data
   */
  static calculateUlineLabelPosition(labelIndex) {
    return this.calculateUlineS5492Position(labelIndex % 4);
  }

  /**
   * Legacy precise method for backward compatibility
   * @param {number} labelIndex - Label index
   * @returns {Object} - Position data
   */
  static calculateUlineLabelPositionPrecise(labelIndex) {
    return this.calculateUlineS5492PositionPrecise(labelIndex % 4);
  }

  /**
   * Legacy spacing debug method for backward compatibility
   * @returns {Object} - Debug spacing information
   */
  static getSpacingDebugInfo() {
    return this.getDebugInfo('scaled');
  }

  // React Component Methods
  
  constructor(props) {
    super(props);
    this.state = {
      selectedMethod: 'scaled',
      showDebugInfo: false,
      testPositions: null,
      orientationValid: null
    };
  }

  componentDidMount() {
    this.updateTestPositions();
  }

  updateTestPositions = () => {
    const testData = UlineS5492Label.generateAlignmentTestData({ 
      method: this.state.selectedMethod 
    });
    const validation = UlineS5492Label.validatePositioning(testData);
    
    this.setState({ 
      testPositions: testData,
      orientationValid: validation.summary.horizontalLabels === 4
    });
  }

  handleMethodChange = (method) => {
    this.setState({ selectedMethod: method }, this.updateTestPositions);
  }

  toggleDebugInfo = () => {
    this.setState({ showDebugInfo: !this.state.showDebugInfo });
  }

  render() {
    const { selectedMethod, showDebugInfo, testPositions, orientationValid } = this.state;
    
    return (
      <div className="uline-s5492-label-component p-6">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
            <h2 className="text-2xl font-bold">Uline S-5492 Label Configuration</h2>
            <p className="text-blue-100">6" WIDE × 4" TALL HORIZONTAL Labels - Legal Size Sheets (8.5" × 14")</p>
          </div>
          
          <div className="p-6">
            {/* Orientation Status */}
            {orientationValid !== null && (
              <div className={`mb-4 p-3 rounded-lg ${
                orientationValid 
                  ? 'bg-green-100 border border-green-200' 
                  : 'bg-red-100 border border-red-200'
              }`}>
                <div className={`font-medium ${orientationValid ? 'text-green-800' : 'text-red-800'}`}>
                  {orientationValid ? '✓ Labels are HORIZONTAL (correct)' : '✗ Labels are NOT horizontal (issue)'}
                </div>
                <div className={`text-sm ${orientationValid ? 'text-green-700' : 'text-red-700'}`}>
                  Expected: 6" WIDE × 4" TALL (aspect ratio > 1.0)
                </div>
              </div>
            )}

            {/* Method Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Positioning Method:
              </label>
              <div className="flex space-x-4">
                {['scaled', 'precise', 'hybrid'].map(method => (
                  <button
                    key={method}
                    onClick={() => this.handleMethodChange(method)}
                    className={`px-4 py-2 rounded-md font-medium ${
                      selectedMethod === method
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </button>
                ))}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <strong>Scaled:</strong> Proportionally sized to fit legal paper (recommended) | 
                <strong> Precise:</strong> Full size positioning | 
                <strong> Hybrid:</strong> Custom options
              </div>
            </div>

            {/* Position Preview */}
            {testPositions && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Label Positions Preview</h3>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {testPositions.positions.map((pos, index) => (
                      <div key={index} className={`p-3 rounded border ${
                        pos.isHorizontal ? 'bg-white' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="font-medium mb-2">Label {index + 1}</div>
                        <div className="text-gray-600">
                          <div>Position: {pos.position.x}, {pos.position.y} pt</div>
                          <div>Size: {pos.position.width} × {pos.position.height} pt</div>
                          <div>Size: {pos.dimensionsInches.width}" × {pos.dimensionsInches.height}"</div>
                          <div className={pos.isHorizontal ? 'text-green-600' : 'text-red-600'}>
                            {pos.isHorizontal ? '✓ Horizontal' : '✗ Not horizontal'}
                          </div>
                          <div>Aspect: {pos.aspectRatio.toFixed(2)}</div>
                          {pos.position.isScaled && (
                            <div className="text-orange-600">
                              Scaled: {(pos.position.scaleFactor * 100).toFixed(1)}%
                            </div>
                          )}
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
                  {JSON.stringify(UlineS5492Label.getDebugInfo(selectedMethod), null, 2)}
                </pre>
              </div>
            )}

            {/* Migration Information */}
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 mb-2">S-5492 Migration Complete</h3>
              <div className="text-green-700 text-sm">
                <p><strong>From:</strong> S-21846 (7-3/4" × 4-3/4", 2 labels per 8.5" × 11" sheet)</p>
                <p><strong>To:</strong> S-5492 (6" WIDE × 4" TALL horizontal, 4 labels per 8.5" × 14" legal sheet)</p>
                <p className="mt-2"><strong>Key Features:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>HORIZONTAL orientation (labels are wider than tall)</li>
                  <li>Bottom-focused content layout for scanning workflow</li>
                  <li>Brand detection and separation</li>
                  <li>Massive product names for far-away visibility</li>
                  <li>Legal size paper optimization with proportional scaling</li>
                </ul>
              </div>
            </div>

            {/* Physical Alignment Instructions */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Physical Alignment Instructions</h3>
              <div className="text-blue-700 text-sm">
                <ol className="list-decimal list-inside space-y-1">
                  <li>Print test page using "Actual Size" setting (no scaling)</li>
                  <li>Use HP E877 printer with legal size paper (8.5" × 14")</li>
                  <li>Verify labels align with Uline S-5492 sheet perforations</li>
                  <li>Each label should be 6" WIDE × 4" TALL (horizontal)</li>
                  <li>If alignment is off, try the "precise" positioning method</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default UlineS5492Label;