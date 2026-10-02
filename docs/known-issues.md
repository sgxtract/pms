# Known Issues

## React warning: "Encountered a script tag while rendering React component"

**Where:** browser console, development only.

**Cause:** `next-themes` (0.4.6) renders its theme script as a React element, which React 19 warns about when rendering in the browser. This is a known upstream issue (pacocoursey/next-themes#385, #387, #397); the library has not been updated since March 2025.

**Impact:** none. The theme loads correctly without a flash, and the warning does not appear in production builds.

**Decision:** accepted for now. Console filtering and patching the library were rejected because they hide real errors or break on updates.

**If it needs replacing:** `next-themes` is only used in `src/components/providers/theme-provider.tsx` and `src/components/ui/theme-toggle.tsx`.
