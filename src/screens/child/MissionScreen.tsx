import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/routineStore';
import { colors, spacing, typography, radius } from '../../theme';
import { STAR_REWARDS } from '../../utils';
import type { RoutineTask } from '../../types';

interface Props {
  routineId: string;
  childId: string;
  onComplete: (starsEarned: number) => void;
}

export default function MissionScreen({ routineId, childId, onComplete }: Props) {
  const { routines, startSession, updateSession } = useAppStore();
  const routine = routines.find((r) => r.id === routineId);
  const tasks = routine?.tasks ?? [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [sessionId] = useState(`session_${Date.now()}`);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [starsEarned, setStarsEarned] = useState(0);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentTask: RoutineTask | undefined = tasks[currentIndex];
  const isLastTask = currentIndex === tasks.length - 1;
  const progress = tasks.length > 0 ? completedIds.length / tasks.length : 0;

  useEffect(() => {
    startSession({
      id: sessionId,
      routineId,
      childProfileId: childId,
      startedAt: new Date().toISOString(),
      taskCompletions: [],
    });
  }, []);

  useEffect(() => {
    if (currentTask?.durationMinutes) {
      setTimeLeft(currentTask.durationMinutes * 60);
    } else {
      setTimeLeft(null);
    }
    setTimerActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [currentIndex]);

  useEffect(() => {
    if (timerActive && timeLeft !== null && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => (t !== null ? t - 1 : null));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, timeLeft]);

  const formatTimeLeft = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleComplete = () => {
    if (!currentTask) return;

    // Animate completion
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.2, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();

    Vibration.vibrate(100);

    const newCompleted = [...completedIds, currentTask.id];
    setCompletedIds(newCompleted);

    const newStars = starsEarned + STAR_REWARDS.taskComplete;
    setStarsEarned(newStars);

    updateSession(sessionId, {
      taskCompletions: newCompleted.map((id) => ({
        taskId: id,
        completedAt: new Date().toISOString(),
      })),
    });

    if (isLastTask) {
      const totalStars = newStars + STAR_REWARDS.routineComplete;
      updateSession(sessionId, { completedAt: new Date().toISOString() });
      setTimeout(() => onComplete(totalStars), 600);
    } else {
      setTimeout(() => setCurrentIndex((i) => i + 1), 500);
    }
  };

  if (!currentTask) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {completedIds.length}/{tasks.length}
        </Text>
      </View>

      {/* Stars earned */}
      <View style={styles.starsRow}>
        <Text style={styles.starsText}>⭐ {starsEarned}</Text>
      </View>

      {/* Task card */}
      <View style={styles.taskArea}>
        <Animated.View style={[styles.taskCard, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.taskIcon}>{currentTask.icon}</Text>
          <Text style={styles.taskTitle}>{currentTask.title}</Text>
          {currentTask.isMedication && (
            <View style={styles.medicationBadge}>
              <Text style={styles.medicationText}>💊 Medication</Text>
            </View>
          )}

          {/* Timer */}
          {currentTask.durationMinutes && timeLeft !== null && (
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>{formatTimeLeft(timeLeft)}</Text>
              <TouchableOpacity
                style={styles.timerToggle}
                onPress={() => setTimerActive((a) => !a)}
              >
                <Text style={styles.timerToggleText}>{timerActive ? '⏸ Pause' : '▶ Start timer'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Mission count context */}
        <Text style={styles.missionContext}>
          Mission {currentIndex + 1} of {tasks.length}
        </Text>
      </View>

      {/* Done button */}
      <TouchableOpacity style={styles.doneButton} onPress={handleComplete} activeOpacity={0.85}>
        <Text style={styles.doneButtonText}>
          {isLastTask ? '🎉 All done!' : "✅ I did it!"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.childBackground,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: colors.childPending,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.childComplete,
    borderRadius: radius.full,
  },
  progressText: {
    fontSize: typography.fontSizeSM,
    color: colors.textSecondary,
    fontWeight: typography.fontWeightSemiBold,
    minWidth: 32,
  },
  starsRow: {
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  starsText: {
    fontSize: typography.fontSizeLG,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
  },
  taskArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskCard: {
    backgroundColor: colors.childSurface,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: spacing.lg,
  },
  taskIcon: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  taskTitle: {
    fontSize: typography.fontSizeXXL,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  medicationBadge: {
    backgroundColor: '#FFF3E0',
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  medicationText: {
    fontSize: typography.fontSizeSM,
    color: colors.warning,
    fontWeight: typography.fontWeightSemiBold,
  },
  timerContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  timerText: {
    fontSize: typography.fontSizeHero,
    fontWeight: typography.fontWeightBold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  timerToggle: {
    backgroundColor: colors.childPending,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  timerToggleText: {
    fontSize: typography.fontSizeSM,
    color: colors.primary,
    fontWeight: typography.fontWeightSemiBold,
  },
  missionContext: {
    fontSize: typography.fontSizeSM,
    color: colors.textMuted,
    fontWeight: typography.fontWeightMedium,
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  doneButtonText: {
    fontSize: typography.fontSizeXL,
    fontWeight: typography.fontWeightBold,
    color: '#fff',
  },
});
