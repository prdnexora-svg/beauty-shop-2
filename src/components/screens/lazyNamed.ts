// ============================================================================
// NEXORA LUXE — LAZY NAMED-EXPORT HELPER
//
// The screens are named exports (not `export default`), but React.lazy wants a
// default. This wraps the mapping in one place so every screen module stays a
// one-liner and the per-route chunking is consistent.
// ============================================================================

import { lazy, type ComponentType } from 'react';

export function lazyNamed<P = unknown>(
  loader: () => Promise<Record<string, unknown>>,
  exportName: string,
): ComponentType<P> {
  return lazy(() =>
    loader().then((mod) => {
      const component = mod[exportName];
      if (!component) {
        throw new Error(
          `lazyNamed: module has no export named "${exportName}". ` +
            `Available: ${Object.keys(mod).join(', ')}`,
        );
      }
      return { default: component as ComponentType<P> };
    }),
  ) as ComponentType<P>;
}

export default lazyNamed;
