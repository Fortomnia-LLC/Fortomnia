import { useRouter } from "expo-router";
import { useState } from "react";
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
} from "react-native";

import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

export default function NewWorkoutScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleCreateWorkout() {
    const trimmedName = name.trim();

    if (!session?.user.id) {
      setErrorMessage("No authenticated user was found.");
      return;
    }

    if (!trimmedName) {
      setErrorMessage("Workout name is required.");
      return;
    }

    setIsCreating(true);
    setErrorMessage(null);

    const { error } = await supabase
      .from("workout_sessions")
      .insert({
        name: trimmedName,
        user_id: session.user.id,
      });

    setIsCreating(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    Alert.alert(
      "Workout started",
      `${trimmedName} was created successfully.`,
      [
  {
    text: "OK",
    onPress: () => router.replace("/training"),
  },
],
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
        <Text style={styles.eyebrow}>FORTOMNIA</Text>
        <Text style={styles.title}>Start workout</Text>
        <Text style={styles.subtitle}>
          Name today&apos;s session. Exercises and sets come next.
        </Text>

        <Text style={styles.label}>Workout name</Text>
        <TextInput
          autoCapitalize="words"
          autoFocus
          onChangeText={setName}
          placeholder="Push Day, Leg Day, Upper Body..."
          placeholderTextColor="#727885"
          accessibilityLabel="Workout name"
          style={styles.input}
          value={name}
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
          accessibilityLabel="Start workout"
          accessibilityRole="button"
          accessibilityState={{
            busy: isCreating,
            disabled: isCreating,
          }}
          disabled={isCreating}
          onPress={handleCreateWorkout}
          style={[
            styles.createButton,
            isCreating && styles.disabled,
          ]}
        >
          {isCreating ? (
            <ActivityIndicator color="#0B0B0B" />
          ) : (
            <Text style={styles.createText}>Start workout</Text>
          )}
        </Pressable>

        <Pressable
          accessibilityLabel="Cancel new workout"
          accessibilityRole="button"
          accessibilityState={{ disabled: isCreating }}
          disabled={isCreating}
          onPress={() => router.back()}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#0B0B0B",
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 36,
  },
   eyebrow: {
    color: "#F97316",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 12,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
    marginTop: 8,
  },
  label: {
    color: "#D1D5DB",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1A1A1A",
    borderColor: "#333333",
    borderRadius: 12,
    borderWidth: 1,
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  error: {
    color: "#F87171",
    marginBottom: 14,
  },
  createButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 52,
  },
  disabled: {
    opacity: 0.5,
  },
  createText: {
    color: "#0B0B0B",
    fontSize: 16,
    fontWeight: "800",
  },
  cancelButton: {
    alignItems: "center",
    marginTop: 14,
    paddingVertical: 12,
  },
  cancelText: {
    color: "#9CA3AF",
    fontSize: 16,
    fontWeight: "600",
  },
});
