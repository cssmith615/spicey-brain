import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppStore } from '../../store/routineStore';
import { colors, spacing, typography, radius } from '../../theme';
import type { IntakeQuestionnaire } from '../../types';

const ROLE_LABELS: Record<string, string> = {
  teacher: 'Teacher',
  therapist: 'Therapist',
  caregiver: 'Caregiver',
};

export default function QuestionnaireScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { questionnaireId } = route.params;

  const { questionnaires, updateQuestionnaire, parentProfile } = useAppStore();
  const q = questionnaires.find((x) => x.id === questionnaireId) as IntakeQuestionnaire | undefined;

  const [responses, setResponses] = useState<Record<string, string | string[] | number>>(q?.responses ?? {});

  if (!q) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.error}>Questionnaire not found.</Text>
      </SafeAreaView>
    );
  }

  const child = parentProfile?.childProfiles.find((c) => c.id === q.childProfileId);

  const setResponse = (questionId: string, value: string | string[] | number) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const toggleMultiselect = (questionId: string, option: string) => {
    const current = (responses[questionId] as string[]) ?? [];
    const updated = current.includes(option)
      ? current.filter((o) => o !== option)
      : [...current, option];
    setResponse(questionId, updated);
  };

  const buildEmailBody = (): string => {
    const lines: string[] = [
      `Intake Questionnaire: ${q.title}`,
      `Child: ${child?.name ?? 'Unknown'}`,
      `Completed: ${new Date().toLocaleDateString()}`,
      '',
    ];
    for (const question of q.questions) {
      const answer = responses[question.id];
      lines.push(`Q: ${question.question}`);
      if (Array.isArray(answer)) {
        lines.push(`A: ${answer.join(', ') || '(no answer)'}`);
      } else {
        lines.push(`A: ${answer ?? '(no answer)'}`);
      }
      lines.push('');
    }
    return lines.join('\n');
  };

  const handleSubmitEmail = () => {
    const body = buildEmailBody();
    const subject = encodeURIComponent(`Intake Questionnaire: ${child?.name ?? ''} — ${q.title}`);
    const encodedBody = encodeURIComponent(body);
    const mailto = `mailto:${q.professionalEmail}?subject=${subject}&body=${encodedBody}`;
    updateQuestionnaire(q.id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      responses,
    });
    Linking.openURL(mailto).catch(() =>
      Alert.alert('Cannot open email', 'Please make sure you have an email app configured.')
    );
    navigation.goBack();
  };

  const handleSubmitPortal = () => {
    updateQuestionnaire(q.id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      responses,
    });
    Alert.alert(
      'Submitted',
      `Your responses have been saved and are now visible to ${q.professionalName} in their portal.`,
      [{ text: 'Done', onPress: () => navigation.goBack() }]
    );
  };

  const handleSubmit = () => {
    const unanswered = q.questions.filter(
      (question) => question.required && !responses[question.id]
    );
    if (unanswered.length > 0) {
      Alert.alert('Missing answers', `Please answer all required questions (${unanswered.length} remaining).`);
      return;
    }
    Alert.alert(
      'Submit Questionnaire',
      'How would you like to send your responses?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send via Email', onPress: handleSubmitEmail },
        { text: 'Submit to Portal', onPress: handleSubmitPortal },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerCard}>
          <Text style={styles.fromLabel}>
            From {q.professionalName} · {ROLE_LABELS[q.professionalRole] ?? q.professionalRole}
          </Text>
          <Text style={styles.title}>{q.title}</Text>
          {q.description ? <Text style={styles.description}>{q.description}</Text> : null}
          {child && (
            <View style={styles.childBadge}>
              <Text style={styles.childBadgeText}>{child.avatarEmoji} {child.name}</Text>
            </View>
          )}
        </View>

        {/* Questions */}
        {q.questions.map((question, index) => (
          <View key={question.id} style={styles.questionCard}>
            <Text style={styles.questionNumber}>Question {index + 1}{question.required ? ' *' : ''}</Text>
            <Text style={styles.questionText}>{question.question}</Text>

            {/* Text */}
            {question.type === 'text' && (
              <TextInput
                style={styles.input}
                placeholder="Your answer..."
                value={(responses[question.id] as string) ?? ''}
                onChangeText={(v) => setResponse(question.id, v)}
                placeholderTextColor={colors.textMuted}
              />
            )}

            {/* Multiline */}
            {question.type === 'multiline' && (
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Your answer..."
                value={(responses[question.id] as string) ?? ''}
                onChangeText={(v) => setResponse(question.id, v)}
                multiline
                numberOfLines={4}
                placeholderTextColor={colors.textMuted}
              />
            )}

            {/* Yes/No */}
            {question.type === 'yesno' && (
              <View style={styles.yesnoRow}>
                {['Yes', 'No'].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.yesnoBtn, responses[question.id] === opt && styles.yesnoBtnActive]}
                    onPress={() => setResponse(question.id, opt)}
                  >
                    <Text style={[styles.yesnoBtnText, responses[question.id] === opt && styles.yesnoBtnTextActive]}>
                      {opt === 'Yes' ? '✓ Yes' : '✗ No'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Scale 1–5 */}
            {question.type === 'scale' && (
              <View style={styles.scaleRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.scaleBtn, responses[question.id] === n && styles.scaleBtnActive]}
                    onPress={() => setResponse(question.id, n)}
                  >
                    <Text style={[styles.scaleBtnText, responses[question.id] === n && styles.scaleBtnTextActive]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Multiselect */}
            {question.type === 'multiselect' && question.options && (
              <View style={styles.multiselectGrid}>
                {question.options.map((opt) => {
                  const selected = ((responses[question.id] as string[]) ?? []).includes(opt);
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.multiselectChip, selected && styles.multiselectChipActive]}
                      onPress={() => toggleMultiselect(question.id, opt)}
                    >
                      <Text style={[styles.multiselectChipText, selected && styles.multiselectChipTextActive]}>
                        {selected ? '✓ ' : ''}{opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>Submit Responses</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  error: { padding: spacing.lg, color: colors.error },
  headerCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  fromLabel: { fontSize: typography.fontSizeXS, color: 'rgba(255,255,255,0.8)', marginBottom: spacing.xs },
  title: { fontSize: typography.fontSizeXL, fontWeight: typography.fontWeightBold, color: '#fff', marginBottom: spacing.xs },
  description: { fontSize: typography.fontSizeSM, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
  childBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  childBadgeText: { color: '#fff', fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold },
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  questionNumber: { fontSize: typography.fontSizeXS, color: colors.primary, fontWeight: typography.fontWeightSemiBold, marginBottom: 4 },
  questionText: { fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold, color: colors.textPrimary, marginBottom: spacing.md, lineHeight: 22 },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSizeMD,
    color: colors.textPrimary,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  yesnoRow: { flexDirection: 'row', gap: spacing.md },
  yesnoBtn: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  yesnoBtnActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  yesnoBtnText: { fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold, color: colors.textSecondary },
  yesnoBtnTextActive: { color: '#fff' },
  scaleRow: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  scaleBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleBtnActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  scaleBtnText: { fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightBold, color: colors.textSecondary },
  scaleBtnTextActive: { color: '#fff' },
  multiselectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  multiselectChip: {
    backgroundColor: colors.background,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  multiselectChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  multiselectChipText: { fontSize: typography.fontSizeSM, color: colors.textSecondary, fontWeight: typography.fontWeightMedium },
  multiselectChipTextActive: { color: '#fff' },
  submitBtn: {
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
  submitBtnText: { color: '#fff', fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightBold },
});
