export type DailyNutritionTargets = {
  calorie_target: number;
  carbs_target_g: number;
  fat_target_g: number;
  fiber_target_g: number;
  protein_target_g: number;
};

export function getPerMealTargets(
  goals: DailyNutritionTargets,
  mealCount: number,
) {
  if (!Number.isInteger(mealCount) || mealCount < 1 || mealCount > 8) {
    throw new RangeError("Meals per day must be from 1 to 8.");
  }

  const grams = (value: number) =>
    Math.round((value / mealCount) * 10) / 10;

  return {
    calories: Math.round(goals.calorie_target / mealCount),
    carbsGrams: grams(goals.carbs_target_g),
    fatGrams: grams(goals.fat_target_g),
    fiberGrams: grams(goals.fiber_target_g),
    proteinGrams: grams(goals.protein_target_g),
  };
}
