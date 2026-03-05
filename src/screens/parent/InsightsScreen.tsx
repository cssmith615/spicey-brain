import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useAppStore } from '../../store/routineStore';
import { colors, spacing, typography, radius } from '../../theme';

const SECURE_KEY = 'anthropic_api_key';

// ---------------------------------------------------------------------------
// Claude API call
// ---------------------------------------------------------------------------

async function fetchInsights(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message ?? `API error ${res.status}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

// ---------------------------------------------------------------------------
// Insight card types
// ---------------------------------------------------------------------------

interface InsightCard {
  emoji: string;
  title: string;
  body: string;
}

function parseInsights(raw: string): InsightCard[] {
  // Expect numbered list like: "1. Title\nBody text\n\n2. ..."
  // Fallback: return single card with raw text
  const blocks = raw.split(/\n\s*\n/).filter(Boolean);
  const cards: InsightCard[] = [];
  const emojis = ['📊', '🧠', '💡', '⚡', '🌟', '📈', '🎯', '💊'];

  for (let i = 0; i < blocks.length; i++) {
    const lines = blocks[i].trim().split('\n');
    const titleLine = lines[0].replace(/^\d+\.\s*/, '').trim();
    const body = lines.slice(1).join(' ').trim();
    if (titleLine) {
      cards.push({ emoji: emojis[i % emojis.length], title: titleLine, body: body || titleLine });
    }
  }

  return cards.length > 0 ? cards : [{ emoji: '🧠', title: 'Insights', body: raw }];
}

// ---------------------------------------------------------------------------
// Data builder
// ---------------------------------------------------------------------------

function buildPrompt(
  childName: string,
  ageGroup: string,
  moodEntries: any[],
  sessions: any[],
  routines: any[],
  medications: any[],
  teacherNotes: any[]
): string {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 14);

  const recentMoods = moodEntries.filter((e) => new Date(e.recordedAt) >= weekAgo);
  const avgMood = recentMoods.length
    ? (recentMoods.reduce((s, e) => s + e.mood, 0) / recentMoods.length).toFixed(1)
    : null;
  const avgFocus = recentMoods.length
    ? (recentMoods.reduce((s, e) => s + e.focus, 0) / recentMoods.length).toFixed(1)
    : null;

  const behaviorCounts: Record<string, number> = {};
  recentMoods.forEach((e) =>
    e.behaviors.forEach((b: string) => {
      behaviorCounts[b] = (behaviorCounts[b] ?? 0) + 1;
    })
  );
  const topBehaviors = Object.entries(behaviorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([b, n]) => `${b} (${n}x)`);

  const completedSessions = sessions.filter((s) => !!s.completedAt);
  const routineCompletionRate =
    sessions.length > 0
      ? Math.round((completedSessions.length / sessions.length) * 100)
      : null;

  const medCount = medications.length;
  const recentConcerns = teacherNotes
    .filter((n) => n.type === 'concern' && new Date(n.date) >= weekAgo)
    .length;
  const recentPositives = teacherNotes
    .filter((n) => n.type === 'positive' && new Date(n.date) >= weekAgo)
    .length;

  return `You are an ADHD support assistant helping parents understand their child's patterns.

Child: ${childName} (age group: ${ageGroup})
Data from the last 14 days:
- Mood entries: ${recentMoods.length}${avgMood ? `, average mood: ${avgMood}/5` : ''}${avgFocus ? `, average focus: ${avgFocus}/5` : ''}
- Top behaviors observed: ${topBehaviors.length ? topBehaviors.join(', ') : 'none recorded'}
- Routine completion rate: ${routineCompletionRate !== null ? `${routineCompletionRate}%` : 'no data'}
- Active medications: ${medCount}
- Teacher notes (last 2 weeks): ${recentPositives} positive, ${recentConcerns} concern${recentConcerns !== 1 ? 's' : ''}

Generate 4 concise, actionable insights for the parent. Format as a numbered list where each item has a short bold title on the first line followed by 1-2 sentences of specific, practical advice. Focus on patterns, what's working, and one thing to try. Keep it warm, non-judgmental, and encouraging. Do not use asterisks or markdown formatting.`;
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function InsightsScreen() {
  const { parentProfile, moodEntries, sessions, routines, medications, teacherNotes } =
    useAppStore();

  const children = parentProfile?.childProfiles ?? [];
  const [selectedChildId, setSelectedChildId] = useState(children[0]?.id ?? '');
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showKeyEntry, setShowKeyEntry] = useState(false);
  const [keyDraft, setKeyDraft] = useState('');

  // Load persisted API key on mount
  useEffect(() => {
    SecureStore.getItemAsync(SECURE_KEY).then((saved) => {
      if (saved) setApiKey(saved);
    });
  }, []);

  const selectedChild = children.find((c) => c.id === selectedChildId);
  const childMoods = moodEntries.filter((e) => e.childProfileId === selectedChildId);
  const childSessions = sessions.filter((s) => s.childProfileId === selectedChildId);
  const childMeds = medications.filter((m) => m.childProfileId === selectedChildId);
  const childNotes = teacherNotes.filter((n) => n.childProfileId === selectedChildId);

  const handleGenerate = async (key: string) => {
    if (!selectedChild) return;
    setLoading(true);
    setShowKeyEntry(false);
    try {
      const prompt = buildPrompt(
        selectedChild.name,
        selectedChild.ageGroup,
        childMoods,
        childSessions,
        routines,
        childMeds,
        childNotes
      );
      const raw = await fetchInsights(key, prompt);
      setInsights(parseInsights(raw));
      setLastFetched(new Date());
    } catch (e: any) {
      Alert.alert('Could not get insights', e.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const onGeneratePress = () => {
    if (apiKey) {
      handleGenerate(apiKey);
    } else {
      setKeyDraft('');
      setShowKeyEntry(true);
    }
  };

  const onKeySubmit = () => {
    const k = keyDraft.trim();
    if (!k) return;
    setApiKey(k);
    SecureStore.setItemAsync(SECURE_KEY, k); // persist across sessions
    handleGenerate(k);
  };

  const hasData = childMoods.length > 0 || childSessions.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>AI Insights</Text>
        <Text style={styles.subtitle}>
          Pattern analysis powered by Claude AI — personalized for each child
        </Text>

        {/* Child selector */}
        {children.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childSelector}>
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={[styles.childChip, selectedChildId === child.id && styles.childChipActive]}
                onPress={() => {
                  setSelectedChildId(child.id);
                  setInsights([]);
                  setLastFetched(null);
                }}
              >
                <Text>{child.avatarEmoji}</Text>
                <Text style={[styles.chipName, selectedChildId === child.id && styles.chipNameActive]}>
                  {child.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Data summary card */}
        <View style={styles.dataCard}>
          <Text style={styles.dataCardTitle}>Data for {selectedChild?.name}</Text>
          <View style={styles.dataRow}>
            <View style={styles.dataStat}>
              <Text style={styles.dataValue}>{childMoods.length}</Text>
              <Text style={styles.dataLabel}>Mood logs</Text>
            </View>
            <View style={styles.dataStat}>
              <Text style={styles.dataValue}>{childSessions.filter((s) => !!s.completedAt).length}</Text>
              <Text style={styles.dataLabel}>Routines done</Text>
            </View>
            <View style={styles.dataStat}>
              <Text style={styles.dataValue}>{childNotes.length}</Text>
              <Text style={styles.dataLabel}>Teacher notes</Text>
            </View>
            <View style={styles.dataStat}>
              <Text style={styles.dataValue}>{childMeds.length}</Text>
              <Text style={styles.dataLabel}>Medications</Text>
            </View>
          </View>
        </View>

        {!hasData && (
          <View style={styles.noDataCard}>
            <Text style={styles.noDataEmoji}>📊</Text>
            <Text style={styles.noDataTitle}>Not enough data yet</Text>
            <Text style={styles.noDataSubtitle}>
              Log mood entries and complete a few routines first — AI insights get better with more data.
            </Text>
          </View>
        )}

        {/* API key entry */}
        {showKeyEntry && (
          <View style={styles.keyCard}>
            <Text style={styles.keyCardTitle}>Anthropic API Key</Text>
            <Text style={styles.keyCardSubtitle}>
              Stays on your device. Get one at console.anthropic.com
            </Text>
            <TextInput
              style={styles.keyInput}
              value={keyDraft}
              onChangeText={setKeyDraft}
              placeholder="sk-ant-..."
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.keyActions}>
              <TouchableOpacity
                style={styles.keyCancelBtn}
                onPress={() => setShowKeyEntry(false)}
              >
                <Text style={styles.keyCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.keySubmitBtn, !keyDraft.trim() && styles.keySubmitBtnDisabled]}
                onPress={onKeySubmit}
                disabled={!keyDraft.trim()}
              >
                <Text style={styles.keySubmitText}>Generate</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Generate button */}
        {hasData && !showKeyEntry && (
          <TouchableOpacity
            style={[styles.generateBtn, loading && styles.generateBtnLoading]}
            onPress={onGeneratePress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.generateBtnText}>
                {insights.length > 0 ? '↻ Refresh Insights' : '✨ Generate Insights'}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {lastFetched && (
          <Text style={styles.lastFetched}>
            Updated {lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}

        {/* Insight cards */}
        {insights.map((card, i) => (
          <View key={i} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightEmoji}>{card.emoji}</Text>
              <Text style={styles.insightTitle}>{card.title}</Text>
            </View>
            <Text style={styles.insightBody}>{card.body}</Text>
          </View>
        ))}

        {/* API key note */}
        {hasData && !showKeyEntry && (
          <TouchableOpacity onPress={() => { setKeyDraft(apiKey); setShowKeyEntry(true); }} style={styles.keyNote}>
            <Text style={styles.keyNoteText}>
              {apiKey ? '🔑 API key set — tap to change' : '🔑 Tap Generate to enter API key'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  screenTitle: { fontSize: typography.fontSizeXXL, fontWeight: typography.fontWeightBold, color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { fontSize: typography.fontSizeSM, color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 20 },
  childSelector: { marginBottom: spacing.md },
  childChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, marginRight: spacing.sm, gap: spacing.xs },
  childChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipName: { fontSize: typography.fontSizeSM, color: colors.textSecondary, fontWeight: typography.fontWeightMedium },
  chipNameActive: { color: '#fff' },
  keyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  keyCardTitle: { fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary, marginBottom: spacing.xs },
  keyCardSubtitle: { fontSize: typography.fontSizeXS, color: colors.textMuted, marginBottom: spacing.md },
  keyInput: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSizeMD,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  keyActions: { flexDirection: 'row', gap: spacing.sm },
  keyCancelBtn: { flex: 1, backgroundColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center' },
  keyCancelText: { fontSize: typography.fontSizeMD, color: colors.textSecondary, fontWeight: typography.fontWeightMedium },
  keySubmitBtn: { flex: 2, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center' },
  keySubmitBtnDisabled: { backgroundColor: colors.border },
  keySubmitText: { fontSize: typography.fontSizeMD, color: '#fff', fontWeight: typography.fontWeightSemiBold },
  dataCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dataCardTitle: { fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold, color: colors.textSecondary, marginBottom: spacing.md },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dataStat: { alignItems: 'center' },
  dataValue: { fontSize: typography.fontSizeXL, fontWeight: typography.fontWeightBold, color: colors.primary },
  dataLabel: { fontSize: typography.fontSizeXS, color: colors.textMuted, marginTop: 2 },
  noDataCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.lg },
  noDataEmoji: { fontSize: 48, marginBottom: spacing.sm },
  noDataTitle: { fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary, marginBottom: spacing.xs },
  noDataSubtitle: { fontSize: typography.fontSizeSM, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  generateBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  generateBtnLoading: { opacity: 0.7 },
  generateBtnText: { fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightBold, color: '#fff' },
  lastFetched: { fontSize: typography.fontSizeXS, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg },
  insightCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  insightEmoji: { fontSize: 22 },
  insightTitle: { fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary, flex: 1 },
  insightBody: { fontSize: typography.fontSizeSM, color: colors.textSecondary, lineHeight: 21 },
  keyNote: { marginTop: spacing.md, alignItems: 'center' },
  keyNoteText: { fontSize: typography.fontSizeXS, color: colors.textMuted },
});
