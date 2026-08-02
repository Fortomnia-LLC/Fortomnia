import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  type SupplementCategory,
  type SupplementFrequency,
  type SupplementRoute,
} from "../hooks/useSupplements";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

const categories: SupplementCategory[] = [
  "vitamin",
  "mineral",
  "performance",
  "wellness",
  "prescription",
  "hormone",
  "peptide",
  "other",
];

const routes: SupplementRoute[] = [
  "oral",
  "injection",
  "topical",
  "sublingual",
  "inhaled",
  "other",
];

const frequencies: SupplementFrequency[] = [
  "daily",
  "weekly",
  "as_needed",
];

function formatOption(value: string) {
  return value.replace("_", " ");
}

export default function NewSupplementScreen() {
  const router = useRouter();
  const { session } = useAuth();

  const [name, setName] = useState("");
  const [category, setCategory] =
    useState<SupplementCategory>("other");
  const [doseAmount, setDoseAmount] = useState("");
  const [doseUnit, setDoseUnit] = useState("");
  const [route, setRoute] = useState<SupplementRoute>("oral");
  const [frequency, setFrequency] =
    useState<SupplementFrequency>("daily");
  const [scheduledTime, setScheduledTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSave() {
    const trimmedName = name.trim();
    const trimmedUnit = doseUnit.trim();
    const trimmedTime = scheduledTime.trim();
    const parsedDose = Number(doseAmount);

    if (!session?.user.id) {
      setErrorMessage("No authenticated user was found.");
      return;
    }

    if (!trimmedName) {
      setErrorMessage("Supplement name is required.");
      return;
    }

    if (
      !Number.isFinite(parsedDose) ||
      parsedDose < 0 ||
      parsedDose > 1000000
    ) {
      setErrorMessage(
        "Dose must be a number from 0 to 1,000,000.",
      );
      return;
    }

    if (!trimmedUnit) {
      setErrorMessage("Dose unit is required.");
      return;
    }

    if (
      trimmedTime &&
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(trimmedTime)
    ) {
      setErrorMessage("Scheduled time must use 24-hour HH:MM format.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const { error } = await supabase
      .from("supplement_protocols")
      .insert({
        category,
        dose_amount: parsedDose,
        dose_unit: trimmedUnit,
        frequency,
        name: trimmedName,
        notes: notes.trim() || null,
        route,
        scheduled_time: trimmedTime || null,
        user_id: session.user.id,
      });

    setIsSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.replace("/supplements");
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.content}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() => router.replace("/supplements")}
          style={styles.navigation}
        >
          <Text style={styles.navigationText}>‹ Supplements</Text>
        </Pressable>

        <Text style={styles.eyebrow}>IRONFORGE</Text>
        <Text style={styles.title}>Add supplement</Text>
        <Text style={styles.subtitle}>
          Create a private protocol and schedule.
        </Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          autoCapitalize="words"
          onChangeText={setName}
          placeholder="Creatine, vitamin D, prescribed protocol..."
          placeholderTextColor="#727885"
          style={styles.input}
          value={name}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.optionRow}>
          {categories.map((option) => {
            const selected = category === option;

            return (
              <Pressable
                key={option}
                onPress={() => setCategory(option)}
                style={[
                  styles.optionButton,
                  selected && styles.optionButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    selected && styles.optionTextSelected,
                  ]}
                >
                  {formatOption(option)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Dose</Text>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={setDoseAmount}
              placeholder="5"
              placeholderTextColor="#727885"
              style={styles.input}
              value={doseAmount}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Unit</Text>
            <TextInput
              autoCapitalize="none"
              onChangeText={setDoseUnit}
              placeholder="mg, g, mL..."
              placeholderTextColor="#727885"
              style={styles.input}
              value={doseUnit}
            />
          </View>
        </View>

        <Text style={styles.label}>Route</Text>
        <View style={styles.optionRow}>
          {routes.map((option) => {
            const selected = route === option;

            return (
              <Pressable
                key={option}
                onPress={() => setRoute(option)}
                style={[
                  styles.optionButton,
                  selected && styles.optionButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    selected && styles.optionTextSelected,
                  ]}
                >
                  {formatOption(option)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Frequency</Text>
        <View style={styles.optionRow}>
          {frequencies.map((option) => {
            const selected = frequency === option;

            return (
              <Pressable
                key={option}
                onPress={() => setFrequency(option)}
                style={[
                  styles.optionButton,
                  selected && styles.optionButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    selected && styles.optionTextSelected,
                  ]}
                >
                  {formatOption(option)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Scheduled time (optional)</Text>
        <TextInput
          keyboardType="numbers-and-punctuation"
          onChangeText={setScheduledTime}
          placeholder="08:00"
          placeholderTextColor="#727885"
          style={styles.input}
          value={scheduledTime}
        />

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          multiline
          onChangeText={setNotes}
          placeholder="Instructions or reminders..."
          placeholderTextColor="#727885"
          style={[styles.input, styles.notesInput]}
          textAlignVertical="top"
          value={notes}
        />

        {errorMessage ? (
          <Text style={styles.error}>{errorMessage}</Text>
        ) : null}

        <Pressable
          disabled={isSaving}
          onPress={handleSave}
          style={[styles.saveButton, isSaving && styles.disabled]}
        >
          {isSaving ? (
            <ActivityIndicator color="#0B0B0B" />
          ) : (
            <Text style={styles.saveText}>Save supplement</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#0B0B0B",
    flex: 1,
  },
  content: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  navigation: {
    alignSelf: "flex-start",
    paddingBottom: 18,
    paddingTop: 18,
  },
  navigationText: {
    color: "#F97316",
    fontSize: 16,
    fontWeight: "700",
  },
  eyebrow: {
    color: "#F97316",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 10,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "800",
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 28,
    marginTop: 8,
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
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  notesInput: {
    minHeight: 100,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  optionButton: {
    backgroundColor: "#171717",
    borderColor: "#333333",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  optionButtonSelected: {
    borderColor: "#F97316",
  },
  optionText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  optionTextSelected: {
    color: "#F97316",
  },
  fieldRow: {
    flexDirection: "row",
    gap: 12,
  },
  fieldGroup: {
    flex: 1,
  },
  error: {
    color: "#F87171",
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
});
