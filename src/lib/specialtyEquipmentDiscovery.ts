export type SpecialtyEquipmentOption = {
  slug: string;
  label: string;
  sports: readonly ("strongman" | "grip_sport")[];
  keywords: readonly string[];
};

export const SPECIALTY_EQUIPMENT_OPTIONS: SpecialtyEquipmentOption[] = [
  { slug: "hercules_hold_handles", label: "Hercules Hold Handles", sports: ["strongman"], keywords: ["hercules", "strongman"] },
  { slug: "strongman_log", label: "Strongman Log", sports: ["strongman"], keywords: ["log press", "strongman"] },
  { slug: "conans_wheel", label: "Conan's Wheel", sports: ["strongman"], keywords: ["conan", "strongman"] },
  { slug: "sandbag", label: "Strongman Sandbags", sports: ["strongman"], keywords: ["sandbag", "strongman"] },
  { slug: "kratos_mammoth_bar", label: "Kratos / Mammoth Deadlift Bar", sports: ["strongman"], keywords: ["deadlift", "strongman"] },
  { slug: "farmer_handles", label: "Farmer Handles", sports: ["strongman"], keywords: ["farmer", "carry", "strongman"] },
  { slug: "thumb_blaster_2in", label: "2-inch Thumb Blaster", sports: ["grip_sport"], keywords: ["thumb", "pinch", "grip"] },
  { slug: "nightmare_hercules_handles_2in", label: "2-inch Nightmare Hercules Handles", sports: ["grip_sport"], keywords: ["hercules", "support grip", "grip"] },
  { slug: "thick_handle_hammer", label: "Thick Handled Heavy Hammer", sports: ["grip_sport"], keywords: ["hammer", "thick handle", "grip"] },
  { slug: "pinch_block", label: "Pinch Block", sports: ["grip_sport"], keywords: ["pinch", "thumb", "grip"] },
  { slug: "loading_pin", label: "Loading Pin", sports: ["grip_sport"], keywords: ["loading pin", "grip"] },
];

function normalized(values: readonly string[]): string[] {
  return values.map((value) => value.trim().toLowerCase()).filter(Boolean);
}

export function inferRelevantSpecialtySports(
  sports: readonly string[],
  primaryFocus = "",
  targetEventName = "",
): ("strongman" | "grip_sport")[] {
  const haystack = [...normalized(sports), primaryFocus.toLowerCase(), targetEventName.toLowerCase()].join(" ");
  const relevant = new Set<"strongman" | "grip_sport">();

  if (/strongman|strongwoman|log press|conan|farmer|sandbag|hercules/.test(haystack)) relevant.add("strongman");
  if (/grip|grip sport|pinch|thumb|thick handle|gripper/.test(haystack)) relevant.add("grip_sport");

  return [...relevant];
}

export function getRelevantSpecialtyEquipment(
  sports: readonly string[],
  primaryFocus = "",
  targetEventName = "",
): SpecialtyEquipmentOption[] {
  const relevantSports = inferRelevantSpecialtySports(sports, primaryFocus, targetEventName);
  if (relevantSports.length === 0) return [];

  return SPECIALTY_EQUIPMENT_OPTIONS.filter((option) =>
    option.sports.some((sport) => relevantSports.includes(sport)),
  );
}
