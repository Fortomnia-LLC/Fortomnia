import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { getLocalDateKey } from "../hooks/useDailyNutrition";
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
function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
function isValidDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}
export default function NewSupplementScreen() {
  const router = useRouter();
  const {
    category: categoryParam,
    doseAmount: doseAmountParam,
    doseUnit: doseUnitParam,
    frequency: frequencyParam,
    name: nameParam,
    notes: notesParam,
    protocolId: protocolIdParam,
    route: routeParam,
    scheduledTime: scheduledTimeParam,
    endDate: endDateParam,
startDate: startDateParam,
  } = useLocalSearchParams<{
    category?: string;
    doseAmount?: string;
    doseUnit?: string;
    frequency?: string;
    name?: string;
    notes?: string;
    protocolId?: string;
    route?: string;
    scheduledTime?: string;
    endDate?: string;
    startDate?: string;
  }>();

  const editingProtocolId = firstParam(protocolIdParam);
  const initialName = firstParam(nameParam);
  const initialCategory = firstParam(categoryParam) as
    | SupplementCategory
    | undefined;
  const initialDoseAmount = firstParam(doseAmountParam);
  const initialDoseUnit = firstParam(doseUnitParam);
  const initialRoute = firstParam(routeParam) as
    | SupplementRoute
    | undefined;
  const initialFrequency = firstParam(frequencyParam) as
    | SupplementFrequency
    | undefined;
    const initialScheduledTime = firstParam(scheduledTimeParam);
  const initialStartDate = firstParam(startDateParam);
  const initialEndDate = firstParam(endDateParam);
  const initialNotes = firstParam(notesParam);
  const isEditing = Boolean(editingProtocolId);
  const { session } = useAuth();
  const [name, setName] = useState(initialName ?? "");
  const [category, setCategory] = useState<SupplementCategory>(
    initialCategory ?? "other",
  );
  const [doseAmount, setDoseAmount] = useState(
    initialDoseAmount ?? "",
  );
  const [doseUnit, setDoseUnit] = useState(initialDoseUnit ?? "");
  const [route, setRoute] = useState<SupplementRoute>(
    initialRoute ?? "oral",
  );
  const [frequency, setFrequency] =
    useState<SupplementFrequency>(
      initialFrequency ?? "daily",
    );
  const [scheduledTime, setScheduledTime] = useState(
    initialScheduledTime ?? "",
  );
    const [startDate, setStartDate] = useState(
    initialStartDate ?? getLocalDateKey(),
  );
  const [endDate, setEndDate] = useState(initialEndDate ?? "");
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setName(initialName ?? "");
    setCategory(initialCategory ?? "other");
    setDoseAmount(initialDoseAmount ?? "");
    setDoseUnit(initialDoseUnit ?? "");
    setRoute(initialRoute ?? "oral");
    setFrequency(initialFrequency ?? "daily");
    setStartDate(initialStartDate ?? getLocalDateKey());
    setEndDate(initialEndDate ?? "");
    setScheduledTime(initialScheduledTime ?? "");
    setNotes(initialNotes ?? "");
    setErrorMessage(null);
  }, [
    editingProtocolId,
    initialCategory,
    initialDoseAmount,
    initialDoseUnit,
    initialFrequency,
    initialName,
    initialNotes,
    initialRoute,
    initialEndDate,
    initialStartDate,
    initialScheduledTime,
  ]);

  async function handleSave() {
    const trimmedName = name.trim();
    const trimmedStartDate = startDate.trim();
    const trimmedEndDate = endDate.trim();
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
      if (!isValidDateKey(trimmedStartDate)) {
  setErrorMessage("Start date must use YYYY-MM-DD format.");
  return;
}

if (trimmedEndDate && !isValidDateKey(trimmedEndDate)) {
  setErrorMessage("End date must use YYYY-MM-DD format.");
  return;
}

if (trimmedEndDate && trimmedEndDate < trimmedStartDate) {
  setErrorMessage("End date cannot be before the start date.");
  return;
}

    setIsSaving(true);
    setErrorMessage(null);

    if (isEditing && editingProtocolId) {
      const { data, error } = await supabase
        .from("supplement_protocols")
        .update({
          category,
          dose_amount: parsedDose,
          dose_unit: trimmedUnit,
          frequency,
          name: trimmedName,
          notes: notes.trim() || null,
          route,
          end_date: trimmedEndDate || null,
          start_date: trimmedStartDate,
          scheduled_time: trimmedTime || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingProtocolId)
        .eq("user_id", session.user.id)
        .select("id")
        .maybeSingle();

      setIsSaving(false);

      if (error || !data) {
        setErrorMessage(
          error?.message ?? "The supplement was not updated.",
        );
        return;
      }

      router.replace("/supplements");
      return;
    }
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
        end_date: trimmedEndDate || null,
        start_date: trimmedStartDate,
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

        <Text style={styles.eyebrow}>FORTOMNIA</Text>
        <Text style={styles.title}>
  {isEditing ? "Edit supplement" : "Add supplement"}
</Text>
<Text style={styles.subtitle}>
  {isEditing
    ? "Update the protocol, dose, or schedule."
    : "Create a private protocol and schedule."}
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
          <Text style={styles.label}>

           Start date {frequency === "weekly" ? "(weekly anchor)" : ""}
          </Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#727885"
            style={styles.input}
            value={startDate}
          />

          <Text style={styles.label}>End date (optional)</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#727885"
            style={styles.input}
            value={endDate}
          />
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
            <Text style={styles.saveText}>
  {isEditing ? "Save changes" : "Save supplement"}
</Text>
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
