export type PortionUnit = 'g' | 'ml' | 'piece' | 'pieces' | 'cup' | 'tbsp' | 'tsp' | 'bowl' | 'slice';

export type CookingMethod =
  | 'Curry'
  | 'Grilled'
  | 'Boiled'
  | 'Steamed'
  | 'Baked'
  | 'Roasted'
  | 'Fried'
  | 'Deep fried'
  | 'With oil'
  | 'Without oil'
  | 'Raw'
  | 'Standard';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodItem {
  id: string;
  name: string;
  portionAmount: number;
  portionUnit: string;
  portionNote?: string;
  cookingMethod: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  confidence: ConfidenceLevel;
  notes?: string;
  included?: boolean;
}

export interface MealTotal {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
}

export interface MealRecord {
  id: string;
  timestamp: string; // ISO string
  date: string; // YYYY-MM-DD
  mealType: MealType;
  name: string;
  foods: FoodItem[];
  total: MealTotal;
  imageDataUrl?: string;
  confidence: ConfidenceLevel;
  notes?: string;
}

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'very_active'
  | 'extra_active';

export type FitnessGoal =
  | 'lose_weight'
  | 'maintain_weight'
  | 'gain_weight'
  | 'build_muscle';

export interface UserProfile {
  age: number;
  gender: 'male' | 'female' | 'other';
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
  customTargets?: {
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    fiber_g?: number;
    sugar_g?: number;
    sodium_mg?: number;
  };
}

export interface DailyTargets {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
}

export interface AnalyzeFoodResponse {
  isFood: boolean;
  rejectionReason?: string;
  confidence: ConfidenceLevel;
  mealName?: string;
  foods: FoodItem[];
  total: MealTotal;
  uncertaintyNotes?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}
