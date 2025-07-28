import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useInventory } from '../../contexts/InventoryContext.jsx';
import { useSession } from '../../contexts/SessionContext.jsx';
import { 
  Upload, 
  Scan, 
  Tag, 
  BarChart3,
  Database,
  FileSpreadsheet,
  Zap
} from 'lucide-react';

export default function MainDashboard() {
  const { user } = useAuth();
  const { hasMainInventory, hasSweedData, totalItems } = useInventory();
  const { getSessionStats } = useSession();

  const sessionStats = getSessionStats();

  // Quick action items
  const quickActions = [
    {
      title: 'Import Main Inventory',
      description: 'Upload Homestead inventory file',
      icon: Database,
      path: '/import',
      color: 'bg-accent',
      textColor: 'text-on-accent',
      available: true,
      status: hasMainInventory ? 'Imported' : 'Required'
    },
    {
      title: 'Import Sweed Report', 
      description: 'Upload inventory report with dates',
      icon: FileSpreadsheet,
      path: '/sweed-import',
      color: 'bg-accent',
      textColor: 'text-on-accent',
      available: true,
      status: hasSweedData ? 'Imported' : 'Optional'
    },
    {
      title: 'Start Scanning',
      description: 'Scan product barcodes',
      icon: Scan,
      path: '/scanning',
      color: 'bg-accent',
      textColor: 'text-on-accent',
      available: hasMainInventory || hasSweedData,
      status: sessionStats.totalItemsScanned > 0 ? `${sessionStats.totalItemsScanned} Scanned` : 'Ready'
    },
    {
      title: 'Generate Labels',
      description: 'Create fixed-dimension labels',
      icon: Tag,
      path: '/labels',
      color: 'bg-accent',
      textColor: 'text-on-accent',
      available: sessionStats.totalItemsScanned > 0,
      status: sessionStats.totalItemsScanned > 0 ? 'Ready' : 'Scan Items First'
    },
    {
      title: 'View Reports',
      description: 'Session data and analytics',
      icon: BarChart3,
      path: '/reports',
      color: 'bg-secondary border border-border-primary',
      textColor: 'text-primary',
      available: true,
      status: 'Available'
    }
  ];

  return (
    <div className="min-h-screen bg-primary">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-accent rounded-xl">
              <Zap className="h-8 w-8 text-on-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary">
                Cannabis Inventory System
              </h1>
              <p className="text-secondary text-lg">
                Fixed Dimensions Edition v5.3 • {user?.role}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            const isDisabled = !action.available;
            
            return (
              <Link
                key={index}
                to={action.path}
                className={`block group transition-all duration-300 ${
                  isDisabled ? 'pointer-events-none opacity-50' : 'hover:scale-105'
                }`}
              >
                <div className={`${action.color} rounded-2xl p-8 h-full transition-all duration-300 ${
                  !isDisabled ? 'group-hover:shadow-2xl group-hover:shadow-accent/20' : ''
                }`}>
                  {/* Status Badge */}
                  <div className="flex justify-between items-start mb-6">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      action.status === 'Imported' || action.status === 'Ready' || action.status.includes('Scanned') 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : action.status === 'Required'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {action.status}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="mb-6">
                    <IconComponent className={`h-12 w-12 ${action.textColor} transition-transform duration-300 ${
                      !isDisabled ? 'group-hover:scale-110' : ''
                    }`} />
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className={`text-xl font-bold ${action.textColor} mb-2 transition-all duration-300`}>
                      {action.title}
                    </h3>
                    <p className={`${action.textColor === 'text-on-accent' ? 'text-on-accent/80' : 'text-secondary'} leading-relaxed`}>
                      {action.description}
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  {!isDisabled && (
                    <div className={`mt-6 flex justify-end transition-transform duration-300 group-hover:translate-x-1`}>
                      <div className={`w-8 h-8 rounded-full ${action.textColor === 'text-on-accent' ? 'bg-on-accent/10' : 'bg-primary/10'} flex items-center justify-center`}>
                        <svg className={`w-4 h-4 ${action.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Data Summary - Minimal */}
        {(hasMainInventory || hasSweedData || sessionStats.totalItemsScanned > 0) && (
          <div className="mt-12 bg-secondary rounded-2xl p-6 border border-border-primary">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {hasMainInventory && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent mb-1">
                    {totalItems.toLocaleString()}
                  </div>
                  <div className="text-secondary text-sm">
                    Total Items Available
                  </div>
                </div>
              )}

              {sessionStats.totalItemsScanned > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent mb-1">
                    {sessionStats.totalItemsScanned}
                  </div>
                  <div className="text-secondary text-sm">
                    Items Scanned
                  </div>
                </div>
              )}

              <div className="text-center">
                <div className="text-2xl font-bold text-accent mb-1">
                  {user?.role || 'User'}
                </div>
                <div className="text-secondary text-sm">
                  Current Role
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-secondary text-sm">
            Workflow: Import → Scan → Generate Labels → Print
          </p>
        </div>
      </div>
    </div>
  );
}