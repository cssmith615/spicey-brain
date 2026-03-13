# React Rules
- Use functional components only — no class components
- TypeScript always — .tsx/.ts, never .jsx/.js
- Prefer named exports over default exports
- Keep components focused — one responsibility per component
- Extract repeated logic into custom hooks
- Never use inline styles — use StyleSheet.create or theme constants
- Use expo-* packages where available instead of bare RN equivalents
- Dynamic require() for expo-notifications (static import crashes Expo Go on Android)
- Avoid prop drilling more than 2 levels — use context or store instead