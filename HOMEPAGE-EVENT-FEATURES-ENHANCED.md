# Homepage Event Features - Complete Enhancement

## 🎯 **User Request**
> "on homepage if i create an event schedule book button and count down show appear also to other users and if it time for live change all button and add go live for those how have booked"

## ✅ **Complete Implementation**

### **📅 Scheduled Event Features for ALL Users**

#### **Enhanced Booking System**
- **✅ Visible to Everyone**: Booking button appears for **all users** viewing scheduled events
- **✅ Visual Feedback**: Button changes appearance when booked (gold background, checkmark)
- **✅ Real-time Counts**: Shows number of people who have booked
- **✅ Owner vs User View**: Different UI for event owners vs participants

```typescript
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
```

#### **Real-Time Countdown Timer**
- **✅ Live Updates**: Updates every second in real-time
- **✅ Precise Timing**: Shows days, hours, minutes, seconds until event
- **✅ Ready State**: Shows "Ready to go live!" when it's time
- **✅ Visual Indicator**: Special badge when ready to start

```typescript
// Real-time countdown timer for events
useEffect(() => {
  if (isEvent && item.start_time && item.status === 'scheduled') {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }
}, [isEvent, item.start_time, item.status]);

const formatTimeUntil = (scheduledTime: string) => {
  const startTime = new Date(scheduledTime);
  const diff = startTime.getTime() - currentTime.getTime();
  
  if (diff <= 0) {
    return 'Ready to go live!';
  }
  
  // Calculate days, hours, minutes, seconds
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};
```

### **🚀 Enhanced Event Information Display**

#### **Professional Event Card**
- **✅ Enhanced Layout**: Beautiful card with countdown and booking stats
- **✅ Date & Time**: Shows full event schedule information  
- **✅ Ready Badge**: Red "Ready!" badge when it's time to go live
- **✅ Booking Count**: Real-time participant count

```typescript
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
```

### **🔴 Smart Go Live System**

#### **For Event Owners**
- **✅ Go Live Button**: Appears when it's time (5 minutes before to 1 minute after)
- **✅ Confirmation Dialog**: Shows participant count before going live
- **✅ Camera Integration**: Opens professional camera interface
- **✅ Status Update**: Automatically updates event to "live" status

```typescript
const isReadyToGoLive = () => {
  if (!isEvent || !item.start_time || item.status !== 'scheduled') return false;
  const startTime = new Date(item.start_time);
  const diff = startTime.getTime() - currentTime.getTime();
  return diff <= 5 * 60 * 1000 && diff > -60 * 1000; // 5 minutes before to 1 minute after
};

{/* Go Live button - only for event owners when ready */}
{isEvent && item.type === 'event' && isOwner && isReadyToGoLive() && (
  <TouchableOpacity style={[styles.actionButton, styles.goLiveButton]} onPress={handleGoLive}>
    <Ionicons name="radio" size={32} color="#fff" />
    <Text style={[styles.actionText, styles.goLiveText]}>Go Live</Text>
  </TouchableOpacity>
)}
```

#### **For Booked Users**
- **✅ Pre-Event Notifications**: Alert 5 minutes before event can start
- **✅ Live Notifications**: Instant alert when event goes live
- **✅ Direct Join**: One-tap to join live event
- **✅ Priority Access**: Special messaging for booked participants

```typescript
// Notify booked users when it's almost time (5 minutes before)
useEffect(() => {
  if (isEvent && item.status === 'scheduled' && booked && !isOwner && isReadyToGoLive()) {
    Alert.alert(
      '⏰ Event Starting Soon!',
      `"${item.title}" starts in a few minutes. The host can go live anytime now!`,
      [{ text: 'Got it!', style: 'default' }]
    );
  }
}, [isEvent, item.status, booked, isOwner, isReadyToGoLive()]);

// Auto-navigate booked users when event goes live
useEffect(() => {
  if (isEvent && item.status === 'live' && booked && !isOwner) {
    Alert.alert(
      '🔴 Event is Live!',
      `"${item.title}" has started! You have a front-row seat waiting for you.`,
      [
        { text: 'Join Later', style: 'cancel' },
        { text: '🚀 Join Now', onPress: () => handleJoinLive(), style: 'default' }
      ]
    );
  }
}, [item.status, booked]);
```

### **🎨 Enhanced UI Design**

#### **Booking Button States**
- **Default State**: Outline calendar icon with "Book" text
- **Booked State**: Solid gold background with checkmark
- **Loading State**: Disabled with loading indicator
- **Count Display**: Shows participant count below button

#### **Event Information Card**
- **Gold Border**: Subtle gold accent border
- **Transparent Background**: Semi-transparent gold background
- **Icon Integration**: Time and calendar icons
- **Responsive Layout**: Adapts to content length

#### **Ready to Go Live Badge**
- **Red Background**: Eye-catching red badge
- **Radio Icon**: Live streaming icon
- **Animation Ready**: Positioned for attention
- **Context Aware**: Only shows when actually ready

### **⚡ Smart State Management**

#### **Event Timing Logic**
```typescript
const isReadyToGoLive = () => {
  if (!isEvent || !item.start_time || item.status !== 'scheduled') return false;
  const startTime = new Date(item.start_time);
  const diff = startTime.getTime() - currentTime.getTime();
  return diff <= 5 * 60 * 1000 && diff > -60 * 1000; // 5 minutes before to 1 minute after
};
```

#### **User Role Detection**
```typescript
const isOwner = user?.id === item.user_id;
const isEvent = item.type === 'event' || item.start_time;
```

#### **Real-Time Updates**
- **Countdown Timer**: Updates every second
- **Booking Status**: Real-time booking count updates
- **Event Status**: Automatic status transitions
- **Notification Management**: Smart notification timing

## 🎯 **What Users Experience Now**

### **📱 For All Users Viewing Scheduled Events**
1. **Prominent Event Card**: Beautiful countdown timer with event details
2. **Book Button**: Clear booking button with participant count
3. **Real-Time Countdown**: Live countdown showing exact time remaining
4. **Event Details**: Date, time, and booking information
5. **Ready Indicator**: Visual indicator when event is about to start

### **👥 For Users Who Book Events**
1. **Confirmation Feedback**: Visual confirmation when booking successful
2. **Pre-Event Alert**: Notification 5 minutes before event can start
3. **Live Notification**: Instant alert when event goes live
4. **Priority Join**: Direct access to join live event
5. **Special Status**: Different UI showing they're booked

### **🎬 For Event Owners**
1. **Management Controls**: Special owner controls for event
2. **Go Live Button**: Appears when it's time to start
3. **Confirmation Dialog**: Shows participant count before going live
4. **Camera Integration**: Direct access to Go Live camera
5. **Status Management**: Automatic event status updates

### **🔴 When Event Goes Live**
1. **Automatic Notifications**: All booked users get instant alerts
2. **Status Updates**: Event status changes across all instances
3. **Join Buttons**: Live join buttons appear for participants
4. **Owner Access**: Special "Enter Live" button for event owner
5. **Real-Time Sync**: All users see live status immediately

## 🧪 **Test the Complete System**

### **As a Regular User**
1. **View Scheduled Event** → Should see countdown timer and booking button
2. **Book Event** → Button should change to gold "Booked!" state
3. **Wait for Ready Time** → Should see "Ready!" badge when it's time
4. **When Event Goes Live** → Should get notification to join

### **As Event Owner**
1. **Create Scheduled Event** → Should see management controls
2. **Wait for Go Live Time** → Should see "Go Live" button appear
3. **Tap Go Live** → Should get confirmation with participant count
4. **Confirm Go Live** → Should open camera and update event status

### **Expected Results**
- **✅ All users see booking buttons** on scheduled events
- **✅ Real-time countdown timers** update every second
- **✅ Booking counts update** immediately when someone books
- **✅ Go Live notifications** work for booked users
- **✅ Camera opens** when owner goes live
- **✅ Event status updates** across all screens in real-time

Your homepage now provides a complete event management experience with professional booking, countdown, and live streaming capabilities! 🚀📱✨
