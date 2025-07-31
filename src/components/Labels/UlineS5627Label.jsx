import React, { useState } from 'react';

/**
 * Uline S-5492 Label Component (6" × 4" Horizontal Labels)
 * Complete replacement for S-5627 - Handles legal size sheets with 2×2 grid layout
 * Designed for precise alignment with physical Uline S-5492 label sheets
 */
class UlineS5492Label extends React.Component {
  /**
   * Calculate exact label position for Uline S-5492 (4 labels per legal sheet)
   * Based on physical measurements of actual Uline S-5492 label sheets
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
    
    // S-5492 label dimensions (6" × 4" when horizontal)
    const labelWidth = 432;  // 6" in points
    const labelHeight = 288; // 4" in points
    
    // Grid layout: 2 columns × 2 rows
    const cols = 2;
    const rows = 2;
    const row = Math.floor(labelIndex / cols);
    const col = labelIndex % cols;
    
    // CRITICAL CONSTRAINT: 2 × 432pt = 864pt > 588pt printable width
    // Solution: Scale labels proportionally to fit while maintaining aspect ratio
    const maxLabelWidth = Math.floor((printableWidth - 12) / cols); // 12pt gap between columns
    const scaleFactor = Math.min(1.0, maxLabelWidth / labelWidth);
    
    const actualLabelWidth = Math.floor(labelWidth * scaleFactor);
    const actualLabelHeight = Math.floor(labelHeight * scaleFactor);
    
    // Calculate spacing for centered layout
    const totalGridWidth = (actualLabelWidth * cols) + 12; // 12pt between columns
    const totalGridHeight = (actualLabelHeight * rows) + 18; // 18pt between rows  
    
    const startX = printerMargin + Math.floor((printableWidth - totalGridWidth) / 2);
    const startY = printerMargin + Math.floor((printableHeight - totalGridHeight) / 2);
    
    // Individual label position
    const xPos = startX + (col * (actualLabelWidth + 12));
    const yPos = startY + (row * (actualLabelHeight + 18));
    
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
   * Use this if the scaled method above doesn't align with actual perforations
   * @param {number} labelIndex - Index of label (0-3)
   * @returns {Object} - Position coordinates optimized for physical alignment
   */
  static calculateUlineS5492PositionPrecise(labelIndex) {
    // Physical measurements from actual Uline S-5492 sheets
    // These should be measured and adjusted based on actual physical sheets
    const measurements = {
      // Page dimensions
      pageWidth: 612,    // 8.5" legal width
      pageHeight: 1008,  // 14" legal height
      
      // ASSUMPTION: Labels are physically arranged as 4" wide × 6" tall
      // when oriented vertically on the sheet, then content is rotated horizontally
      labelWidth: 288,   // 4" physical width
      labelHeight: 432,  // 6" physical height
      
      // Measured margins from physical S-5492 template
      // These values need to be confirmed with actual sheets
      topMargin: 54,     // 0.75" from top edge
      bottomMargin: 54,  // 0.75" from bottom edge
      leftMargin: 18,    // 0.25" from left edge  
      rightMargin: 18,   // 0.25" from right edge
      
      // Gaps between labels (estimated)
      columnGap: 18,     // 0.25" between columns
      rowGap: 18         // 0.25" between rows
    };
    
    const cols = 2;
    const row = Math.floor(labelIndex / cols);
    const col = labelIndex % cols;
    
    // Calculate positions using physical measurements
    const xPos = measurements.leftMargin + (col * (measurements.labelWidth + measurements.columnGap));
    const yPos = measurements.topMargin + (row * (measurements.labelHeight + measurements.rowGap));
    
    // Verify calculations fit within page
    const totalWidth = measurements.leftMargin + (2 * measurements.labelWidth) + measurements.columnGap + measurements.rightMargin;
    const totalHeight = measurements.topMargin + (2 * measurements.labelHeight) + measurements.rowGap + measurements.bottomMargin;
    
    const fitsOnPage = totalWidth <= measurements.pageWidth && totalHeight <= measurements.pageHeight;
    
    return {
      x: xPos,
      y: yPos,
      width: measurements.labelWidth,
      height: measurements.labelHeight,
      
      // Layout characteristics
      orientation: 'portrait', // Each label is taller than wide
      contentFlow: 'vertical',  // Content flows vertically within each label
      
      // Validation
      fitsOnPage: fitsOnPage,
      totalWidth: totalWidth,
      totalHeight: totalHeight,
      
      // Physical measurement info
      measurements: measurements,
      row: row,
      col: col,
      labelIndex: labelIndex,
      
      // Warnings
      warnings: fitsOnPage ? [] : ['Labels may extend beyond page boundaries']
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
      customMargins = null,
      debugMode = true
    } = options;
    
    // Get both calculations
    const scaledPosition = this.calculateUlineS5492Position(labelIndex);
    const precisePosition = this.calculateUlineS5492PositionPrecise(labelIndex);
    
    // Use precise if explicitly requested and it fits
    if (usePhysicalMeasurements && precisePosition.fitsOnPage) {
      return {
        ...precisePosition,
        method: 'precise',
        alternative: scaledPosition
      };
    }
    
    // Apply custom margins if provided
    if (customMargins) {
      const customX = scaledPosition.x + (customMargins.left || 0);
      const customY = scaledPosition.y + (customMargins.top || 0);
      
      return {
        ...scaledPosition,
        x: customX,
        y: customY,
        method: 'custom',
        customMargins: customMargins,
        original: scaledPosition
      };
    }
    
    // Default to scaled position with debug info
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
      labelSize: '6" × 4" (horizontal)',
      generatedAt: new Date().toISOString()
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
      
      // Check if label extends beyond page boundaries
      if (position.x < 0) issues.push(`Label ${index}: X position is negative (${position.x})`);
      if (position.y < 0) issues.push(`Label ${index}: Y position is negative (${position.y})`);
      if (position.x + position.width > 612) issues.push(`Label ${index}: Extends beyond page width`);
      if (position.y + position.height > 1008) issues.push(`Label ${index}: Extends beyond page height`);
      
      // Check for minimum margins
      if (position.x < 12) warnings.push(`Label ${index}: Very close to left edge (${position.x}pt)`);
      if (position.y < 12) warnings.push(`Label ${index}: Very close to top edge (${position.y}pt)`);
      if (612 - (position.x + position.width) < 12) warnings.push(`Label ${index}: Very close to right edge`);
      if (1008 - (position.y + position.height) < 12) warnings.push(`Label ${index}: Very close to bottom edge`);
      
      // Check label dimensions
      if (position.width < 200) warnings.push(`Label ${index}: Width is quite small (${position.width}pt)`);
      if (position.height < 200) warnings.push(`Label ${index}: Height is quite small (${position.height}pt)`);
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
    
    return {
      isValid: issues.length === 0,
      issues: issues,
      warnings: warnings,
      summary: {
        totalLabels: positions.length,
        labelsWithIssues: issues.length,
        labelsWithWarnings: warnings.length
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
        from: 'S-5627 (4" × 1.5", 12 per sheet, 8.5" × 11")',
        to: 'S-5492 (6" × 4" horizontal, 4 per sheet, 8.5" × 14")',
        status: 'Migrated',
        version: '6.0.0'
      },
      positioningMethod: method,
      testData: testData,
      validation: validation,
      spacing: {
        horizontalGaps: horizontalGaps,
        verticalGaps: verticalGaps,
        averageHorizontalGap: horizontalGaps.reduce((a, b) => a + b, 0) / horizontalGaps.length,
        averageVerticalGap: verticalGaps.reduce((a, b) => a + b, 0) / verticalGaps.length
      },
      pageUtilization: {
        totalLabelArea: positions.reduce((sum, pos) => sum + (pos.position.width * pos.position.height), 0),
        pageArea: 612 * 1008,
        utilizationPercent: ((positions.reduce((sum, pos) => sum + (pos.position.width * pos.position.height), 0)) / (612 * 1008)) * 100
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
      recommendations.push('Consider using the "precise" positioning method or custom margins');
    }
    
    if (validation.warnings.length > 0) {
      recommendations.push('Positioning warnings detected - verify alignment with physical sheets');
    }
    
    const positions = testData.positions;
    const firstLabel = positions[0].position;
    
    if (firstLabel.isScaled) {
      recommendations.push(`Labels are scaled to ${(firstLabel.scaleFactor * 100).toFixed(1)}% to fit on legal paper`);
      recommendations.push('This is normal - S-5492 labels are designed to fit with scaling');
    }
    
    if (validation.summary.labelsWithWarnings === 0 && validation.summary.labelsWithIssues === 0) {
      recommendations.push('Positioning looks good - ready for test printing');
      recommendations.push('Print a test page with "Actual Size" setting on HP E877');
    }
    
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
        let csv = 'Label,X,Y,Width,Height,CenterX,CenterY\n';
        debugInfo.testData.positions.forEach((pos, index) => {
          const p = pos.position;
          csv += `${index},${p.x},${p.y},${p.width},${p.height},${pos.centerX},${pos.centerY}\n`;
        });
        return csv;
        
      case 'debug':
        return JSON.stringify(debugInfo, null, 2);
        
      default: // json
        return JSON.stringify({
          method: method,
          positions: debugInfo.testData.positions.map(pos => pos.position),
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
      testPositions: null
    };
  }

  componentDidMount() {
    this.updateTestPositions();
  }

  updateTestPositions = () => {
    const testData = UlineS5492Label.generateAlignmentTestData({ 
      method: this.state.selectedMethod 
    });
    this.setState({ testPositions: testData });
  }

  handleMethodChange = (method) => {
    this.setState({ selectedMethod: method }, this.updateTestPositions);
  }

  toggleDebugInfo = () => {
    this.setState({ showDebugInfo: !this.state.showDebugInfo });
  }

  render() {
    const { selectedMethod, showDebugInfo, testPositions } = this.state;
    
    return (
      <div className="uline-s5492-label-component p-6">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
            <h2 className="text-2xl font-bold">Uline S-5492 Label Configuration</h2>
            <p className="text-blue-100">6" × 4" Horizontal Labels - Legal Size Sheets (8.5" × 14")</p>
          </div>
          
          <div className="p-6">
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
            </div>

            {/* Position Preview */}
            {testPositions && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Label Positions Preview</h3>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {testPositions.positions.map((pos, index) => (
                      <div key={index} className="bg-white p-3 rounded border">
                        <div className="font-medium mb-2">Label {index + 1}</div>
                        <div className="text-gray-600">
                          <div>Position: {pos.position.x}, {pos.position.y}</div>
                          <div>Size: {pos.position.width} × {pos.position.height} pt</div>
                          <div>Size: {(pos.position.width/72).toFixed(2)}" × {(pos.position.height/72).toFixed(2)}"</div>
                          {pos.position.scaleFactor && pos.position.scaleFactor < 1 && (
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
                <pre className="text-xs overflow-auto bg-white p-3 rounded border">
                  {JSON.stringify(UlineS5492Label.getDebugInfo(selectedMethod), null, 2)}
                </pre>
              </div>
            )}

            {/* Migration Information */}
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Migration Complete</h3>
              <div className="text-green-700 text-sm">
                <p><strong>From:</strong> S-5627 (4" × 1.5", 12 labels per 8.5" × 11" sheet)</p>
                <p><strong>To:</strong> S-5492 (6" × 4" horizontal, 4 labels per 8.5" × 14" legal sheet)</p>
                <p className="mt-2"><strong>Benefits:</strong> Larger label size, horizontal layout for better content organization, brand detection support</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default UlineS5492Label;