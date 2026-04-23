// ============================================
// MindGuard AI — Activity Screen (Breathing)
// ============================================
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Easing, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, SPACING, RADIUS, FONT_SIZE } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CIRCLE_SIZE = SCREEN_WIDTH * 0.55;

interface BreathPattern {
  name: string;
  description: string;
  phases: { label: string; duration: number; scale: number }[];
}

const PATTERNS: BreathPattern[] = [
  {
    name: 'Box Breathing',
    description: 'Teknik pernapasan 4-4-4-4 untuk menenangkan pikiran',
    phases: [
      { label: 'Tarik Napas', duration: 4000, scale: 1 },
      { label: 'Tahan', duration: 4000, scale: 1 },
      { label: 'Hembuskan', duration: 4000, scale: 0.5 },
      { label: 'Tahan', duration: 4000, scale: 0.5 },
    ],
  },
  {
    name: '4-7-8 Breathing',
    description: 'Teknik pernapasan untuk mengurangi anxiety',
    phases: [
      { label: 'Tarik Napas', duration: 4000, scale: 1 },
      { label: 'Tahan', duration: 7000, scale: 1 },
      { label: 'Hembuskan', duration: 8000, scale: 0.5 },
    ],
  },
  {
    name: 'Calm Breathing',
    description: 'Pernapasan sederhana untuk relaksasi cepat',
    phases: [
      { label: 'Tarik Napas', duration: 5000, scale: 1 },
      { label: 'Hembuskan', duration: 5000, scale: 0.5 },
    ],
  },
];

export default function ActivityScreen() {
  const [selectedPattern, setSelectedPattern] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [phaseLabel, setPhaseLabel] = useState('Siap?');
  const [countdown, setCountdown] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [cycles, setCycles] = useState(0);

  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;
  const phaseRef = useRef(0);
  const runningRef = useRef(false);
  const timerRef = useRef<any>(null);
  const totalTimerRef = useRef<any>(null);

  const pattern = PATTERNS[selectedPattern];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    };
  }, []);

  const startBreathing = () => {
    setIsRunning(true);
    runningRef.current = true;
    phaseRef.current = 0;
    setCycles(0);
    setTotalTime(0);
    runPhase(0);

    totalTimerRef.current = setInterval(() => {
      setTotalTime(prev => prev + 1);
    }, 1000);
  };

  const stopBreathing = () => {
    setIsRunning(false);
    runningRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    scaleAnim.setValue(0.5);
    opacityAnim.setValue(0.3);
    setPhaseLabel('Selesai! 🎉');
    setCountdown(0);
  };

  const runPhase = (phaseIndex: number) => {
    if (!runningRef.current) return;

    const phases = PATTERNS[selectedPattern].phases;
    const actualIndex = phaseIndex % phases.length;
    const phase = phases[actualIndex];

    if (actualIndex === 0 && phaseIndex > 0) {
      setCycles(prev => prev + 1);
    }

    setCurrentPhase(actualIndex);
    setPhaseLabel(phase.label);
    setCountdown(Math.ceil(phase.duration / 1000));

    // Animate circle
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: phase.scale,
        duration: phase.duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: phase.scale > 0.7 ? 0.6 : 0.3,
        duration: phase.duration,
        useNativeDriver: true,
      }),
    ]).start();

    // Countdown timer
    let remaining = Math.ceil(phase.duration / 1000);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      remaining--;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        if (runningRef.current) {
          runPhase(phaseIndex + 1);
        }
      }
    }, 1000);
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[...COLORS.gradientMixed]} style={styles.header}>
        <Text style={styles.headerTitle}>Breathing Exercise</Text>
        <Text style={styles.headerSub}>Latihan pernapasan untuk ketenangan</Text>
      </LinearGradient>

      {/* Pattern Selector */}
      <View style={styles.patternSelector}>
        {PATTERNS.map((p, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.patternBtn, selectedPattern === i && styles.patternBtnActive]}
            onPress={() => {
              if (!isRunning) setSelectedPattern(i);
            }}
            disabled={isRunning}
            activeOpacity={0.7}
          >
            <Text style={[styles.patternName, selectedPattern === i && styles.patternNameActive]}>
              {p.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.patternDesc}>{pattern.description}</Text>

      {/* Breathing Circle */}
      <View style={styles.circleContainer}>
        {/* Outer rings */}
        <Animated.View style={[
          styles.outerRing,
          { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
        ]}>
          <LinearGradient
            colors={[COLORS.secondary + '30', COLORS.secondary + '05']}
            style={styles.outerRingGradient}
          />
        </Animated.View>

        {/* Main circle */}
        <Animated.View style={[
          styles.mainCircle,
          { transform: [{ scale: scaleAnim }] },
        ]}>
          <LinearGradient colors={[...COLORS.gradientPurple]} style={styles.circleGradient}>
            <Text style={styles.phaseLabel}>{phaseLabel}</Text>
            {isRunning && countdown > 0 && (
              <Text style={styles.countdownText}>{countdown}</Text>
            )}
          </LinearGradient>
        </Animated.View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatTime(totalTime)}</Text>
          <Text style={styles.statLabel}>Waktu</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{cycles}</Text>
          <Text style={styles.statLabel}>Siklus</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{pattern.phases.length}</Text>
          <Text style={styles.statLabel}>Fase</Text>
        </View>
      </View>

      {/* Control Button */}
      <TouchableOpacity
        style={styles.controlBtn}
        onPress={isRunning ? stopBreathing : startBreathing}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={isRunning ? [COLORS.danger, COLORS.dangerLight] : [...COLORS.gradientMixed]}
          style={styles.controlGradient}
        >
          <Text style={styles.controlText}>
            {isRunning ? '⏹ Berhenti' : '▶ Mulai'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Phase indicators */}
      {isRunning && (
        <View style={styles.phaseIndicator}>
          {pattern.phases.map((p, i) => (
            <View
              key={i}
              style={[
                styles.phaseDot,
                currentPhase === i && styles.phaseDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center' },

  // Header
  header: {
    width: '100%',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: SPACING.xl,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
  },
  headerTitle: { fontSize: FONT_SIZE.xxl, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: FONT_SIZE.md, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

  // Pattern Selector
  patternSelector: {
    flexDirection: 'row',
    marginTop: SPACING.xl,
    marginHorizontal: SPACING.lg,
    gap: 8,
  },
  patternBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  patternBtnActive: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.secondarySoft,
  },
  patternName: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.textSecondary },
  patternNameActive: { color: COLORS.secondary },
  patternDesc: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.xxl,
  },

  // Circle
  circleContainer: {
    width: CIRCLE_SIZE + 60,
    height: CIRCLE_SIZE + 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  outerRing: {
    position: 'absolute',
    width: CIRCLE_SIZE + 50,
    height: CIRCLE_SIZE + 50,
    borderRadius: (CIRCLE_SIZE + 50) / 2,
    overflow: 'hidden',
  },
  outerRingGradient: {
    width: '100%',
    height: '100%',
    borderRadius: (CIRCLE_SIZE + 50) / 2,
  },
  mainCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    overflow: 'hidden',
    ...SHADOWS.purple,
  },
  circleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: CIRCLE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseLabel: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: '#fff' },
  countdownText: { fontSize: FONT_SIZE.display, fontWeight: '900', color: '#fff', marginTop: 4 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xxl,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginHorizontal: SPACING.xxxl,
    ...SHADOWS.sm,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textTertiary, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: COLORS.border },

  // Control
  controlBtn: {
    marginTop: SPACING.xxl,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.purple,
  },
  controlGradient: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxxl * 2,
    alignItems: 'center',
  },
  controlText: { fontSize: FONT_SIZE.lg, fontWeight: '800', color: '#fff' },

  // Phase dots
  phaseIndicator: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    gap: 8,
  },
  phaseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.border,
  },
  phaseDotActive: {
    backgroundColor: COLORS.secondary,
    width: 24,
    borderRadius: 5,
  },
});
