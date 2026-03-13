# Zustand Rules
- All persistent state goes in the Zustand store — no useState for data that survives navigation
- Use persist middleware with AsyncStorage for mobile persistence
- Selectors over full store subscriptions — prevents unnecessary re-renders
- Keep store actions co-located with state in the same slice
- Never mutate state directly — use Immer or spread