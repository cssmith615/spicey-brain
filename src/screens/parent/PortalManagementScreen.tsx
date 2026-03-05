import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Share,
} from 'react-native';
import { useAppStore } from '../../store/routineStore';
import { colors, spacing, typography, radius } from '../../theme';
import { generateId } from '../../utils';
import type { PortalAccess, PortalRole, PortalPermissions } from '../../types';

const ROLES: { value: PortalRole; label: string; emoji: string; description: string }[] = [
  { value: 'teacher', label: 'Teacher', emoji: '👩‍🏫', description: 'Classroom observations & notes' },
  { value: 'therapist', label: 'Therapist', emoji: '🧠', description: 'Clinical notes & recommendations' },
  { value: 'caregiver', label: 'Caregiver', emoji: '💙', description: 'Family or care provider' },
];

const DEFAULT_PERMISSIONS: Record<PortalRole, PortalPermissions> = {
  teacher: {
    canAddNotes: true,
    canViewMoodLogs: true,
    canViewRoutines: true,
    canViewProgress: true,
    canViewMedication: false,
  },
  therapist: {
    canAddNotes: true,
    canViewMoodLogs: true,
    canViewRoutines: true,
    canViewProgress: true,
    canViewMedication: true,
  },
  caregiver: {
    canAddNotes: true,
    canViewMoodLogs: false,
    canViewRoutines: true,
    canViewProgress: false,
    canViewMedication: false,
  },
};

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function PortalManagementScreen() {
  const navigation = useNavigation<any>();
  const { parentProfile, portalAccesses, portalNotes, addPortalAccess, updatePortalAccess, removePortalAccess } =
    useAppStore();

  const children = parentProfile?.childProfiles ?? [];
  const [selectedChildId, setSelectedChildId] = useState(children[0]?.id ?? '');
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [professionalName, setProfessionalName] = useState('');
  const [selectedRole, setSelectedRole] = useState<PortalRole>('teacher');
  const [permissions, setPermissions] = useState<PortalPermissions>(DEFAULT_PERMISSIONS.teacher);

  const childAccesses = portalAccesses.filter((a) => a.childProfileId === selectedChildId);
  const selectedChild = children.find((c) => c.id === selectedChildId);

  const handleRoleChange = (role: PortalRole) => {
    setSelectedRole(role);
    setPermissions(DEFAULT_PERMISSIONS[role]);
  };

  const togglePermission = (key: keyof PortalPermissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCreate = () => {
    if (!professionalName.trim()) {
      Alert.alert('Missing name', 'Please enter the professional\'s name.');
      return;
    }

    const access: PortalAccess = {
      id: generateId(),
      code: generateCode(),
      childProfileId: selectedChildId,
      professionalName: professionalName.trim(),
      role: selectedRole,
      permissions,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    addPortalAccess(access);
    setShowForm(false);
    setProfessionalName('');
    setSelectedRole('teacher');
    setPermissions(DEFAULT_PERMISSIONS.teacher);

    // Auto-share the code
    shareCode(access);
  };

  const shareCode = (access: PortalAccess) => {
    const childName = children.find((c) => c.id === access.childProfileId)?.name ?? 'your child';
    Share.share({
      message:
        `Hi ${access.professionalName},\n\n` +
        `You've been invited to view ${childName}'s progress on Spicey Brain.\n\n` +
        `Your access code: ${access.code}\n\n` +
        `Open the app, tap "Professional Portal", and enter this code to get started.`,
      title: `Spicey Brain Portal — ${access.code}`,
    });
  };

  const handleRevoke = (access: PortalAccess) => {
    Alert.alert(
      'Revoke Access',
      `Remove ${access.professionalName}'s access? They will no longer be able to view or add notes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: () => removePortalAccess(access.id),
        },
      ]
    );
  };

  const unreadCount = (accessId: string) =>
    portalNotes.filter((n) => n.portalAccessId === accessId && !n.parentRead).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={styles.screenTitle}>Professional Portal</Text>
          {portalNotes.some((n) => !n.parentRead) && (
            <TouchableOpacity
              style={styles.inboxBtn}
              onPress={() => navigation.navigate('PortalNotes')}
            >
              <Text style={styles.inboxBtnText}>
                📬 {portalNotes.filter((n) => !n.parentRead).length} new
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.subtitle}>
          Give teachers and therapists secure access to add notes and view progress
        </Text>

        {/* Child selector */}
        {children.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childSelector}>
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={[styles.childChip, selectedChildId === child.id && styles.childChipActive]}
                onPress={() => setSelectedChildId(child.id)}
              >
                <Text style={styles.chipEmoji}>{child.avatarEmoji}</Text>
                <Text style={[styles.chipName, selectedChildId === child.id && styles.chipNameActive]}>
                  {child.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Add button */}
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm((v) => !v)}>
          <Text style={styles.addBtnText}>{showForm ? '✕ Cancel' : '+ Invite Professional'}</Text>
        </TouchableOpacity>

        {/* Create form */}
        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Invite for {selectedChild?.name}</Text>

            <Text style={styles.label}>Professional's Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Ms. Johnson, Dr. Smith"
              value={professionalName}
              onChangeText={setProfessionalName}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Role</Text>
            {ROLES.map((role) => (
              <TouchableOpacity
                key={role.value}
                style={[styles.roleRow, selectedRole === role.value && styles.roleRowActive]}
                onPress={() => handleRoleChange(role.value)}
              >
                <Text style={styles.roleEmoji}>{role.emoji}</Text>
                <View style={styles.roleInfo}>
                  <Text style={[styles.roleLabel, selectedRole === role.value && styles.roleLabelActive]}>
                    {role.label}
                  </Text>
                  <Text style={styles.roleDesc}>{role.description}</Text>
                </View>
                {selectedRole === role.value && <Text style={styles.roleCheck}>✓</Text>}
              </TouchableOpacity>
            ))}

            <Text style={[styles.label, { marginTop: spacing.md }]}>Permissions</Text>
            {(
              [
                { key: 'canAddNotes', label: 'Add notes' },
                { key: 'canViewMoodLogs', label: 'View mood & behavior logs' },
                { key: 'canViewRoutines', label: 'View daily routines' },
                { key: 'canViewProgress', label: 'View completion progress' },
                { key: 'canViewMedication', label: 'View medication info' },
              ] as { key: keyof PortalPermissions; label: string }[]
            ).map(({ key, label }) => (
              <View key={key} style={styles.permissionRow}>
                <Text style={styles.permissionLabel}>{label}</Text>
                <Switch
                  value={permissions[key]}
                  onValueChange={() => togglePermission(key)}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={permissions[key] ? colors.primary : colors.textMuted}
                />
              </View>
            ))}

            <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
              <Text style={styles.createBtnText}>Generate Access Code</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Active portals */}
        <Text style={styles.sectionTitle}>
          Active Access ({childAccesses.filter((a) => a.isActive).length})
        </Text>

        {childAccesses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🔐</Text>
            <Text style={styles.emptyTitle}>No professionals invited yet</Text>
            <Text style={styles.emptySubtitle}>
              Invite a teacher or therapist to securely share notes and progress
            </Text>
          </View>
        ) : (
          childAccesses.map((access) => {
            const role = ROLES.find((r) => r.value === access.role);
            const unread = unreadCount(access.id);
            return (
              <View key={access.id} style={[styles.accessCard, !access.isActive && styles.accessCardInactive]}>
                <View style={styles.accessHeader}>
                  <Text style={styles.accessRoleEmoji}>{role?.emoji}</Text>
                  <View style={styles.accessInfo}>
                    <View style={styles.accessNameRow}>
                      <Text style={styles.accessName}>{access.professionalName}</Text>
                      {unread > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>{unread} new</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.accessRole}>{role?.label}</Text>
                    <Text style={styles.accessMeta}>
                      Code: <Text style={styles.accessCode}>{access.code}</Text>
                      {access.lastAccessedAt
                        ? ` · Last used ${new Date(access.lastAccessedAt).toLocaleDateString()}`
                        : ' · Never used'}
                    </Text>
                  </View>
                </View>

                <View style={styles.accessActions}>
                  <TouchableOpacity style={styles.shareBtn} onPress={() => shareCode(access)}>
                    <Text style={styles.shareBtnText}>Share Code</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.toggleActiveBtn}
                    onPress={() => updatePortalAccess(access.id, { isActive: !access.isActive })}
                  >
                    <Text style={styles.toggleActiveBtnText}>
                      {access.isActive ? 'Pause' : 'Resume'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.revokeBtn} onPress={() => handleRevoke(access)}>
                    <Text style={styles.revokeBtnText}>Revoke</Text>
                  </TouchableOpacity>
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
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  screenTitle: { fontSize: typography.fontSizeXXL, fontWeight: typography.fontWeightBold, color: colors.textPrimary },
  inboxBtn: { backgroundColor: colors.accent, borderRadius: radius.full, paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  inboxBtnText: { fontSize: typography.fontSizeSM, color: '#fff', fontWeight: typography.fontWeightSemiBold },
  subtitle: { fontSize: typography.fontSizeSM, color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 20 },
  childSelector: { marginBottom: spacing.md },
  childChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, marginRight: spacing.sm, gap: spacing.xs },
  childChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipEmoji: { fontSize: 18 },
  chipName: { fontSize: typography.fontSizeSM, color: colors.textSecondary, fontWeight: typography.fontWeightMedium },
  chipNameActive: { color: '#fff' },
  addBtn: { backgroundColor: colors.primary, borderRadius: radius.full, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, alignSelf: 'flex-start', marginBottom: spacing.lg },
  addBtnText: { color: '#fff', fontWeight: typography.fontWeightSemiBold, fontSize: typography.fontSizeMD },
  formCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  formTitle: { fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary, marginBottom: spacing.md },
  label: { fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary, marginBottom: spacing.xs },
  input: { backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, fontSize: typography.fontSizeMD, color: colors.textPrimary, marginBottom: spacing.md },
  roleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.md },
  roleRowActive: { borderColor: colors.primary, backgroundColor: '#F0EEFF' },
  roleEmoji: { fontSize: 28 },
  roleInfo: { flex: 1 },
  roleLabel: { fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary },
  roleLabelActive: { color: colors.primary },
  roleDesc: { fontSize: typography.fontSizeXS, color: colors.textMuted, marginTop: 2 },
  roleCheck: { fontSize: 18, color: colors.primary, fontWeight: typography.fontWeightBold },
  permissionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  permissionLabel: { fontSize: typography.fontSizeMD, color: colors.textPrimary },
  createBtn: { backgroundColor: colors.primary, borderRadius: radius.xl, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  createBtnText: { color: '#fff', fontWeight: typography.fontWeightBold, fontSize: typography.fontSizeMD },
  sectionTitle: { fontSize: typography.fontSizeXS, fontWeight: typography.fontWeightSemiBold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  emptyCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.sm },
  emptyTitle: { fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary, marginBottom: spacing.xs },
  emptySubtitle: { fontSize: typography.fontSizeSM, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  accessCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  accessCardInactive: { opacity: 0.6 },
  accessHeader: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  accessRoleEmoji: { fontSize: 36 },
  accessInfo: { flex: 1 },
  accessNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2 },
  accessName: { fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary },
  unreadBadge: { backgroundColor: colors.accent, borderRadius: radius.full, paddingVertical: 2, paddingHorizontal: spacing.sm },
  unreadBadgeText: { fontSize: typography.fontSizeXS, color: '#fff', fontWeight: typography.fontWeightBold },
  accessRole: { fontSize: typography.fontSizeXS, color: colors.textSecondary },
  accessMeta: { fontSize: typography.fontSizeXS, color: colors.textMuted, marginTop: 4 },
  accessCode: { fontWeight: typography.fontWeightBold, color: colors.primary, letterSpacing: 1 },
  accessActions: { flexDirection: 'row', gap: spacing.sm },
  shareBtn: { flex: 2, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center' },
  shareBtnText: { fontSize: typography.fontSizeSM, color: '#fff', fontWeight: typography.fontWeightSemiBold },
  toggleActiveBtn: { flex: 1, backgroundColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center' },
  toggleActiveBtnText: { fontSize: typography.fontSizeSM, color: colors.textSecondary, fontWeight: typography.fontWeightMedium },
  revokeBtn: { flex: 1, backgroundColor: '#FFF0F0', borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: '#FFCDD2' },
  revokeBtnText: { fontSize: typography.fontSizeSM, color: colors.error, fontWeight: typography.fontWeightSemiBold },
});
