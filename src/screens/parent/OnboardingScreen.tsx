import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../store/routineStore';
import { colors, spacing, typography, radius } from '../../theme';
import { generateId } from '../../utils';

const { width } = Dimensions.get('window');

const STEPS = [
  {
    emoji: '🧠',
    title: 'Welcome to\nSpicey Brain',
    body: 'A routine companion built for kids with ADHD — and the parents who love them.',
    cta: 'Get Started',
  },
  {
    emoji: '🎯',
    title: 'Missions, not chores',
    body: 'Tasks become missions. Completing them earns stars. Stars unlock real-world rewards you set.',
    cta: 'Sounds good',
  },
  {
    emoji: '🧩',
    title: 'One thing at a time',
    body: "Your child sees one mission at a time — no overwhelming lists. Just the next step, clearly shown.",
    cta: 'Love it',
  },
  {
    emoji: '🔒',
    title: 'You stay in control',
    body: "Set a parent PIN to protect settings. Kids get their own view — age-appropriate and distraction-free.",
    cta: "Let's set up",
  },
];

interface Props {
  onEnterPortal?: () => void;
}

export default function OnboardingScreen({ onEnterPortal }: Props) {
  const navigation = useNavigation<any>();
  const { setParentProfile } = useAppStore();

  const [step, setStep] = useState(0);
  const [setupStep, setSetupStep] = useState<'slides' | 'name' | 'pin'>('slides');
  const [parentName, setParentName] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState('');

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = (next: () => void) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      next();
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const handleSlideCta = () => {
    if (step < STEPS.length - 1) {
      animateTransition(() => setStep((s) => s + 1));
    } else {
      animateTransition(() => setSetupStep('name'));
    }
  };

  const handleNameNext = () => {
    if (!parentName.trim()) return;
    animateTransition(() => setSetupStep('pin'));
  };

  const handlePinNext = () => {
    if (pin.length !== 4) {
      setPinError('PIN must be 4 digits');
      return;
    }
    if (pin !== pinConfirm) {
      setPinError('PINs do not match');
      setPinConfirm('');
      return;
    }
    const profile = {
      id: generateId(),
      name: parentName.trim(),
      pin,
      childProfiles: [],
    };
    setParentProfile(profile);
    navigation.replace('Home');
  };

  if (setupStep === 'name') {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.setupContent, { opacity: fadeAnim }]}>
          <Text style={styles.setupEmoji}>👋</Text>
          <Text style={styles.setupTitle}>What's your name?</Text>
          <Text style={styles.setupSubtitle}>We'll use this to personalise your experience</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            value={parentName}
            onChangeText={setParentName}
            autoFocus
            autoCapitalize="words"
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity
            style={[styles.ctaButton, !parentName.trim() && styles.ctaDisabled]}
            onPress={handleNameNext}
            disabled={!parentName.trim()}
          >
            <Text style={styles.ctaButtonText}>Continue →</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  if (setupStep === 'pin') {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.setupContent, { opacity: fadeAnim }]}>
          <Text style={styles.setupEmoji}>🔐</Text>
          <Text style={styles.setupTitle}>Set a Parent PIN</Text>
          <Text style={styles.setupSubtitle}>
            This protects your settings and lets you switch between parent and child views
          </Text>
          <Text style={styles.inputLabel}>Create PIN</Text>
          <TextInput
            style={styles.input}
            placeholder="4 digits"
            value={pin}
            onChangeText={(t) => { setPin(t.replace(/\D/g, '').slice(0, 4)); setPinError(''); }}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.inputLabel}>Confirm PIN</Text>
          <TextInput
            style={styles.input}
            placeholder="Repeat PIN"
            value={pinConfirm}
            onChangeText={(t) => { setPinConfirm(t.replace(/\D/g, '').slice(0, 4)); setPinError(''); }}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            placeholderTextColor={colors.textMuted}
          />
          {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}
          <TouchableOpacity
            style={[styles.ctaButton, pin.length < 4 && styles.ctaDisabled]}
            onPress={handlePinNext}
            disabled={pin.length < 4}
          >
            <Text style={styles.ctaButtonText}>Finish Setup</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  const current = STEPS[step];

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.slideContent, { opacity: fadeAnim }]}>
        <Text style={styles.slideEmoji}>{current.emoji}</Text>
        <Text style={styles.slideTitle}>{current.title}</Text>
        <Text style={styles.slideBody}>{current.body}</Text>
      </Animated.View>

      {/* Step dots */}
      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.slideFooter}>
        <TouchableOpacity style={styles.ctaButton} onPress={handleSlideCta}>
          <Animated.Text style={[styles.ctaButtonText, { opacity: fadeAnim }]}>
            {current.cta}
          </Animated.Text>
        </TouchableOpacity>
        {step > 0 ? (
          <TouchableOpacity onPress={() => animateTransition(() => setStep((s) => s - 1))}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        ) : onEnterPortal ? (
          <TouchableOpacity onPress={onEnterPortal}>
            <Text style={styles.backText}>Professional? Enter portal code →</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  slideEmoji: { fontSize: 96, marginBottom: spacing.xl },
  slideTitle: {
    fontSize: typography.fontSizeXXL,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 38,
  },
  slideBody: {
    fontSize: typography.fontSizeMD,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  dotActive: { backgroundColor: colors.primary, width: 24 },
  slideFooter: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
  },
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    width: '100%',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaDisabled: { backgroundColor: colors.border, shadowOpacity: 0, elevation: 0 },
  ctaButtonText: {
    fontSize: typography.fontSizeLG,
    fontWeight: typography.fontWeightBold,
    color: '#fff',
  },
  backText: {
    fontSize: typography.fontSizeSM,
    color: colors.textSecondary,
    fontWeight: typography.fontWeightMedium,
  },
  setupContent: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  setupEmoji: { fontSize: 64, marginBottom: spacing.lg, textAlign: 'center' },
  setupTitle: {
    fontSize: typography.fontSizeXXL,
    fontWeight: typography.fontWeightBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  setupSubtitle: {
    fontSize: typography.fontSizeSM,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  inputLabel: {
    fontSize: typography.fontSizeSM,
    fontWeight: typography.fontWeightSemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSizeLG,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  pinError: {
    fontSize: typography.fontSizeSM,
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
