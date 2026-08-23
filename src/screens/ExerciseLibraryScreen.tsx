import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Text,
  View,
} from "react-native";

import { ExercisePicker } from "../components/ExercisePicker";
import { useExercises } from "../hooks/useExercises";

export default function ExerciseLibraryScreen() {
  const router = useRouter();
  const {
    archivedExercises,
    errorMessage,
    exercises,
    refreshExercises,
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
          refreshControl={
            <RefreshControl
              colors={["#F97316"]}
              onRefresh={() => void refreshExercises()}
              refreshing={isLoading}
              tintColor="#F97316"
            />
          }
      >
        <Pressable
          onPress={() => router.replace("/training")}
          style={styles.navigation}
        >
          <Text style={styles.navigationText}>‹ Training</Text>
        </Pressable>

        <Text style={styles.eyebrow}>FORTOMNIA</Text>
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
        {archivedExercises.length > 0 ? (
          <View style={styles.archivedSection}>
            <Text style={styles.archivedTitle}>
              Archived custom exercises
            </Text>
            <Text style={styles.archivedDescription}>
              Archived exercises retain their history but are hidden from
              workout and template pickers.
            </Text>

            {archivedExercises.map((exercise) => (
              <Pressable
                key={exercise.id}
                onPress={() =>
                  router.push({
                    pathname: "/exercise/[id]",
                    params: { id: exercise.id },
                  })
                }
                style={styles.archivedCard}
              >
                <View>
                  <Text style={styles.archivedName}>{exercise.name}</Text>
                  <Text style={styles.archivedDetails}>
                    {exercise.muscle_group}
                    {exercise.equipment
                      ? ` • ${exercise.equipment}`
                      : ""}
                  </Text>
                </View>

                <Text style={styles.archivedAction}>View ›</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
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
    borderColor: "#2563EB",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  createButtonText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "700",
  },
  archivedSection: {
    marginTop: 28,
  },
  archivedTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  archivedDescription: {
    color: "#9CA3AF",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
    marginTop: 6,
  },
  archivedCard: {
    alignItems: "center",
    backgroundColor: "#171717",
    borderColor: "#3F3F46",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    padding: 15,
  },
  archivedName: {
    color: "#D1D5DB",
    fontSize: 15,
    fontWeight: "700",
  },
  archivedDetails: {
    color: "#71717A",
    fontSize: 12,
    marginTop: 5,
  },
  archivedAction: {
    color: "#FBBF24",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 12,
  },
  error: {
    color: "#F87171",
    marginBottom: 16,
  },
});
