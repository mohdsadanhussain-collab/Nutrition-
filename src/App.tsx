/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { ScanModal } from './components/ScanModal';
import { AnalysisResult } from './components/AnalysisResult';
import { DailyDashboard } from './components/DailyDashboard';
import { MealHistory } from './components/MealHistory';
import { NutriChat } from './components/NutriChat';
import { ProfileView } from './components/ProfileView';
import { MealDetailModal } from './components/MealDetailModal';
import {
  getUserProfile,
  saveUserProfile,
  getMeals,
  saveMeal,
  deleteMeal,
  clearAllMeals,
} from './services/storage';
import { calculateDailyTargets } from './services/calorieCalculator';
import { AnalyzeFoodResponse, MealRecord, UserProfile } from './types/nutrition';
import { SampleFoodOption } from './data/sampleFoods';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard' | 'history' | 'chat' | 'profile'>('home');
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalyzeFoodResponse | null>(null);
  const [analysisPreviewUrl, setAnalysisPreviewUrl] = useState<string>('');
  const [viewingMeal, setViewingMeal] = useState<MealRecord | null>(null);

  // Persistent State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => getUserProfile());
  const [meals, setMeals] = useState<MealRecord[]>(() => getMeals());

  // Calculated daily targets
  const dailyTargets = calculateDailyTargets(userProfile);

  // Filter today's meals
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMeals = meals.filter((m) => m.date === todayStr);

  // Analysis result callback from ScanModal
  const handleAnalysisSuccess = (result: AnalyzeFoodResponse, imagePreview: string) => {
    setCurrentAnalysis(result);
    setAnalysisPreviewUrl(imagePreview);
  };

  // Add meal record to today's log
  const handleSaveMealToLog = (record: MealRecord) => {
    const updated = saveMeal(record);
    setMeals(updated);
    setCurrentAnalysis(null);
    setAnalysisPreviewUrl('');
    setActiveTab('home');
  };

  // Delete meal
  const handleDeleteMeal = (mealId: string) => {
    const updated = deleteMeal(mealId);
    setMeals(updated);
  };

  // Clear all meals (privacy requirement)
  const handleClearAllMeals = () => {
    clearAllMeals();
    setMeals([]);
  };

  // Update profile
  const handleSaveProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    saveUserProfile(updated);
  };

  // Trigger quick scan from upload
  const handleQuickUpload = () => {
    setIsScanOpen(true);
  };

  // Test with sample food option
  const handleTestSample = (sample: SampleFoodOption) => {
    setIsScanOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header Navbar */}
      <Navbar
        activeTab={currentAnalysis ? '' : activeTab}
        onSelectTab={(tab) => {
          setCurrentAnalysis(null);
          setActiveTab(tab as any);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenScan={() => setIsScanOpen(true)}
      />

      {/* Main App Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto">
        {currentAnalysis ? (
          /* Active Scan Result Screen */
          <AnalysisResult
            analysis={currentAnalysis}
            previewImage={analysisPreviewUrl}
            onScanAgain={() => {
              setCurrentAnalysis(null);
              setIsScanOpen(true);
            }}
            onSaveToLog={handleSaveMealToLog}
            onCancel={() => setCurrentAnalysis(null)}
          />
        ) : (
          /* Tab Navigation Views */
          <>
            {activeTab === 'home' && (
              <HomeScreen
                todayMeals={todayMeals}
                dailyTargets={dailyTargets}
                userProfile={userProfile}
                onOpenScan={() => setIsScanOpen(true)}
                onQuickUpload={handleQuickUpload}
                onSelectMealDetail={(meal) => setViewingMeal(meal)}
                onNavigateToTab={(tab) => {
                  setActiveTab(tab as any);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onTestSample={handleTestSample}
              />
            )}

            {activeTab === 'dashboard' && (
              <DailyDashboard
                todayMeals={todayMeals}
                dailyTargets={dailyTargets}
                userProfile={userProfile}
                onOpenScan={() => setIsScanOpen(true)}
                onSelectMealDetail={(meal) => setViewingMeal(meal)}
                onNavigateToTab={(tab) => {
                  setActiveTab(tab as any);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {activeTab === 'history' && (
              <MealHistory
                meals={meals}
                onSelectMeal={(meal) => setViewingMeal(meal)}
                onDeleteMeal={handleDeleteMeal}
                onClearAll={handleClearAllMeals}
                onOpenScan={() => setIsScanOpen(true)}
              />
            )}

            {activeTab === 'chat' && (
              <NutriChat
                todayMeals={todayMeals}
                dailyTargets={dailyTargets}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileView
                profile={userProfile}
                dailyTargets={dailyTargets}
                onSaveProfile={handleSaveProfile}
                onClearAllData={handleClearAllMeals}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={currentAnalysis ? '' : activeTab}
        onSelectTab={(tab) => {
          setCurrentAnalysis(null);
          setActiveTab(tab as any);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenScan={() => setIsScanOpen(true)}
      />

      {/* Scan Modal (Take Photo / Upload / Samples) */}
      <ScanModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onAnalysisSuccess={handleAnalysisSuccess}
      />

      {/* Meal Detail Modal (When viewing previous or today's meals) */}
      <MealDetailModal
        meal={viewingMeal}
        onClose={() => setViewingMeal(null)}
        onDeleteMeal={handleDeleteMeal}
      />
    </div>
  );
}
