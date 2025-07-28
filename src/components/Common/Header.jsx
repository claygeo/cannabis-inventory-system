import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { APP_NAME, APP_VERSION } from '../../constants.js';
import { 
  Home, 
  Upload, 
  Scan, 
  Tag, 
  FileText, 
  LogOut, 
  Menu, 
  X,
  User,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Header({ title, inventoryStats, sessionStats }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, getSessionDuration } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/import', label: 'Import Main', icon: Upload },
    { path: '/import-sweed', label: 'Import Sweed', icon: Upload },
    { path: '/scanning', label: 'Scanning', icon: Scan },
    { path: '/labels', label: 'Labels', icon: Tag },
    { path: '/reports', label: 'Reports', icon: FileText }
  ];

  const handleLogout = () => {
    toast.success('Logged out successfully');
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container-cannabis">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CI</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-gray-900">{APP_NAME}</h1>
                <p className="text-xs text-gray-500">V{APP_VERSION} - Fixed Dimensions</p>
              </div>
            </div>
            
            {/* Current Page Title */}
            <div className="hidden md:block border-l border-gray-300 pl-4">
              <h2 className="text-lg font-medium text-gray-700">{title}</h2>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Status Info & User Menu */}
          <div className="flex items-center space-x-4">
            {/* Status Indicators (Desktop) */}
            <div className="hidden xl:flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>{inventoryStats.mainInventoryCount}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>{inventoryStats.sweedDataCount}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{sessionStats.totalItemsScanned}</span>
                </div>
              </div>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={toggleUserMenu}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:block">{user?.username}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="text-sm font-medium text-gray-900">{user?.username}</div>
                    <div className="text-xs text-gray-500">Role: {user?.role}</div>
                    <div className="text-xs text-gray-500">Session: {getSessionDuration()}</div>
                  </div>
                  
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="text-xs text-gray-600">
                      <div>Main Inventory: {inventoryStats.mainInventoryCount} items</div>
                      <div>Sweed Data: {inventoryStats.sweedDataCount} items</div>
                      <div>Items Scanned: {sessionStats.totalItemsScanned}</div>
                    </div>
                  </div>
                  
                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Status Info */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="px-3 py-2 text-sm text-gray-600">
                <div className="font-medium mb-2">Session Status:</div>
                <div className="space-y-1 text-xs">
                  <div>Main Inventory: {inventoryStats.mainInventoryCount} items</div>
                  <div>Sweed Data: {inventoryStats.sweedDataCount} items</div>
                  <div>Items Scanned: {sessionStats.totalItemsScanned}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close menus */}
      {(isMobileMenuOpen || isUserMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsMobileMenuOpen(false);
            setIsUserMenuOpen(false);
          }}
        />
      )}
    </header>
  );
}