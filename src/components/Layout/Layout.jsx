import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../Common/Header.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useInventory } from '../../contexts/InventoryContext.jsx';
import { useSession } from '../../contexts/SessionContext.jsx';

export default function Layout() {
  const location = useLocation();
  const { user } = useAuth();
  const { getInventoryStats } = useInventory();
  const { getSessionStats } = useSession();

  const inventoryStats = getInventoryStats();
  const sessionStats = getSessionStats();

  // Get page title based on current route
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/import':
        return 'Import Main Inventory';
      case '/import-sweed':
        return 'Import Sweed Report';
      case '/scanning':
        return 'Enhanced Scanning';
      case '/labels':
        return 'Label Generation';
      case '/reports':
        return 'Session Reports';
      default:
        return 'Cannabis Inventory System';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        title={getPageTitle()}
        user={user}
        inventoryStats={inventoryStats}
        sessionStats={sessionStats}
      />

      {/* Main Content */}
      <main className="container-cannabis py-8">
        <div className="animate-fadeIn">
          <Outlet />
        </div>
      </main>

      {/* Status Bar (Optional) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 text-xs text-gray-600 no-print">
        <div className="container-cannabis flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span>User: {user?.username}</span>
            <span className="text-gray-400">•</span>
            <span>Role: {user?.role}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <span>
              Inventory: {inventoryStats.mainInventoryCount} main + {inventoryStats.sweedDataCount} sweed
            </span>
            <span className="text-gray-400">•</span>
            <span>
              Scanned: {sessionStats.totalItemsScanned} items
            </span>
          </div>
        </div>
      </div>

      {/* Add bottom padding to account for status bar */}
      <div className="h-12"></div>
    </div>
  );
}