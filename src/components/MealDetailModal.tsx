import React from 'react';
import { MealRecord } from '../types/nutrition';
import { X, Trash2, Calendar, Flame, AlertCircle } from 'lucide-react';

interface Props {
  meal: MealRecord | null;
  onClose: () => void;
  onDeleteMeal: (mealId: string) => void;
}

export const MealDetailModal: React.FC<Props> = ({ meal, onClose, onDeleteMeal }) => {
  if (!meal) return null;

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this meal record?')) {
      onDeleteMeal(meal.id);
      onClose();
    }
  };

  const formattedDate = new Date(meal.timestamp || meal.date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                {meal.mealType}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formattedDate}
              </span>
            </div>
            <h3 className="font-extrabold text-slate-800 text-xl mt-1">{meal.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Photo if present */}
          {meal.imageDataUrl && (
            <div className="rounded-2xl overflow-hidden aspect-16/9 bg-slate-100 border border-slate-200 shadow-inner">
              <img
                src={meal.imageDataUrl}
                alt={meal.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Master Nutrients Summary */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Flame className="w-4 h-4 text-emerald-600" />
                    Estimated Energy
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-1.5 py-0.2 rounded border border-amber-300 uppercase">
                    AI Estimate
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-3xl font-black text-slate-900">{meal.total.calories}</span>
                  <span className="text-sm font-bold text-slate-500">kcal (approximate)</span>
                </div>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-md bg-emerald-100 text-emerald-800">
                {meal.confidence} confidence
              </span>
            </div>

            {/* 6 Nutrients Cards */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1 text-center">
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-400 block">Protein</span>
                <span className="text-sm font-bold text-blue-600">{meal.total.protein_g}g</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-400 block">Carbs</span>
                <span className="text-sm font-bold text-amber-600">{meal.total.carbs_g}g</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-400 block">Fat</span>
                <span className="text-sm font-bold text-rose-600">{meal.total.fat_g}g</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-400 block">Fiber</span>
                <span className="text-sm font-bold text-emerald-600">{meal.total.fiber_g}g</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-400 block">Sugar</span>
                <span className="text-sm font-bold text-purple-600">{meal.total.sugar_g}g</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-400 block">Sodium</span>
                <span className="text-sm font-bold text-slate-700">{meal.total.sodium_mg}mg</span>
              </div>
            </div>
          </div>

          {/* Individual detected foods */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-800 text-sm">Individual Foods in this Meal</h4>
            <div className="space-y-2">
              {meal.foods.map((food, idx) => (
                <div
                  key={food.id || idx}
                  className="p-3 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{food.name}</span>
                      {food.cookingMethod && (
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600">
                          {food.cookingMethod}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-extrabold text-slate-900">
                      {food.calories} kcal
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Portion: {food.portionAmount} {food.portionUnit}
                    </span>
                    <span>
                      P: {food.protein_g}g • C: {food.carbs_g}g • F: {food.fat_g}g
                    </span>
                  </div>

                  {food.notes && (
                    <p className="text-[10px] text-slate-400 italic">💡 {food.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Hidden ingredients disclaimer */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Portion size and cooking style (e.g. oils, gravies) directly influence these calculations. All values are algorithmic estimates.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <button
            type="button"
            onClick={handleDelete}
            className="px-3.5 py-2 text-red-600 hover:bg-red-50 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition"
          >
            <Trash2 className="w-4 h-4" />
            Delete Meal
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
