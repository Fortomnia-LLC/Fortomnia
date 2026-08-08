import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { type Exercise } from "../hooks/useExercises";

type ExercisePickerProps = {
  exercises: Exercise[];
  onSelect: (exerciseId: string) => void;
  selectedExerciseId: string | null;
};

const allFilter = "All";

export function ExercisePicker({
  exercises,
  onSelect,
  selectedExerciseId,
}: ExercisePickerProps) {
  const [query, setQuery] = useState("");
  const [muscleGroup, setMuscleGroup] = useState(allFilter);
  const [equipment, setEquipment] = useState(allFilter);
  const [isExpanded, setIsExpanded] = useState(
    selectedExerciseId === null,
  );
  const muscleGroups = useMemo(
    () => [
      allFilter,
      ...Array.from(
        new Set(exercises.map((exercise) => exercise.muscle_group)),
      ).sort(),
    ],
    [exercises],
  );

  const equipmentOptions = useMemo(
    () => [
      allFilter,
      ...Array.from(
        new Set(
          exercises
            .map((exercise) => exercise.equipment)
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort(),
    ],
    [exercises],
  );
  const filteredExercises = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return exercises.filter((exercise) => {
      if (
        muscleGroup !== allFilter &&
        exercise.muscle_group !== muscleGroup
      ) {
        return false;
      }

      if (
        equipment !== allFilter &&
        exercise.equipment !== equipment
      ) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchableText = [
        exercise.name,
        exercise.muscle_group,
        exercise.equipment ?? "",
        exercise.movement_pattern.replaceAll("_", " "),
        ...exercise.aliases,
        ...exercise.secondary_muscles,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [equipment, exercises, muscleGroup, query]);

  const selectedExercise = exercises.find(
    (exercise) => exercise.id === selectedExerciseId,
  );
  const displayedExercises = filteredExercises.slice(0, 30);

  if (!isExpanded && selectedExercise) {
    return (
      <View>
        <Text style={styles.resultCount}>Selected exercise</Text>

        <View
          style={[
            styles.exerciseButton,
            styles.exerciseButtonSelected,
          ]}
        >
          <View style={styles.exerciseHeader}>
            <Text
              style={[
                styles.exerciseText,
                styles.exerciseTextSelected,
              ]}
            >
              {selectedExercise.name}
            </Text>

            <Pressable
              accessibilityHint="Opens the exercise search and filters"
              accessibilityLabel={`Change selected exercise from ${selectedExercise.name}`}
              accessibilityRole="button"
              onPress={() => setIsExpanded(true)}
              style={styles.filterButton}
            >
              <Text style={styles.filterText}>Change</Text>
            </Pressable>
          </View>

          <Text style={styles.exerciseDetail}>
            {selectedExercise.muscle_group}
            {selectedExercise.equipment
              ? ` • ${selectedExercise.equipment}`
              : ""}
            {selectedExercise.is_unilateral ? " • Unilateral" : ""}
          </Text>
        </View>
      </View>
    );
  }
  return (
    <View>
      <TextInput
        accessibilityHint="Searches exercise names, aliases, muscles, movement patterns, and equipment"
        accessibilityLabel="Search exercises"
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={setQuery}
        placeholder="Search name, alias, or muscle..."
        placeholderTextColor="#727885"
        returnKeyType="search"
        style={styles.searchInput}
        value={query}
      />

      <Text style={styles.filterLabel}>Muscle group</Text>
      <ScrollView
        contentContainerStyle={styles.filterRow}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {muscleGroups.map((option) => {
          const selected = muscleGroup === option;

          return (
            <Pressable
                accessibilityLabel={`Filter by muscle group: ${option}`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              key={option}
              onPress={() => setMuscleGroup(option)}
              style={[
                styles.filterButton,
                selected && styles.filterButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  selected && styles.filterTextSelected,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.filterLabel}>Equipment</Text>
      <ScrollView
        contentContainerStyle={styles.filterRow}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {equipmentOptions.map((option) => {
          const selected = equipment === option;

          return (
            <Pressable
                accessibilityLabel={`Filter by equipment: ${option}`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              key={option}
              onPress={() => setEquipment(option)}
              style={[
                styles.filterButton,
                selected && styles.filterButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  selected && styles.filterTextSelected,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.resultCount}>
          {displayedExercises.length < filteredExercises.length
            ? `Showing ${displayedExercises.length} of ${filteredExercises.length} exercises`
            : `${filteredExercises.length} ${
                filteredExercises.length === 1
                  ? "exercise"
                  : "exercises"
              }`}
        </Text>

      {filteredExercises.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No exercises found</Text>
          <Text style={styles.emptyText}>
            Try another search or change the active filters.
          </Text>
        </View>
      ) : (
        <View style={styles.exerciseList}>
          {displayedExercises.map((exercise) => {
            const selected = exercise.id === selectedExerciseId;

            return (
              <Pressable
                  accessibilityHint="Selects this exercise"
                  accessibilityLabel={`${exercise.name}, ${exercise.muscle_group}${
                    exercise.equipment
                      ? `, ${exercise.equipment}`
                      : ""
                  }${exercise.is_unilateral ? ", unilateral" : ""}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                key={exercise.id}
                  onPress={() => {
                  onSelect(exercise.id);
                  setIsExpanded(false);
                }}
                style={[
                  styles.exerciseButton,
                  selected && styles.exerciseButtonSelected,
                ]}
              >
                <View style={styles.exerciseHeader}>
                  <Text
                    style={[
                      styles.exerciseText,
                      selected && styles.exerciseTextSelected,
                    ]}
                  >
                    {exercise.name}
                  </Text>

                  {exercise.owner_id ? (
                    <Text style={styles.customBadge}>CUSTOM</Text>
                  ) : null}
                </View>

                <Text style={styles.exerciseDetail}>
                  {exercise.muscle_group}
                  {exercise.equipment
                    ? ` • ${exercise.equipment}`
                    : ""}
                  {exercise.is_unilateral ? " • Unilateral" : ""}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    backgroundColor: "#171717",
    borderColor: "#333333",
    borderRadius: 10,
    borderWidth: 1,
    color: "#FFFFFF",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  filterLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 14,
    textTransform: "uppercase",
  },
  filterRow: {
    gap: 8,
    paddingRight: 16,
    paddingTop: 8,
  },
  filterButton: {
    borderColor: "#333333",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterButtonSelected: {
    backgroundColor: "#F97316",
    borderColor: "#F97316",
  },
  filterText: {
    color: "#D1D5DB",
    fontSize: 12,
    fontWeight: "700",
  },
  filterTextSelected: {
    color: "#0B0B0B",
  },
  resultCount: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 14,
  },
  exerciseList: {
    gap: 8,
    marginTop: 10,
  },
  exerciseButton: {
    backgroundColor: "#171717",
    borderColor: "#2A2A2A",
    borderRadius: 10,
    borderWidth: 1,
    padding: 13,
  },
  exerciseButtonSelected: {
    backgroundColor: "#2A180B",
    borderColor: "#F97316",
  },
  exerciseHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  exerciseText: {
    color: "#FFFFFF",
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  exerciseTextSelected: {
    color: "#FDBA74",
  },
  exerciseDetail: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 5,
  },
  customBadge: {
    color: "#F97316",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  emptyCard: {
    backgroundColor: "#171717",
    borderColor: "#2A2A2A",
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
    padding: 16,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 6,
  },
});
