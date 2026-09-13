import { EQUIPMENT_OPTIONS, type EquipmentOption } from "./equipment.ts";

export const TRAINING_LOCATION_TYPES = ["home", "gym", "hotel", "outdoor", "other"] as const;
export type TrainingLocationType = (typeof TRAINING_LOCATION_TYPES)[number];

export const TRAINING_LOCATION_LABELS: Record<TrainingLocationType, string> = {
  home: "Home",
  gym: "Gym",
  hotel: "Hotel",
  outdoor: "Outdoor",
  other: "Other",
};

export type TrainingLocation = {
  id: string;
  user_id: string;
  name: string;
  location_type: TrainingLocationType;
  equipment: EquipmentOption[];
  notes: string | null;
  is_active: boolean;
  updated_at: string;
};

export function normalizeLocationEquipment(values: readonly string[]): EquipmentOption[] {
  const supported = new Set<string>(EQUIPMENT_OPTIONS);
  return [...new Set(values.filter((value): value is EquipmentOption => supported.has(value)))];
}

export function validateTrainingLocation(input: { name: string; notes: string; equipment: EquipmentOption[] }) {
  const name = input.name.trim();
  const notes = input.notes.trim();
  if (!name) return "Location name is required.";
  if (name.length > 80) return "Location name must be 80 characters or fewer.";
  if (notes.length > 500) return "Notes must be 500 characters or fewer.";
  if (input.equipment.length === 0) return "Choose at least one available equipment option.";
  return null;
}
