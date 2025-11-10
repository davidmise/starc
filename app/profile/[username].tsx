import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Colors from '../../constants/Colors';

export default function DynamicProfileScreen() {
  const { username } = useLocalSearchParams();
  // Mock user data
  const user = {
    username: `@${username}`,
    displayName: 'Star User',
    avatar: 'https://via.placeholder.com/100/FFD700/000000?text=S',
    bio: 'This is a mock profile for ' + username,
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
        <Text style={styles.displayName}>{user.displayName}</Text>
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.bio}>{user.bio}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.starC.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.starC.text,
    marginBottom: 8,
  },
  username: {
    fontSize: 16,
    color: Colors.starC.textSecondary,
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: Colors.starC.text,
    textAlign: 'center',
    marginTop: 10,
  },
}); 