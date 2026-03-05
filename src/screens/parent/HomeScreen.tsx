import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../store/routineStore';
import { colors, spacing, typography, radius } from '../../theme';
import { getGreeting, formatTime } from '../../utils';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { parentProfile, routines, portalNotes, questionnaires, loadData } = useAppStore();

  useEffect(() => {
    loadData();
  }, []);

  const activeRoutines = routines.filter((r) => r.isActive);
  const pendingQuestionnaires = questionnaires.filter((q) => q.status === 'pending');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.name}>{parentProfile?.name ?? 'Parent'}</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Children quick-switch */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Kids</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {parentProfile?.childProfiles.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={styles.childCard}
                onPress={() => navigation.navigate('ChildView', { childId: child.id })}
              >
                <Text style={styles.childAvatar}>{child.avatarEmoji}</Text>
                <Text style={styles.childName}>{child.name}</Text>
                <Text style={styles.childAge}>Age {child.age}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.addChildCard}
              onPress={() => navigation.navigate('AddChild')}
            >
              <Text style={styles.addChildIcon}>+</Text>
              <Text style={styles.addChildLabel}>Add Kid</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Active Routines */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Routines</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Routines')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {activeRoutines.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No routines yet</Text>
              <Text style={styles.emptySubtitle}>Create your first routine to get started</Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => navigation.navigate('CreateRoutine')}
              >
                <Text style={styles.createBtnText}>Create Routine</Text>
              </TouchableOpacity>
            </View>
          ) : (
            activeRoutines.map((routine) => (
              <TouchableOpacity
                key={routine.id}
                style={styles.routineCard}
                onPress={() => navigation.navigate('RoutineDetail', { routineId: routine.id })}
              >
                <View style={styles.routineLeft}>
                  <Text style={styles.routineTime}>{formatTime(routine.scheduledTime)}</Text>
                  <Text style={styles.routineName}>{routine.name}</Text>
                  <Text style={styles.routineTaskCount}>
                    {routine.tasks.length} mission{routine.tasks.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <Text style={styles.routineArrow}>›</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('CreateRoutine')}>
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionLabel}>Routine</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Progress')}>
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionLabel}>Progress</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Rewards')}>
              <Text style={styles.actionIcon}>🏆</Text>
              <Text style={styles.actionLabel}>Rewards</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Medication')}>
              <Text style={styles.actionIcon}>💊</Text>
              <Text style={styles.actionLabel}>Meds</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.quickActions, { marginTop: spacing.sm }]}>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('MoodTracker')}>
              <Text style={styles.actionIcon}>😊</Text>
              <Text style={styles.actionLabel}>Mood</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('TeacherLog')}>
              <Text style={styles.actionIcon}>👩‍🏫</Text>
              <Text style={styles.actionLabel}>Teachers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Insights')}>
              <Text style={styles.actionIcon}>🧠</Text>
              <Text style={styles.actionLabel}>Insights</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Report')}>
              <Text style={styles.actionIcon}>📄</Text>
              <Text style={styles.actionLabel}>Report</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Professional portal */}
        <TouchableOpacity
          style={styles.portalCard}
          onPress={() => navigation.navigate('Portal')}
        >
          <Text style={styles.portalIcon}>🔐</Text>
          <View style={styles.portalText}>
            <Text style={styles.portalTitle}>Professional Portal</Text>
            <Text style={styles.portalSubtitle}>Invite teachers & therapists to add notes</Text>
          </View>
          <Text style={styles.portalArrow}>›</Text>
        </TouchableOpacity>
        {pendingQuestionnaires.map((q) => (
          <TouchableOpacity
            key={q.id}
            style={styles.inboxCard}
            onPress={() => navigation.navigate('Questionnaire', { questionnaireId: q.id })}
          >
            <Text style={styles.portalIcon}>📋</Text>
            <View style={styles.portalText}>
              <Text style={styles.portalTitle}>{q.title}</Text>
              <Text style={styles.portalSubtitle}>From {q.professionalName} · Tap to complete</Text>
            </View>
            <Text style={styles.portalArrow}>›</Text>
          </TouchableOpacity>
        ))}

        {portalNotes.some((n) => !n.parentRead) && (
          <TouchableOpacity
            style={styles.inboxCard}
            onPress={() => navigation.navigate('PortalNotes')}
          >
            <Text style={styles.portalIcon}>📬</Text>
            <View style={styles.portalText}>
              <Text style={styles.portalTitle}>
                {portalNotes.filter((n) => !n.parentRead).length} Unread Note{portalNotes.filter((n) => !n.parentRead).length !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.portalSubtitle}>From your child's professionals</Text>
            </View>
            <Text style={styles.portalArrow}>›</Text>
          </TouchableOpacity>
        )}
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
  greeting: {
    fontSize: typography.fontSizeMD,
    color: colors.textSecondary,
    fontWeight: typography.fontWeightRegular,
  },
  name: {
    fontSize: typography.fontSizeXL,
    color: colors.textPrimary,
    fontWeight: typography.fontWeightBold,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: { fontSize: 22 },
  section: { marginBottom: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSizeLG,
    fontWeight: typography.fontWeightSemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  seeAll: {
    fontSize: typography.fontSizeSM,
    color: colors.primary,
    fontWeight: typography.fontWeightMedium,
  },
  childCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginRight: spacing.sm,
    minWidth: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  childAvatar: { fontSize: 36, marginBottom: spacing.xs },
  childName: {
    fontSize: typography.fontSizeSM,
    fontWeight: typography.fontWeightSemiBold,
    color: colors.textPrimary,
  },
  childAge: { fontSize: typography.fontSizeXS, color: colors.textMuted },
  addChildCard: {
    backgroundColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  addChildIcon: {
    fontSize: 28,
    color: colors.textSecondary,
    fontWeight: typography.fontWeightBold,
  },
  addChildLabel: { fontSize: typography.fontSizeXS, color: colors.textSecondary, marginTop: 4 },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyIcon: { fontSize: 48, marginBottom: spacing.sm },
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
  routineCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  routineTaskCount: { fontSize: typography.fontSizeXS, color: colors.textMuted },
  routineArrow: { fontSize: 24, color: colors.textMuted },
  inboxCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  portalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: spacing.sm,
  },
  portalIcon: { fontSize: 28 },
  portalText: { flex: 1 },
  portalTitle: { fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary },
  portalSubtitle: { fontSize: typography.fontSizeXS, color: colors.textSecondary, marginTop: 2 },
  portalArrow: { fontSize: 24, color: colors.textMuted },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: { fontSize: 28, marginBottom: spacing.xs },
  actionLabel: {
    fontSize: typography.fontSizeXS,
    color: colors.textSecondary,
    fontWeight: typography.fontWeightMedium,
    textAlign: 'center',
  },
});
