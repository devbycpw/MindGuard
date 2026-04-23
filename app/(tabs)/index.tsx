// ============================================
// MindGuard AI — Dashboard Screen
// ============================================
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserData } from '@/context/UserDataContext';
import { useAIEngine } from '@/context/AIEngineContext';
import { COLORS, SHADOWS, SPACING, RADIUS, FONT_SIZE, MOOD_CONFIG, RISK_CONFIG } from '@/constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function DashboardScreen() {
  const {
    checkIns, todayCheckIns, insights, profile, isLoading, refreshData, updateProfile,
  } = useUserData();
  const {
    currentRiskScore, averageRiskScore, riskIndications,
    latestInsight, interventions, runFullAnalysis, isAnalyzing,
  } = useAIEngine();

  const [refreshing, setRefreshing] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);

  useEffect(() => {
    if (checkIns.length > 0) {
      runFullAnalysis(checkIns, [], profile.openaiApiKey || undefined);
    }
  }, [checkIns.length]);

  useEffect(() => {
    setNameInput(profile.name);
  }, [profile.name]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    if (checkIns.length > 0) {
      await runFullAnalysis(checkIns, [], profile.openaiApiKey || undefined);
    }
    setRefreshing(false);
  };

  const handleSaveName = async () => {
    await updateProfile({ name: nameInput });
    setShowNameInput(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
        <Text style={styles.loadingText}>Memuat MindGuard...</Text>
      </View>
    );
  }

  const greeting = getGreeting(profile.name);
  const latestCheckIn = todayCheckIns.length > 0 ? todayCheckIns[0] : null;

  // Compute averages
  const recentCheckIns = checkIns.slice(0, 7);
  const avgSleep = recentCheckIns.length > 0
    ? (recentCheckIns.reduce((s, c) => s + c.sleepHours, 0) / recentCheckIns.length)
    : 0;
  const avgMood = recentCheckIns.length > 0
    ? (recentCheckIns.reduce((s, c) => s + c.mood, 0) / recentCheckIns.length)
    : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.secondary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ══════════ HEADER GRADIENT ══════════ */}
      <LinearGradient colors={[...COLORS.gradientMixed]} style={styles.headerGradient}>
        {/* Profile Row */}
        <View style={styles.profileRow}>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => setShowNameInput(!showNameInput)}
          >
            <Text style={styles.avatarText}>
              {profile.name ? profile.name[0].toUpperCase() : '👤'}
            </Text>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={styles.greetingText}>{greeting}</Text>
            <Text style={styles.dateText}>{formatDateFull(new Date())}</Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => setShowNameInput(!showNameInput)}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {showNameInput && (
          <View style={styles.nameInputRow}>
            <TextInput
              style={styles.nameInput}
              placeholder="Masukkan namamu..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={nameInput}
              onChangeText={setNameInput}
            />
            <TouchableOpacity style={styles.nameBtn} onPress={handleSaveName}>
              <Text style={styles.nameBtnText}>Simpan</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Mood Display */}
        {latestCheckIn && (
          <View style={styles.quickMood}>
            <Text style={styles.quickMoodEmoji}>
              {MOOD_CONFIG[latestCheckIn.mood].emoji}
            </Text>
            <Text style={styles.quickMoodLabel}>
              Mood hari ini: {MOOD_CONFIG[latestCheckIn.mood].label}
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* ══════════ TODAY'S CHECK-IN ══════════ */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>📋</Text>
          <Text style={styles.cardTitle}>Check-In Hari Ini</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{todayCheckIns.length}x</Text>
          </View>
        </View>
        {latestCheckIn ? (
          <View style={styles.checkInSummary}>
            <View style={styles.statRow}>
              <StatBox
                icon="😊"
                label="Mood"
                value={`${latestCheckIn.mood}/5`}
                color={MOOD_CONFIG[latestCheckIn.mood].color}
              />
              <StatBox
                icon="😴"
                label="Tidur"
                value={`${latestCheckIn.sleepHours}h`}
                color={latestCheckIn.sleepHours >= 7 ? COLORS.success : COLORS.warning}
              />
              <StatBox
                icon="🧠"
                label="Stress"
                value={`${latestCheckIn.stress}/5`}
                color={latestCheckIn.stress <= 2 ? COLORS.success : latestCheckIn.stress <= 3 ? COLORS.warning : COLORS.danger}
              />
            </View>
            {latestCheckIn.notes ? (
              <View style={styles.notesPreview}>
                <Text style={styles.notesLabel}>Catatan:</Text>
                <Text style={styles.notesText} numberOfLines={2}>{latestCheckIn.notes}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyText}>Belum ada check-in hari ini</Text>
            <Text style={styles.emptyHint}>Buka tab Check-In untuk mulai</Text>
          </View>
        )}
      </View>

      {/* ══════════ STATS ROW ══════════ */}
      <View style={styles.statsGrid}>
        {/* Mood Stats */}
        <View style={[styles.miniCard, { flex: 1 }]}>
          <LinearGradient colors={[...COLORS.gradientPurple]} style={styles.miniCardGradient}>
            <Text style={styles.miniCardIcon}>📊</Text>
            <Text style={styles.miniCardValue}>
              {avgMood > 0 ? avgMood.toFixed(1) : '-'}
            </Text>
            <Text style={styles.miniCardLabel}>Rata-rata Mood</Text>
            <Text style={styles.miniCardSub}>7 hari terakhir</Text>
          </LinearGradient>
        </View>

        {/* Sleep Stats */}
        <View style={[styles.miniCard, { flex: 1 }]}>
          <LinearGradient colors={['#3B82F6', '#60A5FA']} style={styles.miniCardGradient}>
            <Text style={styles.miniCardIcon}>😴</Text>
            <Text style={styles.miniCardValue}>
              {avgSleep > 0 ? avgSleep.toFixed(1) + 'h' : '-'}
            </Text>
            <Text style={styles.miniCardLabel}>Rata-rata Tidur</Text>
            <Text style={styles.miniCardSub}>7 hari terakhir</Text>
          </LinearGradient>
        </View>
      </View>

      {/* ══════════ RISK SCORE ══════════ */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>⚡</Text>
          <Text style={styles.cardTitle}>Mental Risk Score</Text>
        </View>
        {currentRiskScore ? (
          <View style={styles.riskContainer}>
            <View style={styles.riskGauge}>
              <Text style={[styles.riskScore, { color: RISK_CONFIG.getColor(currentRiskScore.score) }]}>
                {currentRiskScore.score}
              </Text>
              <Text style={styles.riskMax}>/100</Text>
            </View>
            <View style={[styles.riskBadge, { backgroundColor: RISK_CONFIG.getColor(currentRiskScore.score) + '20' }]}>
              <View style={[styles.riskDot, { backgroundColor: RISK_CONFIG.getColor(currentRiskScore.score) }]} />
              <Text style={[styles.riskLabel, { color: RISK_CONFIG.getColor(currentRiskScore.score) }]}>
                {RISK_CONFIG.getLabel(currentRiskScore.score)}
              </Text>
            </View>
            {/* Progress bar */}
            <View style={styles.riskBar}>
              <View style={styles.riskBarBg}>
                <LinearGradient
                  colors={[COLORS.success, COLORS.warning, COLORS.danger]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.riskBarFill, { width: `${currentRiskScore.score}%` }]}
                />
              </View>
              <View style={styles.riskBarLabels}>
                <Text style={styles.riskBarLabel}>0 Aman</Text>
                <Text style={styles.riskBarLabel}>100 Bahaya</Text>
              </View>
            </View>
            {/* Factors */}
            <View style={styles.factorsContainer}>
              {currentRiskScore.factors.map((f, i) => (
                <View key={i} style={styles.factorRow}>
                  <Text style={styles.factorName}>{f.name}</Text>
                  <View style={styles.factorBarBg}>
                    <View
                      style={[
                        styles.factorBarFill,
                        {
                          width: `${Math.min(100, f.contribution * 3)}%`,
                          backgroundColor: f.contribution > 20 ? COLORS.danger : f.contribution > 10 ? COLORS.warning : COLORS.success,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.factorValue}>+{f.contribution}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📈</Text>
            <Text style={styles.emptyText}>Lakukan check-in untuk melihat risk score</Text>
          </View>
        )}
      </View>

      {/* ══════════ RISK INDICATIONS ══════════ */}
      {riskIndications.length > 0 && (
        <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: COLORS.danger }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>⚠️</Text>
            <Text style={[styles.cardTitle, { color: COLORS.danger }]}>Peringatan Risiko</Text>
          </View>
          {riskIndications.map((ri, i) => (
            <View key={i} style={styles.indicationItem}>
              <Text style={styles.indicationType}>
                {ri.type === 'burnout' ? '🔥 Burnout' : ri.type === 'anxiety' ? '😰 Anxiety' : '⚡ Stress Overload'}
                <Text style={styles.indicationSeverity}> — {ri.severity}</Text>
              </Text>
              <Text style={styles.indicationDesc}>{ri.description}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ══════════ AI INSIGHT ══════════ */}
      <View style={[styles.card, styles.insightCard]}>
        <LinearGradient
          colors={[COLORS.primaryDark, COLORS.primary]}
          style={styles.insightGradient}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🤖</Text>
            <Text style={[styles.cardTitle, { color: COLORS.textOnPrimary }]}>
              AI Insight {isAnalyzing && <ActivityIndicator size="small" color="#fff" />}
            </Text>
          </View>
          {latestInsight ? (
            <View>
              <View style={styles.insightRow}>
                <Text style={styles.insightLabel}>Kondisi Sekarang</Text>
                <Text style={styles.insightValue}>{latestInsight.condition}</Text>
              </View>
              <View style={styles.insightRow}>
                <Text style={styles.insightLabel}>Level Risk</Text>
                <View style={styles.insightRiskBadge}>
                  <Text style={styles.insightRiskText}>{latestInsight.riskLevel}</Text>
                </View>
              </View>
              <View style={styles.insightRow}>
                <Text style={styles.insightLabel}>Insight</Text>
                <Text style={styles.insightValue}>{latestInsight.analysis}</Text>
              </View>
              <View style={styles.insightRow}>
                <Text style={styles.insightLabel}>Saran</Text>
                {latestInsight.recommendations.map((rec, i) => (
                  <View key={i} style={styles.recRow}>
                    <Text style={styles.recBullet}>•</Text>
                    <Text style={styles.recText}>{rec}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.insightSource}>
                Powered by {latestInsight.source === 'openai' ? 'OpenAI GPT' : 'MindGuard AI Engine'}
              </Text>
            </View>
          ) : (
            <View style={styles.insightEmpty}>
              <Text style={styles.insightEmptyText}>
                Lakukan check-in untuk mendapatkan AI insight personal
              </Text>
            </View>
          )}
        </LinearGradient>
      </View>

      {/* ══════════ QUICK INTERVENTIONS ══════════ */}
      {interventions.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>💡</Text>
            <Text style={styles.cardTitle}>Rekomendasi Untukmu</Text>
          </View>
          {interventions.slice(0, 3).map((intv, i) => (
            <View key={i} style={styles.interventionItem}>
              <View style={styles.interventionLeft}>
                <Text style={styles.interventionTitle}>{intv.title}</Text>
                <Text style={styles.interventionDesc} numberOfLines={2}>{intv.description}</Text>
              </View>
              <View style={styles.interventionDuration}>
                <Text style={styles.interventionDurText}>{intv.duration}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

// ══════════ Stat Box Component ══════════
function StatBox({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statBoxIcon}>{icon}</Text>
      <Text style={[styles.statBoxValue, { color }]}>{value}</Text>
      <Text style={styles.statBoxLabel}>{label}</Text>
    </View>
  );
}

// ══════════ Helpers ══════════
function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const n = name || 'MindGuarder';
  if (hour < 12) return `Selamat Pagi, ${n} 🌅`;
  if (hour < 17) return `Selamat Siang, ${n} ☀️`;
  if (hour < 21) return `Selamat Sore, ${n} 🌆`;
  return `Selamat Malam, ${n} 🌙`;
}

function formatDateFull(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ══════════ Styles ══════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  contentContainer: { paddingBottom: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 12, fontSize: FONT_SIZE.md, color: COLORS.textSecondary },

  // Header
  headerGradient: {
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: SPACING.xl,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 20, color: '#fff', fontWeight: '700' },
  profileInfo: { flex: 1, marginLeft: SPACING.md },
  greetingText: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: '#fff' },
  dateText: { fontSize: FONT_SIZE.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  settingsBtn: { padding: 8 },
  settingsIcon: { fontSize: 22 },
  nameInputRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    gap: 8,
  },
  nameInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#fff',
    fontSize: FONT_SIZE.md,
  },
  nameBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  nameBtnText: { color: '#fff', fontWeight: '600', fontSize: FONT_SIZE.sm },
  quickMood: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  quickMoodEmoji: { fontSize: 28 },
  quickMoodLabel: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '600', marginLeft: 10 },

  // Card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    ...SHADOWS.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  cardIcon: { fontSize: 20, marginRight: 8 },
  cardTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  badge: {
    backgroundColor: COLORS.secondarySoft,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.secondary },

  // Check-in summary
  checkInSummary: {},
  statRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statBox: { alignItems: 'center', flex: 1 },
  statBoxIcon: { fontSize: 24, marginBottom: 4 },
  statBoxValue: { fontSize: FONT_SIZE.xl, fontWeight: '800' },
  statBoxLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textTertiary, marginTop: 2 },
  notesPreview: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  notesLabel: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.textTertiary, marginBottom: 4 },
  notesText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: 20 },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xl },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, fontWeight: '600' },
  emptyHint: { fontSize: FONT_SIZE.sm, color: COLORS.textTertiary, marginTop: 4 },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  miniCard: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  miniCardGradient: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  miniCardIcon: { fontSize: 24, marginBottom: 4 },
  miniCardValue: { fontSize: FONT_SIZE.xxl, fontWeight: '800', color: '#fff' },
  miniCardLabel: { fontSize: FONT_SIZE.xs, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 2 },
  miniCardSub: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 1 },

  // Risk score
  riskContainer: { alignItems: 'center' },
  riskGauge: { flexDirection: 'row', alignItems: 'baseline' },
  riskScore: { fontSize: 56, fontWeight: '900' },
  riskMax: { fontSize: FONT_SIZE.xl, color: COLORS.textTertiary, marginLeft: 2 },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginTop: 8,
  },
  riskDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  riskLabel: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  riskBar: { width: '100%', marginTop: SPACING.xl },
  riskBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.borderLight,
    overflow: 'hidden',
  },
  riskBarFill: { height: '100%', borderRadius: 4 },
  riskBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  riskBarLabel: { fontSize: 10, color: COLORS.textTertiary },
  factorsContainer: { width: '100%', marginTop: SPACING.lg },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  factorName: { width: 50, fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  factorBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  factorBarFill: { height: '100%', borderRadius: 3 },
  factorValue: { width: 35, fontSize: FONT_SIZE.xs, color: COLORS.textTertiary, textAlign: 'right' },

  // Indications
  indicationItem: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  indicationType: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.textPrimary },
  indicationSeverity: { fontWeight: '400', color: COLORS.textTertiary, fontSize: FONT_SIZE.sm },
  indicationDesc: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 4, lineHeight: 20 },

  // AI Insight
  insightCard: { padding: 0, overflow: 'hidden' },
  insightGradient: { padding: SPACING.xl },
  insightRow: { marginBottom: SPACING.lg },
  insightLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  insightValue: { fontSize: FONT_SIZE.md, color: '#fff', lineHeight: 22 },
  insightRiskBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  insightRiskText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZE.md },
  recRow: { flexDirection: 'row', marginBottom: 4 },
  recBullet: { color: COLORS.successLight, fontSize: FONT_SIZE.md, marginRight: 6 },
  recText: { color: 'rgba(255,255,255,0.85)', fontSize: FONT_SIZE.sm, flex: 1, lineHeight: 20 },
  insightSource: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'right',
    marginTop: 8,
  },
  insightEmpty: { paddingVertical: SPACING.xl },
  insightEmptyText: { color: 'rgba(255,255,255,0.5)', fontSize: FONT_SIZE.md, textAlign: 'center' },

  // Interventions
  interventionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  interventionLeft: { flex: 1 },
  interventionTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.textPrimary },
  interventionDesc: { fontSize: FONT_SIZE.sm, color: COLORS.textTertiary, marginTop: 2 },
  interventionDuration: {
    backgroundColor: COLORS.secondarySoft,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  interventionDurText: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.secondary },
});
