import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useInventory } from '../../contexts/InventoryContext.jsx';
import { useSession } from '../../contexts/SessionContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { ValidationHelper } from '../../utils/validation.js';
import { PDFGenerator } from '../../utils/pdfGenerator.js';
import { 
  ArrowLeft, 
  Settings,
  Save,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Download,
  Hash,
  Package,
  Calendar,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LabelGenerationForm() {
  const { mainInventory, sweedData } = useInventory();
  const { 
    getLabelGenerationItems, 
    setEnhancedDataForSKU, 
    getEnhancedDataForSKU,
    clearEnhancedDataForSKU,
    clearAllEnhancedData,
    getSessionStats
  } = useSession();
  const { user } = useAuth();

  const [selectedItem, setSelectedItem] = useState(null);
  const [labelItems, setLabelItems] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [enhancedData, setEnhancedData] = useState({
    labelQuantity: '1',
    caseQuantity: '',
    boxCount: '',
    harvestDate: '',
    packagedDate: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const sessionStats = getSessionStats();

  // FIXED: Field name mapping for consistency
  const FIELD_MAPPING = {
    labelQuantity: 'labelQuantity',
    caseQuantity: 'caseQuantity', 
    boxCount: 'boxCount',
    harvestDate: 'harvestDate',
    packagedDate: 'packagedDate'
  };

  // Load label items on mount and when session changes
  useEffect(() => {
    const items = getLabelGenerationItems(mainInventory, sweedData);
    setLabelItems(items);
  }, [mainInventory, sweedData, getLabelGenerationItems, sessionStats.totalItemsScanned]);

  // Handle item selection
  const handleItemSelect = (item) => {
    setSelectedItem(item);
    
    // FIXED: Load existing enhanced data with consistent field names
    const savedData = {
      labelQuantity: getEnhancedDataForSKU(item.sku, FIELD_MAPPING.labelQuantity) || '1',
      caseQuantity: getEnhancedDataForSKU(item.sku, FIELD_MAPPING.caseQuantity) || '',
      boxCount: getEnhancedDataForSKU(item.sku, FIELD_MAPPING.boxCount) || '',
      harvestDate: getEnhancedDataForSKU(item.sku, FIELD_MAPPING.harvestDate) || '',
      packagedDate: getEnhancedDataForSKU(item.sku, FIELD_MAPPING.packagedDate) || ''
    };
    
    setEnhancedData(savedData);
    
    // Clear validation errors and unsaved changes
    setValidationErrors({});
    setHasUnsavedChanges(false);
    
    toast.success(`Selected ${item.sku} for configuration`);
  };

  // Handle enhanced data change
  const handleDataChange = (field, value) => {
    setEnhancedData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // Mark as having unsaved changes
    setHasUnsavedChanges(true);
  };

  // FIXED: Save individual field with consistent naming
  const saveField = (field, value) => {
    if (!selectedItem) return;

    let validation = { isValid: true, error: '' };

    switch (field) {
      case 'labelQuantity':
        validation = ValidationHelper.validateLabelQuantity(value);
        break;
      case 'caseQuantity':
        validation = ValidationHelper.validateCaseQuantity(value);
        break;
      case 'boxCount':
        validation = ValidationHelper.validateBoxCount(value);
        break;
      case 'harvestDate':
        validation = ValidationHelper.validateDate(value);
        break;
      case 'packagedDate':
        validation = ValidationHelper.validateDate(value);
        break;
    }

    if (!validation.isValid) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: validation.error
      }));
      toast.error(validation.error);
      return;
    }

    // FIXED: Save with consistent field name
    setEnhancedDataForSKU(selectedItem.sku, FIELD_MAPPING[field], value);
    
    // Update items list to show [+] indicator
    const updatedItems = getLabelGenerationItems(mainInventory, sweedData);
    setLabelItems(updatedItems);

    // Clear unsaved changes for this field
    setHasUnsavedChanges(false);

    toast.success(`${getFieldDisplayName(field)} saved for ${selectedItem.sku}`);
  };

  // NEW: Save all fields at once
  const saveAllFields = () => {
    if (!selectedItem) return;

    const fields = Object.keys(enhancedData);
    let hasErrors = false;
    const newValidationErrors = {};

    // Validate all fields
    for (const field of fields) {
      const value = enhancedData[field];
      if (!value) continue; // Skip empty fields

      let validation = { isValid: true, error: '' };

      switch (field) {
        case 'labelQuantity':
          validation = ValidationHelper.validateLabelQuantity(value);
          break;
        case 'caseQuantity':
          validation = ValidationHelper.validateCaseQuantity(value);
          break;
        case 'boxCount':
          validation = ValidationHelper.validateBoxCount(value);
          break;
        case 'harvestDate':
          validation = ValidationHelper.validateDate(value);
          break;
        case 'packagedDate':
          validation = ValidationHelper.validateDate(value);
          break;
      }

      if (!validation.isValid) {
        newValidationErrors[field] = validation.error;
        hasErrors = true;
      }
    }

    if (hasErrors) {
      setValidationErrors(newValidationErrors);
      toast.error('Please fix validation errors before saving');
      return;
    }

    // Save all fields
    for (const field of fields) {
      const value = enhancedData[field];
      if (value) { // Only save non-empty values
        setEnhancedDataForSKU(selectedItem.sku, FIELD_MAPPING[field], value);
      }
    }

    // Update items list
    const updatedItems = getLabelGenerationItems(mainInventory, sweedData);
    setLabelItems(updatedItems);

    // Clear unsaved changes
    setHasUnsavedChanges(false);
    setValidationErrors({});

    toast.success(`All configuration saved for ${selectedItem.sku}`);
  };

  // Get field display name
  const getFieldDisplayName = (field) => {
    const names = {
      labelQuantity: 'Label Quantity',
      caseQuantity: 'Total Units',
      boxCount: 'Box Count',
      harvestDate: 'Harvest Date',
      packagedDate: 'Packaged Date'
    };
    return names[field] || field;
  };

  // FIXED: Generate PDF with consistent field names
  const handleGeneratePDF = async () => {
    if (!selectedItem) {
      toast.error('Please select an item first');
      return;
    }

    // Auto-save if there are unsaved changes
    if (hasUnsavedChanges) {
      toast.info('Auto-saving configuration...');
      saveAllFields();
      // Wait a moment for save to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const validation = ValidationHelper.validateEnhancedData(enhancedData);
    if (!validation.isValid) {
      toast.error('Please fix validation errors first');
      return;
    }

    setIsGenerating(true);

    try {
      // FIXED: Use consistent field names for retrieval
      const savedData = {
        labelQuantity: getEnhancedDataForSKU(selectedItem.sku, FIELD_MAPPING.labelQuantity) || '1',
        caseQuantity: getEnhancedDataForSKU(selectedItem.sku, FIELD_MAPPING.caseQuantity) || '',
        boxCount: getEnhancedDataForSKU(selectedItem.sku, FIELD_MAPPING.boxCount) || '',
        harvestDate: getEnhancedDataForSKU(selectedItem.sku, FIELD_MAPPING.harvestDate) || '',
        packagedDate: getEnhancedDataForSKU(selectedItem.sku, FIELD_MAPPING.packagedDate) || ''
      };

      const labelData = {
        ...selectedItem,
        enhancedData: savedData,
        user: user?.username || 'Unknown'
      };

      console.log('🏷️ Generating PDF with data:', labelData); // Debug log

      // Validate before generation
      const pdfValidation = PDFGenerator.validateGenerationData([labelData]);
      if (!pdfValidation.isValid) {
        throw new Error(pdfValidation.errors.join(', '));
      }

      if (pdfValidation.warnings.length > 0) {
        console.warn('PDF generation warnings:', pdfValidation.warnings);
      }

      // Generate PDF
      const pdfBlob = await PDFGenerator.generateLabels([labelData]);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `labels_${selectedItem.sku}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`PDF generated! ${pdfValidation.totalLabels} labels on ${pdfValidation.estimatedPages} page(s)`);

    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate labels for all configured items
  const handleGenerateAllLabels = async () => {
    const configuredItems = labelItems.filter(item => item.hasEnhancedData);
    
    if (configuredItems.length === 0) {
      toast.error('No items have been configured for labeling');
      return;
    }

    setIsGenerating(true);

    try {
      // FIXED: Use consistent field names for all items
      const labelDataArray = configuredItems.map(item => ({
        ...item,
        enhancedData: {
          labelQuantity: getEnhancedDataForSKU(item.sku, FIELD_MAPPING.labelQuantity) || '1',
          caseQuantity: getEnhancedDataForSKU(item.sku, FIELD_MAPPING.caseQuantity) || '',
          boxCount: getEnhancedDataForSKU(item.sku, FIELD_MAPPING.boxCount) || '',
          harvestDate: getEnhancedDataForSKU(item.sku, FIELD_MAPPING.harvestDate) || '',
          packagedDate: getEnhancedDataForSKU(item.sku, FIELD_MAPPING.packagedDate) || ''
        },
        user: user?.username || 'Unknown'
      }));

      console.log('🏷️ Generating all labels with data:', labelDataArray); // Debug log

      // Validate before generation
      const pdfValidation = PDFGenerator.validateGenerationData(labelDataArray);
      if (!pdfValidation.isValid) {
        throw new Error(pdfValidation.errors.join(', '));
      }

      if (pdfValidation.warnings.length > 0) {
        console.warn('PDF generation warnings:', pdfValidation.warnings);
      }

      // Generate PDF
      const pdfBlob = await PDFGenerator.generateLabels(labelDataArray);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `all_labels_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`All labels generated! ${pdfValidation.totalLabels} labels from ${configuredItems.length} items on ${pdfValidation.estimatedPages} page(s)`);

    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Clear enhanced data for selected item
  const handleClearItemData = () => {
    if (!selectedItem) return;

    if (window.confirm(`Clear all enhanced data for ${selectedItem.sku}?`)) {
      // Clear from storage
      Object.values(FIELD_MAPPING).forEach(fieldName => {
        clearEnhancedDataForSKU(selectedItem.sku);
      });
      
      // Reset form
      setEnhancedData({
        labelQuantity: '1',
        caseQuantity: '',
        boxCount: '',
        harvestDate: '',
        packagedDate: ''
      });

      setHasUnsavedChanges(false);
      setValidationErrors({});

      // Update items list
      const updatedItems = getLabelGenerationItems(mainInventory, sweedData);
      setLabelItems(updatedItems);

      toast.success(`Enhanced data cleared for ${selectedItem.sku}`);
    }
  };

  // Clear all enhanced data
  const handleClearAllData = () => {
    if (window.confirm('Clear ALL enhanced data for ALL scanned items? This cannot be undone.')) {
      clearAllEnhancedData();
      
      // Reset form
      setSelectedItem(null);
      setEnhancedData({
        labelQuantity: '1',
        caseQuantity: '',
        boxCount: '',
        harvestDate: '',
        packagedDate: ''
      });

      setHasUnsavedChanges(false);
      setValidationErrors({});

      // Update items list
      const updatedItems = getLabelGenerationItems(mainInventory, sweedData);
      setLabelItems(updatedItems);

      toast.success('All enhanced data cleared');
    }
  };

  // Refresh items list
  const handleRefresh = () => {
    const updatedItems = getLabelGenerationItems(mainInventory, sweedData);
    setLabelItems(updatedItems);
    toast.success('Items list refreshed');
  };

  if (sessionStats.totalItemsScanned === 0) {
    return (
      <div className="min-h-screen bg-[#15161B] p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#FAFCFB]">Label Generation</h1>
            <Link to="/dashboard" className="bg-[#181B22] text-[#FAFCFB] border border-[#39414E] hover:bg-[#39414E] px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </div>

          <div className="bg-[#181B22] border border-[#39414E] rounded-xl p-12 text-center">
            <h2 className="text-xl font-semibold text-[#FAFCFB] mb-2">No Items to Label</h2>
            <p className="text-[#9FA3AC] mb-6">
              Please scan some products first before generating labels.
            </p>
            <Link to="/scanning" className="bg-[#86EFAC] text-[#00001C] hover:opacity-90 px-6 py-2 rounded-lg transition-opacity">
              Go to Scanning
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const configuredItemsCount = labelItems.filter(item => item.hasEnhancedData).length;

  return (
    <div className="min-h-screen bg-[#15161B] p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#FAFCFB]">Label Generation</h1>
            {hasUnsavedChanges && (
              <p className="text-sm text-yellow-400 mt-1">⚠️ You have unsaved changes</p>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className="bg-[#181B22] text-[#FAFCFB] border border-[#39414E] hover:bg-[#39414E] px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>

            {configuredItemsCount > 0 && (
              <button
                onClick={handleGenerateAllLabels}
                disabled={isGenerating}
                className="bg-[#86EFAC] text-[#00001C] hover:opacity-90 disabled:opacity-50 px-4 py-2 rounded-lg flex items-center space-x-2 transition-opacity"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#00001C] border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Generate All ({configuredItemsCount})</span>
                  </>
                )}
              </button>
            )}

            <Link
              to="/dashboard"
              className="bg-[#181B22] text-[#FAFCFB] border border-[#39414E] hover:bg-[#39414E] px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Available Items */}
          <div className="xl:col-span-2">
            <div className="bg-[#181B22] border border-[#39414E] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#FAFCFB]">
                  Available Scanned Items
                </h2>
                <div className="text-sm text-[#9FA3AC]">
                  Double-click to configure
                </div>
              </div>

              {labelItems.length === 0 ? (
                <div className="text-center py-8 text-[#9FA3AC]">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No scanned items available for labeling</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {labelItems.map((item, index) => (
                    <div
                      key={index}
                      onDoubleClick={() => handleItemSelect(item)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedItem?.sku === item.sku
                          ? 'border-[#86EFAC] bg-[#86EFAC]/10'
                          : 'border-[#39414E] hover:border-[#9FA3AC]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            {item.hasEnhancedData ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <div className="w-4 h-4 border border-[#39414E] rounded"></div>
                            )}
                          </div>
                          
                          <div>
                            <div className="font-medium text-[#FAFCFB]">{item.sku}</div>
                            <div className="text-sm text-[#9FA3AC] truncate max-w-xs">
                              {item.productName}
                            </div>
                          </div>
                        </div>

                        <div className="text-right text-sm text-[#9FA3AC]">
                          {item.hasEnhancedData && (
                            <div className="text-green-400 font-medium mb-1">
                              ✓ Configured
                            </div>
                          )}
                          <div>Double-click to configure</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Configuration Panel */}
          <div>
            <div className="bg-[#181B22] border border-[#39414E] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-[#FAFCFB] mb-4">
                Label Configuration
              </h2>

              {!selectedItem ? (
                <div className="text-center py-8 text-[#9FA3AC]">
                  <Settings className="h-8 w-8 mx-auto mb-2" />
                  <p>Double-click an item to configure label settings</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Selected Item Info */}
                  <div className="bg-[#86EFAC]/10 border border-[#86EFAC]/20 rounded-lg p-3">
                    <div className="font-medium text-[#FAFCFB]">Selected Item:</div>
                    <div className="text-sm text-[#9FA3AC]">
                      SKU: {selectedItem.sku}
                    </div>
                    <div className="text-sm text-[#9FA3AC] truncate">
                      {selectedItem.productName}
                    </div>
                  </div>

                  {/* Label Quantity */}
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-[#FAFCFB] mb-2">
                      <Hash className="h-4 w-4" />
                      <span>Label Quantity:</span>
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={enhancedData.labelQuantity}
                        onChange={(e) => handleDataChange('labelQuantity', e.target.value)}
                        className={`flex-1 bg-[#15161B] border ${validationErrors.labelQuantity ? 'border-red-500' : 'border-[#39414E]'} text-[#FAFCFB] rounded-lg px-3 py-2 focus:border-[#86EFAC] focus:outline-none transition-colors`}
                      />
                      <button
                        onClick={() => saveField('labelQuantity', enhancedData.labelQuantity)}
                        className="bg-[#86EFAC] text-[#00001C] hover:opacity-90 px-3 py-2 rounded-lg transition-opacity"
                        title="Save Label Quantity"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </div>
                    {validationErrors.labelQuantity && (
                      <div className="text-red-400 text-xs mt-1">{validationErrors.labelQuantity}</div>
                    )}
                  </div>

                  {/* Total Units in Box */}
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-[#FAFCFB] mb-2">
                      <Package className="h-4 w-4" />
                      <span>Total Units in Box:</span>
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={enhancedData.caseQuantity}
                        onChange={(e) => handleDataChange('caseQuantity', e.target.value)}
                        className={`flex-1 bg-[#15161B] border ${validationErrors.caseQuantity ? 'border-red-500' : 'border-[#39414E]'} text-[#FAFCFB] rounded-lg px-3 py-2 focus:border-[#86EFAC] focus:outline-none transition-colors`}
                        placeholder="Optional"
                      />
                      <button
                        onClick={() => saveField('caseQuantity', enhancedData.caseQuantity)}
                        className="bg-[#86EFAC] text-[#00001C] hover:opacity-90 px-3 py-2 rounded-lg transition-opacity"
                        title="Save Total Units"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </div>
                    {validationErrors.caseQuantity && (
                      <div className="text-red-400 text-xs mt-1">{validationErrors.caseQuantity}</div>
                    )}
                  </div>

                  {/* Total Number of Boxes */}
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-[#FAFCFB] mb-2">
                      <Package className="h-4 w-4" />
                      <span>Total Number of Boxes:</span>
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={enhancedData.boxCount}
                        onChange={(e) => handleDataChange('boxCount', e.target.value)}
                        className={`flex-1 bg-[#15161B] border ${validationErrors.boxCount ? 'border-red-500' : 'border-[#39414E]'} text-[#FAFCFB] rounded-lg px-3 py-2 focus:border-[#86EFAC] focus:outline-none transition-colors`}
                        placeholder="Optional"
                      />
                      <button
                        onClick={() => saveField('boxCount', enhancedData.boxCount)}
                        className="bg-[#86EFAC] text-[#00001C] hover:opacity-90 px-3 py-2 rounded-lg transition-opacity"
                        title="Save Box Count"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </div>
                    {validationErrors.boxCount && (
                      <div className="text-red-400 text-xs mt-1">{validationErrors.boxCount}</div>
                    )}
                  </div>

                  {/* Harvest Date */}
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-[#FAFCFB] mb-2">
                      <Calendar className="h-4 w-4" />
                      <span>Harvest Date:</span>
                    </label>
                    <div className="text-xs text-[#9FA3AC] mb-1">MM/DD/YYYY or DD/MM/YYYY format</div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={enhancedData.harvestDate}
                        onChange={(e) => handleDataChange('harvestDate', e.target.value)}
                        className={`flex-1 bg-[#15161B] border ${validationErrors.harvestDate ? 'border-red-500' : 'border-[#39414E]'} text-[#FAFCFB] rounded-lg px-3 py-2 focus:border-[#86EFAC] focus:outline-none transition-colors`}
                        placeholder="MM/DD/YYYY"
                      />
                      <button
                        onClick={() => saveField('harvestDate', enhancedData.harvestDate)}
                        className="bg-[#86EFAC] text-[#00001C] hover:opacity-90 px-3 py-2 rounded-lg transition-opacity"
                        title="Save Harvest Date"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </div>
                    {validationErrors.harvestDate && (
                      <div className="text-red-400 text-xs mt-1">{validationErrors.harvestDate}</div>
                    )}
                  </div>

                  {/* Packaged Date */}
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-[#FAFCFB] mb-2">
                      <Calendar className="h-4 w-4" />
                      <span>Packaged Date:</span>
                    </label>
                    <div className="text-xs text-[#9FA3AC] mb-1">MM/DD/YYYY or DD/MM/YYYY format</div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={enhancedData.packagedDate}
                        onChange={(e) => handleDataChange('packagedDate', e.target.value)}
                        className={`flex-1 bg-[#15161B] border ${validationErrors.packagedDate ? 'border-red-500' : 'border-[#39414E]'} text-[#FAFCFB] rounded-lg px-3 py-2 focus:border-[#86EFAC] focus:outline-none transition-colors`}
                        placeholder="MM/DD/YYYY"
                      />
                      <button
                        onClick={() => saveField('packagedDate', enhancedData.packagedDate)}
                        className="bg-[#86EFAC] text-[#00001C] hover:opacity-90 px-3 py-2 rounded-lg transition-opacity"
                        title="Save Packaged Date"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </div>
                    {validationErrors.packagedDate && (
                      <div className="text-red-400 text-xs mt-1">{validationErrors.packagedDate}</div>
                    )}
                  </div>

                  {/* NEW: Save All Button */}
                  {hasUnsavedChanges && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                      <button
                        onClick={saveAllFields}
                        className="w-full bg-yellow-500 text-black hover:bg-yellow-400 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                      >
                        <Save className="h-4 w-4" />
                        <span>Save All Changes</span>
                      </button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-4 border-t border-[#39414E]">
                    <button
                      onClick={handleGeneratePDF}
                      disabled={isGenerating}
                      className="w-full bg-[#86EFAC] text-[#00001C] hover:opacity-90 disabled:opacity-50 py-2 rounded-lg flex items-center justify-center space-x-2 transition-opacity"
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-[#00001C] border-t-transparent rounded-full animate-spin"></div>
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          <span>Generate Labels</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleClearItemData}
                      className="w-full bg-red-500 text-white hover:bg-red-600 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <span>Clear Item Data</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Clear All Action */}
            <div className="mt-4 bg-[#181B22] border border-[#39414E] rounded-xl p-4">
              <button
                onClick={handleClearAllData}
                className="w-full bg-red-500 text-white hover:bg-red-600 py-2 rounded-lg transition-colors"
              >
                Clear All Item Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}