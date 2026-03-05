import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/routineStore';
import { colors, spacing, typography, radius } from '../../theme';
import type { PortalAccess } from '../../types';

interface Props {
  onAccessGranted: (access: PortalAccess) => void;
  onCancel: () => void;
}

export default function PortalEntryScreen({ onAccessGranted, onCancel }: Props) {
  const { portalAccesses, updatePortalAccess } = useAppStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleSubmit = () => {
    const trimmed = code.trim().toUpperCase();
    const match = portalAccesses.find((a) => a.code === trimmed && a.isActive);

    if (!match) {
      setError('Code not found or access has been paused. Check with the parent.');
      shake();
      return;
    }

    updatePortalAccess(match.id, { lastAccessedAt: new Date().toISOString() });
    onAccessGranted(match);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>✕ Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.logo}>🧠</Text>
        <Text style={styles.title}>Professional Portal</Text>
        <Text style={styles.subtitle}>
          Enter the 6-character access code provided by the parent
        </Text>

        <Animated.View style={[styles.inputWrapper, { transform: [{ translateX: shakeAnim }] }]}>
          <TextInput
            style={[styles.codeInput, error ? styles.codeInputError : null]}
            value={code}
            onChangeText={(t) => {
              setCode(t.toUpperCase());
              setError('');
            }}
            placeholder="ABC123"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            maxLength={6}
            autoFocus
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
          />
        </Animated.View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.submitBtn, code.length < 6 && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={code.length < 6}
        >
          <Text style={styles.submitBtnText}>Access Portal</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Don't have a code? Ask the parent to go to Settings → Professional Portal and invite you.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  cancelBtn: { position: 'absolute', top: spacing.md, left: spacing.md, padding: spacing.sm },
  cancelText: { fontSize: typography.fontSizeMD, color: colors.textSecondary, fontWeight: typography.fontWeightMedium },
  logo: { fontSize: 72, marginBottom: spacing.lg },
  title: { fontSize: typography.fontSizeXXL, fontWeight: typography.fontWeightBold, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { fontSize: typography.fontSizeSM, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl, paddingHorizontal: spacing.md },
  inputWrapper: { width: '100%', marginBottom: spacing.sm },
  codeInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    fontSize: 32,
    fontWeight: typography.fontWeightBold,
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: 8,
    width: '100%',
  },
  codeInputError: { borderColor: colors.error },
  errorText: { fontSize: typography.fontSizeSM, color: colors.error, textAlign: 'center', marginBottom: spacing.md, lineHeight: 20 },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitBtnDisabled: { backgroundColor: colors.border, shadowOpacity: 0, elevation: 0 },
  submitBtnText: { fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightBold, color: '#fff' },
  hint: { fontSize: typography.fontSizeXS, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
});
