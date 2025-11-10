import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    AppState,
    Dimensions,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { useSessions } from '../../contexts/SessionsContext';

const { width } = Dimensions.get('window');
const itemWidth = (width - 30) / 2;

const BASE_URL = 'http://192.168.81.194:5000'; // Use your backend's actual IP/port
function getFullUrl(path: string | undefined, fallback: string) {
  if (!path) return fallback;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}

// Professional categories for explore content
const categories = [
  { id: 'all', name: 'All', icon: 'grid', color: Colors.starC.primary },
  { id: 'trending', name: 'Trending', icon: 'trending-up', color: Colors.starC.primary },
  { id: 'live', name: 'Live Now', icon: 'radio', color: '#FF4444' },
  { id: 'scheduled', name: 'Scheduled', icon: 'calendar', color: Colors.starC.primary },
  { id: 'music', name: 'Music', icon: 'musical-notes', color: '#FF6B35' },
  { id: 'dance', name: 'Dance', icon: 'body', color: '#FF8E53' },
  { id: 'comedy', name: 'Comedy', icon: 'happy', color: '#FFD93D' },
  { id: 'education', name: 'Education', icon: 'school', color: '#4ECDC4' },
];

const CategoryItem = ({ item, isSelected, onPress }: any) => (
  <TouchableOpacity 
    style={[styles.categoryItem, isSelected && styles.selectedCategory]} 
    onPress={() => onPress(item)}
  >
    <View style={[styles.categoryIcon, isSelected && styles.selectedCategoryIcon]}>
      <Ionicons 
        name={item.icon as any} 
        size={20} 
        color={isSelected ? Colors.starC.background : item.color} 
      />
    </View>
    <Text style={[styles.categoryText, isSelected && styles.selectedCategoryText]}>
      {item.name}
    </Text>
  </TouchableOpacity>
);

const PostItem = ({ item, onPress, onLike, onComment, onBook }: any) => {
  const imageUrl = getFullUrl(item.poster_url, '') || getFullUrl(item.preview_video_url, '') || 'https://via.placeholder.com/200x200/111111/FFD700?text=Post';
  
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
          <Ionicons name="time" size={12} color={Colors.starC.background} />
          <Text style={styles.scheduledText}>Scheduled</Text>
        </View>
      )}
      <View style={styles.postOverlay}>
        <View style={styles.postStats}>
          <TouchableOpacity style={styles.statButton} onPress={handleLikePress}>
            <Ionicons 
              name={item.is_liked ? "star" : "star-outline"} 
              size={14} 
              color={item.is_liked ? Colors.starC.primary : Colors.starC.text} 
            />
            <Text style={styles.postLikes}>{item.likes_count || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statButton} onPress={handleCommentPress}>
            <Ionicons name="chatbubble-outline" size={14} color={Colors.starC.text} />
            <Text style={styles.postLikes}>{item.comments_count || 0}</Text>
          </TouchableOpacity>
          {(item.status === 'scheduled' || item.start_time) && (
            <TouchableOpacity style={styles.statButton} onPress={handleBookPress}>
              <Ionicons 
                name={item.is_booked ? "calendar" : "calendar-outline"} 
                size={14} 
                color={item.is_booked ? Colors.starC.primary : Colors.starC.text} 
              />
              <Text style={styles.postLikes}>{item.bookings_count || 0}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.postInfo}>
          <Text style={styles.postTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.postCaption} numberOfLines={1}>{item.caption}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const PostPopup = ({ visible, post, onClose, onLike, onComment, onBook, onJoinLive }: any) => {
  const { toggleLike, toggleBooking } = useSessions();
  const [isLiked, setIsLiked] = useState(post?.is_liked || false);
  const [likes, setLikes] = useState(post?.likes_count || 0);
  const [comment, setComment] = useState('');
  const [booked, setBooked] = useState(post?.is_booked || false);
  const [isLoading, setIsLoading] = useState(false);

  if (!visible || !post) return null;

  const handleLike = async () => {
    try {
      setIsLoading(true);
      await toggleLike(post.id);
      setIsLiked(!isLiked);
      setLikes(isLiked ? likes - 1 : likes + 1);
      onLike && onLike(post.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to like session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBook = async () => {
    try {
      setIsLoading(true);
      await toggleBooking(post.id);
      setBooked(!booked);
      Alert.alert(
        booked ? 'Unbooked' : 'Booked!', 
        booked ? 'Session removed from your bookings' : 'You have successfully booked this session.'
      );
      onBook && onBook(post.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to book session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinLive = () => {
    onJoinLive && onJoinLive(post.id);
  };

  return (
    <View style={styles.popupOverlay}>
      <View style={styles.popupContainer}>
        <TouchableOpacity style={styles.popupClose} onPress={onClose}>
          <Ionicons name="close" size={28} color={Colors.starC.text} />
        </TouchableOpacity>
        
        <Image 
          source={{ 
            uri: getFullUrl(post.poster_url, '') || getFullUrl(post.preview_video_url, '') || 'https://via.placeholder.com/300x400/111111/FFD700?text=Post' 
          }} 
          style={styles.popupImage} 
        />
        
        <View style={styles.popupContent}>
          <View style={styles.popupHeader}>
            <View style={styles.popupUserInfo}>
              <Image 
                source={{ 
                  uri: post.user?.profile_pic || 'https://via.placeholder.com/40/FFD700/000000?text=U' 
                }} 
                style={styles.popupUserAvatar} 
              />
              <View style={styles.popupUserDetails}>
                <Text style={styles.popupUsername}>@{post.user?.username}</Text>
                <Text style={styles.popupUserStatus}>{post.status === 'live' ? 'Live Now' : post.status}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.followButton}>
              <Text style={styles.followText}>Follow</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.popupInfo}>
            <Text style={styles.popupTitle}>{post.title}</Text>
            <Text style={styles.popupDescription}>{post.caption || post.description || ''}</Text>
          </View>

          <View style={styles.popupActions}>
            <TouchableOpacity 
              style={styles.popupActionButton} 
              onPress={handleLike}
              disabled={isLoading}
            >
              <Ionicons 
                name={isLiked ? 'star' : 'star-outline'} 
                size={28} 
                color={isLiked ? Colors.starC.primary : Colors.starC.text} 
              />
              <Text style={styles.popupActionText}>{likes}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.popupActionButton} onPress={() => onComment(post.id)}>
              <Ionicons name="chatbubble-outline" size={28} color={Colors.starC.text} />
              <Text style={styles.popupActionText}>{post.comments_count || 0}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.popupActionButton} 
              onPress={handleBook}
              disabled={isLoading}
            >
              <Ionicons name="calendar" size={28} color={booked ? Colors.starC.primary : Colors.starC.text} />
              <Text style={styles.popupActionText}>{booked ? 'Booked' : 'Book'}</Text>
            </TouchableOpacity>
            
            {post.status === 'live' && (
              <TouchableOpacity style={styles.popupActionButton} onPress={handleJoinLive}>
                <Ionicons name="radio" size={28} color={Colors.starC.primary} />
                <Text style={styles.popupActionText}>Join Live</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

export default function ExploreScreen() {
  const router = useRouter();
  const { sessions, isLoading, error, getSessions, getLiveSessions, getScheduledSessions, toggleLike, addComment, toggleBooking, searchSessions } = useSessions();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [popupPost, setPopupPost] = useState(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filteredSessions, setFilteredSessions] = useState<any[]>([]);
  const [localSessions, setLocalSessions] = useState<any[]>([]);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);

  // Sync local sessions with context sessions
  useEffect(() => {
    setLocalSessions(sessions);
    setFilteredSessions(sessions);
  }, [sessions]);

  // Filter sessions based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSessions(localSessions);
    } else {
      const filtered = localSessions.filter(session => 
        session.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.genre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSessions(filtered);
    }
  }, [searchQuery, localSessions]);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [selectedCategory]);

  // App state management for real-time updates
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        console.log('📱 Explore app became active - enabling real-time updates');
        setIsRealTimeEnabled(true);
        // Refresh immediately when app becomes active
        loadSessions();
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('📱 Explore app went to background - pausing real-time updates');
        setIsRealTimeEnabled(false);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Real-time updates for explore page - refresh every 20 seconds
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const interval = setInterval(async () => {
      try {
        console.log('🔄 Explore real-time refresh triggered');
        await loadSessions();
      } catch (error) {
        console.log('⚠️ Explore real-time refresh failed:', error);
        // Don't show error for background updates
      }
    }, 20000); // Update every 20 seconds

    return () => clearInterval(interval);
  }, [isRealTimeEnabled, selectedCategory]);

  const loadSessions = async () => {
    try {
      switch (selectedCategory) {
        case 'live':
          await getLiveSessions();
          break;
        case 'scheduled':
          await getScheduledSessions();
          break;
        case 'trending':
          await getSessions({ sort: 'trending' });
          break;
        default:
          await getSessions();
          break;
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const handleCategoryPress = (category: any) => {
    setSelectedCategory(category.id);
    console.log('Selected category:', category.name);
  };

  const handlePostPress = (post: any) => {
    setPopupPost(post);
    setPopupVisible(true);
  };

  const handlePopupClose = () => {
    setPopupVisible(false);
    setPopupPost(null);
  };

  const handleLike = async (sessionId: string) => {
    try {
      console.log('🌟 Explore: Liking session:', sessionId);
      
      // Optimistic update - update UI immediately
      setLocalSessions(prev => prev.map(session => {
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
      console.error('❌ Explore: Failed to like session:', error);
      // Revert optimistic update by reloading sessions
      loadSessions();
    }
  };

  const handleCommentAction = async (sessionId: string) => {
    try {
      console.log('💬 Explore: Adding comment to session:', sessionId);
      
      // Optimistic update - increment comment count
      setLocalSessions(prev => prev.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            comments_count: (session.comments_count || 0) + 1
          };
        }
        return session;
      }));

      // Navigate to comments
      router.push('/post-details');
    } catch (error) {
      console.error('❌ Explore: Failed to handle comment:', error);
      // Revert optimistic update by reloading sessions
      loadSessions();
    }
  };

  const handleBooking = async (sessionId: string) => {
    try {
      console.log('📅 Explore: Toggling booking for session:', sessionId);
      
      // Optimistic update - update UI immediately
      setLocalSessions(prev => prev.map(session => {
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
      console.error('❌ Explore: Failed to toggle booking:', error);
      // Revert optimistic update by reloading sessions
      loadSessions();
    }
  };

  const handleComment = (sessionId: string) => {
    console.log('Comment on session:', sessionId);
    router.push('/post-details');
  };

  const handleBook = (sessionId: string) => {
    console.log('Booked session:', sessionId);
  };

  const handleJoinLive = (sessionId: string) => {
    console.log('Joining live session:', sessionId);
    router.push({ pathname: '/live-session', params: { sessionId } });
  };

  const handleGoLive = () => {
    console.log('🚀 Starting Go Live experience');
    router.push('/go-live');
  };

  const handleSearch = async (query: string) => {
    try {
      setSearchQuery(query);
      if (query.trim()) {
        console.log('🔍 Searching for:', query);
        // Use context search function for more comprehensive search
        await searchSessions(query);
      } else {
        // Reset to category-based loading when search is cleared
        await loadSessions();
      }
    } catch (error) {
      console.error('❌ Search failed:', error);
      Alert.alert('Search Error', 'Failed to search sessions. Please try again.');
    }
  };

  const handleSearchSubmit = () => {
    handleSearch(searchQuery);
    setShowSearch(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearch(false);
    loadSessions(); // Reload category-based content
  };

  const renderCategory = ({ item }: any) => (
    <CategoryItem 
      key={item.id}
      item={item} 
      isSelected={selectedCategory === item.id}
      onPress={handleCategoryPress} 
    />
  );

  const renderPost = ({ item }: any) => (
    <PostItem 
      item={item} 
      onPress={handlePostPress}
      onLike={handleLike}
      onComment={handleCommentAction}
      onBook={handleBooking}
    />
  );

  if (isLoading && sessions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.starC.primary} />
          <Text style={styles.loadingText}>Discovering amazing content...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={Colors.starC.error} />
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadSessions}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Professional Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Explore</Text>
          <Text style={styles.headerSubtitle}>Discover amazing content</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.goLiveHeaderButton} onPress={handleGoLive}>
            <Ionicons name="radio" size={20} color={Colors.starC.background} />
            <Text style={styles.goLiveHeaderText}>Go Live</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.searchButton} 
            onPress={() => setShowSearch(true)}
          >
            <Ionicons name="search" size={24} color={Colors.starC.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Modal */}
      {showSearch && (
        <View style={styles.searchModal}>
          <View style={styles.searchHeader}>
            <TouchableOpacity onPress={() => setShowSearch(false)}>
              <Ionicons name="arrow-back" size={24} color={Colors.starC.text} />
            </TouchableOpacity>
            <TextInput
              style={styles.searchInput}
              placeholder="Search sessions, users, genres..."
              placeholderTextColor={Colors.starC.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <Ionicons name="close" size={24} color={Colors.starC.textSecondary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleSearchSubmit}>
              <Ionicons name="search" size={24} color={Colors.starC.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.searchResults}>
            <Text style={styles.searchSectionTitle}>Popular Searches</Text>
            <View style={styles.trendingItems}>
              <TouchableOpacity 
                style={styles.trendingItem}
                onPress={() => {
                  setSearchQuery('live');
                  handleSearch('live');
                  setShowSearch(false);
                }}
              >
                <Text style={styles.trendingText}>#Live</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.trendingItem}
                onPress={() => {
                  setSearchQuery('music');
                  handleSearch('music');
                  setShowSearch(false);
                }}
              >
                <Text style={styles.trendingText}>#Music</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.trendingItem}
                onPress={() => {
                  setSearchQuery('dance');
                  handleSearch('dance');
                  setShowSearch(false);
                }}
              >
                <Text style={styles.trendingText}>#Dance</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.trendingItem}
                onPress={() => {
                  setSearchQuery('education');
                  handleSearch('education');
                  setShowSearch(false);
                }}
              >
                <Text style={styles.trendingText}>#Education</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Categories Section */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <CategoryItem 
              key={category.id}
              item={category} 
              isSelected={selectedCategory === category.id}
              onPress={handleCategoryPress} 
            />
          ))}
        </ScrollView>
      </View>

      {/* Content Section */}
      <View style={styles.contentSection}>
        <View style={styles.contentHeader}>
          <Text style={styles.contentTitle}>
            {searchQuery ? `Search: "${searchQuery}"` :
             selectedCategory === 'all' ? 'All Content' : 
             selectedCategory === 'trending' ? 'Trending Now' :
             selectedCategory === 'live' ? 'Live Sessions' :
             selectedCategory === 'scheduled' ? 'Upcoming Sessions' :
             `${categories.find(c => c.id === selectedCategory)?.name} Content`}
          </Text>
          <Text style={styles.contentCount}>
            {searchQuery ? filteredSessions.length : localSessions.length} sessions
          </Text>
        </View>

        {/* Empty State */}
        {(searchQuery ? filteredSessions.length === 0 : localSessions.length === 0) && !isLoading && !error && (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={80} color={Colors.starC.textSecondary} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No Search Results' : 'No Content Found'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? `No sessions found for "${searchQuery}". Try different keywords!`
                : 'Try a different category or check back later for new amazing content!'
              }
            </Text>
            {searchQuery && (
              <TouchableOpacity style={styles.clearSearchButton} onPress={clearSearch}>
                <Text style={styles.clearSearchText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Posts Grid */}
        {(searchQuery ? filteredSessions.length > 0 : localSessions.length > 0) && (
          <FlatList
            data={searchQuery ? filteredSessions : localSessions}
            renderItem={renderPost}
            keyExtractor={(item) => item.id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.postsGrid}
            onRefresh={searchQuery ? () => handleSearch(searchQuery) : loadSessions}
            refreshing={isLoading}
            columnWrapperStyle={styles.postRow}
          />
        )}
      </View>

      {/* Post Popup */}
      <PostPopup
        visible={popupVisible}
        post={popupPost}
        onClose={handlePopupClose}
        onLike={handleLike}
        onComment={handleComment}
        onBook={handleBook}
        onJoinLive={handleJoinLive}
      />
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.starC.surface,
  },
  headerContent: {
    flex: 1,
    marginRight: 15,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  goLiveHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.starC.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  goLiveHeaderText: {
    color: Colors.starC.background,
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.starC.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.starC.textSecondary,
    marginTop: 4,
  },
  searchButton: {
    padding: 12,
    backgroundColor: Colors.starC.surface,
    borderRadius: 12,
  },
  categoriesSection: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: Colors.starC.background,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.starC.text,
    marginBottom: 15,
  },
  categoriesContainer: {
    paddingHorizontal: 5,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 15,
    minWidth: 80,
    paddingVertical: 8,
  },
  selectedCategory: {
    backgroundColor: Colors.starC.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedCategoryIcon: {
    backgroundColor: Colors.starC.background,
    borderRadius: 8,
    padding: 4,
  },
  selectedCategoryText: {
    color: Colors.starC.background,
    fontWeight: 'bold',
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.starC.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.starC.textSecondary,
    textAlign: 'center',
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  contentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.starC.text,
  },
  contentCount: {
    fontSize: 14,
    color: Colors.starC.textSecondary,
    backgroundColor: Colors.starC.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  postsGrid: {
    paddingBottom: 20,
  },
  postRow: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  postItem: {
    width: itemWidth,
    height: itemWidth * 1.3,
    marginRight: 10,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.starC.surface,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  postImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
    fontSize: 10,
    fontWeight: 'bold',
  },
  scheduledBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.starC.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduledText: {
    color: Colors.starC.background,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  postOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
  postLikes: {
    color: Colors.starC.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  postInfo: {
    marginTop: 5,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.starC.text,
    marginBottom: 2,
  },
  postCaption: {
    fontSize: 12,
    color: Colors.starC.textSecondary,
  },
  popupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  popupContainer: {
    backgroundColor: Colors.starC.background,
    borderRadius: 20,
    width: '90%',
    maxHeight: '85%',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  popupClose: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  popupImage: {
    width: '100%',
    height: 300,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  popupContent: {
    padding: 20,
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  popupUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  popupUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  popupUserDetails: {
    flex: 1,
  },
  popupUsername: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.starC.text,
  },
  popupUserStatus: {
    fontSize: 12,
    color: Colors.starC.textSecondary,
  },
  followButton: {
    backgroundColor: Colors.starC.primary,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  followText: {
    color: Colors.starC.background,
    fontSize: 14,
    fontWeight: 'bold',
  },
  popupInfo: {
    marginBottom: 15,
  },
  popupTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.starC.text,
    marginBottom: 5,
  },
  popupDescription: {
    fontSize: 14,
    color: Colors.starC.text,
    lineHeight: 22,
  },
  popupActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: Colors.starC.surface,
    paddingTop: 15,
  },
  popupActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '25%',
    paddingVertical: 8,
  },
  popupActionText: {
    color: Colors.starC.text,
    fontSize: 12,
    marginTop: 5,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.starC.background,
  },
  loadingText: {
    marginTop: 15,
    color: Colors.starC.textSecondary,
    fontSize: 16,
    fontWeight: '500',
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
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 15,
  },
  retryButton: {
    backgroundColor: Colors.starC.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  retryButtonText: {
    color: Colors.starC.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.starC.background,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.starC.text,
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.starC.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 24,
  },
  searchModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.starC.background,
    zIndex: 1000,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.starC.surface,
    gap: 15,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.starC.surface,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.starC.text,
    marginHorizontal: 10,
  },
  searchResults: {
    flex: 1,
    padding: 20,
  },
  searchSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.starC.text,
    marginBottom: 15,
  },
  trendingItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  trendingItem: {
    backgroundColor: Colors.starC.surface,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.starC.primary,
  },
  trendingText: {
    color: Colors.starC.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  clearSearchButton: {
    backgroundColor: Colors.starC.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  clearSearchText: {
    color: Colors.starC.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
