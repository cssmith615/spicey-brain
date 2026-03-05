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
import { generateId, getAgeGroup, AVATAR_OPTIONS } from '../../utils';
import type { ChildProfile } from '../../types';

export default function AddChildScreen() {
  const navigation = useNavigation<any>();
  const { addChildProfile, parentProfile } = useAppStore();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [deviceAccess, setDeviceAccess] = useState(true);
  const [pin, setPin] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter your child\'s name.');
      return;
    }
    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum) || ageNum < 3 || ageNum > 18) {
      Alert.alert('Invalid age', 'Please enter an age between 3 and 18.');
      return;
    }

    const child: ChildProfile = {
      id: generateId(),
      name: name.trim(),
      age: ageNum,
      ageGroup: getAgeGroup(ageNum),
      avatarEmoji: selectedAvatar,
      deviceAccessEnabled: deviceAccess,
      pin: pin.length === 4 ? pin : undefined,
      assignedRoutineIds: [],
    };

    addChildProfile(child);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Add a Kid</Text>

        {/* Avatar picker */}
        <View style={styles.field}>
          <Text style={styles.label}>Pick an Avatar</Text>
          <View style={styles.avatarGrid}>
            {AVATAR_OPTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[styles.avatarOption, selectedAvatar === emoji && styles.avatarSelected]}
                onPress={() => setSelectedAvatar(emoji)}
              >
                <Text style={styles.avatarEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Name */}
        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Alex"
            value={name}
            onChangeText={setName}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
          />
        </View>

        {/* Age */}
        <View style={styles.field}>
          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 8"
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            placeholderTextColor={colors.textMuted}
          />
          {age && !isNaN(parseInt(age)) && (
            <Text style={styles.ageGroupHint}>
              View mode: {getAgeGroup(parseInt(age)) === 'young'
                ? '🌟 Young Explorer (simplified, big icons)'
                : getAgeGroup(parseInt(age)) === 'middle'
                ? '🚀 Mission Mode (standard)'
                : '⚡ Teen Mode (minimal)'}
            </Text>
          )}
        </View>

        {/* Device access */}
        <View style={styles.field}>
          <Text style={styles.label}>Child Device Access</Text>
          <Text style={styles.sublabel}>Allow your child to view and complete missions on their own device</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleOption, deviceAccess && styles.toggleActive]}
              onPress={() => setDeviceAccess(true)}
            >
              <Text style={[styles.toggleText, deviceAccess && styles.toggleTextActive]}>✅ Enabled</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleOption, !deviceAccess && styles.toggleActive]}
              onPress={() => setDeviceAccess(false)}
            >
              <Text style={[styles.toggleText, !deviceAccess && styles.toggleTextActive]}>🔒 Disabled</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Child PIN */}
        {deviceAccess && (
          <View style={styles.field}>
            <Text style={styles.label}>Child Switch PIN (optional)</Text>
            <Text style={styles.sublabel}>4-digit PIN your child uses to switch to their view</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1234"
              value={pin}
              onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              maxLength={4}
            />
          </View>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Add {name || 'Kid'}</Text>
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
  ageGroupHint: {
    fontSize: typography.fontSizeXS,
    color: colors.primary,
    marginTop: spacing.xs,
    fontWeight: typography.fontWeightMedium,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  avatarOption: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '22',
  },
  avatarEmoji: { fontSize: 30 },
  toggleRow: { flexDirection: 'row', gap: spacing.sm },
  toggleOption: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  toggleText: {
    fontSize: typography.fontSizeMD,
    color: colors.textSecondary,
    fontWeight: typography.fontWeightMedium,
  },
  toggleTextActive: { color: '#fff' },
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
