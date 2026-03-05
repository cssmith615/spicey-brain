import React, { useState } from 'react';
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

const NOTE_TYPE_INFO: Record<string, { emoji: string; label: string; color: string }> = {
  observation: { emoji: '📝', label: 'Observation', color: '#E3F2FD' },
  concern:     { emoji: '⚠️', label: 'Concern',     color: '#FFF8E1' },
  positive:    { emoji: '🌟', label: 'Positive',    color: '#E8F5E9' },
  recommendation: { emoji: '💡', label: 'Recommendation', color: '#F3E5F5' },
  session:     { emoji: '🤝', label: 'Session',     color: '#E0F7FA' },
};

export default function PortalNotesInboxScreen() {
  const { parentProfile, portalNotes, portalAccesses, markPortalNoteRead } = useAppStore();

  const children = parentProfile?.childProfiles ?? [];
  const [selectedChildId, setSelectedChildId] = useState(children[0]?.id ?? '');
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');

  const childNotes = portalNotes
    .filter((n) => n.childProfileId === selectedChildId)
    .filter((n) => filter === 'all' || !n.parentRead)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const unreadCount = portalNotes.filter(
    (n) => n.childProfileId === selectedChildId && !n.parentRead
  ).length;

  const getAccess = (portalAccessId: string) =>
    portalAccesses.find((a) => a.id === portalAccessId);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Professional Notes</Text>

        {/* Child selector */}
        {children.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childSelector}>
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={[styles.childChip, selectedChildId === child.id && styles.childChipActive]}
                onPress={() => setSelectedChildId(child.id)}
              >
                <Text>{child.avatarEmoji}</Text>
                <Text style={[styles.chipName, selectedChildId === child.id && styles.chipNameActive]}>
                  {child.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Filter tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, filter === 'unread' && styles.tabActive]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[styles.tabText, filter === 'unread' && styles.tabTextActive]}>
              Unread {unreadCount > 0 ? `(${unreadCount})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, filter === 'all' && styles.tabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.tabText, filter === 'all' && styles.tabTextActive]}>
              All Notes
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notes list */}
        {childNotes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📬</Text>
            <Text style={styles.emptyTitle}>
              {filter === 'unread' ? 'All caught up!' : 'No notes yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'unread'
                ? 'No unread notes from professionals'
                : 'Notes from teachers and therapists will appear here'}
            </Text>
          </View>
        ) : (
          childNotes.map((note) => {
            const typeInfo = NOTE_TYPE_INFO[note.type] ?? NOTE_TYPE_INFO.observation;
            const access = getAccess(note.portalAccessId);
            return (
              <TouchableOpacity
                key={note.id}
                style={[styles.noteCard, { backgroundColor: typeInfo.color }, !note.parentRead && styles.noteCardUnread]}
                onPress={() => !note.parentRead && markPortalNoteRead(note.id)}
                activeOpacity={0.85}
              >
                {!note.parentRead && <View style={styles.unreadDot} />}
                <View style={styles.noteHeader}>
                  <View style={styles.noteTypeRow}>
                    <Text style={styles.noteTypeEmoji}>{typeInfo.emoji}</Text>
                    <Text style={styles.noteTypeLabel}>{typeInfo.label}</Text>
                    {note.isPrivate && (
                      <View style={styles.privateBadge}>
                        <Text style={styles.privateBadgeText}>Private</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.noteDate}>
                    {new Date(note.date).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.noteAuthorRow}>
                  <Text style={styles.noteAuthor}>{note.authorName}</Text>
                  {access && (
                    <Text style={styles.noteRole}> · {access.role}</Text>
                  )}
                </View>
                <Text style={styles.noteContent}>{note.content}</Text>
                {!note.parentRead && (
                  <Text style={styles.tapToRead}>Tap to mark as read</Text>
                )}
              </TouchableOpacity>
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
  screenTitle: { fontSize: typography.fontSizeXXL, fontWeight: typography.fontWeightBold, color: colors.textPrimary, marginBottom: spacing.lg },
  childSelector: { marginBottom: spacing.md },
  childChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, marginRight: spacing.sm, gap: spacing.xs },
  childChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipName: { fontSize: typography.fontSizeSM, color: colors.textSecondary, fontWeight: typography.fontWeightMedium },
  chipNameActive: { color: '#fff' },
  tabs: { flexDirection: 'row', backgroundColor: colors.border, borderRadius: radius.md, padding: 3, marginBottom: spacing.lg },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.surface },
  tabText: { fontSize: typography.fontSizeSM, color: colors.textSecondary, fontWeight: typography.fontWeightMedium },
  tabTextActive: { color: colors.primary, fontWeight: typography.fontWeightSemiBold },
  emptyCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xxl, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.sm },
  emptyTitle: { fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary, marginBottom: spacing.xs },
  emptySubtitle: { fontSize: typography.fontSizeSM, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  noteCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    position: 'relative',
  },
  noteCardUnread: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  unreadDot: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  noteTypeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  noteTypeEmoji: { fontSize: 16 },
  noteTypeLabel: { fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary },
  privateBadge: { backgroundColor: colors.textMuted, borderRadius: radius.full, paddingVertical: 2, paddingHorizontal: spacing.xs },
  privateBadgeText: { fontSize: 10, color: '#fff', fontWeight: typography.fontWeightSemiBold },
  noteDate: { fontSize: typography.fontSizeXS, color: colors.textMuted },
  noteAuthorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  noteAuthor: { fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold, color: colors.textSecondary },
  noteRole: { fontSize: typography.fontSizeSM, color: colors.textMuted },
  noteContent: { fontSize: typography.fontSizeMD, color: colors.textPrimary, lineHeight: 22 },
  tapToRead: { fontSize: typography.fontSizeXS, color: colors.primary, marginTop: spacing.sm, fontStyle: 'italic' },
});
