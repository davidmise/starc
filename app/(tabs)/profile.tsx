import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    AppState,
    Dimensions,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { useFollow } from '../../contexts/FollowContext';
import { useSessions } from '../../contexts/SessionsContext';

const { width } = Dimensions.get('window');
const itemWidth = (width - 40) / 3;

const BASE_URL = 'http://192.168.81.194:5000'; // Use your backend's actual IP/port
function getFullUrl(path: string | undefined, fallback: string) {
  if (!path) return fallback;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}

const StatItem = ({ label, value, icon }: any) => (
  <View style={styles.statItem}>
    <Ionicons name={icon} size={20} color={Colors.starC.primary} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const PostItem = ({ item, onPress, onLike, onComment, onBook }: any) => {
  const imageUrl = getFullUrl(item.poster_url, '') || getFullUrl(item.preview_video_url, '') || 'https://via.placeholder.com/200x200/111111/FFD700?text=Post';
  console.log('🖼️ Profile PostItem Image URL:', {
    poster_url: item.poster_url,
    preview_video_url: item.preview_video_url,
    resolved_url: imageUrl,
    title: item.title
  });

  const handleLikePress = (e: any) => {
    e.stopPropagation(); // Prevent opening the post
    onLike && onLike(item.id);
  };

  const handleCommentPress = (e: any) => {
    e.stopPropagation(); // Prevent opening the post
    onComment && onComment(item.id);
  };

  const handleBookPress = (e: any) => {
    e.stopPropagation(); // Prevent opening the post
    onBook && onBook(item.id);
  };
  
  return (
    <TouchableOpacity style={styles.postItem} onPress={() => onPress(item)}>
      <Image 
        source={{ uri: imageUrl }} 
        style={styles.postImage} 
      />
      {item.status === 'live' && (
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}
      {item.status === 'scheduled' && (
        <View style={styles.scheduledBadge}>
          <Ionicons name="time" size={12} color={Colors.starC.primary} />
          <Text style={styles.scheduledText}>Scheduled</Text>
        </View>
      )}
      <View style={styles.postOverlay}>
        <View style={styles.postStats}>
          <TouchableOpacity style={styles.statButton} onPress={handleLikePress}>
            <Ionicons 
              name={item.is_liked ? "heart" : "heart-outline"} 
              size={12} 
              color={item.is_liked ? Colors.starC.primary : Colors.starC.text} 
            />
            <Text style={styles.postLikes}>{item.likes_count || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statButton} onPress={handleCommentPress}>
            <Ionicons name="chatbubble-outline" size={12} color={Colors.starC.text} />
            <Text style={styles.postLikes}>{item.comments_count || 0}</Text>
          </TouchableOpacity>
          {(item.status === 'scheduled' || item.start_time) && (
            <TouchableOpacity style={styles.statButton} onPress={handleBookPress}>
              <Ionicons 
                name={item.is_booked ? "calendar" : "calendar-outline"} 
                size={12} 
                color={item.is_booked ? Colors.starC.primary : Colors.starC.text} 
              />
              <Text style={styles.postLikes}>{item.bookings_count || 0}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { getUserSessions, toggleLike, addComment, toggleBooking } = useSessions();
  const { getFollowerCount, getFollowingCount, updateUserStats } = useFollow();
  const [activeTab, setActiveTab] = useState('posts');
  const [showSettings, setShowSettings] = useState(false);
  const [popupPost, setPopupPost] = useState<any>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [userSessions, setUserSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // pull-to-refresh state (not used on web, kept for mobile)
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const isFetchingRef = useRef(false);
  const prevSessionsRef = useRef<any[]>([]);

  // NOTE: onRefresh removed to avoid unused variable warnings; use manual refresh via UI

  // Load user sessions helper (stable across renders)
  const loadUserSessions = useCallback(async () => {
    if (isFetchingRef.current) return;
    if (!user?.id) {
      console.log('⚠️ No user ID available, skipping session load');
      setUserSessions([]);
      return;
    }

    try {
      isFetchingRef.current = true;
      setIsLoadingSessions(true);
      setError(null);

      console.log('👤 Loading user sessions for:', user?.username, 'User ID:', user?.id);

      const response = await getUserSessions(user.id);
      const newSessions = response?.sessions || (Array.isArray(response) ? response : []);

      // Lightweight comparison: check length and first id
      const prev = prevSessionsRef.current || [];
      const changed = newSessions.length !== prev.length || (newSessions[0]?.id !== prev[0]?.id);

      if (changed) {
        console.log(`✅ Loaded ${newSessions.length} user sessions (changed)`);
        prevSessionsRef.current = newSessions;
        setUserSessions(newSessions);
      } else {
        console.log('⚠️ No change in user sessions');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load user sessions';
      setError(errorMessage);
      console.error('❌ Failed to load user sessions:', error);
    } finally {
      isFetchingRef.current = false;
      setIsLoadingSessions(false);
    }
  }, [user?.id, user?.username, getUserSessions]);

  // Load user sessions on mount
  useEffect(() => {
    console.log('👤 Profile: User state changed:', {
      userId: user?.id,
      isAuthenticated: !!user?.id
    });
    
    if (!user?.id) {
      setUserSessions([]);
      return;
    }
    // initial load
    loadUserSessions();
  }, [user?.id, loadUserSessions]);

  // App state management for real-time updates
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        console.log('📱 Profile app became active - enabling real-time updates');
        setIsRealTimeEnabled(true);
        // Refresh immediately when app becomes active
        if (user?.id) {
          loadUserSessions();
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('📱 Profile app went to background - pausing real-time updates');
        setIsRealTimeEnabled(false);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [user?.id, loadUserSessions]);

  // Real-time updates for profile page - refresh every 15 seconds
  useEffect(() => {
    if (!isRealTimeEnabled || !user?.id) return;

    // Use a ref to avoid recreating interval when userSessions changes
    const interval = setInterval(() => {
      // fire-and-forget background refresh using the stable callback
      loadUserSessions().catch(err => console.log('⚠️ Profile real-time refresh failed:', err));
    }, 30000); // Update every 30 seconds to reduce load

    return () => clearInterval(interval);
  }, [isRealTimeEnabled, user?.id, loadUserSessions]);

  // Initialize user stats when user data loads - use ref to prevent infinite loops
  const lastUserStatsRef = useRef<{userId?: string, followers?: number, following?: number}>({});
  
  useEffect(() => {
    if (user?.id && user?.followers_count !== undefined && user?.following_count !== undefined) {
      const lastStats = lastUserStatsRef.current;
      
      // Only update if values have actually changed
      if (lastStats.userId !== user.id || 
          lastStats.followers !== user.followers_count || 
          lastStats.following !== user.following_count) {
        
        console.log('🔄 Initializing user stats for profile:', {
          userId: user.id,
          followers: user.followers_count,
          following: user.following_count
        });
        
        updateUserStats(user.id, user.followers_count, user.following_count);
        
        // Update ref to track current values
        lastUserStatsRef.current = {
          userId: user.id,
          followers: user.followers_count,
          following: user.following_count
        };
      }
    }
  }, [user?.id, user?.followers_count, user?.following_count, updateUserStats]);



  const handlePostPress = (post: any) => {
    setPopupPost(post);
    setPopupVisible(true);
  };

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  // Interaction handlers with optimistic updates
  const handleLike = async (sessionId: string) => {
    try {
      console.log('👤 Profile: Liking session:', sessionId);
      
      // Optimistic update - update UI immediately
      setUserSessions(prev => prev.map(session => {
        if (session.id === sessionId) {
          const newLiked = !session.is_liked;
          const newCount = newLiked 
            ? (session.likes_count || 0) + 1 
            : Math.max(0, (session.likes_count || 0) - 1);
          return {
            ...session,
            is_liked: newLiked,
            likes_count: newCount
          };
        }
        return session;
      }));

      // Then call the API
      await toggleLike(sessionId);
    } catch (error) {
      console.error('❌ Profile: Failed to like session:', error);
      // Revert optimistic update by reloading sessions
      loadUserSessions();
    }
  };

  const handleCommentAction = async (sessionId: string, message: string) => {
    try {
      console.log('👤 Profile: Adding comment to session:', sessionId);
      
      // Optimistic update - increment comment count
      setUserSessions(prev => prev.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            comments_count: (session.comments_count || 0) + 1
          };
        }
        return session;
      }));

      // Then call the API
      await addComment(sessionId, message);
    } catch (error) {
      console.error('❌ Profile: Failed to add comment:', error);
      // Revert optimistic update by reloading sessions
      loadUserSessions();
    }
  };

  const handleBooking = async (sessionId: string) => {
    try {
      console.log('👤 Profile: Toggling booking for session:', sessionId);
      
      // Optimistic update - update UI immediately
      setUserSessions(prev => prev.map(session => {
        if (session.id === sessionId) {
          const newBooked = !session.is_booked;
          const newCount = newBooked 
            ? (session.bookings_count || 0) + 1 
            : Math.max(0, (session.bookings_count || 0) - 1);
          return {
            ...session,
            is_booked: newBooked,
            bookings_count: newCount
          };
        }
        return session;
      }));

      // Then call the API
      await toggleBooking(sessionId);
    } catch (error) {
      console.error('❌ Profile: Failed to toggle booking:', error);
      // Revert optimistic update by reloading sessions
      loadUserSessions();
    }
  };

  // Only load sessions when user changes, no auth refresh loops

  const handleSettings = () => {
    setShowSettings(true);
  };

  const handleLogout = async () => {
    try {
      setShowSettings(false);
      await logout();
      console.log('✅ Logout successful, navigating to auth');
      router.replace('/auth');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const renderPost = ({ item }: any) => (
    <PostItem 
      item={item} 
      onPress={handlePostPress}
      onLike={handleLike}
      onComment={handleCommentAction}
      onBook={handleBooking}
    />
  );

  // Filter sessions based on active tab
  const getFilteredSessions = () => {
    switch (activeTab) {
      case 'posts':
        return userSessions.filter(session => session.status === 'ended');
      case 'live':
        return userSessions.filter(session => session.status === 'live');
      case 'scheduled':
        return userSessions.filter(session => session.status === 'scheduled');
      default:
        return userSessions;
    }
  };

  const filteredSessions = getFilteredSessions();
  console.log('👤 Profile Screen filteredSessions:', filteredSessions);

  if (isLoadingSessions) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.starC.primary} />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={Colors.starC.error} />
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadUserSessions}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
            <Ionicons name="settings-outline" size={24} color={Colors.starC.text} />
          </TouchableOpacity>
        </View>

        {/* Settings Modal */}
        <Modal visible={showSettings} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: Colors.starC.background, borderRadius: 12, padding: 30, width: 250, alignItems: 'center' }}>
              <Text style={{ color: Colors.starC.text, fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>Settings</Text>
              <TouchableOpacity style={{ backgroundColor: Colors.starC.primary, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 30, marginBottom: 10 }} onPress={handleLogout}>
                <Text style={{ color: Colors.starC.background, fontWeight: 'bold', fontSize: 16 }}>Logout</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Text style={{ color: Colors.starC.textSecondary, fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Post Popup Modal */}
        <Modal visible={popupVisible} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: Colors.starC.background, borderRadius: 15, width: 320, maxWidth: '90%', alignItems: 'center', padding: 20 }}>
              <TouchableOpacity style={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }} onPress={() => setPopupVisible(false)}>
                <Ionicons name="close" size={28} color={Colors.starC.text} />
              </TouchableOpacity>
              {popupPost && (
                <Image 
                  source={{ 
                    uri: getFullUrl(popupPost.poster_url, '') || getFullUrl(popupPost.preview_video_url, '') || 'https://via.placeholder.com/260x260/111111/FFD700?text=Post' 
                  }} 
                  style={{ width: 260, height: 260, borderRadius: 12, marginBottom: 20 }} 
                />
              )}
              <Text style={{ color: Colors.starC.text, fontSize: 16, marginBottom: 10 }}>
                {popupPost?.title || popupPost?.caption || ''}
              </Text>
              <Text style={{ color: Colors.starC.textSecondary, fontSize: 14 }}>
                {popupPost?.likes_count || 0} likes • {popupPost?.comments_count || 0} comments
              </Text>
            </View>
          </View>
        </Modal>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <Image 
              source={{ 
                uri: getFullUrl(user?.profile_pic, 'https://via.placeholder.com/100/FFD700/000000?text=U')
              }} 
              style={styles.avatar} 
            />
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.displayName}>{user?.username}</Text>
                {user?.is_verified && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.starC.primary} style={styles.verifiedIcon} />
                )}
              </View>
              <Text style={styles.username}>@{user?.username}</Text>
              <Text style={styles.bio}>{user?.bio || 'No bio yet'}</Text>
              
              {/* Additional Profile Info */}
              <View style={styles.profileDetails}>
                {user?.is_active && (
                  <View style={styles.statusBadge}>
                    <Ionicons name="radio" size={12} color={Colors.starC.success} />
                    <Text style={styles.statusText}>Active</Text>
                  </View>
                )}
                {user?.last_login && (
                  <Text style={styles.lastLogin}>
                    Last login: {new Date(user.last_login).toLocaleDateString()}
                  </Text>
                )}
                {user?.created_at && (
                  <Text style={styles.memberSince}>
                    Member since: {new Date(user.created_at).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <StatItem 
            label="Followers" 
            value={user?.id ? getFollowerCount(user.id) || user?.followers_count || 0 : 0} 
            icon="people" 
          />
          <StatItem 
            label="Following" 
            value={user?.id ? getFollowingCount(user.id) || user?.following_count || 0 : 0} 
            icon="person-add" 
          />
          <StatItem 
            label="Sessions" 
            value={userSessions.length} 
            icon="radio" 
          />
          <StatItem 
            label="Live" 
            value={userSessions.filter(s => s.status === 'live').length} 
            icon="radio" 
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabsSection}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]} 
            onPress={() => setActiveTab('posts')}
          >
            <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>Posts</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'live' && styles.activeTab]} 
            onPress={() => setActiveTab('live')}
          >
            <Text style={[styles.tabText, activeTab === 'live' && styles.activeTabText]}>Live</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'scheduled' && styles.activeTab]} 
            onPress={() => setActiveTab('scheduled')}
          >
            <Text style={[styles.tabText, activeTab === 'scheduled' && styles.activeTabText]}>Scheduled</Text>
          </TouchableOpacity>
        </View>

        {/* Posts Grid */}
        {filteredSessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={64} color={Colors.starC.textSecondary} />
            <Text style={styles.emptyTitle}>No {activeTab} yet</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'posts' && 'Your completed sessions will appear here'}
              {activeTab === 'live' && 'Your live sessions will appear here'}
              {activeTab === 'scheduled' && 'Your scheduled sessions will appear here'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredSessions}
            renderItem={renderPost}
            keyExtractor={(item) => item.id}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={styles.postsGrid}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.starC.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Colors.starC.background,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.starC.text,
  },
  settingsButton: {
    padding: 8,
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.starC.text,
  },
  verifiedIcon: {
    marginLeft: 5,
  },
  username: {
    fontSize: 16,
    color: Colors.starC.textSecondary,
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: Colors.starC.text,
    lineHeight: 20,
  },
  profileDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.starC.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    marginRight: 10,
    marginBottom: 5,
  },
  statusText: {
    color: Colors.starC.success,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  lastLogin: {
    fontSize: 12,
    color: Colors.starC.textSecondary,
    marginBottom: 5,
  },
  memberSince: {
    fontSize: 12,
    color: Colors.starC.textSecondary,
  },
  editButton: {
    backgroundColor: Colors.starC.surface,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: Colors.starC.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.starC.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.starC.surface,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.starC.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.starC.textSecondary,
    marginTop: 2,
  },
  additionalStats: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statText: {
    color: Colors.starC.textSecondary,
    fontSize: 14,
    marginLeft: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.starC.surface,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.starC.primary,
  },
  postsContainer: {
    paddingTop: 10,
  },
  postsGrid: {
    paddingHorizontal: 20,
  },
  postItem: {
    width: itemWidth,
    height: itemWidth,
    marginBottom: 2,
    marginRight: 2,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  liveBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: Colors.starC.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.starC.text,
    marginRight: 4,
  },
  liveText: {
    color: Colors.starC.text,
    fontSize: 8,
    fontWeight: 'bold',
  },
  scheduledBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: Colors.starC.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduledText: {
    color: Colors.starC.text,
    fontSize: 8,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  postOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    minWidth: 80,
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
  postLikes: {
    color: Colors.starC.text,
    fontSize: 10,
    marginLeft: 2,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.starC.background,
  },
  loadingText: {
    marginTop: 10,
    color: Colors.starC.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.starC.background,
    padding: 20,
  },
  errorText: {
    color: Colors.starC.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.starC.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.starC.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.starC.text,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.starC.textSecondary,
    textAlign: 'center',
    marginTop: 5,
  },
  tabsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.starC.surface,
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.starC.textSecondary,
  },
  activeTabText: {
    color: Colors.starC.primary,
  },
}); 