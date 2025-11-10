import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// API URLs for different environments
const API_URLS = {
  android: 'http://192.168.1.197:5000/api',      // Updated IP for Android
  ios: 'http://192.168.1.197:5000/api',          // Updated IP for iOS
  web: 'http://localhost:5000/api',              // localhost for web development
  fallback: 'http://192.168.1.197:5000/api'      // Updated IP as fallback
};

// Get the appropriate API URL based on platform
const getApiBaseUrl = () => {
  if (Platform.OS === 'android') {
    return API_URLS.android;
  } else if (Platform.OS === 'ios') {
    return API_URLS.ios;
  } else {
    return API_URLS.web;
  }
};

let API_BASE_URL = getApiBaseUrl();

console.log('🌐 API Base URL:', API_BASE_URL);
console.log('📱 Platform:', Platform.OS);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased from 10000
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to update API base URL
const updateApiBaseUrl = (newUrl: string) => {
  API_BASE_URL = newUrl;
  api.defaults.baseURL = newUrl;
  console.log('🔄 Updated API Base URL:', newUrl);
};

// Secure token storage functions
export const tokenStorage = {
  // Store token securely
  setToken: async (token: string) => {
    try {
      console.log('🔐 Attempting to store token (length:', token.length, ')');
      
      // Use AsyncStorage directly for web platform
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem('userToken', token);
        console.log('🔐 Token stored securely (web)');
        
        // Verify storage immediately
        const verification = await AsyncStorage.getItem('userToken');
        if (verification !== token) {
          throw new Error('Token verification failed after storage');
        }
        console.log('✅ Token storage verified (web)');
        return;
      }
      
      await SecureStore.setItemAsync('userToken', token);
      console.log('🔐 Token stored securely (mobile)');
      
      // Verify storage immediately
      const verification = await SecureStore.getItemAsync('userToken');
      if (verification !== token) {
        throw new Error('Token verification failed after storage');
      }
      console.log('✅ Token storage verified (mobile)');
    } catch (error) {
      console.error('❌ Error storing token:', error);
      // Fallback to AsyncStorage for web
      if (Platform.OS === 'web') {
        try {
          await AsyncStorage.setItem('userToken', token);
          console.log('🔐 Token stored using fallback AsyncStorage');
        } catch (fallbackError) {
          console.error('❌ Fallback token storage failed:', fallbackError);
          throw fallbackError;
        }
      } else {
        throw error;
      }
    }
  },

  // Get token securely
  getToken: async (): Promise<string | null> => {
    try {
      let token: string | null = null;
      
      // Use AsyncStorage directly for web platform
      if (Platform.OS === 'web') {
        token = await AsyncStorage.getItem('userToken');
        console.log('🔍 Token retrieval (web):', token ? `Found (${token.length} chars)` : 'Not found');
        return token;
      }
      
      token = await SecureStore.getItemAsync('userToken');
      console.log('🔍 Token retrieval (mobile):', token ? `Found (${token.length} chars)` : 'Not found');
      return token;
    } catch (error) {
      console.error('❌ Error getting token:', error);
      // Fallback to AsyncStorage for web
      if (Platform.OS === 'web') {
        try {
          const fallbackToken = await AsyncStorage.getItem('userToken');
          console.log('🔍 Fallback token retrieval (web):', fallbackToken ? `Found (${fallbackToken.length} chars)` : 'Not found');
          return fallbackToken;
        } catch (fallbackError) {
          console.error('❌ Fallback token retrieval failed:', fallbackError);
          return null;
        }
      }
      return null;
    }
  },

  // Remove token securely
  removeToken: async () => {
    try {
      // Use AsyncStorage directly for web platform
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem('userToken');
        console.log('🔐 Token removed securely (web)');
        return;
      }
      await SecureStore.deleteItemAsync('userToken');
      console.log('🔐 Token removed securely');
    } catch (error) {
      console.error('❌ Error removing token:', error);
      // Fallback to AsyncStorage for web
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem('userToken');
      }
    }
  },

  // Check if user is authenticated
  isAuthenticated: async (): Promise<boolean> => {
    const token = await tokenStorage.getToken();
    return !!token;
  }
};

// Health check function
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.status === 200;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return false;
  }
};

// Function to test API connectivity and fallback if needed
export const testAndFallbackApi = async () => {
  const testUrls = [
    API_URLS.android,
    API_URLS.ios,
    API_URLS.web,
    API_URLS.fallback
  ];

  for (const url of testUrls) {
    try {
      console.log(`🧪 Testing API URL: ${url}`);
      const response = await axios.get(`${url}/health`, { 
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.status === 200) {
        console.log(`✅ Found working API URL: ${url}`);
        updateApiBaseUrl(url);
        return url;
      }
    } catch (error: any) {
      console.log(`❌ Failed to connect to: ${url}`);
      console.log(`   Error: ${error.message}`);
      
      // Provide specific error information
      if (error.code === 'ECONNREFUSED') {
        console.log(`   💡 Server not running on this URL`);
      } else if (error.code === 'ENOTFOUND') {
        console.log(`   💡 DNS resolution failed`);
      } else if (error.code === 'ECONNABORTED') {
        console.log(`   💡 Request timed out`);
      }
    }
  }
  
  console.error('❌ No working API URL found');
  console.error('💡 Please ensure backend server is running on port 5000');
  return null;
};

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    console.log('🌐 API Request:', config.method?.toUpperCase(), config.url);
    console.log('📦 Request Data:', config.data);
    try {
      const token = await tokenStorage.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  async (error: any) => {
    // Enhanced error logging
    console.error('❌ Response Error:', error.message);
    console.error('🔗 URL:', error.config?.url);
    console.error('📊 Status:', error.response?.status);
    console.error('📦 Response Data:', error.response?.data);
    
    // Network error handling
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('🌐 Network Error: Backend server may not be running or accessible');
      console.error('💡 Try checking if backend is running on port 5000');
    }
    
    // Timeout error handling
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Timeout Error: Request took too long to complete');
    }
    
    // CORS error handling
    if (error.message?.includes('CORS')) {
      console.error('🚫 CORS Error: Cross-origin request blocked');
    }
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.error('🔐 Authentication Error: Token may be expired or invalid');
      await tokenStorage.removeToken();
      // You might want to redirect to login here
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // Register user
  register: async (userData: {
    username: string;
    email: string;
    password: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login user
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Validate token
  validateToken: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData: {
    username?: string;
    bio?: string;
    profile_pic?: string;
  }) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  // Verify reset token
  verifyResetToken: async (token: string) => {
    const response = await api.get(`/auth/verify-reset-token/${token}`);
    return response.data;
  },
};

// Sessions API
export const sessionsAPI = {
  // Create live session
  createSession: async (sessionData: FormData) => {
    const response = await api.post('/sessions', sessionData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get all sessions
  getSessions: async (params?: {
    status?: string;
    genre?: string;
    page?: number;
    limit?: number;
    user_id?: string;
    search?: string;
  }) => {
    const response = await api.get('/sessions', { params: { limit: 100, ...(params || {}) } });
    console.log('[API] /sessions response:', response);
    console.log('[API] /sessions response.data:', response.data);
    return response.data;
  },

  // Get specific session
  getSession: async (sessionId: string) => {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  },

  // Update session
  updateSession: async (sessionId: string, sessionData: any) => {
    const response = await api.put(`/sessions/${sessionId}`, sessionData);
    return response.data;
  },

  // Update session status (start/end/cancel)
  updateSessionStatus: async (sessionId: string, status: 'scheduled' | 'live' | 'ended') => {
    const response = await api.put(`/sessions/${sessionId}/status`, { status });
    return response.data;
  },

  // Start session
  startSession: async (sessionId: string) => {
    const response = await api.put(`/sessions/${sessionId}/start`);
    return response.data;
  },

  // End session
  endSession: async (sessionId: string) => {
    const response = await api.put(`/sessions/${sessionId}/end`);
    return response.data;
  },

  // Delete session
  deleteSession: async (sessionId: string) => {
    const response = await api.delete(`/sessions/${sessionId}`);
    return response.data;
  },

  // Cancel session (using status endpoint)
  cancelSession: async (sessionId: string) => {
    const response = await api.put(`/sessions/${sessionId}/status`, { status: 'ended' });
    return response.data;
  },

  // Get user sessions
  getUserSessions: async (userId: string) => {
    const response = await api.get(`/users/${userId}/sessions`, { params: { limit: 100 } });
    return response.data;
  },
};

// Interactions API
export const interactionsAPI = {
  // Like/Unlike session
  toggleLike: async (sessionId: string) => {
    const response = await api.post(`/interactions/like/${sessionId}`);
    return response.data;
  },

  // Add comment
  addComment: async (sessionId: string, message: string, parent_id?: string) => {
    const response = await api.post(`/interactions/comment/${sessionId}`, {
      message,
      parent_id,
    });
    return response.data;
  },

  // Get comments
  getComments: async (sessionId: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get(`/interactions/comments/${sessionId}`, { params });
    return response.data;
  },

  // Delete comment
  deleteComment: async (commentId: string) => {
    const response = await api.delete(`/interactions/comments/${commentId}`);
    return response.data;
  },

  // Book/Unbook session
  toggleBooking: async (sessionId: string) => {
    const response = await api.post(`/interactions/book/${sessionId}`);
    return response.data;
  },

  // Get user's bookings
  getUserBookings: async () => {
    const response = await api.get('/interactions/bookings');
    return response.data;
  },
};

// Users API
export const usersAPI = {
  // Get all users
  getUsers: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Get user by ID
  getUser: async (userId: string) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Get user sessions
  getUserSessions: async (userId: string) => {
    const response = await api.get(`/users/${userId}/sessions`);
    return response.data;
  },

  // Follow user
  followUser: async (userId: string) => {
    const response = await api.post(`/users/${userId}/follow`);
    return response.data;
  },

  // Unfollow user
  unfollowUser: async (userId: string) => {
    const response = await api.delete(`/users/${userId}/follow`);
    return response.data;
  },

  // Check if following a user
  getFollowStatus: async (userId: string) => {
    const response = await api.get(`/users/${userId}/follow-status`);
    return response.data;
  },

  // Get user's followers
  getFollowers: async (userId: string, page = 1, limit = 20) => {
    const response = await api.get(`/users/${userId}/followers?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get user's following
  getFollowing: async (userId: string, page = 1, limit = 20) => {
    const response = await api.get(`/users/${userId}/following?page=${page}&limit=${limit}`);
    return response.data;
  },
};

// Notifications API
export const notificationsAPI = {
  // Get notifications
  getNotifications: async (params?: { page?: number; limit?: number; unread_only?: boolean }) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId: string) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },
};

// Search API
export const searchAPI = {
  // Search sessions and users
  search: async (query: string, type: 'all' | 'sessions' | 'users' = 'all') => {
    const response = await api.get('/search', { params: { q: query, type } });
    return response.data;
  },
};

// Analytics API
export const analyticsAPI = {
  // Get analytics
  getAnalytics: async () => {
    const response = await api.get('/analytics');
    return response.data;
  },

  // Get user analytics
  getUserAnalytics: async (userId: string) => {
    const response = await api.get(`/analytics/user/${userId}`);
    return response.data;
  },
};

// Stats API
export const statsAPI = {
  // Get global stats
  getStats: async () => {
    const response = await api.get('/stats');
    return response.data;
  },
};

// Upload API
export const uploadAPI = {
  // Upload session poster
  uploadSessionPoster: async (sessionId: string, file: any) => {
    const formData = new FormData();
    formData.append('poster', file);
    
    const response = await api.post(`/upload/session-poster/${sessionId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload session video
  uploadSessionVideo: async (sessionId: string, file: any) => {
    const formData = new FormData();
    formData.append('video', file);
    
    const response = await api.post(`/upload/session-video/${sessionId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload user avatar
  uploadAvatar: async (formData: FormData) => {
    const response = await api.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 second timeout for uploads
    });
    return response.data;
  },

  // Delete session media
  deleteSessionMedia: async (sessionId: string, type: 'poster' | 'video') => {
    const response = await api.delete(`/upload/session-media/${sessionId}/${type}`);
    return response.data;
  },
};

// Utility functions
export const apiUtils = {
  // Save auth token
  saveAuthToken: async (token: string) => {
    await AsyncStorage.setItem('authToken', token);
  },

  // Get auth token
  getAuthToken: async () => {
    return await AsyncStorage.getItem('authToken');
  },

  // Remove auth token
  removeAuthToken: async () => {
    await AsyncStorage.removeItem('authToken');
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  },
};

export default api; 