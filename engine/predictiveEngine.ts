// ============================================
// MindGuard AI — Predictive Engine
// ============================================
// Forward prediction using rolling averages and trend extrapolation

import {
  CheckInEntry,
  PredictionResult,
  WhatIfScenario,
} from '@/types/types';
import { computeRiskScore } from './riskEngine';

/**
 * Predict risk scores for the next N days using trend extrapolation
 */
export function predictFuture(
  entries: CheckInEntry[],
  daysAhead: number = 7
): PredictionResult {
  if (entries.length < 3) {
    return {
      predictedScores: [],
      outlook: 'neutral',
      confidence: 0,
      description: 'Not enough data for prediction. Log at least 3 days.',
    };
  }

  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);
  const scores = sorted.map((e) => computeRiskScore(e).score);

  // Compute trend using linear regression
  const { slope, intercept } = linearRegression(scores);

  // Compute rolling average for smoothing
  const windowSize = Math.min(3, scores.length);
  const lastAvg = average(scores.slice(-windowSize));

  // Generate predictions
  const predictedScores: { date: string; score: number }[] = [];
  const today = new Date();

  for (let i = 1; i <= daysAhead; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + i);
    const dateStr = futureDate.toISOString().split('T')[0];

    // Blend trend extrapolation with rolling average
    const trendValue = intercept + slope * (scores.length + i - 1);
    const blended = lastAvg * 0.6 + trendValue * 0.4;
    const clamped = Math.round(Math.max(0, Math.min(100, blended)));

    predictedScores.push({ date: dateStr, score: clamped });
  }

  // Determine outlook
  const avgPredicted = average(predictedScores.map((p) => p.score));
  const lastActualScore = scores[scores.length - 1];

  let outlook: 'positive' | 'neutral' | 'negative';
  if (avgPredicted < lastActualScore - 5) {
    outlook = 'positive'; // Risk going down is positive
  } else if (avgPredicted > lastActualScore + 5) {
    outlook = 'negative'; // Risk going up is negative
  } else {
    outlook = 'neutral';
  }

  // Confidence based on data availability and consistency
  const confidence = Math.min(0.9, 0.3 + entries.length * 0.05);

  let description: string;
  if (outlook === 'positive') {
    description = `Based on your recent trends, your mental health risk is predicted to decrease. Keep up your positive habits!`;
  } else if (outlook === 'negative') {
    description = `Your risk score may increase in the coming days. Consider proactive self-care and stress management.`;
  } else {
    description = `Your mental health indicators are expected to remain stable. Continue monitoring and maintaining your routines.`;
  }

  return {
    predictedScores,
    outlook,
    confidence,
    description,
  };
}

/**
 * Generate what-if scenarios
 */
export function generateWhatIfScenarios(
  entries: CheckInEntry[]
): WhatIfScenario[] {
  if (entries.length < 3) return [];

  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);
  const latestEntry = sorted[sorted.length - 1];
  const currentScore = computeRiskScore(latestEntry).score;
  const scenarios: WhatIfScenario[] = [];

  // Scenario 1: Better sleep
  if (latestEntry.sleepHours < 7) {
    const improved = { ...latestEntry, sleepHours: 8 };
    const newScore = computeRiskScore(improved).score;
    scenarios.push({
      scenario: 'If you sleep 8 hours tonight',
      currentScore,
      predictedScore: newScore,
      improvement: currentScore - newScore,
      description: `Improving your sleep to 8 hours could reduce your risk score by ${currentScore - newScore} points.`,
    });
  }

  // Scenario 2: Exercise
  if (latestEntry.activity !== 'exercise') {
    const improved = { ...latestEntry, activity: 'exercise' as const };
    const newScore = computeRiskScore(improved).score;
    scenarios.push({
      scenario: 'If you exercise today',
      currentScore,
      predictedScore: newScore,
      improvement: currentScore - newScore,
      description: `Adding exercise could reduce your risk score by ${currentScore - newScore} points.`,
    });
  }

  // Scenario 3: Lower stress (if high)
  if (latestEntry.stress >= 4) {
    const improved = { ...latestEntry, stress: 2 as const };
    const newScore = computeRiskScore(improved).score;
    scenarios.push({
      scenario: 'If stress reduces to manageable levels',
      currentScore,
      predictedScore: newScore,
      improvement: currentScore - newScore,
      description: `Reducing stress through relaxation techniques could lower your risk by ${currentScore - newScore} points.`,
    });
  }

  // Scenario 4: Improved mood
  if (latestEntry.mood <= 3) {
    const improved = { ...latestEntry, mood: 4 as const };
    const newScore = computeRiskScore(improved).score;
    scenarios.push({
      scenario: 'If mood improves through positive activities',
      currentScore,
      predictedScore: newScore,
      improvement: currentScore - newScore,
      description: `Engaging in mood-boosting activities could lower risk by ${currentScore - newScore} points.`,
    });
  }

  return scenarios;
}

// ============================================
// Utility Functions
// ============================================

function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] ?? 0 };

  const xMean = (n - 1) / 2;
  const yMean = average(values);

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += (i - xMean) ** 2;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;

  return { slope, intercept };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}
