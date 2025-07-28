import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useInventory } from '../../contexts/InventoryContext.jsx';
import { useSession } from '../../contexts/SessionContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { DataProcessor } from '../../utils/dataProcessor.js';
import { 
  FileText, 
  ArrowLeft, 
  Download,
  Trash2,
  RefreshCw,
  Eye,
  Printer,
  BarChart3,
  Clock,
  Package
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportsForm() {
  const { mainInventory, sweedData, getInventoryStats } = useInventory();
  const { 
    getScannedItemsDetails,
    generatePickTicketData,
    clearAllSessionData,
    getSessionStats,
    exportSessionData
  } = useSession();
  const { user, getSessionDuration } = useAuth();

  const [scannedDetails, setScannedDetails] = useState([]);
  const [pickTicketData, setPickTicketData] = useState([]);
  const [sessionData, setSessionData] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

  const inventoryStats = getInventoryStats();
  const sessionStats = getSessionStats();

  // Load data on mount and when session changes
  useEffect(() => {
    refreshData();
  }, [sessionStats.totalItemsScanned]);

  // Refresh all data
  const refreshData = () => {
    const details = getScannedItemsDetails(mainInventory, sweedData);
    setScannedDetails(details);
    
    const pickTickets = generatePickTicketData(mainInventory, sweedData);
    setPickTicketData(pickTickets);
    
    const sessionExport = exportSessionData();
    setSessionData(sessionExport);
  };

  // Handle clear session
  const handleClearSession = () => {
    if (window.confirm('Are you sure you want to clear the entire session? This will clear all scanned items, enhanced data, and session history. This action cannot be undone.')) {
      clearAllSessionData();
      refreshData();
      toast.success('Session cleared successfully');
    }
  };

  // Export session data as JSON
  const handleExportSessionData = () => {
    if (!sessionData) {
      toast.error('No session data to export');
      return;
    }

    const dataStr = JSON.stringify(sessionData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `cannabis_session_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Session data exported');
  };

  // Export pick tickets as CSV
  const handleExportPickTickets = () => {
    if (pickTicketData.length === 0) {
      toast.error('No pick tickets to export');
      return;
    }

    const columns = [
      { key: 'pickNumber', header: 'Pick #' },
      { key: 'source', header: 'Source' },
      { key: 'sku', header: 'SKU' },
      { key: 'barcode', header: 'Barcode' },
      { key: 'productName', header: 'Product Name' },
      { key: 'brand', header: 'Brand' },
      { key: 'size', header: 'Size' },
      { key: 'quantity', header: 'Quantity' },
      { key: 'location', header: 'Location' },
      { key: 'shipTo', header: 'Ship To' },
      { key: 'orderNumber', header: 'Order #' },
      { key: 'notes', header: 'Notes' }
    ];

    const csvContent = DataProcessor.exportToCSV(pickTicketData, columns);
    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    
    const exportFileDefaultName = `pick_tickets_${new Date().toISOString().split('T')[0]}.csv`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Pick tickets exported');
  };

  // Print pick tickets
  const handlePrintPickTickets = () => {
    if (pickTicketData.length === 0) {
      toast.error('No pick tickets to print');
      return;
    }
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    const printContent = generatePickTicketHTML();
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
    
    toast.success('Pick ticket print dialog opened');
  };

  // Generate HTML for pick tickets
  const generatePickTicketHTML = () => {
    const currentDateTime = new Date().toLocaleString();
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pick Tickets - ${currentDateTime}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .header-info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .main-row { background-color: #e6f3ff; }
          .sweed-row { background-color: #fff3e6; }
          .pick-number { font-weight: bold; text-align: center; }
          .barcode { font-family: monospace; }
          @media print {
            body { margin: 0.5in; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>PICK TICKET - ${currentDateTime}</h1>
        <div class="header-info">
          <p><strong>Generated by:</strong> ${user?.username || 'Unknown'} (${user?.role || 'Unknown Role'})</p>
          <p><strong>Items to Pick:</strong> ${pickTicketData.length}</p>
          <p><strong>Session Duration:</strong> ${getSessionDuration()}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Pick #</th>
              <th>Source</th>
              <th>SKU</th>
              <th>Barcode</th>
              <th>Product Name</th>
              <th>Brand</th>
              <th>Size</th>
              <th>Quantity</th>
              <th>Location</th>
              <th>Ship To</th>
              <th>Order #</th>
              <th>Picked</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${pickTicketData.map(item => `
              <tr class="${item.source === '[MAIN]' ? 'main-row' : 'sweed-row'}">
                <td class="pick-number">${item.pickNumber}</td>
                <td>${item.source}</td>
                <td class="barcode">${item.sku}</td>
                <td class="barcode">${item.barcode}</td>
                <td>${item.productName}</td>
                <td>${item.brand}</td>
                <td>${item.size || ''}</td>
                <td>${item.quantity}</td>
                <td>${item.location || ''}</td>
                <td>${item.shipTo || ''}</td>
                <td class="barcode">${item.orderNumber || ''}</td>
                <td>[ ]</td>
                <td></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
          <p><strong>Instructions:</strong></p>
          <ul>
            <li>Check off items in the "Picked" column as you collect them</li>
            <li>Use the "Notes" column for any special instructions or issues</li>
            <li>Main inventory items are highlighted in blue</li>
            <li>Sweed items are highlighted in orange</li>
          </ul>
        </div>
      </body>
      </html>
    `;
  };

  const tabs = [
    { id: 'summary', label: 'Session Summary', icon: BarChart3 },
    { id: 'scanned', label: 'Scanned Items', icon: Package },
    { id: 'picktickets', label: 'Pick Tickets', icon: FileText }
  ];

  if (sessionStats.totalItemsScanned === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Session Reports</h1>
          <Link to="/dashboard" className="btn btn-secondary flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        <div className="card text-center py-12">
          <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Session Data</h2>
          <p className="text-gray-600 mb-6">
            Please scan some products first to generate reports.
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
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileText className="h-6 w-6 text-gray-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Enhanced Session Reports</h1>
          </div>
          <p className="text-gray-600">
            View session data, generate pick tickets, and export reports
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={refreshData}
            className="btn btn-secondary btn-sm flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>

          <Link
            to="/dashboard"
            className="btn btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Session Status */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Current Session Status</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>User: {user?.username} ({user?.role})</span>
              <span>•</span>
              <span>Duration: {getSessionDuration()}</span>
              <span>•</span>
              <span>Items Scanned: {sessionStats.totalItemsScanned}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportSessionData}
              className="btn btn-primary btn-sm flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export Data</span>
            </button>

            <button
              onClick={handleClearSession}
              className="btn btn-error btn-sm flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear Session</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-blue-600" />
            <div>
              <div className="text-xl font-bold text-blue-700">{inventoryStats.totalItems}</div>
              <div className="text-sm text-blue-600">Total Available</div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Eye className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-xl font-bold text-green-700">{sessionStats.mainItemsScanned}</div>
              <div className="text-sm text-green-600">Main Scanned</div>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Eye className="h-8 w-8 text-orange-600" />
            <div>
              <div className="text-xl font-bold text-orange-700">{sessionStats.sweedItemsScanned}</div>
              <div className="text-sm text-orange-600">Sweed Scanned</div>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-purple-600" />
            <div>
              <div className="text-xl font-bold text-purple-700">{sessionStats.sessionEventsCount}</div>
              <div className="text-sm text-purple-600">Session Events</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Session Summary */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Inventory Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Main Inventory Available:</span>
                      <span className="font-medium">{inventoryStats.mainInventoryCount} items</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sweed Report Available:</span>
                      <span className="font-medium">{inventoryStats.sweedDataCount} items</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Total Available:</span>
                      <span className="font-bold">{inventoryStats.totalItems} items</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Scanning Progress</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Main Inventory Scanned:</span>
                      <span className="font-medium">{sessionStats.mainItemsScanned} items</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sweed Items Scanned:</span>
                      <span className="font-medium">{sessionStats.sweedItemsScanned} items</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Total Scanned:</span>
                      <span className="font-bold">{sessionStats.totalItemsScanned} items</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  to="/labels"
                  className="flex items-center space-x-3 p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Printer className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Generate Labels</div>
                    <div className="text-sm text-gray-600">Fixed Dimensions for Uline S-5627</div>
                  </div>
                </Link>

                <button
                  onClick={handlePrintPickTickets}
                  className="flex items-center space-x-3 p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                  disabled={pickTicketData.length === 0}
                >
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Print Pick Tickets</div>
                    <div className="text-sm text-gray-600">{pickTicketData.length} items ready</div>
                  </div>
                </button>

                <button
                  onClick={handleExportPickTickets}
                  className="flex items-center space-x-3 p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  disabled={pickTicketData.length === 0}
                >
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Download className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Export CSV</div>
                    <div className="text-sm text-gray-600">Download pick tickets</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scanned' && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Detailed Scanned Items ({scannedDetails.length} items)
            </h3>

            {scannedDetails.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No items scanned yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>SKU</th>
                      <th>Product Name</th>
                      <th>Brand</th>
                      <th>Barcode</th>
                      <th>BioTrack</th>
                      <th>Quantity</th>
                      <th>Location/Ship To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scannedDetails.map((item, index) => (
                      <tr key={index} className={item.source === 'Sweed Report' ? 'bg-orange-50' : 'bg-blue-50'}>
                        <td>
                          <span className={`badge ${item.source === 'Sweed Report' ? 'badge-yellow' : 'badge-blue'}`}>
                            {item.displaySource}
                          </span>
                        </td>
                        <td className="font-mono">{item.sku}</td>
                        <td>{item.productName}</td>
                        <td>{item.brand}</td>
                        <td className="font-mono">{item.barcode}</td>
                        <td className="font-mono">{item.bioTrackCode}</td>
                        <td>{item.quantity}</td>
                        <td>{item.location || item.shipToLocation || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'picktickets' && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Pick Tickets ({pickTicketData.length} items)
              </h3>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrintPickTickets}
                  disabled={pickTicketData.length === 0}
                  className="btn btn-primary btn-sm flex items-center space-x-2"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print</span>
                </button>

                <button
                  onClick={handleExportPickTickets}
                  disabled={pickTicketData.length === 0}
                  className="btn btn-secondary btn-sm flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {pickTicketData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No pick tickets to generate
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Pick #</th>
                      <th>Source</th>
                      <th>SKU</th>
                      <th>Barcode</th>
                      <th>Product Name</th>
                      <th>Brand</th>
                      <th>Size</th>
                      <th>Quantity</th>
                      <th>Location</th>
                      <th>Ship To</th>
                      <th>Order #</th>
                      <th>Picked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pickTicketData.map((item, index) => (
                      <tr key={index} className={item.source === '[SWEED]' ? 'bg-orange-50' : 'bg-blue-50'}>
                        <td className="text-center font-bold">{item.pickNumber}</td>
                        <td>
                          <span className={`badge ${item.source === '[SWEED]' ? 'badge-yellow' : 'badge-blue'}`}>
                            {item.source}
                          </span>
                        </td>
                        <td className="font-mono">{item.sku}</td>
                        <td className="font-mono">{item.barcode}</td>
                        <td>{item.productName}</td>
                        <td>{item.brand}</td>
                        <td>{item.size || 'N/A'}</td>
                        <td>{item.quantity}</td>
                        <td>{item.location || 'N/A'}</td>
                        <td>{item.shipTo || 'N/A'}</td>
                        <td className="font-mono">{item.orderNumber || 'N/A'}</td>
                        <td className="text-center">☐</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}