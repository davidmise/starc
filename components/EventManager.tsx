import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Colors from '../constants/Colors';
import CountdownTimer from './CountdownTimer';

interface Event {
  id: string;
  title: string;
  caption: string;
  genre: string;
  scheduledTime: Date;
  duration: number;
  media?: string;
  isLive: boolean;
  isCancelled: boolean;
  bookings: number;
}

interface EventManagerProps {
  event: Event;
  isCreator: boolean;
  onCancel?: (eventId: string) => void;
  onDelete?: (eventId: string) => void;
  onJoin?: (eventId: string) => void;
}

export default function EventManager({ event, isCreator, onCancel, onDelete, onJoin }: EventManagerProps) {
  const [showOptions, setShowOptions] = useState(false);

  const handleCancel = () => {
    Alert.alert(
      'Cancel Event',
      'Are you sure you want to cancel this event? This action cannot be undone.',
      [
        { text: 'Keep Event', style: 'cancel' },
        { 
          text: 'Cancel Event', 
          style: 'destructive',
          onPress: () => {
            onCancel?.(event.id);
            setShowOptions(false);
          }
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This will permanently remove the event and all associated content.',
      [
        { text: 'Keep Event', style: 'cancel' },
        { 
          text: 'Delete Event', 
          style: 'destructive',
          onPress: () => {
            onDelete?.(event.id);
            setShowOptions(false);
          }
        },
      ]
    );
  };

  const handleJoin = () => {
    onJoin?.(event.id);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      {/* Event Header */}
      <View style={styles.header}>
        <View style={styles.eventInfo}>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.genre}>{event.genre}</Text>
          <Text style={styles.scheduledTime}>{formatDate(event.scheduledTime)}</Text>
        </View>
        {isCreator && (
          <TouchableOpacity 
            style={styles.optionsButton}
            onPress={() => setShowOptions(true)}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={Colors.starC.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Event Media */}
      {event.media && (
        <View style={styles.mediaContainer}>
          <Ionicons name="image" size={40} color={Colors.starC.primary} />
          <Text style={styles.mediaText}>Event Poster/Clip</Text>
        </View>
      )}

      {/* Event Description */}
      <Text style={styles.caption}>{event.caption}</Text>

      {/* Countdown Timer */}
      {!event.isCancelled && !event.isLive && (
        <CountdownTimer 
          targetDate={event.scheduledTime}
          onComplete={() => console.log('Event time reached')}
        />
      )}

      {/* Event Status */}
      <View style={styles.statusContainer}>
        {event.isCancelled ? (
          <View style={styles.cancelledBadge}>
            <Ionicons name="close-circle" size={16} color={Colors.starC.error} />
            <Text style={styles.cancelledText}>Cancelled</Text>
          </View>
        ) : event.isLive ? (
          <View style={styles.liveBadge}>
            <View style={styles.liveIndicator} />
            <Text style={styles.liveText}>LIVE NOW</Text>
          </View>
        ) : (
          <View style={styles.upcomingBadge}>
            <Ionicons name="time" size={16} color={Colors.starC.primary} />
            <Text style={styles.upcomingText}>Upcoming</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {!event.isCancelled && !event.isLive && (
          <TouchableOpacity style={styles.joinButton} onPress={handleJoin}>
            <Ionicons name="radio" size={20} color={Colors.starC.background} />
            <Text style={styles.joinButtonText}>Join Event</Text>
          </TouchableOpacity>
        )}
        
        {event.isLive && (
          <TouchableOpacity style={styles.liveButton} onPress={handleJoin}>
            <Ionicons name="radio" size={20} color={Colors.starC.background} />
            <Text style={styles.liveButtonText}>Join Live</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Creator Options Modal */}
      <Modal visible={showOptions} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalOption} onPress={handleCancel}>
              <Ionicons name="close-circle" size={20} color={Colors.starC.warning} />
              <Text style={styles.modalOptionText}>Cancel Event</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOption} onPress={handleDelete}>
              <Ionicons name="trash" size={20} color={Colors.starC.error} />
              <Text style={[styles.modalOptionText, { color: Colors.starC.error }]}>Delete Event</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={() => setShowOptions(false)}
            >
              <Text style={[styles.modalOptionText, { color: Colors.starC.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.starC.surface,
    borderRadius: 12,
    padding: 20,
    margin: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  eventInfo: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.starC.text,
    marginBottom: 5,
  },
  genre: {
    fontSize: 14,
    color: Colors.starC.primary,
    marginBottom: 5,
  },
  scheduledTime: {
    fontSize: 14,
    color: Colors.starC.textSecondary,
  },
  optionsButton: {
    padding: 5,
  },
  mediaContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.starC.background,
    borderRadius: 8,
    marginBottom: 15,
  },
  mediaText: {
    fontSize: 14,
    color: Colors.starC.textSecondary,
    marginTop: 5,
  },
  caption: {
    fontSize: 16,
    color: Colors.starC.text,
    lineHeight: 22,
    marginBottom: 15,
  },
  statusContainer: {
    marginBottom: 15,
  },
  cancelledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.starC.error + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  cancelledText: {
    color: Colors.starC.error,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.starC.error + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.starC.error,
    marginRight: 5,
  },
  liveText: {
    color: Colors.starC.error,
    fontSize: 12,
    fontWeight: 'bold',
  },
  upcomingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.starC.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  upcomingText: {
    color: Colors.starC.primary,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.starC.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  joinButtonText: {
    color: Colors.starC.background,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  liveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.starC.error,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  liveButtonText: {
    color: Colors.starC.background,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.starC.background,
    borderRadius: 12,
    padding: 20,
    width: 250,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.starC.surface,
  },
  modalOptionText: {
    fontSize: 16,
    color: Colors.starC.text,
    marginLeft: 15,
  },
}); 