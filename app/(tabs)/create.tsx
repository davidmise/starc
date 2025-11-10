import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

export default function CreateScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { createSession } = useSessions();
  
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [genre, setGenre] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [posterImage, setPosterImage] = useState<any>(null);
  const [videoFile, setVideoFile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [postType, setPostType] = useState<'post' | 'event'>('post');
  const [startDateDisplay, setStartDateDisplay] = useState('');
  const [startTimeDisplay, setStartTimeDisplay] = useState('');
  const [endDateDisplay, setEndDateDisplay] = useState('');
  const [endTimeDisplay, setEndTimeDisplay] = useState('');
  
  // Format current date and time for display
  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTimeForDisplay = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Handle date and time selection
  const handleStartDateSelect = (date: Date) => {
    setStartDateDisplay(formatDateForDisplay(date));
  };

  const handleStartTimeSelect = (time: Date) => {
    setStartTimeDisplay(formatTimeForDisplay(time));
  };

  const handleEndDateSelect = (date: Date) => {
    setEndDateDisplay(formatDateForDisplay(date));
  };

  const handleEndTimeSelect = (time: Date) => {
    setEndTimeDisplay(formatTimeForDisplay(time));
  };

  const updateStartDateTime = (date: Date, timeStr: string) => {
    if (timeStr) {
      const [time, period] = timeStr.split(' ');
      const [hours, minutes] = time.split(':');
      let hour = parseInt(hours);
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      
      date.setHours(hour, parseInt(minutes), 0, 0);
      setStartTime(date.toISOString());
    }
  };

  const updateEndDateTime = (date: Date, timeStr: string) => {
    if (timeStr) {
      const [time, period] = timeStr.split(' ');
      const [hours, minutes] = time.split(':');
      let hour = parseInt(hours);
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      
      date.setHours(hour, parseInt(minutes), 0, 0);
      setEndTime(date.toISOString());
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPosterImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleVideoPick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setVideoFile(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick video');
    }
  };

  const handleSubmit = async () => {
    // For normal posts, title is optional
    let startTimeISO = '';
    let endTimeISO = '';
    if (postType === 'event') {
      if (!title.trim()) {
        Alert.alert('Error', 'Please enter a title for the event');
        return;
      }
      if (!genre.trim()) {
        Alert.alert('Error', 'Please enter a genre for the event');
        return;
      }
      if (!startDateDisplay.trim() || !startTimeDisplay.trim()) {
        Alert.alert('Error', 'Please enter a start date and time for the event');
        return;
      }
      // Parse and validate start date/time
      const startDateTimeString = `${startDateDisplay.trim()} ${startTimeDisplay.trim()}`;
      const parsedStart = Date.parse(startDateTimeString);
      if (isNaN(parsedStart)) {
        Alert.alert('Error', 'Invalid start date or time format. Use YYYY-MM-DD and HH:MM or HH:MM AM/PM.');
        return;
      }
      startTimeISO = new Date(parsedStart).toISOString();
      // Parse and validate end date/time if provided
      if (endDateDisplay.trim() && endTimeDisplay.trim()) {
        const endDateTimeString = `${endDateDisplay.trim()} ${endTimeDisplay.trim()}`;
        const parsedEnd = Date.parse(endDateTimeString);
        if (isNaN(parsedEnd)) {
          Alert.alert('Error', 'Invalid end date or time format. Use YYYY-MM-DD and HH:MM or HH:MM AM/PM.');
          return;
        }
        endTimeISO = new Date(parsedEnd).toISOString();
      }
    }

    try {
      setIsLoading(true);

      const formData = new FormData();
      if (title.trim()) {
        formData.append('title', title.trim());
      }
      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }
      formData.append('type', postType);
      
      // Only add genre for events
      if (postType === 'event' && genre.trim()) {
        formData.append('genre', genre.trim());
      }
      
      if (postType === 'event') {
        formData.append('start_time', startTimeISO);
        if (endTimeISO) {
          formData.append('end_time', endTimeISO);
        }
      }

      if (posterImage) {
        const imageFile = {
          uri: posterImage.uri,
          type: 'image/jpeg',
          name: 'poster.jpg',
        };
        formData.append('poster', imageFile as any);
      }

      if (videoFile) {
        const videoFileData = {
          uri: videoFile.uri,
          type: 'video/mp4',
          name: 'video.mp4',
        };
        formData.append('video', videoFileData as any);
      }

      await createSession(formData);
      
      Alert.alert('Success', `${postType === 'post' ? 'Post' : 'Event'} created successfully!`);
      
      // Reset form
      setTitle('');
      setCaption('');
      setGenre('');
      setStartTime('');
      setEndTime('');
      setStartDateDisplay('');
      setStartTimeDisplay('');
      setEndDateDisplay('');
      setEndTimeDisplay('');
      setPosterImage(null);
      setVideoFile(null);
      setPostType('post');
      
      // Navigate back to home
      router.push('/');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create post/event');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toISOString().slice(0, 16);
  };

  const handlePostTypeChange = (type: 'post' | 'event') => {
    setPostType(type);
    // Reset event-specific fields when switching to normal post
    if (type === 'post') {
      setGenre('');
      setStartTime('');
      setEndTime('');
      setStartDateDisplay('');
      setStartTimeDisplay('');
      setEndDateDisplay('');
      setEndTimeDisplay('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.starC.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create</Text>
        <TouchableOpacity 
          style={[styles.submitButton, (isLoading || (postType === 'event' && (!title.trim() || !genre.trim() || !startDateDisplay.trim() || !startTimeDisplay.trim()))) && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={isLoading || (postType === 'event' && (!title.trim() || !genre.trim() || !startDateDisplay.trim() || !startTimeDisplay.trim()))}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.starC.background} />
          ) : (
            <Text style={styles.submitButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Post Type Selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity 
            style={[styles.typeButton, postType === 'post' && styles.activeTypeButton]} 
            onPress={() => handlePostTypeChange('post')}
          >
            <Ionicons 
              name="document-text" 
              size={20} 
              color={postType === 'post' ? Colors.starC.background : Colors.starC.text} 
            />
            <Text style={[styles.typeButtonText, postType === 'post' && styles.activeTypeButtonText]}>
              Normal Post
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeButton, postType === 'event' && styles.activeTypeButton]} 
            onPress={() => handlePostTypeChange('event')}
          >
            <Ionicons 
              name="calendar" 
              size={20} 
              color={postType === 'event' ? Colors.starC.background : Colors.starC.text} 
            />
            <Text style={[styles.typeButtonText, postType === 'event' && styles.activeTypeButtonText]}>
              Event
            </Text>
          </TouchableOpacity>
        </View>

        {/* Title Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Title {postType === 'event' ? '*' : '(optional)'}</Text>
          <TextInput
            style={styles.textInput}
            placeholder={`Enter ${postType === 'post' ? 'post' : 'event'} title...`}
            placeholderTextColor={Colors.starC.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Caption Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Caption</Text>
          <TextInput
            style={[styles.textInput, styles.captionInput]}
            placeholder="Write your caption..."
            placeholderTextColor={Colors.starC.textSecondary}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={500}
          />
        </View>

        {/* Genre Input - Only for Events */}
        {postType === 'event' && (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Genre *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter genre..."
              placeholderTextColor={Colors.starC.textSecondary}
              value={genre}
              onChangeText={setGenre}
              maxLength={50}
            />
          </View>
        )}

        {/* Start Time - Only for Events */}
        {postType === 'event' && (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Start Date *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.starC.textSecondary}
              value={startDateDisplay}
              onChangeText={setStartDateDisplay}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
            <Text style={styles.inputLabel}>Start Time *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="HH:MM (24h or 12h, e.g. 14:30 or 2:30 PM)"
              placeholderTextColor={Colors.starC.textSecondary}
              value={startTimeDisplay}
              onChangeText={setStartTimeDisplay}
              keyboardType="numbers-and-punctuation"
              maxLength={8}
            />
          </View>
        )}

        {/* End Time - Only for Events */}
        {postType === 'event' && (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>End Date (optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.starC.textSecondary}
              value={endDateDisplay}
              onChangeText={setEndDateDisplay}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
            <Text style={styles.inputLabel}>End Time (optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="HH:MM (24h or 12h, e.g. 16:00 or 4:00 PM)"
              placeholderTextColor={Colors.starC.textSecondary}
              value={endTimeDisplay}
              onChangeText={setEndTimeDisplay}
              keyboardType="numbers-and-punctuation"
              maxLength={8}
            />
          </View>
        )}

        {/* Media Upload Section */}
        <View style={styles.mediaSection}>
          <Text style={styles.sectionTitle}>Media</Text>
          
          {/* Poster Image */}
          <View style={styles.mediaItem}>
            <Text style={styles.mediaLabel}>Poster Image</Text>
            <TouchableOpacity style={styles.mediaButton} onPress={handleImagePick}>
              {posterImage ? (
                <Image source={{ uri: posterImage.uri }} style={styles.mediaPreview} />
              ) : (
                <View style={styles.mediaPlaceholder}>
                  <Ionicons name="image" size={32} color={Colors.starC.textSecondary} />
                  <Text style={styles.mediaPlaceholderText}>Add Poster</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Video File */}
          <View style={styles.mediaItem}>
            <Text style={styles.mediaLabel}>Video Clip</Text>
            <TouchableOpacity style={styles.mediaButton} onPress={handleVideoPick}>
              {videoFile ? (
                <View style={styles.videoPreview}>
                  <Ionicons name="play-circle" size={32} color={Colors.starC.primary} />
                  <Text style={styles.videoPreviewText}>Video Selected</Text>
                </View>
              ) : (
                <View style={styles.mediaPlaceholder}>
                  <Ionicons name="videocam" size={32} color={Colors.starC.textSecondary} />
                  <Text style={styles.mediaPlaceholderText}>Add Video</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Colors.starC.background,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.starC.text,
  },
  submitButton: {
    backgroundColor: Colors.starC.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: Colors.starC.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButtonDisabled: {
    backgroundColor: Colors.starC.surface,
    opacity: 0.7,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.starC.surface,
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  activeTypeButton: {
    backgroundColor: Colors.starC.primary,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  activeTypeButtonText: {
    color: Colors.starC.background,
  },
  inputContainer: {
    marginBottom: 20,
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
    padding: 15,
    fontSize: 16,
    color: Colors.starC.text,
    borderWidth: 1,
    borderColor: Colors.starC.surface,
  },
  captionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.starC.surface,
    borderRadius: 8,
    padding: 15,
    marginTop: 4,
  },
  dateTimeText: {
    color: Colors.starC.text,
    fontSize: 16,
    marginLeft: 10,
  },
  mediaSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.starC.text,
    marginBottom: 15,
  },
  mediaItem: {
    marginBottom: 20,
  },
  mediaLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.starC.text,
    marginBottom: 8,
  },
  mediaButton: {
    backgroundColor: Colors.starC.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 10,
  },
  mediaPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  mediaPlaceholderText: {
    color: Colors.starC.textSecondary,
    fontSize: 16,
    marginTop: 10,
  },
  videoPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  videoPreviewText: {
    color: Colors.starC.primary,
    fontSize: 16,
    marginTop: 10,
  },

  dateTimeInput: {
    backgroundColor: Colors.starC.surface,
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: Colors.starC.text,
    borderWidth: 1,
    borderColor: Colors.starC.surface,
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.starC.background,
    borderRadius: 15,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.starC.text,
    marginBottom: 20,
  },
  datePickerContainer: {
    width: '100%',
    marginBottom: 20,
  },
  dateOption: {
    backgroundColor: Colors.starC.surface,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  dateOptionText: {
    fontSize: 16,
    color: Colors.starC.text,
    fontWeight: 'bold',
  },
  timePickerContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeOption: {
    backgroundColor: Colors.starC.surface,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    width: '30%',
    alignItems: 'center',
  },
  timeOptionText: {
    fontSize: 14,
    color: Colors.starC.text,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: Colors.starC.surface,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  cancelButtonText: {
    color: Colors.starC.text,
    fontSize: 16,
    fontWeight: 'bold',
  },

}); 