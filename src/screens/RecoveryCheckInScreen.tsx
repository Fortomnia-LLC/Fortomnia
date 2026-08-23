import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
} from "react-native";

import { useProfile } from "../hooks/useProfile";
import { useRecoveryCheckIns } from "../hooks/useRecoveryCheckIns";
import { getLocalDateKey } from "../lib/dates";
import { calculateReadiness } from "../lib/readiness";

type RatingFieldProps = {
  highLabel: string;
  label: string;
  lowLabel: string;
  onChange: (value: number) => void;
  value: number;
};

const ratingOptions = [1, 2, 3, 4, 5];

function RatingField({
  highLabel,
  label,
  lowLabel,
  onChange,
  value,
}: RatingFieldProps) {
  return (
    <View style={styles.ratingField}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.ratingRow}>
        {ratingOptions.map((option) => {
          const selected = option === value;

          return (
            <Pressable
              accessibilityLabel={`${label}: ${option} of 5`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={option}
              onPress={() => onChange(option)}
              style={[
                styles.ratingButton,
                selected && styles.ratingButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.ratingButtonText,
                  selected && styles.ratingButtonTextSelected,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.ratingLabels}>
        <Text style={styles.ratingLabel}>{lowLabel}</Text>
        <Text style={styles.ratingLabel}>{highLabel}</Text>
      </View>
    </View>
  );
}

export default function RecoveryCheckInScreen() {
  const router = useRouter();
  const today = getLocalDateKey();
  const {
    currentDay,
    errorMessage,
    isLoading,
    isSaving,
    saveRecoveryCheckIn,
  } = useRecoveryCheckIns(today);
  const { isLoading: profileLoading, profile } = useProfile();

  const [sleepHours, setSleepHours] = useState("");
  const [sleepQuality, setSleepQuality] = useState(3);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [muscleSoreness, setMuscleSoreness] = useState(3);
  const [stressLevel, setStressLevel] = useState(3);
  const [mood, setMood] = useState(3);
  const [bodyWeight, setBodyWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const preferredWeightUnit =
    currentDay?.body_weight_unit ??
    profile?.preferred_weight_unit ??
    "lb";

  useEffect(() => {
    if (!currentDay) return;

    setSleepHours(
      Number((currentDay.sleep_duration_minutes / 60).toFixed(2)).toString(),
    );
    setSleepQuality(currentDay.sleep_quality);
    setEnergyLevel(currentDay.energy_level);
    setMuscleSoreness(currentDay.muscle_soreness);
    setStressLevel(currentDay.stress_level);
    setMood(currentDay.mood);
    setBodyWeight(currentDay.body_weight?.toString() ?? "");
    setNotes(currentDay.notes ?? "");
  }, [currentDay?.id]);

  async function handleSave() {
    setFormError(null);

    const parsedSleepHours = Number(sleepHours);

    if (
      !Number.isFinite(parsedSleepHours) ||
      parsedSleepHours <= 0 ||
      parsedSleepHours > 24
    ) {
      setFormError("Enter sleep duration between 0 and 24 hours.");
      return;
    }

    const trimmedWeight = bodyWeight.trim();
    const parsedWeight = trimmedWeight ? Number(trimmedWeight) : null;

    if (
      parsedWeight !== null &&
      (!Number.isFinite(parsedWeight) ||
        parsedWeight < 20 ||
        parsedWeight > 1500)
    ) {
      setFormError("Enter a valid body weight between 20 and 1500.");
      return;
    }

    const sleepDurationMinutes = Math.round(parsedSleepHours * 60);
    const saved = await saveRecoveryCheckIn({
      bodyWeight: parsedWeight,
      bodyWeightUnit: parsedWeight === null ? null : preferredWeightUnit,
      checkinDate: today,
      energyLevel,
      mood,
      muscleSoreness,
      notes: notes.trim() || null,
      sleepDurationMinutes,
      sleepQuality,
      stressLevel,
    });

    if (!saved) return;

    const readiness = calculateReadiness({
      energyLevel,
      mood,
      muscleSoreness,
      sleepDurationMinutes,
      sleepQuality,
      stressLevel,
    });

    Alert.alert(
      currentDay ? "Recovery updated" : "Recovery saved",
      `${readiness.label}: ${readiness.score}/100\n\n${readiness.recommendation}`,
      [{ text: "OK", onPress: () => router.back() }],
    );
  }

  if ((isLoading || profileLoading) && !currentDay) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color="#F97316" size="large" />
      </SafeAreaView>
    );
  }

  const displayedError = formError ?? errorMessage;

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
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.navigation}
          >
            <Text style={styles.navigationText}>‹ Back</Text>
          </Pressable>

          <Text style={styles.eyebrow}>FORTOMNIA</Text>
          <Text style={styles.title}>Recovery check-in</Text>
          <Text style={styles.subtitle}>
            Record today&apos;s recovery signals. This score supports training
            planning and is not medical advice.
          </Text>

          <View style={styles.dateCard}>
            <Text style={styles.dateLabel}>TODAY</Text>
            <Text style={styles.dateText}>
              {new Date(`${today}T12:00:00`).toLocaleDateString(undefined, {
                dateStyle: "full",
              })}
            </Text>
          </View>

          <Text style={styles.label}>Sleep duration</Text>
          <TextInput
            accessibilityLabel="Sleep duration in hours"
            keyboardType="decimal-pad"
            onChangeText={setSleepHours}
            placeholder="Hours, for example 7.5"
            placeholderTextColor="#727885"
            style={styles.input}
            value={sleepHours}
          />

          <RatingField
            highLabel="Excellent"
            label="Sleep quality"
            lowLabel="Poor"
            onChange={setSleepQuality}
            value={sleepQuality}
          />

          <RatingField
            highLabel="High"
            label="Energy"
            lowLabel="Depleted"
            onChange={setEnergyLevel}
            value={energyLevel}
          />

          <RatingField
            highLabel="Severe"
            label="Muscle soreness"
            lowLabel="Minimal"
            onChange={setMuscleSoreness}
            value={muscleSoreness}
          />

          <RatingField
            highLabel="High"
            label="Stress"
            lowLabel="Low"
            onChange={setStressLevel}
            value={stressLevel}
          />

          <RatingField
            highLabel="Great"
            label="Mood"
            lowLabel="Low"
            onChange={setMood}
            value={mood}
          />

          <Text style={styles.label}>
            Body weight ({preferredWeightUnit}) · Optional
          </Text>
          <TextInput
            accessibilityLabel={`Body weight in ${preferredWeightUnit}`}
            keyboardType="decimal-pad"
            onChangeText={setBodyWeight}
            placeholder={`Weight in ${preferredWeightUnit}`}
            placeholderTextColor="#727885"
            style={styles.input}
            value={bodyWeight}
          />

          <Text style={styles.label}>Private notes · Optional</Text>
          <TextInput
            accessibilityLabel="Private recovery notes"
            maxLength={2000}
            multiline
            onChangeText={setNotes}
            placeholder="Anything affecting recovery today..."
            placeholderTextColor="#727885"
            style={[styles.input, styles.notesInput]}
            textAlignVertical="top"
            value={notes}
          />

          {displayedError ? (
            <Text
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
              style={styles.error}
            >
              {displayedError}
            </Text>
          ) : null}

          <Pressable
            accessibilityLabel={
              currentDay ? "Update recovery check-in" : "Save recovery check-in"
            }
            accessibilityRole="button"
            accessibilityState={{ busy: isSaving, disabled: isSaving }}
            disabled={isSaving}
            onPress={handleSave}
            style={[styles.saveButton, isSaving && styles.disabled]}
          >
            {isSaving ? (
              <ActivityIndicator color="#0B0B0B" />
            ) : (
              <Text style={styles.saveButtonText}>
                {currentDay ? "Update check-in" : "Save check-in"}
              </Text>
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
    paddingBottom: 48,
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  navigation: {
    alignSelf: "flex-start",
    marginBottom: 24,
  },
  navigationText: {
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "700",
  },
  eyebrow: {
    color: "#F97316",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.5,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "800",
    marginTop: 10,
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 15,
    marginBottom: 20,
    marginTop: 8,
  },
  dateCard: {
    backgroundColor: "#171717",
    borderColor: "#292929",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    padding: 14,
  },
  dateLabel: {
    color: "#F97316",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  dateText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 5,
  },
  label: {
    color: "#D1D5DB",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#171717",
    borderColor: "#333333",
    borderRadius: 12,
    borderWidth: 1,
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 22,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  notesInput: {
    minHeight: 110,
  },
  ratingField: {
    marginBottom: 24,
  },
  ratingRow: {
    flexDirection: "row",
    gap: 8,
  },
  ratingButton: {
    alignItems: "center",
    backgroundColor: "#171717",
    borderColor: "#333333",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  ratingButtonSelected: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  ratingButtonText: {
    color: "#D1D5DB",
    fontSize: 15,
    fontWeight: "700",
  },
  ratingButtonTextSelected: {
    color: "#0B0B0B",
  },
  ratingLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  ratingLabel: {
    color: "#6B7280",
    fontSize: 11,
  },
  error: {
    color: "#F87171",
    marginBottom: 14,
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 52,
  },
  saveButtonText: {
    color: "#0B0B0B",
    fontSize: 16,
    fontWeight: "800",
  },
  disabled: {
    opacity: 0.5,
  },
});
