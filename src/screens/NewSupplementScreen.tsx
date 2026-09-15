import {
  type BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { getLocalDateKey } from "../lib/dates";
import { lookupSupplementBarcode } from "../lib/supplementBarcode";
import { WEEKDAY_OPTIONS } from "../lib/supplementSchedule";
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
  "every_other_week",
  "selected_days",
  "as_needed",
];

function formatOption(value: string) {
  return value.replaceAll("_", " ");
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
    barcode: barcodeParam,
    category: categoryParam,
    doseAmount: doseAmountParam,
    doseUnit: doseUnitParam,
    dosesPerDay: dosesPerDayParam,
    frequency: frequencyParam,
    name: nameParam,
    notes: notesParam,
    protocolId: protocolIdParam,
    productIngredients: productIngredientsParam,
    productServing: productServingParam,
    productSource: productSourceParam,
    productSourceUrl: productSourceUrlParam,
    route: routeParam,
    scheduledDays: scheduledDaysParam,
    scheduledTime: scheduledTimeParam,
    secondScheduledTime: secondScheduledTimeParam,
    endDate: endDateParam,
startDate: startDateParam,
  } = useLocalSearchParams<{
    barcode?: string;
    category?: string;
    doseAmount?: string;
    doseUnit?: string;
    dosesPerDay?: string;
    frequency?: string;
    name?: string;
    notes?: string;
    protocolId?: string;
    productIngredients?: string;
    productServing?: string;
    productSource?: string;
    productSourceUrl?: string;
    route?: string;
    scheduledDays?: string;
    scheduledTime?: string;
    secondScheduledTime?: string;
    endDate?: string;
    startDate?: string;
  }>();

  const editingProtocolId = firstParam(protocolIdParam);
  const initialBarcode = firstParam(barcodeParam);
  const initialName = firstParam(nameParam);
  const initialCategory = firstParam(categoryParam) as
    | SupplementCategory
    | undefined;
  const initialDoseAmount = firstParam(doseAmountParam);
  const initialDoseUnit = firstParam(doseUnitParam);
  const initialDosesPerDay =
    firstParam(dosesPerDayParam) === "2" ? 2 : 1;
  const initialRoute = firstParam(routeParam) as
    | SupplementRoute
    | undefined;
  const initialFrequency = firstParam(frequencyParam) as
    | SupplementFrequency
    | undefined;
  const initialScheduledDays = firstParam(scheduledDaysParam)
    ?.split(",")
    .map(Number)
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6) ?? [];
  const initialScheduledTime = firstParam(scheduledTimeParam);
  const initialSecondScheduledTime = firstParam(secondScheduledTimeParam);
  const initialStartDate = firstParam(startDateParam);
  const initialEndDate = firstParam(endDateParam);
  const initialNotes = firstParam(notesParam);
  const initialProductIngredients = firstParam(productIngredientsParam);
  const initialProductServing = firstParam(productServingParam);
  const initialProductSource = firstParam(productSourceParam);
  const initialProductSourceUrl = firstParam(productSourceUrlParam);
  const isEditing = Boolean(editingProtocolId);
  const { session } = useAuth();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [barcode, setBarcode] = useState(initialBarcode ?? "");
  const [name, setName] = useState(initialName ?? "");
  const [category, setCategory] = useState<SupplementCategory>(
    initialCategory ?? "other",
  );
  const [doseAmount, setDoseAmount] = useState(
    initialDoseAmount ?? "",
  );
  const [doseUnit, setDoseUnit] = useState(initialDoseUnit ?? "");
  const [dosesPerDay, setDosesPerDay] = useState<1 | 2>(
    initialDosesPerDay,
  );
  const [route, setRoute] = useState<SupplementRoute>(
    initialRoute ?? "oral",
  );
  const [frequency, setFrequency] =
    useState<SupplementFrequency>(
      initialFrequency ?? "daily",
    );
  const [scheduledDays, setScheduledDays] = useState<number[]>(
    initialScheduledDays,
  );
  const [scheduledTime, setScheduledTime] = useState(
    initialScheduledTime ?? "",
  );
  const [secondScheduledTime, setSecondScheduledTime] = useState(
    initialSecondScheduledTime ?? "",
  );
    const [startDate, setStartDate] = useState(
    initialStartDate ?? getLocalDateKey(),
  );
  const [endDate, setEndDate] = useState(initialEndDate ?? "");
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [productIngredients, setProductIngredients] = useState(
    initialProductIngredients ?? "",
  );
  const [productServing, setProductServing] = useState(
    initialProductServing ?? "",
  );
  const [productSource, setProductSource] = useState(
    initialProductSource ?? "",
  );
  const [productSourceUrl, setProductSourceUrl] = useState(
    initialProductSourceUrl ?? "",
  );
  const [isLookingUpBarcode, setIsLookingUpBarcode] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setBarcode(initialBarcode ?? "");
    setName(initialName ?? "");
    setCategory(initialCategory ?? "other");
    setDoseAmount(initialDoseAmount ?? "");
    setDoseUnit(initialDoseUnit ?? "");
    setDosesPerDay(initialDosesPerDay);
    setRoute(initialRoute ?? "oral");
    setFrequency(initialFrequency ?? "daily");
    setStartDate(initialStartDate ?? getLocalDateKey());
    setEndDate(initialEndDate ?? "");
    setScheduledDays(initialScheduledDays);
    setScheduledTime(initialScheduledTime ?? "");
    setSecondScheduledTime(initialSecondScheduledTime ?? "");
    setNotes(initialNotes ?? "");
    setProductIngredients(initialProductIngredients ?? "");
    setProductServing(initialProductServing ?? "");
    setProductSource(initialProductSource ?? "");
    setProductSourceUrl(initialProductSourceUrl ?? "");
    setScanMessage(null);
    setErrorMessage(null);
  }, [
    editingProtocolId,
    initialBarcode,
    initialCategory,
    initialDoseAmount,
    initialDoseUnit,
    initialDosesPerDay,
    initialFrequency,
    initialName,
    initialNotes,
    initialProductIngredients,
    initialProductServing,
    initialProductSource,
    initialProductSourceUrl,
    initialRoute,
    initialEndDate,
    initialStartDate,
    initialScheduledDays.join(","),
    initialScheduledTime,
    initialSecondScheduledTime,
  ]);

  async function handleOpenScanner() {
    setErrorMessage(null);
    setScanMessage(null);
    const permission = cameraPermission?.granted
      ? cameraPermission
      : await requestCameraPermission();
    if (!permission.granted) {
      setErrorMessage(
        "Camera access is required to scan a supplement barcode. You can still enter the supplement manually.",
      );
      return;
    }
    setScanLocked(false);
    setScannerOpen(true);
  }

  async function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (scanLocked || isLookingUpBarcode) return;
    setScanLocked(true);
    setIsLookingUpBarcode(true);
    setErrorMessage(null);
    try {
      const product = await lookupSupplementBarcode(result.data);
      if (!product) {
        setScanMessage(
          "That product was not found. Enter it manually or scan another barcode.",
        );
        setScannerOpen(false);
        return;
      }
      setBarcode(product.barcode);
      setName(product.name);
      setProductIngredients(product.ingredients);
      setProductServing(product.serving);
      setProductSource(product.source);
      setProductSourceUrl(product.sourceUrl);
      if (product.doseAmount !== null) setDoseAmount(String(product.doseAmount));
      if (product.doseUnit !== null) setDoseUnit(product.doseUnit);
      setScanMessage("Product found. Review every field before saving.");
      setScannerOpen(false);
    } catch (error) {
      setScanMessage(
        error instanceof Error
          ? error.message
          : "The barcode could not be looked up.",
      );
      setScannerOpen(false);
    } finally {
      setIsLookingUpBarcode(false);
      setScanLocked(false);
    }
  }

  async function handleSave() {
    const trimmedBarcode = barcode.trim() || null;
    const trimmedName = name.trim();
    const trimmedStartDate = startDate.trim();
    const trimmedEndDate = endDate.trim();
    const trimmedUnit = doseUnit.trim();
    const trimmedTime = scheduledTime.trim();
    const trimmedSecondTime = secondScheduledTime.trim();
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

    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

    if (trimmedTime && !timePattern.test(trimmedTime)) {
      setErrorMessage("Scheduled time must use 24-hour HH:MM format.");
      return;
    }

    if (dosesPerDay === 2) {
      if (!trimmedTime || !trimmedSecondTime) {
        setErrorMessage("Morning and evening times are required for twice-daily protocols.");
        return;
      }
      if (!timePattern.test(trimmedSecondTime)) {
        setErrorMessage("Evening time must use 24-hour HH:MM format.");
        return;
      }
      if (trimmedSecondTime <= trimmedTime) {
        setErrorMessage("Evening time must be later than morning time.");
        return;
      }
      if (frequency === "as_needed") {
        setErrorMessage("As-needed protocols can only use one dose slot.");
        return;
      }
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

if (frequency === "selected_days" && scheduledDays.length === 0) {
  setErrorMessage("Choose at least one scheduled day.");
  return;
}

    setIsSaving(true);
    setErrorMessage(null);

    if (trimmedBarcode) {
      let duplicateQuery = supabase
        .from("supplement_protocols")
        .select("id, name")
        .eq("user_id", session.user.id)
        .eq("barcode", trimmedBarcode);
      if (editingProtocolId) duplicateQuery = duplicateQuery.neq("id", editingProtocolId);
      const { data: duplicate, error: duplicateError } = await duplicateQuery
        .limit(1)
        .maybeSingle();
      if (duplicateError) {
        setIsSaving(false);
        setErrorMessage("The barcode could not be checked. Try again.");
        return;
      }
      if (duplicate) {
        setIsSaving(false);
        setErrorMessage(
          `${duplicate.name} already uses this barcode. Edit that protocol instead.`,
        );
        return;
      }
    }

    const productMetadata = {
      barcode: trimmedBarcode,
      product_ingredients: productIngredients.trim() || null,
      product_serving: productServing.trim() || null,
      product_source: trimmedBarcode ? productSource.trim() || "Manual entry" : null,
      product_source_url: trimmedBarcode ? productSourceUrl.trim() || null : null,
    };

    if (isEditing && editingProtocolId) {
      const { data, error } = await supabase
        .from("supplement_protocols")
        .update({
          ...productMetadata,
          category,
          dose_amount: parsedDose,
          dose_unit: trimmedUnit,
          doses_per_day: dosesPerDay,
          frequency,
          name: trimmedName,
          notes: notes.trim() || null,
          route,
          scheduled_days: frequency === "selected_days" ? scheduledDays : [],
          end_date: trimmedEndDate || null,
          start_date: trimmedStartDate,
          scheduled_time: trimmedTime || null,
          second_scheduled_time:
            dosesPerDay === 2 ? trimmedSecondTime : null,
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
        ...productMetadata,
        category,
        dose_amount: parsedDose,
        dose_unit: trimmedUnit,
        doses_per_day: dosesPerDay,
        frequency,
        name: trimmedName,
        notes: notes.trim() || null,
        route,
        scheduled_days: frequency === "selected_days" ? scheduledDays : [],
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
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

        <Pressable
          disabled={isLookingUpBarcode}
          onPress={() =>
            scannerOpen ? setScannerOpen(false) : void handleOpenScanner()
          }
          style={[styles.scanButton, isLookingUpBarcode && styles.disabled]}
        >
          {isLookingUpBarcode ? (
            <ActivityIndicator color="#2563EB" />
          ) : (
            <Text style={styles.scanButtonText}>
              {scannerOpen ? "Close scanner" : "Scan supplement barcode"}
            </Text>
          )}
        </Pressable>

        {scannerOpen ? (
          <View style={styles.cameraFrame}>
            <CameraView
              barcodeScannerSettings={{
                barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
              }}
              onBarcodeScanned={scanLocked ? undefined : handleBarcodeScanned}
              style={styles.camera}
            />
            <Text style={styles.cameraHint}>
              Center the UPC or EAN barcode in the camera.
            </Text>
          </View>
        ) : null}

        {scanMessage ? (
          <Text selectable style={styles.scanMessage}>{scanMessage}</Text>
        ) : null}

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
              inputMode="decimal"
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
        {frequency === "selected_days" ? (
          <>
            <Text style={styles.label}>Scheduled days</Text>
            <View style={styles.optionRow}>
              {WEEKDAY_OPTIONS.map((day) => {
                const selected = scheduledDays.includes(day.value);

                return (
                  <Pressable
                    key={day.value}
                    onPress={() =>
                      setScheduledDays((current) =>
                        selected
                          ? current.filter((value) => value !== day.value)
                          : [...current, day.value].sort(),
                      )
                    }
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
                      {day.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}
          <Text style={styles.label}>

           Start date {
             frequency === "weekly"
               ? "(weekly anchor)"
               : frequency === "every_other_week"
                 ? "(14-day anchor)"
                 : ""
           }
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
        <Text style={styles.label}>Doses per scheduled day</Text>
        <View style={styles.optionRow}>
          {([1, 2] as const).map((count) => {
            const selected = dosesPerDay === count;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={count}
                onPress={() => setDosesPerDay(count)}
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
                  {count === 1 ? "Once daily" : "Morning & evening"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>
          {dosesPerDay === 2 ? "Morning time" : "Scheduled time (optional)"}
        </Text>
        <TextInput
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          onChangeText={setScheduledTime}
          placeholder="08:00"
          placeholderTextColor="#727885"
          style={styles.input}
          value={scheduledTime}
        />

        {dosesPerDay === 2 ? (
          <>
            <Text style={styles.label}>Evening time</Text>
            <TextInput
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              onChangeText={setSecondScheduledTime}
              placeholder="20:00"
              placeholderTextColor="#727885"
              style={styles.input}
              value={secondScheduledTime}
            />
          </>
        ) : null}

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

        {barcode ? (
          <View style={styles.productCard}>
            <Text style={styles.productTitle}>Scanned product details</Text>
            <Text selectable style={styles.productMeta}>
              Barcode: {barcode}
              {productSource ? ` • Source: ${productSource}` : ""}
            </Text>
            <Text style={styles.label}>Serving (editable)</Text>
            <TextInput
              maxLength={200}
              onChangeText={setProductServing}
              placeholder="1 scoop, 2 capsules..."
              placeholderTextColor="#727885"
              style={styles.input}
              value={productServing}
            />
            <Text style={styles.label}>Ingredients (editable)</Text>
            <TextInput
              maxLength={4000}
              multiline
              onChangeText={setProductIngredients}
              placeholder="Review the package and enter ingredients if missing."
              placeholderTextColor="#727885"
              style={[styles.input, styles.ingredientsInput]}
              textAlignVertical="top"
              value={productIngredients}
            />
            <Text selectable style={styles.reviewNotice}>
              Community product data can be incomplete. Verify the label before saving.
            </Text>
          </View>
        ) : null}

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
      </KeyboardAvoidingView>
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
    color: "#2563EB",
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
    borderColor: "#2563EB",
  },
  optionText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  optionTextSelected: {
    color: "#2563EB",
  },
  scanButton: {
    alignItems: "center",
    borderColor: "#2563EB",
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    marginBottom: 20,
    minHeight: 50,
  },
  scanButtonText: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "800",
  },
  cameraFrame: {
    backgroundColor: "#171717",
    borderColor: "#333333",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    overflow: "hidden",
  },
  camera: {
    height: 260,
    width: "100%",
  },
  cameraHint: {
    color: "#D1D5DB",
    fontSize: 13,
    padding: 12,
    textAlign: "center",
  },
  scanMessage: {
    color: "#9CA3AF",
    fontSize: 13,
    marginBottom: 18,
  },
  productCard: {
    backgroundColor: "#111827",
    borderColor: "#2563EB",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    padding: 16,
  },
  productTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },
  productMeta: {
    color: "#93C5FD",
    fontSize: 12,
    marginBottom: 18,
  },
  ingredientsInput: {
    minHeight: 90,
  },
  reviewNotice: {
    color: "#9CA3AF",
    fontSize: 12,
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
    backgroundColor: "#2563EB",
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
