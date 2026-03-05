import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/routineStore';
import { colors, spacing, typography, radius } from '../../theme';

export default function ProgressScreen() {
  const { parentProfile, routines, sessions } = useAppStore();
  const children = parentProfile?.childProfiles ?? [];
  const [selectedChildId, setSelectedChildId] = useState(children[0]?.id ?? '');

  const selectedChild = children.find((c) => c.id === selectedChildId);

  const childSessions = sessions.filter((s) => s.childProfileId === selectedChildId);
  const completedSessions = childSessions.filter((s) => !!s.completedAt);

  // Streak calculation
  const getStreak = () => {
    if (completedSessions.length === 0) return 0;
    const dates = completedSessions
      .map((s) => new Date(s.completedAt!).toDateString())
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(today);
      expected.setDate(today.getDate() - i);
      if (dates[i] === expected.toDateString()) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  // Stars earned
  const totalStars = completedSessions.reduce((acc, s) => {
    return acc + s.taskCompletions.length + 5; // 1 per task + 5 routine bonus
  }, 0);

  // This week's sessions
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeekSessions = completedSessions.filter(
    (s) => new Date(s.completedAt!) >= weekAgo
  );

  // Completion rate per routine
  const routineStats = routines.map((routine) => {
    const total = childSessions.filter((s) => s.routineId === routine.id).length;
    const completed = completedSessions.filter((s) => s.routineId === routine.id).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { routine, total, completed, rate };
  });

  const streak = getStreak();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Progress</Text>

        {/* Child selector */}
        {children.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childSelector}>
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={[styles.childChip, selectedChildId === child.id && styles.childChipActive]}
                onPress={() => setSelectedChildId(child.id)}
              >
                <Text style={styles.childChipEmoji}>{child.avatarEmoji}</Text>
                <Text style={[styles.childChipName, selectedChildId === child.id && styles.childChipNameActive]}>
                  {child.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Stats cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardAccent]}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statValue}>{totalStars}</Text>
            <Text style={styles.statLabel}>Total Stars</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>✅</Text>
            <Text style={styles.statValue}>{completedSessions.length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>📅</Text>
            <Text style={styles.statValue}>{thisWeekSessions.length}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
        </View>

        {/* Streak encouragement */}
        {streak > 0 && (
          <View style={styles.encouragementCard}>
            <Text style={styles.encouragementEmoji}>
              {streak >= 7 ? '🏆' : streak >= 3 ? '🌟' : '💪'}
            </Text>
            <Text style={styles.encouragementText}>
              {streak >= 7
                ? `${selectedChild?.name} is on a ${streak}-day streak! That's incredible!`
                : streak >= 3
                ? `${selectedChild?.name} has completed routines ${streak} days in a row!`
                : `Great start! ${selectedChild?.name} is building a habit!`}
            </Text>
          </View>
        )}

        {/* Routine breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Routine Completion</Text>
          {routineStats.length === 0 ? (
            <Text style={styles.emptyText}>No routines created yet.</Text>
          ) : (
            routineStats.map(({ routine, completed, total, rate }) => (
              <View key={routine.id} style={styles.routineStatCard}>
                <View style={styles.routineStatHeader}>
                  <Text style={styles.routineStatName}>{routine.name}</Text>
                  <Text style={styles.routineStatRate}>{rate}%</Text>
                </View>
                <View style={styles.routineProgressBar}>
                  <View style={[styles.routineProgressFill, { width: `${rate}%` }]} />
                </View>
                <Text style={styles.routineStatCount}>
                  {completed} of {total} attempts completed
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Weekly check-in */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Check-in</Text>
          <View style={styles.checkInCard}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (date.getDay() - 1) + i);
              const dateStr = date.toDateString();
              const hadSession = completedSessions.some(
                (s) => new Date(s.completedAt!).toDateString() === dateStr
              );
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <View key={day} style={styles.dayCol}>
                  <Text style={[styles.dayDot, hadSession ? styles.dayDotActive : isToday ? styles.dayDotToday : {}]}>
                    {hadSession ? '⭐' : '○'}
                  </Text>
                  <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{day}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  screenTitle: {
    fontSize: typography.fontSizeXXL,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  childSelector: { marginBottom: spacing.lg },
  childChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  childChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  childChipEmoji: { fontSize: 18 },
  childChipName: { fontSize: typography.fontSizeSM, color: colors.textSecondary, fontWeight: typography.fontWeightMedium },
  childChipNameActive: { color: '#fff' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardAccent: { backgroundColor: '#FFF3E0' },
  statEmoji: { fontSize: 28, marginBottom: spacing.xs },
  statValue: {
    fontSize: typography.fontSizeXXL,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
  },
  statLabel: { fontSize: typography.fontSizeXS, color: colors.textSecondary, marginTop: 2 },
  encouragementCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  encouragementEmoji: { fontSize: 36 },
  encouragementText: {
    flex: 1,
    fontSize: typography.fontSizeSM,
    color: '#2E7D32',
    fontWeight: typography.fontWeightMedium,
    lineHeight: 20,
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: typography.fontSizeLG,
    fontWeight: typography.fontWeightSemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: { fontSize: typography.fontSizeSM, color: colors.textMuted },
  routineStatCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  routineStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  routineStatName: { fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary },
  routineStatRate: { fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightBold, color: colors.primary },
  routineProgressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  routineProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  routineStatCount: { fontSize: typography.fontSizeXS, color: colors.textMuted },
  checkInCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: { alignItems: 'center', gap: spacing.xs },
  dayDot: { fontSize: 22, color: colors.border },
  dayDotActive: { color: colors.warning },
  dayDotToday: { color: colors.primaryLight },
  dayLabel: { fontSize: typography.fontSizeXS, color: colors.textMuted },
  dayLabelToday: { color: colors.primary, fontWeight: typography.fontWeightSemiBold },
});
