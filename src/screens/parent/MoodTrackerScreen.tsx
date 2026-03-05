import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/routineStore';
import { colors, spacing, typography, radius } from '../../theme';
import { generateId } from '../../utils';
import type { MoodEntry, MoodLevel, FocusLevel } from '../../types';

const MOOD_OPTIONS: { level: MoodLevel; emoji: string; label: string }[] = [
  { level: 1, emoji: '😔', label: 'Tough' },
  { level: 2, emoji: '😕', label: 'Low' },
  { level: 3, emoji: '😐', label: 'Okay' },
  { level: 4, emoji: '🙂', label: 'Good' },
  { level: 5, emoji: '😄', label: 'Great' },
];

const FOCUS_OPTIONS: { level: FocusLevel; emoji: string; label: string }[] = [
  { level: 1, emoji: '🌀', label: 'Scattered' },
  { level: 2, emoji: '😵', label: 'Distracted' },
  { level: 3, emoji: '😶', label: 'Average' },
  { level: 4, emoji: '🎯', label: 'Focused' },
  { level: 5, emoji: '⚡', label: 'Sharp' },
];

const BEHAVIOR_TAGS = [
  'Hyperactive', 'Impulsive', 'Inattentive', 'Oppositional',
  'Anxious', 'Calm', 'Cooperative', 'Frustrated',
  'Meltdown', 'Great day', 'Hard morning', 'Hard evening',
];

export default function MoodTrackerScreen() {
  const { parentProfile, moodEntries, addMoodEntry } = useAppStore();
  const children = parentProfile?.childProfiles ?? [];

  const [selectedChildId, setSelectedChildId] = useState(children[0]?.id ?? '');
  const [showForm, setShowForm] = useState(false);
  const [mood, setMood] = useState<MoodLevel>(3);
  const [focus, setFocus] = useState<FocusLevel>(3);
  const [selectedBehaviors, setSelectedBehaviors] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [view, setView] = useState<'log' | 'history'>('log');

  const childEntries = moodEntries
    .filter((e) => e.childProfileId === selectedChildId)
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

  const toggleBehavior = (tag: string) => {
    setSelectedBehaviors((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = () => {
    const entry: MoodEntry = {
      id: generateId(),
      childProfileId: selectedChildId,
      recordedAt: new Date().toISOString(),
      mood,
      focus,
      behaviors: selectedBehaviors,
      notes: notes.trim(),
      recordedBy: 'parent',
    };
    addMoodEntry(entry);
    setMood(3);
    setFocus(3);
    setSelectedBehaviors([]);
    setNotes('');
  };

  // Average mood last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentEntries = childEntries.filter(
    (e) => new Date(e.recordedAt) >= weekAgo
  );
  const avgMood =
    recentEntries.length > 0
      ? (recentEntries.reduce((s, e) => s + e.mood, 0) / recentEntries.length).toFixed(1)
      : null;
  const avgFocus =
    recentEntries.length > 0
      ? (recentEntries.reduce((s, e) => s + e.focus, 0) / recentEntries.length).toFixed(1)
      : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Mood & Behavior</Text>

        {/* Child selector */}
        {children.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childSelector}>
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={[styles.childChip, selectedChildId === child.id && styles.childChipActive]}
                onPress={() => setSelectedChildId(child.id)}
              >
                <Text>{child.avatarEmoji}</Text>
                <Text style={[styles.childChipName, selectedChildId === child.id && styles.childChipNameActive]}>
                  {child.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Weekly summary */}
        {recentEntries.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Last 7 Days</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryEmoji}>
                  {MOOD_OPTIONS.find((m) => m.level === Math.round(Number(avgMood)))?.emoji ?? '😐'}
                </Text>
                <Text style={styles.summaryValue}>{avgMood}</Text>
                <Text style={styles.summaryLabel}>Avg Mood</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryEmoji}>
                  {FOCUS_OPTIONS.find((f) => f.level === Math.round(Number(avgFocus)))?.emoji ?? '😶'}
                </Text>
                <Text style={styles.summaryValue}>{avgFocus}</Text>
                <Text style={styles.summaryLabel}>Avg Focus</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryEmoji}>📝</Text>
                <Text style={styles.summaryValue}>{recentEntries.length}</Text>
                <Text style={styles.summaryLabel}>Entries</Text>
              </View>
            </View>
          </View>
        )}

        {/* Tab bar */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, view === 'log' && styles.tabActive]}
            onPress={() => setView('log')}
          >
            <Text style={[styles.tabText, view === 'log' && styles.tabTextActive]}>Log Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, view === 'history' && styles.tabActive]}
            onPress={() => setView('history')}
          >
            <Text style={[styles.tabText, view === 'history' && styles.tabTextActive]}>
              History ({childEntries.length})
            </Text>
          </TouchableOpacity>
        </View>

        {view === 'log' && (
          <View style={styles.logForm}>
            {/* Mood */}
            <Text style={styles.sectionLabel}>How was their mood today?</Text>
            <View style={styles.moodRow}>
              {MOOD_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.level}
                  style={[styles.moodOption, mood === opt.level && styles.moodOptionActive]}
                  onPress={() => setMood(opt.level)}
                >
                  <Text style={styles.moodEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.moodLabel, mood === opt.level && styles.moodLabelActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Focus */}
            <Text style={styles.sectionLabel}>How was their focus?</Text>
            <View style={styles.moodRow}>
              {FOCUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.level}
                  style={[styles.moodOption, focus === opt.level && styles.moodOptionActive]}
                  onPress={() => setFocus(opt.level)}
                >
                  <Text style={styles.moodEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.moodLabel, focus === opt.level && styles.moodLabelActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Behavior tags */}
            <Text style={styles.sectionLabel}>Any notable behaviors? (optional)</Text>
            <View style={styles.tagsWrap}>
              {BEHAVIOR_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tag, selectedBehaviors.includes(tag) && styles.tagActive]}
                  onPress={() => toggleBehavior(tag)}
                >
                  <Text style={[styles.tagText, selectedBehaviors.includes(tag) && styles.tagTextActive]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Notes */}
            <Text style={styles.sectionLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Anything worth noting about today..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholderTextColor={colors.textMuted}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Entry</Text>
            </TouchableOpacity>
          </View>
        )}

        {view === 'history' && (
          <View>
            {childEntries.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>📊</Text>
                <Text style={styles.emptyText}>No entries yet. Start logging to see patterns.</Text>
              </View>
            ) : (
              childEntries.map((entry) => (
                <View key={entry.id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>
                      {new Date(entry.recordedAt).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric',
                      })}
                    </Text>
                    <View style={styles.historyScores}>
                      <Text style={styles.historyScore}>
                        {MOOD_OPTIONS.find((m) => m.level === entry.mood)?.emoji}
                      </Text>
                      <Text style={styles.historyScore}>
                        {FOCUS_OPTIONS.find((f) => f.level === entry.focus)?.emoji}
                      </Text>
                    </View>
                  </View>
                  {entry.behaviors.length > 0 && (
                    <View style={styles.entryTags}>
                      {entry.behaviors.map((b) => (
                        <View key={b} style={styles.entryTag}>
                          <Text style={styles.entryTagText}>{b}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {entry.notes ? <Text style={styles.entryNotes}>{entry.notes}</Text> : null}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  screenTitle: { fontSize: typography.fontSizeXXL, fontWeight: typography.fontWeightBold, color: colors.textPrimary, marginBottom: spacing.lg },
  childSelector: { marginBottom: spacing.lg },
  childChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, marginRight: spacing.sm, gap: spacing.xs },
  childChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  childChipName: { fontSize: typography.fontSizeSM, color: colors.textSecondary, fontWeight: typography.fontWeightMedium },
  childChipNameActive: { color: '#fff' },
  summaryCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  summaryTitle: { fontSize: typography.fontSizeXS, fontWeight: typography.fontWeightSemiBold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryEmoji: { fontSize: 28, marginBottom: 4 },
  summaryValue: { fontSize: typography.fontSizeXL, fontWeight: typography.fontWeightBold, color: colors.textPrimary },
  summaryLabel: { fontSize: typography.fontSizeXS, color: colors.textMuted },
  summaryDivider: { width: 1, height: 40, backgroundColor: colors.border },
  tabs: { flexDirection: 'row', backgroundColor: colors.border, borderRadius: radius.md, padding: 3, marginBottom: spacing.lg },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.surface },
  tabText: { fontSize: typography.fontSizeSM, color: colors.textSecondary, fontWeight: typography.fontWeightMedium },
  tabTextActive: { color: colors.primary, fontWeight: typography.fontWeightSemiBold },
  logForm: {},
  sectionLabel: { fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.xs },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  moodOption: { flex: 1, alignItems: 'center', padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: 'transparent' },
  moodOptionActive: { backgroundColor: colors.primaryLight + '33', borderColor: colors.primary },
  moodEmoji: { fontSize: 28, marginBottom: 4 },
  moodLabel: { fontSize: typography.fontSizeXS, color: colors.textMuted, textAlign: 'center' },
  moodLabelActive: { color: colors.primary, fontWeight: typography.fontWeightSemiBold },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  tag: { backgroundColor: colors.surface, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  tagActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  tagText: { fontSize: typography.fontSizeSM, color: colors.textSecondary },
  tagTextActive: { color: '#fff' },
  input: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, fontSize: typography.fontSizeMD, color: colors.textPrimary, marginBottom: spacing.md },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.xl, paddingVertical: spacing.md, alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  saveBtnText: { color: '#fff', fontWeight: typography.fontWeightBold, fontSize: typography.fontSizeLG },
  emptyCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.sm },
  emptyText: { fontSize: typography.fontSizeMD, color: colors.textSecondary, textAlign: 'center' },
  historyCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  historyDate: { fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary },
  historyScores: { flexDirection: 'row', gap: spacing.sm },
  historyScore: { fontSize: 22 },
  entryTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: spacing.xs },
  entryTag: { backgroundColor: colors.border, borderRadius: radius.full, paddingVertical: 2, paddingHorizontal: spacing.sm },
  entryTagText: { fontSize: typography.fontSizeXS, color: colors.textSecondary },
  entryNotes: { fontSize: typography.fontSizeSM, color: colors.textSecondary, fontStyle: 'italic' },
});
