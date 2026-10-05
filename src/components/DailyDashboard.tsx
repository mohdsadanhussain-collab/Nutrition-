import React from 'react';
import { DailyTargets, MealRecord, UserProfile } from '../types/nutrition';
import { DisclaimerBanner } from './DisclaimerBanner';
import { Flame, PieChart, Sparkles, Plus, ChevronRight, Award } from 'lucide-react';

interface Props {
  todayMeals: MealRecord[];
  dailyTargets: DailyTargets;
  userProfile: UserProfile;
  onOpenScan: () => void;
  onSelectMealDetail: (meal: MealRecord) => void;
  onNavigateToTab: (tab: string) => void;
}

export const DailyDashboard: React.FC<Props> = ({
  todayMeals,
  dailyTargets,
  userProfile,
  onOpenScan,
  onSelectMealDetail,
  onNavigateToTab,
}) => {
  // Aggregate today's stats
  const totals = todayMeals.reduce(
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

  const calProgress = Math.min(100, Math.round((totals.calories / (dailyTargets.calories || 2000)) * 100));
  const remainingCals = dailyTargets.calories - totals.calories;

  // Macro Energy percentages
  const pCals = totals.protein_g * 4;
  const cCals = totals.carbs_g * 4;
  const fCals = totals.fat_g * 9;
  const macroSum = Math.max(1, pCals + cCals + fCals);
  const pPct = Math.round((pCals / macroSum) * 100);
  const cPct = Math.round((cCals / macroSum) * 100);
  const fPct = Math.max(0, 100 - pPct - cPct);

  // Grouped meals
  const mealSections = [
    { type: 'breakfast', label: 'Breakfast', emoji: '🍳' },
    { type: 'lunch', label: 'Lunch', emoji: '🍛' },
    { type: 'snack', label: 'Snacks', emoji: '🍎' },
    { type: 'dinner', label: 'Dinner', emoji: '🍲' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Daily Nutrition Tracker
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Today's calories and nutrients vs personalized targets
          </p>
        </div>
        <button
          onClick={onOpenScan}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition active:scale-98"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Meal</span>
        </button>
      </div>

      {/* Calories Overview Hero Card */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Estimated Energy Balance
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold uppercase tracking-wider">
                AI Estimates • Not Exact
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                {totals.calories.toLocaleString()}
              </span>
              <span className="text-base sm:text-lg font-bold text-slate-400">
                / {dailyTargets.calories.toLocaleString()} kcal
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {remainingCals >= 0
                ? `${remainingCals.toLocaleString()} kcal remaining for today (approximate)`
                : `${Math.abs(remainingCals).toLocaleString()} kcal over target (approximate)`}
            </p>
          </div>

          {/* Goal pill */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 self-start sm:self-auto text-left sm:text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Goal
            </span>
            <span className="text-xs font-bold text-emerald-700 capitalize">
              {userProfile.goal.replace('_', ' ')}
            </span>
            <button
              onClick={() => onNavigateToTab('profile')}
              className="text-[11px] text-slate-500 hover:text-emerald-600 block mt-0.5 underline"
            >
              Adjust targets
            </button>
          </div>
        </div>

        {/* Big Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600">Daily Calorie Budget</span>
            <span className="text-emerald-700">{calProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              style={{ width: `${calProgress}%` }}
              className={`h-full rounded-full transition-all duration-500 ${
                calProgress > 105 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </div>
        </div>

        {/* Macro Distribution percentage bar */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Macro Energy Split:</span>
            <span className="text-[11px] text-slate-500">
              Protein {pPct}% • Carbs {cPct}% • Fat {fPct}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden flex w-full bg-slate-200">
            <div style={{ width: `${pPct}%` }} className="bg-blue-500" />
            <div style={{ width: `${cPct}%` }} className="bg-amber-500" />
            <div style={{ width: `${fPct}%` }} className="bg-rose-500" />
          </div>
        </div>
      </div>

      {/* ALL 7 NUTRIENT PROGRESS CARDS */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-4">
        <h3 className="font-extrabold text-slate-800 text-lg">Nutrient Targets Breakdown</h3>

        <div className="space-y-3.5">
          {/* 1. Protein */}
          <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-950 flex items-center gap-1.5">
                <span>💪</span> Protein
              </span>
              <span className="font-extrabold text-blue-700">
                {totals.protein_g} / {dailyTargets.protein_g} g
              </span>
            </div>
            <div className="w-full bg-blue-200/60 h-2 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, (totals.protein_g / (dailyTargets.protein_g || 1)) * 100)}%` }}
                className="bg-blue-600 h-full rounded-full transition-all"
              />
            </div>
          </div>

          {/* 2. Carbs */}
          <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-950 flex items-center gap-1.5">
                <span>🍚</span> Carbohydrates
              </span>
              <span className="font-extrabold text-amber-700">
                {totals.carbs_g} / {dailyTargets.carbs_g} g
              </span>
            </div>
            <div className="w-full bg-amber-200/60 h-2 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, (totals.carbs_g / (dailyTargets.carbs_g || 1)) * 100)}%` }}
                className="bg-amber-600 h-full rounded-full transition-all"
              />
            </div>
          </div>

          {/* 3. Fat */}
          <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-rose-950 flex items-center gap-1.5">
                <span>🥑</span> Total Fat
              </span>
              <span className="font-extrabold text-rose-700">
                {totals.fat_g} / {dailyTargets.fat_g} g
              </span>
            </div>
            <div className="w-full bg-rose-200/60 h-2 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, (totals.fat_g / (dailyTargets.fat_g || 1)) * 100)}%` }}
                className="bg-rose-500 h-full rounded-full transition-all"
              />
            </div>
          </div>

          {/* 4. Fiber */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                <span>🌾</span> Dietary Fiber
              </span>
              <span className="font-extrabold text-emerald-700">
                {totals.fiber_g} / {dailyTargets.fiber_g} g
              </span>
            </div>
            <div className="w-full bg-emerald-200/60 h-2 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, (totals.fiber_g / (dailyTargets.fiber_g || 1)) * 100)}%` }}
                className="bg-emerald-600 h-full rounded-full transition-all"
              />
            </div>
          </div>

          {/* 5. Sugar */}
          <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-purple-950 flex items-center gap-1.5">
                <span>🍬</span> Sugars
              </span>
              <span className="font-extrabold text-purple-700">
                {totals.sugar_g} / {dailyTargets.sugar_g} g
              </span>
            </div>
            <div className="w-full bg-purple-200/60 h-2 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, (totals.sugar_g / (dailyTargets.sugar_g || 1)) * 100)}%` }}
                className="bg-purple-600 h-full rounded-full transition-all"
              />
            </div>
          </div>

          {/* 6. Sodium */}
          <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span>🧂</span> Sodium
              </span>
              <span className="font-extrabold text-slate-700">
                {totals.sodium_mg} / {dailyTargets.sodium_mg} mg
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, (totals.sodium_mg / (dailyTargets.sodium_mg || 1)) * 100)}%` }}
                className="bg-slate-700 h-full rounded-full transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* TODAY'S LOGGED MEALS */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-4">
        <h3 className="font-extrabold text-slate-800 text-lg">Today's Logged Meals</h3>

        {todayMeals.length === 0 ? (
          <div className="text-center py-8 text-slate-400 space-y-2">
            <div className="text-3xl">🍽️</div>
            <p className="text-xs">No meals logged today yet.</p>
            <button
              onClick={onOpenScan}
              className="text-xs font-bold text-emerald-600 hover:underline"
            >
              Scan your first meal →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {todayMeals.map((meal) => (
              <div
                key={meal.id}
                onClick={() => onSelectMealDetail(meal)}
                className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/70 hover:bg-slate-100/70 cursor-pointer transition flex items-center justify-between group shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg shrink-0 shadow-2xs">
                    {meal.mealType === 'breakfast'
                      ? '🍳'
                      : meal.mealType === 'lunch'
                      ? '🍛'
                      : meal.mealType === 'dinner'
                      ? '🍲'
                      : '🍎'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                        {meal.mealType}
                      </span>
                      <h4 className="font-bold text-xs text-slate-800 group-hover:text-emerald-700 truncate">
                        {meal.name}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {meal.foods.map((f) => f.name).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="text-right pl-3 shrink-0">
                  <span className="font-black text-sm text-slate-900 block">
                    {meal.total.calories} kcal
                  </span>
                  <span className="text-[10px] text-slate-400">
                    P: {meal.total.protein_g}g • C: {meal.total.carbs_g}g
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Accuracy & General Guidance Disclaimer */}
      <DisclaimerBanner variant="full" />
    </div>
  );
};
