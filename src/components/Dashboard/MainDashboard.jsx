import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useInventory } from '../../contexts/InventoryContext.jsx';
import { useSession } from '../../contexts/SessionContext.jsx';
import { InventoryStats } from '../../contexts/InventoryContext.jsx';
import { SessionStats } from '../../contexts/SessionContext.jsx';
import { APP_NAME, APP_VERSION } from '../../constants.js';
import { 
  Upload, 
  Scan, 
  Tag, 
  FileText, 
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Printer
} from 'lucide-react';

export default function MainDashboard() {
  const { user, getSessionDuration } = useAuth();
  const { getInventoryStats } = useInventory();
  const { getSessionStats } = useSession();

  const inventoryStats = getInventoryStats();
  const sessionStats = getSessionStats();

  // Determine workflow status
  const getWorkflowStatus = () => {
    const hasMainInventory = inventoryStats.hasMainInventory;
    const hasSweedData = inventoryStats.hasSweedData;
    const hasScannedItems = sessionStats.hasScannedItems;

    return {
      step1: hasMainInventory || hasSweedData,
      step2: hasMainInventory || hasSweedData,
      step3: hasScannedItems,
      step4: hasScannedItems
    };
  };

  const workflowStatus = getWorkflowStatus();

  // Quick action cards data
  const quickActions = [
    {
      title: 'Import Main Inventory',
      description: 'Upload your main inventory CSV file',
      icon: Upload,
      link: '/import',
      color: 'blue',
      status: inventoryStats.hasMainInventory ? 'complete' : 'pending',
      count: inventoryStats.mainInventoryCount
    },
    {
      title: 'Import Sweed Report',
      description: 'Upload your Sweed report CSV file',
      icon: Upload,
      link: '/import-sweed',
      color: 'orange',
      status: inventoryStats.hasSweedData ? 'complete' : 'pending',
      count: inventoryStats.sweedDataCount
    },
    {
      title: 'Enhanced Scanning',
      description: 'Scan barcodes with multi-SKU support',
      icon: Scan,
      link: '/scanning',
      color: 'green',
      status: sessionStats.hasScannedItems ? 'active' : 'ready',
      count: sessionStats.totalItemsScanned,
      disabled: !workflowStatus.step2
    },
    {
      title: 'Label Generation',
      description: 'Generate Fixed Dimension labels for Uline S-5627',
      icon: Tag,
      link: '/labels',
      color: 'purple',
      status: sessionStats.hasScannedItems ? 'ready' : 'disabled',
      disabled: !workflowStatus.step3
    },
    {
      title: 'Pick Tickets & Reports',
      description: 'Generate pick tickets and session reports',
      icon: FileText,
      link: '/reports',
      color: 'gray',
      status: sessionStats.hasScannedItems ? 'ready' : 'disabled',
      disabled: !workflowStatus.step3
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'active':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'ready':
        return <ArrowRight className="h-5 w-5 text-gray-400" />;
      case 'disabled':
        return <AlertCircle className="h-5 w-5 text-gray-300" />;
      default:
        return <ArrowRight className="h-5 w-5 text-gray-400" />;
    }
  };

  const getCardStyle = (color, disabled) => {
    if (disabled) {
      return 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed';
    }

    const styles = {
      blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      orange: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
      green: 'bg-green-50 border-green-200 hover:bg-green-100',
      purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      gray: 'bg-gray-50 border-gray-200 hover:bg-gray-100'
    };

    return `${styles[color]} hover:shadow-md`;
  };

  const getIconStyle = (color, disabled) => {
    if (disabled) {
      return 'text-gray-400';
    }

    const styles = {
      blue: 'text-blue-600',
      orange: 'text-orange-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      gray: 'text-gray-600'
    };

    return styles[color];
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.username}!
        </h1>
        <p className="text-gray-600">
          {APP_NAME} V{APP_VERSION} - Fixed Dimensions Edition
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Enhanced label generation with precise Uline S-5627 formatting
        </p>
      </div>

      {/* Session Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Current Session</h2>
            <p className="text-gray-600">
              Session Duration: {getSessionDuration()} • Role: {user?.role}
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{inventoryStats.totalItems}</div>
              <div className="text-xs text-gray-500">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{sessionStats.totalItemsScanned}</div>
              <div className="text-xs text-gray-500">Scanned</div>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory & Session Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Status</h3>
          <InventoryStats />
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Progress</h3>
          <SessionStats />
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Workflow Progress</h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              workflowStatus.step1 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}>
              {workflowStatus.step1 ? <CheckCircle className="h-5 w-5" /> : '1'}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Import Data</div>
              <div className="text-sm text-gray-500">
                Upload main inventory and/or Sweed report files
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              workflowStatus.step3 ? 'bg-green-100 text-green-600' : 
              workflowStatus.step2 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
            }`}>
              {workflowStatus.step3 ? <CheckCircle className="h-5 w-5" /> : '2'}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Scan Items</div>
              <div className="text-sm text-gray-500">
                Use enhanced scanning to select products for labeling
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              workflowStatus.step4 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
            }`}>
              {workflowStatus.step4 ? <Printer className="h-5 w-5" /> : '3'}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Generate Labels & Reports</div>
              <div className="text-sm text-gray-500">
                Create fixed dimension labels and pick tickets
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const CardComponent = action.disabled ? 'div' : Link;
            const cardProps = action.disabled ? {} : { to: action.link };

            return (
              <CardComponent
                key={action.title}
                {...cardProps}
                className={`card transition-all duration-200 ${getCardStyle(action.color, action.disabled)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${action.disabled ? 'bg-gray-100' : `bg-${action.color}-100`}`}>
                    <Icon className={`h-6 w-6 ${getIconStyle(action.color, action.disabled)}`} />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(action.status)}
                    {action.count !== undefined && action.count > 0 && (
                      <span className={`badge ${action.disabled ? 'badge-gray' : `badge-${action.color}`}`}>
                        {action.count}
                      </span>
                    )}
                  </div>
                </div>
                
                <h4 className={`font-semibold mb-2 ${action.disabled ? 'text-gray-400' : 'text-gray-900'}`}>
                  {action.title}
                </h4>
                
                <p className={`text-sm ${action.disabled ? 'text-gray-400' : 'text-gray-600'}`}>
                  {action.description}
                </p>

                {action.disabled && (
                  <div className="mt-3 text-xs text-gray-400">
                    Complete previous steps to unlock
                  </div>
                )}
              </CardComponent>
            );
          })}
        </div>
      </div>

      {/* Recent Activity or Tips */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h3>
        
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <strong>Step 1:</strong> Import your main inventory CSV file and/or Sweed report
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <strong>Step 2:</strong> Use enhanced scanning to scan product barcodes
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <strong>Step 3:</strong> Generate labels with fixed dimensions for Uline S-5627 sheets
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <strong>Enhanced:</strong> Labels are precisely sized at 4" x 1.5" with proper margins
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}