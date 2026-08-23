import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { supabase } from '../lib/supabase';

function getAuthValues(url: string) {
  const parameterText = url.includes('#')
    ? url.split('#')[1]
    : url.split('?')[1];
  const params = new URLSearchParams(parameterText ?? '');

  return {
    accessToken: params.get('access_token'),
    code: params.get('code'),
    errorDescription: params.get('error_description'),
    refreshToken: params.get('refresh_token'),
  };
}

export default function ConfirmEmailScreen() {
  const router = useRouter();
  const confirmationUrl = Linking.useURL();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function confirmEmail() {
      if (!confirmationUrl) {
        if (isActive) {
          setErrorMessage('Open this screen from your confirmation email.');
          setIsConfirming(false);
        }
        return;
      }

      const {
        accessToken,
        code,
        errorDescription,
        refreshToken,
      } = getAuthValues(confirmationUrl);

      if (errorDescription) {
        if (isActive) {
          setErrorMessage(errorDescription.replace(/\+/g, ' '));
          setIsConfirming(false);
        }
        return;
      }

      let error: Error | null = null;

      if (code) {
        const result = await supabase.auth.exchangeCodeForSession(code);
        error = result.error;
      } else if (accessToken && refreshToken) {
        const result = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        error = result.error;
      } else {
        error = new Error('The confirmation link is incomplete or expired.');
      }

      if (!isActive) return;

      if (error) {
        setErrorMessage(error.message);
        setIsConfirming(false);
      } else {
        router.replace('/');
      }
    }

    void confirmEmail();

    return () => {
      isActive = false;
    };
  }, [confirmationUrl, router]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>FORTOMNIA</Text>
        <Text style={styles.title}>Confirming your email</Text>

        {isConfirming ? (
          <>
            <ActivityIndicator color="#F59E0B" size="large" />
            <Text style={styles.message}>
              Finishing your account setup…
            </Text>
          </>
        ) : (
          <>
            <Text accessibilityRole="alert" style={styles.error}>
              {errorMessage}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/')}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Return to sign in</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#0B0D10',
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  eyebrow: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 16,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 28,
  },
  message: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 18,
  },
  error: {
    color: '#F87171',
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    marginTop: 24,
    paddingVertical: 15,
  },
  buttonText: {
    color: '#0B0D10',
    fontSize: 16,
    fontWeight: '800',
  },
});
