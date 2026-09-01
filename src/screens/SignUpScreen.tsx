import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { getAuthErrorMessage } from '../lib/authErrorMessage';

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignUp() {
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmation) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: Linking.createURL('confirm-email', { scheme: 'fortomnia' }) },
      });

      if (error) {
        setErrorMessage(getAuthErrorMessage(error, 'sign-up'));
        return;
      }

      if (!data.session) {
        Alert.alert(
          'Check your email',
          'Open the confirmation email from Fortomnia, then return to sign in.',
          [{ text: 'OK', onPress: () => router.back() }],
        );
      }
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, 'sign-up'));
    } finally {
      setIsSubmitting(false);
    }
  }

  const isDisabled =
    !email.trim() ||
    !password ||
    !confirmation ||
    isSubmitting;

  return (
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={styles.content}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          >
          <View style={styles.form}>
        <Text maxFontSizeMultiplier={1.4} style={styles.eyebrow}>FORTOMNIA</Text>
        <Text maxFontSizeMultiplier={1.4} style={styles.title}>Create account</Text>
        <Text maxFontSizeMultiplier={1.4} style={styles.subtitle}>
          Start tracking your training and progress.
        </Text>

        <TextInput maxFontSizeMultiplier={1.4}
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

        <TextInput maxFontSizeMultiplier={1.4}
          accessibilityLabel="Password"
          autoCapitalize="none"
          autoComplete="new-password"
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#727885"
          secureTextEntry
          style={styles.input}
          value={password}
        />

        <TextInput maxFontSizeMultiplier={1.4}
          accessibilityLabel="Confirm password"
          autoCapitalize="none"
          autoComplete="new-password"
          onChangeText={setConfirmation}
          placeholder="Confirm password"
          placeholderTextColor="#727885"
          secureTextEntry
          style={styles.input}
          value={confirmation}
        />

        {errorMessage ? (
          <Text maxFontSizeMultiplier={1.4}
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={styles.error}
          >
            {errorMessage}
          </Text>
        ) : null}

        <Pressable
          accessibilityLabel="Create account"
          accessibilityRole="button"
          accessibilityState={{
            busy: isSubmitting,
            disabled: isDisabled,
          }}
          disabled={isDisabled}
          onPress={handleSignUp}
          style={[styles.button, isDisabled && styles.buttonDisabled]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#0B0D10" />
          ) : (
            <Text maxFontSizeMultiplier={1.4} style={styles.buttonText}>Create account</Text>
          )}
        </Pressable>

        <Pressable
          accessibilityLabel="Already have an account? Sign in"
          accessibilityRole="link"
           onPress={() => router.back()} style={styles.link}>
          <Text maxFontSizeMultiplier={1.4} style={styles.linkText}>Already have an account? Sign in</Text>
        </Pressable>
                  </View>
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
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  form: {
    maxWidth: 560,
    width: '100%',
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
    backgroundColor: '#2563EB',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: '#0B0D10',
    fontSize: 16,
    fontWeight: '800',
  },
  link: {
    alignItems: 'center',
    marginTop: 22,
    paddingVertical: 8,
  },
  linkText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '600',
  },
});
