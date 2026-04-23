// ============================================
// MindGuard AI — Daily Check-In Screen
// ============================================
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserData } from '@/context/UserDataContext';
import { useAIEngine } from '@/context/AIEngineContext';
import { generateId, getTodayDate } from '@/utils/storage';
import { MoodLevel, StressLevel, CheckInEntry } from '@/types/types';
import { COLORS, SHADOWS, SPACING, RADIUS, FONT_SIZE, MOOD_CONFIG } from '@/constants/theme';

const STRESS_OPTIONS: { value: StressLevel; label: string; emoji: string; color: string }[] = [
  { value: 1, label: 'Minimal', emoji: '😌', color: COLORS.success },
  { value: 2, label: 'Rendah', emoji: '🙂', color: COLORS.successLight },
  { value: 3, label: 'Sedang', emoji: '😐', color: COLORS.warning },
  { value: 4, label: 'Tinggi', emoji: '😰', color: COLORS.warningLight },
  { value: 5, label: 'Sangat Tinggi', emoji: '🤯', color: COLORS.danger },
];

const SLEEP_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function CheckInScreen() {
  const { addCheckIn, checkIns, profile, todayCheckIns } = useUserData();
  const { runFullAnalysis } = useAIEngine();

  const [mood, setMood] = useState<MoodLevel>(3);
  const [stress, setStress] = useState<StressLevel>(3);
  const [sleepHours, setSleepHours] = useState<number>(7);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const entry: CheckInEntry = {
        id: generateId(),
        timestamp: Date.now(),
        date: getTodayDate(),
        mood,
        sleepHours,
        stress,
        notes,
      };

      await addCheckIn(entry);
      const updated = [entry, ...checkIns];
      await runFullAnalysis(updated, [], profile.openaiApiKey || undefined);

      // Reset form
      setMood(3);
      setStress(3);
      setSleepHours(7);
      setNotes('');

      Alert.alert(
        '✅ Check-In Berhasil!',
        'Data telah disimpan. Cek Dashboard untuk insight terbaru.',
      );
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan check-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient colors={[...COLORS.gradientMixed]} style={styles.header}>
          <Text style={styles.headerTitle}>Daily Check-In</Text>
          <Text style={styles.headerSub}>Bagaimana keadaanmu hari ini?</Text>
          {todayCheckIns.length > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>
                Sudah {todayCheckIns.length}x check-in hari ini
              </Text>
            </View>
          )}
        </LinearGradient>

        {/* ═══ MOOD ═══ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>😊 Mood Hari Ini</Text>
          <Text style={styles.sectionDesc}>Bagaimana perasaanmu sekarang?</Text>
          <View style={styles.moodRow}>
            {([1, 2, 3, 4, 5] as MoodLevel[]).map((val) => {
              const config = MOOD_CONFIG[val];
              const isSelected = mood === val;
              return (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.moodBtn,
                    isSelected && { backgroundColor: config.color + '20', borderColor: config.color },
                  ]}
                  onPress={() => setMood(val)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.moodEmoji, isSelected && styles.moodEmojiSelected]}>
                    {config.emoji}
                  </Text>
                  <Text style={[
                    styles.moodLabel,
                    isSelected && { color: config.color, fontWeight: '700' },
                  ]}>
                    {config.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ═══ STRESS ═══ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧠 Beban Mental / Stress Level</Text>
          <Text style={styles.sectionDesc}>Seberapa besar tekanan yang kamu rasakan?</Text>
          <View style={styles.stressRow}>
            {STRESS_OPTIONS.map((opt) => {
              const isSelected = stress === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.stressBtn,
                    isSelected && { backgroundColor: opt.color + '20', borderColor: opt.color },
                  ]}
                  onPress={() => setStress(opt.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stressEmoji}>{opt.emoji}</Text>
                  <Text style={[
                    styles.stressValue,
                    isSelected && { color: opt.color, fontWeight: '800' },
                  ]}>
                    {opt.value}
                  </Text>
                  <Text style={[
                    styles.stressLabel,
                    isSelected && { color: opt.color },
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ═══ SLEEP ═══ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>😴 Kualitas Istirahat</Text>
          <Text style={styles.sectionDesc}>Berapa jam tidur semalam?</Text>
          <View style={styles.sleepRow}>
            {SLEEP_OPTIONS.map((h) => {
              const isSelected = sleepHours === h;
              const isOptimal = h >= 7 && h <= 9;
              return (
                <TouchableOpacity
                  key={h}
                  style={[
                    styles.sleepBtn,
                    isSelected && styles.sleepBtnSelected,
                    isOptimal && !isSelected && styles.sleepBtnOptimal,
                  ]}
                  onPress={() => setSleepHours(h)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.sleepText,
                    isSelected && styles.sleepTextSelected,
                  ]}>
                    {h}h
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.sleepHint}>💡 Rekomendasi: 7-9 jam untuk kesehatan mental optimal</Text>
        </View>

        {/* ═══ NOTES ═══ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Catatan Hari Ini</Text>
          <Text style={styles.sectionDesc}>Ceritakan apa saja yang terjadi (opsional)</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={5}
            placeholder="Tulis di sini... perasaan, kejadian, atau apa pun yang ingin kamu catat."
            placeholderTextColor={COLORS.textTertiary}
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
        </View>

        {/* ═══ SUBMIT ═══ */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[...COLORS.gradientMixed]}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.submitText}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Check-In ✅'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.submitHint}>
          Kamu bisa mengisi check-in lebih dari 1 kali per hari
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 20 },

  // Header
  header: {
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: SPACING.xl,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
  },
  headerTitle: { fontSize: FONT_SIZE.xxl, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: FONT_SIZE.md, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  headerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  headerBadgeText: { color: '#fff', fontSize: FONT_SIZE.xs, fontWeight: '600' },

  // Section
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    ...SHADOWS.sm,
  },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textPrimary },
  sectionDesc: { fontSize: FONT_SIZE.sm, color: COLORS.textTertiary, marginTop: 4, marginBottom: SPACING.lg },

  // Mood
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  moodEmoji: { fontSize: 28 },
  moodEmojiSelected: { fontSize: 32 },
  moodLabel: { fontSize: 10, color: COLORS.textTertiary, marginTop: 4, textAlign: 'center' },

  // Stress
  stressRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  stressBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  stressEmoji: { fontSize: 22 },
  stressValue: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.textSecondary, marginTop: 2 },
  stressLabel: { fontSize: 9, color: COLORS.textTertiary, marginTop: 2, textAlign: 'center' },

  // Sleep
  sleepRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sleepBtn: {
    width: 54,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  sleepBtnSelected: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.secondarySoft,
  },
  sleepBtnOptimal: {
    borderColor: COLORS.successSoft,
    backgroundColor: COLORS.successSoft,
  },
  sleepText: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.textSecondary },
  sleepTextSelected: { color: COLORS.secondary, fontWeight: '800' },
  sleepHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },

  // Notes
  notesInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    minHeight: 120,
    backgroundColor: COLORS.background,
    lineHeight: 22,
  },

  // Submit
  submitBtn: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xxl,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.purple,
  },
  submitGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontSize: FONT_SIZE.lg, fontWeight: '800' },
  submitHint: {
    textAlign: 'center',
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginTop: SPACING.md,
    marginHorizontal: SPACING.lg,
  },
});
