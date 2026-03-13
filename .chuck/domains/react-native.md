# React Native Rules
- SafeAreaView from 'react-native-safe-area-context' (not react-native)
- Alert.prompt is iOS-only — use TextInput in-screen for cross-platform
- Test on both iOS and Android — behaviors differ for keyboards, safe areas, gestures
- Use Dimensions/useWindowDimensions for responsive sizing, not hardcoded pixels
- EAS build requires babel-preset-expo explicitly in babel.config.js
- expo-secure-store for sensitive data (API keys, tokens)
- Avoid heavy libraries that break Metro bundler (ESM-only packages)