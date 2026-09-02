export type NativeHealthMetric = "steps" | "active_energy" | "heart_rate" | "resting_heart_rate" | "heart_rate_variability" | "sleep" | "body_weight" | "body_fat_percentage" | "workout";
export type NativeHealthSample = { id: string; metric: NativeHealthMetric; startAt: string; endAt?: string | null; startTimeZoneOffsetMinutes?: number | null; endTimeZoneOffsetMinutes?: number | null; timeZone?: string | null; value?: number | null; unit?: string | null; sourceName?: string | null; sourceBundleId?: string | null; externalId?: string | null; };
export type NativeHealthAnchors = Partial<Record<NativeHealthMetric, string>>;
export type NativeHealthChanges = {
  samples: NativeHealthSample[];
  deletedIds: string[];
  anchors: NativeHealthAnchors;
};
