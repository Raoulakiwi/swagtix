/**
 * CustomTestnetAssetListContainer
 *
 * Original Purpose: In Rabby Wallet, this component was responsible for displaying
 * a list of assets on custom testnets. It used `useRabbySelector` to fetch
 * the `customTestnetAssetList` from the Redux store.
 *
 * Current Status in SwagTix Wallet:
 * The SwagTix wallet is designed to be a simplified, PulseChain-focused (mainnet)
 * wallet for NFT tickets. Custom testnet support and the display of testnet assets
 * are not part of its core functionality. The complex Redux store, including
 * `useRabbySelector` and the `customTestnetAssetList` state, has been removed.
 *
 * To resolve build errors and align with the simplified scope, this component
 * now returns `null`, effectively removing it from the UI. If custom testnet
 * support were to be added to SwagTix in the future, this component would need
 * to be re-implemented with a new data source and logic appropriate for SwagTix's
 * architecture.
 */
import React from 'react';

// Removed AssetListProps import as it's not used when returning null.
// import { AssetListProps } from '../AssetList';

// Removed useWallet import as it's not used.
// import { useWallet } from '@/ui/utils';

// Removed useAsync import as it's not used.
// import { useAsync } from 'react-use';

// Removed TokenWithAmount and TokenItem imports as they are not used.
// import { TokenWithAmount, TokenItem } from '@rabby-wallet/rabby-api/dist/types';

type Props = {
  className?: string;
  // Original props are kept for potential future reference but are not used now.
  // onTokenSelect?: AssetListProps['onTokenSelect'];
  // height?: number;
  // type?: string;
};

const CustomTestnetAssetListContainer = (/* props: Props */) => {
  // Since custom testnet support is out of scope for the simplified SwagTix wallet,
  // and the original Rabby store (useRabbySelector) and its customTestnetAssetList
  // state have been removed, this component will now return null.
  // This resolves build errors and removes the feature from the UI.
  return null;

  // --- Original Logic (for reference, now removed) ---
  // const wallet = useWallet();
  // const { customTestnetAssetList } = useRabbySelector((s) => ({
  //   customTestnetAssetList: s.customRPC.customTestnetAssetList,
  // }));

  // const { value: list, loading } = useAsync(async () => {
  //   const account = await wallet.getCurrentAccount();
  //   if (!account) return [];
  //   const currentChain = customTestnetAssetList.find(
  //     (item) => item.id === account.address
  //   );
  //   if (!currentChain) return [];
  //   const result: TokenWithAmount[] = currentChain.list.map((item) => ({
  //     ...item,
  //     amount: item.amount,
  //     price: item.price || 0,
  //   }));
  //   return result;
  // }, [customTestnetAssetList]);

  // return (
  //   <AssetList
  //     className={props.className}
  //     list={list}
  //     isLoading={loading}
  //     onTokenSelect={props.onTokenSelect}
  //     height={props.height}
  //     type={props.type}
  //   />
  // );
};

export default CustomTestnetAssetListContainer;
