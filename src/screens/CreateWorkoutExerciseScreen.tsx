import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

export default function CreateWorkoutExerciseScreen() {
  const router = useRouter();
  const { returnId: returnIdParam, returnTo: returnToParam } = useLocalSearchParams<{ returnId: string; returnTo: "workout" | "template" }>();
  const returnId = Array.isArray(returnIdParam) ? returnIdParam[0] : returnIdParam;
  const returnTo = Array.isArray(returnToParam) ? returnToParam[0] : returnToParam;
  const { session } = useAuth();
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [equipment, setEquipment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function returnToPicker(exerciseId?: string) {
    if (!returnId) { router.replace("/training"); return; }
    if (returnTo === "template") {
      router.replace({ pathname: "/template/[id]/add-exercise", params: { id: returnId, ...(exerciseId ? { exerciseId } : {}) } });
    } else {
      router.replace({ pathname: "/workout/[id]/add-set", params: { id: returnId, ...(exerciseId ? { exerciseId } : {}) } });
    }
  }

  async function handleSave() {
    const trimmedName = name.trim();
    const trimmedMuscleGroup = muscleGroup.trim();
    if (!session?.user.id) { setErrorMessage("No authenticated user was found."); return; }
    if (!trimmedName) { setErrorMessage("Exercise name is required."); return; }
    if (!trimmedMuscleGroup) { setErrorMessage("Primary muscle group is required."); return; }
    setIsSaving(true); setErrorMessage(null);
    const { data, error } = await supabase.from("exercises").insert({
      aliases: [], equipment: equipment.trim() || null, instructions: null, is_unilateral: false,
      movement_pattern: "other", muscle_group: trimmedMuscleGroup, name: trimmedName,
      owner_id: session.user.id, secondary_muscles: [],
    }).select("id").single();
    setIsSaving(false);
    if (error || !data) {
      setErrorMessage(error?.code === "23505" ? "You already have a custom exercise with this name." : error?.message ?? "The exercise was not created.");
      return;
    }
    returnToPicker(data.id);
  }

  return <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" style={styles.screen}>
    <Pressable onPress={() => returnToPicker()} style={styles.navigation}><Text style={styles.navigationText}>‹ {returnTo === "template" ? "Template" : "Workout"}</Text></Pressable>
    <Text style={styles.eyebrow}>CUSTOM EXERCISE</Text>
    <Text style={styles.title}>Create and add</Text>
    <Text style={styles.subtitle}>Create a private exercise without leaving your {returnTo === "template" ? "template" : "active workout"}. It will be selected automatically when you return.</Text>
    <Text style={styles.label}>Exercise name</Text><TextInput autoCapitalize="words" onChangeText={setName} placeholder="Cable Y-raise" placeholderTextColor="#727885" style={styles.input} value={name} />
    <Text style={styles.label}>Primary muscle group</Text><TextInput autoCapitalize="words" onChangeText={setMuscleGroup} placeholder="Shoulders" placeholderTextColor="#727885" style={styles.input} value={muscleGroup} />
    <Text style={styles.label}>Equipment (optional)</Text><TextInput autoCapitalize="words" onChangeText={setEquipment} placeholder="Cable" placeholderTextColor="#727885" style={styles.input} value={equipment} />
    {errorMessage ? <Text selectable style={styles.error}>{errorMessage}</Text> : null}
    <Pressable disabled={isSaving} onPress={handleSave} style={[styles.saveButton, isSaving && styles.disabled]}>{isSaving ? <ActivityIndicator color="#0B0B0B" /> : <Text style={styles.saveText}>Create & add exercise</Text>}</Pressable>
  </ScrollView>;
}

const styles = StyleSheet.create({screen:{backgroundColor:"#0B0B0B",flex:1},content:{gap:8,paddingBottom:48,paddingHorizontal:22,paddingTop:24},navigation:{alignSelf:"flex-start",paddingBottom:20},navigationText:{color:"#F97316",fontSize:16,fontWeight:"700"},eyebrow:{color:"#F97316",fontSize:12,fontWeight:"800",letterSpacing:2.5},title:{color:"#FFFFFF",fontSize:34,fontWeight:"800",marginTop:2},subtitle:{color:"#9CA3AF",fontSize:15,lineHeight:22,marginBottom:12},label:{color:"#D1D5DB",fontSize:13,fontWeight:"700",marginTop:10},input:{backgroundColor:"#171717",borderColor:"#333333",borderRadius:10,borderWidth:1,color:"#FFFFFF",fontSize:16,paddingHorizontal:14,paddingVertical:12},error:{color:"#F87171",lineHeight:20,marginTop:10},saveButton:{alignItems:"center",backgroundColor:"#F97316",borderRadius:10,marginTop:18,paddingVertical:14},disabled:{opacity:.5},saveText:{color:"#0B0B0B",fontSize:15,fontWeight:"800"}});
