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
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../store/routineStore';
import { colors, spacing, typography, radius } from '../../theme';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { parentProfile, setParentProfile } = useAppStore();

  const [name, setName] = useState(parentProfile?.name ?? '');
  const [showPinChange, setShowPinChange] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSaveName = () => {
    if (!name.trim() || !parentProfile) return;
    setParentProfile({ ...parentProfile, name: name.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChangePin = () => {
    if (!parentProfile) return;
    if (currentPin !== parentProfile.pin) {
      setPinError('Current PIN is incorrect');
      return;
    }
    if (newPin.length !== 4) {
      setPinError('New PIN must be 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('New PINs do not match');
      return;
    }
    setParentProfile({ ...parentProfile, pin: newPin });
    setShowPinChange(false);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setPinError('');
    Alert.alert('PIN Updated', 'Your parent PIN has been changed successfully.');
  };

  const handleResetApp = () => {
    Alert.alert(
      'Reset App',
      'This will delete all routines, children, and progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: () => {
            setParentProfile(null as any);
            navigation.replace('Onboarding');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Settings</Text>

        {/* Profile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Your Name</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={name}
                onChangeText={setName}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
              />
              <TouchableOpacity
                style={[styles.saveBtn, saved && styles.saveBtnDone]}
                onPress={handleSaveName}
              >
                <Text style={styles.saveBtnText}>{saved ? '✓' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={() => setShowPinChange((v) => !v)}
            >
              <View>
                <Text style={styles.settingsRowTitle}>Change Parent PIN</Text>
                <Text style={styles.settingsRowSubtitle}>Update your 4-digit access code</Text>
              </View>
              <Text style={styles.chevron}>{showPinChange ? '▲' : '›'}</Text>
            </TouchableOpacity>

            {showPinChange && (
              <View style={styles.pinForm}>
                <Text style={styles.label}>Current PIN</Text>
                <TextInput
                  style={styles.input}
                  value={currentPin}
                  onChangeText={(t) => { setCurrentPin(t.replace(/\D/g, '').slice(0, 4)); setPinError(''); }}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                  placeholder="Current PIN"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={styles.label}>New PIN</Text>
                <TextInput
                  style={styles.input}
                  value={newPin}
                  onChangeText={(t) => { setNewPin(t.replace(/\D/g, '').slice(0, 4)); setPinError(''); }}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                  placeholder="New 4-digit PIN"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={styles.label}>Confirm New PIN</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPin}
                  onChangeText={(t) => { setConfirmPin(t.replace(/\D/g, '').slice(0, 4)); setPinError(''); }}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                  placeholder="Repeat new PIN"
                  placeholderTextColor={colors.textMuted}
                />
                {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}
                <TouchableOpacity style={styles.updatePinBtn} onPress={handleChangePin}>
                  <Text style={styles.updatePinBtnText}>Update PIN</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>App</Text>
              <Text style={styles.aboutValue}>Spicey Brain</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Version</Text>
              <Text style={styles.aboutValue}>0.1.0</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Built for</Text>
              <Text style={styles.aboutValue}>Kids with ADHD & their parents 💜</Text>
            </View>
          </View>
        </View>

        {/* Danger zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.error }]}>Danger Zone</Text>
          <TouchableOpacity style={styles.resetBtn} onPress={handleResetApp}>
            <Text style={styles.resetBtnText}>Reset App Data</Text>
          </TouchableOpacity>
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
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: typography.fontSizeXS,
    fontWeight: typography.fontWeightSemiBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: typography.fontSizeSM,
    fontWeight: typography.fontWeightSemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSizeMD,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  inputRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  saveBtnDone: { backgroundColor: colors.success },
  saveBtnText: { color: '#fff', fontWeight: typography.fontWeightSemiBold, fontSize: typography.fontSizeMD },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  settingsRowTitle: {
    fontSize: typography.fontSizeMD,
    fontWeight: typography.fontWeightMedium,
    color: colors.textPrimary,
  },
  settingsRowSubtitle: {
    fontSize: typography.fontSizeXS,
    color: colors.textMuted,
    marginTop: 2,
  },
  chevron: { fontSize: 20, color: colors.textMuted },
  pinForm: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  pinError: { fontSize: typography.fontSizeSM, color: colors.error, marginBottom: spacing.sm, textAlign: 'center' },
  updatePinBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  updatePinBtnText: { color: '#fff', fontWeight: typography.fontWeightSemiBold, fontSize: typography.fontSizeMD },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  aboutLabel: { fontSize: typography.fontSizeSM, color: colors.textSecondary },
  aboutValue: { fontSize: typography.fontSizeSM, color: colors.textPrimary, fontWeight: typography.fontWeightMedium },
  divider: { height: 1, backgroundColor: colors.border },
  resetBtn: {
    backgroundColor: '#FFF0F0',
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  resetBtnText: { fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold, color: colors.error },
});
