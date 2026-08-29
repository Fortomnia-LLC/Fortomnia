import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { buildCoachPlanPreview, parseCommaSeparated, TRAINING_LOCATIONS, TRAINING_LOCATION_LABELS, type CoachQuestionnaire, type TrainingLocation } from "../lib/coachQuestionnaire";
import { getRelevantSpecialtyEquipment } from "../lib/specialtyEquipmentDiscovery";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";
import { useProfile } from "../hooks/useProfile";

const STEPS = ["Goals", "Performance", "Training", "Nutrition", "Cardio", "Mobility", "Your plan"] as const;
const numberOrNull = (value: string) => value.trim() && Number.isFinite(Number(value)) ? Number(value) : null;

export default function CoachQuestionnaireScreen() {
  const { session } = useAuth();
  const { profile, isLoading } = useProfile();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [primaryFocus, setPrimaryFocus] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [metricName, setMetricName] = useState("");
  const [metricCurrent, setMetricCurrent] = useState("");
  const [metricTarget, setMetricTarget] = useState("");
  const [metricUnit, setMetricUnit] = useState("");
  const [locations, setLocations] = useState<TrainingLocation[]>([]);
  const [locationDetails, setLocationDetails] = useState("");
  const [days, setDays] = useState("");
  const [minutes, setMinutes] = useState("");
  const [sports, setSports] = useState("");
  const [specialtyEquipment, setSpecialtyEquipment] = useState<string[]>([]);
  const [specialtyEquipmentLoaded, setSpecialtyEquipmentLoaded] = useState(false);
  const [nutrition, setNutrition] = useState("");
  const [cardio, setCardio] = useState("");
  const [preferredCardio, setPreferredCardio] = useState("");
  const [mobility, setMobility] = useState("");

  useEffect(() => {
    if (!profile) return;
    setPrimaryFocus(profile.coach_primary_focus ?? "");
    setEventName(profile.coach_target_event_name ?? "");
    setEventDate(profile.coach_target_event_date ?? "");
    setMetricName(profile.coach_priority_metric_name ?? "");
    setMetricCurrent(profile.coach_priority_metric_current?.toString() ?? "");
    setMetricTarget(profile.coach_priority_metric_target?.toString() ?? "");
    setMetricUnit(profile.coach_priority_metric_unit ?? "");
    setLocations(profile.coach_training_locations ?? []);
    setLocationDetails(profile.coach_training_location_details ?? "");
    setDays(profile.coach_weekly_training_days?.toString() ?? "");
    setMinutes(profile.coach_session_minutes?.toString() ?? "");
    setSports((profile.coach_sports ?? []).join(", "));
    setNutrition(profile.coach_nutrition_focus ?? "");
    setCardio(profile.coach_cardio_focus ?? "");
    setPreferredCardio((profile.coach_preferred_cardio ?? []).join(", "));
    setMobility(profile.coach_mobility_focus ?? "");
  }, [profile]);

  useEffect(() => {
    if (!session?.user.id || specialtyEquipmentLoaded) return;
    let active = true;
    async function loadSpecialtyEquipment() {
      const { data, error } = await supabase
        .from("user_specialty_equipment")
        .select("available, specialty_implements!inner(slug)")
        .eq("user_id", session!.user.id)
        .eq("available", true);
      if (!active) return;
      if (!error) {
        const slugs = (data ?? []).map((row: any) => row.specialty_implements?.slug).filter(Boolean);
        setSpecialtyEquipment(slugs);
      }
      setSpecialtyEquipmentLoaded(true);
    }
    loadSpecialtyEquipment();
    return () => { active = false; };
  }, [session?.user.id, specialtyEquipmentLoaded]);

  const questionnaire: CoachQuestionnaire = useMemo(() => ({
    cardioFocus: cardio, mobilityFocus: mobility, nutritionFocus: nutrition,
    preferredCardio: parseCommaSeparated(preferredCardio), primaryFocus,
    priorityMetricCurrent: numberOrNull(metricCurrent), priorityMetricName: metricName,
    priorityMetricTarget: numberOrNull(metricTarget), priorityMetricUnit: metricUnit,
    sessionMinutes: numberOrNull(minutes), sports: parseCommaSeparated(sports),
    targetEventDate: /^\d{4}-\d{2}-\d{2}$/.test(eventDate) ? eventDate : null,
    targetEventName: eventName, trainingLocationDetails: locationDetails,
    trainingLocations: locations, weeklyTrainingDays: numberOrNull(days),
  }), [cardio, mobility, nutrition, preferredCardio, primaryFocus, metricCurrent, metricName, metricTarget, metricUnit, minutes, sports, eventDate, eventName, locationDetails, locations, days]);

  const preview = buildCoachPlanPreview(questionnaire);
  const relevantSpecialtyEquipment = useMemo(() => getRelevantSpecialtyEquipment(questionnaire.sports, primaryFocus, eventName), [questionnaire.sports, primaryFocus, eventName]);
  const toggleLocation = (location: TrainingLocation) => setLocations((current) => current.includes(location) ? current.filter((item) => item !== location) : [...current, location]);
  const toggleSpecialtyEquipment = (slug: string) => setSpecialtyEquipment((current) => current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]);

  async function save() {
    if (!session?.user.id) return;
    setSaving(true); setMessage(null);
    const { error: profileError } = await supabase.from("profiles").update({
      coach_cardio_focus: cardio.trim() || null,
      coach_mobility_focus: mobility.trim() || null,
      coach_nutrition_focus: nutrition.trim() || null,
      coach_preferred_cardio: questionnaire.preferredCardio,
      coach_primary_focus: primaryFocus.trim() || null,
      coach_priority_metric_current: questionnaire.priorityMetricCurrent,
      coach_priority_metric_name: metricName.trim() || null,
      coach_priority_metric_target: questionnaire.priorityMetricTarget,
      coach_priority_metric_unit: metricUnit.trim() || null,
      coach_session_minutes: questionnaire.sessionMinutes,
      coach_sports: questionnaire.sports,
      coach_target_event_date: questionnaire.targetEventDate,
      coach_target_event_name: eventName.trim() || null,
      coach_training_location_details: locationDetails.trim() || null,
      coach_training_locations: locations,
      coach_weekly_training_days: questionnaire.weeklyTrainingDays,
    }).eq("id", session.user.id);

    let equipmentError: { message: string } | null = null;
    if (!profileError) {
      const { error: deleteError } = await supabase.from("user_specialty_equipment").delete().eq("user_id", session.user.id);
      equipmentError = deleteError;
      if (!deleteError && specialtyEquipment.length > 0) {
        const { data: implementsData, error: implementsError } = await supabase.from("specialty_implements").select("id, slug").in("slug", specialtyEquipment);
        equipmentError = implementsError;
        if (!implementsError) {
          const rows = (implementsData ?? []).map((item) => ({ user_id: session.user.id, implement_id: item.id, available: true }));
          if (rows.length > 0) {
            const { error: insertError } = await supabase.from("user_specialty_equipment").insert(rows);
            equipmentError = insertError;
          }
        }
      }
    }

    setSaving(false);
    const error = profileError ?? equipmentError;
    if (error) setMessage(error.message); else setMessage("Athletic profile saved. Fortomnia can now use your equipment access when choosing exercises and substitutions.");
  }

  if (isLoading) return <View style={styles.loading}><ActivityIndicator /></View>;

  const input = (label: string, value: string, setter: (value: string) => void, placeholder: string, multiline = false, keyboardType: "default" | "numeric" = "default") => <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} keyboardType={keyboardType} multiline={multiline} onChangeText={setter} placeholder={placeholder} placeholderTextColor="#727885" style={[styles.input, multiline && styles.multiline]} value={value} /></View>;

  return <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
    <Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>ATHLETIC PROFILE</Text><Text style={styles.title}>Help Fortomnia understand you.</Text>
    <Text style={styles.subtitle}>Your profile is free. Premium AI Coach will use it for deeper conversational and adaptive coaching.</Text>
    <Text style={styles.progress}>STEP {step + 1} OF {STEPS.length} · {STEPS[step].toUpperCase()}</Text>

    {step === 0 && <View>{input("What do you most want to improve?", primaryFocus, setPrimaryFocus, "Grip strength, vertical jump, physique, endurance…", true)}{input("Target event or milestone (optional)", eventName, setEventName, "Powerlifting meet, bodybuilding show, race…")}{input("Target date (optional)", eventDate, setEventDate, "YYYY-MM-DD")}</View>}
    {step === 1 && <View>{input("Priority metric", metricName, setMetricName, "Grip dynamometer, 1RM squat, 40-yard dash…")}{input("Current value", metricCurrent, setMetricCurrent, "135", false, "numeric")}{input("Target value", metricTarget, setMetricTarget, "175", false, "numeric")}{input("Unit", metricUnit, setMetricUnit, "lb, kg, sec, in, cm…")}</View>}
    {step === 2 && <View><Text style={styles.label}>Where do you train?</Text><View style={styles.chips}>{TRAINING_LOCATIONS.map((item) => <Pressable key={item} accessibilityRole="checkbox" accessibilityState={{ checked: locations.includes(item) }} onPress={() => toggleLocation(item)} style={[styles.chip, locations.includes(item) && styles.chipSelected]}><Text style={styles.chipText}>{TRAINING_LOCATION_LABELS[item]}</Text></Pressable>)}</View>{input("Location / equipment details", locationDetails, setLocationDetails, "Gym name, special equipment, home setup…", true)}{input("Training days per week", days, setDays, "4", false, "numeric")}{input("Typical session length (minutes)", minutes, setMinutes, "75", false, "numeric")}{input("Sports or disciplines", sports, setSports, "Powerlifting, climbing, tennis…")}{relevantSpecialtyEquipment.length > 0 && <View style={styles.specialtySection}><Text style={styles.label}>Specialty equipment you can use</Text><Text style={styles.hint}>Only equipment relevant to your goals is shown. Leave anything unavailable unchecked and Fortomnia can choose an appropriate substitute.</Text><View style={styles.chips}>{relevantSpecialtyEquipment.map((item) => <Pressable key={item.slug} accessibilityRole="checkbox" accessibilityState={{ checked: specialtyEquipment.includes(item.slug) }} onPress={() => toggleSpecialtyEquipment(item.slug)} style={[styles.chip, specialtyEquipment.includes(item.slug) && styles.chipSelected]}><Text style={styles.chipText}>{item.label}</Text></Pressable>)}</View></View>}</View>}
    {step === 3 && <View>{input("Nutrition goals and preferences", nutrition, setNutrition, "Gain muscle without excessive fat, make weight for a meet, improve fueling…", true)}<Text style={styles.hint}>Fortomnia can combine this with your existing body data, calorie direction, activity level, and macro calculator.</Text></View>}
    {step === 4 && <View>{input("What should cardio improve?", cardio, setCardio, "Aerobic base, work capacity, race conditioning, fat-loss support…", true)}{input("Preferred cardio", preferredCardio, setPreferredCardio, "Incline walk, bike, rower, running…")}</View>}
    {step === 5 && <View>{input("Mobility, flexibility, or stretching priorities", mobility, setMobility, "Ankle mobility for squats, shoulder ROM, splits, post-training stretching…", true)}</View>}
    {step === 6 && <View><Text style={styles.planTitle}>Your coaching direction</Text>{Object.entries(preview).map(([key, value]) => <View key={key} style={styles.planCard}><Text style={styles.planLabel}>{key.toUpperCase()}</Text><Text style={styles.planText}>{value}</Text></View>)}<Text style={styles.hint}>This preview is deterministic and available without AI. Premium AI Coach will reason across this profile, your logs, trends, and target dates behind a protected entitlement check.</Text></View>}

    {message && <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text>}
    <View style={styles.actions}>{step > 0 && <Pressable onPress={() => setStep((value) => value - 1)} style={styles.secondary}><Text style={styles.secondaryText}>Previous</Text></Pressable>}{step < STEPS.length - 1 ? <Pressable onPress={() => setStep((value) => value + 1)} style={styles.primary}><Text style={styles.primaryText}>Continue</Text></Pressable> : <Pressable disabled={saving} onPress={save} style={styles.primary}>{saving ? <ActivityIndicator color="#0B0B0B" /> : <Text style={styles.primaryText}>Save athletic profile</Text>}</Pressable>}</View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  actions:{flexDirection:"row",gap:12,marginTop:24},back:{color:"#9CA3AF",fontSize:16,marginBottom:18},chip:{borderColor:"#343434",borderRadius:999,borderWidth:1,paddingHorizontal:14,paddingVertical:11},chipSelected:{backgroundColor:"#1D4ED8",borderColor:"#2563EB"},chipText:{color:"#F5F5F5",fontWeight:"600"},chips:{flexDirection:"row",flexWrap:"wrap",gap:8,marginBottom:18},container:{backgroundColor:"#0B0B0B",flexGrow:1,padding:22,paddingBottom:48},eyebrow:{color:"#60A5FA",fontSize:12,fontWeight:"800",letterSpacing:1.5},field:{marginBottom:18},hint:{color:"#9CA3AF",fontSize:13,lineHeight:19,marginBottom:10,marginTop:4},input:{backgroundColor:"#151515",borderColor:"#303030",borderRadius:12,borderWidth:1,color:"#F5F5F5",fontSize:16,paddingHorizontal:14,paddingVertical:13},label:{color:"#D1D5DB",fontSize:13,fontWeight:"700",marginBottom:8},loading:{alignItems:"center",backgroundColor:"#0B0B0B",flex:1,justifyContent:"center"},message:{color:"#93C5FD",lineHeight:20,marginTop:18},multiline:{minHeight:100,textAlignVertical:"top"},planCard:{backgroundColor:"#151515",borderRadius:14,marginBottom:10,padding:16},planLabel:{color:"#60A5FA",fontSize:11,fontWeight:"800",letterSpacing:1},planText:{color:"#E5E7EB",lineHeight:21,marginTop:7},planTitle:{color:"#F9FAFB",fontSize:22,fontWeight:"800",marginBottom:14},primary:{alignItems:"center",backgroundColor:"#2563EB",borderRadius:12,flex:1,justifyContent:"center",minHeight:50,padding:14},primaryText:{color:"#FFFFFF",fontSize:15,fontWeight:"800"},progress:{color:"#9CA3AF",fontSize:12,fontWeight:"700",marginBottom:24,marginTop:22},secondary:{alignItems:"center",borderColor:"#3F3F46",borderRadius:12,borderWidth:1,flex:1,justifyContent:"center",minHeight:50,padding:14},secondaryText:{color:"#F5F5F5",fontWeight:"700"},specialtySection:{borderColor:"#252525",borderRadius:14,borderWidth:1,marginTop:4,padding:14},subtitle:{color:"#9CA3AF",fontSize:15,lineHeight:22,marginTop:8},title:{color:"#F9FAFB",fontSize:28,fontWeight:"900",marginTop:7},
});
