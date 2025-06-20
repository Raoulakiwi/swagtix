import React from 'react';

/**
 * OfflineChainNotify Component
 *
 * Original Purpose: Notify the user if a selected chain in Rabby Wallet was offline.
 * This was relevant in a multi-chain context where the wallet might try to connect
 * to various EVM chains, some of which could be temporarily unavailable.
 *
 * Current Status in SwagTix Wallet:
 * As part of simplifying Rabby into a focused NFT ticket wallet for PulseChain,
 * the multi-chain support and the complex store logic (including `offlineChain`
 * from `useRabbySelector`) have been removed. SwagTix is designed to connect
 * primarily to PulseChain.
 *
 * This component now returns `null` to effectively remove it from the UI.
 * If specific PulseChain RPC connectivity status needs to be displayed to the user
 * in the future, it should be handled by a dedicated service or hook that directly
 * checks the PulseChain RPC connection and updates the UI accordingly, rather
 * than relying on the deprecated multi-chain offline detection logic.
 */
const OfflineChainNotify = () => {
  // The original component used useRabbySelector to get `offlineChain` from the store.
  // Since SwagTix is PulseChain-only and the store has been simplified,
  // this specific type of notification is no longer applicable.
  // Returning null effectively removes this component from the UI.
  return null;

  // --- Original Logic (for reference, now removed) ---
  // const { offlineChain } = useRabbySelector((s) => ({
  //   offlineChain: s.chains.offlineChain,
  // }));

  // if (!offlineChain) {
  //   return null;
  // }

  // return (
  //   <div className="offline-chain-notify">
  //     <img src={IconOffline} alt="" className="icon icon-offline" />
  //     <span>
  //       {offlineChain.name} {t('page.dashboard.offline')}
  //     </span>
  //   </div>
  // );
};

export default OfflineChainNotify;
