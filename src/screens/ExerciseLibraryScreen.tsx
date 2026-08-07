import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ExercisePicker } from "../components/ExercisePicker";
import { useExercises } from "../hooks/useExercises";

export default function ExerciseLibraryScreen() {
  const router = useRouter();
  const {
    errorMessage,
    exercises,
    isLoading,
  } = useExercises();

  if (isLoading && exercises.length === 0) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color="#F97316" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() => router.replace("/training")}
          style={styles.navigation}
        >
          <Text style={styles.navigationText}>‹ Training</Text>
        </Pressable>

        <Text style={styles.eyebrow}>IRONFORGE</Text>
        <Text style={styles.title}>Exercise library</Text>
        <Text style={styles.subtitle}>
          Search built-in and custom exercises by name, alias, muscle,
          movement, or equipment.
        </Text>

        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryNumber}>
              {exercises.length}
            </Text>
            <Text style={styles.summaryLabel}>
              available exercises
            </Text>
          </View>

          <Pressable
            onPress={() => router.push("/new-exercise")}
            style={styles.createButton}
          >
            <Text style={styles.createButtonText}>New custom</Text>
          </Pressable>
        </View>

        {errorMessage ? (
          <Text style={styles.error}>{errorMessage}</Text>
        ) : null}

        <ExercisePicker
          exercises={exercises}
          onSelect={(exerciseId) =>
            router.push({
              pathname: "/exercise/[id]",
              params: { id: exerciseId },
            })
          }
          selectedExerciseId={null}
        />
      </ScrollView>
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
    color: "#F97316",
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
    lineHeight: 22,
    marginTop: 8,
  },
  summary: {
    alignItems: "center",
    backgroundColor: "#171717",
    borderColor: "#292929",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    marginTop: 20,
    padding: 16,
  },
  summaryNumber: {
    color: "#F97316",
    fontSize: 26,
    fontWeight: "800",
  },
  summaryLabel: {
    color: "#D1D5DB",
    fontSize: 13,
    marginTop: 3,
  },
  createButton: {
    borderColor: "#F97316",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  createButtonText: {
    color: "#F97316",
    fontSize: 13,
    fontWeight: "700",
  },
  error: {
    color: "#F87171",
    marginBottom: 16,
  },
});
