import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/routineStore';
import { colors, spacing, typography, radius } from '../../theme';
import { generateId } from '../../utils';
import { sendApprovalNotification } from '../../utils/notifications';
import type { Reward } from '../../types';

interface Props {
  childId: string;
  childName: string;
  totalStars: number;
  onBack: () => void;
}

export default function RedeemScreen({ childId, childName, totalStars, onBack }: Props) {
  const { rewards, redemptionRequests, addRedemptionRequest } = useAppStore();

  const childRewards = rewards.filter((r) => r.childProfileId === childId);
  const childRequests = redemptionRequests.filter((r) => r.childProfileId === childId);

  const canAfford = (cost: number) => totalStars >= cost;
  const isPending = (rewardId: string) =>
    childRequests.some((r) => r.rewardId === rewardId && r.status === 'pending');

  const handleRedeem = (reward: Reward) => {
    if (!canAfford(reward.starCost)) {
      Alert.alert(
        'Not enough stars',
        `You need ${reward.starCost} stars but only have ${totalStars}. Keep completing missions!`
      );
      return;
    }
    if (isPending(reward.id)) {
      Alert.alert('Already requested', 'This reward is waiting for your parent to approve!');
      return;
    }
    Alert.alert(
      `Redeem ${reward.title}?`,
      `This will use ${reward.starCost} ⭐ stars. Your parent will need to approve it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request It!',
          onPress: () => {
            addRedemptionRequest({
              id: generateId(),
              rewardId: reward.id,
              rewardTitle: reward.title,
              rewardIcon: reward.icon,
              starCost: reward.starCost,
              childProfileId: childId,
              childName,
              requestedAt: new Date().toISOString(),
              status: 'pending',
            });
            sendApprovalNotification(childName, reward.title);
          },
        },
      ]
    );
  };

  const pendingList = childRequests.filter((r) => r.status === 'pending');

  return (
    <SafeAreaView style={styles.container}>
      {/* Back header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Rewards Shop</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceEmoji}>⭐</Text>
          <View>
            <Text style={styles.balanceLabel}>Your Stars</Text>
            <Text style={styles.balanceAmount}>{totalStars} stars</Text>
          </View>
        </View>

        {/* Pending requests */}
        {pendingList.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⏳ Waiting for Approval</Text>
            {pendingList.map((req) => (
              <View key={req.id} style={styles.pendingCard}>
                <Text style={styles.pendingIcon}>{req.rewardIcon}</Text>
                <View style={styles.pendingInfo}>
                  <Text style={styles.pendingTitle}>{req.rewardTitle}</Text>
                  <Text style={styles.pendingStatus}>Waiting for parent...</Text>
                </View>
                <Text style={styles.pendingCost}>⭐ {req.starCost}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Rewards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Rewards</Text>

          {childRewards.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🎁</Text>
              <Text style={styles.emptyText}>
                Your parent hasn't set up any rewards yet. Ask them to add some!
              </Text>
            </View>
          ) : (
            childRewards.map((reward) => {
              const affordable = canAfford(reward.starCost);
              const pending = isPending(reward.id);
              return (
                <TouchableOpacity
                  key={reward.id}
                  style={[
                    styles.rewardCard,
                    !affordable && styles.rewardCardLocked,
                    pending && styles.rewardCardPending,
                  ]}
                  onPress={() => handleRedeem(reward)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.rewardIcon}>{reward.icon}</Text>
                  <View style={styles.rewardInfo}>
                    <Text style={[styles.rewardTitle, !affordable && styles.rewardTitleLocked]}>
                      {reward.title}
                    </Text>
                    <View style={styles.costRow}>
                      <Text style={[styles.rewardCost, !affordable && styles.rewardCostLocked]}>
                        ⭐ {reward.starCost} stars
                      </Text>
                      {!affordable && (
                        <Text style={styles.needMore}>
                          Need {reward.starCost - totalStars} more
                        </Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.rewardAction}>
                    {pending ? '⏳' : affordable ? '›' : '🔒'}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.childBackground },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.childBackground,
  },
  backBtn: { width: 70 },
  backBtnText: { fontSize: typography.fontSizeMD, color: colors.primary, fontWeight: typography.fontWeightMedium },
  topTitle: { fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightBold, color: colors.textPrimary },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  balanceCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  balanceEmoji: { fontSize: 48 },
  balanceLabel: { fontSize: typography.fontSizeSM, color: '#F57F17' },
  balanceAmount: {
    fontSize: typography.fontSizeXXL,
    fontWeight: typography.fontWeightBold,
    color: '#F57F17',
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: typography.fontSizeLG,
    fontWeight: typography.fontWeightSemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  pendingCard: {
    backgroundColor: '#FFF9C4',
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#FFF176',
  },
  pendingIcon: { fontSize: 28 },
  pendingInfo: { flex: 1 },
  pendingTitle: { fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary },
  pendingStatus: { fontSize: typography.fontSizeXS, color: '#F9A825', marginTop: 2 },
  pendingCost: { fontSize: typography.fontSizeSM, color: '#F57F17', fontWeight: typography.fontWeightSemiBold },
  emptyCard: {
    backgroundColor: colors.childSurface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.sm },
  emptyText: {
    fontSize: typography.fontSizeMD,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  rewardCard: {
    backgroundColor: colors.childSurface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  rewardCardLocked: { opacity: 0.6 },
  rewardCardPending: { backgroundColor: '#FFFDE7', borderWidth: 1, borderColor: '#FFF176' },
  rewardIcon: { fontSize: 36 },
  rewardInfo: { flex: 1 },
  rewardTitle: {
    fontSize: typography.fontSizeMD,
    fontWeight: typography.fontWeightSemiBold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  rewardTitleLocked: { color: colors.textMuted },
  costRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rewardCost: { fontSize: typography.fontSizeSM, color: '#F57F17', fontWeight: typography.fontWeightMedium },
  rewardCostLocked: { color: colors.textMuted },
  needMore: { fontSize: typography.fontSizeXS, color: colors.error },
  rewardAction: { fontSize: 24, color: colors.textMuted },
});
