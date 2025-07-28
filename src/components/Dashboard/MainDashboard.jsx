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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-accent)' }}>
              <Zap className="h-8 w-8" style={{ color: 'var(--text-on-accent)' }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Cannabis Inventory System
              </h1>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
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
                <div 
                  className={`${action.color} rounded-2xl p-8 h-full transition-all duration-300 ${
                    !isDisabled ? 'group-hover:shadow-2xl' : ''
                  }`}
                  style={{
                    boxShadow: !isDisabled ? '0 10px 25px rgba(134, 239, 172, 0.1)' : 'none'
                  }}
                >
                  {/* Status Badge */}
                  <div className="flex justify-between items-start mb-6">
                    <div 
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                        action.status === 'Imported' || action.status === 'Ready' || action.status.includes('Scanned') 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : action.status === 'Required'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}
                    >
                      {action.status}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="mb-6">
                    <IconComponent 
                      className={`h-12 w-12 transition-transform duration-300 ${
                        !isDisabled ? 'group-hover:scale-110' : ''
                      }`}
                      style={{ 
                        color: action.textColor === 'text-on-accent' 
                          ? 'var(--text-on-accent)' 
                          : 'var(--text-primary)' 
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <h3 
                      className="text-xl font-bold mb-2 transition-all duration-300"
                      style={{ 
                        color: action.textColor === 'text-on-accent' 
                          ? 'var(--text-on-accent)' 
                          : 'var(--text-primary)' 
                      }}
                    >
                      {action.title}
                    </h3>
                    <p 
                      className="leading-relaxed"
                      style={{ 
                        color: action.textColor === 'text-on-accent' 
                          ? 'rgba(0, 0, 28, 0.8)' 
                          : 'var(--text-secondary)' 
                      }}
                    >
                      {action.description}
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  {!isDisabled && (
                    <div className={`mt-6 flex justify-end transition-transform duration-300 group-hover:translate-x-1`}>
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ 
                          backgroundColor: action.textColor === 'text-on-accent' 
                            ? 'rgba(0, 0, 28, 0.1)' 
                            : 'rgba(21, 22, 27, 0.1)' 
                        }}
                      >
                        <svg 
                          className="w-4 h-4" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                          style={{ 
                            color: action.textColor === 'text-on-accent' 
                              ? 'var(--text-on-accent)' 
                              : 'var(--text-primary)' 
                          }}
                        >
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
          <div 
            className="mt-12 rounded-2xl p-6 border"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)'
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {hasMainInventory && (
                <div className="text-center">
                  <div 
                    className="text-2xl font-bold mb-1"
                    style={{ color: 'var(--bg-accent)' }}
                  >
                    {totalItems.toLocaleString()}
                  </div>
                  <div 
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Total Items Available
                  </div>
                </div>
              )}

              {sessionStats.totalItemsScanned > 0 && (
                <div className="text-center">
                  <div 
                    className="text-2xl font-bold mb-1"
                    style={{ color: 'var(--bg-accent)' }}
                  >
                    {sessionStats.totalItemsScanned}
                  </div>
                  <div 
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Items Scanned
                  </div>
                </div>
              )}

              <div className="text-center">
                <div 
                  className="text-2xl font-bold mb-1"
                  style={{ color: 'var(--bg-accent)' }}
                >
                  {user?.role || 'User'}
                </div>
                <div 
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Current Role
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p 
            className="text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            Workflow: Import → Scan → Generate Labels → Print
          </p>
        </div>
      </div>
    </div>
  );
}