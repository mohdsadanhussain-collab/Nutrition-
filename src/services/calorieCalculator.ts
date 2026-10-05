import { UserProfile, DailyTargets } from '../types/nutrition';

export const DEFAULT_USER_PROFILE: UserProfile = {
  age: 28,
  gender: 'female',
  heightCm: 165,
  weightKg: 62,
  activityLevel: 'moderate',
  goal: 'maintain_weight',
};

/**
 * Calculates daily calorie and macronutrient targets using the Mifflin-St Jeor equation.
 * All outputs are marked as general wellness estimates.
 */
export function calculateDailyTargets(profile: UserProfile): DailyTargets {
  if (profile.customTargets && profile.customTargets.calories) {
    const c = profile.customTargets;
    return {
      calories: c.calories || 2000,
      protein_g: c.protein_g || 110,
      carbs_g: c.carbs_g || 250,
      fat_g: c.fat_g || 65,
      fiber_g: c.fiber_g || 28,
      sugar_g: c.sugar_g || 35,
      sodium_mg: c.sodium_mg || 2200,
    };
  }

  const age = Math.max(10, Math.min(120, Number(profile.age) || DEFAULT_USER_PROFILE.age));
  const heightCm = Math.max(80, Math.min(250, Number(profile.heightCm) || DEFAULT_USER_PROFILE.heightCm));
  const weightKg = Math.max(25, Math.min(350, Number(profile.weightKg) || DEFAULT_USER_PROFILE.weightKg));
  const { gender, activityLevel, goal } = profile;

  // Mifflin-St Jeor BMR
  let bmr: number;
  if (gender === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else if (gender === 'female') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  } else {
    // Average
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 78;
  }

  // Activity multipliers
  const activityFactors: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very_active: 1.725,
    extra_active: 1.9,
  };
  const tdee = bmr * (activityFactors[activityLevel] || 1.4);

  // Goal adjustments
  let targetCalories = tdee;
  if (goal === 'lose_weight') {
    targetCalories = Math.max(1200, tdee - 450);
  } else if (goal === 'gain_weight') {
    targetCalories = tdee + 400;
  } else if (goal === 'build_muscle') {
    targetCalories = tdee + 250;
  }

  const roundedCalories = Math.round(targetCalories / 10) * 10;

  // Macro distribution based on goal
  let proteinRatio = 0.25;
  let fatRatio = 0.28;
  let carbRatio = 0.47;

  if (goal === 'build_muscle') {
    proteinRatio = 0.30;
    fatRatio = 0.25;
    carbRatio = 0.45;
  } else if (goal === 'lose_weight') {
    proteinRatio = 0.32;
    fatRatio = 0.28;
    carbRatio = 0.40;
  }

  const protein_g = Math.round((roundedCalories * proteinRatio) / 4);
  const fat_g = Math.round((roundedCalories * fatRatio) / 9);
  const carbs_g = Math.round((roundedCalories * carbRatio) / 4);

  // Standard dietary recommendations
  const fiber_g = Math.round((roundedCalories / 1000) * 14); // 14g per 1000 kcal
  const sugar_g = Math.round((roundedCalories * 0.08) / 4); // Max 8% of energy from added/free sugars
  const sodium_mg = 2200; // WHO standard guideline recommendation < 2000-2300mg

  return {
    calories: roundedCalories,
    protein_g,
    carbs_g,
    fat_g,
    fiber_g,
    sugar_g,
    sodium_mg,
  };
}
