import { MealRecord, UserProfile, ChatMessage } from '../types/nutrition';
import { DEFAULT_USER_PROFILE } from './calorieCalculator';

const STORAGE_KEYS = {
  USER_PROFILE: 'nutrisnap_user_profile_v1',
  MEALS: 'nutrisnap_meals_v1',
  CHAT_MESSAGES: 'nutrisnap_chat_messages_v1',
};

// Seed realistic sample data matching prompt instructions
function getInitialSampleMeals(): MealRecord[] {
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  return [
    {
      id: 'sample-meal-1',
      date: todayStr,
      timestamp: new Date().toISOString(),
      mealType: 'lunch',
      name: 'Chicken Biryani Platter',
      confidence: 'high',
      notes: 'Includes light oil in biryani rice and curry gravy.',
      foods: [
        {
          id: 'item-1',
          name: 'Rice (Biryani)',
          portionAmount: 200,
          portionUnit: 'g',
          cookingMethod: 'Curry',
          calories: 260,
          protein_g: 5,
          carbs_g: 56,
          fat_g: 1.5,
          fiber_g: 1.2,
          sugar_g: 0.5,
          sodium_mg: 180,
          confidence: 'high',
          included: true,
        },
        {
          id: 'item-2',
          name: 'Chicken Curry',
          portionAmount: 150,
          portionUnit: 'g',
          cookingMethod: 'Curry',
          calories: 280,
          protein_g: 25,
          carbs_g: 8,
          fat_g: 16,
          fiber_g: 1.5,
          sugar_g: 2,
          sodium_mg: 490,
          confidence: 'high',
          included: true,
        },
        {
          id: 'item-3',
          name: 'Dal Tadka',
          portionAmount: 150,
          portionUnit: 'g',
          cookingMethod: 'Boiled',
          calories: 180,
          protein_g: 10,
          carbs_g: 25,
          fat_g: 4,
          fiber_g: 5,
          sugar_g: 1,
          sodium_mg: 320,
          confidence: 'high',
          included: true,
        },
        {
          id: 'item-4',
          name: 'Fresh Salad',
          portionAmount: 100,
          portionUnit: 'g',
          cookingMethod: 'Raw',
          calories: 40,
          protein_g: 2,
          carbs_g: 8,
          fat_g: 0.5,
          fiber_g: 2.5,
          sugar_g: 2.5,
          sodium_mg: 15,
          confidence: 'high',
          included: true,
        },
      ],
      total: {
        calories: 760,
        protein_g: 42,
        carbs_g: 97,
        fat_g: 22,
        fiber_g: 10.2,
        sugar_g: 6,
        sodium_mg: 1005,
      },
    },
    {
      id: 'sample-meal-2',
      date: todayStr,
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      mealType: 'breakfast',
      name: 'South Indian Masala Dosa & Sambar',
      confidence: 'high',
      notes: 'Prepared on tawa with light sesame/mustard oil.',
      foods: [
        {
          id: 'item-5',
          name: 'Crispy Dosa with Potato Masala',
          portionAmount: 1,
          portionUnit: 'piece',
          cookingMethod: 'With oil',
          calories: 340,
          protein_g: 6,
          carbs_g: 52,
          fat_g: 12,
          fiber_g: 3.5,
          sugar_g: 2,
          sodium_mg: 420,
          confidence: 'high',
          included: true,
        },
        {
          id: 'item-6',
          name: 'Vegetable Sambar',
          portionAmount: 150,
          portionUnit: 'ml',
          cookingMethod: 'Boiled',
          calories: 140,
          protein_g: 5,
          carbs_g: 21,
          fat_g: 4,
          fiber_g: 4,
          sugar_g: 3,
          sodium_mg: 380,
          confidence: 'high',
          included: true,
        },
      ],
      total: {
        calories: 480,
        protein_g: 11,
        carbs_g: 73,
        fat_g: 16,
        fiber_g: 7.5,
        sugar_g: 5,
        sodium_mg: 800,
      },
    },
    {
      id: 'sample-meal-3',
      date: yesterdayStr,
      timestamp: new Date(Date.now() - 86400000 + 3600000 * 3).toISOString(),
      mealType: 'breakfast',
      name: 'Scrambled Eggs + Whole Wheat Toast',
      confidence: 'high',
      notes: 'Cooked with 1 tsp butter.',
      foods: [
        {
          id: 'item-7',
          name: 'Scrambled Eggs (2 eggs)',
          portionAmount: 2,
          portionUnit: 'pieces',
          cookingMethod: 'With oil',
          calories: 210,
          protein_g: 14,
          carbs_g: 2,
          fat_g: 16,
          fiber_g: 0,
          sugar_g: 1,
          sodium_mg: 240,
          confidence: 'high',
          included: true,
        },
        {
          id: 'item-8',
          name: 'Whole Wheat Toast (2 slices)',
          portionAmount: 2,
          portionUnit: 'slice',
          cookingMethod: 'Baked',
          calories: 210,
          protein_g: 8,
          carbs_g: 36,
          fat_g: 3,
          fiber_g: 4,
          sugar_g: 3,
          sodium_mg: 310,
          confidence: 'high',
          included: true,
        },
      ],
      total: {
        calories: 420,
        protein_g: 22,
        carbs_g: 38,
        fat_g: 19,
        fiber_g: 4,
        sugar_g: 4,
        sodium_mg: 550,
      },
    },
  ];
}

export function getUserProfile(): UserProfile {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_USER_PROFILE,
        ...parsed,
        age: Number(parsed.age) || DEFAULT_USER_PROFILE.age,
        heightCm: Number(parsed.heightCm) || DEFAULT_USER_PROFILE.heightCm,
        weightKg: Number(parsed.weightKg) || DEFAULT_USER_PROFILE.weightKg,
      };
    }
  } catch (e) {
    console.error('Failed to load user profile', e);
  }
  return DEFAULT_USER_PROFILE;
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    const sanitized: UserProfile = {
      ...profile,
      age: Number(profile.age),
      heightCm: Number(profile.heightCm),
      weightKg: Number(profile.weightKg),
    };
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(sanitized));
  } catch (e) {
    console.error('Failed to save user profile', e);
  }
}

export function getMeals(): MealRecord[] {
  try {
    // If the user has explicitly cleared history, never reload default sample meals
    const isCleared = localStorage.getItem('nutrisnap_history_cleared_v1');
    if (isCleared === 'true') {
      const saved = localStorage.getItem(STORAGE_KEYS.MEALS);
      if (saved) {
        return JSON.parse(saved);
      }
      return [];
    }

    const saved = localStorage.getItem(STORAGE_KEYS.MEALS);
    if (saved !== null) {
      return JSON.parse(saved);
    }
    const initial = getInitialSampleMeals();
    localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(initial));
    return initial;
  } catch (e) {
    console.error('Failed to load meals', e);
    return [];
  }
}

export function saveMeal(meal: MealRecord): MealRecord[] {
  const current = getMeals();
  const updated = [meal, ...current];
  try {
    localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(updated));
    localStorage.setItem('nutrisnap_history_cleared_v1', 'true');
  } catch (e) {
    console.error('Failed to save meal', e);
  }
  return updated;
}

export function updateMeal(updatedMeal: MealRecord): MealRecord[] {
  const current = getMeals();
  const next = current.map((m) => (m.id === updatedMeal.id ? updatedMeal : m));
  try {
    localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(next));
    localStorage.setItem('nutrisnap_history_cleared_v1', 'true');
  } catch (e) {
    console.error('Failed to update meal', e);
  }
  return next;
}

export function deleteMeal(mealId: string): MealRecord[] {
  const current = getMeals();
  const next = current.filter((m) => m.id !== mealId);
  try {
    localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(next));
    localStorage.setItem('nutrisnap_history_cleared_v1', 'true');
  } catch (e) {
    console.error('Failed to delete meal', e);
  }
  return next;
}

export function clearAllMeals(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify([]));
    localStorage.setItem('nutrisnap_history_cleared_v1', 'true');
  } catch (e) {
    console.error('Failed to clear meals', e);
  }
}

export function getTodayMeals(): MealRecord[] {
  const todayStr = new Date().toISOString().split('T')[0];
  const all = getMeals();
  return all.filter((m) => m.date === todayStr);
}

export function getTodaySummary() {
  const meals = getTodayMeals();
  return meals.reduce(
    (acc, m) => {
      acc.calories += m.total.calories || 0;
      acc.protein_g += m.total.protein_g || 0;
      acc.carbs_g += m.total.carbs_g || 0;
      acc.fat_g += m.total.fat_g || 0;
      acc.fiber_g += m.total.fiber_g || 0;
      acc.sugar_g += m.total.sugar_g || 0;
      acc.sodium_mg += m.total.sodium_mg || 0;
      return acc;
    },
    {
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sugar_g: 0,
      sodium_mg: 0,
    }
  );
}

export function getChatHistory(): ChatMessage[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load chat history', e);
  }
  return [
    {
      id: 'welcome-msg',
      role: 'model',
      text: 'Hello! I am Nutri AI, your personal food and nutrition assistant. Ask me questions about calories, protein goals, healthier food swaps, or your meals for today!',
      timestamp: new Date().toISOString(),
    },
  ];
}

export function saveChatHistory(messages: ChatMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(messages));
  } catch (e) {
    console.error('Failed to save chat history', e);
  }
}
