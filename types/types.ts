// ============================================
// MindGuard AI — Type Definitions
// ============================================

/** Mood level 1-5 */
export type MoodLevel = 1 | 2 | 3 | 4 | 5;

/** Stress level 1-5 */
export type StressLevel = 1 | 2 | 3 | 4 | 5;

/** Activity types */
export type ActivityType =
  | 'exercise'
  | 'work'
  | 'social'
  | 'rest'
  | 'creative'
  | 'study'
  | 'other';

/** Risk category */
export type RiskCategory = 'Low' | 'Medium' | 'High';

/** Risk indication types */
export type RiskIndicationType = 'burnout' | 'anxiety' | 'stress_overload';

/** Pattern trend */
export type Trend = 'improving' | 'declining' | 'stable';

/** Intervention type */
export type InterventionType =
  | 'breathing'
  | 'movement'
  | 'sleep_hygiene'
  | 'grounding'
  | 'journaling'
  | 'social_connection'
  | 'rest';

// ============================================
// Data Models
// ============================================

/** Daily check-in entry — allows multiple per day */
export interface CheckInEntry {
  id: string;
  timestamp: number; // Unix ms
  date: string; // YYYY-MM-DD
  mood: MoodLevel;
  sleepHours: number; // 0-12
  stress: StressLevel;
  notes: string;
}

/** Journal entry — free-form venting */
export interface JournalEntry {
  id: string;
  timestamp: number;
  date: string;
  content: string;
  mood?: MoodLevel; // optional mood tag
}

/** Real-time emotional log */
export interface EmotionalLog {
  id: string;
  timestamp: number;
  emotion: string;
  intensity: 1 | 2 | 3 | 4 | 5;
  trigger: string;
}

/** Computed risk score */
export interface RiskScore {
  score: number; // 0-100
  category: RiskCategory;
  factors: RiskFactor[];
  timestamp: number;
  date: string;
}

/** Individual risk factor */
export interface RiskFactor {
  name: string;
  contribution: number; // 0-100
  description: string;
}

/** Risk indication (burnout, anxiety, etc.) */
export interface RiskIndication {
  type: RiskIndicationType;
  severity: 'low' | 'moderate' | 'high';
  confidence: number; // 0-1
  description: string;
  detectedAt: number;
}

/** Detected behavioral pattern */
export interface PatternData {
  id: string;
  type: string;
  title: string;
  description: string;
  trend: Trend;
  dataPoints: number;
  detectedAt: number;
}

/** Predictive simulation result */
export interface PredictionResult {
  predictedScores: { date: string; score: number }[];
  outlook: 'positive' | 'neutral' | 'negative';
  confidence: number;
  description: string;
}

/** What-if scenario */
export interface WhatIfScenario {
  scenario: string;
  currentScore: number;
  predictedScore: number;
  improvement: number;
  description: string;
}

/** Micro-intervention */
export interface Intervention {
  id: string;
  type: InterventionType;
  title: string;
  description: string;
  duration: string;
  steps?: string[];
  priority: 'low' | 'medium' | 'high';
}

/** AI-generated insight */
export interface AIInsight {
  id: string;
  timestamp: number;
  analysis: string;
  recommendations: string[];
  condition: string;
  riskLevel: string;
  confidence: number;
  source: 'rule_based' | 'openai';
}

/** User profile */
export interface UserProfile {
  name: string;
  ageRange: string;
  openaiApiKey: string;
  notificationsEnabled: boolean;
  darkMode: boolean;
  createdAt: number;
}

/** App data bundle (for export/import) */
export interface AppData {
  profile: UserProfile;
  checkIns: CheckInEntry[];
  journalEntries: JournalEntry[];
  insights: AIInsight[];
  exportedAt: number;
}

/** Breathing pattern */
export interface BreathingPattern {
  name: string;
  description: string;
  phases: BreathingPhase[];
  totalDuration: number;
}

export interface BreathingPhase {
  label: string;
  duration: number; // seconds
  action: 'inhale' | 'hold' | 'exhale';
}
