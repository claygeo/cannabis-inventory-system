import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { APP_NAME, APP_VERSION } from '../../constants.js';
import { 
  Home, 
  Upload, 
  Scan, 
  Tag, 
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
    { path: '/sweed-import', label: 'Import Sweed', icon: Upload },
    { path: '/scanning', label: 'Scanning', icon: Scan },
    { path: '/labels', label: 'Labels', icon: Tag }
  ];

  const handleLogout = () => {
    toast.success('Logged out successfully');
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // Close user menu if it's open
    if (isUserMenuOpen) {
      setIsUserMenuOpen(false);
    }
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
    // Close mobile menu if it's open
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const closeUserMenu = () => {
    setIsUserMenuOpen(false);
  };

  return (
    <header className="bg-[#181B22] shadow-sm border-b border-[#39414E] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-[#86EFAC] rounded-lg flex items-center justify-center">
                <span className="text-[#00001C] font-bold text-sm">CI</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-[#FAFCFB]">{APP_NAME}</h1>
                <p className="text-xs text-[#9FA3AC]">V{APP_VERSION}</p>
              </div>
            </div>
            
            {/* Current Page Title */}
            <div className="hidden md:block border-l border-[#39414E] pl-4">
              <h2 className="text-lg font-medium text-[#FAFCFB]">{title}</h2>
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
                      ? 'bg-[#86EFAC] text-[#00001C]'
                      : 'text-[#9FA3AC] hover:text-[#FAFCFB] hover:bg-[#39414E]'
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
            <div className="hidden xl:flex items-center space-x-4 text-sm text-[#9FA3AC]">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>{inventoryStats?.mainInventoryCount || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>{inventoryStats?.sweedDataCount || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{sessionStats?.totalItemsScanned || 0}</span>
                </div>
              </div>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={toggleUserMenu}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-[#9FA3AC] hover:bg-[#39414E] transition-colors"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:block text-[#FAFCFB]">{user?.username}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#181B22] border border-[#39414E] rounded-lg shadow-lg z-50">
                  <div className="px-4 py-3 border-b border-[#39414E]">
                    <div className="text-sm font-medium text-[#FAFCFB]">{user?.username}</div>
                    <div className="text-xs text-[#9FA3AC]">Role: {user?.role}</div>
                    <div className="text-xs text-[#9FA3AC]">Session: {getSessionDuration?.() || 'N/A'}</div>
                  </div>
                  
                  <div className="px-4 py-3 border-b border-[#39414E]">
                    <div className="text-xs text-[#9FA3AC]">
                      <div>Main Inventory: {inventoryStats?.mainInventoryCount || 0} items</div>
                      <div>Sweed Data: {inventoryStats?.sweedDataCount || 0} items</div>
                      <div>Items Scanned: {sessionStats?.totalItemsScanned || 0}</div>
                    </div>
                  </div>
                  
                  <div className="p-2">
                    <button
                      onClick={() => {
                        closeUserMenu();
                        handleLogout();
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
              className="lg:hidden p-2 rounded-lg text-[#9FA3AC] hover:text-[#FAFCFB] hover:bg-[#39414E] transition-colors"
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
          <div className="lg:hidden border-t border-[#39414E] py-4">
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
                        ? 'bg-[#86EFAC] text-[#00001C]'
                        : 'text-[#9FA3AC] hover:text-[#FAFCFB] hover:bg-[#39414E]'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Status Info */}
            <div className="mt-4 pt-4 border-t border-[#39414E]">
              <div className="px-3 py-2 text-sm text-[#9FA3AC]">
                <div className="font-medium mb-2 text-[#FAFCFB]">Session Status:</div>
                <div className="space-y-1 text-xs">
                  <div>Main Inventory: {inventoryStats?.mainInventoryCount || 0} items</div>
                  <div>Sweed Data: {inventoryStats?.sweedDataCount || 0} items</div>
                  <div>Items Scanned: {sessionStats?.totalItemsScanned || 0}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}