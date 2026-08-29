export const PERFORMANCE_PRIMITIVES = [
  "weight",
  "reps",
  "time",
  "distance",
  "attempts",
  "completion",
] as const;

export type PerformancePrimitive = (typeof PERFORMANCE_PRIMITIVES)[number];

export const PERFORMANCE_INTENTS = [
  "standard_sets",
  "hold_for_time",
  "timed_reps",
  "max_lift",
  "carry_for_distance",
  "series_for_time",
  "carry_series_for_time",
  "medley",
] as const;

export type PerformanceIntent = (typeof PERFORMANCE_INTENTS)[number];

export type SpecialtyEventDefinition = {
  slug: string;
  name: string;
  sport: "grip_sport" | "strongman";
  objective: string;
  primitives: PerformancePrimitive[];
  intent: PerformanceIntent;
  timeCapSeconds?: number;
  maxAttempts?: number;
};

export const SPECIALTY_EVENT_SEEDS: SpecialtyEventDefinition[] = [
  { slug: "grip_thumb_blaster_max", name: "2-inch Thumb Blaster Max Lift", sport: "grip_sport", objective: "max_weight", primitives: ["weight", "attempts", "completion"], intent: "max_lift", maxAttempts: 4 },
  { slug: "grip_ten_challenge_medley", name: "10-Challenge Grip Medley", sport: "grip_sport", objective: "completion_then_time", primitives: ["time", "completion"], intent: "medley", timeCapSeconds: 60, maxAttempts: 1 },
  { slug: "grip_heavy_hammer_ladder", name: "Thick Handled Heavy Hammer Ladder", sport: "grip_sport", objective: "reps", primitives: ["weight", "reps", "time"], intent: "timed_reps", maxAttempts: 1 },
  { slug: "grip_nightmare_hercules", name: "2-inch Nightmare Hercules Hold", sport: "grip_sport", objective: "max_time", primitives: ["weight", "time"], intent: "hold_for_time", maxAttempts: 1 },
  { slug: "strongman_max_deadlift", name: "Max Deadlift (Kratos/Mammoth Bar)", sport: "strongman", objective: "max_weight", primitives: ["weight", "attempts", "completion"], intent: "max_lift", timeCapSeconds: 60, maxAttempts: 3 },
  { slug: "strongman_hercules_hold", name: "Hercules Hold", sport: "strongman", objective: "max_time", primitives: ["weight", "time"], intent: "hold_for_time", maxAttempts: 1 },
  { slug: "strongman_max_log_press", name: "Max Log Press", sport: "strongman", objective: "max_weight", primitives: ["weight", "attempts", "completion"], intent: "max_lift", timeCapSeconds: 60, maxAttempts: 3 },
  { slug: "strongman_conans_wheel", name: "Conan's Wheel", sport: "strongman", objective: "max_distance", primitives: ["weight", "distance", "time"], intent: "carry_for_distance", timeCapSeconds: 75, maxAttempts: 1 },
  { slug: "strongman_sandbag_series", name: "Sandbag to Shoulder Series", sport: "strongman", objective: "completion_then_time", primitives: ["weight", "reps", "time", "completion"], intent: "series_for_time", timeCapSeconds: 75, maxAttempts: 1 },
  { slug: "strongman_stall_mat_stack", name: "Stall Mat OCD Stack", sport: "strongman", objective: "min_time", primitives: ["distance", "time", "completion"], intent: "carry_series_for_time", maxAttempts: 1 },
];

export function describePerformanceIntent(intent: PerformanceIntent): string {
  switch (intent) {
    case "hold_for_time": return "Hold a prescribed load for as long as possible or within a target duration range.";
    case "timed_reps": return "Complete as many valid repetitions as possible within the event window.";
    case "max_lift": return "Record attempts and rank successful lifts by the heaviest completed load.";
    case "carry_for_distance": return "Carry the prescribed load for maximum distance, optionally under a time cap.";
    case "series_for_time": return "Complete an ordered series as quickly as possible while preserving completion data.";
    case "carry_series_for_time": return "Complete repeated carries or objects over a fixed course for total time.";
    case "medley": return "Complete multiple distinct challenges under one shared clock.";
    default: return "Track conventional working sets using load, repetitions, and effort targets.";
  }
}

export function shouldProgressHoldLoad(durationSeconds: number, targetMinSeconds: number, targetMaxSeconds: number): "reduce" | "hold" | "increase" {
  if (durationSeconds < targetMinSeconds) return "reduce";
  if (durationSeconds > targetMaxSeconds) return "increase";
  return "hold";
}
