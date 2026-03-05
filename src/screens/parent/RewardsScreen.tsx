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
import { useAppStore } from '../../store/routineStore';
import { colors, spacing, typography, radius } from '../../theme';
import { generateId } from '../../utils';
import type { Reward } from '../../types';

const REWARD_PRESETS = [
  { title: 'Extra screen time (30 min)', icon: '📱', starCost: 10 },
  { title: 'Choose dinner', icon: '🍕', starCost: 15 },
  { title: 'Stay up 30 min later', icon: '🌙', starCost: 20 },
  { title: 'Pick a movie', icon: '🎬', starCost: 25 },
  { title: 'Playdate with a friend', icon: '👫', starCost: 30 },
  { title: 'Small toy or treat', icon: '🎁', starCost: 50 },
  { title: 'Family game night pick', icon: '🎮', starCost: 20 },
  { title: 'Skip one chore', icon: '🧹', starCost: 15 },
];

export default function RewardsScreen() {
  const { parentProfile, rewards, addReward, removeReward } = useAppStore();
  const [selectedChildId, setSelectedChildId] = useState(
    parentProfile?.childProfiles[0]?.id ?? ''
  );
  const [customTitle, setCustomTitle] = useState('');
  const [customIcon, setCustomIcon] = useState('🎁');
  const [customCost, setCustomCost] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  const children = parentProfile?.childProfiles ?? [];
  const selectedChild = children.find((c) => c.id === selectedChildId);
  const childRewards = rewards.filter((r) => r.childProfileId === selectedChildId);

  const addPresetReward = (preset: typeof REWARD_PRESETS[0]) => {
    if (!selectedChildId) return;
    const exists = childRewards.find((r) => r.title === preset.title);
    if (exists) {
      removeReward(exists.id);
    } else {
      addReward({ id: generateId(), ...preset, childProfileId: selectedChildId });
    }
  };

  const addCustomReward = () => {
    if (!customTitle.trim()) {
      Alert.alert('Missing title', 'Please enter a reward title.');
      return;
    }
    const cost = parseInt(customCost, 10);
    if (!customCost || isNaN(cost) || cost < 1) {
      Alert.alert('Invalid cost', 'Please enter a valid star cost.');
      return;
    }
    addReward({
      id: generateId(),
      title: customTitle.trim(),
      icon: customIcon,
      starCost: cost,
      childProfileId: selectedChildId,
    });
    setCustomTitle('');
    setCustomCost('');
    setShowCustomForm(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Rewards</Text>
        <Text style={styles.subtitle}>
          Set what your child can redeem their ⭐ stars for
        </Text>

        {/* Child selector */}
        {children.length > 1 && (
          <View style={styles.field}>
            <Text style={styles.label}>For</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {children.map((child) => (
                <TouchableOpacity
                  key={child.id}
                  style={[
                    styles.childChip,
                    selectedChildId === child.id && styles.childChipActive,
                  ]}
                  onPress={() => setSelectedChildId(child.id)}
                >
                  <Text style={styles.childChipEmoji}>{child.avatarEmoji}</Text>
                  <Text
                    style={[
                      styles.childChipName,
                      selectedChildId === child.id && styles.childChipNameActive,
                    ]}
                  >
                    {child.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Star balance info */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceEmoji}>{selectedChild?.avatarEmoji ?? '⭐'}</Text>
          <View>
            <Text style={styles.balanceName}>{selectedChild?.name ?? 'Select a child'}</Text>
            <Text style={styles.balanceStars}>⭐ 0 stars available</Text>
          </View>
        </View>

        {/* Preset rewards */}
        <View style={styles.field}>
          <Text style={styles.label}>Quick Add Rewards</Text>
          <Text style={styles.sublabel}>Tap to add or remove</Text>
          {REWARD_PRESETS.map((preset) => {
            const isAdded = childRewards.some((r) => r.title === preset.title);
            return (
              <TouchableOpacity
                key={preset.title}
                style={[styles.presetRow, isAdded && styles.presetRowActive]}
                onPress={() => addPresetReward(preset)}
              >
                <Text style={styles.presetIcon}>{preset.icon}</Text>
                <View style={styles.presetInfo}>
                  <Text style={[styles.presetTitle, isAdded && styles.presetTitleActive]}>
                    {preset.title}
                  </Text>
                  <Text style={[styles.presetCost, isAdded && styles.presetCostActive]}>
                    ⭐ {preset.starCost} stars
                  </Text>
                </View>
                <Text style={styles.presetToggle}>{isAdded ? '✓' : '+'}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Custom reward */}
        <View style={styles.field}>
          <Text style={styles.label}>Custom Reward</Text>
          {!showCustomForm ? (
            <TouchableOpacity
              style={styles.addCustomBtn}
              onPress={() => setShowCustomForm(true)}
            >
              <Text style={styles.addCustomBtnText}>+ Create custom reward</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.customForm}>
              <View style={styles.customIconRow}>
                <TextInput
                  style={[styles.input, styles.iconInput]}
                  value={customIcon}
                  onChangeText={setCustomIcon}
                  maxLength={2}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Reward title"
                  value={customTitle}
                  onChangeText={setCustomTitle}
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Star cost (e.g. 20)"
                value={customCost}
                onChangeText={setCustomCost}
                keyboardType="number-pad"
                placeholderTextColor={colors.textMuted}
              />
              <View style={styles.customFormActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowCustomForm(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addBtn} onPress={addCustomReward}>
                  <Text style={styles.addBtnText}>Add Reward</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Active rewards list */}
        {childRewards.length > 0 && (
          <View style={styles.field}>
            <Text style={styles.label}>Active Rewards for {selectedChild?.name}</Text>
            {childRewards.map((reward) => (
              <View key={reward.id} style={styles.activeRewardRow}>
                <Text style={styles.activeRewardIcon}>{reward.icon}</Text>
                <View style={styles.activeRewardInfo}>
                  <Text style={styles.activeRewardTitle}>{reward.title}</Text>
                  <Text style={styles.activeRewardCost}>⭐ {reward.starCost} stars</Text>
                </View>
                <TouchableOpacity onPress={() => removeReward(reward.id)}>
                  <Text style={styles.removeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
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
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSizeSM,
    color: colors.textSecondary,
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
    marginBottom: spacing.sm,
  },
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
  balanceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  balanceEmoji: { fontSize: 40 },
  balanceName: { fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary },
  balanceStars: { fontSize: typography.fontSizeSM, color: colors.textSecondary },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  presetRowActive: { borderColor: colors.primary, backgroundColor: '#F0EEFF' },
  presetIcon: { fontSize: 28 },
  presetInfo: { flex: 1 },
  presetTitle: { fontSize: typography.fontSizeMD, color: colors.textPrimary, fontWeight: typography.fontWeightMedium },
  presetTitleActive: { color: colors.primary },
  presetCost: { fontSize: typography.fontSizeXS, color: colors.textMuted, marginTop: 2 },
  presetCostActive: { color: colors.primaryLight },
  presetToggle: { fontSize: 20, color: colors.primary, fontWeight: typography.fontWeightBold },
  addCustomBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.md,
    alignItems: 'center',
  },
  addCustomBtnText: { fontSize: typography.fontSizeMD, color: colors.primary, fontWeight: typography.fontWeightMedium },
  customForm: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  customIconRow: { flexDirection: 'row', gap: spacing.sm },
  iconInput: { width: 56, textAlign: 'center', fontSize: 22 },
  customFormActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: typography.fontSizeMD, color: colors.textSecondary, fontWeight: typography.fontWeightMedium },
  addBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  addBtnText: { fontSize: typography.fontSizeMD, color: '#fff', fontWeight: typography.fontWeightSemiBold },
  activeRewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  activeRewardIcon: { fontSize: 28 },
  activeRewardInfo: { flex: 1 },
  activeRewardTitle: { fontSize: typography.fontSizeMD, color: colors.textPrimary, fontWeight: typography.fontWeightMedium },
  activeRewardCost: { fontSize: typography.fontSizeXS, color: colors.textMuted, marginTop: 2 },
  removeBtn: { fontSize: 18, color: colors.textMuted, padding: spacing.xs },
});
