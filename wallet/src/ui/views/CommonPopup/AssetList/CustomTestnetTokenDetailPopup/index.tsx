/**
 * CustomTestnetTokenDetailPopup
 *
 * Original Purpose: In Rabby Wallet, this component displayed a popup with detailed
 * information for a token on a custom testnet. It used `useRabbyDispatch` for
 * potential actions related to these tokens (e.g., adding to a custom list).
 *
 * Current Status in SwagTix Wallet:
 * The SwagTix wallet is designed as a simplified, PulseChain-focused (mainnet)
 * wallet. Support for custom testnets and the detailed display of their assets
 * are not core to this functionality. The complex Redux store, including
 * `useRabbyDispatch`, has been removed.
 *
 * To resolve build errors and align with the simplified scope, this component
 * now returns `null`. This effectively removes the popup functionality from the UI.
 * If SwagTix ever requires detailed views for specific assets (e.g., NFT tickets),
 * a new component tailored to that purpose should be created, using SwagTix's
 * specific data sources and architecture.
 */
import React from 'react';
// Removed Popup import as it's not used when returning null.
// import { Popup } from '@/ui/component';
// Removed TokenItem import as it's not used.
// import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
// Removed CustomTestnetTokenDetail import as it's not used.
// import CustomTestnetTokenDetail from './CustomTestnetTokenDetail';
// Removed Account import as it's not used.
// import { Account } from '@/background/service/preference';

// Removed getUiType import as it's not used.
// import { getUiType } from '@/ui/utils';

// const isTab = getUiType().isTab;
// const getContainer = isTab ? '.js-rabby-popup-container' : undefined;

interface TokenDetailPopupProps {
  // Original props are kept for potential future reference but are not used now.
  // visible?: boolean;
  // onClose?(): void;
  // token?: TokenItem | null;
  // account?: Account;
}
export const CustomTestnetTokenDetailPopup: React.FC<TokenDetailPopupProps> = (
  /* props */
) => {
  // Removed useRabbyDispatch as it's no longer available and not needed.
  // const dispatch = useRabbyDispatch();

  // All original logic related to displaying the popup and token details
  // has been removed as custom testnet support is out of scope.

  // Returning null to effectively remove this component from the UI.
  return null;

  // --- Original Logic (for reference, now removed) ---
  // const handleCancel = () => {
  //   props.onClose?.();
  // };

  // return (
  //   <Popup
  //     visible={props.visible}
  //     closable={true}
  //     height={494}
  //     onClose={handleCancel}
  //     className="token-detail-popup"
  //     push={false}
  //     getContainer={getContainer}
  //   >
  //     {props.visible && props.token && (
  //       <CustomTestnetTokenDetail
  //         token={props.token}
  //         onClose={handleCancel}
  //         popupHeight={494}
  //         account={props.account}
  //       />
  //     )}
  //   </Popup>
  // );
};
