import type { EquipmentOption } from "./equipment.ts";
import {
  chooseBestSpecialtyExercise,
  type SpecialtyExerciseCandidate,
  type SpecialtyExerciseRecommendation,
} from "./specialtyExerciseSelection.ts";

export type AthleteEquipmentContext = {
  generalEquipment: EquipmentOption[];
  specialtyImplementSlugs: string[];
};

export type EventExerciseOption = {
  exerciseName: string;
  specificity: number;
  generalEquipment?: EquipmentOption;
  requiredImplementSlug?: string;
  notes?: string | null;
};

export function athleteHasExerciseEquipment(
  option: EventExerciseOption,
  equipment: AthleteEquipmentContext,
): boolean {
  if (equipment.generalEquipment.includes("full_gym") && option.generalEquipment) {
    return true;
  }

  if (option.requiredImplementSlug) {
    return equipment.specialtyImplementSlugs.includes(option.requiredImplementSlug);
  }

  if (option.generalEquipment) {
    return equipment.generalEquipment.includes(option.generalEquipment);
  }

  return true;
}

export function recommendExerciseForAthlete(
  options: EventExerciseOption[],
  equipment: AthleteEquipmentContext,
): SpecialtyExerciseRecommendation | null {
  const candidates: SpecialtyExerciseCandidate[] = options.map((option) => ({
    exerciseName: option.exerciseName,
    specificity: option.specificity,
    available: athleteHasExerciseEquipment(option, equipment),
    notes: option.notes,
  }));

  return chooseBestSpecialtyExercise(candidates);
}

export const HERCULES_HOLD_OPTIONS: EventExerciseOption[] = [
  {
    exerciseName: "Hercules Hold",
    specificity: 100,
    requiredImplementSlug: "hercules_hold_handles",
    notes: "Direct event practice when a Hercules apparatus is available.",
  },
  {
    exerciseName: "Farmer Handle Hold",
    specificity: 80,
    requiredImplementSlug: "farmer_handles",
    notes: "High-transfer support-grip substitute.",
  },
  {
    exerciseName: "Heavy Dumbbell Hold",
    specificity: 50,
    generalEquipment: "dumbbell",
    notes: "Accessible support-grip fallback.",
  },
];

export const CONANS_WHEEL_OPTIONS: EventExerciseOption[] = [
  {
    exerciseName: "Conan Carry",
    specificity: 100,
    requiredImplementSlug: "conans_wheel",
    notes: "Direct event practice.",
  },
  {
    exerciseName: "Zercher Carry",
    specificity: 70,
    generalEquipment: "barbell",
    notes: "Strong front-loaded elbow-carry substitute.",
  },
  {
    exerciseName: "Front-Loaded Sandbag Carry",
    specificity: 50,
    requiredImplementSlug: "sandbag",
    notes: "Lower-specificity front-loaded carry fallback.",
  },
];
