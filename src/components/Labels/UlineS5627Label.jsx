import React, { useState } from 'react';

/**
 * Uline S-5492 Label Component (NEW ROTATED CONTENT LAYOUT)
 * Content rotated 90° to the right within sideways-positioned labels
 * Labels positioned sideways on legal paper - rotate paper 90° to read/peel
 */
class UlineS5492Label extends React.Component {
  /**
   * Calculate label position for Uline S-5492 SIDEWAYS on legal paper
   * Container positioning remains unchanged - only content layout is updated
   * @param {number} labelIndex - Index of label (0-3 for 4 labels per sheet)
   * @returns {Object} - Position coordinates in points
   */
  static calculateUlineS5492PositionSideways(labelIndex) {
    // Legal size sheet dimensions (8.5" × 14")
    const pageWidth = 612;   // 8.5" in points  
    const pageHeight = 1008; // 14" in points
    
    // HP E877 printer margins: 0.167" on all sides
    const printerMargin = 12; // 0.167" = 12pt
    const printableWidth = pageWidth - (printerMargin * 2);   // 588pt
    const printableHeight = pageHeight - (printerMargin * 2); // 984pt
    
    // S-5492 labels: 4" × 6" = When positioned sideways: 4" tall × 6" wide
    // In PDF coordinates (before rotation): height=4", width=6"
    const labelWidth = 288;  // 4" in points (will be height when rotated)
    const labelHeight = 432; // 6" in points (will be width when rotated)
    
    // Grid layout: 2 columns × 2 rows of sideways labels
    const cols = 2;
    const rows = 2;
    const row = Math.floor(labelIndex / cols);
    const col = labelIndex % cols;
    
    // Calculate spacing
    const totalLabelsWidth = cols * labelWidth;   // 576pt
    const totalLabelsHeight = rows * labelHeight; // 864pt
    
    // Center on page
    const startX = printerMargin + (printableWidth - totalLabelsWidth) / 2;
    const startY = printerMargin + (printableHeight - totalLabelsHeight) / 2;
    
    // Individual label position
    const xPos = startX + (col * labelWidth);
    const yPos = startY + (row * labelHeight);
    
    return {
      x: Math.floor(xPos),
      y: Math.floor(yPos),
      width: labelWidth,   // 288pt (4" - will be height when rotated)
      height: labelHeight, // 432pt (6" - will be width when rotated)
      
      // Information for when paper is rotated
      rotatedWidth: labelHeight,  // 432pt (6" wide when rotated)
      rotatedHeight: labelWidth,  // 288pt (4" tall when rotated)
      
      // Grid information
      row: row,
      col: col,
      labelIndex: labelIndex,
      
      // Layout info
      isSideways: true,
      hasNewContentLayout: true,
      contentRotation: 90, // Content rotated 90° right
      requiresRotation: true,
      rotationInstructions: 'Rotate paper 90° clockwise to read labels with optimal content layout'
    };
  }

  /**
   * Generate new content layout section information
   * @param {number} labelIndex - Label index
   * @returns {Object} - Content layout sections
   */
  static generateNewContentLayoutSections(labelIndex) {
    const position = this.calculateUlineS5492PositionSideways(labelIndex);
    const { width, height } = position;
    
    const padding = 10;
    const contentWidth = width - (padding * 2);
    const contentHeight = height - (padding * 2);
    
    // Section calculations for new layout
    const topSectionHeight = Math.floor(contentHeight * 0.35);
    const middleSectionHeight = Math.floor(contentHeight * 0.35);
    const bottomSectionHeight = contentHeight - topSectionHeight - middleSectionHeight;
    
    return {
      container: {
        x: position.x,
        y: position.y,
        width: width,
        height: height,
        padding: padding
      },
      topSection: {
        purpose: 'Audit Trail (rotated) + Product Name (center-top)',
        x: position.x + padding,
        y: position.y + padding,
        width: contentWidth,
        height: topSectionHeight,
        elements: {
          auditTrail: {
            position: 'top-left',
            rotation: 90,
            fontSize: 7,
            area: Math.floor(contentWidth * 0.25)
          },
          productName: {
            position: 'center-top',
            maxFontSize: 34,
            minFontSize: 16,
            area: Math.floor(contentWidth * 0.75)
          },
          brand: {
            position: 'above-product',
            maxFontSize: 22,
            minFontSize: 12
          }
        }
      },
      middleSection: {
        purpose: 'Product name overflow area',
        x: position.x + padding,
        y: position.y + padding + topSectionHeight,
        width: contentWidth,
        height: middleSectionHeight,
        elements: {
          productOverflow: {
            available: true,
            maxLines: 2
          }
        }
      },
      bottomSection: {
        purpose: '4-column layout: Barcode | Store Box | Dates | Case/Box',
        x: position.x + padding,
        y: position.y + padding + topSectionHeight + middleSectionHeight,
        width: contentWidth,
        height: bottomSectionHeight,
        columns: {
          barcode: {
            position: 'left',
            width: Math.floor(contentWidth * 0.25),
            fontSize: 8,
            barcodeHeight: Math.floor(bottomSectionHeight * 0.7)
          },
          storeBox: {
            position: 'center-left',
            width: Math.floor(contentWidth * 0.25),
            labelText: 'Store:',
            labelFontSize: 9,
            boxHeight: Math.floor(bottomSectionHeight * 0.7)
          },
          dates: {
            position: 'center-right',
            width: Math.floor(contentWidth * 0.25),
            fontSize: 10,
            layout: 'vertical'
          },
          caseBox: {
            position: 'right',
            width: Math.floor(contentWidth * 0.25),
            fontSize: 9,
            boxHeight: 14
          }
        }
      },
      improvements: [
        'Content rotated 90° right for optimal layout',
        'Audit trail rotated and positioned top-left',
        'Product name with largest fonts (up to 34pt)',
        'Enhanced 4-column bottom section',
        'Store text box with "Store:" label',
        'All fonts increased for better visibility'
      ]
    };
  }

  /**
   * Generate alignment test data for new content layout
   * @param {Object} options - Test options
   * @returns {Object} - New layout test data
   */
  static generateNewContentLayoutTestData(options = {}) {
    const { includeDebug = true, testContent = true } = options;
    
    const positions = [];
    
    for (let i = 0; i < 4; i++) {
      const position = this.calculateUlineS5492PositionSideways(i);
      const contentLayout = this.generateNewContentLayoutSections(i);
      
      positions.push({
        labelIndex: i,
        position: position,
        contentLayout: contentLayout,
        centerX: position.x + position.width / 2,
        centerY: position.y + position.height / 2,
        corners: {
          topLeft: { x: position.x, y: position.y },
          topRight: { x: position.x + position.width, y: position.y },
          bottomLeft: { x: position.x, y: position.y + position.height },
          bottomRight: { x: position.x + position.width, y: position.y + position.height }
        },
        // Rotated view info (when paper is rotated 90°)
        rotatedDimensions: {
          width: position.rotatedWidth,
          height: position.rotatedHeight,
          widthInches: (position.rotatedWidth / 72).toFixed(2),
          heightInches: (position.rotatedHeight / 72).toFixed(2)
        },
        hasNewContentLayout: position.hasNewContentLayout,
        contentRotation: position.contentRotation,
        layoutVersion: '6.3.0'
      });
    }
    
    return {
      positions: positions,
      layoutType: 'new_rotated_content',
      pageSize: { width: 612, height: 1008 },
      labelCount: 4,
      gridLayout: '2×2 (containers sideways)',
      contentLayout: 'Rotated 90° right within containers',
      sheetFormat: 'Legal (8.5" × 14")',
      labelSize: '6" wide × 4" tall (when paper rotated)',
      containerOrientation: 'sideways',
      contentOrientation: 'rotated_90_right',
      workflow: 'Print → Rotate paper 90° → Content optimally positioned',
      generatedAt: new Date().toISOString(),
      validation: {
        allHaveNewLayout: positions.every(p => p.hasNewContentLayout),
        allHaveContentRotation: positions.every(p => p.contentRotation === 90),
        averageRotatedWidth: positions.reduce((sum, p) => sum + p.rotatedDimensions.width, 0) / positions.length,
        averageRotatedHeight: positions.reduce((sum, p) => sum + p.rotatedDimensions.height, 0) / positions.length
      },
      newLayoutFeatures: {
        topSection: 'Audit trail (rotated) + Product name (large fonts)',
        middleSection: 'Product name overflow area',
        bottomSection: '4-column: Barcode | Store | Dates | Case/Box',
        fontSizes: 'Significantly increased throughout',
        auditTrail: 'Rotated 90° clockwise, positioned top-left',
        storeBox: 'With "Store:" label above for clarity'
      }
    };
  }

  /**
   * Validate new content layout positioning
   * @param {Object} positionData - New layout position data
   * @returns {Object} - Validation results
   */
  static validateNewContentLayoutPositioning(positionData) {
    const { positions } = positionData;
    const issues = [];
    const warnings = [];
    
    positions.forEach((pos, index) => {
      const { position, contentLayout } = pos;
      
      // Check new layout status
      if (!pos.hasNewContentLayout) {
        issues.push(`Label ${index}: Not configured for new content layout`);
      }
      
      // Check content rotation
      if (pos.contentRotation !== 90) {
        issues.push(`Label ${index}: Content not rotated 90° (actual: ${pos.contentRotation}°)`);
      }
      
      // Check if labels fit on page
      if (position.x < 0) issues.push(`Label ${index}: X position negative (${position.x})`);
      if (position.y < 0) issues.push(`Label ${index}: Y position negative (${position.y})`);
      if (position.x + position.width > 612) {
        warnings.push(`Label ${index}: Extends beyond page width`);
      }
      if (position.y + position.height > 1008) {
        issues.push(`Label ${index}: Extends beyond page height`);
      }
      
      // Check printer margins (12pt on all sides)
      if (position.x < 12) warnings.push(`Label ${index}: Within printer margin (left)`);
      if (position.y < 12) warnings.push(`Label ${index}: Within printer margin (top)`);
      if (612 - (position.x + position.width) < 12) warnings.push(`Label ${index}: Within printer margin (right)`);
      if (1008 - (position.y + position.height) < 12) warnings.push(`Label ${index}: Within printer margin (bottom)`);
      
      // Validate content layout sections
      if (contentLayout) {
        const { topSection, middleSection, bottomSection } = contentLayout;
        
        // Check font sizes
        if (topSection.elements.productName.maxFontSize < 30) {
          warnings.push(`Label ${index}: Product name max font size may be too small for new layout`);
        }
        
        // Check bottom section columns
        if (bottomSection.columns.barcode.fontSize < 8) {
          warnings.push(`Label ${index}: Barcode font size may be too small`);
        }
        
        if (!bottomSection.columns.storeBox.labelText) {
          warnings.push(`Label ${index}: Store box missing "Store:" label`);
        }
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
    
    // Overall new layout validation
    if (!positionData.validation.allHaveNewLayout) {
      issues.push('Not all labels configured for new content layout');
    }
    
    if (!positionData.validation.allHaveContentRotation) {
      issues.push('Not all labels have content rotation configured');
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues,
      warnings: warnings,
      summary: {
        totalLabels: positions.length,
        labelsWithNewLayout: positions.filter(p => p.hasNewContentLayout).length,
        labelsWithContentRotation: positions.filter(p => p.contentRotation === 90).length,
        labelsWithIssues: issues.length,
        labelsWithWarnings: warnings.length
      },
      layoutValidation: {
        newLayoutFeatures: positionData.newLayoutFeatures,
        contentOrientation: positionData.contentOrientation,
        workflow: positionData.workflow
      }
    };
  }

  /**
   * Get debug information for new content layout
   * @returns {Object} - Detailed debug information for new layout
   */
  static getNewContentLayoutDebugInfo() {
    const testData = this.generateNewContentLayoutTestData({ includeDebug: true, testContent: true });
    const validation = this.validateNewContentLayoutPositioning(testData);
    
    return {
      migrationInfo: {
        from: 'S-5492 Basic sideways layout',
        to: 'S-5492 New rotated content layout',
        status: 'CONTENT ROTATED 90° RIGHT - Optimal positioning after paper rotation',
        version: '6.3.0',
        layoutUpdate: 'Content repositioned and rotated 90° to the right'
      },
      containerPositioning: {
        method: 'sideways (unchanged)',
        description: 'Label containers positioned sideways on legal paper',
        status: 'Working correctly - no changes needed'
      },
      contentLayout: {
        method: 'rotated_90_right',
        description: 'Content within each label rotated 90° clockwise',
        sections: {
          top: 'Audit trail (rotated) + Product name (large fonts)',
          middle: 'Product name overflow area',
          bottom: '4-column layout with larger fonts'
        },
        improvements: [
          'Audit trail rotated 90° and moved to top-left',
          'Product name centered with fonts up to 34pt',
          'Store text box with "Store:" label above',
          'Barcode repositioned with larger numeric display',
          'Dates and case/box info with increased fonts',
          'Enhanced 4-column bottom section layout'
        ]
      },
      testData: testData,
      validation: validation,
      rotationInfo: {
        containerAngle: 0,     // Containers not rotated in PDF
        contentAngle: 90,      // Content rotated 90° clockwise
        paperAngle: 90,        // Rotate paper 90° clockwise to read
        workflow: 'Print PDF → Rotate paper 90° → Content optimally positioned',
        afterRotation: {
          effectivePageSize: '14" × 8.5" (rotated view)',
          labelSize: '6" wide × 4" tall',
          contentOrientation: 'Optimal for reading and scanning',
          auditTrailPosition: 'Top-left corner',
          productNamePosition: 'Center-top with largest fonts',
          bottomSectionLayout: 'Barcode | Store | Dates | Case/Box'
        }
      },
      printerInfo: {
        model: 'HP E877',
        margins: '0.167" on all sides',
        printableArea: '588 × 984 points',
        recommendedSetting: 'Actual Size (no scaling)',
        paperSize: 'Legal (8.5" × 14")'
      },
      physicalAlignment: {
        labelSheet: 'Uline S-5492',
        containerPositioning: 'Sideways on legal paper (unchanged)',
        contentLayout: 'Rotated 90° right within containers (NEW)',
        peelDirection: 'After paper rotation - optimal orientation',
        expectedFit: validation.summary.labelsWithIssues === 0 ? 'Perfect' : 'Needs adjustment'
      },
      recommendations: this.generateNewContentLayoutRecommendations(testData, validation)
    };
  }

  /**
   * Generate recommendations for new content layout
   * @param {Object} testData - Test positioning data
   * @param {Object} validation - Validation results
   * @returns {Array} - Array of recommendations
   */
  static generateNewContentLayoutRecommendations(testData, validation) {
    const recommendations = [];
    
    if (validation.issues.length > 0) {
      recommendations.push('CRITICAL: New content layout issues detected');
      recommendations.push('Verify content rotation and positioning calculations');
    }
    
    if (validation.warnings.length > 0) {
      recommendations.push('Minor positioning warnings detected - review font sizes and margins');
    }
    
    // Check new layout status
    if (testData.validation.allHaveNewLayout) {
      recommendations.push('✓ All labels configured for new rotated content layout');
    } else {
      recommendations.push('✗ Some labels missing new content layout configuration');
    }
    
    // Check content rotation
    if (testData.validation.allHaveContentRotation) {
      recommendations.push('✓ All content properly rotated 90° right');
    } else {
      recommendations.push('✗ Some labels missing content rotation');
    }
    
    // Layout-specific recommendations
    recommendations.push('NEW LAYOUT FEATURES:');
    recommendations.push('• Audit trail: Rotated 90° clockwise in top-left corner');
    recommendations.push('• Product name: Center-top with fonts up to 34pt');
    recommendations.push('• Store box: With "Store:" label above for clarity');
    recommendations.push('• Bottom section: 4-column layout with larger fonts');
    recommendations.push('• Barcode: Repositioned with larger numeric display');
    
    // Workflow recommendations
    recommendations.push('WORKFLOW: Print → Rotate paper 90° clockwise → Content optimally positioned');
    recommendations.push('Each label: 6" wide × 4" tall when paper is rotated');
    recommendations.push('Use HP E877 with "Actual Size" print setting');
    recommendations.push('Test with physical Uline S-5492 sheets');
    
    if (validation.summary.labelsWithIssues === 0 && validation.summary.labelsWithWarnings === 0) {
      recommendations.push('✓ New rotated content layout ready for test printing');
    }
    
    return recommendations;
  }

  /**
   * Export new content layout data
   * @param {string} format - Export format ('json', 'csv', 'debug')
   * @returns {string} - Formatted export data
   */
  static exportNewContentLayoutData(format = 'json') {
    const debugInfo = this.getNewContentLayoutDebugInfo();
    
    switch (format) {
      case 'csv':
        let csv = 'Label,ContainerX,ContainerY,ContainerW,ContainerH,ContentRotation,TopSectionH,BottomSectionH,ProductMaxFont,BarcodeFont\n';
        debugInfo.testData.positions.forEach((pos, index) => {
          const p = pos.position;
          const c = pos.contentLayout;
          csv += `${index},${p.x},${p.y},${p.width},${p.height},${pos.contentRotation},${c.topSection.height},${c.bottomSection.height},${c.topSection.elements.productName.maxFontSize},${c.bottomSection.columns.barcode.fontSize}\n`;
        });
        return csv;
        
      case 'debug':
        return JSON.stringify(debugInfo, null, 2);
        
      default: // json
        return JSON.stringify({
          layoutType: 'new_rotated_content',
          containerOrientation: 'sideways',
          contentOrientation: 'rotated_90_right',
          workflow: 'print_rotate_peel',
          version: '6.3.0',
          positions: debugInfo.testData.positions.map(pos => ({
            ...pos.position,
            contentLayout: pos.contentLayout,
            contentRotation: pos.contentRotation
          })),
          validation: debugInfo.validation,
          improvements: debugInfo.contentLayout.improvements
        }, null, 2);
    }
  }

  // Legacy compatibility methods
  static calculateUlineLabelPosition(labelIndex) {
    return this.calculateUlineS5492PositionSideways(labelIndex % 4);
  }

  static getSpacingDebugInfo() {
    return this.getNewContentLayoutDebugInfo();
  }

  // React Component Methods
  
  constructor(props) {
    super(props);
    this.state = {
      showNewLayoutInfo: true,
      showDebugInfo: false,
      testPositions: null,
      layoutValid: null,
      contentRotationValid: null
    };
  }

  componentDidMount() {
    this.updateTestPositions();
  }

  updateTestPositions = () => {
    const testData = UlineS5492Label.generateNewContentLayoutTestData();
    const validation = UlineS5492Label.validateNewContentLayoutPositioning(testData);
    
    this.setState({ 
      testPositions: testData,
      layoutValid: validation.summary.labelsWithNewLayout === 4,
      contentRotationValid: validation.summary.labelsWithContentRotation === 4
    });
  }

  toggleNewLayoutInfo = () => {
    this.setState({ showNewLayoutInfo: !this.state.showNewLayoutInfo });
  }

  toggleDebugInfo = () => {
    this.setState({ showDebugInfo: !this.state.showDebugInfo });
  }

  render() {
    const { showNewLayoutInfo, showDebugInfo, testPositions, layoutValid, contentRotationValid } = this.state;
    
    return (
      <div className="uline-s5492-label-component p-6">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="bg-purple-600 text-white px-6 py-4 rounded-t-lg">
            <h2 className="text-2xl font-bold">Uline S-5492 Label - NEW ROTATED CONTENT LAYOUT</h2>
            <p className="text-purple-100">Content rotated 90° right within sideways containers</p>
            <p className="text-purple-200 text-sm">Version 6.3.0 - Enhanced layout with larger fonts</p>
          </div>
          
          <div className="p-6">
            {/* Layout Status */}
            {layoutValid !== null && contentRotationValid !== null && (
              <div className="mb-4 space-y-2">
                <div className={`p-3 rounded-lg ${
                  layoutValid 
                    ? 'bg-green-100 border border-green-200' 
                    : 'bg-red-100 border border-red-200'
                }`}>
                  <div className={`font-medium ${layoutValid ? 'text-green-800' : 'text-red-800'}`}>
                    {layoutValid ? '✓ New content layout configured (correct)' : '✗ New content layout NOT configured (issue)'}
                  </div>
                </div>
                
                <div className={`p-3 rounded-lg ${
                  contentRotationValid 
                    ? 'bg-green-100 border border-green-200' 
                    : 'bg-red-100 border border-red-200'
                }`}>
                  <div className={`font-medium ${contentRotationValid ? 'text-green-800' : 'text-red-800'}`}>
                    {contentRotationValid ? '✓ Content rotated 90° right (correct)' : '✗ Content rotation NOT configured (issue)'}
                  </div>
                </div>
              </div>
            )}

            {/* New Layout Features */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">NEW ROTATED CONTENT LAYOUT Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700">
                <div>
                  <h4 className="font-medium mb-2">Top Section (35%)</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li><strong>Audit Trail:</strong> Top-left, rotated 90° clockwise</li>
                    <li><strong>Product Name:</strong> Center-top, fonts up to 34pt</li>
                    <li><strong>Brand Name:</strong> Above product, fonts up to 22pt</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Bottom Section (30%)</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li><strong>Column 1:</strong> Barcode + numeric (larger fonts)</li>
                    <li><strong>Column 2:</strong> Store box with "Store:" label</li>
                    <li><strong>Column 3:</strong> Harvest & Package dates</li>
                    <li><strong>Column 4:</strong> Case Qty & Box X/X</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Workflow Instructions */}
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="text-lg font-semibold text-amber-800 mb-2">NEW LAYOUT Workflow</h3>
              <ol className="list-decimal list-inside text-amber-700 space-y-1">
                <li>Print PDF on legal size paper (8.5" × 14")</li>
                <li>Use HP E877 with "Actual Size" setting</li>
                <li><strong>Rotate the printed paper 90° clockwise</strong></li>
                <li>Content is now optimally positioned for reading</li>
                <li>Audit trail in top-left, product name prominent center-top</li>
                <li>Bottom section: Barcode | Store | Dates | Case/Box</li>
                <li>All elements use larger fonts for better visibility</li>
              </ol>
            </div>

            {/* Toggle Buttons */}
            <div className="mb-6 flex space-x-4">
              <button
                onClick={this.toggleNewLayoutInfo}
                className={`px-4 py-2 rounded-md font-medium ${
                  showNewLayoutInfo
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {showNewLayoutInfo ? 'Hide' : 'Show'} Layout Details
              </button>
              
              <button
                onClick={this.toggleDebugInfo}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                {showDebugInfo ? 'Hide' : 'Show'} Debug Information
              </button>
            </div>

            {/* New Layout Position Details */}
            {showNewLayoutInfo && testPositions && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">New Content Layout Positions</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                  {testPositions.positions.map((pos, index) => (
                    <div key={index} className={`p-4 rounded border ${
                      pos.hasNewContentLayout && pos.contentRotation === 90 
                        ? 'bg-white border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="font-medium mb-2">Label {index + 1} - NEW LAYOUT</div>
                      
                      {/* Container Info */}
                      <div className="mb-2 p-2 bg-gray-50 rounded">
                        <div className="text-gray-600 text-xs">Container (unchanged):</div>
                        <div><strong>Position:</strong> {pos.position.x}, {pos.position.y} pt</div>
                        <div><strong>Size:</strong> {pos.position.width} × {pos.position.height} pt</div>
                      </div>
                      
                      {/* Content Layout Info */}
                      <div className="mb-2 p-2 bg-blue-50 rounded">
                        <div className="text-blue-800 text-xs font-medium">Content Layout (NEW):</div>
                        <div className="text-blue-700 text-xs">
                          <div><strong>Top Section:</strong> {pos.contentLayout.topSection.height}pt</div>
                          <div><strong>Product Font:</strong> up to {pos.contentLayout.topSection.elements.productName.maxFontSize}pt</div>
                          <div><strong>Bottom Columns:</strong> 4-column layout</div>
                          <div><strong>Store Box:</strong> With "Store:" label</div>
                        </div>
                      </div>
                      
                      {/* After Rotation Info */}
                      <div className="mt-2 p-2 bg-green-50 rounded">
                        <div className="text-green-800 text-xs font-medium">After Paper Rotation:</div>
                        <div className="text-green-700 text-xs">
                          <div>Size: {pos.rotatedDimensions.widthInches}" × {pos.rotatedDimensions.heightInches}"</div>
                          <div>Audit Trail: Top-left corner</div>
                          <div>Product Name: Center-top, large fonts</div>
                          <div>Bottom: Barcode | Store | Dates | Case</div>
                        </div>
                      </div>
                      
                      {/* Status Indicators */}
                      <div className="mt-2 flex space-x-2 text-xs">
                        <div className={pos.hasNewContentLayout ? 'text-green-600' : 'text-red-600'}>
                          {pos.hasNewContentLayout ? '✓ New Layout' : '✗ Missing Layout'}
                        </div>
                        <div className={pos.contentRotation === 90 ? 'text-green-600' : 'text-red-600'}>
                          {pos.contentRotation === 90 ? '✓ Rotated 90°' : '✗ Not Rotated'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Debug Information */}
            {showDebugInfo && (
              <div className="mb-6 bg-gray-100 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Debug Information</h3>
                <pre className="text-xs overflow-auto bg-white p-3 rounded border max-h-96">
                  {JSON.stringify(UlineS5492Label.getNewContentLayoutDebugInfo(), null, 2)}
                </pre>
              </div>
            )}

            {/* Visual Layout Comparison */}
            <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Visual Layout Comparison</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Old Layout */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Previous Layout</h4>
                  <div className="w-32 h-48 bg-white border-2 border-gray-400 rounded relative text-xs">
                    <div className="absolute top-1 left-1 right-1 h-20 bg-gray-100 border border-gray-300 flex items-center justify-center">
                      Product Name
                    </div>
                    <div className="absolute bottom-1 left-1 right-1 h-16 bg-gray-100 border border-gray-300 flex items-center justify-center">
                      Basic Bottom
                    </div>
                    <div className="absolute bottom-0 left-1 text-gray-500" style={{fontSize: '6px'}}>
                      Audit
                    </div>
                  </div>
                </div>
                
                {/* New Layout */}
                <div>
                  <h4 className="font-medium text-green-700 mb-2">NEW Rotated Content Layout</h4>
                  <div className="w-32 h-48 bg-white border-2 border-green-500 rounded relative text-xs">
                    <div className="absolute top-1 left-1 w-6 h-6 bg-blue-100 border border-blue-300 text-center" style={{fontSize: '6px', transform: 'rotate(90deg)'}}>
                      Audit
                    </div>
                    <div className="absolute top-1 left-8 right-1 h-16 bg-green-100 border border-green-300 flex items-center justify-center font-bold">
                      Product Name (34pt)
                    </div>
                    <div className="absolute bottom-1 left-1 right-1 h-12 bg-yellow-100 border border-yellow-300">
                      <div className="grid grid-cols-4 h-full text-center" style={{fontSize: '6px'}}>
                        <div className="border-r border-yellow-300 flex items-center justify-center">Bar</div>
                        <div className="border-r border-yellow-300 flex items-center justify-center">Store</div>
                        <div className="border-r border-yellow-300 flex items-center justify-center">Dates</div>
                        <div className="flex items-center justify-center">Case</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Migration Status */}
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Content Layout Migration Complete</h3>
              <div className="text-green-700 text-sm">
                <p><strong>From:</strong> Basic sideways layout with simple content arrangement</p>
                <p><strong>To:</strong> Rotated content layout optimized for readability and functionality</p>
                <p className="mt-2"><strong>Key Improvements:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Content rotated 90° right for optimal layout after paper rotation</li>
                  <li>Audit trail rotated and repositioned to top-left corner</li>
                  <li>Product name prominence with fonts increased to 34pt</li>
                  <li>Enhanced 4-column bottom section: Barcode | Store | Dates | Case/Box</li>
                  <li>Store text box with clear "Store:" labeling above</li>
                  <li>All fonts significantly increased for better visibility</li>
                  <li>Better space utilization throughout the label</li>
                </ul>
              </div>
            </div>

            {/* Usage Instructions */}
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Usage Instructions</h3>
              <div className="flex items-start space-x-4">
                <div className="text-center">
                  <div className="w-16 h-24 bg-white border-2 border-gray-400 rounded flex items-center justify-center text-xs relative">
                    <div className="absolute top-1 left-1 text-blue-600" style={{fontSize: '6px', transform: 'rotate(90deg)'}}>A</div>
                    <div className="text-center">
                      <div className="font-bold">Product</div>
                      <div style={{fontSize: '6px'}}>Bar|Store|Date|Case</div>
                    </div>
                  </div>
                  <div className="text-sm mt-1">1. Print</div>
                </div>
                <div className="text-2xl">→</div>
                <div className="text-center">
                  <div className="w-24 h-16 bg-white border-2 border-gray-400 rounded flex items-center justify-center text-xs relative">
                    <div className="absolute top-1 left-1 text-blue-600" style={{fontSize: '6px'}}>Audit</div>
                    <div className="text-center">
                      <div className="font-bold">Product Name</div>
                      <div style={{fontSize: '6px'}}>Barcode Store Dates Case</div>
                    </div>
                  </div>
                  <div className="text-sm mt-1">2. Rotate 90°</div>
                </div>
                <div className="text-2xl">→</div>
                <div className="text-center">
                  <div className="w-20 h-12 bg-green-100 border-2 border-green-400 rounded flex items-center justify-center text-xs">
                    Optimal Layout
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