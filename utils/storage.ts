// ============================================
// MindGuard AI — AsyncStorage Utility
// ============================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CheckInEntry,
  JournalEntry,
  AIInsight,
  UserProfile,
  AppData,
} from '@/types/types';

const KEYS = {
  CHECK_INS: '@mindguard/check_ins',
  JOURNAL: '@mindguard/journal',
  INSIGHTS: '@mindguard/insights',
  PROFILE: '@mindguard/profile',
};

// ============================================
// Check-In Storage (multiple per day allowed)
// ============================================

export async function saveCheckIn(entry: CheckInEntry): Promise<void> {
  const existing = await getCheckIns();
  existing.unshift(entry); // newest first
  existing.sort((a, b) => b.timestamp - a.timestamp);
  await AsyncStorage.setItem(KEYS.CHECK_INS, JSON.stringify(existing));
}

export async function getCheckIns(): Promise<CheckInEntry[]> {
  const raw = await AsyncStorage.getItem(KEYS.CHECK_INS);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CheckInEntry[];
  } catch {
    return [];
  }
}

export async function getCheckInHistory(days: number): Promise<CheckInEntry[]> {
  const all = await getCheckIns();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return all.filter((e) => e.timestamp >= cutoff);
}

export async function getTodayCheckIns(): Promise<CheckInEntry[]> {
  const all = await getCheckIns();
  const today = getTodayDate();
  return all.filter((e) => e.date === today);
}

export async function getLatestCheckIn(): Promise<CheckInEntry | null> {
  const all = await getCheckIns();
  return all.length > 0 ? all[0] : null;
}

// ============================================
// Journal Storage
// ============================================

export async function saveJournalEntry(entry: JournalEntry): Promise<void> {
  const existing = await getJournalEntries();
  existing.unshift(entry);
  const trimmed = existing.slice(0, 500);
  await AsyncStorage.setItem(KEYS.JOURNAL, JSON.stringify(trimmed));
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  const raw = await AsyncStorage.getItem(KEYS.JOURNAL);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as JournalEntry[];
  } catch {
    return [];
  }
}

// ============================================
// AI Insight Storage
// ============================================

export async function saveInsight(insight: AIInsight): Promise<void> {
  const existing = await getInsights();
  existing.unshift(insight);
  const trimmed = existing.slice(0, 100);
  await AsyncStorage.setItem(KEYS.INSIGHTS, JSON.stringify(trimmed));
}

export async function getInsights(): Promise<AIInsight[]> {
  const raw = await AsyncStorage.getItem(KEYS.INSIGHTS);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AIInsight[];
  } catch {
    return [];
  }
}

// ============================================
// User Profile Storage
// ============================================

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  ageRange: '',
  openaiApiKey: '',
  notificationsEnabled: true,
  darkMode: false,
  createdAt: Date.now(),
};

export async function getUserProfile(): Promise<UserProfile> {
  const raw = await AsyncStorage.getItem(KEYS.PROFILE);
  if (!raw) return { ...DEFAULT_PROFILE };
  try {
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export async function saveUserProfile(profile: Partial<UserProfile>): Promise<void> {
  const existing = await getUserProfile();
  const updated = { ...existing, ...profile };
  await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(updated));
}

// ============================================
// Export / Import / Clear
// ============================================

export async function exportAllData(): Promise<AppData> {
  const [profile, checkIns, journalEntries, insights] = await Promise.all([
    getUserProfile(),
    getCheckIns(),
    getJournalEntries(),
    getInsights(),
  ]);
  return { profile, checkIns, journalEntries, insights, exportedAt: Date.now() };
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove([
    KEYS.CHECK_INS,
    KEYS.JOURNAL,
    KEYS.INSIGHTS,
    KEYS.PROFILE,
  ]);
}

// ============================================
// Helpers
// ============================================

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateFull(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
