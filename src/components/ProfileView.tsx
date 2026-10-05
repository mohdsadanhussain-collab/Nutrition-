import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, DailyTargets, ActivityLevel, FitnessGoal } from '../types/nutrition';
import { calculateDailyTargets } from '../services/calorieCalculator';
import { DisclaimerBanner } from './DisclaimerBanner';
import { User, Target, ShieldCheck, Trash2, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

interface Props {
  profile: UserProfile;
  dailyTargets: DailyTargets;
  onSaveProfile: (profile: UserProfile) => void;
  onClearAllData: () => void;
}

// Reasonable validation ranges for body parameters
const RANGES = {
  AGE: { min: 10, max: 120, label: '10–120 years' },
  HEIGHT: { min: 80, max: 250, label: '80–250 cm' },
  WEIGHT: { min: 25, max: 350, label: '25–350 kg' },
  CUSTOM_CALORIES: { min: 800, max: 6000 },
  CUSTOM_PROTEIN: { min: 20, max: 400 },
  CUSTOM_CARBS: { min: 20, max: 800 },
  CUSTOM_FAT: { min: 10, max: 300 },
};

export const ProfileView: React.FC<Props> = ({
  profile,
  dailyTargets,
  onSaveProfile,
  onClearAllData,
}) => {
  // String-based input states to enable natural typing and backspacing without glitching
  const [ageStr, setAgeStr] = useState<string>(String(profile.age ?? 28));
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(profile.gender || 'female');
  const [heightStr, setHeightStr] = useState<string>(String(profile.heightCm ?? 165));
  const [weightStr, setWeightStr] = useState<string>(String(profile.weightKg ?? 62));
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile.activityLevel || 'moderate');
  const [goal, setGoal] = useState<FitnessGoal>(profile.goal || 'maintain_weight');

  // Custom Targets toggle & overrides
  const [useCustomTargets, setUseCustomTargets] = useState<boolean>(
    Boolean(profile.customTargets && profile.customTargets.calories)
  );
  const [customCalories, setCustomCalories] = useState<string>(
    String(profile.customTargets?.calories || dailyTargets.calories || 2000)
  );
  const [customProtein, setCustomProtein] = useState<string>(
    String(profile.customTargets?.protein_g || dailyTargets.protein_g || 110)
  );
  const [customCarbs, setCustomCarbs] = useState<string>(
    String(profile.customTargets?.carbs_g || dailyTargets.carbs_g || 250)
  );
  const [customFat, setCustomFat] = useState<string>(
    String(profile.customTargets?.fat_g || dailyTargets.fat_g || 65)
  );

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savedCalories, setSavedCalories] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [clearedNotice, setClearedNotice] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Sync inputs if parent profile changes
  useEffect(() => {
    setAgeStr(String(profile.age ?? 28));
    setGender(profile.gender || 'female');
    setHeightStr(String(profile.heightCm ?? 165));
    setWeightStr(String(profile.weightKg ?? 62));
    setActivityLevel(profile.activityLevel || 'moderate');
    setGoal(profile.goal || 'maintain_weight');
    const hasCustom = Boolean(profile.customTargets && profile.customTargets.calories);
    setUseCustomTargets(hasCustom);
    if (profile.customTargets) {
      setCustomCalories(String(profile.customTargets.calories));
      setCustomProtein(String(profile.customTargets.protein_g));
      setCustomCarbs(String(profile.customTargets.carbs_g));
      setCustomFat(String(profile.customTargets.fat_g));
    }
  }, [profile]);

  // Numeric parsing
  const parsedAge = parseInt(ageStr, 10);
  const parsedHeight = parseFloat(heightStr);
  const parsedWeight = parseFloat(weightStr);

  // Field Validations
  const ageError = useMemo(() => {
    if (!ageStr.trim()) return 'Age is required';
    if (isNaN(parsedAge) || parsedAge < RANGES.AGE.min || parsedAge > RANGES.AGE.max) {
      return `Please enter an age between ${RANGES.AGE.label}`;
    }
    return null;
  }, [ageStr, parsedAge]);

  const heightError = useMemo(() => {
    if (!heightStr.trim()) return 'Height is required';
    if (isNaN(parsedHeight) || parsedHeight < RANGES.HEIGHT.min || parsedHeight > RANGES.HEIGHT.max) {
      return `Please enter a height between ${RANGES.HEIGHT.label}`;
    }
    return null;
  }, [heightStr, parsedHeight]);

  const weightError = useMemo(() => {
    if (!weightStr.trim()) return 'Weight is required';
    if (isNaN(parsedWeight) || parsedWeight < RANGES.WEIGHT.min || parsedWeight > RANGES.WEIGHT.max) {
      return `Please enter a weight between ${RANGES.WEIGHT.label}`;
    }
    return null;
  }, [weightStr, parsedWeight]);

  const isFormValid = !ageError && !heightError && !weightError;

  // Live calculation of targets using current valid inputs
  const liveTargets = useMemo(() => {
    const validProfile: UserProfile = {
      age: !ageError && !isNaN(parsedAge) ? parsedAge : profile.age,
      gender,
      heightCm: !heightError && !isNaN(parsedHeight) ? parsedHeight : profile.heightCm,
      weightKg: !weightError && !isNaN(parsedWeight) ? parsedWeight : profile.weightKg,
      activityLevel,
      goal,
      customTargets: useCustomTargets && customCalories
        ? {
            calories: Number(customCalories) || 2000,
            protein_g: Number(customProtein) || 110,
            carbs_g: Number(customCarbs) || 250,
            fat_g: Number(customFat) || 65,
          }
        : undefined,
    };
    return calculateDailyTargets(validProfile);
  }, [
    ageError,
    parsedAge,
    profile.age,
    gender,
    heightError,
    parsedHeight,
    profile.heightCm,
    weightError,
    parsedWeight,
    profile.weightKg,
    activityLevel,
    goal,
    useCustomTargets,
    customCalories,
    customProtein,
    customCarbs,
    customFat,
  ]);

  // Handle Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({ age: true, height: true, weight: true });

    if (!isFormValid) {
      return;
    }

    const updatedProfile: UserProfile = {
      age: parsedAge,
      gender,
      heightCm: Math.round(parsedHeight * 10) / 10,
      weightKg: Math.round(parsedWeight * 10) / 10,
      activityLevel,
      goal,
      customTargets: useCustomTargets
        ? {
            calories: Math.max(800, Math.min(6000, Math.round(Number(customCalories)) || 2000)),
            protein_g: Math.max(20, Math.min(400, Math.round(Number(customProtein)) || 110)),
            carbs_g: Math.max(20, Math.min(800, Math.round(Number(customCarbs)) || 250)),
            fat_g: Math.max(10, Math.min(300, Math.round(Number(customFat)) || 65)),
          }
        : undefined,
    };

    onSaveProfile(updatedProfile);
    setSavedCalories(liveTargets.calories);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleClearDataConfirm = () => {
    setIsConfirmOpen(true);
  };

  const handleExecuteClear = () => {
    onClearAllData();
    setIsConfirmOpen(false);
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 3500);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Profile & Nutrition Targets
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Personalize your daily calories and macro targets
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Profile and targets saved successfully! Daily target set to{' '}
            <strong>{savedCalories?.toLocaleString()} kcal</strong>.
          </span>
        </div>
      )}

      {clearedNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          All local meal and scan history has been successfully erased.
        </div>
      )}

      {/* Targets Overview Hero Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold">
              🎯
            </span>
            <span className="font-extrabold text-sm uppercase tracking-wider text-emerald-400">
              Your Daily Target
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            {useCustomTargets ? 'Custom Values' : 'Mifflin-St Jeor Estimate'}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            {liveTargets.calories.toLocaleString()}
          </span>
          <span className="text-sm font-bold text-slate-400">kcal / day</span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-700/80">
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 text-center">
            <span className="text-[11px] text-slate-400 block font-medium">Protein</span>
            <span className="text-base font-extrabold text-blue-400">{liveTargets.protein_g}g</span>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 text-center">
            <span className="text-[11px] text-slate-400 block font-medium">Carbs</span>
            <span className="text-base font-extrabold text-amber-400">{liveTargets.carbs_g}g</span>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 text-center">
            <span className="text-[11px] text-slate-400 block font-medium">Fat</span>
            <span className="text-base font-extrabold text-rose-400">{liveTargets.fat_g}g</span>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-5">
        <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-600" />
          Body & Activity Details
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {/* Age */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Age (Years)
            </label>
            <input
              type="number"
              min={RANGES.AGE.min}
              max={RANGES.AGE.max}
              step="1"
              value={ageStr}
              onBlur={() => setTouched((prev) => ({ ...prev, age: true }))}
              onChange={(e) => {
                setAgeStr(e.target.value);
                setTouched((prev) => ({ ...prev, age: true }));
              }}
              placeholder="e.g. 28"
              className={`w-full px-3.5 py-2.5 rounded-xl border font-semibold text-slate-800 text-sm outline-hidden transition ${
                touched.age && ageError
                  ? 'border-red-400 focus:border-red-500 bg-red-50/20'
                  : 'border-slate-300 focus:border-emerald-500'
              }`}
              required
            />
            {touched.age && ageError && (
              <p className="text-[11px] text-red-600 mt-1 font-medium">{ageError}</p>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-emerald-500 font-semibold text-slate-800 text-sm outline-hidden cursor-pointer"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other / Non-binary</option>
            </select>
          </div>

          {/* Height */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Height (cm)
            </label>
            <input
              type="number"
              min={RANGES.HEIGHT.min}
              max={RANGES.HEIGHT.max}
              step="0.5"
              value={heightStr}
              onBlur={() => setTouched((prev) => ({ ...prev, height: true }))}
              onChange={(e) => {
                setHeightStr(e.target.value);
                setTouched((prev) => ({ ...prev, height: true }));
              }}
              placeholder="e.g. 165"
              className={`w-full px-3.5 py-2.5 rounded-xl border font-semibold text-slate-800 text-sm outline-hidden transition ${
                touched.height && heightError
                  ? 'border-red-400 focus:border-red-500 bg-red-50/20'
                  : 'border-slate-300 focus:border-emerald-500'
              }`}
              required
            />
            {touched.height && heightError && (
              <p className="text-[11px] text-red-600 mt-1 font-medium">{heightError}</p>
            )}
          </div>

          {/* Weight */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Weight (kg)
            </label>
            <input
              type="number"
              min={RANGES.WEIGHT.min}
              max={RANGES.WEIGHT.max}
              step="0.1"
              value={weightStr}
              onBlur={() => setTouched((prev) => ({ ...prev, weight: true }))}
              onChange={(e) => {
                setWeightStr(e.target.value);
                setTouched((prev) => ({ ...prev, weight: true }));
              }}
              placeholder="e.g. 62.5"
              className={`w-full px-3.5 py-2.5 rounded-xl border font-semibold text-slate-800 text-sm outline-hidden transition ${
                touched.weight && weightError
                  ? 'border-red-400 focus:border-red-500 bg-red-50/20'
                  : 'border-slate-300 focus:border-emerald-500'
              }`}
              required
            />
            {touched.weight && weightError && (
              <p className="text-[11px] text-red-600 mt-1 font-medium">{weightError}</p>
            )}
          </div>
        </div>

        {/* Activity Level */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Physical Activity Level
          </label>
          <select
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-emerald-500 font-semibold text-slate-800 text-sm outline-hidden cursor-pointer"
          >
            <option value="sedentary">Sedentary (Little or no exercise, desk job)</option>
            <option value="light">Lightly Active (Exercise 1-3 days/week)</option>
            <option value="moderate">Moderately Active (Exercise 3-5 days/week)</option>
            <option value="very_active">Very Active (Hard exercise 6-7 days/week)</option>
            <option value="extra_active">Extra Active (Very heavy physical training/labor)</option>
          </select>
        </div>

        {/* Fitness Goal */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Primary Nutrition Goal
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'lose_weight', label: 'Lose Weight', desc: 'Caloric deficit (~450 kcal)' },
              { id: 'maintain_weight', label: 'Maintain Weight', desc: 'Balanced energy intake' },
              { id: 'gain_weight', label: 'Gain Weight', desc: 'Caloric surplus' },
              { id: 'build_muscle', label: 'Build Muscle', desc: 'High protein surplus' },
            ].map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGoal(g.id as FitnessGoal)}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  goal === g.id
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-200'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <span className="font-bold text-xs text-slate-800 block">{g.label}</span>
                <span className="text-[11px] text-slate-500">{g.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Targets Toggle */}
        <div className="pt-2 border-t border-slate-100">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={useCustomTargets}
              onChange={(e) => setUseCustomTargets(e.target.checked)}
              className="w-4 h-4 rounded-md text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-800">
              Override with manual target values
            </span>
          </label>

          {useCustomTargets && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Calories (kcal)</label>
                <input
                  type="number"
                  min={RANGES.CUSTOM_CALORIES.min}
                  max={RANGES.CUSTOM_CALORIES.max}
                  value={customCalories}
                  onChange={(e) => setCustomCalories(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-xs outline-hidden focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Protein (g)</label>
                <input
                  type="number"
                  min={RANGES.CUSTOM_PROTEIN.min}
                  max={RANGES.CUSTOM_PROTEIN.max}
                  value={customProtein}
                  onChange={(e) => setCustomProtein(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-xs outline-hidden focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Carbs (g)</label>
                <input
                  type="number"
                  min={RANGES.CUSTOM_CARBS.min}
                  max={RANGES.CUSTOM_CARBS.max}
                  value={customCarbs}
                  onChange={(e) => setCustomCarbs(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-xs outline-hidden focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Fat (g)</label>
                <input
                  type="number"
                  min={RANGES.CUSTOM_FAT.min}
                  max={RANGES.CUSTOM_FAT.max}
                  value={customFat}
                  onChange={(e) => setCustomFat(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-xs outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Save button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full py-3.5 font-bold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer ${
              isFormValid
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
                : 'bg-slate-300 text-slate-500 shadow-none cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            Save Profile & Update Targets
          </button>
        </div>
      </form>

      {/* PRIVACY & DATA MANAGEMENT */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-4">
        <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          Privacy & Data Protection
        </h3>

        <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
          <p>
            • <strong>Food Image Processing:</strong> Your meal images are securely processed to estimate ingredients, portions, and nutrition. NutriSnap AI does not permanently store your photos on remote media storage.
          </p>
          <p>
            • <strong>Minimal Data:</strong> We do not ask for personal identity or sensitive telemetry. Profile values (weight, height, age) are only used locally to calculate your estimated BMR and TDEE calorie baseline.
          </p>
          <p>
            • <strong>User Data Ownership:</strong> All logged meals and chat history are kept in your browser storage. You can delete individual meal entries or clear all history at any time.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleClearDataConfirm}
            className="px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-semibold text-xs flex items-center gap-2 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Erase All Local Data & History
          </button>
        </div>
      </div>

      {/* Health & Medical Disclaimer */}
      <DisclaimerBanner variant="full" />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Erase All Local Data & Meal History?"
        message="This will permanently delete all your scanned meals, calorie logs, and nutrition records from your device storage. This cannot be undone."
        confirmLabel="Yes, Erase Everything"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleExecuteClear}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};
