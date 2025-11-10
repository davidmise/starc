import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI, healthCheck, tokenStorage } from '../services/api';

interface User {
  id: string;
  username: string;
  email: string;
  display_name?: string;
  profile_pic?: string;
  bio?: string;
  avatar?: string;
  is_verified?: boolean;
  is_active?: boolean;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
  followers_count?: number;
  following_count?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isConnected: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  retryConnection: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // Check authentication status on app load only once
  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        const token = await tokenStorage.getToken();
        
        if (!isMounted) return; // Prevent state updates if component unmounted
        
        if (token) {
          try {
            const response = await authAPI.validateToken();
            if (isMounted) {
              setUser(response.user);
              setIsAuthenticated(true);
              setIsConnected(true);
            }
          } catch (validationError: any) {
            if (isMounted) {
              await tokenStorage.removeToken();
              setIsAuthenticated(false);
              setUser(null);
              setIsConnected(false);
            }
          }
        } else {
          if (isMounted) {
            setIsAuthenticated(false);
            setUser(null);
            setIsConnected(false);
          }
        }
      } catch (error) {
        console.error('❌ Error checking auth status:', error);
        if (isMounted) {
          setIsAuthenticated(false);
          setUser(null);
          setIsConnected(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();
    
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - run only once

  const checkAuthStatus = async () => {
    try {
      const token = await tokenStorage.getToken();
      
      if (token) {
        try {
          const response = await authAPI.validateToken();
          setUser(response.user);
          setIsAuthenticated(true);
          setIsConnected(true);
        } catch (validationError: any) {
          await tokenStorage.removeToken();
          setIsAuthenticated(false);
          setUser(null);
          setIsConnected(false);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setIsConnected(false);
      }
    } catch (error) {
      console.error('❌ Error checking auth status:', error);
      setIsAuthenticated(false);
      setUser(null);
      setIsConnected(false);
    }
  };

  // Removed debounced function to prevent loops

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Starting login process...');
      const response = await authAPI.login({ email, password });
      
      // Store token securely
      await tokenStorage.setToken(response.token);
      console.log('🔐 Token stored successfully');
      
      // Verify token was stored
      const storedToken = await tokenStorage.getToken();
      if (!storedToken) {
        throw new Error('Token storage failed');
      }
      console.log('✅ Token verification successful');
      
      // Set user data and authentication state
      setUser(response.user);
      setIsAuthenticated(true);
      setIsConnected(true);
      
      console.log('✅ Login successful for user:', response.user.username);
      
      // Force a small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Re-check auth status to confirm everything is working
      await checkAuthStatus();
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await authAPI.register({ username, email, password });
      
      // Store token securely
      await tokenStorage.setToken(response.token);
      
      // Set user data and authentication state
      setUser(response.user);
      setIsAuthenticated(true);
      setIsConnected(true);
      
      console.log('✅ Registration successful:', response.user.username);
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Remove token securely
      await tokenStorage.removeToken();
      
      // Clear user data and authentication state
      setUser(null);
      setIsAuthenticated(false);
      setIsConnected(false);
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout failed:', error);
    }
  };

  const retryConnection = async () => {
    try {
      setIsConnected(false);
      
      // Test connection by making a health check
      const isHealthy = await healthCheck();
      setIsConnected(isHealthy);
    } catch (error) {
      console.error('❌ Connection retry failed:', error);
      setIsConnected(false);
    }
  };

  // Removed testConnection to prevent loops

  const value = {
    user,
    isAuthenticated,
    isLoading,
    isConnected,
    login,
    register,
    logout,
    retryConnection,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 