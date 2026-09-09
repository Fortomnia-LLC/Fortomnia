export type NutritionHistoryRow = {
  calories: number | string;
  carbs_g: number | string;
  fat_g: number | string;
  fiber_g: number | string;
  food_name: string;
  protein_g: number | string;
  serving_description: string | null;
};

export type RememberedFood = {
  calories: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  food_name: string;
  protein_g: number;
  serving_description: string | null;
};

function normalizeKey(value: string | null) {
  return (value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function buildRememberedFoods(
  entries: NutritionHistoryRow[],
  limit = 12,
): RememberedFood[] {
  const remembered: RememberedFood[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    const foodName = entry.food_name.trim().replace(/\s+/g, " ");
    const serving = entry.serving_description?.trim().replace(/\s+/g, " ") || null;
    const key = `${normalizeKey(foodName)}::${normalizeKey(serving)}`;

    if (!foodName || seen.has(key)) {
      continue;
    }

    seen.add(key);
    remembered.push({
      calories: Number(entry.calories),
      carbs_g: Number(entry.carbs_g),
      fat_g: Number(entry.fat_g),
      fiber_g: Number(entry.fiber_g),
      food_name: foodName,
      protein_g: Number(entry.protein_g),
      serving_description: serving,
    });

    if (remembered.length >= limit) {
      break;
    }
  }

  return remembered;
}
