// ============================================
// MindGuard AI — Daily Check-In (Ritual) Screen
// ============================================
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useUserData } from '@/context/UserDataContext';
import { useAIEngine } from '@/context/AIEngineContext';
import { generateId, getTodayDate } from '@/utils/storage';
import {
  MoodLevel,
  StressLevel,
  ActivityType,
  CheckInEntry,
  EmotionalLog,
} from '@/types/types';

const MOOD_OPTIONS: { value: MoodLevel; emoji: string; label: string }[] = [
  { value: 1, emoji: '😢', label: 'Sangat Buruk' },
  { value: 2, emoji: '😟', label: 'Buruk' },
  { value: 3, emoji: '😐', label: 'Netral' },
  { value: 4, emoji: '🙂', label: 'Baik' },
  { value: 5, emoji: '😄', label: 'Sangat Baik' },
];

const STRESS_OPTIONS: { value: StressLevel; label: string }[] = [
  { value: 1, label: '1 - Minimal' },
  { value: 2, label: '2 - Rendah' },
  { value: 3, label: '3 - Sedang' },
  { value: 4, label: '4 - Tinggi' },
  { value: 5, label: '5 - Sangat Tinggi' },
];

const ACTIVITY_OPTIONS: { value: ActivityType; emoji: string; label: string }[] = [
  { value: 'exercise', emoji: '🏃', label: 'Exercise' },
  { value: 'work', emoji: '💼', label: 'Work' },
  { value: 'study', emoji: '📚', label: 'Study' },
  { value: 'social', emoji: '👥', label: 'Social' },
  { value: 'rest', emoji: '🛋️', label: 'Rest' },
  { value: 'creative', emoji: '🎨', label: 'Creative' },
  { value: 'other', emoji: '📌', label: 'Other' },
];

const SLEEP_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// Quick emotion options for real-time logging
const EMOTION_OPTIONS = [
  { emotion: 'happy', emoji: '😊' },
  { emotion: 'anxious', emoji: '😰' },
  { emotion: 'sad', emoji: '😢' },
  { emotion: 'angry', emoji: '😡' },
  { emotion: 'calm', emoji: '😌' },
  { emotion: 'frustrated', emoji: '😤' },
  { emotion: 'excited', emoji: '🤩' },
  { emotion: 'tired', emoji: '😴' },
  { emotion: 'grateful', emoji: '🙏' },
  { emotion: 'lonely', emoji: '🥺' },
];

type Step = 'mood' | 'sleep' | 'stress' | 'activity' | 'notes' | 'done';
const STEPS: Step[] = ['mood', 'sleep', 'stress', 'activity', 'notes'];

export default function RitualScreen() {
  const { addCheckIn, todayCheckIn, addEmotionalLog, checkIns, profile } = useUserData();
  const { runFullAnalysis } = useAIEngine();

  const [currentStep, setCurrentStep] = useState<Step>(todayCheckIn ? 'done' : 'mood');
  const [mood, setMood] = useState<MoodLevel>(todayCheckIn?.mood ?? 3);
  const [sleepHours, setSleepHours] = useState<number>(todayCheckIn?.sleepHours ?? 7);
  const [stress, setStress] = useState<StressLevel>(todayCheckIn?.stress ?? 3);
  const [activity, setActivity] = useState<ActivityType>(todayCheckIn?.activity ?? 'other');
  const [notes, setNotes] = useState(todayCheckIn?.notes ?? '');

  // Emotional logging state
  const [showEmotionLogger, setShowEmotionLogger] = useState(false);
  const [emotionTrigger, setEmotionTrigger] = useState('');

  const stepIndex = STEPS.indexOf(currentStep);

  const goNext = () => {
    const idx = STEPS.indexOf(currentStep);
    if (idx < STEPS.length - 1) {
      setCurrentStep(STEPS[idx + 1]);
    }
  };

  const goBack = () => {
    const idx = STEPS.indexOf(currentStep);
    if (idx > 0) {
      setCurrentStep(STEPS[idx - 1]);
    }
  };

  const handleSubmit = async () => {
    const entry: CheckInEntry = {
      id: generateId(),
      timestamp: Date.now(),
      date: getTodayDate(),
      mood,
      sleepHours,
      stress,
      activity,
      notes,
    };

    await addCheckIn(entry);

    // Re-run analysis with updated data
    const updatedCheckIns = [entry, ...checkIns.filter(c => c.date !== entry.date)];
    await runFullAnalysis(updatedCheckIns, [], profile.openaiApiKey || undefined);

    setCurrentStep('done');
    Alert.alert('Check-In Complete! ✅', 'Your daily check-in has been saved. Check the Dashboard for insights.');
  };

  const handleEditCheckIn = () => {
    if (todayCheckIn) {
      setMood(todayCheckIn.mood);
      setSleepHours(todayCheckIn.sleepHours);
      setStress(todayCheckIn.stress);
      setActivity(todayCheckIn.activity);
      setNotes(todayCheckIn.notes);
    }
    setCurrentStep('mood');
  };

  const handleLogEmotion = async (emotion: string) => {
    const log: EmotionalLog = {
      id: generateId(),
      timestamp: Date.now(),
      emotion,
      intensity: 3,
      trigger: emotionTrigger,
    };
    await addEmotionalLog(log);
    setShowEmotionLogger(false);
    setEmotionTrigger('');
    Alert.alert('Logged! ✅', `Emotion "${emotion}" has been recorded.`);
  };

  // Completed state
  if (currentStep === 'done') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.title}>✅ Today's Check-In Complete</Text>
          {todayCheckIn && (
            <View style={styles.card}>
              <Text style={styles.summaryText}>
                Mood: {MOOD_OPTIONS.find(m => m.value === todayCheckIn.mood)?.emoji}{' '}
                {MOOD_OPTIONS.find(m => m.value === todayCheckIn.mood)?.label}
              </Text>
              <Text style={styles.summaryText}>Sleep: {todayCheckIn.sleepHours} hours</Text>
              <Text style={styles.summaryText}>
                Stress: {STRESS_OPTIONS.find(s => s.value === todayCheckIn.stress)?.label}
              </Text>
              <Text style={styles.summaryText}>
                Activity: {ACTIVITY_OPTIONS.find(a => a.value === todayCheckIn.activity)?.emoji}{' '}
                {ACTIVITY_OPTIONS.find(a => a.value === todayCheckIn.activity)?.label}
              </Text>
              {todayCheckIn.notes ? (
                <Text style={styles.summaryText}>Notes: {todayCheckIn.notes}</Text>
              ) : null}
            </View>
          )}
          <TouchableOpacity style={styles.button} onPress={handleEditCheckIn}>
            <Text style={styles.buttonText}>Edit Today's Check-In</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Emotion Logger */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Emotion Log</Text>
          <Text style={styles.sectionDesc}>
            Feeling something right now? Log it instantly.
          </Text>
          {!showEmotionLogger ? (
            <TouchableOpacity
              style={styles.button}
              onPress={() => setShowEmotionLogger(true)}
            >
              <Text style={styles.buttonText}>Log an Emotion</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.card}>
              <Text style={styles.label}>What are you feeling?</Text>
              <View style={styles.emotionGrid}>
                {EMOTION_OPTIONS.map((eo) => (
                  <TouchableOpacity
                    key={eo.emotion}
                    style={styles.emotionBtn}
                    onPress={() => handleLogEmotion(eo.emotion)}
                  >
                    <Text style={styles.emotionEmoji}>{eo.emoji}</Text>
                    <Text style={styles.emotionLabel}>{eo.emotion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.input}
                placeholder="What triggered this? (optional)"
                value={emotionTrigger}
                onChangeText={setEmotionTrigger}
              />
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#999' }]}
                onPress={() => setShowEmotionLogger(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        {STEPS.map((step, i) => (
          <View
            key={step}
            style={[
              styles.stepDot,
              i <= stepIndex && styles.stepDotActive,
            ]}
          />
        ))}
      </View>
      <Text style={styles.stepLabel}>
        Step {stepIndex + 1} of {STEPS.length}
      </Text>

      {/* Step: Mood */}
      {currentStep === 'mood' && (
        <View style={styles.section}>
          <Text style={styles.title}>How are you feeling today?</Text>
          <View style={styles.optionsColumn}>
            {MOOD_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.optionRow,
                  mood === opt.value && styles.optionRowSelected,
                ]}
                onPress={() => setMood(opt.value)}
              >
                <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                <Text style={styles.optionLabel}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Step: Sleep */}
      {currentStep === 'sleep' && (
        <View style={styles.section}>
          <Text style={styles.title}>How many hours did you sleep?</Text>
          <View style={styles.sleepGrid}>
            {SLEEP_OPTIONS.map((h) => (
              <TouchableOpacity
                key={h}
                style={[
                  styles.sleepBtn,
                  sleepHours === h && styles.sleepBtnSelected,
                ]}
                onPress={() => setSleepHours(h)}
              >
                <Text
                  style={[
                    styles.sleepBtnText,
                    sleepHours === h && styles.sleepBtnTextSelected,
                  ]}
                >
                  {h}h
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.hint}>
            Recommended: 7-9 hours for optimal mental health
          </Text>
        </View>
      )}

      {/* Step: Stress */}
      {currentStep === 'stress' && (
        <View style={styles.section}>
          <Text style={styles.title}>How stressed are you?</Text>
          <View style={styles.optionsColumn}>
            {STRESS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.optionRow,
                  stress === opt.value && styles.optionRowSelected,
                ]}
                onPress={() => setStress(opt.value)}
              >
                <Text style={styles.optionLabel}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Step: Activity */}
      {currentStep === 'activity' && (
        <View style={styles.section}>
          <Text style={styles.title}>Main activity today?</Text>
          <View style={styles.activityGrid}>
            {ACTIVITY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.activityBtn,
                  activity === opt.value && styles.activityBtnSelected,
                ]}
                onPress={() => setActivity(opt.value)}
              >
                <Text style={styles.activityEmoji}>{opt.emoji}</Text>
                <Text style={styles.activityLabel}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Step: Notes */}
      {currentStep === 'notes' && (
        <View style={styles.section}>
          <Text style={styles.title}>Any notes? (optional)</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={6}
            placeholder="Write about your day, thoughts, feelings..."
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
        </View>
      )}

      {/* Navigation Buttons */}
      <View style={styles.navRow}>
        {stepIndex > 0 && (
          <TouchableOpacity style={[styles.button, styles.backButton]} onPress={goBack}>
            <Text style={styles.buttonText}>← Back</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
        {currentStep === 'notes' ? (
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Submit ✅</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.button} onPress={goNext}>
            <Text style={styles.buttonText}>Next →</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ddd',
  },
  stepDotActive: {
    backgroundColor: '#2f95dc',
  },
  stepLabel: {
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.5,
    marginBottom: 20,
  },
  optionsColumn: {
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    gap: 12,
  },
  optionRowSelected: {
    borderColor: '#2f95dc',
    backgroundColor: '#e8f4fd',
  },
  optionEmoji: {
    fontSize: 28,
  },
  optionLabel: {
    fontSize: 16,
  },
  sleepGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sleepBtn: {
    width: 60,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  sleepBtnSelected: {
    borderColor: '#2f95dc',
    backgroundColor: '#e8f4fd',
  },
  sleepBtnText: {
    fontSize: 16,
  },
  sleepBtnTextSelected: {
    fontWeight: 'bold',
    color: '#2f95dc',
  },
  hint: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 12,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityBtn: {
    width: '30%',
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  activityBtnSelected: {
    borderColor: '#2f95dc',
    backgroundColor: '#e8f4fd',
  },
  activityEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  activityLabel: {
    fontSize: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 150,
  },
  navRow: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#2f95dc',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButton: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 15,
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  emotionBtn: {
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    width: '22%',
  },
  emotionEmoji: {
    fontSize: 24,
  },
  emotionLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginBottom: 12,
  },
});
