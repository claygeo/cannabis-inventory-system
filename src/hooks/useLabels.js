import { useState, useCallback, useRef } from 'react';
import { LABEL_SPECS, EVENT_TYPES, STORAGE_KEYS } from '../constants.js';
import { StorageHelper } from '../utils/storage.js';
import { ValidationHelper } from '../utils/validation.js';
import { BarcodeGenerator } from '../utils/barcodeGenerator.js';

/**
 * Custom hook for label generation functionality
 * Handles label creation, preview, and PDF generation for Uline S-5627 sheets
 */
export const useLabels = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [previewData, setPreviewData] = useState(null);
  const [labelHistory, setLabelHistory] = useState([]);
  const [currentLabelConfig, setCurrentLabelConfig] = useState({
    labelQuantity: 1,
    caseQuantity: '',
    boxCount: '',
    harvestDate: '',
    packagedDate: ''
  });

  // Refs for PDF generation
  const canvasRef = useRef(null);
  const printRef = useRef(null);

  /**
   * Log label generation events
   * @param {string} eventType - Type of event
   * @param {Object} eventData - Event data
   */
  const logLabelEvent = useCallback((eventType, eventData) => {
    const event = {
      type: eventType,
      timestamp: new Date().toISOString(),
      labelId: `label_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...eventData
    };

    setLabelHistory(prev => {
      const updated = [event, ...prev];
      const trimmed = updated.slice(0, 50); // Keep last 50 events
      StorageHelper.setItem('label_generation_history', trimmed);
      return trimmed;
    });
  }, []);

  /**
   * Validate label configuration
   * @param {Object} config - Label configuration
   * @returns {Object} - Validation result
   */
  const validateLabelConfig = useCallback((config) => {
    const errors = [];
    const warnings = [];

    // Validate label quantity (required)
    const labelQuantityValidation = ValidationHelper.validateLabelQuantity(config.labelQuantity);
    if (!labelQuantityValidation.isValid) {
      errors.push(`Label Quantity: ${labelQuantityValidation.error}`);
    }

    // Validate case quantity (optional)
    if (config.caseQuantity) {
      const caseQuantityValidation = ValidationHelper.validateCaseQuantity(config.caseQuantity);
      if (!caseQuantityValidation.isValid) {
        errors.push(`Case Quantity: ${caseQuantityValidation.error}`);
      }
    }

    // Validate box count (optional)
    if (config.boxCount) {
      const boxCountValidation = ValidationHelper.validateBoxCount(config.boxCount);
      if (!boxCountValidation.isValid) {
        errors.push(`Box Count: ${boxCountValidation.error}`);
      }
    }

    // Validate harvest date (optional)
    if (config.harvestDate) {
      const harvestDateValidation = ValidationHelper.validateDate(config.harvestDate);
      if (!harvestDateValidation.isValid) {
        errors.push(`Harvest Date: ${harvestDateValidation.error}`);
      }
    }

    // Validate packaged date (optional)
    if (config.packagedDate) {
      const packagedDateValidation = ValidationHelper.validateDate(config.packagedDate);
      if (!packagedDateValidation.isValid) {
        errors.push(`Packaged Date: ${packagedDateValidation.error}`);
      }
    }

    // Check if dates make logical sense
    if (config.harvestDate && config.packagedDate) {
      try {
        const harvestDate = new Date(config.harvestDate.split('/').reverse().join('-'));
        const packagedDate = new Date(config.packagedDate.split('/').reverse().join('-'));
        
        if (packagedDate < harvestDate) {
          warnings.push('Packaged date is before harvest date');
        }
      } catch (error) {
        // Date parsing error already caught by individual validations
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, []);

  /**
   * Generate barcode for label
   * @param {string} barcode - Barcode value
   * @returns {Promise<Object>} - Barcode generation result
   */
  const generateLabelBarcode = useCallback(async (barcode) => {
    try {
      // Validate barcode for Code 39
      const validation = BarcodeGenerator.validateCode39(barcode);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Generate barcode SVG optimized for labels
      const barcodeOptions = {
        width: 1.2, // Optimized for 4" label width
        height: 35,  // Optimized for 1.5" label height
        displayValue: false,
        margin: 0,
        background: 'transparent',
        lineColor: '#000000'
      };

      const barcodeSVG = BarcodeGenerator.generateForLabel(validation.cleanValue, barcodeOptions);

      return {
        success: true,
        svg: barcodeSVG,
        dataURL: BarcodeGenerator.generateDataURL(validation.cleanValue, barcodeOptions),
        value: validation.cleanValue
      };

    } catch (error) {
      console.error('Barcode generation error:', error);
      return {
        success: false,
        error: error.message,
        svg: BarcodeGenerator.generateErrorBarcode(barcode)
      };
    }
  }, []);

  /**
   * Create label data for preview
   * @param {Object} item - Item data
   * @param {Object} config - Label configuration
   * @param {Object} user - User data
   * @returns {Promise<Object>} - Label data
   */
  const createLabelData = useCallback(async (item, config, user) => {
    try {
      // Validate configuration
      const configValidation = validateLabelConfig(config);
      if (!configValidation.isValid) {
        throw new Error(`Configuration errors: ${configValidation.errors.join(', ')}`);
      }

      // Generate barcode
      const barcodeResult = await generateLabelBarcode(item.barcode);
      if (!barcodeResult.success) {
        throw new Error(`Barcode generation failed: ${barcodeResult.error}`);
      }

      // Format dates
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
          const validation = ValidationHelper.validateDate(dateStr);
          return validation.isValid ? validation.formattedDate : dateStr;
        } catch {
          return dateStr;
        }
      };

      // Create label data
      const labelData = {
        // Item information
        sku: item.sku,
        productName: item.productName || '',
        brand: item.brand || '',
        strain: item.strain || '',
        size: item.size || '',
        barcode: item.barcode,
        source: item.source,
        displaySource: item.displaySource,

        // Enhanced data
        labelQuantity: parseInt(config.labelQuantity) || 1,
        caseQuantity: config.caseQuantity ? parseInt(config.caseQuantity) : null,
        boxCount: config.boxCount ? parseInt(config.boxCount) : null,
        harvestDate: formatDate(config.harvestDate),
        packagedDate: formatDate(config.packagedDate),

        // Barcode data
        barcodeSVG: barcodeResult.svg,
        barcodeDataURL: barcodeResult.dataURL,

        // Generation metadata
        generatedBy: user?.username || 'Unknown',
        generatedAt: new Date().toISOString(),
        sheetFormat: LABEL_SPECS.SHEET_FORMAT,
        labelDimensions: `${LABEL_SPECS.WIDTH_INCHES}" x ${LABEL_SPECS.HEIGHT_INCHES}"`,

        // Configuration warnings
        warnings: configValidation.warnings
      };

      return {
        success: true,
        labelData
      };

    } catch (error) {
      console.error('Label data creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }, [validateLabelConfig, generateLabelBarcode]);

  /**
   * Generate label preview
   * @param {Object} item - Item data
   * @param {Object} config - Label configuration
   * @param {Object} user - User data
   * @returns {Promise<Object>} - Preview result
   */
  const generatePreview = useCallback(async (item, config, user) => {
    try {
      setIsGenerating(true);
      setGenerationProgress(20);

      // Create label data
      const labelResult = await createLabelData(item, config, user);
      if (!labelResult.success) {
        throw new Error(labelResult.error);
      }

      setGenerationProgress(60);

      // Create preview data
      const previewLabels = [];
      const labelQuantity = labelResult.labelData.labelQuantity;

      // Generate individual labels
      for (let i = 0; i < labelQuantity; i++) {
        previewLabels.push({
          ...labelResult.labelData,
          labelNumber: i + 1,
          labelId: `${item.sku}_${i + 1}_${Date.now()}`
        });
      }

      setGenerationProgress(90);

      const preview = {
        item,
        config,
        labels: previewLabels,
        sheetInfo: {
          format: LABEL_SPECS.SHEET_FORMAT,
          dimensions: `${LABEL_SPECS.WIDTH_INCHES}" x ${LABEL_SPECS.HEIGHT_INCHES}"`,
          labelsPerSheet: LABEL_SPECS.LABELS_PER_SHEET,
          columns: LABEL_SPECS.COLUMNS,
          rows: LABEL_SPECS.ROWS,
          totalLabels: labelQuantity,
          sheetsRequired: Math.ceil(labelQuantity / LABEL_SPECS.LABELS_PER_SHEET)
        },
        generatedAt: new Date().toISOString(),
        generatedBy: user?.username || 'Unknown'
      };

      setPreviewData(preview);
      setGenerationProgress(100);

      // Log event
      logLabelEvent(EVENT_TYPES.LABEL_GENERATED, {
        sku: item.sku,
        source: item.source,
        labelQuantity,
        sheetsRequired: preview.sheetInfo.sheetsRequired,
        action: 'preview'
      });

      return {
        success: true,
        preview
      };

    } catch (error) {
      console.error('Preview generation error:', error);
      
      logLabelEvent(EVENT_TYPES.ERROR_OCCURRED, {
        context: 'label_preview',
        sku: item?.sku,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }, [createLabelData, logLabelEvent]);

  /**
   * Generate labels for printing/PDF
   * @param {Object} item - Item data
   * @param {Object} config - Label configuration
   * @param {Object} user - User data
   * @returns {Promise<Object>} - Generation result
   */
  const generateLabelsForPrint = useCallback(async (item, config, user) => {
    try {
      setIsGenerating(true);
      setGenerationProgress(0);

      // Create label data
      setGenerationProgress(20);
      const labelResult = await createLabelData(item, config, user);
      if (!labelResult.success) {
        throw new Error(labelResult.error);
      }

      setGenerationProgress(40);

      const labelQuantity = labelResult.labelData.labelQuantity;
      const sheetsRequired = Math.ceil(labelQuantity / LABEL_SPECS.LABELS_PER_SHEET);

      // Create sheets data
      const sheets = [];
      let labelIndex = 0;

      for (let sheetNum = 0; sheetNum < sheetsRequired; sheetNum++) {
        const sheet = {
          sheetNumber: sheetNum + 1,
          labels: []
        };

        // Fill sheet with labels (up to 12 per sheet)
        for (let labelPos = 0; labelPos < LABEL_SPECS.LABELS_PER_SHEET && labelIndex < labelQuantity; labelPos++) {
          sheet.labels.push({
            ...labelResult.labelData,
            labelNumber: labelIndex + 1,
            sheetNumber: sheetNum + 1,
            positionOnSheet: labelPos + 1,
            labelId: `${item.sku}_${labelIndex + 1}_${Date.now()}`
          });
          labelIndex++;
        }

        // Fill remaining positions with empty labels if needed
        while (sheet.labels.length < LABEL_SPECS.LABELS_PER_SHEET) {
          sheet.labels.push({
            empty: true,
            positionOnSheet: sheet.labels.length + 1
          });
        }

        sheets.push(sheet);
      }

      setGenerationProgress(80);

      const result = {
        item,
        config,
        sheets,
        totalLabels: labelQuantity,
        sheetsRequired,
        sheetFormat: LABEL_SPECS.SHEET_FORMAT,
        generatedAt: new Date().toISOString(),
        generatedBy: user?.username || 'Unknown'
      };

      setGenerationProgress(100);

      // Log event
      logLabelEvent(EVENT_TYPES.LABEL_GENERATED, {
        sku: item.sku,
        source: item.source,
        labelQuantity,
        sheetsRequired,
        action: 'print_generation'
      });

      return {
        success: true,
        result
      };

    } catch (error) {
      console.error('Print label generation error:', error);
      
      logLabelEvent(EVENT_TYPES.ERROR_OCCURRED, {
        context: 'label_print_generation',
        sku: item?.sku,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }, [createLabelData, logLabelEvent]);

  /**
   * Calculate label sheet requirements
   * @param {number} labelQuantity - Number of labels needed
   * @returns {Object} - Sheet calculation
   */
  const calculateSheetRequirements = useCallback((labelQuantity) => {
    const quantity = parseInt(labelQuantity) || 0;
    const sheetsRequired = Math.ceil(quantity / LABEL_SPECS.LABELS_PER_SHEET);
    const labelsOnLastSheet = quantity % LABEL_SPECS.LABELS_PER_SHEET || LABEL_SPECS.LABELS_PER_SHEET;
    const emptyLabelsOnLastSheet = LABEL_SPECS.LABELS_PER_SHEET - labelsOnLastSheet;

    return {
      labelQuantity: quantity,
      sheetsRequired,
      labelsPerSheet: LABEL_SPECS.LABELS_PER_SHEET,
      labelsOnLastSheet,
      emptyLabelsOnLastSheet,
      totalLabelPositions: sheetsRequired * LABEL_SPECS.LABELS_PER_SHEET,
      efficiency: quantity / (sheetsRequired * LABEL_SPECS.LABELS_PER_SHEET)
    };
  }, []);

  /**
   * Update current label configuration
   * @param {Object} config - Configuration updates
   */
  const updateLabelConfig = useCallback((config) => {
    setCurrentLabelConfig(prev => ({
      ...prev,
      ...config
    }));
  }, []);

  /**
   * Clear preview data
   */
  const clearPreview = useCallback(() => {
    setPreviewData(null);
  }, []);

  /**
   * Get label generation statistics
   * @returns {Object} - Statistics
   */
  const getLabelStats = useCallback(() => {
    const recentHistory = labelHistory.slice(0, 20);
    const successful = recentHistory.filter(event => 
      event.type === EVENT_TYPES.LABEL_GENERATED
    );
    
    const totalLabelsGenerated = successful.reduce((sum, event) => 
      sum + (event.labelQuantity || 0), 0
    );

    const totalSheetsGenerated = successful.reduce((sum, event) => 
      sum + (event.sheetsRequired || 0), 0
    );

    return {
      totalGenerations: successful.length,
      totalLabelsGenerated,
      totalSheetsGenerated,
      recentActivity: recentHistory.length,
      averageLabelsPerGeneration: successful.length > 0 ? 
        Math.round(totalLabelsGenerated / successful.length) : 0
    };
  }, [labelHistory]);

  /**
   * Export label generation history
   * @returns {string} - CSV string
   */
  const exportLabelHistory = useCallback(() => {
    if (labelHistory.length === 0) {
      throw new Error('No label history to export');
    }

    const headers = [
      'Timestamp',
      'Event Type',
      'SKU',
      'Source',
      'Label Quantity',
      'Sheets Required',
      'Action',
      'Generated By'
    ];

    const rows = labelHistory.map(event => [
      event.timestamp,
      event.type,
      event.sku || '',
      event.source || '',
      event.labelQuantity || '',
      event.sheetsRequired || '',
      event.action || '',
      event.generatedBy || ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => 
        String(cell).includes(',') ? `"${cell}"` : cell
      ).join(','))
      .join('\n');
  }, [labelHistory]);

  return {
    // State
    isGenerating,
    generationProgress,
    previewData,
    labelHistory,
    currentLabelConfig,

    // Refs
    canvasRef,
    printRef,

    // Actions
    generatePreview,
    generateLabelsForPrint,
    updateLabelConfig,
    clearPreview,

    // Utilities
    validateLabelConfig,
    generateLabelBarcode,
    calculateSheetRequirements,
    getLabelStats,
    exportLabelHistory,

    // Constants
    labelSpecs: LABEL_SPECS,

    // Computed values
    hasPreview: previewData !== null,
    isConfigValid: validateLabelConfig(currentLabelConfig).isValid,
    sheetRequirements: calculateSheetRequirements(currentLabelConfig.labelQuantity)
  };
};