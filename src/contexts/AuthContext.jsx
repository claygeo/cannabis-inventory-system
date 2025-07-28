import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { DEFAULT_USERS, EVENT_TYPES } from '../constants.js';
import storage from '../utils/storage.js';

const AuthContext = createContext();

// Auth action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS', 
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER'
};

// Initial auth state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null
};

// Auth reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };
      
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
      
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error
      };
      
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
      
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: !!action.payload.user,
        isLoading: false
      };
      
    default:
      return state;
  }
}

// AuthProvider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing session on mount
  useEffect(() => {
    const currentUser = storage.getCurrentUser();
    if (currentUser) {
      dispatch({
        type: AUTH_ACTIONS.SET_USER,
        payload: { user: currentUser }
      });
      
      // Log session restoration
      storage.addSessionEvent(
        EVENT_TYPES.SESSION_START,
        `Session restored for user: ${currentUser.username}`,
        `Role: ${currentUser.role}`
      );
    }
  }, []);

  // Login function
  const login = async (username, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      // Simulate async login process
      await new Promise(resolve => setTimeout(resolve, 500));

      // Validate credentials
      const normalizedUsername = username.toLowerCase().trim();
      const userConfig = DEFAULT_USERS[normalizedUsername];

      if (!userConfig || userConfig.password !== password) {
        throw new Error('Invalid username or password');
      }

      // Create user object
      const user = {
        username: normalizedUsername,
        role: userConfig.role,
        loginTime: new Date().toISOString()
      };

      // Save to storage
      storage.setCurrentUser(user);

      // Log successful login
      storage.addSessionEvent(
        EVENT_TYPES.USER_LOGIN,
        `User logged in: ${user.username}`,
        `Role: ${user.role}`
      );

      // Update state
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user }
      });

      return { success: true, user };

    } catch (error) {
      const errorMessage = error.message || 'Login failed';
      
      // Log failed login attempt
      storage.addSessionEvent(
        EVENT_TYPES.ERROR,
        `Failed login attempt: ${username}`,
        errorMessage
      );

      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: errorMessage }
      });

      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = () => {
    const currentUser = state.user;
    
    if (currentUser) {
      // Log logout
      storage.addSessionEvent(
        EVENT_TYPES.USER_LOGOUT,
        `User logged out: ${currentUser.username}`,
        `Session duration: ${getSessionDuration(currentUser.loginTime)}`
      );
    }

    // Clear user from storage
    storage.clearCurrentUser();

    // Update state
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  // Clear auth error
  const clearError = () => {
    if (state.error) {
      dispatch({
        type: AUTH_ACTIONS.SET_USER,
        payload: { user: state.user }
      });
    }
  };

  // Check if user has specific role
  const hasRole = (requiredRole) => {
    return state.user?.role === requiredRole;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.some(role => hasRole(role));
  };

  // Get session duration
  const getSessionDuration = (loginTime) => {
    if (!loginTime) return 'Unknown';
    
    const start = new Date(loginTime);
    const end = new Date();
    const duration = end - start;
    
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Context value
  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    login,
    logout,
    clearError,
    
    // Helpers
    hasRole,
    hasAnyRole,
    getSessionDuration: () => getSessionDuration(state.user?.loginTime)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// HOC for role-based access control
export function withAuth(Component, requiredRoles = []) {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, hasAnyRole } = useAuth();
    
    if (!isAuthenticated) {
      return <div>Please log in to access this feature.</div>;
    }
    
    if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
      return <div>You don't have permission to access this feature.</div>;
    }
    
    return <Component {...props} />;
  };
}

// Auth status display component
export function AuthStatus() {
  const { user, isAuthenticated, getSessionDuration } = useAuth();
  
  if (!isAuthenticated) {
    return <span className="text-gray-500">Not logged in</span>;
  }
  
  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600">
      <span className="font-medium">{user.username}</span>
      <span className="text-gray-400">•</span>
      <span>{user.role}</span>
      <span className="text-gray-400">•</span>
      <span>Session: {getSessionDuration()}</span>
    </div>
  );
}