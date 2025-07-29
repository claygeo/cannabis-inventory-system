import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useInventory } from '../../contexts/InventoryContext.jsx';
import { useSession } from '../../contexts/SessionContext.jsx';

export default function MainDashboard() {
  const { user } = useAuth();
  const { getInventoryStats } = useInventory();
  const { getSessionStats } = useSession();

  const inventoryStats = getInventoryStats();
  const sessionStats = getSessionStats();

  const hasMainInventory = (inventoryStats?.mainInventoryCount || 0) > 0;
  const hasSweedData = (inventoryStats?.sweedDataCount || 0) > 0;
  const hasAnyInventory = hasMainInventory || hasSweedData;

  // Quick action items
  const quickActions = [
    {
      title: 'Import Main Inventory',
      path: '/import',
      available: true
    },
    {
      title: 'Import Sweed Report',
      path: '/sweed-import',
      available: true
    },
    {
      title: 'Start Scanning',
      path: '/scanning',
      available: hasAnyInventory
    },
    {
      title: 'Generate Labels',
      path: '/labels',
      available: sessionStats.totalItemsScanned > 0
    },
    {
      title: 'View Reports',
      path: '/reports',
      available: true
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
                  className={`bg-[#181B22] border border-[#39414E] rounded-2xl p-8 h-full transition-all duration-300 ${
                    !isDisabled ? 'group-hover:shadow-2xl group-hover:border-[#86EFAC]' : ''
                  }`}
                  style={{
                    boxShadow: !isDisabled ? '0 10px 25px rgba(134, 239, 172, 0.1)' : 'none'
                  }}
                >
                  {/* Content */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-4 transition-all duration-300 text-[#FAFCFB] group-hover:text-[#86EFAC]">
                      {action.title}
                    </h3>
                  </div>

                  {/* Arrow indicator */}
                  {!isDisabled && (
                    <div className={`mt-6 flex justify-center transition-transform duration-300 group-hover:translate-x-1`}>
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-[#86EFAC] group-hover:bg-[#FAFCFB] transition-colors duration-300"
                      >
                        <svg 
                          className="w-4 h-4 text-[#15161B] transition-colors duration-300"
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