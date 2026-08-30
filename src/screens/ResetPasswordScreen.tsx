import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
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
  View,
} from "react-native";

import { supabase } from "../lib/supabase";

function getRecoveryValues(url: string) {
  const parameterText = url.includes("#")
    ? url.split("#")[1]
    : url.split("?")[1];
  const params = new URLSearchParams(parameterText ?? "");

  return {
    accessToken: params.get("access_token"),
    code: params.get("code"),
    errorDescription: params.get("error_description"),
    refreshToken: params.get("refresh_token"),
  };
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const recoveryUrl = Linking.useURL();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecoveryReady, setIsRecoveryReady] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function prepareRecovery() {
      if (!recoveryUrl) {
        if (isActive) {
          setErrorMessage("Open this screen from the password reset email.");
          setIsPreparing(false);
        }
        return;
      }

      const {
        accessToken,
        code,
        errorDescription,
        refreshToken,
      } = getRecoveryValues(recoveryUrl);

      if (errorDescription) {
        if (isActive) {
          setErrorMessage(errorDescription.replace(/\+/g, " "));
          setIsPreparing(false);
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
        error = new Error("The password reset link is incomplete or expired.");
      }

      if (!isActive) return;

      if (error) {
        setErrorMessage(error.message);
      } else {
        setIsRecoveryReady(true);
      }

      setIsPreparing(false);
    }

    void prepareRecovery();

    return () => {
      isActive = false;
    };
  }, [recoveryUrl]);

  async function handleUpdatePassword() {
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmation) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    await supabase.auth.signOut();
    router.replace("/");
  }

  const isDisabled =
    !isRecoveryReady || !password || !confirmation || isSaving;

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
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
          <Text maxFontSizeMultiplier={1.4} style={styles.title}>Reset password</Text>
          <Text maxFontSizeMultiplier={1.4} style={styles.subtitle}>
            Choose a new password with at least eight characters.
          </Text>

          {isPreparing ? (
            <ActivityIndicator color="#F59E0B" size="large" />
          ) : null}

          {isRecoveryReady ? (
            <>
              <TextInput maxFontSizeMultiplier={1.4}
                accessibilityLabel="New password"
                autoCapitalize="none"
                autoComplete="new-password"
                onChangeText={setPassword}
                placeholder="New password"
                placeholderTextColor="#727885"
                secureTextEntry
                style={styles.input}
                value={password}
              />

              <TextInput maxFontSizeMultiplier={1.4}
                accessibilityLabel="Confirm new password"
                autoCapitalize="none"
                autoComplete="new-password"
                onChangeText={setConfirmation}
                placeholder="Confirm new password"
                placeholderTextColor="#727885"
                secureTextEntry
                style={styles.input}
                value={confirmation}
              />

              <Pressable
                accessibilityLabel="Update password"
                accessibilityRole="button"
                accessibilityState={{
                  busy: isSaving,
                  disabled: isDisabled,
                }}
                disabled={isDisabled}
                onPress={handleUpdatePassword}
                style={[styles.button, isDisabled && styles.buttonDisabled]}
              >
                {isSaving ? (
                  <ActivityIndicator color="#0B0D10" />
                ) : (
                  <Text maxFontSizeMultiplier={1.4} style={styles.buttonText}>Update password</Text>
                )}
              </Pressable>
            </>
          ) : null}

          {errorMessage ? (
            <Text maxFontSizeMultiplier={1.4}
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
              style={styles.error}
            >
              {errorMessage}
            </Text>
          ) : null}

          {!isPreparing && !isRecoveryReady ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace("/")}
              style={styles.backButton}
            >
              <Text maxFontSizeMultiplier={1.4} style={styles.backButtonText}>Return to sign in</Text>
            </Pressable>
          ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#0B0D10",
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  form: {
    maxWidth: 560,
    width: '100%',
  },
  eyebrow: {
    color: "#F59E0B",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 16,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 36,
    fontWeight: "800",
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 16,
    marginBottom: 28,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#171A20",
    borderColor: "#2A2F39",
    borderRadius: 12,
    borderWidth: 1,
    color: "#F8FAFC",
    fontSize: 16,
    marginBottom: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 52,
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: "#0B0D10",
    fontSize: 16,
    fontWeight: "800",
  },
  error: {
    color: "#F87171",
    marginTop: 14,
  },
  backButton: {
    alignItems: "center",
    marginTop: 18,
    paddingVertical: 10,
  },
  backButtonText: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "600",
  },
});
