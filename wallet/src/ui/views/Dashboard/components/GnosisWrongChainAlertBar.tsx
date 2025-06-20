/**
 * GnosisWrongChainAlert
 *
 * In the full Rabby wallet this component warned the user when their Gnosis
 * Safe was connected to the wrong chain.  The simplified SwagTix wallet has
 * removed the complex Redux store (`useRabbySelector`) and multi-chain Gnosis
 * support, so this alert is no longer relevant.
 *
 * We keep the component as a placeholder returning `null` to avoid breaking
 * imports elsewhere while removing unnecessary logic.
 */

import React from 'react';

// The filename is `GnosisWrongChainAlertBar.tsx`; keep the component name in sync.
const GnosisWrongChainAlertBar = () => {
  return null;
};

export default GnosisWrongChainAlertBar;
