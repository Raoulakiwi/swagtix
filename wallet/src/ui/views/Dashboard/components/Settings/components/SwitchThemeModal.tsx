/**
 * SwitchThemeModal
 *
 * In the full Rabby wallet this component allowed users to switch between
 * light / dark / system theme modes via the Redux store.  In the simplified
 * SwagTix wallet we removed the complex store, so this modal no longer has
 * a data-source to work with.  Until a lightweight theme mechanism is
 * re-implemented the modal is disabled and returns `null`.
 */

import React from 'react';

export default function SwitchThemeModal(): JSX.Element | null {
  // Feature not available in the trimmed wallet – hide the modal.
  return null;
}
