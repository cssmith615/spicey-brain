# TypeScript Rules
- Centralize all types in src/types/index.ts — no duplicate local type definitions
- Prefer interfaces over type aliases for object shapes
- Use strict mode — never use 'any', use 'unknown' + type guards instead
- Avoid non-null assertion (!) — handle nullability explicitly
- Generic constraints over 'any' in utility functions