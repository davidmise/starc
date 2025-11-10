import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { FollowProvider } from '../contexts/FollowContext';
import { SessionsProvider } from '../contexts/SessionsContext';

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'auth',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Only hide splash screen once
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {
        // Ignore splash screen errors
      });
    }
  }, [isLoading]);

  // Memoize the layout to prevent unnecessary re-renders
  const layoutContent = useMemo(() => {
    if (isLoading) {
      return null; // Show splash screen while loading
    }

    if (!isAuthenticated) {
      return (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen 
            name="auth" 
            options={{ 
              headerShown: false,
              gestureEnabled: false,
              animation: 'fade'
            }} 
          />
        </Stack>
      );
    }

    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
            gestureEnabled: false,
            animation: 'slide_from_right'
          }} 
        />
        <Stack.Screen name="live-session" />
        <Stack.Screen name="post-details" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="notification-settings" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="go-live" />
      </Stack>
    );
  }, [isAuthenticated, isLoading]);

  return layoutContent;
}

function AppContent() {
  return (
    <FollowProvider>
      <SessionsProvider>
        <RootLayoutContent />
      </SessionsProvider>
    </FollowProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
