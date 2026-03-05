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
import { formatTime } from '../../utils';
import MissionScreen from './MissionScreen';
import CompletionScreen from './CompletionScreen';
import RedeemScreen from './RedeemScreen';
import type { ChildProfile } from '../../types';

interface Props {
  child: ChildProfile;
  onExitToParent: () => void;
}

type ChildViewState =
  | { mode: 'home' }
  | { mode: 'mission'; routineId: string }
  | { mode: 'complete'; routineId: string; starsEarned: number }
  | { mode: 'redeem' };

export default function ChildHomeScreen({ child, onExitToParent }: Props) {
  const { routines, sessions } = useAppStore();
  const [viewState, setViewState] = useState<ChildViewState>({ mode: 'home' });

  const assignedRoutines = routines.filter(
    (r) => r.isActive && child.assignedRoutineIds.includes(r.id)
  );

  // Star balance
  const childSessions = sessions.filter(
    (s) => s.childProfileId === child.id && !!s.completedAt
  );
  const totalStars = childSessions.reduce(
    (acc, s) => acc + s.taskCompletions.length + 5,
    0
  );

  // Check if a routine was completed today
  const completedTodayIds = childSessions
    .filter((s) => new Date(s.completedAt!).toDateString() === new Date().toDateString())
    .map((s) => s.routineId);

  if (viewState.mode === 'mission') {
    return (
      <MissionScreen
        routineId={viewState.routineId}
        childId={child.id}
        onComplete={(stars) =>
          setViewState({ mode: 'complete', routineId: viewState.routineId, starsEarned: stars })
        }
      />
    );
  }

  if (viewState.mode === 'complete') {
    const routine = routines.find((r) => r.id === viewState.routineId);
    return (
      <CompletionScreen
        childName={child.name}
        routineName={routine?.name ?? 'Routine'}
        starsEarned={viewState.starsEarned}
        totalStars={totalStars + viewState.starsEarned}
        onDone={() => setViewState({ mode: 'home' })}
      />
    );
  }

  if (viewState.mode === 'redeem') {
    return (
      <RedeemScreen
        childId={child.id}
        childName={child.name}
        totalStars={totalStars}
        onBack={() => setViewState({ mode: 'home' })}
      />
    );
  }

  // Home view
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>{child.avatarEmoji}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Hi there,</Text>
            <Text style={styles.childName}>{child.name}!</Text>
          </View>
          <View style={styles.starsChip}>
            <Text style={styles.starsChipText}>⭐ {totalStars}</Text>
          </View>
        </View>

        {/* Brain character card */}
        <View style={styles.brainCard}>
          <Text style={styles.brainEmoji}>🧠</Text>
          <View style={styles.brainTextArea}>
            <Text style={styles.brainTitle}>Your Brain Today</Text>
            <Text style={styles.brainBody}>
              {completedTodayIds.length === 0
                ? "Ready for your missions? Let's power up! 💪"
                : completedTodayIds.length >= assignedRoutines.length
                ? 'You crushed all your missions today! 🏆'
                : `${completedTodayIds.length} of ${assignedRoutines.length} missions done. Keep going!`}
            </Text>
          </View>
        </View>

        {/* Missions */}
        <Text style={styles.sectionTitle}>
          {assignedRoutines.length === 0 ? 'No missions yet' : "Today's Missions"}
        </Text>

        {assignedRoutines.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyText}>Your parent hasn't set up any missions yet!</Text>
          </View>
        ) : (
          assignedRoutines.map((routine) => {
            const isDone = completedTodayIds.includes(routine.id);
            return (
              <TouchableOpacity
                key={routine.id}
                style={[styles.routineCard, isDone && styles.routineCardDone]}
                onPress={() =>
                  !isDone && setViewState({ mode: 'mission', routineId: routine.id })
                }
                activeOpacity={isDone ? 1 : 0.8}
              >
                <View style={styles.routineLeft}>
                  <Text style={styles.routineTime}>{formatTime(routine.scheduledTime)}</Text>
                  <Text style={[styles.routineName, isDone && styles.routineNameDone]}>
                    {routine.name}
                  </Text>
                  <Text style={styles.routineMissions}>
                    {routine.tasks.length} mission{routine.tasks.length !== 1 ? 's' : ''}
                    {' · '}⭐ {routine.tasks.length + 5} stars
                  </Text>
                </View>
                <Text style={styles.routineAction}>{isDone ? '✅' : '▶'}</Text>
              </TouchableOpacity>
            );
          })
        )}

        {/* Rewards card */}
        <TouchableOpacity
          style={styles.rewardsCard}
          onPress={() => setViewState({ mode: 'redeem' })}
          activeOpacity={0.8}
        >
          <View style={styles.rewardsLeft}>
            <Text style={styles.rewardsTitle}>⭐ Your Stars</Text>
            <Text style={styles.rewardsBalance}>{totalStars} stars</Text>
            <Text style={styles.rewardsHint}>Tap to redeem rewards!</Text>
          </View>
          <Text style={styles.rewardsArrow}>›</Text>
        </TouchableOpacity>

        {/* Exit to parent */}
        <TouchableOpacity style={styles.parentModeBtn} onPress={onExitToParent}>
          <Text style={styles.parentModeBtnText}>🔒 Parent Mode</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.childBackground },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: radius.full,
    backgroundColor: colors.childPending,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { fontSize: 36 },
  headerText: { flex: 1 },
  greeting: { fontSize: typography.fontSizeSM, color: colors.textSecondary },
  childName: {
    fontSize: typography.fontSizeXL,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
  },
  starsChip: {
    backgroundColor: '#FFF8E1',
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  starsChipText: {
    fontSize: typography.fontSizeMD,
    fontWeight: typography.fontWeightBold,
    color: '#F57F17',
  },
  brainCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  brainEmoji: { fontSize: 48 },
  brainTextArea: { flex: 1 },
  brainTitle: {
    fontSize: typography.fontSizeSM,
    fontWeight: typography.fontWeightSemiBold,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  brainBody: {
    fontSize: typography.fontSizeMD,
    fontWeight: typography.fontWeightSemiBold,
    color: '#fff',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: typography.fontSizeLG,
    fontWeight: typography.fontWeightSemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyCard: {
    backgroundColor: colors.childSurface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.sm },
  emptyText: {
    fontSize: typography.fontSizeMD,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  routineCard: {
    backgroundColor: colors.childSurface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  routineCardDone: {
    borderColor: colors.childComplete,
    backgroundColor: '#F1F8E9',
  },
  routineLeft: { flex: 1 },
  routineTime: {
    fontSize: typography.fontSizeXS,
    color: colors.primary,
    fontWeight: typography.fontWeightSemiBold,
    marginBottom: 2,
  },
  routineName: {
    fontSize: typography.fontSizeLG,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  routineNameDone: { color: colors.childComplete },
  routineMissions: { fontSize: typography.fontSizeXS, color: colors.textMuted },
  routineAction: { fontSize: 28 },
  rewardsCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  rewardsLeft: { flex: 1 },
  rewardsTitle: {
    fontSize: typography.fontSizeSM,
    color: '#F57F17',
    fontWeight: typography.fontWeightSemiBold,
    marginBottom: spacing.xs,
  },
  rewardsBalance: {
    fontSize: typography.fontSizeXXL,
    fontWeight: typography.fontWeightBold,
    color: '#F57F17',
    marginBottom: spacing.xs,
  },
  rewardsHint: { fontSize: typography.fontSizeXS, color: '#F9A825' },
  rewardsArrow: { fontSize: 28, color: '#F57F17' },
  parentModeBtn: {
    alignItems: 'center',
    padding: spacing.md,
  },
  parentModeBtnText: {
    fontSize: typography.fontSizeSM,
    color: colors.textMuted,
    fontWeight: typography.fontWeightMedium,
  },
});
