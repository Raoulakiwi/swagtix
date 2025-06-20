/**
 * CustomTestnetTokenDetail
 *
 * Original Purpose: In Rabby Wallet, this component displayed detailed information
 * for a token on a custom testnet. It likely used `useRabbySelector` to access
 * details about the specific token and its associated custom testnet from the
 * Redux store.
 *
 * Current Status in SwagTix Wallet:
 * The SwagTix wallet is designed as a simplified, PulseChain-focused (mainnet)
 * wallet. Support for custom testnets and the detailed display of their assets
 * are not core to this functionality. The complex Redux store, including
 * `useRabbySelector` and the state for `customTestnetAssetList`, has been removed.
 *
 * To resolve build errors and align with the simplified scope, this component
 * now returns `null`. This effectively removes it from the UI. If SwagTix
 * ever requires detailed views for specific assets (e.g., NFT tickets),
 * a new component tailored to that purpose should be created, using SwagTix's
 * specific data sources and architecture.
 */
import React from 'react';
// Removed TokenItem import as it's not used when returning null.
// import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';

// Removed useTranslation import as it's not used.
// import { useTranslation } from 'react-i18next';

// Removed other UI component imports as they are not used.
// import { TokenChange, TxId } from '@/ui/component';
// import { sinceTime, openInTab } from 'ui/utils';
// import { findChainByServerID } from '@/utils/chain';
// import { HistoryItem } from '@/ui/views/History/components/HistoryItem';
// import { Skeleton } from 'antd';
// import { useTokenHistory } from '@/ui/hooks/useTokenHistory';
// import { useCommonPopupView } from '@/ui/utils/popup';

// Removed Account import as it's not used.
// import { Account } from '@/background/service/preference';

interface CustomTestnetTokenDetailProps {
  // Original props are kept for potential future reference but are not used now.
  // token: TokenItem;
  // account?: Account;
  // popupHeight?: number;
  // onClose?: () => void;
}

const CustomTestnetTokenDetail: React.FC<CustomTestnetTokenDetailProps> = (
  /* props */
) => {
  // Since custom testnet support and the detailed view for their tokens are
  // out of scope for the simplified SwagTix wallet, and the original Rabby store
  // (useRabbySelector) and its customTestnetAssetList state have been removed,
  // this component will now return null.
  // This resolves build errors and removes the feature from the UI.
  return null;

  // --- Original Logic (for reference, now removed) ---
  // const { t } = useTranslation();
  // const { customTestnetAssetList } = useRabbySelector((s) => ({
  //   customTestnetAssetList: s.customRPC.customTestnetAssetList,
  // }));
  // const { getTokenHistory, tokenHistoryList, tokenHistoryLoading } =
  //   useTokenHistory(props.token, props.account);
  // const { setData } = useCommonPopupView();
  // const history = useHistory();

  // const currentChain = useMemo(
  //   () =>
  //     customTestnetAssetList.find((item) => item.id === props.token.chain),
  //   [customTestnetAssetList, props.token]
  // );

  // React.useEffect(() => {
  //   if (props.token && props.account) {
  //     getTokenHistory();
  //   }
  // }, [props.token, props.account]);

  // if (!props.token) {
  //   return (
  //     <div
  //       className="token-detail"
  //       style={{
  //         height: props.popupHeight,
  //       }}
  //     >
  //       <Skeleton active />
  //     </div>
  //   );
  // }
  // ... rest of the original component JSX and logic
};

export default CustomTestnetTokenDetail;
