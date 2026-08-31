import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useWorkoutTemplate } from "../hooks/useWorkoutTemplate";
import { useWorkoutTemplates } from "../hooks/useWorkoutTemplates";
import { assessRecoveryBaseline } from "../lib/health/recoveryBaseline";
import { buildRecoveryPreview } from "../lib/health/recoveryPreview";
import { applyRecoveryToTemplate } from "../lib/health/recoveryTrainingGuidance";
import type { GeneratedTemplate } from "../lib/programGenerator";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

function targetLabel(exercise: GeneratedTemplate["exercises"][number]) {
  if (exercise.performanceType === "time") {
    return `${exercise.targetSets} sets • ${exercise.targetDurationSeconds ?? 0} sec`;
  }
  if (exercise.performanceType === "distance") {
    return `${exercise.targetSets} sets • ${exercise.targetMetricValue ?? 0} ${exercise.targetMetricUnit ?? ""}`;
  }
  return `${exercise.targetSets} sets • ${exercise.repMin}-${exercise.repMax} reps • ${exercise.targetRir} RIR`;
}

export default function RecoveryWorkoutChoiceScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { templates, isLoading: templatesLoading } = useWorkoutTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();
  const [isStarting, setIsStarting] = useState(false);
  const { template, templateExercises, isLoading: templateLoading } = useWorkoutTemplate(selectedTemplateId);

  const previewAssessment = useMemo(() => {
    const summaries = buildRecoveryPreview();
    const today = summaries.at(-1)!;
    return assessRecoveryBaseline(today, summaries.slice(0, -1));
  }, []);

  const plannedTemplate = useMemo<GeneratedTemplate | null>(() => {
    if (!template) return null;
    return {
      name: template.name,
      explanation: template.notes ?? "Your saved workout template.",
      exercises: templateExercises.map((exercise) => ({
        exerciseId: exercise.exercise_id,
        exerciseName: exercise.exercise_name,
        explanation: "Planned from your saved template.",
        performanceType: exercise.performance_type,
        position: exercise.position,
        repMin: exercise.rep_min,
        repMax: exercise.rep_max,
        targetRir: exercise.target_rir ?? 2,
        targetSets: exercise.target_sets,
        targetDurationSeconds: exercise.target_duration_seconds,
        targetMetricUnit: exercise.target_metric_unit ?? null,
        targetMetricValue: exercise.target_metric_value ?? null,
      })),
    };
  }, [template, templateExercises]);

  const adjustedTemplate = useMemo(
    () => plannedTemplate ? applyRecoveryToTemplate(plannedTemplate, previewAssessment) : null,
    [plannedTemplate, previewAssessment],
  );

  async function startWorkout(mode: "planned" | "adjusted") {
    if (!session?.user.id || !plannedTemplate || !adjustedTemplate || !template) return;
    const source = mode === "adjusted" ? adjustedTemplate : plannedTemplate;
    setIsStarting(true);

    const { data: workout, error: workoutError } = await supabase
      .from("workout_sessions")
      .insert({ name: source.name, user_id: session.user.id })
      .select("id")
      .single();

    if (workoutError || !workout) {
      setIsStarting(false);
      Alert.alert("Unable to start workout", workoutError?.message ?? "The workout was not created.");
      return;
    }

    const originalByExerciseId = new Map(templateExercises.map((item) => [item.exercise_id, item]));
    const rows = source.exercises.map((exercise) => {
      const original = originalByExerciseId.get(exercise.exerciseId);
      return {
        exercise_id: exercise.exerciseId,
        performance_type: exercise.performanceType ?? "reps",
        position: exercise.position,
        rep_max: exercise.performanceType === "reps" || !exercise.performanceType ? exercise.repMax : null,
        rep_min: exercise.performanceType === "reps" || !exercise.performanceType ? exercise.repMin : null,
        session_id: workout.id,
        superset_group: original?.superset_group ?? null,
        target_duration_seconds: exercise.performanceType === "time" ? exercise.targetDurationSeconds ?? null : null,
        target_metric_unit: exercise.performanceType === "distance" ? exercise.targetMetricUnit ?? null : null,
        target_metric_value: exercise.performanceType === "distance" ? exercise.targetMetricValue ?? null : null,
        target_rir: exercise.performanceType === "reps" || !exercise.performanceType ? exercise.targetRir : null,
        target_sets: exercise.targetSets,
        user_id: session.user.id,
      };
    });

    const { error: snapshotError } = await supabase.from("workout_session_exercises").insert(rows);
    if (snapshotError) {
      await supabase.from("workout_sessions").delete().eq("id", workout.id).eq("user_id", session.user.id);
      setIsStarting(false);
      Alert.alert("Unable to start workout", snapshotError.message);
      return;
    }

    setIsStarting(false);
    router.replace({ pathname: "/workout/[id]", params: { id: workout.id } });
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>FREE TRAINING INTELLIGENCE</Text>
        <Text style={styles.title}>Planned or adjusted?</Text>
        <Text style={styles.subtitle}>
          Fortomnia can suggest a recovery-adjusted version of your workout, but you decide which session to start.
        </Text>

        <View style={styles.previewNotice}>
          <Text style={styles.previewLabel}>DEVELOPMENT PREVIEW</Text>
          <Text style={styles.previewText}>
            This screen currently uses sample recovery signals while real HealthKit testing is blocked. No sample data is saved as your health information.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Choose a template</Text>
        {templatesLoading ? <ActivityIndicator color="#60A5FA" /> : templates.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setSelectedTemplateId(item.id)}
            style={[styles.templateButton, selectedTemplateId === item.id && styles.templateButtonSelected]}
          >
            <Text style={styles.templateName}>{item.name}</Text>
            <Text style={styles.templateNotes}>{item.notes ?? "Saved workout template"}</Text>
          </Pressable>
        ))}

        {selectedTemplateId && templateLoading ? <ActivityIndicator color="#60A5FA" /> : null}

        {plannedTemplate && adjustedTemplate ? (
          <>
            <View style={styles.recoveryCard}>
              <Text style={styles.recoveryHeadline}>{previewAssessment.headline}</Text>
              <Text style={styles.recoveryText}>{previewAssessment.explanation}</Text>
              <Text style={styles.recoveryGuidance}>{previewAssessment.recommendation}</Text>
            </View>

            <View style={styles.choiceRow}>
              <View style={styles.choiceCard}>
                <Text style={styles.choiceLabel}>PLANNED</Text>
                <Text style={styles.choiceTitle}>Keep my workout</Text>
                <Text style={styles.choiceText}>Nothing changes. You follow the template exactly as saved.</Text>
                {plannedTemplate.exercises.map((exercise) => (
                  <View key={`planned-${exercise.exerciseId}`} style={styles.exerciseRow}>
                    <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                    <Text style={styles.exerciseTarget}>{targetLabel(exercise)}</Text>
                  </View>
                ))}
                <Pressable disabled={isStarting} onPress={() => void startWorkout("planned")} style={styles.secondaryButton}>
                  <Text style={styles.secondaryText}>Start planned workout</Text>
                </Pressable>
              </View>

              <View style={[styles.choiceCard, styles.adjustedCard]}>
                <Text style={styles.adjustedLabel}>FORTOMNIA SUGGESTS</Text>
                <Text style={styles.choiceTitle}>Use adjusted workout</Text>
                <Text style={styles.choiceText}>Same movements, with recovery-aware volume and effort changes.</Text>
                {adjustedTemplate.exercises.map((exercise) => (
                  <View key={`adjusted-${exercise.exerciseId}`} style={styles.exerciseRow}>
                    <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                    <Text style={styles.exerciseTarget}>{targetLabel(exercise)}</Text>
                  </View>
                ))}
                <Pressable disabled={isStarting} onPress={() => void startWorkout("adjusted")} style={styles.primaryButton}>
                  {isStarting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Use adjusted workout</Text>}
                </Pressable>
              </View>
            </View>

            <Text style={styles.controlNote}>You can ignore Fortomnia's recommendation, choose the planned workout, or edit either session after it starts.</Text>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:"#0B0B0B"},content:{padding:20,paddingBottom:48},eyebrow:{color:"#60A5FA",fontSize:12,fontWeight:"900",letterSpacing:1.2},title:{color:"#FFFFFF",fontSize:32,fontWeight:"900",marginTop:6},subtitle:{color:"#9CA3AF",fontSize:15,lineHeight:22,marginBottom:18,marginTop:8},previewNotice:{backgroundColor:"#17131F",borderColor:"#3B2A55",borderRadius:14,borderWidth:1,padding:14,marginBottom:22},previewLabel:{color:"#A78BFA",fontSize:11,fontWeight:"900",letterSpacing:1},previewText:{color:"#B9B2C8",fontSize:13,lineHeight:19,marginTop:6},sectionTitle:{color:"#FFFFFF",fontSize:19,fontWeight:"800",marginBottom:10},templateButton:{backgroundColor:"#151515",borderColor:"#2B2B2B",borderRadius:14,borderWidth:1,padding:14,marginBottom:9},templateButtonSelected:{borderColor:"#2563EB",backgroundColor:"#111827"},templateName:{color:"#FFFFFF",fontSize:16,fontWeight:"800"},templateNotes:{color:"#8F96A3",fontSize:12,marginTop:4},recoveryCard:{backgroundColor:"#171717",borderColor:"#3B3B3B",borderRadius:16,borderWidth:1,padding:16,marginBottom:14,marginTop:16},recoveryHeadline:{color:"#FBBF24",fontSize:18,fontWeight:"900"},recoveryText:{color:"#D1D5DB",fontSize:13,lineHeight:19,marginTop:7},recoveryGuidance:{color:"#9CA3AF",fontSize:13,lineHeight:19,marginTop:8},choiceRow:{gap:12},choiceCard:{backgroundColor:"#151515",borderColor:"#303030",borderRadius:16,borderWidth:1,padding:16},adjustedCard:{borderColor:"#2563EB"},choiceLabel:{color:"#9CA3AF",fontSize:11,fontWeight:"900",letterSpacing:1},adjustedLabel:{color:"#60A5FA",fontSize:11,fontWeight:"900",letterSpacing:1},choiceTitle:{color:"#FFFFFF",fontSize:20,fontWeight:"900",marginTop:5},choiceText:{color:"#9CA3AF",fontSize:13,lineHeight:19,marginBottom:10,marginTop:5},exerciseRow:{borderTopColor:"#292929",borderTopWidth:1,paddingVertical:9},exerciseName:{color:"#F3F4F6",fontSize:14,fontWeight:"700"},exerciseTarget:{color:"#9CA3AF",fontSize:12,marginTop:3},secondaryButton:{alignItems:"center",borderColor:"#4B5563",borderRadius:12,borderWidth:1,marginTop:10,paddingVertical:13},secondaryText:{color:"#F3F4F6",fontWeight:"800"},primaryButton:{alignItems:"center",backgroundColor:"#2563EB",borderRadius:12,marginTop:10,minHeight:48,justifyContent:"center",paddingVertical:13},primaryText:{color:"#FFFFFF",fontWeight:"900"},controlNote:{color:"#6B7280",fontSize:12,lineHeight:18,marginTop:14,textAlign:"center"},
});
