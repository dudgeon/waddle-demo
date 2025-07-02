## Core Principles
- Never add, remove, or change functionality without explicit permission. Only auto-accept changes that do not affect functionality, or implement approved changes to functionality.

## Critical Import Dependencies
- `chat-service-demo.tsx` MUST remain at project root - imported by `src/components/BlogPage.tsx`
- Always include `.tsx` extension in imports for TypeScript files
- Breaking the BlogPage → ChatServiceDemo import will cause frontend startup failure