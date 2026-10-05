import React from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';

interface Props {
  variant?: 'compact' | 'full';
  className?: string;
}

export const DisclaimerBanner: React.FC<Props> = ({ variant = 'compact', className = '' }) => {
  if (variant === 'compact') {
    return (
      <div className={`p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5 ${className}`}>
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Nutrition Estimate Notice:</span> All values are algorithmic estimates based on visual appearance, portion heuristics, and preparation styles. Hidden ingredients like cooking oils, ghee, butter, and sauces can alter actual calories. For specific medical or dietary needs, consult a qualified healthcare professional.
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs text-slate-600 ${className}`}>
      <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        Health & Accuracy Disclaimer
      </div>
      <p>
        NutriSnap AI is designed for general nutrition awareness and wellness tracking. Calorie and macronutrient calculations are mathematical approximations and should not be used as clinical diagnostic measurements.
      </p>
      <p className="text-slate-500">
        Hidden ingredients such as cooking oils, gravies, butter, sugars, and salad dressings significantly alter caloric density without always being visually distinct in photographs.
      </p>
    </div>
  );
};
