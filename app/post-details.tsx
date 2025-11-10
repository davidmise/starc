import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

// Mock post data
const mockPost = {
  id: '1',
  user: {
    name: '@starc_user',
    displayName: 'Star Creator',
    avatar: 'https://via.placeholder.com/50/FFD700/000000?text=S',
  },
  image: 'https://via.placeholder.com/400x400/111111/FFD700?text=Post+Image',
  description: 'Amazing star content! ⭐✨ #StarC #Live #Trending',
  likes: 1234,
  comments: 89,
  shares: 45,
  time: '2 hours ago',
  isLiked: false,
  isSaved: false,
};

// Mock comments
const mockComments = [
  {
    id: '1',
    user: '@viewer1',
    displayName: 'Viewer One',
    avatar: 'https://via.placeholder.com/40/FFD700/000000?text=V',
    message: 'Amazing content! ⭐',
    likes: 12,
    time: '2 hours ago',
    isLiked: false,
  },
  {
    id: '2',
    user: '@viewer2',
    displayName: 'Viewer Two',
    avatar: 'https://via.placeholder.com/40/FFD700/000000?text=V',
    message: 'Love this! ✨',
    likes: 8,
    time: '1 hour ago',
    isLiked: true,
  },
  {
    id: '3',
    user: '@viewer3',
    displayName: 'Viewer Three',
    avatar: 'https://via.placeholder.com/40/FFD700/000000?text=V',
    message: 'Keep it up! 🌟',
    likes: 15,
    time: '30 minutes ago',
    isLiked: false,
  },
];

const CommentItem = ({ item, onLike, onReply }: any) => {
  const [isLiked, setIsLiked] = useState(item.isLiked);
  const [likes, setLikes] = useState(item.likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
    onLike && onLike(item.id);
  };

  return (
    <View style={styles.commentItem}>
      <Image source={{ uri: item.avatar }} style={styles.commentAvatar} />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUser}>{item.displayName}</Text>
          <Text style={styles.commentTime}>{item.time}</Text>
        </View>
        <Text style={styles.commentMessage}>{item.message}</Text>
        <View style={styles.commentActions}>
          <TouchableOpacity style={styles.commentAction} onPress={handleLike}>
            <Ionicons 
              name={isLiked ? "star" : "star-outline"} 
              size={16} 
              color={isLiked ? Colors.starC.primary : Colors.starC.textSecondary} 
            />
            <Text style={[styles.actionText, isLiked && styles.likedText]}>{likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.commentAction} onPress={() => onReply(item)}>
            <Ionicons name="chatbubble-outline" size={16} color={Colors.starC.textSecondary} />
            <Text style={styles.actionText}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function PostDetailsScreen() {
  const router = useRouter();
  const [post, setPost] = useState(mockPost);
  const [comments, setComments] = useState(mockComments);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);

  const handleLike = () => {
    setPost(prev => ({
      ...prev,
      isLiked: !prev.isLiked,
      likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
    }));
  };

  const handleSave = () => {
    setPost(prev => ({
      ...prev,
      isSaved: !prev.isSaved,
    }));
  };

  const handleShare = () => {
    Alert.alert('Share', 'Sharing post...');
  };

  const handleCommentLike = (commentId: string) => {
    console.log('Liked comment:', commentId);
  };

  const handleReply = (comment: any) => {
    setReplyTo(comment);
    setNewComment(`@${comment.user} `);
  };

  const handleSendComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now().toString(),
        user: '@you',
        displayName: 'You',
        avatar: 'https://via.placeholder.com/40/FFD700/000000?text=Y',
        message: newComment.trim(),
        likes: 0,
        time: 'now',
        isLiked: false,
      };
      setComments([comment, ...comments]);
      setNewComment('');
      setReplyTo(null);
    }
  };

  const renderComment = ({ item }: any) => (
    <CommentItem 
      item={item} 
      onLike={handleCommentLike}
      onReply={handleReply}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.starC.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={Colors.starC.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.postContainer}>
            {/* Post Header */}
            <View style={styles.postHeader}>
              <Image source={{ uri: post.user.avatar }} style={styles.userAvatar} />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{post.user.displayName}</Text>
                <Text style={styles.userHandle}>{post.user.name}</Text>
                <Text style={styles.postTime}>{post.time}</Text>
              </View>
              <TouchableOpacity style={styles.moreButton}>
                <Ionicons name="ellipsis-horizontal" size={20} color={Colors.starC.text} />
              </TouchableOpacity>
            </View>

            {/* Post Image */}
            <Image source={{ uri: post.image }} style={styles.postImage} />

            {/* Post Actions */}
            <View style={styles.postActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                <Ionicons 
                  name={post.isLiked ? "star" : "star-outline"} 
                  size={24} 
                  color={post.isLiked ? Colors.starC.primary : Colors.starC.text} 
                />
                <Text style={styles.actionText}>{post.likes}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={24} color={Colors.starC.text} />
                <Text style={styles.actionText}>{post.comments}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Ionicons name="share-outline" size={24} color={Colors.starC.text} />
                <Text style={styles.actionText}>{post.shares}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
                <Ionicons 
                  name={post.isSaved ? "bookmark" : "bookmark-outline"} 
                  size={24} 
                  color={post.isSaved ? Colors.starC.primary : Colors.starC.text} 
                />
              </TouchableOpacity>
            </View>

            {/* Post Description */}
            <View style={styles.postDescription}>
              <Text style={styles.descriptionText}>
                <Text style={styles.userName}>{post.user.displayName}</Text> {post.description}
              </Text>
            </View>

            {/* Comments Header */}
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
            </View>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Comment Input */}
      <View style={styles.commentInput}>
        {replyTo && (
          <View style={styles.replyTo}>
            <Text style={styles.replyToText}>Replying to {replyTo.displayName}</Text>
            <TouchableOpacity onPress={() => setReplyTo(null)}>
              <Ionicons name="close" size={16} color={Colors.starC.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Add a comment..."
            placeholderTextColor={Colors.starC.textSecondary}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]} 
            onPress={handleSendComment}
            disabled={!newComment.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={newComment.trim() ? Colors.starC.primary : Colors.starC.textSecondary} 
            />
          </TouchableOpacity>
        </View>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.starC.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.starC.text,
  },
  postContainer: {
    paddingBottom: 20,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.starC.text,
  },
  userHandle: {
    fontSize: 14,
    color: Colors.starC.textSecondary,
  },
  postTime: {
    fontSize: 12,
    color: Colors.starC.textSecondary,
  },
  moreButton: {
    padding: 8,
  },
  postImage: {
    width: width,
    height: width,
    resizeMode: 'cover',
  },
  postActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    color: Colors.starC.text,
    fontSize: 14,
    marginLeft: 4,
  },
  postDescription: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.starC.text,
    lineHeight: 20,
  },
  commentsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: Colors.starC.surface,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.starC.text,
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.starC.text,
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    color: Colors.starC.textSecondary,
  },
  commentMessage: {
    fontSize: 14,
    color: Colors.starC.text,
    lineHeight: 18,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  likedText: {
    color: Colors.starC.primary,
  },
  commentInput: {
    borderTopWidth: 1,
    borderTopColor: Colors.starC.surface,
    backgroundColor: Colors.starC.background,
  },
  replyTo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: Colors.starC.surface,
  },
  replyToText: {
    fontSize: 12,
    color: Colors.starC.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.starC.surface,
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
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
}); 