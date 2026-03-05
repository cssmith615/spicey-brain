import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/routineStore';
import { colors, spacing, typography, radius } from '../../theme';
import { generateId } from '../../utils';
import type { MedicationEntry, MedicationLog } from '../../types';

// All times from 6:00 AM to 10:00 PM in 30-min increments
const TIME_PRESETS: string[] = (() => {
  const times: string[] = [];
  for (let h = 6; h <= 22; h++) {
    times.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 22) times.push(`${String(h).padStart(2, '0')}:30`);
  }
  return times;
})();

const formatTimeLabel = (time: string): string => {
  const [hourStr, min] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 || 12;
  return `${display}:${min}\n${period}`;
};

export default function MedicationScreen() {
  const { parentProfile, medications, addMedication, updateMedication, removeMedication } = useAppStore();
  const children = parentProfile?.childProfiles ?? [];

  const [selectedChildId, setSelectedChildId] = useState(children[0]?.id ?? '');
  const [showForm, setShowForm] = useState(false);
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');
  const [selectedTimes, setSelectedTimes] = useState<string[]>(['08:00']);
  const [notes, setNotes] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(true);

  const childMeds = medications.filter((m) => m.childProfileId === selectedChildId);
  const selectedChild = children.find((c) => c.id === selectedChildId);

  const toggleTime = (time: string) => {
    setSelectedTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  const handleSave = () => {
    if (!medName.trim()) {
      Alert.alert('Missing name', 'Please enter the medication name.');
      return;
    }
    if (selectedTimes.length === 0) {
      Alert.alert('No times set', 'Please select at least one time.');
      return;
    }

    const entry: MedicationEntry = {
      id: generateId(),
      childProfileId: selectedChildId,
      name: medName.trim(),
      dosage: dosage.trim(),
      times: selectedTimes,
      notes: notes.trim(),
      reminderEnabled,
      logHistory: [],
    };

    addMedication(entry);
    setShowForm(false);
    setMedName('');
    setDosage('');
    setSelectedTimes(['08:00']);
    setNotes('');
  };

  const toggleReminder = (id: string, enabled: boolean) => {
    updateMedication(id, { reminderEnabled: enabled });
  };

  const logDose = (med: MedicationEntry, scheduledTime: string, skipped = false) => {
    const log: MedicationLog = {
      id: generateId(),
      takenAt: new Date().toISOString(),
      scheduledTime,
      skipped,
    };
    updateMedication(med.id, { logHistory: [log, ...med.logHistory] });
  };

  const handleRemoveMedication = (id: string) => {
    Alert.alert('Remove Medication', 'Remove this medication and its history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeMedication(id),
      },
    ]);
  };

  const todayLogs = (med: MedicationEntry) =>
    med.logHistory.filter(
      (l) => new Date(l.takenAt).toDateString() === new Date().toDateString()
    );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Medication</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm((v) => !v)}>
            <Text style={styles.addBtnText}>{showForm ? '✕ Cancel' : '+ Add'}</Text>
          </TouchableOpacity>
        </View>

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

        {/* Add form */}
        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>New Medication for {selectedChild?.name}</Text>

            <Text style={styles.label}>Medication Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Adderall, Ritalin"
              value={medName}
              onChangeText={setMedName}
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>Dosage (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 10mg"
              value={dosage}
              onChangeText={setDosage}
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>Reminder Times</Text>
            <Text style={styles.sublabel}>Scroll and tap to select one or more times</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timesScroll} contentContainerStyle={styles.timesScrollContent}>
              {TIME_PRESETS.map((time) => {
                const active = selectedTimes.includes(time);
                return (
                  <TouchableOpacity
                    key={time}
                    style={[styles.timeChip, active && styles.timeChipActive]}
                    onPress={() => toggleTime(time)}
                  >
                    <Text style={[styles.timeChipText, active && styles.timeChipTextActive]}>
                      {formatTimeLabel(time)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {selectedTimes.length > 0 && (
              <Text style={styles.selectedTimesLabel}>
                Selected: {selectedTimes.map((t) => formatTimeLabel(t).replace('\n', ' ')).join(', ')}
              </Text>
            )}

            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. Take with food"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.reminderRow}>
              <Text style={styles.label}>Push Reminders</Text>
              <Switch
                value={reminderEnabled}
                onValueChange={setReminderEnabled}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={reminderEnabled ? colors.primary : colors.textMuted}
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Medication</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Medication list */}
        {childMeds.length === 0 && !showForm ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>💊</Text>
            <Text style={styles.emptyTitle}>No medications added</Text>
            <Text style={styles.emptySubtitle}>
              Add medications to track doses and set reminders
            </Text>
          </View>
        ) : (
          childMeds.map((med) => {
            const logged = todayLogs(med);
            const allDosesToday = med.times.length;
            const takenToday = logged.filter((l) => !l.skipped).length;

            return (
              <View key={med.id} style={styles.medCard}>
                <View style={styles.medHeader}>
                  <View style={styles.medIconCircle}>
                    <Text style={styles.medIcon}>💊</Text>
                  </View>
                  <View style={styles.medInfo}>
                    <Text style={styles.medName}>{med.name}</Text>
                    {med.dosage ? <Text style={styles.medDosage}>{med.dosage}</Text> : null}
                    <Text style={styles.medTimes}>{med.times.join(' · ')}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveMedication(med.id)}>
                    <Text style={styles.removeBtn}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Today's progress */}
                <View style={styles.todayRow}>
                  <Text style={styles.todayLabel}>Today</Text>
                  <Text style={styles.todayCount}>
                    {takenToday}/{allDosesToday} doses
                  </Text>
                </View>
                <View style={styles.doseProgressBar}>
                  <View
                    style={[
                      styles.doseProgressFill,
                      { width: `${allDosesToday > 0 ? (takenToday / allDosesToday) * 100 : 0}%` },
                    ]}
                  />
                </View>

                {/* Quick log buttons */}
                <View style={styles.logRow}>
                  {med.times.map((time) => {
                    const alreadyLogged = logged.some((l) => l.scheduledTime === time);
                    return (
                      <TouchableOpacity
                        key={time}
                        style={[styles.logBtn, alreadyLogged && styles.logBtnDone]}
                        onPress={() => !alreadyLogged && logDose(med, time)}
                        disabled={alreadyLogged}
                      >
                        <Text style={styles.logBtnTime}>{time}</Text>
                        <Text style={styles.logBtnStatus}>{alreadyLogged ? '✓ Given' : 'Log'}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  screenTitle: { fontSize: typography.fontSizeXXL, fontWeight: typography.fontWeightBold, color: colors.textPrimary },
  addBtn: { backgroundColor: colors.primary, borderRadius: radius.full, paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  addBtnText: { color: '#fff', fontWeight: typography.fontWeightSemiBold, fontSize: typography.fontSizeMD },
  childSelector: { marginBottom: spacing.lg },
  childChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, marginRight: spacing.sm, gap: spacing.xs },
  childChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  childChipEmoji: { fontSize: 18 },
  childChipName: { fontSize: typography.fontSizeSM, color: colors.textSecondary, fontWeight: typography.fontWeightMedium },
  childChipNameActive: { color: '#fff' },
  formCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  formTitle: { fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary, marginBottom: spacing.md },
  label: { fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.xs },
  input: { backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, fontSize: typography.fontSizeMD, color: colors.textPrimary, marginBottom: spacing.sm },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  sublabel: { fontSize: typography.fontSizeXS, color: colors.textMuted, marginBottom: spacing.sm },
  timesScroll: { marginBottom: spacing.xs },
  timesScrollContent: { gap: spacing.sm, paddingVertical: spacing.xs, paddingHorizontal: 2 },
  timeChip: { backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, alignItems: 'center', minWidth: 52 },
  timeChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  timeChipText: { fontSize: typography.fontSizeXS, color: colors.textSecondary, fontWeight: typography.fontWeightMedium, textAlign: 'center' },
  timeChipTextActive: { color: '#fff' },
  selectedTimesLabel: { fontSize: typography.fontSizeXS, color: colors.primary, fontWeight: typography.fontWeightMedium, marginBottom: spacing.sm },
  reminderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.xl, paddingVertical: spacing.md, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: typography.fontWeightBold, fontSize: typography.fontSizeMD },
  emptyCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.sm },
  emptyTitle: { fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary, marginBottom: spacing.xs },
  emptySubtitle: { fontSize: typography.fontSizeSM, color: colors.textSecondary, textAlign: 'center' },
  medCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  medHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  medIconCircle: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center' },
  medIcon: { fontSize: 22 },
  medInfo: { flex: 1 },
  medName: { fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary },
  medDosage: { fontSize: typography.fontSizeXS, color: colors.primary, fontWeight: typography.fontWeightMedium },
  medTimes: { fontSize: typography.fontSizeXS, color: colors.textMuted, marginTop: 2 },
  removeBtn: { fontSize: 18, color: colors.textMuted, padding: spacing.xs },
  todayRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  todayLabel: { fontSize: typography.fontSizeXS, color: colors.textSecondary },
  todayCount: { fontSize: typography.fontSizeXS, color: colors.primary, fontWeight: typography.fontWeightSemiBold },
  doseProgressBar: { height: 6, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden', marginBottom: spacing.md },
  doseProgressFill: { height: '100%', backgroundColor: colors.success, borderRadius: radius.full },
  logRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  logBtn: { flex: 1, minWidth: 70, backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, alignItems: 'center' },
  logBtnDone: { backgroundColor: '#E8F5E9', borderColor: colors.success },
  logBtnTime: { fontSize: typography.fontSizeXS, color: colors.textSecondary, fontWeight: typography.fontWeightSemiBold },
  logBtnStatus: { fontSize: typography.fontSizeXS, color: colors.textMuted, marginTop: 2 },
});
