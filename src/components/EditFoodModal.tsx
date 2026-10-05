import React, { useState } from 'react';
import { FoodItem, CookingMethod } from '../types/nutrition';
import { recalculateFoodItem } from '../services/nutritionApi';
import { X, Sparkles, Loader2, Check } from 'lucide-react';

interface Props {
  item: FoodItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: FoodItem) => void;
}

const COOKING_METHODS: CookingMethod[] = [
  'Curry',
  'Grilled',
  'Boiled',
  'Steamed',
  'Baked',
  'Roasted',
  'Fried',
  'Deep fried',
  'With oil',
  'Without oil',
  'Raw',
];

const COMMON_UNITS = ['g', 'ml', 'piece', 'pieces', 'cup', 'tbsp', 'tsp', 'slice', 'bowl'];

export const EditFoodModal: React.FC<Props> = ({ item, isOpen, onClose, onSave }) => {
  const [name, setName] = useState(item.name);
  const [portionAmount, setPortionAmount] = useState<number>(item.portionAmount);
  const [portionUnit, setPortionUnit] = useState<string>(item.portionUnit || 'g');
  const [cookingMethod, setCookingMethod] = useState<string>(item.cookingMethod || 'Standard');
  const [notes, setNotes] = useState<string>(item.notes || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRecalculateAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a food name');
      return;
    }
    if (portionAmount <= 0) {
      setError('Portion amount must be greater than 0');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const recalculated = await recalculateFoodItem({
        foodName: name.trim(),
        portionAmount: Number(portionAmount),
        portionUnit,
        cookingMethod,
        ingredientsNote: notes,
      });

      const updated: FoodItem = {
        ...item,
        name: name.trim(),
        portionAmount: Number(portionAmount),
        portionUnit,
        cookingMethod,
        calories: recalculated.calories ?? item.calories,
        protein_g: recalculated.protein_g ?? item.protein_g,
        carbs_g: recalculated.carbs_g ?? item.carbs_g,
        fat_g: recalculated.fat_g ?? item.fat_g,
        fiber_g: recalculated.fiber_g ?? item.fiber_g,
        sugar_g: recalculated.sugar_g ?? item.sugar_g,
        sodium_mg: recalculated.sodium_mg ?? item.sodium_mg,
        notes: notes.trim() || recalculated.notes,
        confidence: 'high', // user verified
      };

      onSave(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to recalculate nutrition.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Edit Food & Portion</h3>
            <p className="text-xs text-slate-500">Correct detected items, portion sizes, or cooking style</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleRecalculateAndSave} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Food Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Food Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chicken Biryani, Dal Tadka, Grilled Salmon"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden font-medium text-slate-800 text-sm transition"
              required
            />
          </div>

          {/* Portion and Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Portion Size
              </label>
              <div className="flex items-center rounded-xl border border-slate-300 overflow-hidden focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-200">
                <button
                  type="button"
                  onClick={() => setPortionAmount((prev) => Math.max(5, prev - (prev > 50 ? 25 : 5)))}
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base transition"
                >
                  -
                </button>
                <input
                  type="number"
                  step="any"
                  value={portionAmount}
                  onChange={(e) => setPortionAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full text-center py-2 text-sm font-semibold text-slate-800 outline-hidden"
                  required
                />
                <button
                  type="button"
                  onClick={() => setPortionAmount((prev) => prev + (prev >= 50 ? 25 : 5))}
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base transition"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Unit
              </label>
              <select
                value={portionUnit}
                onChange={(e) => setPortionUnit(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden font-medium text-slate-800 text-sm transition"
              >
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cooking Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Cooking Method
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Affects calorie & fat density (e.g. Deep fried vs Boiled/Steamed vs Curry)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {COOKING_METHODS.map((method) => {
                const isSelected = cookingMethod.toLowerCase() === method.toLowerCase();
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setCookingMethod(method)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {method}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Notes / Hidden Ingredients */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Hidden Ingredients / Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cooked in ghee, extra salad dressing, skinless chicken"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden text-xs text-slate-700 transition"
            />
          </div>

          {/* Current Values Preview */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-700">Current Values:</div>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <span>🔥 {item.calories} kcal</span>
              <span>💪 {item.protein_g}g P</span>
              <span>🍚 {item.carbs_g}g C</span>
              <span>🥑 {item.fat_g}g F</span>
              <span>🌾 {item.fiber_g}g Fib</span>
              <span>🍬 {item.sugar_g}g Sug</span>
              <span>🧂 {item.sodium_mg}mg Sod</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium text-sm transition"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recalculating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Recalculate & Save
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
