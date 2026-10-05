import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, DailyTargets, MealRecord } from '../types/nutrition';
import { askNutriAI } from '../services/nutritionApi';
import { getChatHistory, saveChatHistory } from '../services/storage';
import { Sparkles, Send, Loader2, Bot, User, Trash2 } from 'lucide-react';
import { DisclaimerBanner } from './DisclaimerBanner';

interface Props {
  todayMeals: MealRecord[];
  dailyTargets: DailyTargets;
}

const SUGGESTED_PROMPTS = [
  'How many calories are in two eggs?',
  'Is chicken biryani high in protein?',
  'What should I eat for a high-protein dinner?',
  'How much protein have I eaten today?',
  'Suggest a 500 calorie vegetarian meal.',
  'What is a healthier alternative to deep-fried snacks?',
];

export const NutriChat: React.FC<Props> = ({ todayMeals, dailyTargets }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => getChatHistory());
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Build context summary for Nutri AI
  const todaySummary = todayMeals.reduce(
    (acc, m) => {
      acc.calories += m.total.calories || 0;
      acc.protein_g += m.total.protein_g || 0;
      acc.carbs_g += m.total.carbs_g || 0;
      acc.fat_g += m.total.fat_g || 0;
      return acc;
    },
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );

  const userContext = {
    todayConsumed: {
      calories: todaySummary.calories,
      protein_g: todaySummary.protein_g,
      carbs_g: todaySummary.carbs_g,
      fat_g: todaySummary.fat_g,
      mealsLoggedCount: todayMeals.length,
      meals: todayMeals.map((m) => ({ name: m.name, calories: m.total.calories })),
    },
    dailyTargets: {
      calories: dailyTargets.calories,
      protein_g: dailyTargets.protein_g,
      carbs_g: dailyTargets.carbs_g,
      fat_g: dailyTargets.fat_g,
    },
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const replyText = await askNutriAI(
        updatedMessages.map((m) => ({ role: m.role, text: m.text })),
        userContext
      );

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        text: replyText,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, aiMsg];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'model',
        text: "I'm having a little trouble connecting right now. Please try asking again in a moment.",
        timestamp: new Date().toISOString(),
      };
      const finalMessages = [...updatedMessages, errorMsg];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    const fresh: ChatMessage[] = [
      {
        id: 'welcome-msg',
        role: 'model',
        text: 'Hello! I am Nutri AI, your personal food and nutrition assistant. Ask me questions about calories, protein goals, healthier food swaps, or your meals for today!',
        timestamp: new Date().toISOString(),
      },
    ];
    setMessages(fresh);
    saveChatHistory(fresh);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-28 animate-in fade-in duration-200 flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-amber-500/25">
            🤖
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Nutri AI
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Your AI food & nutrition companion
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="text-xs font-semibold text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition"
          title="Reset conversation"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Suggested Prompts horizontal carousel */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 shrink-0 no-scrollbar">
        {SUGGESTED_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/40 text-[11px] font-semibold text-slate-700 whitespace-nowrap transition shadow-2xs cursor-pointer"
          >
            💬 {prompt}
          </button>
        ))}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-3.5 p-4 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-inner">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                  isUser
                    ? 'bg-slate-800 text-white'
                    : 'bg-emerald-600 text-white shadow-xs'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[82%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-slate-800 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 shadow-2xs rounded-tl-none'
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 italic pl-10">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            Nutri AI is thinking…
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        className="flex items-center gap-2 shrink-0 pt-1"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask Nutri AI about calories, recipes, protein, or swaps..."
          className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden text-xs sm:text-sm text-slate-800 font-medium transition shadow-xs"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition shadow-md shadow-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Disclaimer */}
      <p className="text-[10px] text-center text-slate-400 shrink-0">
        Nutri AI provides general nutritional guidance. Do not use for medical diagnosis or clinical treatment.
      </p>
    </div>
  );
};
