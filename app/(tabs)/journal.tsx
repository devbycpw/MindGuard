// ============================================
// MindGuard AI — Journal Screen (Curhat)
// ============================================
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserData } from '@/context/UserDataContext';
import { generateId, getTodayDate, formatTime, formatDate } from '@/utils/storage';
import { MoodLevel, JournalEntry } from '@/types/types';
import { COLORS, SHADOWS, SPACING, RADIUS, FONT_SIZE, MOOD_CONFIG } from '@/constants/theme';

export default function JournalScreen() {
  const { journalEntries, addJournalEntry } = useUserData();
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);
  const [isWriting, setIsWriting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Oops', 'Tulis sesuatu dulu sebelum menyimpan.');
      return;
    }

    const entry: JournalEntry = {
      id: generateId(),
      timestamp: Date.now(),
      date: getTodayDate(),
      content: content.trim(),
      mood: selectedMood ?? undefined,
    };

    await addJournalEntry(entry);
    setContent('');
    setSelectedMood(null);
    setIsWriting(false);
    Alert.alert('📖 Tersimpan!', 'Jurnal kamu sudah disimpan.');
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
        <LinearGradient colors={['#2E5A8F', '#7C5CFC']} style={styles.header}>
          <Text style={styles.headerTitle}>Journal</Text>
          <Text style={styles.headerSub}>Tempat cerita & curhatmu 💭</Text>
        </LinearGradient>

        {/* Write Button / Input */}
        {!isWriting ? (
          <TouchableOpacity
            style={styles.writeBtn}
            onPress={() => setIsWriting(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[...COLORS.gradientPurple]}
              style={styles.writeBtnGradient}
            >
              <Text style={styles.writeBtnIcon}>✏️</Text>
              <Text style={styles.writeBtnText}>Tulis Sesuatu...</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.writeCard}>
            <Text style={styles.writeTitle}>📝 Apa yang ada di pikiranmu?</Text>

            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={8}
              placeholder="Ceritakan apa saja... perasaan, kekhawatiran, rasa syukur, atau curhat. Semua aman di sini. 💙"
              placeholderTextColor={COLORS.textTertiary}
              value={content}
              onChangeText={setContent}
              textAlignVertical="top"
              autoFocus
            />

            {/* Optional Mood Tag */}
            <Text style={styles.moodTagLabel}>Tandai mood (opsional):</Text>
            <View style={styles.moodTagRow}>
              {([1, 2, 3, 4, 5] as MoodLevel[]).map((val) => {
                const config = MOOD_CONFIG[val];
                const isSelected = selectedMood === val;
                return (
                  <TouchableOpacity
                    key={val}
                    style={[
                      styles.moodTag,
                      isSelected && { backgroundColor: config.color + '20', borderColor: config.color },
                    ]}
                    onPress={() => setSelectedMood(isSelected ? null : val)}
                  >
                    <Text style={styles.moodTagEmoji}>{config.emoji}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Actions */}
            <View style={styles.writeActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setIsWriting(false); setContent(''); setSelectedMood(null); }}
              >
                <Text style={styles.cancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} activeOpacity={0.8}>
                <LinearGradient colors={[...COLORS.gradientMixed]} style={styles.saveBtnGradient}>
                  <Text style={styles.saveText}>Simpan 📖</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Journal Entries */}
        <View style={styles.entriesSection}>
          <Text style={styles.entriesTitle}>
            📚 Jurnal Kamu ({journalEntries.length})
          </Text>

          {journalEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📖</Text>
              <Text style={styles.emptyTitle}>Belum ada catatan</Text>
              <Text style={styles.emptyDesc}>
                Mulai tulis jurnal pertamamu. Menulis dapat membantu memproses emosi dan pikiran.
              </Text>
            </View>
          ) : (
            journalEntries.map((entry, i) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryDateRow}>
                    <Text style={styles.entryDate}>{formatDate(entry.timestamp)}</Text>
                    <Text style={styles.entryTime}>{formatTime(entry.timestamp)}</Text>
                  </View>
                  {entry.mood && (
                    <Text style={styles.entryMood}>
                      {MOOD_CONFIG[entry.mood].emoji}
                    </Text>
                  )}
                </View>
                <Text style={styles.entryContent}>{entry.content}</Text>
              </View>
            ))
          )}
        </View>

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

  // Write Button
  writeBtn: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.purple,
  },
  writeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    gap: 8,
  },
  writeBtnIcon: { fontSize: 22 },
  writeBtnText: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: '#fff' },

  // Write Card
  writeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    ...SHADOWS.md,
  },
  writeTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    minHeight: 180,
    backgroundColor: COLORS.background,
    lineHeight: 24,
  },
  moodTagLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  moodTagRow: { flexDirection: 'row', gap: 8 },
  moodTag: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodTagEmoji: { fontSize: 22 },
  writeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.xl,
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, fontWeight: '600' },
  saveBtn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  saveBtnGradient: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
  },
  saveText: { fontSize: FONT_SIZE.md, color: '#fff', fontWeight: '700' },

  // Entries
  entriesSection: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xxl,
  },
  entriesTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    ...SHADOWS.sm,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textPrimary },
  emptyDesc: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: SPACING.xxl,
    lineHeight: 20,
  },

  // Entry card
  entryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  entryDateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  entryDate: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.textTertiary },
  entryTime: { fontSize: FONT_SIZE.xs, color: COLORS.textTertiary },
  entryMood: { fontSize: 22 },
  entryContent: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
});
