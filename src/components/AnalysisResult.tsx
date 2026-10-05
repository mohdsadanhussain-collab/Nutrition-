import React, { useState } from 'react';
import {
  AnalyzeFoodResponse,
  FoodItem,
  MealRecord,
  MealType,
  MealTotal,
} from '../types/nutrition';
import { calculateMealTotal } from '../services/nutritionApi';
import { EditFoodModal } from './EditFoodModal';
import { DisclaimerBanner } from './DisclaimerBanner';
import {
  CheckCircle,
  Edit2,
  RefreshCw,
  Plus,
  Trash2,
  AlertCircle,
  Flame,
  Info,
  ChevronRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface Props {
  analysis: AnalyzeFoodResponse;
  previewImage: string;
  onScanAgain: () => void;
  onSaveToLog: (record: MealRecord) => void;
  onCancel: () => void;
}

export const AnalysisResult: React.FC<Props> = ({
  analysis,
  previewImage,
  onScanAgain,
  onSaveToLog,
  onCancel,
}) => {
  // Determine default meal type from local time
  const getDefaultMealType = (): MealType => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 11) return 'breakfast';
    if (hours >= 11 && hours < 16) return 'lunch';
    if (hours >= 16 && hours < 19) return 'snack';
    return 'dinner';
  };

  const [foods, setFoods] = useState<FoodItem[]>(analysis.foods || []);
  const [mealName, setMealName] = useState(
    analysis.mealName || (foods[0]?.name ? `${foods[0].name} Meal` : 'My Meal')
  );
  const [mealType, setMealType] = useState<MealType>(getDefaultMealType());
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // If the image was rejected (not food or too dark/blurry)
  if (!analysis.isFood) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-3xl">
            🍽️
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
              I can't confidently identify the food from this image
            </h2>
            <p className="text-sm text-slate-500">
              {analysis.rejectionReason ||
                'The photo might be too dark, extremely blurry, too far away, or not actually food. Please take another photo with good lighting.'}
            </p>
          </div>

          {previewImage && (
            <div className="w-48 h-48 mx-auto rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
              <img
                src={previewImage}
                alt="Uploaded attempt"
                className="w-full h-full object-cover grayscale opacity-80"
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onScanAgain}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
            >
              📷 Take Another Photo
            </button>
            <button
              onClick={onScanAgain}
              className="w-full sm:w-auto px-6 py-3 border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold rounded-xl flex items-center justify-center gap-2 transition"
            >
              ⬆️ Upload Another Image
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate current meal total dynamically whenever food items change
  const currentTotal: MealTotal = calculateMealTotal(foods);

  // Toggle item inclusion
  const toggleItemIncluded = (id: string) => {
    setFoods((prev) =>
      prev.map((f) => (f.id === id ? { ...f, included: !f.included } : f))
    );
  };

  // Adjust portion amount on food item and recalculate proportional macros
  const handleQuickPortionChange = (id: string, delta: number) => {
    setFoods((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const currentAmount = f.portionAmount || 100;
        const step = currentAmount >= 50 ? 25 : 5;
        const newAmount = Math.max(step, currentAmount + delta * step);
        const ratio = newAmount / Math.max(1, currentAmount);

        return {
          ...f,
          portionAmount: newAmount,
          calories: Math.round(f.calories * ratio),
          protein_g: Math.round(f.protein_g * ratio * 10) / 10,
          carbs_g: Math.round(f.carbs_g * ratio * 10) / 10,
          fat_g: Math.round(f.fat_g * ratio * 10) / 10,
          fiber_g: Math.round(f.fiber_g * ratio * 10) / 10,
          sugar_g: Math.round(f.sugar_g * ratio * 10) / 10,
          sodium_mg: Math.round(f.sodium_mg * ratio),
        };
      })
    );
  };

  // Direct manual portion number edit
  const handleDirectPortionChange = (id: string, newAmount: number) => {
    if (newAmount < 0) return;
    setFoods((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const currentAmount = f.portionAmount || 1;
        const targetAmount = Math.max(1, newAmount);
        const ratio = targetAmount / Math.max(1, currentAmount);

        return {
          ...f,
          portionAmount: targetAmount,
          calories: Math.round(f.calories * ratio),
          protein_g: Math.round(f.protein_g * ratio * 10) / 10,
          carbs_g: Math.round(f.carbs_g * ratio * 10) / 10,
          fat_g: Math.round(f.fat_g * ratio * 10) / 10,
          fiber_g: Math.round(f.fiber_g * ratio * 10) / 10,
          sugar_g: Math.round(f.sugar_g * ratio * 10) / 10,
          sodium_mg: Math.round(f.sodium_mg * ratio),
        };
      })
    );
  };

  // Remove food item
  const handleRemoveItem = (id: string) => {
    setFoods((prev) => prev.filter((f) => f.id !== id));
  };

  // Save edited food item from EditFoodModal
  const handleSaveEditedItem = (updated: FoodItem) => {
    setFoods((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  };

  // Add new food item manually
  const handleAddManualItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: FoodItem = {
      id: `manual-${Date.now()}`,
      name: newItemName.trim(),
      portionAmount: 100,
      portionUnit: 'g',
      cookingMethod: 'Standard',
      calories: 150,
      protein_g: 5,
      carbs_g: 20,
      fat_g: 5,
      fiber_g: 2,
      sugar_g: 2,
      sodium_mg: 120,
      confidence: 'high',
      included: true,
      notes: 'Manually added by user',
    };

    setFoods((prev) => [...prev, newItem]);
    setNewItemName('');
    setIsAddingNew(false);
    // Open editor right away so user can refine
    setEditingItem(newItem);
  };

  // Final confirmation to log into today's meals
  const handleConfirmAddMeal = () => {
    const activeFoods = foods.filter((f) => f.included !== false);
    if (activeFoods.length === 0) return;

    const record: MealRecord = {
      id: `meal-${Date.now()}`,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      mealType,
      name: mealName.trim() || 'Scanned Meal',
      foods: activeFoods,
      total: currentTotal,
      imageDataUrl: previewImage,
      confidence: analysis.confidence || 'high',
      notes: analysis.uncertaintyNotes,
    };

    setIsSaved(true);
    setTimeout(() => {
      onSaveToLog(record);
    }, 450);
  };

  // Calorie breakdown percentages
  const proteinCals = currentTotal.protein_g * 4;
  const carbsCals = currentTotal.carbs_g * 4;
  const fatCals = currentTotal.fat_g * 9;
  const macroTotalCals = Math.max(1, proteinCals + carbsCals + fatCals);

  const proteinPct = Math.round((proteinCals / macroTotalCals) * 100);
  const carbsPct = Math.round((carbsCals / macroTotalCals) * 100);
  const fatPct = Math.max(0, 100 - proteinPct - carbsPct);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24 animate-in fade-in duration-200">
      {/* Top Bar with Scan Again and Cancel */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          ← Back to Home
        </button>
        <button
          onClick={onScanAgain}
          className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200/80 hover:bg-emerald-100 flex items-center gap-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Scan Again
        </button>
      </div>

      {/* Hero Meal Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-100 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                Food Detected
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                  analysis.confidence === 'high'
                    ? 'bg-emerald-100 text-emerald-800'
                    : analysis.confidence === 'medium'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                Confidence: {analysis.confidence || 'Estimated'}
              </span>
            </div>
            <input
              type="text"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              className="text-xl sm:text-2xl font-extrabold text-slate-800 mt-1 w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 outline-hidden transition"
              title="Click to rename meal"
            />
          </div>

          {/* Meal Timing Picker */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
              <button
                key={type}
                onClick={() => setMealType(type)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition ${
                  mealType === type
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Ambiguity notice if confidence is not high */}
        {analysis.confidence !== 'high' && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Confirm Food & Portions:</span>{' '}
              {analysis.uncertaintyNotes ||
                "I'm not completely sure what this food is. Please confirm the food or edit the result using the Edit buttons below."}
            </div>
          </div>
        )}

        {/* Meal Preview Image */}
        {previewImage && (
          <div className="relative rounded-2xl overflow-hidden aspect-16/9 bg-slate-100 border border-slate-200/80 shadow-inner group">
            <img
              src={previewImage}
              alt="Scanned meal"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent p-4 flex items-end justify-between">
              <span className="text-xs text-white/90 font-medium">
                {foods.filter((f) => f.included).length} items detected
              </span>
              <span className="text-xs text-emerald-300 font-semibold bg-slate-900/60 backdrop-blur-xs px-2.5 py-1 rounded-lg">
                Visual analysis complete
              </span>
            </div>
          </div>
        )}

        {/* TOTAL MEAL SUMMARY CARD */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-50 rounded-2xl p-5 border border-emerald-500/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-emerald-600" />
                  Total Meal Nutrition
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100/90 border border-amber-300 text-amber-900 font-bold text-[10px] tracking-wide uppercase">
                  AI Estimate • Not Exact
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                  {currentTotal.calories}
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-500">
                  kcal (estimated)
                </span>
              </div>
            </div>
            <div className="sm:text-right">
              <span className="text-[11px] font-semibold text-slate-400">Macro Split</span>
              <div className="text-xs font-bold text-slate-700">
                P {proteinPct}% • C {carbsPct}% • F {fatPct}%
              </div>
            </div>
          </div>

          {/* Macro Split Bar */}
          <div className="h-2.5 rounded-full overflow-hidden flex w-full bg-slate-200">
            <div style={{ width: `${proteinPct}%` }} className="bg-blue-500" title={`Protein: ${proteinPct}%`} />
            <div style={{ width: `${carbsPct}%` }} className="bg-amber-500" title={`Carbs: ${carbsPct}%`} />
            <div style={{ width: `${fatPct}%` }} className="bg-rose-500" title={`Fat: ${fatPct}%`} />
          </div>

          {/* 6 Key Nutrients Cards */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-center shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block">💪 Protein</span>
              <span className="text-base font-extrabold text-blue-600">{currentTotal.protein_g}g</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-center shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block">🍚 Carbs</span>
              <span className="text-base font-extrabold text-amber-600">{currentTotal.carbs_g}g</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-center shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block">🥑 Fat</span>
              <span className="text-base font-extrabold text-rose-600">{currentTotal.fat_g}g</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-center shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block">🌾 Fiber</span>
              <span className="text-base font-extrabold text-emerald-600">{currentTotal.fiber_g}g</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-center shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block">🍬 Sugar</span>
              <span className="text-base font-extrabold text-purple-600">{currentTotal.sugar_g}g</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-center shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block">🧂 Sodium</span>
              <span className="text-base font-extrabold text-slate-700">{currentTotal.sodium_mg}mg</span>
            </div>
          </div>
        </div>
      </div>

      {/* DETECTED FOODS BREAKDOWN */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Detected Foods</h3>
            <p className="text-xs text-slate-500">
              Uncheck to exclude, or tap Edit to correct name, portion, or cooking style
            </p>
          </div>
          <button
            onClick={() => setIsAddingNew(true)}
            className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Item
          </button>
        </div>

        {/* Add Item form */}
        {isAddingNew && (
          <form
            onSubmit={handleAddManualItem}
            className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2"
          >
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="e.g. 1 Boiled Egg, Dal, Curd, Chapati..."
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:border-emerald-500 outline-hidden font-medium"
              autoFocus
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-2.5 py-2 text-slate-400 hover:text-slate-600 text-xs"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Food Items List */}
        <div className="space-y-3">
          {foods.map((food) => {
            const isIncluded = food.included !== false;
            return (
              <div
                key={food.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isIncluded
                    ? 'bg-slate-50/70 border-slate-200/90 shadow-xs'
                    : 'bg-slate-100/40 border-slate-200/50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Checkbox and Food Name */}
                  <div className="flex items-start gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isIncluded}
                      onChange={() => toggleItemIncluded(food.id)}
                      className="mt-1 w-4 h-4 rounded-md text-emerald-600 focus:ring-emerald-500 border-slate-300 transition cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-bold text-sm ${
                            isIncluded ? 'text-slate-800' : 'text-slate-500 line-through'
                          }`}
                        >
                          {food.name}
                        </span>
                        {food.cookingMethod && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                            {food.cookingMethod}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                            food.confidence === 'high'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {food.confidence} confidence
                        </span>
                      </div>

                      {/* Portion note / difficulty indicator */}
                      {food.portionNote && (
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          ⚠️ {food.portionNote}
                        </p>
                      )}

                      {/* Cooking remarks & hidden ingredient notes */}
                      {food.notes && (
                        <p className="text-[11px] text-slate-500 mt-0.5 italic">
                          💡 {food.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions: Edit & Remove */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingItem(food)}
                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                      title="Edit food name, portion, or cooking method"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(food.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Portion size interactive adjustments [-] 350 g [+] */}
                <div className="mt-3 pt-3 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-semibold">Portion Size:</span>
                    <div className="flex items-center rounded-xl border border-slate-300 bg-white overflow-hidden shadow-2xs focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-200">
                      <button
                        type="button"
                        onClick={() => handleQuickPortionChange(food.id, -1)}
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold transition text-xs"
                        title="Decrease portion"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={food.portionAmount}
                        onChange={(e) => handleDirectPortionChange(food.id, parseFloat(e.target.value) || 0)}
                        className="w-14 text-center font-bold text-slate-800 text-xs py-1 outline-hidden border-x border-slate-200"
                        title="Directly enter portion amount"
                      />
                      <span className="px-2 py-1 font-semibold text-slate-500 text-[11px] bg-slate-50 border-r border-slate-200">
                        {food.portionUnit}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuickPortionChange(food.id, 1)}
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold transition text-xs"
                        title="Increase portion"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Quick Calories & Macros preview with AI Estimate label */}
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                    <span className="text-slate-900 font-black text-xs">
                      {food.calories} kcal
                    </span>
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1 py-0.2 rounded font-medium border border-amber-200/70">
                      Est.
                    </span>
                    <span>• {food.protein_g}g P</span>
                    <span>• {food.carbs_g}g C</span>
                    <span>• {food.fat_g}g F</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Accuracy & Hidden Ingredients Notice */}
      <DisclaimerBanner variant="compact" />

      {/* Confirmation & Primary Action Bar */}
      <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-100 space-y-3">
        <div className="text-center sm:text-left">
          <h4 className="font-bold text-slate-800 text-sm">Is this correct?</h4>
          <p className="text-xs text-slate-500">
            Confirm to add this meal into your daily nutrition log and update your daily progress.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleConfirmAddMeal}
            disabled={isSaved}
            className="sm:col-span-2 py-3.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-75"
          >
            {isSaved ? (
              <>
                <Check className="w-5 h-5" />
                Meal Added to Today!
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                ✓ Yes, Add to Today ({mealType.toUpperCase()})
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onScanAgain}
            className="py-3.5 px-4 border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Scan Again
          </button>
        </div>
      </div>

      {/* Edit Food Modal */}
      {editingItem && (
        <EditFoodModal
          item={editingItem}
          isOpen={Boolean(editingItem)}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveEditedItem}
        />
      )}
    </div>
  );
};
