import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    AppState,
    Dimensions,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Swiper from 'react-native-swiper';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { useFollow } from '../../contexts/FollowContext';
import { useSessions } from '../../contexts/SessionsContext';
import { interactionsAPI, sessionsAPI, usersAPI } from '../../services/api';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 80; // Approximate header height
const SAFE_AREA_TOP = 40; // Approximate safe area top
const CONTENT_HEIGHT = height - HEADER_HEIGHT - SAFE_AREA_TOP;

const BASE_URL = 'http://192.168.81.194:5000'; // Use your backend's actual IP/port
function getFullUrl(path: string | undefined, fallback: string) {
  if (!path) return fallback;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}

const VideoCard = ({ item, onLike, onComment, onShare, onSave, onBook, onJoinLive, onUserPress, onFollow }: any) => {
  const { toggleLike, toggleBooking, addComment } = useSessions();
  const { user } = useAuth();
  const { updateFollowStatus, getFollowStatus } = useFollow();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(item.is_liked || false);
  const [isSaved, setIsSaved] = useState(false);
  const [likes, setLikes] = useState(item.likes_count || 0);
  const [booked, setBooked] = useState(item.is_booked || false);
  const [bookings, setBookings] = useState(item.bookings_count || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  // Use global follow state with proper fallback to server data
  const [isFollowing, setIsFollowing] = useState(() => {
    if (item.user?.id) {
      // First check global state, then fallback to server data
      const globalStatus = getFollowStatus(item.user.id);
      return globalStatus !== false ? globalStatus : (item.user?.is_following || false);
    }
    return false;
  });
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(true); // Videos are muted by default
  const [isPlaying, setIsPlaying] = useState(false); // Videos are paused by default
  const [currentTime, setCurrentTime] = useState(new Date()); // For real-time countdown

  // Check if this is a normal post (not an event)
  const isNormalPost = item.type === 'post' || !item.start_time;
  const isEvent = item.type === 'event' || item.start_time;
  
  // Check if user is the owner of the event
  const isOwner = user?.id === item.user_id;

  // Fetch comments when modal opens
  useEffect(() => {
    if (showCommentModal) {
      fetchComments();
    }
  }, [showCommentModal]);

  // Real-time countdown timer for events
  useEffect(() => {
    if (isEvent && item.start_time && item.status === 'scheduled') {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isEvent, item.start_time, item.status]);

  // Auto-navigate booked users when event goes live
  useEffect(() => {
    if (isEvent && item.status === 'live' && booked && !isOwner) {
      // Show notification that event is live
      Alert.alert(
        '🔴 Event is Live!',
        `"${item.title}" has started! You have a front-row seat waiting for you.`,
        [
          { 
            text: 'Join Later', 
            style: 'cancel' 
          },
          { 
            text: '🚀 Join Now', 
            onPress: () => handleJoinLive(),
            style: 'default'
          }
        ]
      );
    }
  }, [item.status, booked]);

  // Check if it's time to go live (within 5 minutes of start time)
  const isReadyToGoLive = () => {
    if (!isEvent || !item.start_time || item.status !== 'scheduled') return false;
    const startTime = new Date(item.start_time);
    const diff = startTime.getTime() - currentTime.getTime();
    return diff <= 5 * 60 * 1000 && diff > -60 * 1000; // 5 minutes before to 1 minute after
  };

  // Notify booked users when it's almost time (5 minutes before)
  useEffect(() => {
    const readyToGoLive = isReadyToGoLive();
    if (isEvent && item.status === 'scheduled' && booked && !isOwner && readyToGoLive) {
      // Only show once when becoming ready
      const hasShownReadyNotification = sessionStorage?.getItem(`ready-notification-${item.id}`);
      if (!hasShownReadyNotification) {
        Alert.alert(
          '⏰ Event Starting Soon!',
          `"${item.title}" starts in a few minutes. The host can go live anytime now!`,
          [
            { text: 'Got it!', style: 'default' }
          ]
        );
        try {
          sessionStorage?.setItem(`ready-notification-${item.id}`, 'shown');
        } catch (e) {
          // sessionStorage might not be available, that's fine
        }
      }
    }
  }, [isEvent, item.status, booked, isOwner, currentTime, item.start_time, item.id, item.title]);

  // Auto-redirect when event goes live (for booked users and owner)
  useEffect(() => {
    if (isEvent && item.status === 'live') {
      // For booked users - auto redirect to live session
      if (booked && !isOwner) {
        const hasShownLiveNotification = sessionStorage?.getItem(`live-notification-${item.id}`);
        if (!hasShownLiveNotification) {
          Alert.alert(
            '🔴 Event is Live!',
            `"${item.title}" has started! Would you like to join now?`,
            [
              { text: 'Maybe Later', style: 'cancel' },
              { 
                text: '🚀 Join Live!', 
                style: 'default',
                onPress: () => router.push(`/live-session?id=${item.id}`)
              }
            ]
          );
          try {
            sessionStorage?.setItem(`live-notification-${item.id}`, 'shown');
          } catch (e) {
            // sessionStorage might not be available, that's fine
          }
        }
      }
      
      // For session owner - notify that their event is live
      if (isOwner) {
        const hasShownOwnerLiveNotification = sessionStorage?.getItem(`owner-live-notification-${item.id}`);
        if (!hasShownOwnerLiveNotification) {
          Alert.alert(
            '🎉 Your Event is Live!',
            `"${item.title}" is now live with ${bookings} booked participants!`,
            [
              { text: 'Continue', style: 'default' }
            ]
          );
          try {
            sessionStorage?.setItem(`owner-live-notification-${item.id}`, 'shown');
          } catch (e) {
            // sessionStorage might not be available, that's fine
          }
        }
      }
    }
  }, [isEvent, item.status, booked, isOwner, item.id, item.title, bookings, router]);

  // Owner notification before event starts (5 minutes before for owners)
  useEffect(() => {
    const readyToGoLive = isReadyToGoLive();
    if (isEvent && item.status === 'scheduled' && isOwner && readyToGoLive) {
      const hasShownOwnerReadyNotification = sessionStorage?.getItem(`owner-ready-notification-${item.id}`);
      if (!hasShownOwnerReadyNotification) {
        Alert.alert(
          '🎬 Ready to Go Live?',
          `Your event "${item.title}" is ready to start! ${bookings} users have booked this event.`,
          [
            { text: 'Not Yet', style: 'cancel' },
            { 
              text: '🔴 Go Live Now!', 
              style: 'default',
              onPress: () => handleGoLive()
            }
          ]
        );
        try {
          sessionStorage?.setItem(`owner-ready-notification-${item.id}`, 'shown');
        } catch (e) {
          // sessionStorage might not be available, that's fine
        }
      }
    }
  }, [isEvent, item.status, isOwner, currentTime, item.start_time, item.id, item.title, bookings]);

  // Sync follow status when item data changes
  useEffect(() => {
    if (item.user?.id) {
      const globalStatus = getFollowStatus(item.user.id);
      const serverStatus = item.user?.is_following || false;
      
      // Update local state if global state is different or use server data
      if (globalStatus !== false) {
        setIsFollowing(globalStatus);
      } else if (serverStatus !== isFollowing) {
        setIsFollowing(serverStatus);
        // Also update global state with server data
        updateFollowStatus(item.user.id, serverStatus);
      }
    }
  }, [item.user?.id, item.user?.is_following, getFollowStatus, updateFollowStatus]);

  // Sync booking status when item data changes
  useEffect(() => {
    if (item.is_booked !== undefined && item.is_booked !== booked) {
      setBooked(item.is_booked);
    }
    if (item.bookings_count !== undefined && item.bookings_count !== bookings) {
      setBookings(item.bookings_count);
    }
  }, [item.is_booked, item.bookings_count]);

  // Sync like status when item data changes
  useEffect(() => {
    if (item.is_liked !== undefined && item.is_liked !== isLiked) {
      setIsLiked(item.is_liked);
    }
    if (item.likes_count !== undefined && item.likes_count !== likes) {
      setLikes(item.likes_count);
    }
  }, [item.is_liked, item.likes_count]);

  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      console.log('🔍 Fetching comments for session:', item.id);
      const response = await interactionsAPI.getComments(item.id);
      console.log('✅ Raw comments from API:', response);
      console.log('📝 Comments array:', response.comments);
      console.log('📊 Comments count:', response.comments?.length || 0);
      
      if (response.comments && Array.isArray(response.comments)) {
        setComments(response.comments);
        console.log('💾 Comments set successfully');
      } else {
        console.log('⚠️ No comments or invalid format');
        setComments([]);
      }
    } catch (error) {
      console.error('❌ Error fetching comments:', error);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Build threaded comment tree (robust to missing/null parent_id)
  const buildCommentTree = (flatComments: any[]) => {
    const map: any = {};
    const roots: any[] = [];
    flatComments.forEach(c => { map[c.id] = { ...c, replies: [] }; });
    flatComments.forEach(c => {
      // Accept both null and undefined as top-level
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].replies.push(map[c.id]);
      } else {
        roots.push(map[c.id]);
      }
    });
    return roots;
  };

  const threadedComments = buildCommentTree(comments);
  console.log('Threaded comments:', threadedComments);
  console.log('Comments raw data:', comments);
  console.log('Comments count:', comments.length);

  const handleLike = async () => {
    // Store original state for potential rollback
    const originalLiked = isLiked;
    const originalLikes = likes;
    
    try {
      setIsLoading(true);
      // Optimistic update - update UI immediately
      const newLikedState = !isLiked;
      const newLikesCount = newLikedState ? likes + 1 : likes - 1;
      setIsLiked(newLikedState);
      setLikes(Math.max(0, newLikesCount));
      
      // Then call the API
      await toggleLike(item.id);
      onLike && onLike(item.id);
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(originalLiked);
      setLikes(originalLikes);
      Alert.alert('Error', 'Failed to like session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    onSave && onSave(item.id);
  };

  const handleBook = async () => {
    if (!isEvent) return; // Only allow booking for events
    
    // Store original state for potential rollback
    const originalBooked = booked;
    const originalBookings = bookings;
    
    try {
      setIsLoading(true);
      // Optimistic update - update UI immediately
      const newBookedState = !booked;
      const newBookingsCount = newBookedState ? bookings + 1 : bookings - 1;
      setBooked(newBookedState);
      setBookings(Math.max(0, newBookingsCount));
      
      // Then call the API
      await toggleBooking(item.id);
      Alert.alert(
        newBookedState ? 'Booked!' : 'Unbooked', 
        newBookedState ? 'You have successfully booked this event.' : 'Event removed from your bookings'
      );
      onBook && onBook(item.id);
    } catch (error) {
      // Revert optimistic update on error
      setBooked(originalBooked);
      setBookings(originalBookings);
      Alert.alert('Error', 'Failed to book event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinLive = () => {
    if (item.status === 'live' && isEvent) {
      onJoinLive && onJoinLive(item.id);
    } else {
      Alert.alert('Not Live', 'This event is not currently live.');
    }
  };

  const handleGoLive = async () => {
    try {
      setIsLoading(true);
      
      // First show confirmation dialog
      Alert.alert(
        'Start Live Stream?',
        `You're about to start the live event "${item.title}". All ${bookings} booked participants will be notified.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setIsLoading(false)
          },
          {
            text: '🔴 Go Live',
            style: 'default',
            onPress: async () => {
              try {
                // Update session status to live
                await sessionsAPI.updateSessionStatus(item.id, 'live');
                
                // Navigate to Go Live camera screen
                router.push('/go-live');
              } catch (error) {
                Alert.alert('Error', 'Failed to start live session');
              } finally {
                setIsLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to prepare live session');
      setIsLoading(false);
    }
  };

  const handleComment = () => {
    setShowCommentModal(true);
  };

  // Post comment or reply
  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    try {
      setIsSubmittingComment(true);
      await interactionsAPI.addComment(item.id, commentText.trim(), replyTo?.id);
      console.log('Posted comment:', { sessionId: item.id, message: commentText.trim(), parent_id: replyTo?.id });
      setCommentText('');
      setReplyTo(null);
      fetchComments();
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleFollow = async () => {
    if (!item.user?.id) return;
    
    // Store original state for potential rollback
    const originalFollowing = isFollowing;
    
    try {
      setIsLoading(true);
      // Optimistic update - update UI immediately
      setIsFollowing(!isFollowing);
      
      // Call the API
      let response;
      if (isFollowing) {
        response = await usersAPI.unfollowUser(item.user.id);
        console.log('🔻 Unfollowed user:', response);
      } else {
        response = await usersAPI.followUser(item.user.id);
        console.log('🔺 Followed user:', response);
      }
      
      // Update global follow state for real-time updates
      updateFollowStatus(
        item.user.id, 
        !originalFollowing, 
        response.followers_count, 
        response.following_count
      );
      
      // Trigger callback to parent component
      onFollow && onFollow(item.user.id, !originalFollowing);
      
    } catch (error) {
      // Revert optimistic update on error
      setIsFollowing(originalFollowing);
      console.error('❌ Follow/unfollow error:', error);
      Alert.alert('Error', 'Failed to update follow status');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle video tap to unmute and play
  const handleVideoPress = () => {
    if (isMuted) {
      setIsMuted(false);
      setIsPlaying(true);
    } else {
      setIsMuted(!isMuted);
    }
  };

  const formatTimeUntil = (scheduledTime: string) => {
    const startTime = new Date(scheduledTime);
    const diff = startTime.getTime() - currentTime.getTime();
    
    if (diff <= 0) {
      return 'Ready to go live!';
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Prepare media array for carousel
  const media: {type: 'image' | 'video', url: string}[] = [];
  if (item.poster_url) media.push({ type: 'image', url: item.poster_url });
  if (item.preview_video_url) media.push({ type: 'video', url: item.preview_video_url });

  // Dynamic aspect ratio state
  const [mediaAspectRatio, setMediaAspectRatio] = useState<number | undefined>(undefined);

  // Helper to set aspect ratio for images
  const setImageAspectRatio = (uri: string) => {
    if (!uri) return;
    Image.getSize(uri, (width, height) => {
      if (width && height) setMediaAspectRatio(width / height);
    }, () => {
      setMediaAspectRatio(undefined);
    });
  };

  // Helper to set aspect ratio for videos
  const handleVideoLoad = (status: any) => {
    if (status && status.naturalSize && status.naturalSize.width && status.naturalSize.height) {
      setMediaAspectRatio(status.naturalSize.width / status.naturalSize.height);
    }
  };

  // Set aspect ratio when media changes
  useEffect(() => {
    if (media.length > 0) {
      const firstMedia = media[0];
      if (firstMedia.type === 'image') {
        setImageAspectRatio(getFullUrl(firstMedia.url, ''));
      } else {
        setMediaAspectRatio(undefined); // Will be set on video load
      }
    }
  }, [media.length > 0 ? media[0].url : null]);

  // Render a single comment (and its replies)
  const renderComment = (comment: any, level = 0) => {
    console.log('Rendering comment:', comment);
    return (
      <View key={comment.id} style={[styles.commentContainer, { marginLeft: level * 20 }]}>
        <Image
          source={{ uri: getFullUrl(comment.profile_pic, 'https://via.placeholder.com/32x32/FFD700/000000?text=U') }}
          style={styles.commentAvatar}
        />
        <View style={styles.commentContent}>
          <Text style={styles.commentUsername}>{comment.username || 'Anonymous'}</Text>
          <Text style={styles.commentMessage}>{comment.message || 'No message'}</Text>
          <Text style={styles.commentTime}>
            {comment.created_at ? new Date(comment.created_at).toLocaleString() : 'Unknown time'}
          </Text>
          <TouchableOpacity onPress={() => setReplyTo(comment)} style={styles.replyButtonContainer}>
            <Text style={styles.replyButton}>Reply</Text>
          </TouchableOpacity>
          {comment.replies && comment.replies.length > 0 && (
            <View style={styles.repliesContainer}>
              {comment.replies.map((reply: any) => renderComment(reply, level + 1))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.videoContainer}>
      {/* Carousel for image/clip */}
      {media.length > 1 ? (
        <Swiper style={{ height: CONTENT_HEIGHT * 0.6 }} showsPagination={true} loop={false}>
          {media.map((m, idx) =>
            m.type === 'image' ? (
              <Image
                key={idx}
                source={{ uri: getFullUrl(m.url, 'https://via.placeholder.com/400x600/111111/FFD700?text=Video') }}
                style={[styles.media, { height: CONTENT_HEIGHT * 0.6, width: '100%' }]}
                resizeMode={ResizeMode.COVER}
              />
            ) : (
              <TouchableOpacity
                key={idx}
                onPress={handleVideoPress}
                style={[styles.media, { height: CONTENT_HEIGHT * 0.6, width: '100%' }]}
                activeOpacity={0.9}
              >
                <Video
                  source={{ uri: getFullUrl(m.url, '') }}
                  style={[styles.media, { height: CONTENT_HEIGHT * 0.6, width: '100%' }]}
                  resizeMode={ResizeMode.COVER}
                  useNativeControls={false}
                  shouldPlay={isPlaying}
                  isLooping={true}
                  isMuted={isMuted}
                />
                {/* Video overlay with mute/unmute indicator */}
                <View style={styles.videoOverlay}>
                  <View style={styles.muteIndicator}>
                    <Ionicons 
                      name={isMuted ? "volume-mute" : "volume-high"} 
                      size={24} 
                      color="#fff" 
                    />
                  </View>
                  {!isPlaying && (
                    <View style={styles.playButton}>
                      <Ionicons name="play" size={50} color="#fff" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )
          )}
        </Swiper>
      ) : media.length === 1 && media[0].type === 'image' ? (
        <Image
          source={{ uri: getFullUrl(media[0].url, 'https://via.placeholder.com/400x600/111111/FFD700?text=Video') }}
          style={[styles.video, { height: 400, width: '100%' }]}
          resizeMode={'cover'}
        />
      ) : media.length === 1 && media[0].type === 'video' ? (
        <TouchableOpacity
          onPress={handleVideoPress}
          style={[styles.video, { height: 400, width: '100%' }]}
          activeOpacity={0.9}
        >
          <Video
            source={{ uri: getFullUrl(media[0].url, '') }}
            style={[styles.video, { height: 400, width: '100%' }]}
            resizeMode={ResizeMode.COVER}
            useNativeControls={false}
            shouldPlay={isPlaying}
            isLooping={true}
            isMuted={isMuted}
          />
          {/* Video overlay with mute/unmute indicator */}
          <View style={styles.videoOverlay}>
            <View style={styles.muteIndicator}>
              <Ionicons 
                name={isMuted ? "volume-mute" : "volume-high"} 
                size={24} 
                color="#fff" 
              />
            </View>
            {!isPlaying && (
              <View style={styles.playButton}>
                <Ionicons name="play" size={50} color="#fff" />
              </View>
            )}
          </View>
        </TouchableOpacity>
      ) : (
        <Image
          source={{ uri: 'https://via.placeholder.com/400x600/111111/FFD700?text=Video' }}
          style={styles.video}
          resizeMode={'cover'}
        />
      )}
      
      {/* Live Badge - Top Left (only for events) */}
      {item.status === 'live' && isEvent && (
        <View style={styles.liveBadgeTopLeft}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE NOW</Text>
        </View>
      )}

      {/* Post Type Badge - Top Left (for normal posts) */}
      {isNormalPost && (
        <View style={styles.postTypeBadge}>
          <Ionicons name="document-text" size={12} color={Colors.starC.background} />
          <Text style={styles.postTypeText}>POST</Text>
        </View>
      )}

      {/* Follow Button - Top Right */}
      {item.user?.id !== user?.id && (
        <TouchableOpacity 
          style={[styles.followButton, isFollowing && styles.followingButton]} 
          onPress={handleFollow}
        >
          <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      )}
      
      {/* Right side actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleLike}
          disabled={isLoading}
        >
          <Ionicons 
            name={isLiked ? "star" : "star-outline"} 
            size={32} 
            color={isLiked ? Colors.starC.primary : Colors.starC.text} 
          />
          <Text style={styles.actionText}>{likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
          <Ionicons name="chatbubble-outline" size={32} color={Colors.starC.text} />
          <Text style={styles.actionText}>{item.comments_count || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => onShare(item.id)}>
          <Ionicons name="share-outline" size={32} color={Colors.starC.text} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
          <Ionicons 
            name={isSaved ? "bookmark" : "bookmark-outline"} 
            size={32} 
            color={isSaved ? Colors.starC.primary : Colors.starC.text} 
          />
        </TouchableOpacity>
        
        {/* Booking button - for all users on scheduled events */}
        {isEvent && item.type === 'event' && item.status === 'scheduled' && !isOwner && (
          <TouchableOpacity 
            style={[styles.actionButton, booked && styles.bookedButton]} 
            onPress={handleBook}
            disabled={isLoading}
          >
            <View style={styles.bookingIconContainer}>
              <Ionicons 
                name={booked ? "calendar" : "calendar-outline"} 
                size={28} 
                color={booked ? "#FFF" : Colors.starC.text} 
              />
              {booked && (
                <Ionicons 
                  name="checkmark-circle" 
                  size={12} 
                  color="#FFF" 
                  style={styles.bookingCheckIcon}
                />
              )}
            </View>
            <Text style={[styles.actionText, booked && styles.bookedText]}>
              {booked ? 'Booked!' : 'Book'}
            </Text>
            <Text style={[styles.actionSubText, booked && styles.bookedSubText]}>
              {bookings} booked
            </Text>
          </TouchableOpacity>
        )}

        {/* Owner's event controls */}
        {isEvent && item.type === 'event' && isOwner && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.ownerEventButton]} 
            onPress={() => {/* Navigate to event management */}}
          >
            <Ionicons 
              name="settings" 
              size={28} 
              color={Colors.starC.primary} 
            />
            <Text style={styles.actionText}>Manage</Text>
            <Text style={styles.actionSubText}>{bookings} booked</Text>
          </TouchableOpacity>
        )}
        {/* Go Live button - only for event owners when ready */}
        {isEvent && item.type === 'event' && isOwner && isReadyToGoLive() && (
          <TouchableOpacity style={[styles.actionButton, styles.goLiveButton]} onPress={handleGoLive}>
            <Ionicons name="radio" size={32} color="#fff" />
            <Text style={[styles.actionText, styles.goLiveText]}>Go Live</Text>
          </TouchableOpacity>
        )}

        {/* Join Live button - only for live events */}
        {item.status === 'live' && isEvent && item.type === 'event' && !isOwner && (
          <TouchableOpacity style={styles.actionButton} onPress={handleJoinLive}>
            <Ionicons name="radio" size={32} color={Colors.starC.primary} />
            <Text style={styles.actionText}>Join Live</Text>
          </TouchableOpacity>
        )}

        {/* Owner can join their own live session */}
        {item.status === 'live' && isEvent && item.type === 'event' && isOwner && (
          <TouchableOpacity style={styles.actionButton} onPress={handleJoinLive}>
            <Ionicons name="radio" size={32} color={Colors.starC.primary} />
            <Text style={styles.actionText}>Enter Live</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom content */}
      <View style={styles.bottomContent}>
        <View style={styles.userInfo}>
          <Image 
            source={{ 
              uri: getFullUrl(item.user?.profile_pic, 'https://via.placeholder.com/50/FFD700/000000?text=S') 
            }} 
            style={styles.avatar} 
          />
          <View style={styles.userDetails}>
            {/* Professional count indicators */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{likes}</Text>
                <Text style={styles.statLabel}>likes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{item.comments_count || 0}</Text>
                <Text style={styles.statLabel}>comments</Text>
              </View>
              {isEvent && (
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{bookings}</Text>
                  <Text style={styles.statLabel}>booked</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => onUserPress(item.user)}>
              <Text style={styles.username}>@{item.user?.username}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.description}>{item.caption || item.title}</Text>
        
        {/* Event info for scheduled events - Enhanced for all users */}
        {item.status === 'scheduled' && isEvent && item.type === 'event' && (
          <View style={styles.eventInfo}>
            <View style={styles.countdownContainer}>
              <Ionicons name="time" size={20} color={Colors.starC.primary} />
              <Text style={styles.eventTime}>{formatTimeUntil(item.start_time)}</Text>
              {isReadyToGoLive() && (
                <View style={styles.readyToLiveBadge}>
                  <Ionicons name="radio" size={14} color="#FFF" />
                  <Text style={styles.readyToLiveText}>Ready!</Text>
                </View>
              )}
            </View>
            <View style={styles.eventStats}>
              <View style={styles.eventStat}>
                <Ionicons name="calendar" size={14} color={Colors.starC.primary} />
                <Text style={styles.eventBookings}>{bookings} booked</Text>
              </View>
              <View style={styles.eventStat}>
                <Ionicons name="time" size={14} color={Colors.starC.textSecondary} />
                <Text style={styles.eventDate}>
                  {new Date(item.start_time).toLocaleDateString()} at{' '}
                  {new Date(item.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
              </View>
            </View>
          </View>
        )}
        
        {/* Live indicator for events */}
        {item.status === 'live' && isEvent && item.type === 'event' && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE NOW</Text>
            <Text style={styles.viewerCount}>{item.viewer_count || bookings} watching</Text>
          </View>
        )}
      </View>

      {/* Comment Modal */}
      <Modal visible={showCommentModal} transparent animationType="slide">
        <View style={styles.commentModalOverlay}>
          <View style={styles.commentModal}>
            <View style={styles.commentModalHeader}>
              <Text style={styles.commentModalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setShowCommentModal(false)}>
                <Ionicons name="close" size={24} color={Colors.starC.text} />
              </TouchableOpacity>
            </View>
            {commentsLoading ? (
              <View style={styles.commentsLoadingContainer}>
                <ActivityIndicator size="large" color={Colors.starC.primary} />
                <Text style={styles.commentsLoadingText}>Loading comments...</Text>
              </View>
            ) : (
              <ScrollView style={styles.commentsScrollView}>
                {threadedComments.length === 0 ? (
                  <View style={styles.noCommentsContainer}>
                    <Text style={styles.noCommentsText}>
                      {comments.length > 0 ? 'Comments loading...' : 'No comments yet.'}
                    </Text>
                    <Text style={styles.noCommentsSubtext}>
                      {comments.length > 0 ? `Found ${comments.length} comments` : 'Be the first to comment!'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.commentsContainer}>
                    <Text style={styles.commentsHeader}>Comments ({threadedComments.length})</Text>
                    {threadedComments.map(c => renderComment(c))}
                  </View>
                )}
              </ScrollView>
            )}
            <TextInput
              style={styles.commentInput}
              placeholder={replyTo ? `Replying to @${replyTo.username}` : 'Write your comment...'}
              placeholderTextColor={Colors.starC.textSecondary}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            {replyTo && (
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <Text style={{ color: Colors.starC.primary, fontSize: 12, marginBottom: 4 }}>Cancel reply</Text>
              </TouchableOpacity>
            )}
            <View style={styles.commentModalActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowCommentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.submitButton, !commentText.trim() && styles.submitButtonDisabled]} 
                onPress={handleSubmitComment}
                disabled={!commentText.trim() || isSubmittingComment}
              >
                {isSubmittingComment ? (
                  <ActivityIndicator size="small" color={Colors.starC.background} />
                ) : (
                  <Text style={styles.submitButtonText}>{replyTo ? 'Reply' : 'Post'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { sessions, isLoading, error, refreshSessions, searchSessions, isRealTimeEnabled, setRealTimeEnabled } = useSessions();
  const { user } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showRealTimeIndicator, setShowRealTimeIndicator] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Load sessions when component mounts
  useEffect(() => {
    if (sessions.length === 0) {
      refreshSessions();
    }
  }, []);

  // App state management for real-time updates
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && sessions.length > 0) {
        // Only refresh if we already have sessions loaded
        refreshSessions();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [sessions.length]);

  // Add debugging logs (reduced)
  if (process.env.NODE_ENV === 'development' && sessions && Array.isArray(sessions)) {
    console.log('🏠 Home Screen sessions loaded:', sessions.length);
  }

  const handleLike = (sessionId: string) => {
    console.log('Liked session:', sessionId);
  };

  const handleComment = (sessionId: string) => {
    console.log('Comment on session:', sessionId);
  };

  const handleShare = (sessionId: string) => {
    console.log('Share session:', sessionId);
  };

  const handleSave = (sessionId: string) => {
    console.log('Save session:', sessionId);
  };

  const handleBook = (sessionId: string) => {
    console.log('Booked session:', sessionId);
  };

  const handleJoinLive = (sessionId: string) => {
    console.log('Joining live session:', sessionId);
    router.push({ pathname: '/live-session', params: { sessionId } });
  };

  const handleUserPress = (user: any) => {
    console.log('Navigating to user profile:', user?.username);
    router.push({ pathname: '/profile/[username]', params: { username: user?.username } });
  };

  const handleFollow = (userId: string, isNowFollowing: boolean) => {
    console.log('Follow status updated:', { userId, isNowFollowing });
    
    // Broadcast follow status change for real-time updates
    // This could be used by other components like profile page
    const followStatusChange = {
      userId,
      isFollowing: isNowFollowing,
      timestamp: new Date().toISOString()
    };
    
    console.log('📡 Broadcasting follow status change:', followStatusChange);
    
    // For future implementation: emit to a global state or event system
    // for now, we'll handle this through component re-rendering
  };

  const handleSearch = async (query: string) => {
    try {
      setIsSearching(true);
      console.log('🔍 Homepage search for:', query);
      if (query.trim()) {
        await searchSessions(query);
        console.log('✅ Search completed');
      } else {
        console.log('🔄 Refreshing sessions (empty query)');
        await refreshSessions();
      }
    } catch (error) {
      console.error('❌ Homepage search failed:', error);
      Alert.alert('Search Error', 'Failed to search sessions. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = () => {
    handleSearch(searchQuery);
    setShowSearch(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearch(false);
    refreshSessions(); // Reset to all sessions
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshSessions();
    setRefreshing(false);
  };

  const renderVideo = ({ item }: any) => (
    <VideoCard
      item={item}
      onLike={handleLike}
      onComment={handleComment}
      onShare={handleShare}
      onSave={handleSave}
      onBook={handleBook}
      onJoinLive={handleJoinLive}
      onUserPress={handleUserPress}
      onFollow={handleFollow}
    />
  );

  if (isLoading && sessions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.starC.background} />
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
        <StatusBar barStyle="light-content" backgroundColor={Colors.starC.background} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={Colors.starC.error} />
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshSessions}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.starC.background} />
      
      {/* Professional Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>STARS</Text>
          <View style={styles.subtitleContainer}>
            <Text style={styles.headerSubtitle}>
              {searchQuery ? `Search: "${searchQuery}"` : 'Discover amazing content'}
            </Text>
            {isRealTimeEnabled && !searchQuery && (
              <View style={styles.realTimeIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.realTimeText}>Live</Text>
              </View>
            )}
            {searchQuery && (
              <TouchableOpacity 
                style={styles.clearSearchIndicator} 
                onPress={clearSearch}
              >
                <Ionicons name="close-circle" size={16} color={Colors.starC.primary} />
                <Text style={styles.clearSearchText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.realTimeToggle} 
            onPress={() => setRealTimeEnabled(!isRealTimeEnabled)}
          >
            <Ionicons 
              name={isRealTimeEnabled ? "wifi" : "wifi-outline"} 
              size={20} 
              color={isRealTimeEnabled ? Colors.starC.primary : Colors.starC.textSecondary} 
            />
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
            <TouchableOpacity onPress={handleSearchSubmit} disabled={isSearching}>
              {isSearching ? (
                <ActivityIndicator size="small" color={Colors.starC.primary} />
              ) : (
                <Ionicons name="search" size={24} color={Colors.starC.primary} />
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.searchResults}>
            <Text style={styles.searchSectionTitle}>Trending</Text>
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

      {/* Content Section */}
      <View style={styles.contentSection}>
        {/* Empty State */}
        {sessions.length === 0 && !isLoading && !error && (
          <View style={styles.emptyContainer}>
            <Ionicons name="radio-outline" size={80} color={Colors.starC.textSecondary} />
            <Text style={styles.emptyTitle}>No Sessions Found</Text>
            <Text style={styles.emptySubtitle}>
              Be the first to create a live session and share your content with the community!
            </Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => router.push('/create')}
            >
              <Text style={styles.createButtonText}>Create Session</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Video Feed */}
        {sessions.length > 0 && (
          <FlatList
            data={sessions}
            renderItem={renderVideo}
            keyExtractor={(item) => item.id}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            snapToInterval={CONTENT_HEIGHT}
            snapToAlignment="start"
            decelerationRate="fast"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.starC.primary}
                colors={[Colors.starC.primary]}
              />
            }
            ListHeaderComponent={
              isLoading && sessions.length > 0 ? (
                <View style={styles.refreshIndicator}>
                  <ActivityIndicator size="small" color={Colors.starC.primary} />
                  <Text style={styles.refreshText}>Refreshing...</Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
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
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.starC.primary,
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
  videoContainer: {
    width: width,
    height: CONTENT_HEIGHT,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  media: {
    width: '100%',
    resizeMode: 'cover',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  muteIndicator: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  playButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 50,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    position: 'absolute',
    right: 20,
    bottom: 120, // Adjusted to match bottomContent positioning
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    minWidth: 60,
  },
  actionText: {
    color: Colors.starC.text,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  bottomContent: {
    position: 'absolute',
    bottom: 60, // Reduced from 100 to ensure visibility
    left: 20,
    right: 100,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 12,
    maxHeight: CONTENT_HEIGHT * 0.35, // Ensure it doesn't take more than 35% of content height
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: Colors.starC.primary,
  },
  userDetails: {
    flex: 1,
    marginLeft: 12,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 4,
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: Colors.starC.primary,
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  statLabel: {
    color: Colors.starC.textSecondary,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 12,
  },
  username: {
    color: Colors.starC.text,
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  followButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: Colors.starC.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 10,
  },
  followButtonText: {
    color: Colors.starC.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  followingButton: {
    backgroundColor: Colors.starC.surface,
    borderWidth: 1,
    borderColor: Colors.starC.primary,
  },
  followingButtonText: {
    color: Colors.starC.primary,
  },
  description: {
    color: Colors.starC.text,
    fontSize: 16, // Increased from 14
    fontWeight: 'bold', // Made bold for better visibility
    lineHeight: 22, // Adjusted for better spacing
    marginBottom: 10,
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
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.starC.surface,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.starC.text,
    marginHorizontal: 10,
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
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
  },
  trendingItem: {
    backgroundColor: Colors.starC.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  trendingText: {
    color: Colors.starC.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  eventInfo: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: Colors.starC.primary,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readyToLiveBadge: {
    backgroundColor: '#FF4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  readyToLiveText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  eventTime: {
    color: Colors.starC.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventDate: {
    color: Colors.starC.textSecondary,
    fontSize: 12,
  },
  eventBookings: {
    color: Colors.starC.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  bookedButton: {
    backgroundColor: Colors.starC.primary,
  },
  bookedText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  bookedSubText: {
    color: '#FFF',
  },
  actionSubText: {
    color: Colors.starC.textSecondary,
    fontSize: 10,
    textAlign: 'center',
  },
  ownerEventButton: {
    borderColor: Colors.starC.primary,
    borderWidth: 1,
  },
  bookingCheckIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#FF4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.starC.text,
    marginRight: 5,
  },
  liveText: {
    color: Colors.starC.text,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 5,
  },
  viewerCount: {
    color: Colors.starC.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.starC.background,
  },
  loadingText: {
    color: Colors.starC.textSecondary,
    fontSize: 16,
    marginTop: 15,
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
    paddingHorizontal: 30,
    paddingVertical: 15,
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
  contentSection: {
    flex: 1,
    backgroundColor: Colors.starC.background,
    height: CONTENT_HEIGHT, // Ensure proper height allocation
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
    marginBottom: 30,
    lineHeight: 24,
  },
  createButton: {
    backgroundColor: Colors.starC.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  createButtonText: {
    color: Colors.starC.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  refreshIndicator: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  refreshText: {
    color: Colors.starC.textSecondary,
    fontSize: 14,
    marginTop: 5,
  },
  liveBadgeTopLeft: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#FF4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  postTypeBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: Colors.starC.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  postTypeText: {
    color: Colors.starC.background,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  bookingIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bookingStarIcon: {
    marginLeft: -5,
  },
  goLiveButton: {
    backgroundColor: '#FF4444',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  goLiveText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  commentModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  commentModal: {
    width: '90%',
    backgroundColor: Colors.starC.background,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  commentModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  commentModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.starC.text,
  },
  commentInput: {
    width: '100%',
    height: 150,
    backgroundColor: Colors.starC.surface,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: Colors.starC.text,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  commentModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  cancelButton: {
    backgroundColor: Colors.starC.surface,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: Colors.starC.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: Colors.starC.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  submitButtonText: {
    color: Colors.starC.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButtonDisabled: {
    backgroundColor: Colors.starC.textSecondary,
  },
  commentContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  commentContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  commentUsername: {
    fontWeight: 'bold',
    color: Colors.starC.text,
    fontSize: 14,
  },
  commentMessage: {
    color: Colors.starC.text,
    fontSize: 14,
    marginTop: 2,
    lineHeight: 18,
  },
  commentTime: {
    color: Colors.starC.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  replyButton: {
    color: Colors.starC.primary,
    fontSize: 12,
    marginTop: 4,
    fontWeight: 'bold',
  },
  replyButtonContainer: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  repliesContainer: {
    marginTop: 8,
    borderLeftWidth: 2,
    borderLeftColor: Colors.starC.surface,
    paddingLeft: 12,
  },
  commentsScrollView: {
    maxHeight: 400,
    width: '100%',
    backgroundColor: 'transparent',
  },
  commentsContainer: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
  },
  noCommentsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'transparent',
  },
  noCommentsText: {
    color: Colors.starC.textSecondary,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  noCommentsSubtext: {
    color: Colors.starC.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
  },
  commentsLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  commentsLoadingText: {
    color: Colors.starC.textSecondary,
    fontSize: 14,
    marginTop: 10,
  },
  commentsHeader: {
    color: Colors.starC.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  realTimeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.starC.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  realTimeText: {
    color: Colors.starC.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  clearSearchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.starC.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
    gap: 4,
  },
  clearSearchText: {
    color: Colors.starC.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  realTimeToggle: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.starC.surface,
  },
});
