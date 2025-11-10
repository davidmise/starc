import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { AuthGuard } from '../../components/AuthGuard';
import Colors from '../../constants/Colors';

function TabBarIcon({ name, color }: { name: React.ComponentProps<typeof Ionicons>['name']; color: string }) {
  return <Ionicons size={28} name={name} color={color} />;
}

export default function TabLayout() {
  return (
    <AuthGuard requireAuth={true}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.starC.primary,
          tabBarInactiveTintColor: Colors.starC.textSecondary,
          tabBarStyle: {
            backgroundColor: Colors.starC.background,
            borderTopColor: Colors.starC.surface,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          headerStyle: {
            backgroundColor: Colors.starC.background,
          },
          headerTintColor: Colors.starC.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Events',
            tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: 'Create',
            tabBarIcon: ({ color }) => <TabBarIcon name="add-circle" color={color} />,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Notifications',
            tabBarIcon: ({ color }) => <TabBarIcon name="notifications" color={color} />,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <TabBarIcon name="person" color={color} />,
            headerShown: false,
          }}
        />
      </Tabs>
    </AuthGuard>
  );
}
