import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppStore } from '../../store/routineStore';
import { colors, spacing, typography, radius } from '../../theme';
import { generateId, TASK_PRESETS } from '../../utils';
import { scheduleRoutineReminder } from '../../utils/notifications';
import type { Routine, RoutineTask, RoutineType } from '../../types';

const ROUTINE_TYPES: { label: string; value: RoutineType; icon: string }[] = [
  { label: 'Morning', value: 'morning', icon: '🌅' },
  { label: 'Afternoon', value: 'afternoon', icon: '☀️' },
  { label: 'Evening', value: 'evening', icon: '🌙' },
  { label: 'Custom', value: 'custom', icon: '✨' },
];

export default function CreateRoutineScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editId: string | undefined = route.params?.editId;

  const { addRoutine, updateRoutine, routines, parentProfile } = useAppStore();
  const existing = editId ? routines.find((r) => r.id === editId) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [routineType, setRoutineType] = useState<RoutineType>(existing?.type ?? 'morning');
  const [scheduledTime, setScheduledTime] = useState(existing?.scheduledTime ?? '07:00');
  const [selectedTasks, setSelectedTasks] = useState<RoutineTask[]>(existing?.tasks ?? []);
  const [parentNote, setParentNote] = useState('');

  const togglePresetTask = (preset: typeof TASK_PRESETS[0]) => {
    const exists = selectedTasks.find((t) => t.title === preset.title);
    if (exists) {
      setSelectedTasks((prev) => prev.filter((t) => t.title !== preset.title));
    } else {
      setSelectedTasks((prev) => [
        ...prev,
        {
          id: generateId(),
          title: preset.title,
          icon: preset.icon,
          durationMinutes: preset.durationMinutes || undefined,
          isMedication: (preset as any).isMedication ?? false,
          order: prev.length,
        },
      ]);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please give your routine a name.');
      return;
    }
    if (selectedTasks.length === 0) {
      Alert.alert('No missions', 'Add at least one mission to the routine.');
      return;
    }

    const tasks = selectedTasks.map((t, i) => ({ ...t, order: i }));

    if (editId && existing) {
      updateRoutine(editId, { name: name.trim(), type: routineType, scheduledTime, tasks });
      scheduleRoutineReminder({ ...existing, name: name.trim(), scheduledTime, tasks });
    } else {
      const routine: Routine = {
        id: generateId(),
        name: name.trim(),
        type: routineType,
        scheduledTime,
        tasks,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      addRoutine(routine);
      scheduleRoutineReminder(routine);
    }

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>{editId ? 'Edit Routine' : 'New Routine'}</Text>

        {/* Name */}
        <View style={styles.field}>
          <Text style={styles.label}>Routine Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Morning Routine"
            value={name}
            onChangeText={setName}
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Type */}
        <View style={styles.field}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.typeRow}>
            {ROUTINE_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[styles.typeChip, routineType === t.value && styles.typeChipActive]}
                onPress={() => setRoutineType(t.value)}
              >
                <Text style={styles.typeChipIcon}>{t.icon}</Text>
                <Text
                  style={[
                    styles.typeChipLabel,
                    routineType === t.value && styles.typeChipLabelActive,
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Time */}
        <View style={styles.field}>
          <Text style={styles.label}>Scheduled Time (HH:MM)</Text>
          <TextInput
            style={styles.input}
            placeholder="07:00"
            value={scheduledTime}
            onChangeText={setScheduledTime}
            keyboardType="numbers-and-punctuation"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Mission presets */}
        <View style={styles.field}>
          <Text style={styles.label}>Missions</Text>
          <Text style={styles.sublabel}>Tap to add or remove</Text>
          <View style={styles.presetsGrid}>
            {TASK_PRESETS.map((preset) => {
              const isSelected = selectedTasks.some((t) => t.title === preset.title);
              return (
                <TouchableOpacity
                  key={preset.title}
                  style={[styles.presetChip, isSelected && styles.presetChipActive]}
                  onPress={() => togglePresetTask(preset)}
                >
                  <Text style={styles.presetIcon}>{preset.icon}</Text>
                  <Text
                    style={[
                      styles.presetLabel,
                      isSelected && styles.presetLabelActive,
                    ]}
                  >
                    {preset.title}
                  </Text>
                  {isSelected && <Text style={styles.presetCheck}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected count */}
        {selectedTasks.length > 0 && (
          <Text style={styles.selectedCount}>
            {selectedTasks.length} mission{selectedTasks.length !== 1 ? 's' : ''} selected
          </Text>
        )}

        {/* Parent note */}
        <View style={styles.field}>
          <Text style={styles.label}>Encouragement Note (optional)</Text>
          <Text style={styles.sublabel}>Your child will see this before starting</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="You've got this! I believe in you 💪"
            value={parentNote}
            onChangeText={setParentNote}
            multiline
            numberOfLines={3}
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Routine</Text>
        </TouchableOpacity>
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
  field: { marginBottom: spacing.lg },
  label: {
    fontSize: typography.fontSizeMD,
    fontWeight: typography.fontWeightSemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sublabel: {
    fontSize: typography.fontSizeXS,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSizeMD,
    color: colors.textPrimary,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', gap: spacing.sm },
  typeChip: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    alignItems: 'center',
  },
  typeChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  typeChipIcon: { fontSize: 20, marginBottom: 2 },
  typeChipLabel: {
    fontSize: typography.fontSizeXS,
    color: colors.textSecondary,
    fontWeight: typography.fontWeightMedium,
  },
  typeChipLabelActive: { color: '#fff' },
  presetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    gap: 4,
  },
  presetChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  presetIcon: { fontSize: 16 },
  presetLabel: {
    fontSize: typography.fontSizeSM,
    color: colors.textSecondary,
  },
  presetLabelActive: { color: '#fff' },
  presetCheck: { fontSize: 12, color: '#fff', fontWeight: typography.fontWeightBold },
  selectedCount: {
    fontSize: typography.fontSizeSM,
    color: colors.primary,
    fontWeight: typography.fontWeightSemiBold,
    marginBottom: spacing.md,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  saveButtonText: {
    fontSize: typography.fontSizeLG,
    fontWeight: typography.fontWeightBold,
    color: '#fff',
  },
});
