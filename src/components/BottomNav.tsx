import React from 'react';
import { Home, Camera, PieChart, History, Sparkles, User } from 'lucide-react';

interface Props {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenScan: () => void;
}

export const BottomNav: React.FC<Props> = ({ activeTab, onSelectTab, onOpenScan }) => {
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 shadow-lg pb-safe">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Home */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
            activeTab === 'home' ? 'text-emerald-600 font-bold' : 'text-slate-400 font-medium'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        {/* Dashboard / Targets */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
            activeTab === 'dashboard' ? 'text-emerald-600 font-bold' : 'text-slate-400 font-medium'
          }`}
        >
          <PieChart className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Progress</span>
        </button>

        {/* Center Floating Scan Button */}
        <button
          onClick={onOpenScan}
          className="flex flex-col items-center -mt-5 group"
        >
          <div className="w-13 h-13 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/35 border-4 border-white transition group-active:scale-95">
            <Camera className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold text-emerald-700 mt-0.5">Scan</span>
        </button>

        {/* History */}
        <button
          onClick={() => onSelectTab('history')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
            activeTab === 'history' ? 'text-emerald-600 font-bold' : 'text-slate-400 font-medium'
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">History</span>
        </button>

        {/* Nutri AI */}
        <button
          onClick={() => onSelectTab('chat')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition relative ${
            activeTab === 'chat' ? 'text-emerald-600 font-bold' : 'text-slate-400 font-medium'
          }`}
        >
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span className="text-[10px] mt-0.5">Nutri AI</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => onSelectTab('profile')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
            activeTab === 'profile' ? 'text-emerald-600 font-bold' : 'text-slate-400 font-medium'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Profile</span>
        </button>
      </div>
    </div>
  );
};
