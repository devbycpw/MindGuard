// ============================================
// MindGuard AI — Risk Score Engine
// ============================================
import {
  CheckInEntry,
  RiskScore,
  RiskFactor,
  RiskCategory,
  RiskIndication,
} from '@/types/types';
import { getTodayDate } from '@/utils/storage';

const WEIGHTS = {
  mood: 0.35,
  sleep: 0.30,
  stress: 0.35,
};

function moodToRisk(mood: number): number {
  return Math.max(0, Math.min(100, (5 - mood) * 25));
}

function sleepToRisk(hours: number): number {
  if (hours >= 7 && hours <= 9) return 0;
  if (hours >= 6 && hours < 7) return 20;
  if (hours > 9 && hours <= 10) return 15;
  if (hours >= 5 && hours < 6) return 45;
  if (hours > 10) return 40;
  if (hours >= 4 && hours < 5) return 70;
  return 100;
}

function stressToRisk(stress: number): number {
  return Math.max(0, Math.min(100, (stress - 1) * 25));
}

export function computeRiskScore(entry: CheckInEntry): RiskScore {
  const moodRisk = moodToRisk(entry.mood);
  const sleepRisk = sleepToRisk(entry.sleepHours);
  const stressRisk = stressToRisk(entry.stress);

  const rawScore =
    moodRisk * WEIGHTS.mood +
    sleepRisk * WEIGHTS.sleep +
    stressRisk * WEIGHTS.stress;

  const score = Math.round(Math.max(0, Math.min(100, rawScore)));

  const factors: RiskFactor[] = [
    {
      name: 'Mood',
      contribution: Math.round(moodRisk * WEIGHTS.mood),
      description: getMoodDescription(entry.mood),
    },
    {
      name: 'Tidur',
      contribution: Math.round(sleepRisk * WEIGHTS.sleep),
      description: getSleepDescription(entry.sleepHours),
    },
    {
      name: 'Stress',
      contribution: Math.round(stressRisk * WEIGHTS.stress),
      description: getStressDescription(entry.stress),
    },
  ];

  return {
    score,
    category: getCategory(score),
    factors,
    timestamp: Date.now(),
    date: entry.date,
  };
}

export function computeAverageRiskScore(entries: CheckInEntry[]): RiskScore | null {
  if (entries.length === 0) return null;
  const scores = entries.map((e) => computeRiskScore(e));
  const avgScore = Math.round(
    scores.reduce((sum, s) => sum + s.score, 0) / scores.length
  );
  const factorNames = ['Mood', 'Tidur', 'Stress'];
  const avgFactors: RiskFactor[] = factorNames.map((name) => {
    const contributions = scores.map(
      (s) => s.factors.find((f) => f.name === name)?.contribution ?? 0
    );
    const avg = Math.round(
      contributions.reduce((sum, c) => sum + c, 0) / contributions.length
    );
    return { name, contribution: avg, description: `Rata-rata kontribusi ${name.toLowerCase()}` };
  });
  return {
    score: avgScore,
    category: getCategory(avgScore),
    factors: avgFactors,
    timestamp: Date.now(),
    date: getTodayDate(),
  };
}

export function detectRiskIndications(entries: CheckInEntry[]): RiskIndication[] {
  const indications: RiskIndication[] = [];
  if (entries.length < 3) return indications;
  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);
  const recentN = sorted.slice(-7);

  // Burnout
  const highStressLowMoodDays = recentN.filter(
    (e) => e.stress >= 4 && e.mood <= 2
  ).length;
  if (highStressLowMoodDays >= 5) {
    indications.push({
      type: 'burnout', severity: 'high', confidence: 0.85,
      description: `Stress tinggi dengan mood rendah terdeteksi selama ${highStressLowMoodDays} dari ${recentN.length} hari terakhir. Pola ini konsisten dengan burnout.`,
      detectedAt: Date.now(),
    });
  } else if (highStressLowMoodDays >= 3) {
    indications.push({
      type: 'burnout', severity: 'moderate', confidence: 0.65,
      description: `Stress meningkat dengan mood menurun selama ${highStressLowMoodDays} hari. Tanda awal burnout.`,
      detectedAt: Date.now(),
    });
  }

  // Anxiety
  const moodDiffs: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    moodDiffs.push(Math.abs(sorted[i].mood - sorted[i - 1].mood));
  }
  const avgVolatility = moodDiffs.length > 0
    ? moodDiffs.reduce((s, d) => s + d, 0) / moodDiffs.length : 0;
  const highStressCount = recentN.filter((e) => e.stress >= 4).length;

  if (avgVolatility >= 2 && highStressCount >= 3) {
    indications.push({
      type: 'anxiety', severity: 'high', confidence: 0.75,
      description: `Perubahan mood signifikan (rata-rata: ${avgVolatility.toFixed(1)}) dan stress tinggi. Kemungkinan indikasi anxiety.`,
      detectedAt: Date.now(),
    });
  } else if (avgVolatility >= 1.5 || highStressCount >= 4) {
    indications.push({
      type: 'anxiety', severity: 'moderate', confidence: 0.55,
      description: `Fluktuasi mood atau stress persisten terdeteksi. Perlu diperhatikan.`,
      detectedAt: Date.now(),
    });
  }

  // Stress overload
  const recent5 = sorted.slice(-5);
  const stressOverloadDays = recent5.filter((e) => e.stress >= 4).length;
  if (stressOverloadDays >= 4) {
    indications.push({
      type: 'stress_overload', severity: 'high', confidence: 0.80,
      description: `Stress level tinggi (4+) selama ${stressOverloadDays} dari ${recent5.length} hari. Stress overload terdeteksi.`,
      detectedAt: Date.now(),
    });
  } else if (stressOverloadDays >= 3) {
    indications.push({
      type: 'stress_overload', severity: 'moderate', confidence: 0.60,
      description: `Stress meningkat selama ${stressOverloadDays} hari terakhir. Mendekati stress overload.`,
      detectedAt: Date.now(),
    });
  }

  return indications;
}

function getCategory(score: number): RiskCategory {
  if (score <= 35) return 'Low';
  if (score <= 65) return 'Medium';
  return 'High';
}

function getMoodDescription(mood: number): string {
  const d: Record<number, string> = {
    1: 'Mood sangat rendah',
    2: 'Mood kurang baik',
    3: 'Mood netral',
    4: 'Mood baik',
    5: 'Mood sangat baik',
  };
  return d[mood] ?? '';
}

function getSleepDescription(hours: number): string {
  if (hours < 4) return `Hanya ${hours} jam tidur — sangat kurang`;
  if (hours < 6) return `${hours} jam tidur — di bawah rekomendasi`;
  if (hours < 7) return `${hours} jam tidur — sedikit kurang`;
  if (hours <= 9) return `${hours} jam tidur — ideal`;
  return `${hours} jam tidur — berlebihan`;
}

function getStressDescription(stress: number): string {
  const d: Record<number, string> = {
    1: 'Stress minimal',
    2: 'Stress rendah',
    3: 'Stress sedang',
    4: 'Stress tinggi',
    5: 'Stress sangat tinggi',
  };
  return d[stress] ?? '';
}
