// ============================================
// MindGuard AI — AI Engine Context
// ============================================
// Manages AI computation results

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import {
  CheckInEntry,
  EmotionalLog,
  RiskScore,
  RiskIndication,
  PatternData,
  PredictionResult,
  WhatIfScenario,
  Intervention,
  AIInsight,
} from '@/types/types';
import { computeRiskScore, computeAverageRiskScore, detectRiskIndications } from '@/engine/riskEngine';
import { detectPatterns } from '@/engine/patternDetector';
import { predictFuture, generateWhatIfScenarios } from '@/engine/predictiveEngine';
import { getRecommendedInterventions } from '@/engine/interventions';
import { generateOpenAIInsight, generateRuleBasedInsight } from '@/engine/aiInsight';

interface AIEngineContextType {
  // Computed results
  currentRiskScore: RiskScore | null;
  averageRiskScore: RiskScore | null;
  riskIndications: RiskIndication[];
  patterns: PatternData[];
  prediction: PredictionResult | null;
  whatIfScenarios: WhatIfScenario[];
  interventions: Intervention[];
  latestInsight: AIInsight | null;

  // Actions
  runFullAnalysis: (
    checkIns: CheckInEntry[],
    emotionalLogs: EmotionalLog[],
    apiKey?: string
  ) => Promise<AIInsight>;
  isAnalyzing: boolean;
}

const AIEngineContext = createContext<AIEngineContextType | null>(null);

export function AIEngineProvider({ children }: { children: ReactNode }) {
  const [currentRiskScore, setCurrentRiskScore] = useState<RiskScore | null>(null);
  const [averageRiskScore, setAverageRiskScore] = useState<RiskScore | null>(null);
  const [riskIndications, setRiskIndications] = useState<RiskIndication[]>([]);
  const [patterns, setPatterns] = useState<PatternData[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [whatIfScenarios, setWhatIfScenarios] = useState<WhatIfScenario[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [latestInsight, setLatestInsight] = useState<AIInsight | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runFullAnalysis = useCallback(
    async (
      checkIns: CheckInEntry[],
      emotionalLogs: EmotionalLog[],
      apiKey?: string
    ): Promise<AIInsight> => {
      setIsAnalyzing(true);

      try {
        // Sort by timestamp
        const sorted = [...checkIns].sort((a, b) => b.timestamp - a.timestamp);

        // 1. Current risk score (latest entry)
        let riskScore: RiskScore | null = null;
        if (sorted.length > 0) {
          riskScore = computeRiskScore(sorted[0]);
          setCurrentRiskScore(riskScore);
        }

        // 2. Average risk score (last 7 days)
        const recent7 = sorted.slice(0, 7);
        const avgScore = computeAverageRiskScore(recent7);
        setAverageRiskScore(avgScore);

        // 3. Risk indications
        const indications = detectRiskIndications(sorted);
        setRiskIndications(indications);

        // 4. Pattern detection
        const detectedPatterns = detectPatterns(sorted, emotionalLogs);
        setPatterns(detectedPatterns);

        // 5. Predictive simulation
        const pred = predictFuture(sorted, 7);
        setPrediction(pred);

        // 6. What-if scenarios
        const scenarios = generateWhatIfScenarios(sorted);
        setWhatIfScenarios(scenarios);

        // 7. Interventions
        const latestCheckIn = sorted.length > 0 ? sorted[0] : null;
        const interventionRecs = getRecommendedInterventions(
          latestCheckIn,
          riskScore,
          indications
        );
        setInterventions(interventionRecs);

        // 8. AI Insight
        let insight: AIInsight;
        if (apiKey) {
          insight = await generateOpenAIInsight(
            apiKey,
            sorted,
            riskScore,
            detectedPatterns
          );
        } else {
          insight = generateRuleBasedInsight(
            sorted,
            riskScore,
            detectedPatterns
          );
        }
        setLatestInsight(insight);

        return insight;
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  return (
    <AIEngineContext.Provider
      value={{
        currentRiskScore,
        averageRiskScore,
        riskIndications,
        patterns,
        prediction,
        whatIfScenarios,
        interventions,
        latestInsight,
        runFullAnalysis,
        isAnalyzing,
      }}
    >
      {children}
    </AIEngineContext.Provider>
  );
}

export function useAIEngine(): AIEngineContextType {
  const context = useContext(AIEngineContext);
  if (!context) {
    throw new Error('useAIEngine must be used within AIEngineProvider');
  }
  return context;
}
