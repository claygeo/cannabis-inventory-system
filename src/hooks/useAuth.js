import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_USERS, STORAGE_KEYS, EVENT_TYPES } from '../constants.js';
import { StorageHelper } from '../utils/storage.js';

/**
 * Custom hook for authentication management
 * Handles login, logout, and user session management
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(null);

  // Maximum login attempts before lockout
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

  /**
   * Initialize authentication state from storage
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check for stored authentication token
        const token = StorageHelper.getItem(STORAGE_KEYS.AUTH_TOKEN);
        const userData = StorageHelper.getItem(STORAGE_KEYS.USER_DATA);
        
        if (token && userData) {
          // Validate token (in a real app, this would be server validation)
          const isValidToken = validateAuthToken(token);
          
          if (isValidToken) {
            setUser(userData);
            setIsAuthenticated(true);
            
            // Log session restoration
            logAuthEvent(EVENT_TYPES.SESSION_START, userData.username);
          } else {
            // Invalid token, clear storage
            await logout();
          }
        }
        
        // Check for lockout status
        const lockoutData = StorageHelper.getItem('auth_lockout');
        if (lockoutData) {
          const { attempts, timestamp } = lockoutData;
          const now = Date.now();
          
          if (now - timestamp < LOCKOUT_DURATION) {
            setIsLocked(true);
            setLockoutTime(timestamp + LOCKOUT_DURATION);
            setLoginAttempts(attempts);
          } else {
            // Lockout expired, clear it
            StorageHelper.removeItem('auth_lockout');
          }
        }
        
      } catch (error) {
        console.error('Error initializing authentication:', error);
        await logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Handle lockout timer
   */
  useEffect(() => {
    if (isLocked && lockoutTime) {
      const timer = setInterval(() => {
        const now = Date.now();
        if (now >= lockoutTime) {
          setIsLocked(false);
          setLockoutTime(null);
          setLoginAttempts(0);
          StorageHelper.removeItem('auth_lockout');
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isLocked, lockoutTime]);

  /**
   * Validate authentication token
   * @param {string} token - Authentication token
   * @returns {boolean} - Whether token is valid
   */
  const validateAuthToken = (token) => {
    try {
      // In a real application, this would validate against a server
      // For demo purposes, we'll do basic validation
      const decoded = JSON.parse(atob(token.split('.')[1] || ''));
      const now = Date.now() / 1000;
      
      return decoded.exp > now;
    } catch (error) {
      return false;
    }
  };

  /**
   * Generate authentication token
   * @param {Object} userData - User data
   * @returns {string} - JWT-like token
   */
  const generateAuthToken = (userData) => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      username: userData.username,
      role: userData.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    // Create a simple token (in production, use proper JWT signing)
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    const signature = btoa(`${encodedHeader}.${encodedPayload}.secret`);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  };

  /**
   * Log authentication events
   * @param {string} eventType - Type of event
   * @param {string} username - Username involved
   * @param {Object} additionalData - Additional event data
   */
  const logAuthEvent = (eventType, username, additionalData = {}) => {
    const eventData = {
      type: eventType,
      timestamp: new Date().toISOString(),
      username,
      ip: 'client', // In a real app, get actual IP
      userAgent: navigator.userAgent,
      ...additionalData
    };

    // Store event (in production, send to server)
    const events = StorageHelper.getItem('auth_events') || [];
    events.push(eventData);
    
    // Keep only last 100 events
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }
    
    StorageHelper.setItem('auth_events', events);
  };

  /**
   * Login user with credentials
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<Object>} - Login result
   */
  const login = useCallback(async (username, password) => {
    try {
      if (isLocked) {
        return {
          success: false,
          error: `Account locked. Try again in ${Math.ceil((lockoutTime - Date.now()) / 60000)} minutes.`
        };
      }

      setIsLoading(true);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Find user in default users
      const foundUser = DEFAULT_USERS.find(
        u => u.username === username && u.password === password
      );

      if (!foundUser) {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        // Check if we should lock the account
        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          const lockoutTimestamp = Date.now();
          setIsLocked(true);
          setLockoutTime(lockoutTimestamp + LOCKOUT_DURATION);
          
          StorageHelper.setItem('auth_lockout', {
            attempts: newAttempts,
            timestamp: lockoutTimestamp
          });

          logAuthEvent(EVENT_TYPES.USER_LOGIN, username, { 
            success: false, 
            reason: 'account_locked',
            attempts: newAttempts 
          });

          return {
            success: false,
            error: `Too many failed attempts. Account locked for ${LOCKOUT_DURATION / 60000} minutes.`
          };
        }

        logAuthEvent(EVENT_TYPES.USER_LOGIN, username, { 
          success: false, 
          reason: 'invalid_credentials',
          attempts: newAttempts 
        });

        return {
          success: false,
          error: `Invalid credentials. ${MAX_LOGIN_ATTEMPTS - newAttempts} attempts remaining.`
        };
      }

      // Successful login
      const userData = {
        username: foundUser.username,
        role: foundUser.role,
        loginTime: new Date().toISOString()
      };

      const token = generateAuthToken(userData);

      // Store authentication data
      StorageHelper.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      StorageHelper.setItem(STORAGE_KEYS.USER_DATA, userData);

      // Clear lockout data on successful login
      StorageHelper.removeItem('auth_lockout');
      setLoginAttempts(0);
      setIsLocked(false);
      setLockoutTime(null);

      // Update state
      setUser(userData);
      setIsAuthenticated(true);

      // Log successful login
      logAuthEvent(EVENT_TYPES.USER_LOGIN, username, { 
        success: true, 
        role: foundUser.role 
      });

      return { success: true, user: userData };

    } catch (error) {
      console.error('Login error:', error);
      
      logAuthEvent(EVENT_TYPES.ERROR_OCCURRED, username, { 
        error: error.message,
        context: 'login'
      });

      return {
        success: false,
        error: 'An error occurred during login. Please try again.'
      };
    } finally {
      setIsLoading(false);
    }
  }, [loginAttempts, isLocked, lockoutTime]);

  /**
   * Logout current user
   */
  const logout = useCallback(async () => {
    try {
      const currentUsername = user?.username || 'unknown';
      
      // Log logout event
      logAuthEvent(EVENT_TYPES.USER_LOGOUT, currentUsername);

      // Clear authentication data
      StorageHelper.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      StorageHelper.removeItem(STORAGE_KEYS.USER_DATA);

      // Reset state
      setUser(null);
      setIsAuthenticated(false);

      return { success: true };

    } catch (error) {
      console.error('Logout error:', error);
      
      // Force state reset even if there's an error
      setUser(null);
      setIsAuthenticated(false);
      
      return { success: false, error: error.message };
    }
  }, [user]);

  /**
   * Check if user has specific role
   * @param {string} requiredRole - Required role
   * @returns {boolean} - Whether user has role
   */
  const hasRole = useCallback((requiredRole) => {
    return user?.role === requiredRole;
  }, [user]);

  /**
   * Check if user has any of the specified roles
   * @param {Array<string>} roles - Array of roles to check
   * @returns {boolean} - Whether user has any of the roles
   */
  const hasAnyRole = useCallback((roles) => {
    return roles.includes(user?.role);
  }, [user]);

  /**
   * Get remaining lockout time in minutes
   * @returns {number} - Minutes remaining in lockout
   */
  const getRemainingLockoutTime = useCallback(() => {
    if (!isLocked || !lockoutTime) return 0;
    return Math.ceil((lockoutTime - Date.now()) / 60000);
  }, [isLocked, lockoutTime]);

  /**
   * Get user session duration
   * @returns {number} - Session duration in minutes
   */
  const getSessionDuration = useCallback(() => {
    if (!user?.loginTime) return 0;
    const loginTime = new Date(user.loginTime);
    const now = new Date();
    return Math.floor((now - loginTime) / 60000);
  }, [user]);

  /**
   * Refresh authentication token
   * @returns {Promise<Object>} - Refresh result
   */
  const refreshToken = useCallback(async () => {
    try {
      if (!user) {
        return { success: false, error: 'No user session' };
      }

      const newToken = generateAuthToken(user);
      StorageHelper.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken);

      logAuthEvent(EVENT_TYPES.SESSION_START, user.username, { 
        action: 'token_refresh' 
      });

      return { success: true, token: newToken };

    } catch (error) {
      console.error('Token refresh error:', error);
      return { success: false, error: error.message };
    }
  }, [user]);

  /**
   * Get authentication events for current user
   * @returns {Array} - Array of auth events
   */
  const getAuthEvents = useCallback(() => {
    if (!user) return [];
    
    const events = StorageHelper.getItem('auth_events') || [];
    return events.filter(event => event.username === user.username)
                 .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                 .slice(0, 20); // Last 20 events
  }, [user]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    isLocked,
    loginAttempts,
    
    // Actions
    login,
    logout,
    refreshToken,
    
    // Utilities
    hasRole,
    hasAnyRole,
    getRemainingLockoutTime,
    getSessionDuration,
    getAuthEvents,
    
    // Constants
    maxLoginAttempts: MAX_LOGIN_ATTEMPTS,
    lockoutDuration: LOCKOUT_DURATION
  };
};