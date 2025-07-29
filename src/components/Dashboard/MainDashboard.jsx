import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useInventory } from '../../contexts/InventoryContext.jsx';
import { useSession } from '../../contexts/SessionContext.jsx';

export default function MainDashboard() {
  const { user } = useAuth();
  const { hasMainInventory, hasSweedData } = useInventory();
  const { getSessionStats } = useSession();

  const sessionStats = getSessionStats();

  // Quick action items
  const quickActions = [
    {
      title: 'Import Main Inventory',
      path: '/import',
      available: true,
      status: hasMainInventory ? 'Imported' : 'Required'
    },
    {
      title: 'Import Sweed Report',
      path: '/sweed-import',
      available: true,
      status: hasSweedData ? 'Imported' : 'Optional'
    },
    {
      title: 'Start Scanning',
      path: '/scanning',
      available: hasMainInventory || hasSweedData,
      status: sessionStats.totalItemsScanned > 0 ? `${sessionStats.totalItemsScanned} Scanned` : 'Ready'
    },
    {
      title: 'Generate Labels',
      path: '/labels',
      available: sessionStats.totalItemsScanned > 0,
      status: sessionStats.totalItemsScanned > 0 ? 'Ready' : 'Scan Items First'
    },
    {
      title: 'View Reports',
      path: '/reports',
      available: true,
      status: 'Available'
    }
  ];

  return (
    <div className="min-h-screen bg-[#15161B]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#FAFCFB]">
              Cannabis Inventory Management System
            </h1>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
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
                  className={`bg-[#86EFAC] rounded-2xl p-8 h-full transition-all duration-300 ${
                    !isDisabled ? 'group-hover:shadow-2xl' : ''
                  }`}
                  style={{
                    boxShadow: !isDisabled ? '0 10px 25px rgba(134, 239, 172, 0.1)' : 'none'
                  }}
                >
                  {/* Status Badge */}
                  <div className="flex justify-center mb-6">
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

                  {/* Content */}
                  <div className="text-center">
                    <h3 
                      className="text-xl font-bold mb-4 transition-all duration-300 text-[#00001C]"
                    >
                      {action.title}
                    </h3>
                  </div>

                  {/* Arrow indicator */}
                  {!isDisabled && (
                    <div className={`mt-6 flex justify-center transition-transform duration-300 group-hover:translate-x-1`}>
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ 
                          backgroundColor: 'rgba(0, 0, 28, 0.1)'
                        }}
                      >
                        <svg 
                          className="w-4 h-4 text-[#00001C]"
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
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
      </div>
    </div>
  );
}