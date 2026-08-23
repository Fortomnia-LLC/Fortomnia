export type MealProgressEntry = {
  calories: number;
  carbs_g: number;
  fat_g: number;
  meal_number: number | null;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  protein_g: number;
};

export type MealProgress = {
  calories: number;
  carbsGrams: number;
  fatGrams: number;
  mealNumber: number;
  proteinGrams: number;
};

function legacyMealNumber(
  mealType: MealProgressEntry["meal_type"],
  mealCount: number,
) {
  const number =
    mealType === "breakfast"
      ? 1
      : mealType === "lunch"
        ? 2
        : mealType === "dinner"
          ? 3
          : 4;

  return Math.min(number, mealCount);
}

export function buildMealProgress(
  entries: MealProgressEntry[],
  mealCount: number,
): MealProgress[] {
  if (!Number.isInteger(mealCount) || mealCount < 1 || mealCount > 8) {
    throw new RangeError("Meals per day must be from 1 to 8.");
  }

  const meals = Array.from({ length: mealCount }, (_, index) => ({
    calories: 0,
    carbsGrams: 0,
    fatGrams: 0,
    mealNumber: index + 1,
    proteinGrams: 0,
  }));

  for (const entry of entries) {
    const mealNumber =
      entry.meal_number && entry.meal_number <= mealCount
        ? entry.meal_number
        : legacyMealNumber(entry.meal_type, mealCount);
    const meal = meals[mealNumber - 1];

    meal.calories += entry.calories;
    meal.carbsGrams += entry.carbs_g;
    meal.fatGrams += entry.fat_g;
    meal.proteinGrams += entry.protein_g;
  }

  return meals;
}
