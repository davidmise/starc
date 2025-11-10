# STARS Corporate APK Build Guide

## Quick Start - EAS Build (Cloud) - RECOMMENDED

This is the easiest method and doesn't require Android Studio setup.

### Step 1: Create Expo Account
1. Go to https://expo.dev/signup
2. Create a free account
3. Verify your email

### Step 2: Login to EAS
```bash
eas login
# Enter your Expo account credentials
```

### Step 3: Configure Project (Already Done)
Your `eas.json` is configured for APK builds. The `apk-test` profile will create APKs for testing.

### Step 4: Build APK
```bash
# Build test APK
eas build --platform android --profile apk-test

# OR build production APK
eas build --platform android --profile production
```

### Step 5: Download APK
- After build completes, EAS will provide a download link
- Download the APK file
- Install on your Android device using: `adb install path/to/app.apk`

## Alternative - Local Build (Advanced)

If you prefer local builds or can't use EAS cloud builds:

### Prerequisites
1. Install Android Studio
2. Set up Android SDK
3. Configure environment variables

### Steps
1. **Prebuild for Android:**
```bash
npx expo prebuild --platform android
```

2. **Build APK locally:**
```bash
cd android
./gradlew assembleRelease  # For release APK
# OR
./gradlew assembleDebug    # For debug APK
```

3. **Find APK:**
- Release: `android/app/build/outputs/apk/release/app-release.apk`
- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`

## Current Configuration

### App Details
- **Package:** com.starscorporate.stars
- **Version:** 1.0.0
- **Build:** 1

### Build Profiles (eas.json)
- `development`: Development client build
- `preview`: Internal preview with APK output
- `production`: Production build with APK output
- `apk-test`: Dedicated testing APK profile

## Installing APK on Device

### Method 1: ADB (if you have Android SDK)
```bash
adb install path/to/app.apk
```

### Method 2: Direct Install
1. Transfer APK to your Android device
2. Enable "Install from unknown sources" in device settings
3. Tap the APK file to install

### Method 3: Google Drive/Cloud
1. Upload APK to Google Drive
2. Download on your Android device
3. Install directly

## Troubleshooting

### EAS Authentication Issues
- Make sure you have a valid Expo account
- Try: `eas logout` then `eas login`
- Check your internet connection

### Build Fails
- Check your `app.json` configuration
- Ensure all required assets exist (icons, splash screens)
- Check the build logs for specific errors

### APK Won't Install
- Make sure "Install from unknown sources" is enabled
- Check Android version compatibility
- Try uninstalling any previous version first

## Next Steps

1. **Create Expo Account:** https://expo.dev/signup
2. **Run:** `eas login`
3. **Build:** `eas build --platform android --profile apk-test`
4. **Download and test your APK!**

## Backend Configuration

Your app is configured to connect to:
- Local dev: `http://192.168.81.194:5000`
- For production APK, update the backend URL in your app to point to your deployed server

## Support

If you encounter issues:
1. Check the Expo documentation: https://docs.expo.dev/build/setup/
2. Review build logs in the EAS dashboard
3. Make sure your backend server is running and accessible