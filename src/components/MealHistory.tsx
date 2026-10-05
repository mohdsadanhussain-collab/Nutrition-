import React, { useState } from 'react';
import { MealRecord } from '../types/nutrition';
import { Calendar, Trash2, Search, Filter, Flame, ChevronRight, ShieldAlert, CheckCircle, Sparkles } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

interface Props {
  meals: MealRecord[];
  onSelectMeal: (meal: MealRecord) => void;
  onDeleteMeal: (mealId: string) => void;
  onClearAll: () => void;
  onOpenScan: () => void;
}

export const MealHistory: React.FC<Props> = ({
  meals,
  onSelectMeal,
  onDeleteMeal,
  onClearAll,
  onOpenScan,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [clearedNotice, setClearedNotice] = useState(false);

  // Filter meals
  const filteredMeals = meals.filter((meal) => {
    const matchesSearch =
      meal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meal.foods.some((f) => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === 'all' || meal.mealType === filterType;
    return matchesSearch && matchesType;
  });

  // Group by relative date (Today, Yesterday, or formatted date string)
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const grouped: Record<string, MealRecord[]> = {};

  filteredMeals.forEach((meal) => {
    let dateGroup = meal.date || meal.timestamp.split('T')[0];
    let label = dateGroup;
    if (dateGroup === todayStr) {
      label = 'Today';
    } else if (dateGroup === yesterdayStr) {
      label = 'Yesterday';
    } else {
      label = new Date(dateGroup).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }

    if (!grouped[label]) {
      grouped[label] = [];
    }
    grouped[label].push(meal);
  });

  const handleConfirmClear = () => {
    onClearAll();
    setIsConfirmOpen(false);
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 3500);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Meal History
            </h2>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block">
              AI Estimates • Not Exact
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Review past meals, portion breakdowns, and daily calorie logs (approximate)
          </p>
        </div>
        {meals.length > 0 && (
          <button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            className="text-xs font-semibold text-red-600 hover:text-white hover:bg-red-600 px-3 py-1.5 rounded-xl border border-red-200 transition cursor-pointer"
          >
            Clear History
          </button>
        )}
      </div>

      {/* Success Notification after clearing */}
      {clearedNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">All saved meal and scan history has been successfully cleared.</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-3xl p-4 shadow-xl border border-slate-100 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search foods, dishes, or meals..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-hidden text-xs text-slate-800 transition font-medium"
          />
        </div>

        {/* Meal Type Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {['all', 'breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl font-semibold capitalize shrink-0 transition ${
                filterType === type
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type === 'all' ? 'All Meals' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped Meal Lists */}
      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl">
            📖
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-base">No meals found</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {searchTerm
                ? 'No past meals matched your search query.'
                : 'Start tracking by scanning your food plate or uploading a photo.'}
            </p>
          </div>
          <button
            onClick={onOpenScan}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md transition"
          >
            📷 Scan Food Now
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateLabel, dateMeals]) => {
            const dayCalories = dateMeals.reduce((sum, m) => sum + (m.total.calories || 0), 0);
            return (
              <div key={dateLabel} className="space-y-2.5">
                {/* Date Header */}
                <div className="flex items-center justify-between px-2 text-xs">
                  <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    {dateLabel}
                  </span>
                  <span className="font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-md text-[11px]">
                    Total: {dayCalories.toLocaleString()} kcal
                  </span>
                </div>

                {/* Meals */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
                  {dateMeals.map((meal) => (
                    <div
                      key={meal.id}
                      onClick={() => onSelectMeal(meal)}
                      className="p-4 hover:bg-slate-50/80 cursor-pointer transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {meal.imageDataUrl ? (
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            <img
                              src={meal.imageDataUrl}
                              alt={meal.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0">
                            {meal.mealType === 'breakfast'
                              ? '🍳'
                              : meal.mealType === 'lunch'
                              ? '🍛'
                              : meal.mealType === 'dinner'
                              ? '🍲'
                              : '🍎'}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md">
                              {meal.mealType}
                            </span>
                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 truncate">
                              {meal.name}
                            </h4>
                          </div>

                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {meal.foods.map((f) => `${f.name} (${f.portionAmount}${f.portionUnit})`).join(' • ')}
                          </p>

                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 font-medium">
                            <span className="text-blue-700 font-semibold">{meal.total.protein_g}g P</span>
                            <span>•</span>
                            <span className="text-amber-700 font-semibold">{meal.total.carbs_g}g C</span>
                            <span>•</span>
                            <span className="text-rose-700 font-semibold">{meal.total.fat_g}g F</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right pl-3 shrink-0 flex items-center gap-3">
                        <div>
                          <span className="font-black text-base text-slate-900 block">
                            {meal.total.calories}
                          </span>
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              kcal
                            </span>
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                              Est.
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Privacy Notice on Saved Meals */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-2.5 text-xs text-slate-500">
        <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-700">Data Control:</span> Your meal log is stored locally in your browser storage. You have complete control to delete any individual meal or clear the entire history at any time.
        </div>
      </div>

      {/* Clear History Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Clear All Meal History?"
        message="Are you sure you want to delete all saved meal logs and scan history? This action is permanent, will reset your daily counters, and cannot be undone."
        confirmLabel="Yes, Clear All History"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmClear}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};
