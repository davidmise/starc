import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

interface FollowContextType {
  followStatuses: { [userId: string]: boolean };
  followerCounts: { [userId: string]: number };
  followingCounts: { [userId: string]: number };
  updateFollowStatus: (userId: string, isFollowing: boolean, followerCount?: number, followingCount?: number) => void;
  updateUserStats: (userId: string, followerCount: number, followingCount: number) => void;
  getFollowStatus: (userId: string) => boolean;
  getFollowerCount: (userId: string) => number;
  getFollowingCount: (userId: string) => number;
}

const FollowContext = createContext<FollowContextType | undefined>(undefined);

export const useFollow = () => {
  const context = useContext(FollowContext);
  if (!context) {
    throw new Error('useFollow must be used within a FollowProvider');
  }
  return context;
};

interface FollowProviderProps {
  children: ReactNode;
}

export const FollowProvider: React.FC<FollowProviderProps> = ({ children }) => {
  const [followStatuses, setFollowStatuses] = useState<{ [userId: string]: boolean }>({});
  const [followerCounts, setFollowerCounts] = useState<{ [userId: string]: number }>({});
  const [followingCounts, setFollowingCounts] = useState<{ [userId: string]: number }>({});

  const updateFollowStatus = useCallback((
    userId: string, 
    isFollowing: boolean, 
    followerCount?: number, 
    followingCount?: number
  ) => {
    console.log('🔄 Updating follow status:', { userId, isFollowing, followerCount, followingCount });
    
    setFollowStatuses(prev => ({
      ...prev,
      [userId]: isFollowing
    }));

    if (followerCount !== undefined) {
      setFollowerCounts(prev => ({
        ...prev,
        [userId]: followerCount
      }));
    }

    if (followingCount !== undefined) {
      setFollowingCounts(prev => ({
        ...prev,
        [userId]: followingCount
      }));
    }
  }, []);

  const updateUserStats = useCallback((userId: string, followerCount: number, followingCount: number) => {
    console.log('📊 Updating user stats:', { userId, followerCount, followingCount });
    
    setFollowerCounts(prev => ({
      ...prev,
      [userId]: followerCount
    }));

    setFollowingCounts(prev => ({
      ...prev,
      [userId]: followingCount
    }));
  }, []);

  const getFollowStatus = useCallback((userId: string): boolean => {
    return followStatuses[userId] || false;
  }, [followStatuses]);

  const getFollowerCount = useCallback((userId: string): number => {
    return followerCounts[userId] || 0;
  }, [followerCounts]);

  const getFollowingCount = useCallback((userId: string): number => {
    return followingCounts[userId] || 0;
  }, [followingCounts]);

  const value = useMemo(() => ({
    followStatuses,
    followerCounts,
    followingCounts,
    updateFollowStatus,
    updateUserStats,
    getFollowStatus,
    getFollowerCount,
    getFollowingCount,
  }), [
    followStatuses,
    followerCounts,
    followingCounts,
    updateFollowStatus,
    updateUserStats,
    getFollowStatus,
    getFollowerCount,
    getFollowingCount,
  ]);

  return (
    <FollowContext.Provider value={value}>
      {children}
    </FollowContext.Provider>
  );
};

export default FollowContext;
