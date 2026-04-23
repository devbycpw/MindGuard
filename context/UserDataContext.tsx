// ============================================
// MindGuard AI — User Data Context
// ============================================
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  CheckInEntry,
  JournalEntry,
  AIInsight,
  UserProfile,
} from '@/types/types';
import {
  getCheckIns,
  saveCheckIn,
  getJournalEntries,
  saveJournalEntry,
  getInsights,
  saveInsight,
  getUserProfile,
  saveUserProfile,
  clearAllData,
  getTodayDate,
} from '@/utils/storage';

interface UserDataContextType {
  checkIns: CheckInEntry[];
  journalEntries: JournalEntry[];
  insights: AIInsight[];
  profile: UserProfile;
  todayCheckIns: CheckInEntry[];
  isLoading: boolean;

  addCheckIn: (entry: CheckInEntry) => Promise<void>;
  addJournalEntry: (entry: JournalEntry) => Promise<void>;
  addInsight: (insight: AIInsight) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshData: () => Promise<void>;
  resetAllData: () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType | null>(null);

export function UserDataProvider({ children }: { children: ReactNode }) {
  const [checkIns, setCheckIns] = useState<CheckInEntry[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    ageRange: '',
    openaiApiKey: '',
    notificationsEnabled: true,
    darkMode: false,
    createdAt: Date.now(),
  });
  const [todayCheckIns, setTodayCheckIns] = useState<CheckInEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [ci, je, ins, prof] = await Promise.all([
        getCheckIns(),
        getJournalEntries(),
        getInsights(),
        getUserProfile(),
      ]);
      setCheckIns(ci);
      setJournalEntries(je);
      setInsights(ins);
      setProfile(prof);
      const today = getTodayDate();
      setTodayCheckIns(ci.filter(e => e.date === today));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refreshData(); }, [refreshData]);

  const addCheckIn = useCallback(async (entry: CheckInEntry) => {
    await saveCheckIn(entry);
    setCheckIns(prev => [entry, ...prev]);
    if (entry.date === getTodayDate()) {
      setTodayCheckIns(prev => [entry, ...prev]);
    }
  }, []);

  const addJournalEntry = useCallback(async (entry: JournalEntry) => {
    await saveJournalEntry(entry);
    setJournalEntries(prev => [entry, ...prev]);
  }, []);

  const addInsight = useCallback(async (insight: AIInsight) => {
    await saveInsight(insight);
    setInsights(prev => [insight, ...prev].slice(0, 100));
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    await saveUserProfile(updates);
    setProfile(prev => ({ ...prev, ...updates }));
  }, []);

  const resetAll = useCallback(async () => {
    await clearAllData();
    setCheckIns([]);
    setJournalEntries([]);
    setInsights([]);
    setTodayCheckIns([]);
    setProfile({
      name: '', ageRange: '', openaiApiKey: '',
      notificationsEnabled: true, darkMode: false, createdAt: Date.now(),
    });
  }, []);

  return (
    <UserDataContext.Provider value={{
      checkIns, journalEntries, insights, profile, todayCheckIns, isLoading,
      addCheckIn, addJournalEntry, addInsight, updateProfile, refreshData,
      resetAllData: resetAll,
    }}>
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserData(): UserDataContextType {
  const context = useContext(UserDataContext);
  if (!context) throw new Error('useUserData must be used within UserDataProvider');
  return context;
}
