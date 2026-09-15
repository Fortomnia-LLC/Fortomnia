import { supabase } from "../lib/supabase";

export type WidgetNextWorkout = {
  exerciseCount: number;
  id: string;
  locationName: string;
  name: string;
};

export interface WidgetSnapshotRepository {
  loadNextWorkout(userId: string): Promise<WidgetNextWorkout | null>;
}

class SupabaseWidgetSnapshotRepository implements WidgetSnapshotRepository {
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
