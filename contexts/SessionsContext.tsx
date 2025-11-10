import React, { createContext, useContext, useEffect, useState } from 'react';
import { interactionsAPI, sessionsAPI } from '../services/api';
import { useAuth } from './AuthContext';

interface Session {
  id: string;
  title: string;
  caption?: string;
  genre: string;
  start_time: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  poster_url?: string;
  preview_video_url?: string;
  created_at: string;
  user_id: string;
  type?: 'post' | 'event'; // Add type field for event detection
  user: {
    id: string;
    username: string;
    profile_pic?: string;
    is_following?: boolean; // Add follow status
  };
  likes_count?: number;
  comments_count?: number;
  bookings_count?: number;
  is_liked?: boolean;
  is_booked?: boolean;
  has_joined?: boolean;
  viewer_count?: number;
}

interface SessionsContextType {
  sessions: Session[];
  isLoading: boolean;
  error: string | null;
  isRealTimeEnabled: boolean;
  createSession: (sessionData: FormData) => Promise<Session>;
  getSessions: (params?: any) => Promise<void>;
  getSession: (sessionId: string) => Promise<Session>;
  getUserSessions: (userId: string) => Promise<any>;
  updateSession: (sessionId: string, sessionData: any) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  cancelSession: (sessionId: string) => Promise<void>;
  toggleLike: (sessionId: string) => Promise<void>;
  addComment: (sessionId: string, message: string) => Promise<void>;
  toggleBooking: (sessionId: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
  searchSessions: (query: string) => Promise<void>;
  getLiveSessions: () => Promise<void>;
  getScheduledSessions: () => Promise<void>;
  setRealTimeEnabled: (enabled: boolean) => void;
}

const SessionsContext = createContext<SessionsContextType | undefined>(undefined);

export const useSessions = () => {
  const context = useContext(SessionsContext);
  if (context === undefined) {
    throw new Error('useSessions must be used within a SessionsProvider');
  }
  return context;
};

export const SessionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false); // Disabled by default to prevent spam
  const { isAuthenticated } = useAuth();

  // Don't auto-load sessions on mount - let components explicitly request them
  // This prevents authentication loops and unnecessary requests

  // Real-time updates - only when enabled and authenticated
  useEffect(() => {
    if (!isRealTimeEnabled || !isAuthenticated) return;

    const interval = setInterval(async () => {
      try {
        // Use the same getSessions method that includes user interaction data
        await getSessions();
      } catch (error: any) {
        // Silently handle background refresh errors
      }
    }, 60000); // Update every 60 seconds

    return () => clearInterval(interval);
  }, [isRealTimeEnabled, isAuthenticated]);

  const createSession = async (sessionData: FormData): Promise<Session> => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🎬 Creating new session...');
      const response = await sessionsAPI.createSession(sessionData);
      console.log('✅ Session created:', response.session.title);
      setSessions(prev => [response.session, ...prev]);
      return response.session;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to create session';
      setError(errorMessage);
      console.error('❌ Failed to create session:', errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getSessions = async (params?: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await sessionsAPI.getSessions(params);
      setSessions(response.sessions || []);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch sessions';
      setError(errorMessage);
      console.error('❌ Failed to fetch sessions:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getSession = async (sessionId: string): Promise<Session> => {
    try {
      setError(null);
      console.log('📡 Fetching session details:', sessionId);
      const response = await sessionsAPI.getSession(sessionId);
      console.log('✅ Session details loaded:', response.session.title);
      return response.session;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch session';
      setError(errorMessage);
      console.error('❌ Failed to fetch session:', errorMessage);
      throw error;
    }
  };

  const getUserSessions = async (userId: string) => {
    try {
      setError(null);
      console.log('📡 Fetching user sessions:', userId);
      const response = await sessionsAPI.getUserSessions(userId);
      console.log(`✅ Loaded ${response.sessions?.length || 0} user sessions`);
      // Don't update the global sessions state, just return the user sessions
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch user sessions';
      setError(errorMessage);
      console.error('❌ Failed to fetch user sessions:', errorMessage);
      throw error;
    }
  };

  const updateSession = async (sessionId: string, sessionData: any) => {
    try {
      setError(null);
      console.log('📝 Updating session:', sessionId);
      await sessionsAPI.updateSession(sessionId, sessionData);
      console.log('✅ Session updated successfully');
      setSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, ...sessionData }
            : session
        )
      );
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update session';
      setError(errorMessage);
      console.error('❌ Failed to update session:', errorMessage);
      throw error;
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      setError(null);
      console.log('🗑️ Deleting session:', sessionId);
      await sessionsAPI.deleteSession(sessionId);
      console.log('✅ Session deleted successfully');
      setSessions(prev => prev.filter(session => session.id !== sessionId));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to delete session';
      setError(errorMessage);
      console.error('❌ Failed to delete session:', errorMessage);
      throw error;
    }
  };

  const cancelSession = async (sessionId: string) => {
    try {
      setError(null);
      console.log('❌ Cancelling session:', sessionId);
      await sessionsAPI.cancelSession(sessionId);
      console.log('✅ Session cancelled successfully');
      setSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, status: 'cancelled' as const }
            : session
        )
      );
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to cancel session';
      setError(errorMessage);
      console.error('❌ Failed to cancel session:', errorMessage);
      throw error;
    }
  };

  const toggleLike = async (sessionId: string) => {
    try {
      setError(null);
      console.log('❤️ Toggling like for session:', sessionId);
      const response = await interactionsAPI.toggleLike(sessionId);
      console.log('✅ Like toggled:', response.liked ? 'liked' : 'unliked');
      setSessions(prev => 
        prev.map(session => {
          if (session.id === sessionId) {
            const newLikesCount = response.liked 
              ? (session.likes_count || 0) + 1 
              : (session.likes_count || 0) - 1;
            return {
              ...session,
              is_liked: response.liked,
              likes_count: Math.max(0, newLikesCount)
            };
          }
          return session;
        })
      );
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to toggle like';
      setError(errorMessage);
      console.error('❌ Failed to toggle like:', errorMessage);
      throw error;
    }
  };

  const addComment = async (sessionId: string, message: string) => {
    try {
      setError(null);
      console.log('💬 Adding comment to session:', sessionId);
      await interactionsAPI.addComment(sessionId, message);
      console.log('✅ Comment added successfully');
      setSessions(prev => 
        prev.map(session => {
          if (session.id === sessionId) {
            return {
              ...session,
              comments_count: (session.comments_count || 0) + 1
            };
          }
          return session;
        })
      );
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to add comment';
      setError(errorMessage);
      console.error('❌ Failed to add comment:', errorMessage);
      throw error;
    }
  };

  const toggleBooking = async (sessionId: string) => {
    try {
      setError(null);
      console.log('📅 Toggling booking for session:', sessionId);
      const response = await interactionsAPI.toggleBooking(sessionId);
      console.log('✅ Booking toggled:', response.booked ? 'booked' : 'unbooked');
      setSessions(prev => 
        prev.map(session => {
          if (session.id === sessionId) {
            const newBookingsCount = response.booked 
              ? (session.bookings_count || 0) + 1 
              : (session.bookings_count || 0) - 1;
            return {
              ...session,
              is_booked: response.booked,
              bookings_count: Math.max(0, newBookingsCount)
            };
          }
          return session;
        })
      );
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to toggle booking';
      setError(errorMessage);
      console.error('❌ Failed to toggle booking:', errorMessage);
      throw error;
    }
  };

  const refreshSessions = async () => {
    console.log('🔄 Refreshing sessions...');
    await getSessions();
  };

  const searchSessions = async (query: string) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔍 Searching sessions:', query);
      const response = await sessionsAPI.getSessions({ search: query });
      console.log(`✅ Found ${response.sessions?.length || 0} matching sessions`);
      setSessions(response.sessions || []);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to search sessions';
      setError(errorMessage);
      console.error('❌ Failed to search sessions:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getLiveSessions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('📺 Fetching live sessions...');
      const response = await sessionsAPI.getSessions({ status: 'live' });
      console.log(`✅ Found ${response.sessions?.length || 0} live sessions`);
      setSessions(response.sessions || []);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch live sessions';
      setError(errorMessage);
      console.error('❌ Failed to fetch live sessions:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getScheduledSessions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('📅 Fetching scheduled sessions...');
      const response = await sessionsAPI.getSessions({ status: 'scheduled' });
      console.log(`✅ Found ${response.sessions?.length || 0} scheduled sessions`);
      setSessions(response.sessions || []);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch scheduled sessions';
      setError(errorMessage);
      console.error('❌ Failed to fetch scheduled sessions:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const setRealTimeEnabled = (enabled: boolean) => {
    console.log('🔄 Real-time updates:', enabled ? 'enabled' : 'disabled');
    setIsRealTimeEnabled(enabled);
  };

  const value = {
    sessions,
    isLoading,
    error,
    isRealTimeEnabled,
    createSession,
    getSessions,
    getSession,
    getUserSessions,
    updateSession,
    deleteSession,
    cancelSession,
    toggleLike,
    addComment,
    toggleBooking,
    refreshSessions,
    searchSessions,
    getLiveSessions,
    getScheduledSessions,
    setRealTimeEnabled,
  };

  return <SessionsContext.Provider value={value}>{children}</SessionsContext.Provider>;
}; 