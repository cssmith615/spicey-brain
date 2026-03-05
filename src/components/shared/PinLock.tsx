import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, radius } from '../../theme';

interface Props {
  title: string;
  subtitle?: string;
  onSuccess: () => void;
  onCancel?: () => void;
  correctPin: string;
}

const PAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
];

export default function PinLock({ title, subtitle, onSuccess, onCancel, correctPin }: Props) {
  const [entered, setEntered] = useState('');
  const [error, setError] = useState(false);
  const shakeAnim = new Animated.Value(0);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handlePress = (key: string) => {
    if (key === '⌫') {
      setEntered((prev) => prev.slice(0, -1));
      setError(false);
      return;
    }
    if (key === '') return;

    const next = entered + key;
    setEntered(next);

    if (next.length === 4) {
      if (next === correctPin) {
        onSuccess();
      } else {
        setError(true);
        shake();
        setTimeout(() => {
          setEntered('');
          setError(false);
        }, 800);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

        {/* Dots */}
        <Animated.View style={[styles.dots, { transform: [{ translateX: shakeAnim }] }]}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                entered.length > i && styles.dotFilled,
                error && styles.dotError,
              ]}
            />
          ))}
        </Animated.View>

        {error && <Text style={styles.errorText}>Incorrect PIN</Text>}

        {/* Keypad */}
        <View style={styles.keypad}>
          {PAD.map((row, ri) => (
            <View key={ri} style={styles.keyRow}>
              {row.map((key, ki) => (
                <TouchableOpacity
                  key={ki}
                  style={[styles.key, key === '' && styles.keyEmpty]}
                  onPress={() => handlePress(key)}
                  disabled={key === ''}
                  activeOpacity={0.7}
                >
                  <Text style={styles.keyText}>{key}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        {onCancel && (
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  lockIcon: { fontSize: 48, marginBottom: spacing.md },
  title: {
    fontSize: typography.fontSizeXXL,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSizeSM,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: colors.primary, borderColor: colors.primary },
  dotError: { backgroundColor: colors.error, borderColor: colors.error },
  errorText: {
    fontSize: typography.fontSizeSM,
    color: colors.error,
    marginBottom: spacing.md,
    fontWeight: typography.fontWeightMedium,
  },
  keypad: { marginTop: spacing.xl, gap: spacing.sm },
  keyRow: { flexDirection: 'row', gap: spacing.sm },
  key: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  keyEmpty: { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0 },
  keyText: {
    fontSize: typography.fontSizeXL,
    fontWeight: typography.fontWeightSemiBold,
    color: colors.textPrimary,
  },
  cancelBtn: { marginTop: spacing.xl },
  cancelText: {
    fontSize: typography.fontSizeMD,
    color: colors.textSecondary,
    fontWeight: typography.fontWeightMedium,
  },
});
