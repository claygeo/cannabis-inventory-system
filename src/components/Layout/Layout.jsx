import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
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

  // COMPREHENSIVE TOAST OVERLAY FIX
  useEffect(() => {
    // Clear any existing toasts immediately on mount
    toast.dismiss();
    
    const aggressiveOverlayCleanup = () => {
      try {
        // 1. Remove any rogue React Hot Toast containers
        const toastContainers = document.querySelectorAll('[id*="toaster"], [id*="_rht_"]');
        toastContainers.forEach((container, index) => {
          // Keep only the first legitimate container, remove all others
          if (index > 0) {
            console.log('Removing duplicate toast container:', container);
            container.remove();
          }
        });

        // 2. Target problematic high z-index elements specifically
        const suspiciousElements = document.querySelectorAll('div[style*="z-index"]');
        suspiciousElements.forEach(element => {
          const style = window.getComputedStyle(element);
          const zIndex = parseInt(style.zIndex) || 0;
          
          // Target specific problematic characteristics:
          // - Very high z-index (9999)
          // - No meaningful class or ID
          // - Fixed or absolute positioning
          // - Takes up significant screen space
          // - Has pointer-events: none (the smoking gun)
          if (zIndex >= 9999 && 
              !element.className && 
              !element.id.includes('modal') &&
              !element.id.includes('header') &&
              !element.getAttribute('data-react-hot-toast') &&
              (style.position === 'fixed' || style.position === 'absolute') &&
              style.pointerEvents === 'none' &&
              element.offsetWidth >= window.innerWidth * 0.8 &&
              element.offsetHeight >= window.innerHeight * 0.8) {
            
            console.log('🚫 Removing problematic overlay element:', {
              element,
              zIndex,
              className: element.className,
              id: element.id,
              position: style.position,
              pointerEvents: style.pointerEvents,
              width: element.offsetWidth,
              height: element.offsetHeight
            });
            element.remove();
          }
        });

        // 3. Clean up any stuck React Hot Toast portals
        const portals = document.querySelectorAll('body > div:not([id]):not([class])');
        portals.forEach(portal => {
          const style = window.getComputedStyle(portal);
          const hasHighZIndex = parseInt(style.zIndex) >= 9999;
          const isFullscreen = portal.offsetWidth >= window.innerWidth * 0.8 && portal.offsetHeight >= window.innerHeight * 0.8;
          const hasNoContent = portal.children.length === 0 || portal.textContent.trim() === '';
          
          if (hasHighZIndex && isFullscreen && hasNoContent) {
            console.log('🚫 Removing stuck portal:', portal);
            portal.remove();
          }
        });

        // 4. Ensure proper toast container setup
        const validToasters = document.querySelectorAll('[data-react-hot-toast]');
        if (validToasters.length === 0) {
          // If no valid toaster exists, the Toaster component will create one properly
          console.log('✅ No toast containers found - Toaster will create properly positioned one');
        } else if (validToasters.length > 1) {
          // Remove extra toasters, keep only the first one
          for (let i = 1; i < validToasters.length; i++) {
            console.log('🚫 Removing duplicate toaster:', validToasters[i]);
            validToasters[i].remove();
          }
        }

      } catch (error) {
        console.error('Error during overlay cleanup:', error);
      }
    };

    // Run cleanup immediately
    aggressiveOverlayCleanup();
    
    // Run cleanup on a more frequent interval during development
    const cleanupInterval = setInterval(aggressiveOverlayCleanup, 1000);
    
    // Also run cleanup when DOM changes occur
    const observer = new MutationObserver((mutations) => {
      let shouldCleanup = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              const element = node;
              const style = window.getComputedStyle(element);
              const zIndex = parseInt(style.zIndex) || 0;
              
              // Check if a problematic overlay was just added
              if (zIndex >= 9999 && 
                  !element.className && 
                  (style.position === 'fixed' || style.position === 'absolute')) {
                shouldCleanup = true;
              }
            }
          });
        }
      });
      
      if (shouldCleanup) {
        setTimeout(aggressiveOverlayCleanup, 100); // Small delay to let React finish
      }
    });

    // Watch for DOM changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Cleanup on unmount
    return () => {
      clearInterval(cleanupInterval);
      observer.disconnect();
    };
  }, []);

  // Route change cleanup
  useEffect(() => {
    // Clear toasts when navigating to prevent stuck overlays
    toast.dismiss();
  }, [location.pathname]);

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
        return 'Barcode Scanning';
      case '/labels':
        return 'Label Generation';
      case '/reports':
        return 'Reports';
      default:
        return 'Cannabis Inventory System';
    }
  };

  return (
    <div className="min-h-screen bg-[#15161B]">
      {/* 
        SINGLE Toast Container with aggressive z-index control and proper styling
        This is the ONLY Toaster in the entire application
      */}
      <Toaster
        position="top-right"
        containerClassName="toast-container-fixed"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#181B22',
            color: '#FAFCFB',
            border: '1px solid #39414E',
            borderRadius: '8px',
            fontSize: '14px',
            maxWidth: '400px',
            padding: '12px 16px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#86EFAC',
              secondary: '#00001C',
            },
            style: {
              background: '#181B22',
              color: '#FAFCFB',
              border: '1px solid #86EFAC',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FAFCFB',
            },
            style: {
              background: '#181B22',
              color: '#FAFCFB',
              border: '1px solid #EF4444',
            },
          },
          loading: {
            duration: Infinity,
            style: {
              background: '#181B22',
              color: '#FAFCFB',
              border: '1px solid #39414E',
            },
          },
        }}
        containerStyle={{
          zIndex: 40, // Much lower z-index to prevent conflicts with modals
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          pointerEvents: 'none', // Container itself doesn't block events
        }}
        // Prevent multiple containers
        reverseOrder={false}
        gutter={8}
      />
      
      {/* Header */}
      <Header 
        title={getPageTitle()}
        user={user}
        inventoryStats={inventoryStats}
        sessionStats={sessionStats}
      />

      {/* Main Content */}
      <main className="min-h-screen">
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>

      {/* Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#181B22] border-t border-[#39414E] px-4 py-2 text-xs text-[#9FA3AC] z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="text-[#FAFCFB]">User: {user?.username}</span>
            <span className="text-[#39414E]">•</span>
            <span className="text-[#FAFCFB]">Role: {user?.role}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-[#FAFCFB]">
              Inventory: {inventoryStats?.mainInventoryCount || 0} main + {inventoryStats?.sweedDataCount || 0} sweed
            </span>
            <span className="text-[#39414E]">•</span>
            <span className="text-[#FAFCFB]">
              Scanned: {sessionStats?.totalItemsScanned || 0} items
            </span>
          </div>
        </div>
      </div>

      {/* Add bottom padding to account for status bar */}
      <div className="h-12"></div>
    </div>
  );
}