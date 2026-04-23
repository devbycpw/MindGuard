// ============================================
// MindGuard AI — Micro-Intervention System
// ============================================
// Recommends interventions based on current state and patterns

import {
  CheckInEntry,
  RiskScore,
  RiskIndication,
  Intervention,
  InterventionType,
} from '@/types/types';
import { generateId } from '@/utils/storage';

// ============================================
// Intervention Database
// ============================================

const INTERVENTIONS: Omit<Intervention, 'id' | 'priority'>[] = [
  // Breathing exercises
  {
    type: 'breathing',
    title: 'Box Breathing',
    description: 'Inhale 4 sec → Hold 4 sec → Exhale 4 sec → Hold 4 sec. Repeat 4 times.',
    duration: '2 min',
    steps: [
      'Find a comfortable position',
      'Breathe in slowly for 4 seconds',
      'Hold your breath for 4 seconds',
      'Exhale slowly for 4 seconds',
      'Hold for 4 seconds',
      'Repeat 4 times',
    ],
  },
  {
    type: 'breathing',
    title: '4-7-8 Breathing',
    description: 'Inhale 4 sec → Hold 7 sec → Exhale 8 sec. Calms the nervous system.',
    duration: '3 min',
    steps: [
      'Sit or lie down comfortably',
      'Breathe in through your nose for 4 seconds',
      'Hold your breath for 7 seconds',
      'Exhale through your mouth for 8 seconds',
      'Repeat 3-4 times',
    ],
  },
  // Movement
  {
    type: 'movement',
    title: 'Quick Stretch Break',
    description: 'Simple stretches to release physical tension and boost energy.',
    duration: '3 min',
    steps: [
      'Stand up and reach your arms overhead',
      'Roll your shoulders forward and backward 5 times',
      'Gently tilt your head side to side',
      'Touch your toes (or reach as far as comfortable)',
      'Do 5 gentle squats',
      'Shake out your hands and feet',
    ],
  },
  {
    type: 'movement',
    title: 'Mindful Walk',
    description: 'Take a short walk, focusing on each step and your surroundings.',
    duration: '5 min',
    steps: [
      'Step outside or walk around your space',
      'Walk slowly and deliberately',
      'Notice 5 things you can see',
      'Notice 3 things you can hear',
      'Feel the ground beneath your feet',
      'Return feeling refreshed',
    ],
  },
  // Sleep hygiene
  {
    type: 'sleep_hygiene',
    title: 'Sleep Preparation Ritual',
    description: 'Wind down routine to improve sleep quality.',
    duration: '10 min',
    steps: [
      'Put away screens 30 min before bed',
      'Dim the lights in your room',
      'Do 5 minutes of gentle stretching',
      'Write down 3 things from today you\'re grateful for',
      'Practice 4-7-8 breathing in bed',
    ],
  },
  {
    type: 'sleep_hygiene',
    title: 'Power Nap Guide',
    description: 'A quick 15-20 minute nap to restore energy.',
    duration: '20 min',
    steps: [
      'Find a quiet, comfortable spot',
      'Set a timer for 15-20 minutes',
      'Close your eyes and relax your body',
      'Don\'t worry about falling asleep — just rest',
      'Get up when the timer goes off',
    ],
  },
  // Grounding
  {
    type: 'grounding',
    title: '5-4-3-2-1 Grounding',
    description: 'Use your senses to ground yourself in the present moment.',
    duration: '3 min',
    steps: [
      'Notice 5 things you can SEE',
      'Touch 4 things you can FEEL',
      'Listen for 3 things you can HEAR',
      'Identify 2 things you can SMELL',
      'Notice 1 thing you can TASTE',
    ],
  },
  {
    type: 'grounding',
    title: 'Body Scan',
    description: 'Mentally scan your body to release tension.',
    duration: '5 min',
    steps: [
      'Close your eyes and take 3 deep breaths',
      'Focus attention on the top of your head',
      'Slowly move attention down: forehead, jaw, neck',
      'Continue: shoulders, arms, hands',
      'Then: chest, stomach, hips',
      'Finally: legs, feet, toes',
      'Release any tension you notice',
    ],
  },
  // Journaling
  {
    type: 'journaling',
    title: 'Emotional Check-In Journal',
    description: 'Write about your current emotions to process them.',
    duration: '5 min',
    steps: [
      'Write: "Right now, I feel..."',
      'Describe what triggered this feeling',
      'Write: "What I need right now is..."',
      'Write one thing you can do about it',
    ],
  },
  {
    type: 'journaling',
    title: 'Gratitude List',
    description: 'Write 3 things you\'re grateful for today.',
    duration: '3 min',
    steps: [
      'Think about your day so far',
      'Write 3 specific things you\'re grateful for',
      'For each, write WHY you\'re grateful',
      'Read them back to yourself',
    ],
  },
  // Social connection
  {
    type: 'social_connection',
    title: 'Reach Out',
    description: 'Send a message to someone you care about.',
    duration: '2 min',
    steps: [
      'Think of a friend or family member',
      'Send them a simple message',
      'Ask how they\'re doing',
      'Connection reduces isolation',
    ],
  },
  // Rest
  {
    type: 'rest',
    title: 'Digital Detox Break',
    description: 'Step away from all screens for a few minutes.',
    duration: '5 min',
    steps: [
      'Put your phone face down',
      'Close your laptop',
      'Look out a window or at nature',
      'Let your mind wander freely',
      'Return to your device when ready',
    ],
  },
];

// ============================================
// Recommendation Logic
// ============================================

/**
 * Get recommended interventions based on current state
 */
export function getRecommendedInterventions(
  latestCheckIn: CheckInEntry | null,
  riskScore: RiskScore | null,
  riskIndications: RiskIndication[]
): Intervention[] {
  const recommended: Intervention[] = [];
  const usedTypes = new Set<InterventionType>();

  if (!latestCheckIn) {
    // Default: suggest a breathing exercise and grounding
    return getInterventionsByType('breathing', 'medium', 1)
      .concat(getInterventionsByType('grounding', 'low', 1));
  }

  // High stress → breathing exercises
  if (latestCheckIn.stress >= 4) {
    recommended.push(...getInterventionsByType('breathing', 'high', 1));
    usedTypes.add('breathing');
  }

  // Poor sleep → sleep hygiene
  if (latestCheckIn.sleepHours < 6) {
    recommended.push(...getInterventionsByType('sleep_hygiene', 'high', 1));
    usedTypes.add('sleep_hygiene');
  }

  // Low mood → journaling + social
  if (latestCheckIn.mood <= 2) {
    recommended.push(...getInterventionsByType('journaling', 'high', 1));
    recommended.push(...getInterventionsByType('social_connection', 'medium', 1));
    usedTypes.add('journaling');
    usedTypes.add('social_connection');
  }

  // Sedentary activity → movement
  if (['work', 'study', 'rest'].includes(latestCheckIn.activity)) {
    recommended.push(...getInterventionsByType('movement', 'medium', 1));
    usedTypes.add('movement');
  }

  // Risk indications
  for (const indication of riskIndications) {
    if (indication.type === 'anxiety' && !usedTypes.has('grounding')) {
      recommended.push(...getInterventionsByType('grounding', 'high', 1));
      usedTypes.add('grounding');
    }
    if (indication.type === 'burnout' && !usedTypes.has('rest')) {
      recommended.push(...getInterventionsByType('rest', 'high', 1));
      usedTypes.add('rest');
    }
    if (indication.type === 'stress_overload' && !usedTypes.has('breathing')) {
      recommended.push(...getInterventionsByType('breathing', 'high', 1));
      usedTypes.add('breathing');
    }
  }

  // If nothing specific, give general recommendations
  if (recommended.length === 0) {
    recommended.push(...getInterventionsByType('breathing', 'low', 1));
    recommended.push(...getInterventionsByType('movement', 'low', 1));
  }

  // Limit to 4 recommendations
  return recommended.slice(0, 4);
}

function getInterventionsByType(
  type: InterventionType,
  priority: 'low' | 'medium' | 'high',
  count: number
): Intervention[] {
  const matching = INTERVENTIONS.filter((i) => i.type === type);
  // Pick random ones
  const shuffled = [...matching].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((i) => ({
    ...i,
    id: generateId(),
    priority,
  }));
}

/**
 * Get all available intervention types
 */
export function getAllInterventions(): Intervention[] {
  return INTERVENTIONS.map((i) => ({
    ...i,
    id: generateId(),
    priority: 'low' as const,
  }));
}
