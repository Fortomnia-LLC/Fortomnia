import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { configureNotificationHandler } from '../src/lib/notificationService';
import { AppleHealthBackgroundSync } from '../src/components/AppleHealthBackgroundSync';

import {
  AuthProvider,
  useAuth,
} from '../src/providers/AuthProvider';

configureNotificationHandler();

function RootNavigator() {
  const { isLoading, session } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#F59E0B" size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={Boolean(session)}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>

      <Stack.Screen name="reset-password" />
      <Stack.Screen name="confirm-email" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppleHealthBackgroundSync />
      <StatusBar style="light" />
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: '#0B0D10',
    flex: 1,
    justifyContent: 'center',
  },
});

