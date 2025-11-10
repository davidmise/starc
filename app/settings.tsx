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
import { AuthGuard } from '../components/AuthGuard';
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

const SectionHeader = ({ title }: any) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

export default function SettingsScreen() {
  return (
    <AuthGuard requireAuth={true}>
      <SettingsContent />
    </AuthGuard>
  );
}

function SettingsContent() {
  const router = useRouter();
  const { logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [liveNotifications, setLiveNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);

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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. Are you sure you want to delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete account') },
      ]
    );
  };

  const accountSettings = [
    {
      icon: 'person-outline',
      title: 'Edit Profile',
      onPress: () => router.push('/edit-profile' as any),
    },
    {
      icon: 'lock-closed-outline',
      title: 'Privacy',
      onPress: () => console.log('Privacy'),
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Security',
      onPress: () => console.log('Security'),
    },
    {
      icon: 'card-outline',
      title: 'Payment Methods',
      onPress: () => console.log('Payment Methods'),
    },
  ];

  const notificationSettings = [
    {
      icon: 'notifications-outline',
      title: 'Push Notifications',
      showSwitch: true,
      switchValue: notifications,
      onSwitchChange: setNotifications,
    },
    {
      icon: 'radio-outline',
      title: 'Live Session Alerts',
      showSwitch: true,
      switchValue: liveNotifications,
      onSwitchChange: setLiveNotifications,
    },
    {
      icon: 'mail-outline',
      title: 'Email Notifications',
      onPress: () => console.log('Email Notifications'),
    },
  ];

  const appSettings = [
    {
      icon: 'moon-outline',
      title: 'Dark Mode',
      showSwitch: true,
      switchValue: darkMode,
      onSwitchChange: setDarkMode,
    },
    {
      icon: 'play-outline',
      title: 'Auto-play Videos',
      showSwitch: true,
      switchValue: autoPlay,
      onSwitchChange: setAutoPlay,
    },
    {
      icon: 'language-outline',
      title: 'Language',
      subtitle: 'English',
      onPress: () => console.log('Language'),
    },
    {
      icon: 'download-outline',
      title: 'Download Settings',
      onPress: () => console.log('Download Settings'),
    },
  ];

  const supportSettings = [
    {
      icon: 'help-circle-outline',
      title: 'Help Center',
      onPress: () => console.log('Help Center'),
    },
    {
      icon: 'document-text-outline',
      title: 'Terms of Service',
      onPress: () => console.log('Terms of Service'),
    },
    {
      icon: 'shield-outline',
      title: 'Privacy Policy',
      onPress: () => console.log('Privacy Policy'),
    },
    {
      icon: 'information-circle-outline',
      title: 'About StarC',
      subtitle: 'Version 1.0.0',
      onPress: () => console.log('About StarC'),
    },
  ];

  const accountActions = [
    {
      icon: 'log-out-outline',
      title: 'Logout',
      onPress: handleLogout,
    },
    {
      icon: 'trash-outline',
      title: 'Delete Account',
      onPress: handleDeleteAccount,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.starC.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Account Settings */}
        <SectionHeader title="Account" />
        {accountSettings.map((setting, index) => (
          <SettingItem key={index} {...setting} />
        ))}

        {/* Notifications */}
        <SectionHeader title="Notifications" />
        {notificationSettings.map((setting, index) => (
          <SettingItem key={index} {...setting} />
        ))}

        {/* App Settings */}
        <SectionHeader title="App Settings" />
        {appSettings.map((setting, index) => (
          <SettingItem key={index} {...setting} />
        ))}

        {/* Support */}
        <SectionHeader title="Support" />
        {supportSettings.map((setting, index) => (
          <SettingItem key={index} {...setting} />
        ))}

        {/* Account Actions */}
        <SectionHeader title="Account Actions" />
        {accountActions.map((setting, index) => (
          <SettingItem key={index} {...setting} />
        ))}

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
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Colors.starC.surface,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.starC.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
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