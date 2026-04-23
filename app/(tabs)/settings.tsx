// ============================================
// MindGuard AI — Settings Screen
// ============================================
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useUserData } from '@/context/UserDataContext';
import { exportAllData } from '@/utils/storage';

const AGE_RANGES = ['< 18', '18-24', '25-34', '35-44', '45-54', '55+'];

export default function SettingsScreen() {
  const { profile, updateProfile, resetAllData, checkIns, emotionalLogs, insights } = useUserData();

  const [name, setName] = useState(profile.name);
  const [apiKey, setApiKey] = useState(profile.openaiApiKey);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSaveName = async () => {
    await updateProfile({ name });
    Alert.alert('Saved', 'Name updated successfully.');
  };

  const handleSaveApiKey = async () => {
    await updateProfile({ openaiApiKey: apiKey });
    Alert.alert('Saved', 'OpenAI API key updated. AI insights will now use GPT.');
  };

  const handleSelectAge = async (ageRange: string) => {
    await updateProfile({ ageRange });
  };

  const handleToggleNotifications = async (value: boolean) => {
    await updateProfile({ notificationsEnabled: value });
  };

  const handleToggleDarkMode = async (value: boolean) => {
    await updateProfile({ darkMode: value });
  };

  const handleExportData = async () => {
    try {
      const data = await exportAllData();
      const json = JSON.stringify(data, null, 2);
      Alert.alert(
        'Data Export',
        `Your data has been prepared (${checkIns.length} check-ins, ${emotionalLogs.length} emotion logs, ${insights.length} insights).\n\nData size: ${(json.length / 1024).toFixed(1)} KB\n\n(Copy functionality coming soon)`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export data.');
    }
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete ALL your check-ins, emotional logs, insights, and profile data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            setName('');
            setApiKey('');
            Alert.alert('Done', 'All data has been reset.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>Settings</Text>

      {/* Profile */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>👤 Profile</Text>

        <Text style={styles.label}>Name</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Your name"
            value={name}
            onChangeText={setName}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveName}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Age Range</Text>
        <View style={styles.ageGrid}>
          {AGE_RANGES.map((age) => (
            <TouchableOpacity
              key={age}
              style={[
                styles.ageBtn,
                profile.ageRange === age && styles.ageBtnSelected,
              ]}
              onPress={() => handleSelectAge(age)}
            >
              <Text
                style={[
                  styles.ageBtnText,
                  profile.ageRange === age && styles.ageBtnTextSelected,
                ]}
              >
                {age}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* AI Configuration */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🤖 AI Configuration</Text>
        <Text style={styles.desc}>
          Enter your OpenAI API key to enable GPT-powered insights. Without a key, the app uses rule-based analysis (still works great!).
        </Text>
        <Text style={styles.label}>OpenAI API Key</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="sk-..."
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry={!showApiKey}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: '#666' }]}
            onPress={() => setShowApiKey(!showApiKey)}
          >
            <Text style={styles.saveBtnText}>{showApiKey ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveApiKey}>
          <Text style={styles.saveBtnText}>Save API Key</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>
          {profile.openaiApiKey
            ? '✅ API key configured — GPT insights enabled'
            : '⚪ No API key — using rule-based insights'}
        </Text>
      </View>

      {/* Preferences */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⚙️ Preferences</Text>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Notifications</Text>
          <Switch
            value={profile.notificationsEnabled}
            onValueChange={handleToggleNotifications}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Dark Mode</Text>
          <Switch
            value={profile.darkMode}
            onValueChange={handleToggleDarkMode}
          />
        </View>
      </View>

      {/* Data Stats */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Your Data</Text>
        <Text style={styles.statText}>Check-ins: {checkIns.length}</Text>
        <Text style={styles.statText}>Emotion logs: {emotionalLogs.length}</Text>
        <Text style={styles.statText}>AI insights: {insights.length}</Text>
        <Text style={styles.statText}>
          Member since: {new Date(profile.createdAt).toLocaleDateString()}
        </Text>
      </View>

      {/* Data Management */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>💾 Data Management</Text>

        <TouchableOpacity style={styles.actionBtn} onPress={handleExportData}>
          <Text style={styles.actionBtnText}>📤 Export Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: '#F44336' }]}
          onPress={handleResetData}
        >
          <Text style={[styles.actionBtnText, { color: '#F44336' }]}>🗑️ Reset All Data</Text>
        </TouchableOpacity>
      </View>

      {/* About */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ℹ️ About</Text>
        <Text style={styles.aboutText}>MindGuard AI v1.0.0</Text>
        <Text style={styles.aboutText}>Adaptive Mental Health AI Platform</Text>
        <Text style={styles.aboutDesc}>
          MindGuard AI uses Adaptive Behavioral AI System to detect emotional patterns,
          predict mental health risks, and provide real-time micro-interventions.
        </Text>
        <Text style={styles.aboutTeam}>
          Developed by:{'\n'}
          Christian Peter Wiyoso (672024048){'\n'}
          Samuel Richard Cristianto (672024156){'\n'}
          Matthew Dustin Sukiat (672024260)
        </Text>
        <Text style={styles.aboutOrg}>
          Program Studi S1 Teknik Informatika{'\n'}
          Fakultas Teknologi Informasi{'\n'}
          Universitas Kristen Satya Wacana
        </Text>
      </View>

      {/* Privacy */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔒 Privacy</Text>
        <Text style={styles.privacyText}>
          All your data is stored locally on your device using AsyncStorage.
          No data is sent to any server except when using the OpenAI API feature (which sends check-in data to OpenAI for analysis).
          You can delete all data at any time using the Reset button above.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  desc: {
    fontSize: 13,
    opacity: 0.6,
    marginBottom: 8,
    lineHeight: 18,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: '#2f95dc',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  hint: {
    fontSize: 12,
    marginTop: 8,
    opacity: 0.6,
  },
  ageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  ageBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  ageBtnSelected: {
    borderColor: '#2f95dc',
    backgroundColor: '#e8f4fd',
  },
  ageBtnText: {
    fontSize: 14,
  },
  ageBtnTextSelected: {
    fontWeight: 'bold',
    color: '#2f95dc',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  switchLabel: {
    fontSize: 15,
  },
  statText: {
    fontSize: 14,
    marginBottom: 4,
  },
  actionBtn: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  aboutText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  aboutDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    opacity: 0.7,
  },
  aboutTeam: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },
  aboutOrg: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    opacity: 0.6,
  },
  privacyText: {
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.7,
  },
});
