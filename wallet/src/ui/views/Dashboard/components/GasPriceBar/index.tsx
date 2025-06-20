import React from 'react';

/**
 * GasPriceBar Component
 *
 * Original Purpose: Display current gas prices for selected chains.
 * This was a feature of the full Rabby wallet, relying on complex store logic
 * (e.g., `useRabbySelector` and `gas.gasPrice`) to fetch and display real-time
 * gas information.
 *
 * Current Status in SwagTix Wallet:
 * As part of simplifying the Rabby wallet into a focused NFT ticket solution
 * for PulseChain, most DeFi-centric features, including detailed gas price
 * tracking and display, have been removed. The underlying store and services
 * that provided this data are no longer present.
 *
 * This component is now a placeholder and returns `null` to effectively remove
 * the gas price bar from the UI. If a gas price indicator is needed in the future
 * for the SwagTix wallet, it would likely be a much simpler implementation focused
 * solely on PulseChain and integrated directly with the `walletController` or
 * a dedicated PulseChain service.
 *
 * To re-enable or re-implement gas price display:
 * 1. Ensure a service exists to fetch current gas prices for PulseChain.
 * 2. Update this component to use that service (e.g., via a custom hook).
 * 3. Design a UI suitable for displaying PulseChain gas information if needed.
 */
const GasPriceBar = () => {
  // The original component used useRabbySelector to get gasPrice from the store.
  // Since the store has been simplified and this feature is not core to an NFT ticket wallet,
  // we return null to effectively remove this component from the UI.
  return null;

  // --- Original Logic (for reference, now removed) ---
  // const { gasPrice, customRPC } = useRabbySelector((s: RootState) => ({
  //   gasPrice: s.gas.gasPrice,
  //   customRPC: s.preference.customRPC,
  // }));
  // const wallet = useWallet();
  // const { t } = useTranslation();
  // const { activePopup } = useCommonPopupView();

  // const chain = useMemo(() => {
  //   return findChain({
  //     enum: CHAINS_ENUM.ETH,
  //   });
  // }, []);

  // const currentGas = useMemo(() => {
  //   if (!chain) return null;
  //   const custom = customRPC[chain.serverId];
  //   if (custom && custom.isTestnet) {
  //     return null;
  //   }
  //   const price = gasPrice[chain.id];
  //   if (!price || price.normal === undefined) return null;
  //   return price;
  // }, [gasPrice, chain, customRPC]);

  // const handleClickGas = () => {
  //   if (!chain) return;
  //   activePopup('GasPrice');
  //   matomoRequestEvent({
  //     category: 'GasPrice',
  //     action: 'Click',
  //     label: chain.name,
  //   });
  // };

  // if (!currentGas) {
  //   return <></>;
  // }

  // return (
  //   <div className="gas-price-bar" onClick={handleClickGas}>
  //     <img src={IconGas} alt="" className="icon icon-gas" />
  //     <span className="gas-price-bar-text">
  //       {Math.round(currentGas.normal / 1e9)}
  //     </span>
  //   </div>
  // );
};

export default GasPriceBar;
