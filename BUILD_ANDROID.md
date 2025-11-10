# Building Android test APK/AAB for Star Corporate

This guide explains two practical ways to build Android test artifacts for your Expo-based app:

1) EAS Build (recommended) — builds cloud-signed AAB/APK and supports managed/workflow
2) Local Android build (advanced) — requires Android Studio and an Android SDK

Prerequisites
- Node.js 18+
- Expo CLI & EAS CLI
- An Expo project configured (see `app.json`)

1) EAS Build (recommended)
---------------------------
EAS is the easiest way to produce production-ready Android builds without managing local Android tooling.

Install EAS CLI:

```powershell
npm install -g eas-cli
eas login
```

Configure `eas.json` — we included a sample `eas.json` in the repo. Update the `production` profile with your `API_URL` and credentials.

Start a production build (AAB recommended for Play Store):

```powershell
cd .. # project root
eas build --platform android --profile production
```

After the build completes, you can download the AAB/APK from the EAS build page.
To install APK on a device for testing:

```powershell
adb install path/to/app.apk
```

To submit to Play Console use `eas submit` or upload the `*.aab` manually.

2) Local Android Build (if not using EAS)
----------------------------------------
This path requires the project to be prebuilt (expo prebuild / eject) and Android Studio.

Steps (summary):

1. Install Android Studio and Android SDK, set ANDROID_HOME environment variable.
2. Prebuild native Android project (if using managed Expo):

```powershell
npx expo prebuild --platform android
```

3. Open `android/` in Android Studio, build an APK or AAB via Build > Build Bundle(s) / APK(s).
4. Optionally use Gradle from CLI:

```powershell
cd android
./gradlew assembleRelease    # generates release APK
./gradlew bundleRelease      # generates release AAB
```

Notes & Tips
- If using EAS you don’t need local Android Studio — EAS handles signing and provisioning.
- For Play Store testing, prefer `AAB` (bundle) and use internal testing track in Play Console.
- For quick testing on devices, generate an unsigned or debug APK and install via `adb`.
- Ensure your `app.json` contains `android.package` and correct `expo.extra.API_URL` pointing to your deployed backend (VPS).

Setting backend URL for testing
-------------------------------
Edit `app.json` or the environment the app reads from and set `extra.apiUrl` to your VPS's public domain or IP (use HTTPS):

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://api.yourdomain.com"
    }
  }
}
```

Troubleshooting
- If Socket.IO connections fail, check Nginx proxy config and ensure `upgrade` headers are forwarded.
- If push notifications required for Android testing, configure FCM and add `google-services.json` to the app.

Security
- Do not hardcode secrets in `app.json`. Use EAS secrets or environment-specific config during build.

That’s it — pick EAS for speed and simplicity, or local builds if you need deeper native debugging.
