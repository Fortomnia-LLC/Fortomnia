import { Link } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { type Exercise, useExercises } from "../hooks/useExercises";
import { useWorkoutSessions } from "../hooks/useWorkoutSessions";
import { useWorkoutTemplates } from "../hooks/useWorkoutTemplates";

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <Link href={{ pathname: "/exercise/[id]", params: { id: exercise.id } }} asChild>
      <Pressable style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          {exercise.owner_id ? <Text style={styles.customBadge}>CUSTOM</Text> : null}
        </View>
        <Text style={styles.exerciseDetails}>{exercise.muscle_group}{exercise.equipment ? ` • ${exercise.equipment}` : ""}</Text>
      </Pressable>
    </Link>
  );
}

export default function TrainingScreen() {
  const { errorMessage, exercises, isLoading, refreshExercises } = useExercises();
  const { errorMessage: workoutError, isLoading: workoutsLoading, refreshWorkoutSessions, workoutSessions } = useWorkoutSessions();
  const { errorMessage: templateError, isLoading: templatesLoading, refreshTemplates, templates } = useWorkoutTemplates();

  if (isLoading && exercises.length === 0) {
    return <SafeAreaView style={styles.loadingScreen}><ActivityIndicator color="#F97316" size="large" /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={exercises.slice(0, 5)}
        keyExtractor={(exercise) => exercise.id}
        onRefresh={() => void Promise.all([refreshExercises(), refreshWorkoutSessions(), refreshTemplates()])}
        refreshing={isLoading || workoutsLoading || templatesLoading}
        renderItem={({ item }) => <ExerciseCard exercise={item} />}
        ListHeaderComponent={<View style={styles.header}>
          <Text style={styles.eyebrow}>FORTOMNIA</Text>
          <Text style={styles.title}>Training</Text>
          <Text style={styles.subtitle}>Your exercise library is ready for workout logging.</Text>
          <Link href="/new-workout" asChild><Pressable style={styles.startButton}><Text style={styles.startButtonText}>Start workout</Text></Pressable></Link>

          {templates.length > 0 ? (
            <Link href="/recovery-workout" asChild>
              <Pressable style={styles.intelligenceCard}>
                <View style={styles.intelligenceHeader}>
                  <Text style={styles.intelligenceBadge}>TRAINING INTELLIGENCE</Text>
                  <Text style={styles.freeBadge}>FREE</Text>
                </View>
                <Text style={styles.intelligenceTitle}>Check today's recovery-adjusted workout</Text>
                <Text style={styles.intelligenceText}>Compare your saved plan with Fortomnia's recovery-aware suggestion. You choose which workout to start.</Text>
                <Text style={styles.intelligenceAction}>Compare workouts →</Text>
              </Pressable>
            </Link>
          ) : null}

          <View style={styles.templateHeader}><Text style={styles.sectionTitle}>Workout templates</Text><Link href="/new-template" asChild><Pressable style={styles.templateCreateButton}><Text style={styles.templateCreateText}>New template</Text></Pressable></Link></View>
          {templateError ? <Text accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.error}>{templateError}</Text> : null}
          {templates.length === 0 ? <Text style={styles.sessionEmpty}>No workout templates yet.</Text> : templates.map((template) => (
            <Link key={template.id} href={{ pathname: "/template/[id]", params: { id: template.id } }} asChild>
              <Pressable style={styles.templateCard}><Text style={styles.templateName}>{template.name}</Text><Text style={styles.templateNotes}>{template.notes ?? "Exercises not configured yet."}</Text></Pressable>
            </Link>
          ))}

          <Text style={styles.sectionTitle}>Recent workouts</Text>
          {workoutError ? <Text accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.error}>{workoutError}</Text> : null}
          {workoutSessions.length === 0 ? <Text style={styles.sessionEmpty}>No workouts logged yet.</Text> : workoutSessions.map((workout) => (
            <Link key={workout.id} href={{ pathname: "/workout/[id]", params: { id: workout.id } }} asChild>
              <Pressable style={styles.sessionCard}><View style={styles.sessionHeader}><Text style={styles.sessionName}>{workout.name}</Text><Text style={[styles.sessionStatus, workout.completed_at ? styles.completedStatus : styles.activeStatus]}>{workout.completed_at ? "COMPLETED" : "ACTIVE"}</Text></View><Text style={styles.sessionDate}>{new Date(workout.started_at).toLocaleDateString()}</Text></Pressable>
            </Link>
          ))}
          <View style={styles.summary}><Text style={styles.summaryNumber}>{exercises.length}</Text><Text style={styles.summaryLabel}>available exercises</Text></View>
          {errorMessage ? <Text accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}
          <View style={styles.templateHeader}><Text style={styles.sectionTitle}>Exercise preview</Text><Link href="/exercise-library" asChild><Pressable style={styles.templateCreateButton}><Text style={styles.templateCreateText}>Browse all</Text></Pressable></Link></View>
        </View>}
        ListEmptyComponent={<Text style={styles.empty}>No exercises are available yet.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingScreen:{alignItems:"center",backgroundColor:"#0B0B0B",flex:1,justifyContent:"center"},screen:{backgroundColor:"#0B0B0B",flex:1},listContent:{paddingBottom:30,paddingHorizontal:20},header:{paddingTop:30},eyebrow:{color:"#F97316",fontSize:14,fontWeight:"800",letterSpacing:3,marginBottom:12},title:{color:"#FFFFFF",fontSize:36,fontWeight:"800"},subtitle:{color:"#9CA3AF",fontSize:16,marginBottom:24,marginTop:8},startButton:{alignItems:"center",backgroundColor:"#2563EB",borderRadius:12,justifyContent:"center",marginBottom:14,minHeight:52},startButtonText:{color:"#FFFFFF",fontSize:16,fontWeight:"800"},intelligenceCard:{backgroundColor:"#101827",borderColor:"#2563EB",borderRadius:16,borderWidth:1,marginBottom:26,padding:16},intelligenceHeader:{alignItems:"center",flexDirection:"row",justifyContent:"space-between"},intelligenceBadge:{color:"#60A5FA",fontSize:11,fontWeight:"900",letterSpacing:1},freeBadge:{backgroundColor:"#1E3A5F",borderRadius:999,color:"#93C5FD",fontSize:10,fontWeight:"900",overflow:"hidden",paddingHorizontal:8,paddingVertical:4},intelligenceTitle:{color:"#FFFFFF",fontSize:18,fontWeight:"900",marginTop:10},intelligenceText:{color:"#AAB2C0",fontSize:13,lineHeight:19,marginTop:6},intelligenceAction:{color:"#60A5FA",fontSize:13,fontWeight:"800",marginTop:12},summary:{alignItems:"baseline",backgroundColor:"#1A1A1A",borderColor:"#2A2A2A",borderRadius:18,borderWidth:1,flexDirection:"row",gap:10,marginBottom:28,padding:20},summaryNumber:{color:"#F97316",fontSize:30,fontWeight:"800"},summaryLabel:{color:"#D1D5DB",fontSize:15},error:{color:"#F87171",marginBottom:18},sectionTitle:{color:"#FFFFFF",fontSize:20,fontWeight:"700",marginBottom:14},card:{backgroundColor:"#171717",borderColor:"#292929",borderRadius:14,borderWidth:1,marginBottom:10,padding:16},cardHeader:{alignItems:"center",flexDirection:"row",justifyContent:"space-between"},exerciseName:{color:"#FFFFFF",flex:1,fontSize:17,fontWeight:"700"},customBadge:{color:"#F97316",fontSize:10,fontWeight:"800",letterSpacing:1},exerciseDetails:{color:"#9CA3AF",fontSize:14,marginTop:7},empty:{color:"#9CA3AF",paddingVertical:30,textAlign:"center"},templateHeader:{alignItems:"center",flexDirection:"row",justifyContent:"space-between"},templateCreateButton:{borderColor:"#2563EB",borderRadius:8,borderWidth:1,marginBottom:14,paddingHorizontal:12,paddingVertical:8},templateCreateText:{color:"#F97316",fontSize:13,fontWeight:"700"},templateCard:{backgroundColor:"#171717",borderColor:"#292929",borderRadius:14,borderWidth:1,marginBottom:10,padding:16},templateName:{color:"#FFFFFF",fontSize:17,fontWeight:"700"},templateNotes:{color:"#9CA3AF",fontSize:13,marginTop:6},sessionEmpty:{color:"#9CA3AF",marginBottom:24},sessionCard:{backgroundColor:"#171717",borderColor:"#292929",borderRadius:14,borderWidth:1,marginBottom:10,padding:16},sessionHeader:{alignItems:"center",flexDirection:"row",justifyContent:"space-between"},sessionName:{color:"#FFFFFF",flex:1,fontSize:17,fontWeight:"700"},sessionStatus:{fontSize:10,fontWeight:"800",letterSpacing:1},activeStatus:{color:"#F97316"},completedStatus:{color:"#34D399"},sessionDate:{color:"#9CA3AF",fontSize:14,marginTop:7},
});
