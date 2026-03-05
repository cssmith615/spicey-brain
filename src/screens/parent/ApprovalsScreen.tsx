import React from 'react';
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

export default function ApprovalsScreen() {
  const { redemptionRequests, updateRedemptionRequest } = useAppStore();

  const pending = redemptionRequests.filter((r) => r.status === 'pending');
  const history = redemptionRequests.filter((r) => r.status !== 'pending');

  const handleApprove = (requestId: string) => {
    updateRedemptionRequest(requestId, { status: 'approved' });
  };

  const handleDeny = (requestId: string) => {
    updateRedemptionRequest(requestId, { status: 'denied' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Reward Requests</Text>

        {/* Pending */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Pending {pending.length > 0 ? `(${pending.length})` : ''}
          </Text>
          {pending.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={styles.emptyText}>No pending requests</Text>
            </View>
          ) : (
            pending.map((req) => (
              <View key={req.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Text style={styles.requestIcon}>{req.rewardIcon}</Text>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestTitle}>{req.rewardTitle}</Text>
                    <Text style={styles.requestMeta}>
                      {req.childName} · ⭐ {req.starCost} stars
                    </Text>
                    <Text style={styles.requestTime}>
                      {new Date(req.requestedAt).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.denyBtn}
                    onPress={() => handleDeny(req.id)}
                  >
                    <Text style={styles.denyBtnText}>✕ Deny</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleApprove(req.id)}
                  >
                    <Text style={styles.approveBtnText}>✓ Approve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* History */}
        {history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>History</Text>
            {history.map((req) => (
              <View key={req.id} style={[styles.historyCard, req.status === 'approved' ? styles.historyApproved : styles.historyDenied]}>
                <Text style={styles.requestIcon}>{req.rewardIcon}</Text>
                <View style={styles.requestInfo}>
                  <Text style={styles.requestTitle}>{req.rewardTitle}</Text>
                  <Text style={styles.requestMeta}>{req.childName} · ⭐ {req.starCost}</Text>
                </View>
                <Text style={[styles.statusBadge, req.status === 'approved' ? styles.statusApproved : styles.statusDenied]}>
                  {req.status === 'approved' ? '✓ Approved' : '✕ Denied'}
                </Text>
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
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyEmoji: { fontSize: 40, marginBottom: spacing.sm },
  emptyText: { fontSize: typography.fontSizeMD, color: colors.textSecondary },
  requestCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  requestHeader: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  requestIcon: { fontSize: 36 },
  requestInfo: { flex: 1 },
  requestTitle: {
    fontSize: typography.fontSizeMD,
    fontWeight: typography.fontWeightSemiBold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  requestMeta: { fontSize: typography.fontSizeSM, color: colors.textSecondary },
  requestTime: { fontSize: typography.fontSizeXS, color: colors.textMuted, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  denyBtn: {
    flex: 1,
    backgroundColor: '#FFF0F0',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  denyBtnText: { fontSize: typography.fontSizeMD, color: colors.error, fontWeight: typography.fontWeightSemiBold },
  approveBtn: {
    flex: 2,
    backgroundColor: colors.success,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  approveBtnText: { fontSize: typography.fontSizeMD, color: '#fff', fontWeight: typography.fontWeightSemiBold },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  historyApproved: { backgroundColor: '#F1F8E9' },
  historyDenied: { backgroundColor: '#FFF0F0' },
  statusBadge: { fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold },
  statusApproved: { color: colors.success },
  statusDenied: { color: colors.error },
});
