import { useEffect } from "react";
import { AppState } from "react-native";

import { useAuth } from "../providers/AuthProvider";
import { workoutRepository } from "../repositories/supabaseWorkoutRepository";

export function WorkoutMutationSync() {
  const { session } = useAuth();

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) return;

    let active = true;
    const sync = async () => {
      if (!active) return;
      try {
        await workoutRepository.syncPendingMutations(userId);
      } catch {
        // The durable queue remains authoritative and will retry next resume.
      }
    };

    void sync();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void sync();
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, [session?.user.id]);

  return null;
}
