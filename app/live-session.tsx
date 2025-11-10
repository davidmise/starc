import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { useSessions } from '../contexts/SessionsContext';

const { width, height } = Dimensions.get('window');

interface Comment {
  id: string;
  user: {
    id: string;
    username: string;
    profile_pic?: string;
  };
  message: string;
  created_at: string;
}

export default function LiveSessionScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams();
  const { user } = useAuth();
  const { getSession, addComment, toggleLike } = useSessions();
  
  console.log('🎥 Live Session Screen - sessionId:', sessionId);
  console.log('🎥 Live Session Screen - user:', user?.username);
  
  const [session, setSession] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);
  
  const commentsRef = useRef<FlatList>(null);
  const commentInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (sessionId) {
      loadSession();
      startViewerCounter();
      startCommentsPolling();
    } else {
      Alert.alert('Error', 'No session ID provided');
      router.back();
    }
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setIsLoading(true);
      console.log('📡 Loading session with ID:', sessionId);
      
      if (!sessionId) {
        throw new Error('No session ID provided');
      }
      
      const sessionData = await getSession(sessionId as string);
      console.log('✅ Session loaded:', sessionData);
      setSession(sessionData);
      setIsLiked(sessionData.is_liked || false);
      setLikesCount(sessionData.likes_count || 0);
    } catch (error: any) {
      console.error('❌ Failed to load session:', error);
      Alert.alert('Error', 'Failed to load session. Please try again.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const startViewerCounter = () => {
    // Simulate real-time viewer count updates
    const interval = setInterval(() => {
      setViewerCount(prev => {
        const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        return Math.max(0, prev + change);
      });
    }, 5000);

    return () => clearInterval(interval);
  };

  const startCommentsPolling = () => {
    // Simulate real-time comments
    const interval = setInterval(() => {
      // In real implementation, this would fetch new comments from backend
      const mockComments: Comment[] = [
        {
          id: Date.now().toString(),
          user: {
            id: '1',
            username: 'viewer1',
            profile_pic: 'https://via.placeholder.com/40/FFD700/000000?text=V'
          },
          message: 'Amazing content! 🌟',
          created_at: new Date().toISOString()
        }
      ];
      
      setComments(prev => [...mockComments, ...prev.slice(0, 49)]); // Keep max 50 comments
    }, 10000);

    return () => clearInterval(interval);
  };

  const handleLike = async () => {
    try {
      await toggleLike(sessionId as string);
      setIsLiked(!isLiked);
      setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    } catch (error) {
      Alert.alert('Error', 'Failed to like session');
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;

    try {
      setIsSubmittingComment(true);
      await addComment(sessionId as string, newComment.trim());
      
      // Add comment to local state immediately
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        user: {
          id: user?.id || '',
          username: user?.username || '',
          profile_pic: user?.profile_pic
        },
        message: newComment.trim(),
        created_at: new Date().toISOString()
      };
      
      setComments(prev => [newCommentObj, ...prev]);
      setNewComment('');
      
      // Scroll to top of comments
      commentsRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    Alert.alert('Recording Started', 'Live session recording has begun. Recording will be saved automatically.');
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    Alert.alert('Recording Stopped', 'Live session recording has been saved to your profile.');
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <Image 
        source={{ 
          uri: item.user.profile_pic || 'https://via.placeholder.com/40/FFD700/000000?text=U' 
        }} 
        style={styles.commentAvatar} 
      />
      <View style={styles.commentContent}>
        <Text style={styles.commentUsername}>@{item.user.username}</Text>
        <Text style={styles.commentMessage}>{item.message}</Text>
        <Text style={styles.commentTime}>
          {new Date(item.created_at).toLocaleTimeString()}
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.starC.primary} />
          <Text style={styles.loadingText}>Loading live session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Session not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Live Video Stream */}
      <View style={styles.videoContainer}>
        <Image 
          source={{ 
            uri: session.poster_url || session.preview_video_url || 'https://via.placeholder.com/400x600/111111/FFD700?text=Live' 
          }} 
          style={styles.videoStream} 
        />
        
        {/* Live Badge */}
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>

        {/* Viewer Count */}
        <View style={styles.viewerCount}>
          <Ionicons name="eye" size={16} color={Colors.starC.text} />
          <Text style={styles.viewerCountText}>{viewerCount} watching</Text>
        </View>

        {/* Recording Indicator */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>REC</Text>
          </View>
        )}

        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.starC.text} />
        </TouchableOpacity>

        {/* Recording Controls - Only for session creator */}
        {session.user_id === user?.id && (
          <View style={styles.recordingControls}>
            <TouchableOpacity 
              style={[styles.recordButton, isRecording && styles.recordingButton]} 
              onPress={isRecording ? handleStopRecording : handleStartRecording}
            >
              <Ionicons 
                name={isRecording ? "stop" : "radio-button-on"} 
                size={24} 
                color={isRecording ? Colors.starC.error : Colors.starC.primary} 
              />
              <Text style={[styles.recordButtonText, isRecording && styles.recordingButtonText]}>
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Session Info */}
      <View style={styles.sessionInfo}>
        <View style={styles.sessionHeader}>
          <Image 
            source={{ 
              uri: session.user?.profile_pic || 'https://via.placeholder.com/50/FFD700/000000?text=U' 
            }} 
            style={styles.sessionAvatar} 
          />
          <View style={styles.sessionDetails}>
            <Text style={styles.sessionTitle}>{session.title}</Text>
            <Text style={styles.sessionUsername}>@{session.user?.username}</Text>
          </View>
        </View>
        
        <Text style={styles.sessionCaption}>{session.caption}</Text>
      </View>

      {/* Interactive Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Ionicons 
            name={isLiked ? "star" : "star-outline"} 
            size={24} 
            color={isLiked ? Colors.starC.primary : Colors.starC.text} 
          />
          <Text style={styles.actionText}>{likesCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => setShowComments(!showComments)}
        >
          <Ionicons name="chatbubble-outline" size={24} color={Colors.starC.text} />
          <Text style={styles.actionText}>{comments.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={24} color={Colors.starC.text} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Comments Section */}
      {showComments && (
        <KeyboardAvoidingView 
          style={styles.commentsContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Live Comments</Text>
            <TouchableOpacity onPress={() => setShowComments(false)}>
              <Ionicons name="close" size={24} color={Colors.starC.text} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            ref={commentsRef}
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            style={styles.commentsList}
            showsVerticalScrollIndicator={false}
            inverted
          />
          
          <View style={styles.commentInputContainer}>
            <TextInput
              ref={commentInputRef}
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor={Colors.starC.textSecondary}
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={200}
            />
            <TouchableOpacity 
              style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]} 
              onPress={handleComment}
              disabled={!newComment.trim() || isSubmittingComment}
            >
              {isSubmittingComment ? (
                <ActivityIndicator size="small" color={Colors.starC.background} />
              ) : (
                <Ionicons name="send" size={20} color={Colors.starC.background} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.starC.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    color: Colors.starC.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: Colors.starC.error,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: Colors.starC.primary,
    fontSize: 16,
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  videoStream: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  liveBadge: {
    position: 'absolute',
    top: 50,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.starC.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.starC.text,
    marginRight: 6,
  },
  liveText: {
    color: Colors.starC.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewerCount: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  viewerCountText: {
    color: Colors.starC.text,
    fontSize: 12,
    marginLeft: 4,
  },
  recordingIndicator: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.starC.error + '80',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.starC.text,
    marginRight: 5,
  },
  recordingText: {
    color: Colors.starC.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  sessionInfo: {
    position: 'absolute',
    bottom: 200,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  sessionDetails: {
    flex: 1,
  },
  sessionTitle: {
    color: Colors.starC.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  sessionUsername: {
    color: Colors.starC.textSecondary,
    fontSize: 14,
  },
  sessionCaption: {
    color: Colors.starC.textSecondary,
    fontSize: 14,
    marginTop: 5,
  },
  actionsContainer: {
    position: 'absolute',
    right: 20,
    bottom: 150,
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionText: {
    color: Colors.starC.text,
    fontSize: 12,
    marginTop: 4,
  },
  commentsContainer: {
    height: 300,
    backgroundColor: Colors.starC.surface,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.starC.background,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.starC.text,
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  commentUsername: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.starC.primary,
  },
  commentMessage: {
    fontSize: 14,
    color: Colors.starC.text,
    marginTop: 2,
  },
  commentTime: {
    fontSize: 10,
    color: Colors.starC.textSecondary,
    marginTop: 2,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: Colors.starC.background,
  },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.starC.background,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.starC.text,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    padding: 8,
    backgroundColor: Colors.starC.primary,
    borderRadius: 20,
  },
  recordingControls: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: Colors.starC.surface,
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  recordingButton: {
    backgroundColor: Colors.starC.error,
  },
  recordButtonText: {
    color: Colors.starC.background,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  recordingButtonText: {
    color: Colors.starC.background,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.starC.textSecondary + '50',
    opacity: 0.7,
  },
}); 