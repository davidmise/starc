import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, uploadAPI } from '../services/api';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, checkAuthStatus } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load user data on mount
  useEffect(() => {
    if (user && !isInitialized) {
      setDisplayName(user.username || '');
      setUsername(user.username || '');
      setBio(user.bio || '');
      setAvatar(user.profile_pic || 'https://via.placeholder.com/100/FFD700/000000?text=U');
      setIsInitialized(true);
    }
  }, [user, isInitialized]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadImage = async (imageUri: string) => {
    try {
      console.log('📤 Starting image upload...');
      console.log('📁 Image URI:', imageUri);
      
      // Create form data for image upload
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);

      console.log('📦 FormData created:', formData);
      console.log('🌐 Making upload request...');

      const response = await uploadAPI.uploadAvatar(formData);
      console.log('✅ Upload response:', response);
      
      const avatarUrl = response.avatar?.url || response.avatar_url || response.url;
      console.log('🔗 Avatar URL:', avatarUrl);
      
      return avatarUrl;
    } catch (error: any) {
      console.error('❌ Upload error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Please enter a display name');
      return;
    }

    setIsLoading(true);
    
    try {
      let profilePicUrl = user?.profile_pic;

      // Upload new image if it's different from the current one
      if (avatar !== user?.profile_pic && avatar !== 'https://via.placeholder.com/100/FFD700/000000?text=U') {
        console.log('📤 Uploading new profile image...');
        console.log('Current avatar:', user?.profile_pic);
        console.log('New avatar:', avatar);
        profilePicUrl = await uploadImage(avatar);
        console.log('✅ Image uploaded:', profilePicUrl);
      }

      // Update profile data
      console.log('📝 Updating profile...');
      const updateData: any = {
        bio: bio,
      };

      // Only update username if it's different and not empty
      if (displayName && displayName !== user?.username) {
        updateData.username = displayName;
      }

      if (profilePicUrl) {
        updateData.profile_pic = profilePicUrl;
      }

      console.log('📦 Update data:', updateData);
      const response = await authAPI.updateProfile(updateData);
      console.log('✅ Profile update response:', response);
      
      // Refresh auth status to get updated user data
      console.log('🔄 Refreshing auth status...');
      await checkAuthStatus();
      
      console.log('✅ Profile updated successfully');
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('❌ Profile update failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update profile';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={isLoading}>
          <Text style={[styles.saveText, isLoading && styles.saveTextDisabled]}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Picture */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
            <Image 
              source={{ 
                uri: avatar ? 
                  (avatar.startsWith('http') ? avatar : `http://192.168.81.194:5000${avatar}`) : 
                  'https://via.placeholder.com/100/FFD700/000000?text=U' 
              }} 
              style={styles.avatar} 
            />
            <View style={styles.avatarOverlay}>
              <Ionicons name="camera" size={24} color={Colors.starC.text} />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Display Name</Text>
            <TextInput
              style={styles.textInput}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter display name"
              placeholderTextColor={Colors.starC.textSecondary}
              maxLength={50}
            />
            <Text style={styles.characterCount}>{displayName.length}/50</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={[styles.textInput, styles.disabledInput]}
              value={username}
              editable={false}
              placeholder="Username cannot be changed"
              placeholderTextColor={Colors.starC.textSecondary}
            />
            <Text style={styles.disabledHint}>Username cannot be changed</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor={Colors.starC.textSecondary}
              multiline
              numberOfLines={4}
              maxLength={150}
            />
            <Text style={styles.characterCount}>{bio.length}/150</Text>
          </View>
        </View>

        {/* Additional Options */}
        <View style={styles.optionsSection}>
          <TouchableOpacity style={styles.optionItem}>
            <Ionicons name="link-outline" size={20} color={Colors.starC.primary} />
            <Text style={styles.optionText}>Add Website</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.starC.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem}>
            <Ionicons name="location-outline" size={20} color={Colors.starC.primary} />
            <Text style={styles.optionText}>Add Location</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.starC.textSecondary} />
          </TouchableOpacity>
        </View>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.starC.text,
  },
  cancelText: {
    fontSize: 16,
    color: Colors.starC.textSecondary,
  },
  saveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.starC.primary,
  },
  saveTextDisabled: {
    color: Colors.starC.textSecondary,
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.starC.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHint: {
    fontSize: 14,
    color: Colors.starC.textSecondary,
  },
  formSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  inputGroup: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.starC.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.starC.surface,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.starC.text,
    borderWidth: 1,
    borderColor: Colors.starC.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: Colors.starC.background,
    color: Colors.starC.textSecondary,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.starC.textSecondary,
    textAlign: 'right',
    marginTop: 5,
  },
  disabledHint: {
    fontSize: 12,
    color: Colors.starC.textSecondary,
    marginTop: 5,
  },
  optionsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.starC.surface,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: Colors.starC.text,
    marginLeft: 15,
  },
}); 