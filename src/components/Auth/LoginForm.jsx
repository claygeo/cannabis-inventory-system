import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { ValidationHelper } from '../../utils/validation.js';
import { APP_NAME, APP_VERSION } from '../../constants.js';
import { Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginForm() {
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [validationErrors, setValidationErrors] = useState({});

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear auth error when user starts typing
    if (error) {
      clearError();
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate input
    const validation = ValidationHelper.validateCredentials(formData.username, formData.password);
    
    if (!validation.isValid) {
      const errors = {};
      validation.errors.forEach(error => {
        if (error.includes('Username')) {
          errors.username = error;
        } else if (error.includes('Password')) {
          errors.password = error;
        }
      });
      setValidationErrors(errors);
      return;
    }

    // Clear validation errors
    setValidationErrors({});

    // Attempt login
    const result = await login(formData.username, formData.password);
    
    if (result.success) {
      toast.success(`Welcome back, ${result.user.username}!`);
    } else {
      toast.error(result.error || 'Login failed');
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
            <Lock className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {APP_NAME}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Version {APP_VERSION} - Fixed Dimensions Edition
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Enhanced label generation with precise Uline S-5627 formatting
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Global Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {/* Username Field */}
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className={`input pl-10 ${validationErrors.username ? 'input-error' : ''}`}
                  placeholder="Enter your username"
                  disabled={isLoading}
                />
              </div>
              {validationErrors.username && (
                <div className="form-error">{validationErrors.username}</div>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className={`input pl-10 ${validationErrors.password ? 'input-error' : ''}`}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
              </div>
              {validationErrors.password && (
                <div className="form-error">{validationErrors.password}</div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary btn-lg relative"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Demo Credentials:</h3>
            <div className="space-y-2 text-xs">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="font-medium text-blue-900">Administrator</div>
                <div className="text-blue-700">Username: admin • Password: admin123</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="font-medium text-orange-900">Warehouse</div>
                <div className="text-orange-700">Username: warehouse • Password: warehouse123</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="font-medium text-green-900">Manager</div>
                <div className="text-green-700">Username: manager • Password: manager123</div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Key Features:</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Import Main Inventory & Sweed Reports</li>
              <li>• Enhanced barcode scanning with multi-SKU support</li>
              <li>• FIXED DIMENSIONS label generation for Uline S-5627</li>
              <li>• Pick ticket generation and session reporting</li>
              <li>• Local storage - each session starts fresh</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>Cannabis Inventory Management System V{APP_VERSION}</p>
          <p className="mt-1">Enhanced with React for better label control</p>
        </div>
      </div>
    </div>
  );
}