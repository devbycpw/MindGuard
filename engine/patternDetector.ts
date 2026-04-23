// ============================================
// MindGuard AI — Pattern Detector
// ============================================
// Analyzes behavioral patterns from check-in history

import {
  CheckInEntry,
  EmotionalLog,
  PatternData,
  Trend,
} from '@/types/types';
import { generateId } from '@/utils/storage';

/**
 * Detect all patterns from check-in history
 */
export function detectPatterns(
  checkIns: CheckInEntry[],
  emotionalLogs: EmotionalLog[] = []
): PatternData[] {
  const patterns: PatternData[] = [];

  if (checkIns.length < 3) return patterns;

  const sorted = [...checkIns].sort((a, b) => a.timestamp - b.timestamp);

  // 1. Mood Trend
  const moodPattern = detectMoodTrend(sorted);
  if (moodPattern) patterns.push(moodPattern);

  // 2. Sleep Pattern
  const sleepPattern = detectSleepPattern(sorted);
  if (sleepPattern) patterns.push(sleepPattern);

  // 3. Stress Pattern
  const stressPattern = detectStressPattern(sorted);
  if (stressPattern) patterns.push(stressPattern);

  // 4. Activity-Mood Correlation
  const activityPattern = detectActivityMoodCorrelation(sorted);
  if (activityPattern) patterns.push(activityPattern);

  // 5. Weekly Rhythm
  const weeklyPattern = detectWeeklyRhythm(sorted);
  if (weeklyPattern) patterns.push(weeklyPattern);

  // 6. Sleep-Mood Correlation
  const sleepMoodPattern = detectSleepMoodCorrelation(sorted);
  if (sleepMoodPattern) patterns.push(sleepMoodPattern);

  return patterns;
}

// ============================================
// Individual Pattern Detectors
// ============================================

function detectMoodTrend(entries: CheckInEntry[]): PatternData | null {
  if (entries.length < 3) return null;

  const recent = entries.slice(-7);
  const trend = computeTrend(recent.map((e) => e.mood));
  const avgMood = average(recent.map((e) => e.mood));

  let description: string;
  if (trend === 'improving') {
    description = `Your mood has been improving over the last ${recent.length} days. Average mood: ${avgMood.toFixed(1)}/5. Keep it up!`;
  } else if (trend === 'declining') {
    description = `Your mood has been declining over the last ${recent.length} days. Average mood: ${avgMood.toFixed(1)}/5. Consider what might be causing this.`;
  } else {
    description = `Your mood has been stable over the last ${recent.length} days. Average mood: ${avgMood.toFixed(1)}/5.`;
  }

  return {
    id: generateId(),
    type: 'mood_trend',
    title: 'Mood Trend',
    description,
    trend,
    dataPoints: recent.length,
    detectedAt: Date.now(),
  };
}

function detectSleepPattern(entries: CheckInEntry[]): PatternData | null {
  if (entries.length < 3) return null;

  const recent = entries.slice(-7);
  const sleepHours = recent.map((e) => e.sleepHours);
  const avgSleep = average(sleepHours);
  const variance = computeVariance(sleepHours);
  const trend = computeTrend(sleepHours);

  let title: string;
  let description: string;

  if (variance > 4) {
    title = 'Irregular Sleep Pattern';
    description = `Your sleep schedule is highly variable (${Math.min(...sleepHours).toFixed(0)}-${Math.max(...sleepHours).toFixed(0)} hours). Irregular sleep can affect mental health.`;
  } else if (avgSleep < 6) {
    title = 'Insufficient Sleep';
    description = `Average sleep of ${avgSleep.toFixed(1)} hours over ${recent.length} days is below the recommended 7-9 hours.`;
  } else if (avgSleep >= 7 && avgSleep <= 9 && variance < 2) {
    title = 'Healthy Sleep Pattern';
    description = `Great sleep habits! Average of ${avgSleep.toFixed(1)} hours with consistent schedule.`;
  } else {
    title = 'Sleep Pattern';
    description = `Average sleep: ${avgSleep.toFixed(1)} hours over ${recent.length} days.`;
  }

  return {
    id: generateId(),
    type: 'sleep_pattern',
    title,
    description,
    trend,
    dataPoints: recent.length,
    detectedAt: Date.now(),
  };
}

function detectStressPattern(entries: CheckInEntry[]): PatternData | null {
  if (entries.length < 3) return null;

  const recent = entries.slice(-7);
  const stressLevels = recent.map((e) => e.stress);
  const avgStress = average(stressLevels);
  const trend = computeTrend(stressLevels);

  let description: string;
  if (avgStress >= 4) {
    description = `Average stress level of ${avgStress.toFixed(1)}/5 is high. Consider stress management techniques.`;
  } else if (avgStress >= 3) {
    description = `Moderate average stress of ${avgStress.toFixed(1)}/5. Monitor for increases.`;
  } else {
    description = `Low average stress of ${avgStress.toFixed(1)}/5. Good stress management!`;
  }

  return {
    id: generateId(),
    type: 'stress_trend',
    title: 'Stress Trend',
    description,
    trend,
    dataPoints: recent.length,
    detectedAt: Date.now(),
  };
}

function detectActivityMoodCorrelation(entries: CheckInEntry[]): PatternData | null {
  if (entries.length < 5) return null;

  // Group by activity and compute avg mood
  const activityMood: Record<string, number[]> = {};
  for (const e of entries) {
    if (!activityMood[e.activity]) activityMood[e.activity] = [];
    activityMood[e.activity].push(e.mood);
  }

  let bestActivity = '';
  let bestMood = 0;
  let worstActivity = '';
  let worstMood = 5;

  for (const [activity, moods] of Object.entries(activityMood)) {
    if (moods.length < 2) continue;
    const avg = average(moods);
    if (avg > bestMood) {
      bestMood = avg;
      bestActivity = activity;
    }
    if (avg < worstMood) {
      worstMood = avg;
      worstActivity = activity;
    }
  }

  if (!bestActivity) return null;

  const description =
    bestActivity === worstActivity
      ? `Your mood is generally ${bestMood.toFixed(1)}/5 during ${bestActivity} activities.`
      : `Your mood is highest during ${bestActivity} (avg ${bestMood.toFixed(1)}/5) and lowest during ${worstActivity} (avg ${worstMood.toFixed(1)}/5).`;

  return {
    id: generateId(),
    type: 'activity_mood_correlation',
    title: 'Activity-Mood Connection',
    description,
    trend: 'stable',
    dataPoints: entries.length,
    detectedAt: Date.now(),
  };
}

function detectWeeklyRhythm(entries: CheckInEntry[]): PatternData | null {
  if (entries.length < 7) return null;

  // Group by day of week
  const dayMoods: Record<number, number[]> = {};
  for (const e of entries) {
    const day = new Date(e.timestamp).getDay();
    if (!dayMoods[day]) dayMoods[day] = [];
    dayMoods[day].push(e.mood);
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let bestDay = 0;
  let bestMood = 0;
  let worstDay = 0;
  let worstMood = 5;

  for (const [dayStr, moods] of Object.entries(dayMoods)) {
    const day = Number(dayStr);
    const avg = average(moods);
    if (avg > bestMood) { bestMood = avg; bestDay = day; }
    if (avg < worstMood) { worstMood = avg; worstDay = day; }
  }

  return {
    id: generateId(),
    type: 'weekly_rhythm',
    title: 'Weekly Rhythm',
    description: `You tend to feel best on ${dayNames[bestDay]}s (avg mood ${bestMood.toFixed(1)}/5) and lowest on ${dayNames[worstDay]}s (avg mood ${worstMood.toFixed(1)}/5).`,
    trend: 'stable',
    dataPoints: entries.length,
    detectedAt: Date.now(),
  };
}

function detectSleepMoodCorrelation(entries: CheckInEntry[]): PatternData | null {
  if (entries.length < 5) return null;

  // Simple correlation: compare mood on days with good sleep (7-9h) vs bad sleep
  const goodSleep = entries.filter((e) => e.sleepHours >= 7 && e.sleepHours <= 9);
  const badSleep = entries.filter((e) => e.sleepHours < 6);

  if (goodSleep.length < 2 || badSleep.length < 2) return null;

  const goodMood = average(goodSleep.map((e) => e.mood));
  const badMood = average(badSleep.map((e) => e.mood));
  const diff = goodMood - badMood;

  if (Math.abs(diff) < 0.3) return null;

  return {
    id: generateId(),
    type: 'sleep_mood_correlation',
    title: 'Sleep-Mood Connection',
    description: `On days with 7-9h sleep, your mood averages ${goodMood.toFixed(1)}/5 vs ${badMood.toFixed(1)}/5 on days with less than 6h. Sleep quality directly affects your mood.`,
    trend: diff > 0 ? 'stable' : 'declining',
    dataPoints: entries.length,
    detectedAt: Date.now(),
  };
}

// ============================================
// Utility Functions
// ============================================

function computeTrend(values: number[]): Trend {
  if (values.length < 3) return 'stable';

  // Simple linear regression slope
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = average(values);

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += (i - xMean) ** 2;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;

  // Threshold for significance
  if (slope > 0.15) return 'improving';
  if (slope < -0.15) return 'declining';
  return 'stable';
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function computeVariance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = average(values);
  return values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
}
