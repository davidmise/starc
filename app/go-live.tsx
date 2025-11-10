import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthGuard } from '../components/AuthGuard';
import Colors from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function GoLiveScreen() {
  return (
    <AuthGuard requireAuth={true}>
      <GoLiveContent />
    </AuthGuard>
  );
}

function GoLiveContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparingToGoLive, setIsPreparingToGoLive] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    // Camera permissions are still loading.
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera" size={80} color={Colors.starC.textSecondary} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionDescription}>
            Stars needs access to your camera to let you go live and share your content with the world.
          </Text>
          <Text style={styles.permissionText}>Loading camera permissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={80} color={Colors.starC.textSecondary} />
          <Text style={styles.permissionTitle}>Camera Permission Needed</Text>
          <Text style={styles.permissionDescription}>
            To create live streams and share your content, we need access to your camera. Your privacy is important to us - camera access is only used when you're actively streaming.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleStartLive = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setIsPreparingToGoLive(false);
      console.log('📴 Stopped live stream');
      
      // Show success message and navigate back
      Alert.alert(
        '✅ Stream Ended',
        'Your live stream has ended successfully!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else {
      // Start recording
      setIsPreparingToGoLive(true);
      
      try {
        console.log('🔴 Starting live stream...');
        
        // Simulate preparation time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setIsRecording(true);
        setIsPreparingToGoLive(false);
        
        console.log('✅ Live stream started successfully');
        
        // Show notification
        Alert.alert(
          '🔴 You\'re Live!',
          'Your live stream is now broadcasting. Viewers can join and interact with you in real-time.',
          [{ text: 'Continue Streaming', style: 'default' }]
        );
      } catch (error) {
        console.error('❌ Failed to start live stream:', error);
        setIsPreparingToGoLive(false);
        Alert.alert('Error', 'Failed to start live stream. Please try again.');
      }
    }
  };

  const handleClose = () => {
    if (isRecording) {
      Alert.alert(
        'End Live Stream?',
        'You are currently live. Are you sure you want to end your stream?',
        [
          { text: 'Keep Streaming', style: 'cancel' },
          { text: 'End Stream', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Camera View */}
      <CameraView 
        style={styles.camera} 
        facing={facing}
        ref={cameraRef}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={28} color={Colors.starC.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Go Live</Text>
            <Text style={styles.headerSubtitle}>@{user?.username}</Text>
          </View>
          <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse" size={28} color={Colors.starC.text} />
          </TouchableOpacity>
        </View>

        {/* Live Indicator */}
        {isRecording && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          {/* Camera Flip Button */}
          <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
            <Ionicons 
              name="camera-reverse-outline" 
              size={24} 
              color={Colors.starC.text} 
            />
          </TouchableOpacity>

          {/* Go Live Button */}
          <TouchableOpacity 
            style={[
              styles.goLiveButton, 
              isRecording && styles.goLiveButtonActive,
              isPreparingToGoLive && styles.goLiveButtonPreparing
            ]} 
            onPress={handleStartLive}
            disabled={isPreparingToGoLive}
          >
            {isPreparingToGoLive ? (
              <>
                <Ionicons name="hourglass" size={32} color={Colors.starC.text} />
                <Text style={styles.goLiveButtonText}>Preparing...</Text>
              </>
            ) : isRecording ? (
              <>
                <Ionicons name="stop" size={32} color={Colors.starC.text} />
                <Text style={styles.goLiveButtonText}>End Live</Text>
              </>
            ) : (
              <>
                <Ionicons name="radio" size={32} color={Colors.starC.text} />
                <Text style={styles.goLiveButtonText}>Go Live</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Settings Button */}
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons 
              name="settings-outline" 
              size={24} 
              color={Colors.starC.text} 
            />
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        {!isRecording && (
          <View style={styles.instructions}>
            <Text style={styles.instructionTitle}>Ready to go live?</Text>
            <Text style={styles.instructionText}>
              Make sure you have good lighting and a stable internet connection
            </Text>
          </View>
        )}
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.starC.background,
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.starC.text,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionDescription: {
    fontSize: 16,
    color: Colors.starC.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionText: {
    fontSize: 18,
    color: Colors.starC.textSecondary,
    marginTop: 20,
  },
  permissionButton: {
    backgroundColor: Colors.starC.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: Colors.starC.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.starC.text,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.starC.textSecondary,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveIndicator: {
    position: 'absolute',
    top: 80,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
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
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goLiveButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.starC.primary,
  },
  goLiveButtonActive: {
    backgroundColor: '#FF4444',
    borderColor: '#FF4444',
  },
  goLiveButtonPreparing: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: Colors.starC.textSecondary,
  },
  goLiveButtonText: {
    color: Colors.starC.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  instructions: {
    position: 'absolute',
    bottom: 200,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.starC.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: Colors.starC.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});