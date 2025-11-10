import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';

const SettingItem = ({ icon, title, subtitle, onPress, showSwitch = false, switchValue = false, onSwitchChange }: any) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <View style={styles.settingIcon}>
      <Ionicons name={icon} size={24} color={Colors.starC.primary} />
    </View>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    {showSwitch ? (
      <Switch
        value={switchValue}
        onValueChange={onSwitchChange}
        trackColor={{ false: Colors.starC.surface, true: Colors.starC.primary }}
        thumbColor={switchValue ? Colors.starC.background : Colors.starC.textSecondary}
      />
    ) : (
      <Ionicons name="chevron-forward" size={20} color={Colors.starC.textSecondary} />
    )}
  </TouchableOpacity>
);

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [liveNotifications, setLiveNotifications] = useState(true);
  const [likeNotifications, setLikeNotifications] = useState(true);
  const [commentNotifications, setCommentNotifications] = useState(true);
  const [followNotifications, setFollowNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await logout();
              console.log('✅ Logout successful, navigating to auth');
              router.replace('/auth');
            } catch (error) {
              console.error('❌ Logout failed:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        },
      ]
    );
  };

  const notificationSettings = [
    {
      icon: 'notifications-outline',
      title: 'Push Notifications',
      subtitle: 'Receive notifications on your device',
      showSwitch: true,
      switchValue: pushNotifications,
      onSwitchChange: setPushNotifications,
    },
    {
      icon: 'radio-outline',
      title: 'Live Session Alerts',
      subtitle: 'Get notified when someone goes live',
      showSwitch: true,
      switchValue: liveNotifications,
      onSwitchChange: setLiveNotifications,
    },
    {
      icon: 'heart-outline',
      title: 'Like Notifications',
      subtitle: 'When someone likes your content',
      showSwitch: true,
      switchValue: likeNotifications,
      onSwitchChange: setLikeNotifications,
    },
    {
      icon: 'chatbubble-outline',
      title: 'Comment Notifications',
      subtitle: 'When someone comments on your content',
      showSwitch: true,
      switchValue: commentNotifications,
      onSwitchChange: setCommentNotifications,
    },
    {
      icon: 'person-add-outline',
      title: 'Follow Notifications',
      subtitle: 'When someone follows you',
      showSwitch: true,
      switchValue: followNotifications,
      onSwitchChange: setFollowNotifications,
    },
    {
      icon: 'mail-outline',
      title: 'Email Notifications',
      subtitle: 'Receive notifications via email',
      showSwitch: true,
      switchValue: emailNotifications,
      onSwitchChange: setEmailNotifications,
    },
  ];

  const accountActions = [
    {
      icon: 'settings-outline',
      title: 'Account Settings',
      subtitle: 'Manage your account preferences',
      onPress: () => router.push('/settings'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'Get help with your account',
      onPress: () => console.log('Help & Support'),
    },
    {
      icon: 'log-out-outline',
      title: 'Logout',
      subtitle: 'Sign out of your account',
      onPress: handleLogout,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.starC.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          {notificationSettings.map((setting, index) => (
            <SettingItem key={index} {...setting} />
          ))}
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {accountActions.map((setting, index) => (
            <SettingItem key={index} {...setting} />
          ))}
        </View>

        <View style={styles.bottomSpacing} />
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.starC.surface,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.starC.text,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.starC.text,
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.starC.surface,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.starC.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: Colors.starC.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.starC.textSecondary,
  },
  bottomSpacing: {
    height: 20,
  },
}); 