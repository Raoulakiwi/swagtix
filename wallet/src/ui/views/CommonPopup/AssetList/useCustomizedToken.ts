import { useWallet } from '@/ui/utils';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { useCallback, useEffect, useState } from 'react';

// Since the original Rabby store (and useRabbySelector) is removed,
// this hook will now return default/empty values for customized tokens.
// The functionality of managing a user-defined list of custom tokens is
// considered out of scope for the simplified SwagTix NFT ticket wallet.

export const useCustomizedToken = () => {
  const wallet = useWallet();
  const [customizedTokenList, setCustomizedTokenList] = useState<TokenItem[]>(
    []
  );
  const [blockedTokenList, setBlockedTokenList] = useState<TokenItem[]>([]);

  // In the original Rabby, this would fetch from a persisted store.
  // For SwagTix, we'll keep it simple: no persisted custom tokens.
  const getCustomizedTokenList = useCallback(async () => {
    // const account = await wallet.getCurrentAccount();
    // if (!account) return [];
    // const list = await wallet.getCustomizedToken(account.address);
    // setCustomizedTokenList(list);
    // return list;
    setCustomizedTokenList([]); // Always return empty for simplified wallet
    return [];
  }, [/* wallet */]); // wallet dependency removed as it's not used

  const getBlockedTokenList = useCallback(async () => {
    // const account = await wallet.getCurrentAccount();
    // if (!account) return [];
    // const list = await wallet.getBlockedToken(account.address);
    // setBlockedTokenList(list);
    // return list;
    setBlockedTokenList([]); // Always return empty for simplified wallet
    return [];
  }, [/* wallet */]); // wallet dependency removed as it's not used

  useEffect(() => {
    getCustomizedTokenList();
    getBlockedTokenList();
  }, [getCustomizedTokenList, getBlockedTokenList]);

  const addCustomizedToken = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (token: TokenItem) => {
      // No-op: Customized tokens are not a feature in the simplified wallet.
      // await getCustomizedTokenList(); // Refresh list (not needed now)
      return Promise.resolve();
    },
    [/* getCustomizedTokenList */]
  );

  const removeCustomizedToken = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (token: TokenItem) => {
      // No-op
      // await getCustomizedTokenList(); // Refresh list (not needed now)
      return Promise.resolve();
    },
    [/* getCustomizedTokenList */]
  );

  const editCustomizedToken = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (token: TokenItem) => {
      // No-op
      // await getCustomizedTokenList(); // Refresh list (not needed now)
      return Promise.resolve();
    },
    [/* getCustomizedTokenList */]
  );

  const getCustomizedTokenById = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (id: string, chain?: string) => {
      // No-op, always return null as there are no customized tokens
      return null;
    },
    [/* customizedTokenList */] // No longer depends on customizedTokenList
  );

  const checkToken = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (item: TokenItem) => {
      // No-op, always return false as there are no customized or blocked tokens
      return {
        isAdded: false,
        isBlocked: false,
      };
    },
    [/* customizedTokenList, blockedTokenList */] // No longer depends on these lists
  );

  return {
    customizedTokenList,
    blockedTokenList,
    addCustomizedToken,
    removeCustomizedToken,
    editCustomizedToken,
    getCustomizedTokenById,
    checkToken,
    getCustomizedTokenList,
    getBlockedTokenList,
  };
};
