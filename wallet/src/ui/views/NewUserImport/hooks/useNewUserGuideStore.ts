/**
 * SwagTix – New-User Guide Store (simplified)
 *
 * The original Rabby implementation relied on the global Redux store hooks
 * (`useRabbyDispatch`, `useRabbyGetter`, `useSelector`, etc.).  In the trimmed
 * SwagTix wallet we no longer ship that store, so this hook is refactored to
 * use a lightweight module-level state container.
 *
 * This keeps the API surface (`store`, `setStore`, `clearStore`) intact for
 * the components that already depend on it, but with a minimal internal
 * implementation:
 *   • `store`             – plain JS object (initially empty)
 *   • `setStore(partial)` – shallow-merge update
 *   • `clearStore()`      – reset all keys to `undefined`
 *
 * No external dependencies (Redux / Rematch) remain, preventing build-time
 * errors while preserving runtime safety.
 */

import React from 'react';

export const useNewUserGuideStore = () => {
  /* ------------------------------------------------------------------
   * Module-level fallback store
   * Maintained across hook calls within the current tab / extension context.
   * ------------------------------------------------------------------ */
  const storeRef = React.useRef<Record<string, any>>({});

  /* React state is kept in sync with the mutable ref so that components
   * re-render when `setStore` mutates values. */
  const [, forceUpdate] = React.useState(0);

  /** Merge partial updates into the store (shallow) */
  const setStore = React.useCallback(
    (partial: Record<string, any>) => {
      Object.assign(storeRef.current, partial);
      forceUpdate((n) => n + 1); // trigger re-render
    },
    []
  );

  /** Reset all keys to `undefined` */
  const clearStore = React.useCallback(() => {
    Object.keys(storeRef.current).forEach((k) => {
      storeRef.current[k] = undefined;
    });
    forceUpdate((n) => n + 1);
  }, []);

  return {
    store: storeRef.current,
    setStore,
    clearStore,
  };
};
