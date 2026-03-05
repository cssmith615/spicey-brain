import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../store/routineStore';
import { colors, spacing, typography, radius } from '../../theme';
import { formatTime } from '../../utils';

const ROUTINE_TYPE_ICONS: Record<string, string> = {
  morning: '🌅',
  afternoon: '☀️',
  evening: '🌙',
  custom: '✨',
};

export default function RoutinesListScreen() {
  const navigation = useNavigation<any>();
  const { routines, updateRoutine } = useAppStore();

  const grouped = {
    morning: routines.filter((r) => r.type === 'morning'),
    afternoon: routines.filter((r) => r.type === 'afternoon'),
    evening: routines.filter((r) => r.type === 'evening'),
    custom: routines.filter((r) => r.type === 'custom'),
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Routines</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('CreateRoutine')}
          >
            <Text style={styles.addBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {routines.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No routines yet</Text>
            <Text style={styles.emptySubtitle}>Create your first routine to get started</Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate('CreateRoutine')}
            >
              <Text style={styles.createBtnText}>Create Routine</Text>
            </TouchableOpacity>
          </View>
        )}

        {Object.entries(grouped).map(([type, items]) => {
          if (items.length === 0) return null;
          return (
            <View key={type} style={styles.group}>
              <Text style={styles.groupTitle}>
                {ROUTINE_TYPE_ICONS[type]} {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
              {items.map((routine) => (
                <TouchableOpacity
                  key={routine.id}
                  style={styles.routineCard}
                  onPress={() => navigation.navigate('RoutineDetail', { routineId: routine.id })}
                >
                  <View style={styles.routineLeft}>
                    <Text style={styles.routineTime}>{formatTime(routine.scheduledTime)}</Text>
                    <Text style={styles.routineName}>{routine.name}</Text>
                    <Text style={styles.routineMeta}>
                      {routine.tasks.length} mission{routine.tasks.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={styles.routineRight}>
                    <Switch
                      value={routine.isActive}
                      onValueChange={(val) => updateRoutine(routine.id, { isActive: val })}
                      trackColor={{ false: colors.border, true: colors.primaryLight }}
                      thumbColor={routine.isActive ? colors.primary : colors.textMuted}
                    />
                    <Text style={styles.routineArrow}>›</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  screenTitle: {
    fontSize: typography.fontSizeXXL,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: typography.fontWeightSemiBold,
    fontSize: typography.fontSizeMD,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.sm },
  emptyTitle: {
    fontSize: typography.fontSizeLG,
    fontWeight: typography.fontWeightSemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.fontSizeSM,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  createBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: typography.fontWeightSemiBold,
    fontSize: typography.fontSizeMD,
  },
  group: { marginBottom: spacing.lg },
  groupTitle: {
    fontSize: typography.fontSizeXS,
    fontWeight: typography.fontWeightSemiBold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  routineCard: {
    backgroundColor: colors.surface,
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
  },
  routineLeft: { flex: 1 },
  routineTime: {
    fontSize: typography.fontSizeXS,
    color: colors.primary,
    fontWeight: typography.fontWeightSemiBold,
    marginBottom: 2,
  },
  routineName: {
    fontSize: typography.fontSizeMD,
    fontWeight: typography.fontWeightSemiBold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  routineMeta: { fontSize: typography.fontSizeXS, color: colors.textMuted },
  routineRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  routineArrow: { fontSize: 24, color: colors.textMuted },
});
