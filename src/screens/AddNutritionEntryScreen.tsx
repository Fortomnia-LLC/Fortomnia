import {
  type BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
import { lookupFoodBarcode } from "../lib/foodBarcode";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
export default function AddNutritionEntryScreen() {
    const router = useRouter();
  const {
    calories: caloriesParam,
    carbs: carbsParam,
    date: dateParam,
    entryId: entryIdParam,
    fat: fatParam,
    fiber: fiberParam,
    foodName: foodNameParam,
    mealCount: mealCountParam,
    mealNumber: mealNumberParam,
    protein: proteinParam,
    serving: servingParam,
  } = useLocalSearchParams<{
    calories?: string;
    carbs?: string;
    date?: string;
    entryId?: string;
    fat?: string;
    fiber?: string;
    foodName?: string;
    mealCount?: string;
    mealNumber?: string;
    protein?: string;
    serving?: string;
  }>();

  const entryDate = firstParam(dateParam) ?? getLocalDateKey();
  const editingEntryId = firstParam(entryIdParam);
  const mealCount = Math.min(
    8,
    Math.max(1, Number(firstParam(mealCountParam)) || 3),
  );
  const initialMealNumber = Math.min(
    mealCount,
    Math.max(1, Number(firstParam(mealNumberParam)) || 1),
  );
  const initialFoodName = firstParam(foodNameParam);
  const initialServing = firstParam(servingParam);
  const initialCalories = firstParam(caloriesParam);
  const initialProtein = firstParam(proteinParam);
  const initialCarbs = firstParam(carbsParam);
  const initialFat = firstParam(fatParam);
  const initialFiber = firstParam(fiberParam);
  const isEditing = Boolean(editingEntryId);

  const { session } = useAuth();
  const [cameraPermission, requestCameraPermission] =
    useCameraPermissions();
  const [mealNumber, setMealNumber] = useState(initialMealNumber);
  const [foodName, setFoodName] = useState(initialFoodName ?? "");
  const [serving, setServing] = useState(initialServing ?? "");
  const [calories, setCalories] = useState(initialCalories ?? "");
  const [protein, setProtein] = useState(initialProtein ?? "");
  const [carbs, setCarbs] = useState(initialCarbs ?? "");
  const [fat, setFat] = useState(initialFat ?? "");
  const [fiber, setFiber] = useState(initialFiber ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isLookingUpBarcode, setIsLookingUpBarcode] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMealNumber(initialMealNumber);
    setFoodName(initialFoodName ?? "");
    setServing(initialServing ?? "");
    setCalories(initialCalories ?? "");
    setProtein(initialProtein ?? "");
    setCarbs(initialCarbs ?? "");
    setFat(initialFat ?? "");
    setFiber(initialFiber ?? "");
    setErrorMessage(null);
  }, [
    editingEntryId,
    initialCalories,
    initialCarbs,
    initialFat,
    initialFiber,
    initialFoodName,
    initialMealNumber,
    initialProtein,
    initialServing,
  ]);

  useFocusEffect(
    useCallback(() => {
      if (isEditing) return;

      setFoodName("");
      setServing("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setFiber("");
      setErrorMessage(null);
    }, [isEditing]),
  );

  async function handleOpenScanner() {
    setErrorMessage(null);
    setScanMessage(null);

    const permission =
      cameraPermission?.granted
        ? cameraPermission
        : await requestCameraPermission();

    if (!permission.granted) {
      setErrorMessage(
        "Camera access is required to scan a food barcode. You can still enter the food manually.",
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
      const food = await lookupFoodBarcode(result.data);

      if (!food) {
        setScanMessage(
          "That barcode was not found. You can enter the food manually or scan another product.",
        );
        setScannerOpen(false);
        return;
      }

      setFoodName(food.name);
      setServing(food.serving);
      setCalories(String(food.calories));
      setProtein(String(food.proteinGrams));
      setCarbs(String(food.carbsGrams));
      setFat(String(food.fatGrams));
      setFiber(String(food.fiberGrams));
      setScanMessage(
        "Food found. Review the serving and nutrition values before saving.",
      );
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
    const trimmedName = foodName.trim();
    const parsedCalories = Number(calories);
    const parsedProtein = Number(protein);
    const parsedCarbs = Number(carbs);
    const parsedFat = Number(fat);
    const parsedFiber = Number(fiber);

    if (!session?.user.id) {
      setErrorMessage("No authenticated user was found.");
      return;
    }

    if (!trimmedName) {
      setErrorMessage("Food name is required.");
      return;
    }

    if (
      !Number.isInteger(parsedCalories) ||
      parsedCalories < 0 ||
      parsedCalories > 10000
    ) {
      setErrorMessage(
        "Calories must be a whole number from 0 to 10,000.",
      );
      return;
    }

    const macros = [
      { label: "Protein", max: 2000, value: parsedProtein },
      { label: "Carbs", max: 2000, value: parsedCarbs },
      { label: "Fat", max: 2000, value: parsedFat },
      { label: "Fiber", max: 500, value: parsedFiber },
    ];

    const invalidMacro = macros.find(
      (macro) =>
        !Number.isFinite(macro.value) ||
        macro.value < 0 ||
        macro.value > macro.max,
    );

    if (invalidMacro) {
      setErrorMessage(
        `${invalidMacro.label} must be from 0 to ${invalidMacro.max} grams.`,
      );
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    if (isEditing && editingEntryId) {
      const { data, error } = await supabase
        .from("nutrition_entries")
        .update({
          calories: parsedCalories,
          carbs_g: parsedCarbs,
          entry_date: entryDate,
          fat_g: parsedFat,
          fiber_g: parsedFiber,
          food_name: trimmedName,
          meal_number: mealNumber,
          meal_type: "snack",
          protein_g: parsedProtein,
          serving_description: serving.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingEntryId)
        .eq("user_id", session.user.id)
        .select("id")
        .maybeSingle();

      setIsSaving(false);

      if (error || !data) {
        setErrorMessage(
          error?.message ?? "The food entry was not updated.",
        );
        return;
      }

      router.replace("/nutrition");
      return;
    }

    const { error } = await supabase
      .from("nutrition_entries")
      .insert({
        calories: parsedCalories,
        carbs_g: parsedCarbs,
        entry_date: entryDate,
        fat_g: parsedFat,
        fiber_g: parsedFiber,
        food_name: trimmedName,
        meal_number: mealNumber,
        meal_type: "snack",
        protein_g: parsedProtein,
        serving_description: serving.trim() || null,
        user_id: session.user.id,
      });

    setIsSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setFoodName("");
    setServing("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setFiber("");

    router.replace("/nutrition");
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
          onPress={() => router.replace("/nutrition")}
          style={styles.navigation}
        >
          <Text style={styles.navigationText}>‹ Nutrition</Text>
        </Pressable>

        <Text style={styles.eyebrow}>FORTOMNIA</Text>
        <Text style={styles.title}>
          {isEditing ? "Edit food" : "Log food"}
        </Text>
        <Text style={styles.subtitle}>
        {isEditing
        ? "Correct the meal, serving, calories, or macros."
        : "Record calories and macros for today."}
     </Text>

        <Text style={styles.label}>Meal</Text>
        <View style={styles.mealRow}>
          {Array.from({ length: mealCount }, (_, index) => index + 1).map(
            (option) => {
              const selected = mealNumber === option;

              return (
                <Pressable
                  key={option}
                  onPress={() => setMealNumber(option)}
                  style={[
                    styles.mealButton,
                    selected && styles.mealButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.mealText,
                      selected && styles.mealTextSelected,
                    ]}
                  >
                    Meal {option}
                  </Text>
                </Pressable>
              );
            },
          )}
        </View>

        {!isEditing ? (
          <>
            <Pressable
              disabled={isLookingUpBarcode}
              onPress={() =>
                scannerOpen
                  ? setScannerOpen(false)
                  : void handleOpenScanner()
              }
              style={[
                styles.scanButton,
                isLookingUpBarcode && styles.disabled,
              ]}
            >
              {isLookingUpBarcode ? (
                <ActivityIndicator color="#2563EB" />
              ) : (
                <Text style={styles.scanButtonText}>
                  {scannerOpen ? "Close scanner" : "Scan food barcode"}
                </Text>
              )}
            </Pressable>

            {scannerOpen ? (
              <View style={styles.cameraFrame}>
                <CameraView
                  barcodeScannerSettings={{
                    barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
                  }}
                  onBarcodeScanned={
                    scanLocked ? undefined : handleBarcodeScanned
                  }
                  style={styles.camera}
                />
                <Text style={styles.cameraHint}>
                  Center the UPC or EAN barcode in the camera.
                </Text>
              </View>
            ) : null}

            {scanMessage ? (
              <Text style={styles.scanMessage}>{scanMessage}</Text>
            ) : null}
          </>
        ) : null}

        <Text style={styles.label}>Food name</Text>
        <TextInput
          autoCapitalize="words"
          onChangeText={setFoodName}
          placeholder="Chicken breast, oatmeal, protein shake..."
          placeholderTextColor="#727885"
          style={styles.input}
          value={foodName}
        />

        <Text style={styles.label}>Serving</Text>
        <TextInput
          onChangeText={setServing}
          placeholder="8 oz, 1 bowl, 2 scoops..."
          placeholderTextColor="#727885"
          style={styles.input}
          value={serving}
        />

        <Text style={styles.label}>Calories</Text>
        <TextInput
          keyboardType="number-pad"
          onChangeText={setCalories}
          placeholder="0"
          placeholderTextColor="#727885"
          style={styles.input}
          value={calories}
        />

        <View style={styles.macroRow}>
          <View style={styles.macroInputGroup}>
            <Text style={styles.label}>Protein (g)</Text>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={setProtein}
              placeholder="0"
              placeholderTextColor="#727885"
              style={styles.input}
              value={protein}
            />
          </View>

          <View style={styles.macroInputGroup}>
            <Text style={styles.label}>Carbs (g)</Text>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={setCarbs}
              placeholder="0"
              placeholderTextColor="#727885"
              style={styles.input}
              value={carbs}
            />
          </View>
        </View>

        <View style={styles.macroRow}>
          <View style={styles.macroInputGroup}>
            <Text style={styles.label}>Fat (g)</Text>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={setFat}
              placeholder="0"
              placeholderTextColor="#727885"
              style={styles.input}
              value={fat}
            />
          </View>

          <View style={styles.macroInputGroup}>
            <Text style={styles.label}>Fiber (g)</Text>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={setFiber}
              placeholder="0"
              placeholderTextColor="#727885"
              style={styles.input}
              value={fiber}
            />
          </View>
        </View>

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
             {isEditing ? "Save changes" : "Save food"}
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
  mealRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  mealButton: {
    backgroundColor: "#171717",
    borderColor: "#333333",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  mealButtonSelected: {
    borderColor: "#2563EB",
  },
  mealText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  mealTextSelected: {
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
  macroRow: {
    flexDirection: "row",
    gap: 12,
  },
  macroInputGroup: {
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
