import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Colors from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireAuth = true,
  redirectTo = '/auth'
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('🛡️ AuthGuard - requireAuth:', requireAuth, 'isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);
    
    if (!isLoading && requireAuth && !isAuthenticated) {
      console.log('🚫 Authentication required but user not authenticated, redirecting to:', redirectTo);
      router.replace(redirectTo as any);
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router]);

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.starC.primary} />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }

  // If auth is required but user is not authenticated, show nothing (redirect will happen)
  if (requireAuth && !isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.starC.primary} />
        <Text style={styles.loadingText}>Redirecting to login...</Text>
      </View>
    );
  }

  // If auth is not required OR user is authenticated, show the content
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.starC.background,
  },
  loadingText: {
    color: Colors.starC.textSecondary,
    fontSize: 16,
    marginTop: 15,
    fontWeight: '500',
  },
});