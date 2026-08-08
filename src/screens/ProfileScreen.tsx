import { useEffect, useState } from "react";
import {
  Alert,
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
import { useProfile } from "../hooks/useProfile";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

type WeightUnit = "lb" | "kg";

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const {
    errorMessage: profileError,
    isLoading,
    profile,
    refreshProfile,
  } = useProfile();

  const [displayName, setDisplayName] = useState("");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("lb");
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    setDisplayName(profile.display_name ?? "");
    setWeightUnit(profile.preferred_weight_unit);
  }, [profile]);

  async function handleSave() {
    const trimmedName = displayName.trim();

    if (!session?.user.id) {
      setStatusMessage("No authenticated user was found.");
      return;
    }

    if (!trimmedName) {
      setStatusMessage("Display name is required.");
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: trimmedName,
        preferred_weight_unit: weightUnit,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.user.id);

    if (error) {
      setStatusMessage(error.message);
    } else {
      await refreshProfile();
      setStatusMessage("Profile saved.");
    }

    setIsSaving(false);
  }
function handleSignOut() {
  Alert.alert(
    "Sign out?",
    "You will need to sign in again to access your private data.",
    [
      {
        style: "cancel",
        text: "Cancel",
      },
      {
        style: "destructive",
        text: "Sign out",
        onPress: async () => {
          setIsSigningOut(true);

          try {
            await signOut();
          } catch (error) {
            Alert.alert(
              "Unable to sign out",
              error instanceof Error
                ? error.message
                : "An unexpected error occurred.",
            );
          } finally {
            setIsSigningOut(false);
          }
        },
      },
    ],
  );
}
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color="#F97316" size="large" />
      </SafeAreaView>
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
        <Text style={styles.eyebrow}>IRONFORGE</Text>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>
          Personalize how IronForge tracks your progress.
        </Text>

        <Text style={styles.label}>Display name</Text>
        <TextInput
          accessibilityLabel="Display name"
          autoCapitalize="words"
          onChangeText={setDisplayName}
          placeholder="Your name"
          placeholderTextColor="#727885"
          style={styles.input}
          value={displayName}
        />

        <Text style={styles.label}>Preferred weight unit</Text>

        <View style={styles.unitRow}>
          {(["lb", "kg"] as WeightUnit[]).map((unit) => {
            const isSelected = weightUnit === unit;

            return (
              <Pressable
                  accessibilityLabel={`Use ${unit === "lb" ? "pounds" : "kilograms"}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                key={unit}
                onPress={() => setWeightUnit(unit)}
                style={[
                  styles.unitButton,
                  isSelected && styles.unitButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.unitText,
                    isSelected && styles.unitTextSelected,
                  ]}
                >
                  {unit.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {profileError ? (
            <Text
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
              style={styles.error}
            >
              {profileError}
            </Text>
        ) : null}

        {statusMessage ? (
            <Text
              accessibilityLiveRegion="polite"
              style={styles.status}
            >
              {statusMessage}
            </Text>
        ) : null}

        <Pressable
          accessibilityLabel="Save profile"
          accessibilityRole="button"
          accessibilityState={{
            busy: isSaving,
            disabled: isSaving,
          }}
          disabled={isSaving}
          onPress={handleSave}
          style={[styles.saveButton, isSaving && styles.disabled]}
        >
          {isSaving ? (
            <ActivityIndicator color="#0B0B0B" />
          ) : (
            <Text style={styles.saveText}>Save profile</Text>
          )}
        </Pressable>

 <Pressable
          accessibilityLabel="Sign out"
          accessibilityRole="button"
          accessibilityState={{
            busy: isSigningOut,
            disabled: isSaving || isSigningOut,
          }}
          disabled={isSaving || isSigningOut}
          onPress={handleSignOut}
          style={[
            styles.signOutButton,
            (isSaving || isSigningOut) && styles.disabled,
          ]}
        >
          {isSigningOut ? (
            <ActivityIndicator color="#F97316" />
          ) : (
            <Text style={styles.signOutText}>Sign out</Text>
          )}
        </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: "center",
    backgroundColor: "#0B0B0B",
    flex: 1,
    justifyContent: "center",
  },
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
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  unitRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  unitButton: {
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderColor: "#333333",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 14,
  },
  unitButtonSelected: {
    backgroundColor: "#F97316",
    borderColor: "#F97316",
  },
  unitText: {
    color: "#9CA3AF",
    fontSize: 15,
    fontWeight: "700",
  },
  unitTextSelected: {
    color: "#0B0B0B",
  },
  error: {
    color: "#F87171",
    marginBottom: 14,
  },
  status: {
    color: "#D1D5DB",
    marginBottom: 14,
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 52,
  },
  disabled: {
    opacity: 0.5,
  },
  saveText: {
    color: "#0B0B0B",
    fontSize: 16,
    fontWeight: "800",
  },
  signOutButton: {
    alignItems: "center",
    borderColor: "#F97316",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    paddingVertical: 14,
  },
  signOutText: {
    color: "#F97316",
    fontSize: 16,
    fontWeight: "600",
  },
});
