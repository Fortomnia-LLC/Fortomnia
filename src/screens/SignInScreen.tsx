import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';

import { supabase } from '../../src/lib/supabase';
import { getAuthErrorMessage } from '../../src/lib/authErrorMessage';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignIn() {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(getAuthErrorMessage(error, 'sign-in'));
      }
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, 'sign-in'));
    } finally {
      setIsSubmitting(false);
    }
  }

  const isDisabled = !email.trim() || !password || isSubmitting;

  return (
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          >
        <Text style={styles.eyebrow}>FORTOMNIA</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>
          Strength in Everything.
        </Text>

        <TextInput
          accessibilityLabel="Email address"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#727885"
          style={styles.input}
          value={email}
        />

        <TextInput
          accessibilityLabel="Password"
          autoCapitalize="none"
          autoComplete="password"
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#727885"
          secureTextEntry
          style={styles.input}
          value={password}
        />

        {errorMessage ? (
          <Text
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={styles.error}
          >
            {errorMessage}
          </Text>
        ) : null}

        <Pressable
          accessibilityLabel="Sign in"
          accessibilityRole="button"
          accessibilityState={{
            busy: isSubmitting,
            disabled: isDisabled,
          }}
          disabled={isDisabled}
          onPress={handleSignIn}
          style={[styles.button, isDisabled && styles.buttonDisabled]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#0B0D10" />
          ) : (
            <Text style={styles.buttonText}>Sign in</Text>
          )}
        </Pressable>
             <Link href="/sign-up" asChild>
          <Pressable
              accessibilityLabel="Create an account"
              accessibilityRole="link"
            style={{
              alignItems: 'center',
              marginTop: 22,
              paddingVertical: 8,
            }}
          >
            <Text
              style={{
                color: '#F59E0B',
                fontSize: 15,
                fontWeight: '600',
              }}
            >
              Create an account
            </Text>
          </Pressable>
        </Link>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0B0D10',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
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
    fontSize: 36,
    fontWeight: '800',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#171A20',
    borderColor: '#2A2F39',
    borderRadius: 12,
    borderWidth: 1,
    color: '#F8FAFC',
    fontSize: 16,
    marginBottom: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  error: {
    color: '#F87171',
    marginBottom: 14,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    minHeight: 52,
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: '#0B0D10',
    fontSize: 16,
    fontWeight: '800',
  },
});
