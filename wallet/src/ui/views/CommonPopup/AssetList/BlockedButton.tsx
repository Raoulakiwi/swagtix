/**
 * BlockedButton
 *
 * Original behaviour: display tokens that the user had manually blocked,
 * fetched from the complex Rabby Redux store.  In the trimmed SwagTix wallet
 * we no longer maintain that store nor expose a *blocked-tokens* feature.
 *
 * For now the component simply renders `null`, removing the button from the UI
 * and eliminating dependence on the removed store selectors.  If a future
 * version of SwagTix re-introduces the concept of blocked tokens this
 * component can be re-implemented with a lightweight data source.
 */

import React from 'react';

interface Props {
  onClickLink: () => void;
  isTestnet: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const BlockedButton: React.FC<Props> = ({ onClickLink, isTestnet }) => {
  return null;
};

export default BlockedButton;
