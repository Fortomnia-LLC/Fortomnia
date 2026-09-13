import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { EQUIPMENT_LABELS, EQUIPMENT_OPTIONS, type EquipmentOption } from "../lib/equipment";
import { supabase } from "../lib/supabase";
import { replacementLocationId, TRAINING_LOCATION_LABELS, TRAINING_LOCATION_TYPES, validateTrainingLocation, type TrainingLocation, type TrainingLocationType } from "../lib/trainingLocations";
import { useAuth } from "../providers/AuthProvider";

export default function TrainingLocationsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [locations, setLocations] = useState<TrainingLocation[]>([]);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [locationType, setLocationType] = useState<TrainingLocationType>("gym");
  const [equipment, setEquipment] = useState<EquipmentOption[]>(["full_gym"]);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingLocationId, setDeletingLocationId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.user.id) return;
    const { data, error } = await supabase.from("training_locations").select("id, user_id, name, location_type, equipment, notes, is_active, updated_at").eq("user_id", session.user.id).order("is_active", { ascending: false }).order("name");
    if (error) setMessage(error.message);
    else setLocations((data ?? []) as TrainingLocation[]);
    setIsLoading(false);
  }, [session?.user.id]);

  useEffect(() => { void load(); }, [load]);

  function toggleEquipment(option: EquipmentOption) {
    setEquipment((current) => current.includes(option) ? current.filter((item) => item !== option) : [...current, option]);
  }

  function resetForm() {
    setEditingLocationId(null);
    setName("");
    setNotes("");
    setLocationType("gym");
    setEquipment(["full_gym"]);
  }

  function editLocation(location: TrainingLocation) {
    setEditingLocationId(location.id);
    setName(location.name);
    setNotes(location.notes ?? "");
    setLocationType(location.location_type);
    setEquipment(location.equipment);
    setMessage(null);
  }

  async function saveLocation() {
    if (!session?.user.id) return;
    const validation = validateTrainingLocation({ name, notes, equipment });
    if (validation) { setMessage(validation); return; }
    setIsSaving(true);
    setMessage(null);
    const savedName = name.trim();

    if (editingLocationId) {
      const { data, error } = await supabase
        .from("training_locations")
        .update({
          name: savedName,
          notes: notes.trim() || null,
          location_type: locationType,
          equipment,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingLocationId)
        .eq("user_id", session.user.id)
        .select("id")
        .maybeSingle();

      if (error || !data) {
        setMessage(
          error?.code === "23505"
            ? "You already have a location with that name."
            : error?.message ?? "That location could not be updated.",
        );
      } else {
        resetForm();
        setMessage(`${savedName} updated.`);
        await load();
      }
    } else {
      const { data, error } = await supabase.from("training_locations").insert({ user_id: session.user.id, name: savedName, notes: notes.trim() || null, location_type: locationType, equipment, is_active: locations.length === 0 }).select("id").single();
      if (error) setMessage(error.code === "23505" ? "You already have a location with that name." : error.message);
      else { resetForm(); setMessage(`${savedName} saved.`); await load(); if (locations.length === 0 && data?.id) await setActive(data.id); }
    }

    setIsSaving(false);
  }

  async function setActive(id: string) {
    const { error } = await supabase.rpc("set_active_training_location", { location_id: id });
    if (error) setMessage(error.message);
    else { setMessage("Active training location updated."); await load(); }
  }

  function remove(location: TrainingLocation) {
    Alert.alert("Delete location?", `${location.name} and its equipment list will be removed.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        if (!session?.user.id) return;
        setDeletingLocationId(location.id);
        const { data, error } = await supabase.from("training_locations").delete().eq("id", location.id).eq("user_id", session.user.id).select("id").maybeSingle();
        if (error || !data) {
          setMessage(error?.message ?? "That location could not be deleted.");
          setDeletingLocationId(null);
          return;
        }

        if (editingLocationId === location.id) resetForm();
        const replacementId = location.is_active
          ? replacementLocationId(locations, location.id)
          : null;

        if (replacementId) {
          const { error: activeError } = await supabase.rpc("set_active_training_location", { location_id: replacementId });
          if (activeError) setMessage(`${location.name} was deleted, but another active location could not be selected.`);
          else setMessage(`${location.name} deleted. Another saved location is now active.`);
        } else {
          setMessage(`${location.name} deleted.`);
        }

        await load();
        setDeletingLocationId(null);
      } },
    ]);
  }

  return <SafeAreaView style={styles.screen}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={styles.back}>‹ Profile</Text></Pressable>
    <Text style={styles.eyebrow}>TRAINING LOCATIONS</Text><Text style={styles.title}>Equipment where you train</Text>
    <Text style={styles.subtitle}>Choose an active location so Fortomnia can build sessions around equipment that is actually available.</Text>
    {isLoading ? <ActivityIndicator color="#F97316" /> : locations.map((location) => <View key={location.id} style={[styles.card, location.is_active && styles.activeCard]}>
      <View style={styles.row}><View style={styles.flex}><Text style={styles.cardTitle}>{location.name}</Text><Text style={styles.cardMeta}>{TRAINING_LOCATION_LABELS[location.location_type]} · {location.equipment.map((item) => EQUIPMENT_LABELS[item]).join(", ")}</Text>{location.notes ? <Text style={styles.notes}>{location.notes}</Text> : null}</View>{location.is_active ? <Text style={styles.active}>ACTIVE</Text> : null}</View>
      <View style={styles.actions}>{!location.is_active ? <Pressable accessibilityLabel={`Use ${location.name} as active training location`} accessibilityRole="button" onPress={() => void setActive(location.id)}><Text style={styles.action}>Use here</Text></Pressable> : null}<Pressable accessibilityLabel={`Edit ${location.name}`} accessibilityRole="button" onPress={() => editLocation(location)}><Text style={styles.action}>Edit</Text></Pressable><Pressable accessibilityLabel={`Delete ${location.name}`} accessibilityRole="button" disabled={deletingLocationId === location.id} onPress={() => remove(location)}><Text style={styles.delete}>{deletingLocationId === location.id ? "Deleting…" : "Delete"}</Text></Pressable></View>
    </View>)}
    <Text style={styles.section}>{editingLocationId ? "Edit location" : "Add a location"}</Text><TextInput accessibilityLabel="Location name" onChangeText={setName} placeholder="Downtown gym or hotel" placeholderTextColor="#6B7280" style={styles.input} value={name} />
    <View style={styles.wrap}>{TRAINING_LOCATION_TYPES.map((type) => <Pressable key={type} onPress={() => setLocationType(type)} style={[styles.chip, locationType === type && styles.selected]}><Text style={styles.chipText}>{TRAINING_LOCATION_LABELS[type]}</Text></Pressable>)}</View>
    <Text style={styles.label}>Available equipment</Text><View style={styles.wrap}>{EQUIPMENT_OPTIONS.map((option) => <Pressable key={option} onPress={() => toggleEquipment(option)} style={[styles.chip, equipment.includes(option) && styles.selected]}><Text style={styles.chipText}>{EQUIPMENT_LABELS[option]}</Text></Pressable>)}</View>
    <TextInput accessibilityLabel="Location notes" multiline onChangeText={setNotes} placeholder="Hours, access notes, equipment limits…" placeholderTextColor="#6B7280" style={[styles.input, styles.notesInput]} value={notes} />
    {message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text> : null}
    <Pressable accessibilityLabel={editingLocationId ? "Save location changes" : "Save new location"} accessibilityRole="button" disabled={isSaving} onPress={() => void saveLocation()} style={[styles.save, isSaving && styles.disabled]}>{isSaving ? <ActivityIndicator color="#0B0B0B" /> : <Text style={styles.saveText}>{editingLocationId ? "Save changes" : "Save location"}</Text>}</Pressable>
    {editingLocationId ? <Pressable accessibilityLabel="Cancel location editing" accessibilityRole="button" disabled={isSaving} onPress={resetForm} style={styles.cancel}><Text style={styles.cancelText}>Cancel editing</Text></Pressable> : null}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({screen:{backgroundColor:"#0B0B0B",flex:1},content:{padding:22,paddingBottom:48},back:{color:"#60A5FA",fontSize:16,fontWeight:"700",paddingVertical:10},eyebrow:{color:"#F97316",fontSize:12,fontWeight:"900",letterSpacing:1.6,marginTop:14},title:{color:"#FFF",fontSize:32,fontWeight:"900",marginTop:7},subtitle:{color:"#9CA3AF",fontSize:14,lineHeight:20,marginBottom:22,marginTop:8},card:{backgroundColor:"#171717",borderColor:"#303030",borderRadius:14,borderWidth:1,marginBottom:10,padding:15},activeCard:{borderColor:"#F97316"},row:{flexDirection:"row",gap:10},flex:{flex:1},cardTitle:{color:"#FFF",fontSize:17,fontWeight:"800"},cardMeta:{color:"#9CA3AF",fontSize:12,lineHeight:18,marginTop:5},notes:{color:"#D1D5DB",fontSize:12,marginTop:7},active:{color:"#F97316",fontSize:10,fontWeight:"900"},actions:{flexDirection:"row",gap:24,marginTop:12},action:{color:"#60A5FA",fontWeight:"800"},delete:{color:"#F87171",fontWeight:"700"},section:{color:"#FFF",fontSize:21,fontWeight:"900",marginBottom:12,marginTop:18},input:{backgroundColor:"#171717",borderColor:"#333",borderRadius:10,borderWidth:1,color:"#FFF",fontSize:15,marginBottom:13,padding:13},notesInput:{minHeight:82,textAlignVertical:"top"},label:{color:"#D1D5DB",fontSize:14,fontWeight:"700",marginBottom:10,marginTop:5},wrap:{flexDirection:"row",flexWrap:"wrap",gap:8,marginBottom:16},chip:{backgroundColor:"#171717",borderColor:"#3A3A3A",borderRadius:999,borderWidth:1,paddingHorizontal:11,paddingVertical:8},selected:{backgroundColor:"#1E3A5F",borderColor:"#60A5FA"},chipText:{color:"#E5E7EB",fontSize:12,fontWeight:"700"},message:{color:"#FBBF24",fontSize:13,marginBottom:12},save:{alignItems:"center",backgroundColor:"#F97316",borderRadius:12,minHeight:52,justifyContent:"center"},saveText:{color:"#0B0B0B",fontSize:16,fontWeight:"900"},cancel:{alignItems:"center",borderColor:"#4B5563",borderRadius:12,borderWidth:1,justifyContent:"center",marginTop:10,minHeight:48},cancelText:{color:"#D1D5DB",fontSize:15,fontWeight:"800"},disabled:{opacity:.5}});
