import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  PostHogErrorBoundary,
  type PostHogErrorBoundaryFallbackProps,
  PostHogProvider,
} from 'posthog-react-native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AnalyticsTracker } from '../src/components/AnalyticsTracker';
import { AppleHealthBackgroundSync } from '../src/components/AppleHealthBackgroundSync';
import { getPostHogConfig } from '../src/lib/analytics';
import { configureNotificationHandler } from '../src/lib/notificationService';
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

function ErrorFallback(_props: PostHogErrorBoundaryFallbackProps) {
  return (
    <View style={styles.errorFallback}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>
        Close and reopen Fortomnia. The error was reported automatically.
      </Text>
    </View>
  );
}

function AppContent({ analyticsEnabled }: { analyticsEnabled: boolean }) {
  return (
    <AuthProvider>
      {analyticsEnabled ? <AnalyticsTracker /> : null}
      <AppleHealthBackgroundSync />
      <StatusBar style="light" />
      <RootNavigator />
    </AuthProvider>
  );
}

export default function RootLayout() {
  const postHogConfig = getPostHogConfig();

  if (!postHogConfig) {
    return <AppContent analyticsEnabled={false} />;
  }

  return (
    <PostHogProvider
      apiKey={postHogConfig.apiKey}
      autocapture={{ captureScreens: false, captureTouches: false }}
      options={{
        captureAppLifecycleEvents: true,
        disableGeoip: true,
        enableSessionReplay: false,
        errorTracking: {
          autocapture: {
            console: [],
            uncaughtExceptions: true,
            unhandledRejections: true,
          },
        },
        host: postHogConfig.host,
      }}
    >
      <PostHogErrorBoundary fallback={ErrorFallback}>
        <AppContent analyticsEnabled />
      </PostHogErrorBoundary>
    </PostHogProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: '#0B0D10',
    flex: 1,
    justifyContent: 'center',
  },
  errorFallback: {
    alignItems: 'center',
    backgroundColor: '#0B0D10',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  errorMessage: {
    color: '#A7ADB8',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  errorTitle: {
    color: '#F7F8FA',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
});
