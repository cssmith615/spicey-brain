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
import type { PortalAccess, PortalNote, IntakeQuestionnaire, QuestionnaireQuestion } from '../../types';

const DEFAULT_QUESTIONS: Omit<QuestionnaireQuestion, 'id'>[] = [
  { type: 'multiline', question: 'What are your main concerns or goals for this child?', required: true },
  { type: 'multiline', question: 'How would you describe your child\'s behavior at home?', required: true },
  { type: 'scale', question: 'How would you rate your child\'s sleep quality? (1 = very poor, 5 = excellent)', required: true },
  { type: 'scale', question: 'How well does your child handle transitions or changes in routine? (1 = very difficult, 5 = very easy)', required: true },
  { type: 'multiselect', question: 'What motivates your child most? (select all that apply)', required: false, options: ['Verbal praise', 'Stickers / rewards', 'Screen time', 'Physical activity', 'Creative play', 'Social time', 'Music', 'Food treats'] },
  { type: 'multiline', question: 'What strategies have worked well at home?', required: false },
  { type: 'multiline', question: 'Any previous diagnoses or evaluations we should know about?', required: false },
  { type: 'multiline', question: 'Current medications (other than what is tracked in the app)?', required: false },
  { type: 'yesno', question: 'Are there any upcoming changes or stressors in your family life?', required: false },
  { type: 'multiline', question: 'Is there anything else you would like us to know?', required: false },
];

interface Props {
  access: PortalAccess;
  onExit: () => void;
}

const NOTE_TYPES: { value: PortalNote['type']; label: string; emoji: string; color: string }[] = [
  { value: 'positive', label: 'Positive', emoji: '🌟', color: '#E8F5E9' },
  { value: 'observation', label: 'Observation', emoji: '📝', color: '#E3F2FD' },
  { value: 'concern', label: 'Concern', emoji: '⚠️', color: '#FFF8E1' },
  { value: 'recommendation', label: 'Recommendation', emoji: '💡', color: '#F3E5F5' },
  { value: 'session', label: 'Session Note', emoji: '🤝', color: '#E0F7FA' },
];

const ROLE_LABELS: Record<string, string> = {
  teacher: 'Teacher',
  therapist: 'Therapist',
  caregiver: 'Caregiver',
};

export default function PortalDashboardScreen({ access, onExit }: Props) {
  const { parentProfile, routines, sessions, portalNotes, addPortalNote, questionnaires, addQuestionnaire } = useAppStore();

  const child = parentProfile?.childProfiles.find((c) => c.id === access.childProfileId);
  const childNotes = portalNotes.filter((n) => n.portalAccessId === access.id);
  const myQuestionnaires = questionnaires.filter((q) => q.portalAccessId === access.id);

  const [activeTab, setActiveTab] = useState<'notes' | 'progress' | 'routines' | 'questionnaire'>('notes');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteType, setNoteType] = useState<PortalNote['type']>('observation');
  const [noteContent, setNoteContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  // Questionnaire form state
  const [showQForm, setShowQForm] = useState(false);
  const [qTitle, setQTitle] = useState('Initial Intake Questionnaire');
  const [qDescription, setQDescription] = useState('Please take a few minutes to complete this questionnaire so we can better support your child.');
  const [qEmail, setQEmail] = useState('');
  const [qCustomQuestion, setQCustomQuestion] = useState('');
  const [qExtraQuestions, setQExtraQuestions] = useState<string[]>([]);

  // Progress data
  const childSessions = sessions.filter((s) => s.childProfileId === access.childProfileId);
  const completedSessions = childSessions.filter((s) => !!s.completedAt);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeek = completedSessions.filter((s) => new Date(s.completedAt!) >= weekAgo);

  // Streak
  const getStreak = () => {
    if (completedSessions.length === 0) return 0;
    const dates = completedSessions
      .map((s) => new Date(s.completedAt!).toDateString())
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(today);
      expected.setDate(today.getDate() - i);
      if (dates[i] === expected.toDateString()) streak++;
      else break;
    }
    return streak;
  };

  const handleSaveNote = () => {
    if (!noteContent.trim()) {
      Alert.alert('Empty note', 'Please write something before saving.');
      return;
    }

    const note: PortalNote = {
      id: generateId(),
      portalAccessId: access.id,
      childProfileId: access.childProfileId,
      authorName: access.professionalName,
      authorRole: access.role,
      date: new Date().toISOString(),
      type: noteType,
      content: noteContent.trim(),
      isPrivate,
      parentRead: false,
    };

    addPortalNote(note);
    setShowNoteForm(false);
    setNoteContent('');
    setIsPrivate(false);
  };

  const handleSendQuestionnaire = () => {
    if (!qEmail.trim()) {
      Alert.alert('Email required', 'Please enter your email so the parent can reply.');
      return;
    }
    const extraQs: QuestionnaireQuestion[] = qExtraQuestions.map((text) => ({
      id: generateId(),
      type: 'multiline' as const,
      question: text,
      required: false,
    }));
    const questions: QuestionnaireQuestion[] = [
      ...DEFAULT_QUESTIONS.map((dq) => ({ ...dq, id: generateId() })),
      ...extraQs,
    ];
    const q: IntakeQuestionnaire = {
      id: generateId(),
      childProfileId: access.childProfileId,
      portalAccessId: access.id,
      professionalName: access.professionalName,
      professionalRole: access.role,
      professionalEmail: qEmail.trim(),
      title: qTitle.trim() || 'Intake Questionnaire',
      description: qDescription.trim(),
      questions,
      createdAt: new Date().toISOString(),
      status: 'pending',
      responses: {},
    };
    addQuestionnaire(q);
    setShowQForm(false);
    setQExtraQuestions([]);
    setQCustomQuestion('');
    Alert.alert('Questionnaire sent', 'The parent will see it on their home screen and can complete it in the app.');
  };

  if (!child) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Child not found.</Text>
      </SafeAreaView>
    );
  }

  const assignedRoutines = routines.filter(
    (r) => r.isActive && access.permissions.canViewRoutines
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.childAvatar}>{child.avatarEmoji}</Text>
          <View>
            <Text style={styles.childName}>{child.name}</Text>
            <Text style={styles.portalMeta}>
              {access.professionalName} · {ROLE_LABELS[access.role]}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.exitBtn} onPress={onExit}>
          <Text style={styles.exitBtnText}>Exit</Text>
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={styles.tabs}>
        {[
          { key: 'notes', label: 'Notes', emoji: '📝' },
          access.permissions.canViewProgress && { key: 'progress', label: 'Progress', emoji: '📊' },
          access.permissions.canViewRoutines && { key: 'routines', label: 'Routines', emoji: '📋' },
          { key: 'questionnaire', label: 'Intake', emoji: '📋' },
        ]
          .filter(Boolean)
          .map((tab: any) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={styles.tabEmoji}>{tab.emoji}</Text>
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Notes tab */}
        {activeTab === 'notes' && (
          <>
            {access.permissions.canAddNotes && (
              <TouchableOpacity
                style={styles.addNoteBtn}
                onPress={() => setShowNoteForm((v) => !v)}
              >
                <Text style={styles.addNoteBtnText}>
                  {showNoteForm ? '✕ Cancel' : '+ Add Note'}
                </Text>
              </TouchableOpacity>
            )}

            {showNoteForm && (
              <View style={styles.formCard}>
                {/* Note type */}
                <Text style={styles.formLabel}>Note Type</Text>
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

                <Text style={styles.formLabel}>Note</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder={
                    access.role === 'therapist'
                      ? 'Session observations, strategies tried, recommendations...'
                      : 'Classroom behavior, focus, interactions, achievements...'
                  }
                  value={noteContent}
                  onChangeText={setNoteContent}
                  multiline
                  numberOfLines={5}
                  placeholderTextColor={colors.textMuted}
                />

                <TouchableOpacity
                  style={[styles.privateToggle, isPrivate && styles.privateToggleActive]}
                  onPress={() => setIsPrivate((v) => !v)}
                >
                  <Text style={[styles.privateToggleText, isPrivate && styles.privateToggleTextActive]}>
                    {isPrivate ? '🔒 Private — only parent can see' : '👁 Visible to parent — tap to make private'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveNoteBtn} onPress={handleSaveNote}>
                  <Text style={styles.saveNoteBtnText}>Save Note</Text>
                </TouchableOpacity>
              </View>
            )}

            {childNotes.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>📋</Text>
                <Text style={styles.emptyText}>No notes yet. Add your first observation.</Text>
              </View>
            ) : (
              childNotes
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((note) => {
                  const typeInfo = NOTE_TYPES.find((t) => t.value === note.type) ?? NOTE_TYPES[0];
                  return (
                    <View key={note.id} style={[styles.noteCard, { backgroundColor: typeInfo.color }]}>
                      <View style={styles.noteHeader}>
                        <View style={styles.noteTypeRow}>
                          <Text>{typeInfo.emoji}</Text>
                          <Text style={styles.noteTypeLabel}>{typeInfo.label}</Text>
                          {note.isPrivate && <Text style={styles.privateBadge}>🔒 Private</Text>}
                        </View>
                        <Text style={styles.noteDate}>
                          {new Date(note.date).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric',
                          })}
                        </Text>
                      </View>
                      <Text style={styles.noteContent}>{note.content}</Text>
                    </View>
                  );
                })
            )}
          </>
        )}

        {/* Progress tab */}
        {activeTab === 'progress' && access.permissions.canViewProgress && (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>🔥</Text>
                <Text style={styles.statValue}>{getStreak()}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>✅</Text>
                <Text style={styles.statValue}>{completedSessions.length}</Text>
                <Text style={styles.statLabel}>Total Done</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>📅</Text>
                <Text style={styles.statValue}>{thisWeek.length}</Text>
                <Text style={styles.statLabel}>This Week</Text>
              </View>
            </View>

            {/* Weekly calendar */}
            <View style={styles.weekCard}>
              <Text style={styles.weekTitle}>This Week</Text>
              <View style={styles.weekRow}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (date.getDay() - 1) + i);
                  const hadSession = completedSessions.some(
                    (s) => new Date(s.completedAt!).toDateString() === date.toDateString()
                  );
                  const isToday = date.toDateString() === new Date().toDateString();
                  return (
                    <View key={day} style={styles.dayCol}>
                      <Text style={[styles.dayDot, hadSession ? styles.dayDotDone : isToday ? styles.dayDotToday : {}]}>
                        {hadSession ? '⭐' : '○'}
                      </Text>
                      <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{day}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {/* Routines tab */}
        {activeTab === 'routines' && access.permissions.canViewRoutines && (
          <>
            {assignedRoutines.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>📋</Text>
                <Text style={styles.emptyText}>No active routines to display.</Text>
              </View>
            ) : (
              assignedRoutines.map((routine) => (
                <View key={routine.id} style={styles.routineCard}>
                  <Text style={styles.routineTime}>{routine.scheduledTime}</Text>
                  <Text style={styles.routineName}>{routine.name}</Text>
                  <View style={styles.taskList}>
                    {routine.tasks.map((task, i) => (
                      <View key={task.id} style={styles.taskRow}>
                        <Text style={styles.taskNum}>{i + 1}</Text>
                        <Text style={styles.taskIcon}>{task.icon}</Text>
                        <Text style={styles.taskTitle}>{task.title}</Text>
                        {task.durationMinutes ? (
                          <Text style={styles.taskDuration}>{task.durationMinutes}m</Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}
          </>
        )}
        {/* Questionnaire tab */}
        {activeTab === 'questionnaire' && (
          <>
            <TouchableOpacity
              style={styles.addNoteBtn}
              onPress={() => setShowQForm((v) => !v)}
            >
              <Text style={styles.addNoteBtnText}>
                {showQForm ? '✕ Cancel' : '+ Send Questionnaire'}
              </Text>
            </TouchableOpacity>

            {showQForm && (
              <View style={styles.formCard}>
                <Text style={styles.formLabel}>Questionnaire Title</Text>
                <TextInput
                  style={styles.input}
                  value={qTitle}
                  onChangeText={setQTitle}
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={styles.formLabel}>Introduction / Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={qDescription}
                  onChangeText={setQDescription}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={styles.formLabel}>Your Email (for parent to reply to)</Text>
                <TextInput
                  style={styles.input}
                  value={qEmail}
                  onChangeText={setQEmail}
                  placeholder="you@practice.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={styles.formLabel}>Default questions included ({DEFAULT_QUESTIONS.length})</Text>
                {DEFAULT_QUESTIONS.map((dq, i) => (
                  <Text key={i} style={styles.defaultQText}>• {dq.question}</Text>
                ))}
                <Text style={[styles.formLabel, { marginTop: spacing.md }]}>Add a Custom Question (optional)</Text>
                <View style={styles.customQRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    value={qCustomQuestion}
                    onChangeText={setQCustomQuestion}
                    placeholder="e.g. Does your child have any food allergies?"
                    placeholderTextColor={colors.textMuted}
                  />
                  <TouchableOpacity
                    style={styles.addQBtn}
                    onPress={() => {
                      if (qCustomQuestion.trim()) {
                        setQExtraQuestions((prev) => [...prev, qCustomQuestion.trim()]);
                        setQCustomQuestion('');
                      }
                    }}
                  >
                    <Text style={styles.addQBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                {qExtraQuestions.map((eq, i) => (
                  <View key={i} style={styles.extraQRow}>
                    <Text style={styles.extraQText}>• {eq}</Text>
                    <TouchableOpacity onPress={() => setQExtraQuestions((prev) => prev.filter((_, j) => j !== i))}>
                      <Text style={styles.removeQ}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={[styles.saveNoteBtn, { marginTop: spacing.md }]} onPress={handleSendQuestionnaire}>
                  <Text style={styles.saveNoteBtnText}>Send to Parent</Text>
                </TouchableOpacity>
              </View>
            )}

            {myQuestionnaires.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>📋</Text>
                <Text style={styles.emptyText}>No questionnaires sent yet.</Text>
              </View>
            ) : (
              myQuestionnaires.map((q) => (
                <View key={q.id} style={[styles.noteCard, { backgroundColor: q.status === 'completed' ? '#E8F5E9' : '#FFF8E1' }]}>
                  <View style={styles.noteHeader}>
                    <Text style={styles.noteTypeLabel}>{q.title}</Text>
                    <Text style={[styles.noteDate, { color: q.status === 'completed' ? colors.success : colors.warning }]}>
                      {q.status === 'completed' ? '✓ Completed' : '⏳ Pending'}
                    </Text>
                  </View>
                  <Text style={styles.noteDate}>Sent {new Date(q.createdAt).toLocaleDateString()}</Text>
                  {q.status === 'completed' && (
                    <>
                      <Text style={[styles.formLabel, { marginTop: spacing.sm }]}>Responses</Text>
                      {q.questions.map((question) => {
                        const answer = q.responses[question.id];
                        if (!answer && answer !== 0) return null;
                        return (
                          <View key={question.id} style={styles.responseRow}>
                            <Text style={styles.responseQ}>{question.question}</Text>
                            <Text style={styles.responseA}>
                              {Array.isArray(answer) ? answer.join(', ') : String(answer)}
                            </Text>
                          </View>
                        );
                      })}
                    </>
                  )}
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
  errorText: { padding: spacing.lg, color: colors.error },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  childAvatar: { fontSize: 36 },
  childName: { fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightBold, color: colors.textPrimary },
  portalMeta: { fontSize: typography.fontSizeXS, color: colors.textSecondary },
  exitBtn: { backgroundColor: colors.border, borderRadius: radius.full, paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  exitBtnText: { fontSize: typography.fontSizeSM, color: colors.textSecondary, fontWeight: typography.fontWeightMedium },
  tabs: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.primary },
  tabEmoji: { fontSize: 14 },
  tabText: { fontSize: typography.fontSizeSM, color: colors.textSecondary, fontWeight: typography.fontWeightMedium },
  tabTextActive: { color: colors.primary, fontWeight: typography.fontWeightSemiBold },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  addNoteBtn: { backgroundColor: colors.primary, borderRadius: radius.full, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, alignSelf: 'flex-start', marginBottom: spacing.md },
  addNoteBtnText: { color: '#fff', fontWeight: typography.fontWeightSemiBold, fontSize: typography.fontSizeMD },
  formCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg },
  formLabel: { fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.xs },
  typeScroll: { marginBottom: spacing.md },
  typeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, marginRight: spacing.sm, gap: 4 },
  typeChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  typeEmoji: { fontSize: 16 },
  typeLabel: { fontSize: typography.fontSizeSM, color: colors.textSecondary },
  typeLabelActive: { color: '#fff' },
  input: { backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, fontSize: typography.fontSizeMD, color: colors.textPrimary, marginBottom: spacing.sm },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  privateToggle: { backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, alignItems: 'center', marginBottom: spacing.md },
  privateToggleActive: { backgroundColor: '#FFF8E1', borderColor: colors.warning },
  privateToggleText: { fontSize: typography.fontSizeSM, color: colors.textSecondary },
  privateToggleTextActive: { color: '#F57F17', fontWeight: typography.fontWeightSemiBold },
  saveNoteBtn: { backgroundColor: colors.primary, borderRadius: radius.xl, paddingVertical: spacing.md, alignItems: 'center' },
  saveNoteBtnText: { color: '#fff', fontWeight: typography.fontWeightBold, fontSize: typography.fontSizeMD },
  emptyCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.sm },
  emptyText: { fontSize: typography.fontSizeMD, color: colors.textSecondary, textAlign: 'center' },
  noteCard: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  noteTypeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  noteTypeLabel: { fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary },
  privateBadge: { fontSize: typography.fontSizeXS, color: colors.textMuted },
  noteDate: { fontSize: typography.fontSizeXS, color: colors.textMuted },
  noteContent: { fontSize: typography.fontSizeMD, color: colors.textPrimary, lineHeight: 22 },
  statsGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center' },
  statEmoji: { fontSize: 24, marginBottom: 4 },
  statValue: { fontSize: typography.fontSizeXXL, fontWeight: typography.fontWeightBold, color: colors.textPrimary },
  statLabel: { fontSize: typography.fontSizeXS, color: colors.textMuted },
  weekCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md },
  weekTitle: { fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold, color: colors.textSecondary, marginBottom: spacing.md },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 4 },
  dayDot: { fontSize: 20, color: colors.border },
  dayDotDone: { color: colors.warning },
  dayDotToday: { color: colors.primaryLight },
  dayLabel: { fontSize: typography.fontSizeXS, color: colors.textMuted },
  dayLabelToday: { color: colors.primary, fontWeight: typography.fontWeightSemiBold },
  routineCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm },
  routineTime: { fontSize: typography.fontSizeXS, color: colors.primary, fontWeight: typography.fontWeightSemiBold, marginBottom: 2 },
  routineName: { fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary, marginBottom: spacing.sm },
  taskList: { gap: spacing.xs },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  taskNum: { fontSize: typography.fontSizeXS, color: colors.textMuted, width: 16, textAlign: 'center' },
  taskIcon: { fontSize: 18 },
  taskTitle: { flex: 1, fontSize: typography.fontSizeSM, color: colors.textPrimary },
  taskDuration: { fontSize: typography.fontSizeXS, color: colors.textMuted },
  defaultQText: { fontSize: typography.fontSizeXS, color: colors.textSecondary, marginBottom: 4, lineHeight: 18 },
  customQRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.sm },
  addQBtn: { backgroundColor: colors.primary, borderRadius: radius.md, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  addQBtnText: { color: '#fff', fontSize: 22, fontWeight: typography.fontWeightBold },
  extraQRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  extraQText: { flex: 1, fontSize: typography.fontSizeSM, color: colors.textPrimary },
  removeQ: { fontSize: 16, color: colors.textMuted, padding: spacing.xs },
  responseRow: { marginBottom: spacing.sm },
  responseQ: { fontSize: typography.fontSizeXS, color: colors.textSecondary, marginBottom: 2 },
  responseA: { fontSize: typography.fontSizeSM, color: colors.textPrimary, fontWeight: typography.fontWeightMedium },
});
