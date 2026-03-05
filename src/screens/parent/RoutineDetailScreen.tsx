import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppStore } from '../../store/routineStore';
import { colors, spacing, typography, radius } from '../../theme';
import { formatTime } from '../../utils';

export default function RoutineDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { routineId } = route.params;

  const { routines, updateRoutine, removeRoutine, parentProfile, updateChildProfile } =
    useAppStore();

  const routine = routines.find((r) => r.id === routineId);
  const children = parentProfile?.childProfiles ?? [];

  if (!routine) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.error}>Routine not found.</Text>
      </SafeAreaView>
    );
  }

  const assignedChildren = children.filter((c) =>
    c.assignedRoutineIds.includes(routineId)
  );

  const toggleChildAssignment = (childId: string) => {
    const child = children.find((c) => c.id === childId);
    if (!child) return;
    const isAssigned = child.assignedRoutineIds.includes(routineId);
    updateChildProfile(childId, {
      assignedRoutineIds: isAssigned
        ? child.assignedRoutineIds.filter((id) => id !== routineId)
        : [...child.assignedRoutineIds, routineId],
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Routine',
      `Are you sure you want to delete "${routine.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeRoutine(routineId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header info */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.routineName}>{routine.name}</Text>
              <Text style={styles.routineTime}>{formatTime(routine.scheduledTime)}</Text>
            </View>
            <View style={styles.activeToggle}>
              <Text style={styles.activeLabel}>Active</Text>
              <Switch
                value={routine.isActive}
                onValueChange={(val) => updateRoutine(routineId, { isActive: val })}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={routine.isActive ? colors.primary : colors.textMuted}
              />
            </View>
          </View>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{routine.type.toUpperCase()}</Text>
          </View>
        </View>

        {/* Assign to children */}
        {children.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assign to Kids</Text>
            {children.map((child) => {
              const isAssigned = child.assignedRoutineIds.includes(routineId);
              return (
                <TouchableOpacity
                  key={child.id}
                  style={styles.childRow}
                  onPress={() => toggleChildAssignment(child.id)}
                >
                  <Text style={styles.childAvatar}>{child.avatarEmoji}</Text>
                  <View style={styles.childInfo}>
                    <Text style={styles.childName}>{child.name}</Text>
                    <Text style={styles.childAge}>Age {child.age}</Text>
                  </View>
                  <View style={[styles.assignBadge, isAssigned && styles.assignBadgeActive]}>
                    <Text style={[styles.assignBadgeText, isAssigned && styles.assignBadgeTextActive]}>
                      {isAssigned ? '✓ Assigned' : 'Assign'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            {children.length === 0 && (
              <Text style={styles.hintText}>Add a child first to assign routines.</Text>
            )}
          </View>
        )}

        {/* Missions list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Missions ({routine.tasks.length})
          </Text>
          {routine.tasks
            .sort((a, b) => a.order - b.order)
            .map((task, i) => (
              <View key={task.id} style={styles.taskRow}>
                <Text style={styles.taskOrder}>{i + 1}</Text>
                <Text style={styles.taskIcon}>{task.icon}</Text>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskMeta}>
                    {task.durationMinutes ? `⏱ ${task.durationMinutes} min` : 'No timer'}
                    {task.isMedication ? ' · 💊 Medication' : ''}
                  </Text>
                </View>
              </View>
            ))}
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('CreateRoutine', { editId: routineId })}
        >
          <Text style={styles.editButtonText}>✏️ Edit Routine</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>🗑 Delete Routine</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  error: { padding: spacing.lg, color: colors.error },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  routineName: {
    fontSize: typography.fontSizeXXL,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
  },
  routineTime: {
    fontSize: typography.fontSizeMD,
    color: colors.primary,
    fontWeight: typography.fontWeightMedium,
    marginTop: 4,
  },
  activeToggle: { alignItems: 'center', gap: 4 },
  activeLabel: { fontSize: typography.fontSizeXS, color: colors.textSecondary },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.border,
    borderRadius: radius.full,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  typeBadgeText: {
    fontSize: typography.fontSizeXS,
    color: colors.textSecondary,
    fontWeight: typography.fontWeightSemiBold,
    letterSpacing: 0.5,
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: typography.fontSizeLG,
    fontWeight: typography.fontWeightSemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  childAvatar: { fontSize: 32 },
  childInfo: { flex: 1 },
  childName: { fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary },
  childAge: { fontSize: typography.fontSizeXS, color: colors.textMuted },
  assignBadge: {
    backgroundColor: colors.border,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  assignBadgeActive: { backgroundColor: colors.primaryLight },
  assignBadgeText: { fontSize: typography.fontSizeSM, color: colors.textSecondary, fontWeight: typography.fontWeightMedium },
  assignBadgeTextActive: { color: '#fff' },
  hintText: { fontSize: typography.fontSizeSM, color: colors.textMuted },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  taskOrder: {
    width: 24,
    fontSize: typography.fontSizeSM,
    color: colors.textMuted,
    fontWeight: typography.fontWeightSemiBold,
    textAlign: 'center',
  },
  taskIcon: { fontSize: 28 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightMedium, color: colors.textPrimary },
  taskMeta: { fontSize: typography.fontSizeXS, color: colors.textMuted, marginTop: 2 },
  editButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  editButtonText: { fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary },
  deleteButton: {
    backgroundColor: '#FFF0F0',
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  deleteButtonText: { fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold, color: colors.error },
});
