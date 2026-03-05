import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/routineStore';
import { colors, spacing, typography, radius } from '../../theme';
import { generateId } from '../../utils';
import type { TeacherContact, TeacherNote } from '../../types';

const NOTE_TYPES: { value: TeacherNote['type']; label: string; emoji: string; color: string }[] = [
  { value: 'positive', label: 'Positive', emoji: '🌟', color: '#E8F5E9' },
  { value: 'observation', label: 'Observation', emoji: '📝', color: '#E3F2FD' },
  { value: 'concern', label: 'Concern', emoji: '⚠️', color: '#FFF8E1' },
  { value: 'meeting', label: 'Meeting', emoji: '🤝', color: '#F3E5F5' },
  { value: 'message', label: 'Message', emoji: '💬', color: '#E0F7FA' },
];

export default function TeacherLogScreen() {
  const {
    parentProfile,
    teacherContacts,
    teacherNotes,
    addTeacherContact,
    removeTeacherContact,
    addTeacherNote,
    updateTeacherNote,
  } = useAppStore();
  const children = parentProfile?.childProfiles ?? [];

  const [selectedChildId, setSelectedChildId] = useState(children[0]?.id ?? '');
  const [activeTab, setActiveTab] = useState<'log' | 'contacts'>('log');

  // Add note form
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteType, setNoteType] = useState<TeacherNote['type']>('observation');
  const [noteContent, setNoteContent] = useState('');
  const [noteTeacherId, setNoteTeacherId] = useState('');
  const [followUp, setFollowUp] = useState(false);

  // Add contact form
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const childNotes = teacherNotes
    .filter((n) => n.childProfileId === selectedChildId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const childContacts = teacherContacts.filter((c) => c.childProfileId === selectedChildId);
  const pendingFollowUps = childNotes.filter((n) => n.followUpRequired && !n.followUpDone);

  const handleSaveNote = () => {
    if (!noteContent.trim()) {
      Alert.alert('Empty note', 'Please write something before saving.');
      return;
    }
    const note: TeacherNote = {
      id: generateId(),
      childProfileId: selectedChildId,
      teacherContactId: noteTeacherId || undefined,
      date: new Date().toISOString(),
      type: noteType,
      content: noteContent.trim(),
      followUpRequired: followUp,
      followUpDone: false,
    };
    addTeacherNote(note);
    setShowNoteForm(false);
    setNoteContent('');
    setFollowUp(false);
  };

  const handleSaveContact = () => {
    if (!contactName.trim()) {
      Alert.alert('Missing name', "Please enter the teacher's name.");
      return;
    }
    const contact: TeacherContact = {
      id: generateId(),
      childProfileId: selectedChildId,
      name: contactName.trim(),
      subject: contactSubject.trim(),
      email: contactEmail.trim(),
      phone: contactPhone.trim() || undefined,
    };
    addTeacherContact(contact);
    setShowContactForm(false);
    setContactName('');
    setContactSubject('');
    setContactEmail('');
    setContactPhone('');
  };

  const markFollowUpDone = (id: string) => {
    updateTeacherNote(id, { followUpDone: true });
  };

  const getNoteStyle = (type: TeacherNote['type']) =>
    NOTE_TYPES.find((t) => t.value === type) ?? NOTE_TYPES[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Teacher Log</Text>

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

        {/* Follow-up alerts */}
        {pendingFollowUps.length > 0 && (
          <View style={styles.followUpAlert}>
            <Text style={styles.followUpAlertText}>
              ⚠️ {pendingFollowUps.length} follow-up{pendingFollowUps.length !== 1 ? 's' : ''} needed
            </Text>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'log' && styles.tabActive]}
            onPress={() => setActiveTab('log')}
          >
            <Text style={[styles.tabText, activeTab === 'log' && styles.tabTextActive]}>
              Notes ({childNotes.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'contacts' && styles.tabActive]}
            onPress={() => setActiveTab('contacts')}
          >
            <Text style={[styles.tabText, activeTab === 'contacts' && styles.tabTextActive]}>
              Teachers ({childContacts.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notes tab */}
        {activeTab === 'log' && (
          <>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowNoteForm((v) => !v)}
            >
              <Text style={styles.addBtnText}>{showNoteForm ? '✕ Cancel' : '+ Add Note'}</Text>
            </TouchableOpacity>

            {showNoteForm && (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>New Note</Text>

                {/* Type selector */}
                <Text style={styles.label}>Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                  {NOTE_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t.value}
                      style={[styles.typeChip, noteType === t.value && styles.typeChipActive]}
                      onPress={() => setNoteType(t.value)}
                    >
                      <Text style={styles.typeEmoji}>{t.emoji}</Text>
                      <Text style={[styles.typeLabel, noteType === t.value && styles.typeLabelActive]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Teacher */}
                {childContacts.length > 0 && (
                  <>
                    <Text style={styles.label}>Teacher (optional)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
                      <TouchableOpacity
                        style={[styles.teacherChip, !noteTeacherId && styles.teacherChipActive]}
                        onPress={() => setNoteTeacherId('')}
                      >
                        <Text style={[styles.teacherChipText, !noteTeacherId && styles.teacherChipTextActive]}>
                          General
                        </Text>
                      </TouchableOpacity>
                      {childContacts.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          style={[styles.teacherChip, noteTeacherId === c.id && styles.teacherChipActive]}
                          onPress={() => setNoteTeacherId(c.id)}
                        >
                          <Text style={[styles.teacherChipText, noteTeacherId === c.id && styles.teacherChipTextActive]}>
                            {c.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                )}

                <Text style={styles.label}>Note</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="What happened? What did the teacher say?"
                  value={noteContent}
                  onChangeText={setNoteContent}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor={colors.textMuted}
                />

                <TouchableOpacity
                  style={[styles.followUpToggle, followUp && styles.followUpToggleActive]}
                  onPress={() => setFollowUp((v) => !v)}
                >
                  <Text style={styles.followUpToggleText}>
                    {followUp ? '✓ Follow-up required' : '+ Mark as needs follow-up'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNote}>
                  <Text style={styles.saveBtnText}>Save Note</Text>
                </TouchableOpacity>
              </View>
            )}

            {childNotes.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>📋</Text>
                <Text style={styles.emptyText}>
                  No notes yet. Log observations, meetings, or messages with teachers.
                </Text>
              </View>
            ) : (
              childNotes.map((note) => {
                const typeInfo = getNoteStyle(note.type);
                const teacher = teacherContacts.find((c) => c.id === note.teacherContactId);
                return (
                  <View key={note.id} style={[styles.noteCard, { backgroundColor: typeInfo.color }]}>
                    <View style={styles.noteHeader}>
                      <View style={styles.noteTypeRow}>
                        <Text style={styles.noteTypeEmoji}>{typeInfo.emoji}</Text>
                        <Text style={styles.noteTypeLabel}>{typeInfo.label}</Text>
                        {teacher && <Text style={styles.noteTeacher}>· {teacher.name}</Text>}
                      </View>
                      <Text style={styles.noteDate}>
                        {new Date(note.date).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric',
                        })}
                      </Text>
                    </View>
                    <Text style={styles.noteContent}>{note.content}</Text>
                    {note.followUpRequired && !note.followUpDone && (
                      <TouchableOpacity
                        style={styles.followUpBtn}
                        onPress={() => markFollowUpDone(note.id)}
                      >
                        <Text style={styles.followUpBtnText}>⚠️ Mark follow-up done</Text>
                      </TouchableOpacity>
                    )}
                    {note.followUpDone && (
                      <Text style={styles.followUpDoneText}>✓ Follow-up complete</Text>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}

        {/* Contacts tab */}
        {activeTab === 'contacts' && (
          <>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowContactForm((v) => !v)}
            >
              <Text style={styles.addBtnText}>{showContactForm ? '✕ Cancel' : '+ Add Teacher'}</Text>
            </TouchableOpacity>

            {showContactForm && (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Add Teacher</Text>
                <Text style={styles.label}>Name</Text>
                <TextInput style={styles.input} placeholder="Ms. Johnson" value={contactName} onChangeText={setContactName} placeholderTextColor={colors.textMuted} />
                <Text style={styles.label}>Subject / Class</Text>
                <TextInput style={styles.input} placeholder="e.g. 4th Grade, Math" value={contactSubject} onChangeText={setContactSubject} placeholderTextColor={colors.textMuted} />
                <Text style={styles.label}>Email</Text>
                <TextInput style={styles.input} placeholder="teacher@school.edu" value={contactEmail} onChangeText={setContactEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={colors.textMuted} />
                <Text style={styles.label}>Phone (optional)</Text>
                <TextInput style={styles.input} placeholder="555-123-4567" value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" placeholderTextColor={colors.textMuted} />
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveContact}>
                  <Text style={styles.saveBtnText}>Save Contact</Text>
                </TouchableOpacity>
              </View>
            )}

            {childContacts.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>👩‍🏫</Text>
                <Text style={styles.emptyText}>Add your child's teachers to link notes to them.</Text>
              </View>
            ) : (
              childContacts.map((contact) => (
                <View key={contact.id} style={styles.contactCard}>
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactAvatarText}>
                      {contact.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    {contact.subject ? <Text style={styles.contactSubject}>{contact.subject}</Text> : null}
                  </View>
                  <View style={styles.contactActions}>
                    {contact.email ? (
                      <TouchableOpacity onPress={() => Linking.openURL(`mailto:${contact.email}`)}>
                        <Text style={styles.contactAction}>✉️</Text>
                      </TouchableOpacity>
                    ) : null}
                    {contact.phone ? (
                      <TouchableOpacity onPress={() => Linking.openURL(`tel:${contact.phone}`)}>
                        <Text style={styles.contactAction}>📞</Text>
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity onPress={() => removeTeacherContact(contact.id)}>
                      <Text style={styles.removeContactBtn}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  screenTitle: { fontSize: typography.fontSizeXXL, fontWeight: typography.fontWeightBold, color: colors.textPrimary, marginBottom: spacing.lg },
  childSelector: { marginBottom: spacing.sm },
  childChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, marginRight: spacing.sm, gap: spacing.xs },
  childChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipName: { fontSize: typography.fontSizeSM, color: colors.textSecondary, fontWeight: typography.fontWeightMedium },
  chipNameActive: { color: '#fff' },
  followUpAlert: { backgroundColor: '#FFF8E1', borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.md, borderWidth: 1, borderColor: '#FFE082' },
  followUpAlertText: { fontSize: typography.fontSizeSM, color: '#F57F17', fontWeight: typography.fontWeightSemiBold },
  tabs: { flexDirection: 'row', backgroundColor: colors.border, borderRadius: radius.md, padding: 3, marginBottom: spacing.lg },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.surface },
  tabText: { fontSize: typography.fontSizeSM, color: colors.textSecondary, fontWeight: typography.fontWeightMedium },
  tabTextActive: { color: colors.primary, fontWeight: typography.fontWeightSemiBold },
  addBtn: { backgroundColor: colors.primary, borderRadius: radius.full, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, alignSelf: 'flex-start', marginBottom: spacing.md },
  addBtnText: { color: '#fff', fontWeight: typography.fontWeightSemiBold, fontSize: typography.fontSizeMD },
  formCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  formTitle: { fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary, marginBottom: spacing.md },
  label: { fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.xs },
  input: { backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, fontSize: typography.fontSizeMD, color: colors.textPrimary, marginBottom: spacing.sm },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  typeScroll: { marginBottom: spacing.sm },
  typeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, marginRight: spacing.sm, gap: 4 },
  typeChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  typeEmoji: { fontSize: 16 },
  typeLabel: { fontSize: typography.fontSizeSM, color: colors.textSecondary },
  typeLabelActive: { color: '#fff' },
  teacherChip: { backgroundColor: colors.background, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, marginRight: spacing.sm },
  teacherChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  teacherChipText: { fontSize: typography.fontSizeSM, color: colors.textSecondary },
  teacherChipTextActive: { color: '#fff' },
  followUpToggle: { backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, alignItems: 'center', marginBottom: spacing.md },
  followUpToggleActive: { backgroundColor: '#FFF8E1', borderColor: colors.warning },
  followUpToggleText: { fontSize: typography.fontSizeSM, color: colors.textSecondary, fontWeight: typography.fontWeightMedium },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.xl, paddingVertical: spacing.md, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: typography.fontWeightBold, fontSize: typography.fontSizeMD },
  emptyCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.sm },
  emptyText: { fontSize: typography.fontSizeMD, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  noteCard: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  noteTypeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  noteTypeEmoji: { fontSize: 16 },
  noteTypeLabel: { fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary },
  noteTeacher: { fontSize: typography.fontSizeSM, color: colors.textSecondary },
  noteDate: { fontSize: typography.fontSizeXS, color: colors.textMuted },
  noteContent: { fontSize: typography.fontSizeMD, color: colors.textPrimary, lineHeight: 22 },
  followUpBtn: { marginTop: spacing.sm, backgroundColor: '#FFF8E1', borderRadius: radius.md, padding: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: '#FFE082' },
  followUpBtnText: { fontSize: typography.fontSizeSM, color: '#F57F17', fontWeight: typography.fontWeightSemiBold },
  followUpDoneText: { marginTop: spacing.sm, fontSize: typography.fontSizeSM, color: colors.success, fontWeight: typography.fontWeightMedium },
  contactCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  contactAvatar: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  contactAvatarText: { fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightBold, color: '#fff' },
  contactInfo: { flex: 1 },
  contactName: { fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary },
  contactSubject: { fontSize: typography.fontSizeXS, color: colors.textMuted },
  contactActions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  contactAction: { fontSize: 24 },
  removeContactBtn: { fontSize: 16, color: colors.textMuted, padding: spacing.xs },
});
