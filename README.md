# Star Corporate (StarC) - React Native App

A TikTok-like social media app with custom branding and live event functionality, built with React Native and Expo.

## 🎨 Theme & Branding

- **App Name**: Star Corporate
- **Primary Colors**: Black (background, primary surfaces) and Gold (accent, icons, highlights)
- **App Icon**: Star symbol in gold
- **Framework**: React Native (Expo)
- **Styling**: React Native StyleSheet (no Tailwind CSS or Babel plugins)

## ✅ Core Features Implemented

### 🎥 Event (Live Session) Scheduling
- **Create Event Page**: Complete form with all required fields
  - Genre selection (Music, Dance, Comedy, Stars, Talk, Other)
  - Caption/description input
  - Date and time picker
  - Duration selection
  - **Required** poster/clip upload functionality
  - Confirmation modal with preview

### ⏱ Live Countdown Timer
- **Real-time countdown** for scheduled events
- Shows days, hours, minutes, and seconds remaining
- **Alert system** when event is about to start (5 minutes warning)
- "LIVE NOW!" indicator when countdown reaches zero
- Integrated into home feed and create screen

### ⭐ Like and Unlike System
- **Gold star icon** for likes (consistent with branding)
- Like/unlike functionality for posts and event posters
- **Real-time like count** updates
- Visual feedback with star fill/outline states
- Works across all screens (home, explore, post details)

### 💬 Comment & Delete Comment
- **Full commenting system** on posts/events
- Users can delete their own comments
- **Real-time comment count** display
- Comment threading and replies
- **Booked user indicators** in live sessions

### 📌 Book and Unbook Event
- **Booking functionality** with calendar icon
- Users can book or unbook events
- **Booking count** display for creators
- "Already Booked" alerts for duplicate bookings
- Visual feedback with gold highlight for booked events

### 👥 Auto Join Booked Users
- **Automatic inclusion** of booked users when event goes live
- **Auto-join statistics** display in live sessions
- Booked user badges in live comments
- Real-time tracking of joined vs. total booked users

### 🗂 Save Poster or Video
- **Save functionality** with bookmark icon
- Users can save posts for later viewing
- **Visual feedback** with filled/outlined bookmark states
- Saved posts accessible in profile section

### 🧑‍🎤 Edit Profile
- **Complete profile editing** screen
- Edit name, bio, and profile picture
- **Image picker** integration for avatar upload
- Character count limits and validation
- **Cancel/Save** functionality with confirmation

### ❌ Cancel or Delete Event
- **Event creators** can cancel upcoming events (before start)
- **Delete functionality** for posted clips/posters if event is cancelled
- **Confirmation dialogs** for destructive actions
- **Status indicators** (Cancelled, Live, Upcoming)

### 🟡 Live Event Interaction
- **Real-time interactions** during live sessions
- Viewers can comment and react using gold stars
- **Live interaction counts** shown in real-time
- **Auto-join system** for booked users
- **Live indicators** and viewer counts

## 📱 Screen-by-Screen Features

### Home Screen (`app/(tabs)/index.tsx`)
- ✅ Vertical video feed with TikTok-like interface
- ✅ Like, comment, share, save, and book actions
- ✅ Live session indicators and join buttons
- ✅ Scheduled event countdown timers
- ✅ Booking functionality with real-time updates
- ✅ User profile navigation

### Explore Screen (`app/(tabs)/explore.tsx`)
- ✅ Category-based content discovery
- ✅ Trending posts grid layout
- ✅ Post popup with full interaction options
- ✅ Live session discovery
- ✅ Search functionality

### Create Screen (`app/(tabs)/create.tsx`)
- ✅ **Complete event scheduling form**
- ✅ Genre selection with modal picker
- ✅ Date/time picker integration
- ✅ **Required media upload** (poster/clip)
- ✅ **Countdown timer** for scheduled events
- ✅ **Event management** (cancel/delete)
- ✅ **Booking statistics** display

### Notifications Screen (`app/(tabs)/notifications.tsx`)
- ✅ **Comprehensive notification system**
- ✅ Like, comment, follow, live, and booking notifications
- ✅ **Mark all read** functionality
- ✅ **Notification settings** navigation
- ✅ **Unread count** badges

### Profile Screen (`app/(tabs)/profile.tsx`)
- ✅ **User profile** with stats and posts
- ✅ **Edit profile** navigation
- ✅ **Settings** access
- ✅ **Post grid** with live indicators
- ✅ **Booking statistics**

### Live Session Screen (`app/live-session.tsx`)
- ✅ **Real-time live streaming** interface
- ✅ **Auto-join** for booked users
- ✅ **Live comments** with booked user indicators
- ✅ **Real-time interaction** counts
- ✅ **Session management** (start/end)
- ✅ **Countdown timer** before going live

### Post Details Screen (`app/post-details.tsx`)
- ✅ **Full post view** with all interactions
- ✅ **Comment system** with like/reply
- ✅ **Share and save** functionality
- ✅ **User navigation** to profiles

### Edit Profile Screen (`app/edit-profile.tsx`)
- ✅ **Complete profile editing**
- ✅ **Image picker** for avatar
- ✅ **Form validation** and character limits
- ✅ **Save/Cancel** with confirmation

### Settings Screen (`app/settings.tsx`)
- ✅ **Account settings** management
- ✅ **Notification preferences**
- ✅ **App settings** (dark mode, auto-play)
- ✅ **Support and help** options
- ✅ **Account actions** (logout, delete)

### Notification Settings Screen (`app/notification-settings.tsx`)
- ✅ **Granular notification controls**
- ✅ **Push, live, like, comment, follow** notifications
- ✅ **Email notification** settings
- ✅ **Account management** access

## 🎯 Additional Features

### Navigation & Routing
- ✅ **Expo Router** with typed routes
- ✅ **Tab navigation** with custom styling
- ✅ **Modal presentations** for forms
- ✅ **Deep linking** support

### State Management
- ✅ **Local state** for all interactions
- ✅ **Real-time updates** for likes, comments, bookings
- ✅ **Form state** management
- ✅ **Modal state** handling

### UI/UX Features
- ✅ **Responsive design** for all screen sizes
- ✅ **Dark theme** with black and gold branding
- ✅ **Haptic feedback** integration
- ✅ **Loading states** and error handling
- ✅ **Confirmation dialogs** for destructive actions

### Media Handling
- ✅ **Image picker** for profile pictures
- ✅ **Media upload** for event posters/clips
- ✅ **Image preview** and validation
- ✅ **Placeholder images** for development

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Run on device/simulator**:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app

## 📱 App Structure

```
StarsC/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation screens
│   ├── _layout.tsx        # Root layout
│   ├── edit-profile.tsx   # Profile editing
│   ├── live-session.tsx   # Live streaming
│   ├── post-details.tsx   # Post details
│   └── settings.tsx       # App settings
├── components/             # Reusable components
│   ├── CountdownTimer.tsx # Event countdown
│   └── EventManager.tsx   # Event management
├── constants/              # App constants
│   └── Colors.ts          # Theme colors
└── assets/                # Static assets
```

## 🎨 Design System

### Colors
- **Primary**: `#FFD700` (Gold)
- **Background**: `#000000` (Black)
- **Surface**: `#111111` (Dark Gray)
- **Text**: `#FFFFFF` (White)
- **Text Secondary**: `#CCCCCC` (Light Gray)

### Icons
- **Likes**: Gold star (filled/outline)
- **Comments**: Chat bubble
- **Shares**: Share icon
- **Saves**: Bookmark (filled/outline)
- **Bookings**: Calendar icon
- **Live**: Radio/antenna icon

## ✅ Ready for Backend Integration

All frontend components are **production-ready** with:
- ✅ **Complete state management**
- ✅ **Form validation** and error handling
- ✅ **Real-time interactions**
- ✅ **Responsive design**
- ✅ **Accessibility considerations**
- ✅ **Performance optimizations**

The app is ready for backend API integration with proper data flow and state management patterns already implemented.

## 🔧 Technical Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **Styling**: React Native StyleSheet
- **Icons**: Expo Vector Icons
- **Image Picker**: Expo Image Picker
- **Date Picker**: React Native Community DateTimePicker
- **TypeScript**: Full type safety

---

**Star Corporate** - Where stars shine brightest! ⭐✨
#   s t a r c  
 #   s t a r c  
 #   s t a r c  
 