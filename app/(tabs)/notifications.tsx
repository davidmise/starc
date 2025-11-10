import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { notificationsAPI } from '../../services/api';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'live' | 'booking' | 'mention';
  user: {
    id: string;
    username: string;
    profile_pic?: string;
  };
  content: string;
  created_at: string;
  is_read: boolean;
  session_id?: string;
  post_image?: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'like':
      return { name: 'heart', color: Colors.starC.error };
    case 'comment':
      return { name: 'chatbubble', color: Colors.starC.primary };
    case 'follow':
      return { name: 'person-add', color: Colors.starC.success };
    case 'live':
      return { name: 'radio', color: Colors.starC.warning };
    case 'booking':
      return { name: 'calendar', color: Colors.starC.primary };
    case 'mention':
      return { name: 'at', color: Colors.starC.primary };
    default:
      return { name: 'notifications', color: Colors.starC.text };
  }
};

const formatTimeAgo = (createdAt: string) => {
  const now = new Date();
  const created = new Date(createdAt);
  const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return created.toLocaleDateString();
};

const NotificationItem = ({ item, onPress }: { item: Notification; onPress: (item: Notification) => void }) => {
  const icon = getNotificationIcon(item.type);

  return (
    <TouchableOpacity 
      style={[styles.notificationItem, !item.is_read && styles.unreadItem]} 
      onPress={() => onPress(item)}
    >
      <View style={styles.notificationContent}>
        <Image 
          source={{ 
            uri: item.user.profile_pic || 'https://via.placeholder.com/40/FFD700/000000?text=U' 
          }} 
          style={styles.avatar} 
        />
        <View style={styles.notificationText}>
          <Text style={styles.userName}>@{item.user.username}</Text>
          <Text style={styles.notificationMessage}>{item.content}</Text>
          <Text style={styles.timeText}>{formatTimeAgo(item.created_at)}</Text>
        </View>
      </View>
      
      <View style={styles.notificationActions}>
        {item.post_image && (
          <Image source={{ uri: item.post_image }} style={styles.postThumbnail} />
        )}
        <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
          <Ionicons name={icon.name as any} size={16} color={icon.color} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('📱 Loading notifications...');
      const response = await notificationsAPI.getNotifications();
      console.log(`✅ Loaded ${response.notifications?.length || 0} notifications`);
      setNotifications(response.notifications || []);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to load notifications';
      setError(errorMessage);
      console.error('❌ Failed to load notifications:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      // Mark as read
      if (!notification.is_read) {
        await notificationsAPI.markAsRead(notification.id);
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
      }

      // Navigate based on notification type
      switch (notification.type) {
        case 'comment':
          if (notification.session_id) {
            router.push({ pathname: '/post-details', params: { sessionId: notification.session_id } });
          }
          break;
        case 'live':
          if (notification.session_id) {
            router.push('/live-session');
          }
          break;
        case 'follow':
          router.push({ pathname: '/profile/[username]', params: { username: notification.user.username } });
          break;
        default:
          console.log('Notification pressed:', notification.id);
          break;
      }
    } catch (error) {
      console.error('Failed to handle notification:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setIsMarkingRead(true);
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      console.log('✅ All notifications marked as read');
    } catch (error) {
      console.error('❌ Failed to mark all as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    } finally {
      setIsMarkingRead(false);
    }
  };

  const handleSettingsPress = () => {
    router.push('/notification-settings');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const renderNotification = ({ item }: { item: Notification }) => (
    <NotificationItem item={item} onPress={handleNotificationPress} />
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.starC.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadNotifications}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerButtons}>
          {unreadCount > 0 && (
            <TouchableOpacity 
              style={styles.markReadButton} 
              onPress={handleMarkAllRead}
              disabled={isMarkingRead}
            >
              {isMarkingRead ? (
                <ActivityIndicator size="small" color={Colors.starC.background} />
              ) : (
                <Text style={styles.markReadText}>Mark all read</Text>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.settingsButton} onPress={handleSettingsPress}>
            <Ionicons name="settings-outline" size={24} color={Colors.starC.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notification Count */}
      {unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{unreadCount} new</Text>
        </View>
      )}

      {/* Empty State */}
      {notifications.length === 0 && !isLoading && !error && (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-outline" size={64} color={Colors.starC.textSecondary} />
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptySubtitle}>
            You're all caught up! New notifications will appear here.
          </Text>
        </View>
      )}

      {/* Notifications List */}
      {notifications.length > 0 && (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.notificationsList}
          onRefresh={loadNotifications}
          refreshing={isLoading}
        />
      )}
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markReadButton: {
    padding: 8,
  },
  markReadText: {
    color: Colors.starC.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: 8,
  },
  unreadBadge: {
    backgroundColor: Colors.starC.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginBottom: 10,
  },
  unreadText: {
    color: Colors.starC.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  notificationsList: {
    paddingHorizontal: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.starC.surface,
  },
  unreadItem: {
    backgroundColor: Colors.starC.surface + '30',
  },
  notificationContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  userName: {
    color: Colors.starC.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  notificationMessage: {
    color: Colors.starC.textSecondary,
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  timeText: {
    color: Colors.starC.textSecondary,
    fontSize: 12,
  },
  notificationActions: {
    alignItems: 'center',
  },
  postThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  errorText: {
    color: Colors.starC.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.starC.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
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
    paddingVertical: 50,
    backgroundColor: Colors.starC.background,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.starC.text,
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.starC.textSecondary,
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 20,
  },
}); 