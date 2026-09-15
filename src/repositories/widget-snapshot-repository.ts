import { getLocalDateKey } from "../lib/dates";
import { calculateReadiness, type ReadinessBand } from "../lib/readiness";
import { supabase } from "../lib/supabase";

export type WidgetNextWorkout = {
  exerciseCount: number;
  id: string;
  locationName: string;
  name: string;
};

export type WidgetRecovery = {
  band: ReadinessBand;
  checkInDate: string;
  label: string;
  score: number;
};

type RecoveryWidgetRow = {
  checkin_date: string;
  energy_level: number;
  mood: number;
  muscle_soreness: number;
  sleep_duration_minutes: number;
  sleep_quality: number;
  stress_level: number;
};

export interface WidgetSnapshotRepository {
  loadNextWorkout(userId: string): Promise<WidgetNextWorkout | null>;
  loadRecovery(userId: string): Promise<WidgetRecovery | null>;
}

class SupabaseWidgetSnapshotRepository implements WidgetSnapshotRepository {
  async loadRecovery(userId: string): Promise<WidgetRecovery | null> {
    const today = getLocalDateKey();
    const { data, error } = await supabase
      .from("daily_recovery_checkins")
      .select(
        "checkin_date, sleep_duration_minutes, sleep_quality, energy_level, muscle_soreness, stress_level, mood",
      )
      .eq("user_id", userId)
      .eq("checkin_date", today)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const checkIn = data as RecoveryWidgetRow;
    const readiness = calculateReadiness({
      energyLevel: checkIn.energy_level,
      mood: checkIn.mood,
      muscleSoreness: checkIn.muscle_soreness,
      sleepDurationMinutes: checkIn.sleep_duration_minutes,
      sleepQuality: checkIn.sleep_quality,
      stressLevel: checkIn.stress_level,
    });

    return {
      band: readiness.band,
      checkInDate: checkIn.checkin_date,
      label: readiness.label,
      score: readiness.score,
    };
  }

  async loadNextWorkout(userId: string): Promise<WidgetNextWorkout | null> {
    const [templateResult, locationResult] = await Promise.all([
      supabase
        .from("workout_templates")
        .select("id, name")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("training_locations")
        .select("name")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle(),
    ]);

    if (templateResult.error) throw templateResult.error;
    if (locationResult.error) throw locationResult.error;
    if (!templateResult.data) return null;

    const countResult = await supabase
      .from("workout_template_exercises")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("template_id", templateResult.data.id);

    if (countResult.error) throw countResult.error;

    return {
      exerciseCount: countResult.count ?? 0,
      id: templateResult.data.id,
      locationName: locationResult.data?.name ?? "",
      name: templateResult.data.name,
    };
  }
}

export const widgetSnapshotRepository: WidgetSnapshotRepository =
  new SupabaseWidgetSnapshotRepository();
