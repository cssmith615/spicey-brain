import React, { useEffect, useRef } from 'react';
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
  childName: string;
  routineName: string;
  starsEarned: number;
  totalStars: number;
  onDone: () => void;
}

export default function CompletionScreen({
  childName,
  routineName,
  starsEarned,
  totalStars,
  onDone,
}: Props) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Brain character celebration */}
        <Animated.Text style={[styles.brainEmoji, { transform: [{ scale: scaleAnim }] }]}>
          🧠
        </Animated.Text>

        <Text style={styles.congrats}>Amazing job,</Text>
        <Text style={styles.childName}>{childName}!</Text>

        <Text style={styles.routineComplete}>
          You finished your{'\n'}
          <Text style={styles.routineName}>{routineName}</Text>
        </Text>

        {/* Stars earned */}
        <View style={styles.starsCard}>
          <Text style={styles.starsLabel}>Stars earned</Text>
          <Text style={styles.starsEarned}>⭐ +{starsEarned}</Text>
          <Text style={styles.starsTotal}>Total: ⭐ {totalStars}</Text>
        </View>

        {/* Encouragement */}
        <Text style={styles.message}>
          Every mission you complete makes your brain even more powerful! 💪
        </Text>

        <TouchableOpacity style={styles.doneButton} onPress={onDone}>
          <Text style={styles.doneButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.childBackground,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  brainEmoji: {
    fontSize: 96,
    marginBottom: spacing.lg,
  },
  congrats: {
    fontSize: typography.fontSizeXL,
    color: colors.textSecondary,
    fontWeight: typography.fontWeightRegular,
  },
  childName: {
    fontSize: typography.fontSizeHero,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  routineComplete: {
    fontSize: typography.fontSizeLG,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 28,
  },
  routineName: {
    fontWeight: typography.fontWeightBold,
    color: colors.primary,
  },
  starsCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    width: '100%',
  },
  starsLabel: {
    fontSize: typography.fontSizeSM,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  starsEarned: {
    fontSize: typography.fontSizeXXL,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  starsTotal: {
    fontSize: typography.fontSizeSM,
    color: colors.textSecondary,
  },
  message: {
    fontSize: typography.fontSizeMD,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  doneButtonText: {
    fontSize: typography.fontSizeLG,
    fontWeight: typography.fontWeightBold,
    color: '#fff',
  },
});
