import React from 'react';
import { Camera, Upload, Sparkles, Flame, ChevronRight, PlusCircle, ArrowUpRight } from 'lucide-react';
import { DailyTargets, MealRecord, UserProfile } from '../types/nutrition';
import { DisclaimerBanner } from './DisclaimerBanner';
import { SAMPLE_FOOD_OPTIONS, generateSampleFoodDataUrl } from '../data/sampleFoods';

interface Props {
  todayMeals: MealRecord[];
  dailyTargets: DailyTargets;
  userProfile: UserProfile;
  onOpenScan: () => void;
  onQuickUpload: () => void;
  onSelectMealDetail: (meal: MealRecord) => void;
  onNavigateToTab: (tab: string) => void;
  onTestSample: (sample: typeof SAMPLE_FOOD_OPTIONS[0]) => void;
}

export const HomeScreen: React.FC<Props> = ({
  todayMeals,
  dailyTargets,
  userProfile,
  onOpenScan,
  onQuickUpload,
  onSelectMealDetail,
  onNavigateToTab,
  onTestSample,
}) => {
  // Aggregate today's nutrition
  const todaySummary = todayMeals.reduce(
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

  // Percentages against targets
  const calPercent = Math.min(100, Math.round((todaySummary.calories / (dailyTargets.calories || 2000)) * 100));
  const proteinPercent = Math.min(100, Math.round((todaySummary.protein_g / (dailyTargets.protein_g || 100)) * 100));
  const carbsPercent = Math.min(100, Math.round((todaySummary.carbs_g / (dailyTargets.carbs_g || 250)) * 100));
  const fatPercent = Math.min(100, Math.round((todaySummary.fat_g / (dailyTargets.fat_g || 70)) * 100));

  // Remaining calories
  const remainingCals = Math.max(0, dailyTargets.calories - todaySummary.calories);

  // Group meals by mealType
  const mealCategories = [
    { type: 'breakfast', label: 'Breakfast', icon: '🍳', placeholderTime: 'Morning' },
    { type: 'lunch', label: 'Lunch', icon: '🍛', placeholderTime: 'Afternoon' },
    { type: 'snack', label: 'Snack', icon: '🍎', placeholderTime: 'Evening' },
    { type: 'dinner', label: 'Dinner', icon: '🍲', placeholderTime: 'Night' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Brand Hero Greeting */}
      <div className="text-center sm:text-left space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>AI Vision Nutrition Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          NUTRISNAP AI
        </h1>
        <p className="text-sm sm:text-base font-semibold text-emerald-700">
          “Snap your food. Know your nutrition.”
        </p>
      </div>

      {/* Hero Interactive "What's on your plate?" Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-emerald-700/20 relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-36 h-36 rounded-full bg-emerald-400/20 blur-lg pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              What's on your plate?
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm max-w-md font-normal leading-relaxed">
              Take a photo or upload a food image to instantly estimate portion size, calories, and macronutrients.
            </p>
          </div>

          {/* Large Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onOpenScan}
              className="py-4 px-6 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-800 font-extrabold text-base shadow-lg shadow-black/10 flex items-center justify-center gap-3 transition transform active:scale-98 cursor-pointer"
            >
              <Camera className="w-6 h-6 text-emerald-600" />
              <span>📷 SCAN MY FOOD</span>
            </button>

            <button
              type="button"
              onClick={onQuickUpload}
              className="py-3.5 px-5 rounded-2xl bg-emerald-700/60 hover:bg-emerald-700 border border-emerald-400/40 text-white font-bold text-sm flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>⬆️ Upload Photo</span>
            </button>
          </div>

          {/* Quick 1-tap sample meal prompt */}
          <div className="pt-2 border-t border-emerald-500/40 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-emerald-200 text-[11px] font-semibold">Try sample plate:</span>
            {SAMPLE_FOOD_OPTIONS.slice(0, 3).map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => onTestSample(sample)}
                className="px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-lg text-white font-medium text-[11px] transition flex items-center gap-1 cursor-pointer"
              >
                <span>{sample.emoji}</span>
                <span>{sample.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TODAY'S SUMMARY DASHBOARD */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-100 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Daily Target Progress
            </span>
            <h3 className="font-extrabold text-slate-800 text-xl flex items-center gap-1.5">
              Today's Summary
            </h3>
          </div>
          <button
            onClick={() => onNavigateToTab('dashboard')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/80 transition"
          >
            <span>Full Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Calories Master Bar */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-baseline justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-lg">
                🔥
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500">Calories</span>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300/80 px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                    AI Estimate
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-slate-900">
                  {todaySummary.calories.toLocaleString()}{' '}
                  <span className="text-xs sm:text-sm font-semibold text-slate-400">
                    / {dailyTargets.calories.toLocaleString()} kcal
                  </span>
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                {remainingCals.toLocaleString()} left
              </span>
            </div>
          </div>

          <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
            <div
              style={{ width: `${calPercent}%` }}
              className={`h-full rounded-full transition-all duration-500 ${
                calPercent > 105 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </div>
        </div>

        {/* Macronutrients Grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* Protein */}
          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-900 flex items-center gap-1">
                <span>💪</span> Protein
              </span>
              <span className="text-[11px] font-bold text-blue-700">{proteinPercent}%</span>
            </div>
            <div className="text-base font-extrabold text-blue-950">
              {todaySummary.protein_g} <span className="text-xs font-medium text-blue-600">/ {dailyTargets.protein_g}g</span>
            </div>
            <div className="w-full bg-blue-200/70 h-1.5 rounded-full overflow-hidden">
              <div style={{ width: `${proteinPercent}%` }} className="bg-blue-600 h-full rounded-full" />
            </div>
          </div>

          {/* Carbs */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-900 flex items-center gap-1">
                <span>🍚</span> Carbs
              </span>
              <span className="text-[11px] font-bold text-amber-700">{carbsPercent}%</span>
            </div>
            <div className="text-base font-extrabold text-amber-950">
              {todaySummary.carbs_g} <span className="text-xs font-medium text-amber-600">/ {dailyTargets.carbs_g}g</span>
            </div>
            <div className="w-full bg-amber-200/70 h-1.5 rounded-full overflow-hidden">
              <div style={{ width: `${carbsPercent}%` }} className="bg-amber-600 h-full rounded-full" />
            </div>
          </div>

          {/* Fat */}
          <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-rose-900 flex items-center gap-1">
                <span>🥑</span> Fat
              </span>
              <span className="text-[11px] font-bold text-rose-700">{fatPercent}%</span>
            </div>
            <div className="text-base font-extrabold text-rose-950">
              {todaySummary.fat_g} <span className="text-xs font-medium text-rose-600">/ {dailyTargets.fat_g}g</span>
            </div>
            <div className="w-full bg-rose-200/70 h-1.5 rounded-full overflow-hidden">
              <div style={{ width: `${fatPercent}%` }} className="bg-rose-500 h-full rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* RECENT MEALS BY CATEGORY */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 text-lg">Today's Meals</h3>
            <p className="text-xs text-slate-500">Track and review meals logged today</p>
          </div>
          <button
            onClick={() => onNavigateToTab('history')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            All History →
          </button>
        </div>

        <div className="space-y-3">
          {mealCategories.map((category) => {
            const mealsInCat = todayMeals.filter((m) => m.mealType === category.type);
            const totalCalsInCat = mealsInCat.reduce((sum, m) => sum + (m.total.calories || 0), 0);

            return (
              <div
                key={category.type}
                className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{category.icon}</span>
                    <span className="font-bold text-sm text-slate-800">{category.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {mealsInCat.length > 0 ? (
                      <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                        {totalCalsInCat} kcal
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Not logged</span>
                    )}
                    <button
                      type="button"
                      onClick={onOpenScan}
                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      title={`Scan ${category.label}`}
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Meals listed in this category */}
                {mealsInCat.length > 0 ? (
                  <div className="space-y-1.5 pl-6">
                    {mealsInCat.map((meal) => (
                      <div
                        key={meal.id}
                        onClick={() => onSelectMealDetail(meal)}
                        className="p-2 rounded-xl bg-white border border-slate-200/80 hover:border-emerald-400 cursor-pointer transition flex items-center justify-between shadow-2xs group"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-xs text-slate-800 group-hover:text-emerald-700 truncate block">
                            {meal.name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {meal.foods.length} items • P: {meal.total.protein_g}g • C: {meal.total.carbs_g}g • F: {meal.total.fat_g}g
                          </span>
                        </div>
                        <div className="text-right pl-2">
                          <span className="font-bold text-xs text-slate-900 block">
                            {meal.total.calories} kcal
                          </span>
                          <span className="text-[10px] text-emerald-600 font-semibold group-hover:underline">
                            View →
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 pl-7">
                    No {category.label.toLowerCase()} logged yet. Tap Scan to add.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* NUTRI AI PROMPT TEASER */}
      <div
        onClick={() => onNavigateToTab('chat')}
        className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-emerald-500/20 hover:border-emerald-500/40 cursor-pointer transition shadow-sm group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-amber-500/25 group-hover:scale-105 transition">
              🤖
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-slate-800 text-sm">Ask Nutri AI</h4>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                  AI Nutrition Assistant
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                “Is chicken biryani high in protein?” or “Suggest a 500 kcal dinner”
              </p>
            </div>
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
        </div>
      </div>

      {/* Safety & Medical Disclaimer */}
      <DisclaimerBanner variant="compact" />
    </div>
  );
};
