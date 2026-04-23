// ============================================
// MindGuard AI — Journey / Analytics Screen
// ============================================
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Dimensions, Alert, Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import { useUserData } from '@/context/UserDataContext';
import { useAIEngine } from '@/context/AIEngineContext';
import { computeRiskScore } from '@/engine/riskEngine';
import { exportAllData, formatDate, formatTime } from '@/utils/storage';
import { COLORS, SHADOWS, SPACING, RADIUS, FONT_SIZE, MOOD_CONFIG, RISK_CONFIG } from '@/constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 64;

type FilterType = 'weekly' | 'monthly';

export default function JourneyScreen() {
  const { checkIns, insights, profile, isLoading } = useUserData();
  const { runFullAnalysis, patterns } = useAIEngine();

  const [filter, setFilter] = useState<FilterType>('weekly');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (checkIns.length > 0) {
      runFullAnalysis(checkIns, [], profile.openaiApiKey || undefined);
    }
  }, [checkIns.length]);

  if (isLoading) return null;

  // Filter data
  const days = filter === 'weekly' ? 7 : 30;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const filtered = checkIns.filter(c => c.timestamp >= cutoff);

  // Aggregate by date (average per day)
  const byDate = new Map<string, { moods: number[]; stresses: number[]; sleeps: number[] }>();
  for (const c of filtered) {
    if (!byDate.has(c.date)) byDate.set(c.date, { moods: [], stresses: [], sleeps: [] });
    const d = byDate.get(c.date)!;
    d.moods.push(c.mood);
    d.stresses.push(c.stress);
    d.sleeps.push(c.sleepHours);
  }

  const sortedDates = Array.from(byDate.keys()).sort();
  const avgMoods = sortedDates.map(d => avg(byDate.get(d)!.moods));
  const avgStresses = sortedDates.map(d => avg(byDate.get(d)!.stresses));
  const riskScores = sortedDates.map(d => {
    const entry = filtered.find(c => c.date === d);
    return entry ? computeRiskScore(entry).score : 0;
  });
  const dateLabels = sortedDates.map(d => d.slice(5)); // MM-DD
  const sessionCounts = sortedDates.map(d => byDate.get(d)!.moods.length);

  const hasChartData = sortedDates.length >= 2;

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const json = JSON.stringify(data, null, 2);
      await Share.share({
        message: json,
        title: 'MindGuard AI Data Export',
      });
    } catch (error) {
      Alert.alert('Export', 'Data telah disiapkan untuk export.');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient colors={[...COLORS.gradientMixed]} style={styles.header}>
        <Text style={styles.headerTitle}>Journey</Text>
        <Text style={styles.headerSub}>Perjalanan kesehatan mentalmu 📊</Text>
      </LinearGradient>

      {/* Filter Toggle */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'weekly' && styles.filterBtnActive]}
          onPress={() => setFilter('weekly')}
        >
          <Text style={[styles.filterText, filter === 'weekly' && styles.filterTextActive]}>
            Mingguan
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'monthly' && styles.filterBtnActive]}
          onPress={() => setFilter('monthly')}
        >
          <Text style={[styles.filterText, filter === 'monthly' && styles.filterTextActive]}>
            Bulanan
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderLeftColor: COLORS.secondary }]}>
          <Text style={styles.summaryValue}>{filtered.length}</Text>
          <Text style={styles.summaryLabel}>Total Sesi</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: COLORS.success }]}>
          <Text style={styles.summaryValue}>
            {filtered.length > 0 ? avg(filtered.map(c => c.mood)).toFixed(1) : '-'}
          </Text>
          <Text style={styles.summaryLabel}>Avg Mood</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: COLORS.danger }]}>
          <Text style={styles.summaryValue}>
            {riskScores.length > 0 ? Math.round(avg(riskScores)).toString() : '-'}
          </Text>
          <Text style={styles.summaryLabel}>Avg Risk</Text>
        </View>
      </View>

      {/* Empty State */}
      {!hasChartData && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>📈</Text>
          <Text style={styles.emptyTitle}>Belum Cukup Data</Text>
          <Text style={styles.emptyDesc}>
            Lakukan minimal 2 hari check-in untuk melihat diagram dan analisis.
          </Text>
        </View>
      )}

      {/* ═══ MOOD CHART ═══ */}
      {hasChartData && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>📊 Diagram Mood</Text>
          <LineChart
            data={{
              labels: dateLabels.length > 7 ? dateLabels.filter((_, i) => i % Math.ceil(dateLabels.length / 7) === 0) : dateLabels,
              datasets: [{ data: avgMoods.length > 0 ? avgMoods : [0], color: () => COLORS.secondary }],
            }}
            width={CHART_WIDTH}
            height={180}
            yAxisSuffix=""
            fromZero
            chartConfig={{
              backgroundColor: COLORS.surface,
              backgroundGradientFrom: COLORS.surface,
              backgroundGradientTo: COLORS.surface,
              decimalCount: 1,
              color: (opacity = 1) => `rgba(124, 92, 252, ${opacity})`,
              labelColor: () => COLORS.textTertiary,
              propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.secondary },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {/* ═══ RISK CHART ═══ */}
      {hasChartData && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>⚡ Diagram Risk Score</Text>
          <LineChart
            data={{
              labels: dateLabels.length > 7 ? dateLabels.filter((_, i) => i % Math.ceil(dateLabels.length / 7) === 0) : dateLabels,
              datasets: [{ data: riskScores.length > 0 ? riskScores : [0], color: () => COLORS.danger }],
            }}
            width={CHART_WIDTH}
            height={180}
            yAxisSuffix=""
            fromZero
            chartConfig={{
              backgroundColor: COLORS.surface,
              backgroundGradientFrom: COLORS.surface,
              backgroundGradientTo: COLORS.surface,
              decimalCount: 0,
              color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
              labelColor: () => COLORS.textTertiary,
              propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.danger },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {/* ═══ SESSION CHART ═══ */}
      {hasChartData && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>📋 Sesi per Hari</Text>
          <LineChart
            data={{
              labels: dateLabels.length > 7 ? dateLabels.filter((_, i) => i % Math.ceil(dateLabels.length / 7) === 0) : dateLabels,
              datasets: [{ data: sessionCounts.length > 0 ? sessionCounts : [0], color: () => COLORS.info }],
            }}
            width={CHART_WIDTH}
            height={160}
            yAxisSuffix=""
            fromZero
            chartConfig={{
              backgroundColor: COLORS.surface,
              backgroundGradientFrom: COLORS.surface,
              backgroundGradientTo: COLORS.surface,
              decimalCount: 0,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              labelColor: () => COLORS.textTertiary,
              propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.info },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {/* ═══ PATTERNS ═══ */}
      {patterns.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>🔍 Pola Terdeteksi</Text>
          {patterns.map((p, i) => (
            <View key={i} style={styles.patternItem}>
              <View style={styles.patternHeader}>
                <Text style={styles.patternTitle}>{p.title}</Text>
                <View style={[styles.trendBadge, {
                  backgroundColor: p.trend === 'improving' ? COLORS.successSoft
                    : p.trend === 'declining' ? COLORS.dangerSoft : COLORS.borderLight,
                }]}>
                  <Text style={[styles.trendText, {
                    color: p.trend === 'improving' ? COLORS.success
                      : p.trend === 'declining' ? COLORS.danger : COLORS.textTertiary,
                  }]}>
                    {p.trend === 'improving' ? '↑ Membaik' : p.trend === 'declining' ? '↓ Menurun' : '→ Stabil'}
                  </Text>
                </View>
              </View>
              <Text style={styles.patternDesc}>{p.description}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ═══ HISTORY ═══ */}
      <View style={styles.chartCard}>
        <TouchableOpacity
          style={styles.historyHeader}
          onPress={() => setShowHistory(!showHistory)}
        >
          <Text style={styles.chartTitle}>📜 History Inputan</Text>
          <Text style={styles.toggleText}>{showHistory ? '▲ Tutup' : '▼ Buka'}</Text>
        </TouchableOpacity>

        {showHistory && (
          <View>
            {filtered.length === 0 ? (
              <Text style={styles.noData}>Belum ada data</Text>
            ) : (
              filtered.slice(0, 20).map((ci, i) => (
                <View key={ci.id} style={styles.historyItem}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyMood}>
                      {MOOD_CONFIG[ci.mood].emoji}
                    </Text>
                  </View>
                  <View style={styles.historyCenter}>
                    <Text style={styles.historyDate}>
                      {formatDate(ci.timestamp)} • {formatTime(ci.timestamp)}
                    </Text>
                    <View style={styles.historyStats}>
                      <Text style={styles.historyStat}>Mood {ci.mood}/5</Text>
                      <Text style={styles.historyStat}>Stress {ci.stress}/5</Text>
                      <Text style={styles.historyStat}>Tidur {ci.sleepHours}h</Text>
                    </View>
                    {ci.notes ? (
                      <Text style={styles.historyNotes} numberOfLines={2}>{ci.notes}</Text>
                    ) : null}
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={[styles.historyRisk, {
                      color: RISK_CONFIG.getColor(computeRiskScore(ci).score),
                    }]}>
                      {computeRiskScore(ci).score}
                    </Text>
                    <Text style={styles.historyRiskLabel}>risk</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </View>

      {/* ═══ EXPORT ═══ */}
      <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.8}>
        <LinearGradient colors={[...COLORS.gradientMixed]} style={styles.exportGradient}>
          <Text style={styles.exportText}>📤 Export Data</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 20 },

  header: {
    paddingTop: 56, paddingBottom: 24, paddingHorizontal: SPACING.xl,
    borderBottomLeftRadius: RADIUS.xxl, borderBottomRightRadius: RADIUS.xxl,
  },
  headerTitle: { fontSize: FONT_SIZE.xxl, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: FONT_SIZE.md, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

  // Filter
  filterRow: {
    flexDirection: 'row', marginHorizontal: SPACING.lg, marginTop: SPACING.xl,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 4, ...SHADOWS.sm,
  },
  filterBtn: { flex: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center' },
  filterBtnActive: { backgroundColor: COLORS.secondary },
  filterText: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.textSecondary },
  filterTextActive: { color: '#fff' },

  // Summary
  summaryRow: { flexDirection: 'row', gap: 8, marginHorizontal: SPACING.lg, marginTop: SPACING.lg },
  summaryCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.md, borderLeftWidth: 3, ...SHADOWS.sm,
  },
  summaryValue: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.textPrimary },
  summaryLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textTertiary, marginTop: 2 },

  // Empty
  emptyCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.xxl,
    marginHorizontal: SPACING.lg, marginTop: SPACING.xl, alignItems: 'center', ...SHADOWS.sm,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textPrimary },
  emptyDesc: { fontSize: FONT_SIZE.sm, color: COLORS.textTertiary, textAlign: 'center', marginTop: 8, lineHeight: 20 },

  // Chart
  chartCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg,
    marginHorizontal: SPACING.lg, marginTop: SPACING.lg, ...SHADOWS.sm,
  },
  chartTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  chart: { borderRadius: RADIUS.md, alignSelf: 'center' },

  // Patterns
  patternItem: {
    paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  patternHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  patternTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  trendBadge: { borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 3 },
  trendText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  patternDesc: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 4, lineHeight: 20 },

  // History
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleText: { fontSize: FONT_SIZE.sm, color: COLORS.secondary, fontWeight: '600' },
  noData: { fontSize: FONT_SIZE.sm, color: COLORS.textTertiary, textAlign: 'center', paddingVertical: SPACING.xl },
  historyItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  historyLeft: { marginRight: SPACING.md },
  historyMood: { fontSize: 28 },
  historyCenter: { flex: 1 },
  historyDate: { fontSize: FONT_SIZE.xs, color: COLORS.textTertiary },
  historyStats: { flexDirection: 'row', gap: 8, marginTop: 4 },
  historyStat: {
    fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.textSecondary,
    backgroundColor: COLORS.background, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  historyNotes: { fontSize: FONT_SIZE.xs, color: COLORS.textTertiary, marginTop: 4 },
  historyRight: { alignItems: 'center', marginLeft: SPACING.sm },
  historyRisk: { fontSize: FONT_SIZE.lg, fontWeight: '800' },
  historyRiskLabel: { fontSize: 9, color: COLORS.textTertiary },

  // Export
  exportBtn: {
    marginHorizontal: SPACING.lg, marginTop: SPACING.xxl,
    borderRadius: RADIUS.lg, overflow: 'hidden', ...SHADOWS.md,
  },
  exportGradient: { paddingVertical: SPACING.lg, alignItems: 'center' },
  exportText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },
});
