import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useInventory } from '../../contexts/InventoryContext.jsx';
import { useSession } from '../../contexts/SessionContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { ValidationHelper } from '../../utils/validation.js';
import LabelPreview from './LabelPreview.jsx';
import { 
  Tag, 
  ArrowLeft, 
  Settings,
  Save,
  Eye,
  Printer,
  Calendar,
  Package,
  Hash,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LabelGenerationForm() {
  const { mainInventory, sweedData } = useInventory();
  const { 
    getLabelGenerationItems, 
    setEnhancedDataForSKU, 
    getEnhancedDataForSKU,
    hasEnhancedDataForSKU,
    clearEnhancedDataForSKU,
    clearAllEnhancedData,
    getSessionStats
  } = useSession();
  const { user } = useAuth();

  const [selectedItem, setSelectedItem] = useState(null);
  const [labelItems, setLabelItems] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [enhancedData, setEnhancedData] = useState({
    labelQuantity: '1',
    caseQuantity: '',
    boxCount: '',
    harvestDate: '',
    packagedDate: ''
  });
  const [validationErrors, setValidationErrors] = useState({});

  const sessionStats = getSessionStats();

  // Load label items on mount and when session changes
  useEffect(() => {
    const items = getLabelGenerationItems(mainInventory, sweedData);
    setLabelItems(items);
  }, [mainInventory, sweedData, getLabelGenerationItems, sessionStats.totalItemsScanned]);

  // Handle item selection (double-click functionality)
  const handleItemSelect = (item) => {
    setSelectedItem(item);
    
    // Load existing enhanced data for this SKU
    setEnhancedData({
      labelQuantity: getEnhancedDataForSKU(item.sku, 'LabelQuantity') || '1',
      caseQuantity: getEnhancedDataForSKU(item.sku, 'CaseQuantity') || '',
      boxCount: getEnhancedDataForSKU(item.sku, 'BoxCount') || '',
      harvestDate: getEnhancedDataForSKU(item.sku, 'HarvestDate') || '',
      packagedDate: getEnhancedDataForSKU(item.sku, 'PackagedDate') || ''
    });
    
    // Clear validation errors
    setValidationErrors({});
    
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
  };

  // Save individual field
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

    // Save to storage
    setEnhancedDataForSKU(selectedItem.sku, field, value);
    
    // Update items list to show [+] indicator
    const updatedItems = getLabelGenerationItems(mainInventory, sweedData);
    setLabelItems(updatedItems);

    toast.success(`${getFieldDisplayName(field)} saved for ${selectedItem.sku}`);
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

  // Preview selection
  const handlePreviewSelection = () => {
    if (!selectedItem) {
      toast.error('Please select an item first');
      return;
    }

    const validation = ValidationHelper.validateEnhancedData(enhancedData);
    if (!validation.isValid) {
      toast.error('Please fix validation errors first');
      return;
    }

    setShowPreview(true);
  };

  // Generate labels
  const handleGenerateLabels = () => {
    if (!selectedItem) {
      toast.error('Please select an item first');
      return;
    }

    const validation = ValidationHelper.validateEnhancedData(enhancedData);
    if (!validation.isValid) {
      toast.error('Please fix validation errors first');
      return;
    }

    // Create label data
    const labelData = {
      ...selectedItem,
      enhancedData: {
        ...enhancedData,
        // Ensure we have the latest data from storage
        labelQuantity: getEnhancedDataForSKU(selectedItem.sku, 'LabelQuantity') || '1',
        caseQuantity: getEnhancedDataForSKU(selectedItem.sku, 'CaseQuantity'),
        boxCount: getEnhancedDataForSKU(selectedItem.sku, 'BoxCount'),
        harvestDate: getEnhancedDataForSKU(selectedItem.sku, 'HarvestDate'),
        packagedDate: getEnhancedDataForSKU(selectedItem.sku, 'PackagedDate')
      },
      user: user?.username || 'Unknown',
      timestamp: new Date().toISOString()
    };

    // For now, open preview - in a full implementation this would generate PDF
    setShowPreview(true);
    toast.success(`Labels prepared for ${selectedItem.sku}`);
  };

  // Clear enhanced data for selected item
  const handleClearItemData = () => {
    if (!selectedItem) return;

    if (window.confirm(`Clear all enhanced data for ${selectedItem.sku}?`)) {
      clearEnhancedDataForSKU(selectedItem.sku);
      
      // Reset form
      setEnhancedData({
        labelQuantity: '1',
        caseQuantity: '',
        boxCount: '',
        harvestDate: '',
        packagedDate: ''
      });

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
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Label Generation</h1>
          <Link to="/dashboard" className="btn btn-secondary flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        <div className="card text-center py-12">
          <Tag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Items to Label</h2>
          <p className="text-gray-600 mb-6">
            Please scan some products first before generating labels.
          </p>
          <Link to="/scanning" className="btn btn-primary">
            Go to Scanning
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Tag className="h-6 w-6 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Label Generation</h1>
          </div>
          <p className="text-gray-600">
            FIXED DIMENSIONS - Labels properly sized for Uline S-5627 sheets (4" x 1.5")
          </p>
        </div>

        <Link
          to="/dashboard"
          className="btn btn-secondary flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Session Summary */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Session Summary</h2>
            <p className="text-gray-600">
              User: {user?.username} • Main: {sessionStats.mainItemsScanned} • 
              Sweed: {sessionStats.sweedItemsScanned} • FIXED DIMENSIONS: Uline S-5627 ready
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            className="btn btn-secondary btn-sm flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Available Items */}
        <div className="xl:col-span-2">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Available Scanned Items - Double-click to configure
            </h2>

            {labelItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No scanned items available for labeling</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <div className="text-xs font-semibold text-gray-500 mb-2">
                  SCANNED ITEMS - DOUBLE-CLICK TO CONFIGURE (FIXED DIMENSIONS):
                </div>
                
                {labelItems.map((item, index) => (
                  <div
                    key={index}
                    onDoubleClick={() => handleItemSelect(item)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedItem?.sku === item.sku
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {item.hasEnhancedData ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <div className="w-4 h-4 border border-gray-300 rounded"></div>
                          )}
                          <span className={`badge ${
                            item.source === 'Sweed Report' ? 'badge-yellow' : 'badge-blue'
                          }`}>
                            {item.displaySource}
                          </span>
                        </div>
                        
                        <div>
                          <div className="font-medium">{item.sku}</div>
                          <div className="text-sm text-gray-600 truncate max-w-xs">
                            {item.productName}
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-sm text-gray-500">
                        {item.hasEnhancedData && (
                          <div className="text-green-600 font-medium">Configured</div>
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

        {/* Enhanced Features Configuration */}
        <div>
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Enhanced Features Configuration
            </h2>

            {!selectedItem ? (
              <div className="text-center py-8 text-gray-500">
                <Settings className="h-8 w-8 mx-auto mb-2" />
                <p>Double-click an item to configure enhanced features</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Selected Item Info */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="font-medium text-purple-900">Selected Item:</div>
                  <div className="text-sm text-purple-800">
                    SKU: {selectedItem.sku}
                  </div>
                  <div className="text-sm text-purple-700 truncate">
                    {selectedItem.productName}
                  </div>
                </div>

                {/* Label Quantity */}
                <div>
                  <label className="form-label flex items-center space-x-2">
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
                      className={`input flex-1 ${validationErrors.labelQuantity ? 'input-error' : ''}`}
                    />
                    <button
                      onClick={() => saveField('labelQuantity', enhancedData.labelQuantity)}
                      className="btn btn-primary btn-sm"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                  </div>
                  {validationErrors.labelQuantity && (
                    <div className="form-error">{validationErrors.labelQuantity}</div>
                  )}
                </div>

                {/* Total Units in Box */}
                <div>
                  <label className="form-label flex items-center space-x-2">
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
                      className={`input flex-1 ${validationErrors.caseQuantity ? 'input-error' : ''}`}
                      placeholder="Optional"
                    />
                    <button
                      onClick={() => saveField('caseQuantity', enhancedData.caseQuantity)}
                      className="btn btn-primary btn-sm"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                  </div>
                  {validationErrors.caseQuantity && (
                    <div className="form-error">{validationErrors.caseQuantity}</div>
                  )}
                </div>

                {/* Total Number of Boxes */}
                <div>
                  <label className="form-label flex items-center space-x-2">
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
                      className={`input flex-1 ${validationErrors.boxCount ? 'input-error' : ''}`}
                      placeholder="Optional"
                    />
                    <button
                      onClick={() => saveField('boxCount', enhancedData.boxCount)}
                      className="btn btn-primary btn-sm"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                  </div>
                  {validationErrors.boxCount && (
                    <div className="form-error">{validationErrors.boxCount}</div>
                  )}
                </div>

                {/* Harvest Date */}
                <div>
                  <label className="form-label flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Harvest Date:</span>
                  </label>
                  <div className="text-xs text-gray-500 mb-1">DD/MM/YYYY format</div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={enhancedData.harvestDate}
                      onChange={(e) => handleDataChange('harvestDate', e.target.value)}
                      className={`input flex-1 ${validationErrors.harvestDate ? 'input-error' : ''}`}
                      placeholder="DD/MM/YYYY"
                    />
                    <button
                      onClick={() => saveField('harvestDate', enhancedData.harvestDate)}
                      className="btn btn-primary btn-sm"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                  </div>
                  {validationErrors.harvestDate && (
                    <div className="form-error">{validationErrors.harvestDate}</div>
                  )}
                </div>

                {/* Packaged Date */}
                <div>
                  <label className="form-label flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Packaged Date:</span>
                  </label>
                  <div className="text-xs text-gray-500 mb-1">DD/MM/YYYY format</div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={enhancedData.packagedDate}
                      onChange={(e) => handleDataChange('packagedDate', e.target.value)}
                      className={`input flex-1 ${validationErrors.packagedDate ? 'input-error' : ''}`}
                      placeholder="DD/MM/YYYY"
                    />
                    <button
                      onClick={() => saveField('packagedDate', enhancedData.packagedDate)}
                      className="btn btn-primary btn-sm"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                  </div>
                  {validationErrors.packagedDate && (
                    <div className="form-error">{validationErrors.packagedDate}</div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={handlePreviewSelection}
                    className="w-full btn btn-secondary flex items-center justify-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Preview Labels</span>
                  </button>

                  <button
                    onClick={handleGenerateLabels}
                    className="w-full btn btn-success flex items-center justify-center space-x-2"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Generate Fixed Dimension PDF</span>
                  </button>

                  <button
                    onClick={handleClearItemData}
                    className="w-full btn btn-error btn-sm flex items-center justify-center space-x-2"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span>Clear Item Data</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Global Actions */}
          <div className="card mt-4">
            <h3 className="font-medium text-gray-900 mb-3">Global Actions</h3>
            
            <div className="space-y-2">
              <button
                onClick={handleClearAllData}
                className="w-full btn btn-error btn-sm"
              >
                Clear All Enhanced Data
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              FIXED DIMENSIONS: Labels properly sized for Uline S-5627 sheets
            </div>
          </div>
        </div>
      </div>

      {/* Label Preview Modal */}
      {showPreview && selectedItem && (
        <LabelPreview
          item={selectedItem}
          enhancedData={enhancedData}
          user={user}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}