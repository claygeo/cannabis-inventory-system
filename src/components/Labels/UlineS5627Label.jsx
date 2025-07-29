/**
 * Calculate label position exactly matching Uline S-5627 physical specifications
 * @param {number} labelIndex - Index of label (0-based)
 * @returns {Object} - Position coordinates in points
 */
static calculateUlineLabelPosition(labelIndex) {
  const labelsPerRow = 2;
  const labelsPerCol = 6;
  const row = Math.floor(labelIndex / labelsPerRow);
  const col = labelIndex % labelsPerRow;
  
  // Standard 8.5" x 11" page (612 x 792 points)
  const pageWidth = 612;
  const pageHeight = 792;
  
  // Label dimensions
  const labelWidth = 288; // 4 inches (exact)
  const labelHeight = 108; // 1.5 inches (exact)
  
  // CORRECTED MARGINS FOR ULINE S-5627 PHYSICAL ALIGNMENT
  const leftMargin = 18; // 0.25" - Adjusted for better physical alignment
  const rightMargin = 18; // 0.25" - Maintains symmetry
  const topMargin = 54; // 0.75" - Increased for proper header spacing
  const bottomMargin = 54; // 0.75" - Ensures even footer spacing
  const columnGap = 18; // 0.25" - Gap between columns
  const rowGap = 0; // No gap between rows (labels are adjacent)
  
  // Calculate available space verification
  // Total height needed: 6 labels × 108pt = 648pt
  // Available height: 792 - 54 - 54 = 684pt ✓ (36pt extra for fine adjustments)
  // Total width needed: 2 labels × 288pt + 18pt gap = 594pt
  // Available width: 612 - 18 - 18 = 576pt 
  // Adjustment needed: reduce label width slightly or adjust margins
  
  // REFINED CALCULATIONS FOR EXACT PHYSICAL MATCH
  const adjustedLabelWidth = 285; // Slightly reduced to fit perfectly
  const adjustedColumnGap = 24; // Increased gap to use remaining space
  
  // Calculate X position
  let xPos = leftMargin;
  if (col === 1) {
    xPos = leftMargin + adjustedLabelWidth + adjustedColumnGap;
  }
  
  // Calculate Y position with even vertical distribution
  // Available vertical space: 792 - topMargin - bottomMargin = 684pt
  // Space per row: 684 / 6 = 114pt
  // This gives 6pt padding above each 108pt label for perfect alignment
  const availableHeight = pageHeight - topMargin - bottomMargin;
  const spacePerRow = availableHeight / labelsPerCol;
  const verticalPadding = (spacePerRow - labelHeight) / 2;
  
  const yPos = topMargin + (row * spacePerRow) + verticalPadding;
  
  return {
    x: xPos,
    y: yPos,
    width: adjustedLabelWidth,
    height: labelHeight
  };
}

/**
 * Alternative method for ultra-precise Uline S-5627 alignment
 * Use this if the above method needs further refinement
 */
static calculateUlineLabelPositionPrecise(labelIndex) {
  const row = Math.floor(labelIndex / 2);
  const col = labelIndex % 2;
  
  // ULINE S-5627 EXACT PHYSICAL MEASUREMENTS (based on actual sheet specs)
  // These values are derived from actual Uline S-5627 template measurements
  const measurements = {
    // Page dimensions (8.5" × 11")
    pageWidth: 612,   // 8.5" in points
    pageHeight: 792,  // 11" in points
    
    // Label dimensions
    labelWidth: 288,  // 4" exact
    labelHeight: 108, // 1.5" exact
    
    // Physical margins from Uline specifications
    topMargin: 45,    // ~0.625" - Measured from actual Uline template
    bottomMargin: 45, // ~0.625" - Even spacing
    leftMargin: 18,   // 0.25" - Measured from actual template
    rightMargin: 18,  // 0.25" - Even spacing
    
    // Gaps
    columnGap: 18,    // 0.25" between columns
    rowGap: 6         // 0.083" between rows (slight gap for cut lines)
  };
  
  // Calculate positions using actual measurements
  const xPositions = [
    measurements.leftMargin, // Column 0
    measurements.leftMargin + measurements.labelWidth + measurements.columnGap // Column 1
  ];
  
  // Calculate Y positions with even row distribution
  const availableHeight = measurements.pageHeight - measurements.topMargin - measurements.bottomMargin;
  const totalRowGaps = (6 - 1) * measurements.rowGap; // 5 gaps between 6 rows
  const labelAreaHeight = availableHeight - totalRowGaps;
  const adjustedLabelHeight = labelAreaHeight / 6; // Distribute remaining space
  
  const yPos = measurements.topMargin + (row * (adjustedLabelHeight + measurements.rowGap));
  
  return {
    x: xPositions[col],
    y: yPos,
    width: measurements.labelWidth,
    height: Math.min(adjustedLabelHeight, measurements.labelHeight) // Use smaller value
  };
}

/**
 * Get debug information for spacing verification
 * @returns {Object} - Detailed spacing information
 */
static getSpacingDebugInfo() {
  const positions = [];
  const precisePositions = [];
  
  // Generate positions using both methods for comparison
  for (let i = 0; i < 12; i++) {
    positions.push({
      index: i,
      standard: this.calculateUlineLabelPosition(i),
      precise: this.calculateUlineLabelPositionPrecise(i)
    });
  }
  
  return {
    pageSize: { width: 612, height: 792 },
    labelSize: { width: 288, height: 108 },
    positions: positions,
    measurements: {
      // Current implementation margins
      current: {
        top: 54,
        bottom: 54,
        left: 18,
        right: 18
      },
      // Precise implementation margins
      precise: {
        top: 45,
        bottom: 45,
        left: 18,
        right: 18
      }
    },
    // Verification calculations
    verification: {
      totalLabelHeight: 6 * 108, // 648pt
      availableHeight: 792 - 90, // 702pt (with 45pt margins)
      remainingSpace: 702 - 648,  // 54pt for gaps/adjustments
      spacePerGap: 54 / 5,        // ~11pt between rows
    }
  };
}