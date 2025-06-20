import { createPersistStore } from '@/background/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useWallet } from '@/ui/utils';
import { matomoRequestEvent } from '@/utils/matomo-request';
import { Account } from 'background/service/preference'; // Keep if Account type is used, otherwise remove
// Removed: import { useRabbyDispatch, useRabbyGetter } from '@/ui/store';
// Removed: import { Account }_raw from 'src/ui/assets/bridge/refresh-cc.svg'; // Likely unused asset
import { useInterval } from 'ahooks';
import { BALANCE_LOADING_CONFS } from '@/constant/timeout';

interface HomeBalanceCache {
  balance: number | null;
  originalCurveData: any[]; // Use 'any' as CurveData type might be complex/unavailable
  matteredChainBalances: any[]; // Use 'any' for now
  chainBalancesWithValue: any[]; // Use 'any' for now
  updateAt: number;
}

const initialHomeBalanceCache: HomeBalanceCache = {
  balance: null,
  originalCurveData: [],
  matteredChainBalances: [],
  chainBalancesWithValue: [],
  updateAt: 0,
};

const homeBalanceCacheStore = createPersistStore<
  Record<string, HomeBalanceCache>
>({
  name: 'homeBalanceCache',
  template: {},
});

export function useHomeBalanceView(address?: string | null) {
  const [currentHomeBalanceCache, setCurrentHomeBalanceCache] = useState<
    HomeBalanceCache | null | undefined
  >(undefined); // Initialize as undefined, set to null after attempting to load

  const getHomeBalanceCache = useCallback(
    async (addr?: string | null): Promise<HomeBalanceCache | null> => {
      if (!addr) return null;
      // Since we are simplifying, we might not actually fetch from store or return a default.
      // For now, let's reflect that it would attempt to get from store, but simplified.
      // const cache = await homeBalanceCacheStore.get();
      // return cache[addr.toLowerCase()] || null;
      return Promise.resolve(null); // Always return null or a default empty state
    },
    []
  );

  const updateHomeBalanceCache = useCallback(
    async (
      addr: string | null | undefined,
      data: Partial<HomeBalanceCache>
    ): Promise<void> => {
      if (!addr) return;
      // This function will become a no-op or store minimal default data.
      // const cache = await homeBalanceCacheStore.get();
      // const lcAddr = addr.toLowerCase();
      // await homeBalanceCacheStore.set({
      //   ...cache,
      //   [lcAddr]: {
      //     ...(cache[lcAddr] || initialHomeBalanceCache), // Ensure all fields are present
      //     ...data,
      //     updateAt: Date.now(),
      //   } as HomeBalanceCache,
      // });
      return Promise.resolve(); // No-op
    },
    []
  );

  useEffect(() => {
    if (!address) {
      setCurrentHomeBalanceCache(null);
      return;
    }
    // In simplified version, always set to null or default as we are not using cache
    setCurrentHomeBalanceCache(null);
    // getHomeBalanceCache(address).then(setCurrentHomeBalanceCache);
  }, [address, getHomeBalanceCache]);

  return {
    currentHomeBalanceCache,
    updateHomeBalanceCache,
    getHomeBalanceCache,
  };
}

export function useRefreshHomeBalanceView({
  currentAddress, // This might still be passed but not used extensively
  refreshBalance, // Callback to refresh balance in parent component
  refreshCurve, // Callback to refresh curve in parent component
  isExpired, // Callback to check if cache is expired
}: {
  currentAddress?: string | null;
  refreshBalance?: () => void;
  refreshCurve?: () => void;
  isExpired?: () => Promise<{
    balanceExpired: boolean;
    curveExpired: boolean;
    expired: boolean;
  }>;
}) {
  const wallet = useWallet(); // May still be needed for other minor things or future use
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const onRefresh = useCallback(
    async ({
      isManual = true,
    }: {
      balanceExpired?: boolean; // Kept for signature, but logic might be removed
      curveExpired?: boolean; // Kept for signature, but logic might be removed
      isManual?: boolean;
    } = {}) => {
      if (!currentAddress) return;
      if (isManual) {
        setIsManualRefreshing(true); // Still set this for UI feedback if any component uses it
        matomoRequestEvent({
          category: 'Home',
          action: 'refresh',
          label: currentAddress,
        });
      }

      // The original logic dispatched actions to fetch account alianName.
      // This is removed as useRabbyDispatch is removed.
      // const isAlianNameExist = await wallet.isAlianNameExist(currentAddress);
      // if (!isAlianNameExist) {
      //   // dispatch.account.fetchAccounts({ address: currentAddress });
      // } else {
      //   // dispatch.account.getAlianName(currentAddress);
      // }

      // Call provided refresh functions if they exist
      const tasks: Promise<any>[] = [];
      if (refreshBalance) {
        tasks.push(Promise.resolve(refreshBalance()));
      }
      if (refreshCurve) {
        tasks.push(Promise.resolve(refreshCurve()));
      }
      
      if (tasks.length > 0) {
        await Promise.all(tasks);
      }

      if (isManual) {
        setIsManualRefreshing(false);
      }
    },
    [currentAddress, refreshBalance, refreshCurve, wallet] // wallet kept for potential future use
  );

  // Auto-refresh logic based on cache expiration is simplified / removed.
  // If `isExpired` is provided, we can still call it, but the refresh action is minimal.
  useInterval(
    async () => {
      if (!isExpired) return;
      const expirationInfo = await isExpired();
      if (expirationInfo.expired) {
        // Call onRefresh but it will mostly be a no-op or trigger parent refreshes
        onRefresh({
          balanceExpired: expirationInfo.balanceExpired,
          curveExpired: expirationInfo.curveExpired,
          isManual: false,
        });
      }
    },
    BALANCE_LOADING_CONFS.CHECK_EXPIRED_INTERVAL,
    {
      immediate: false, // Don't run immediately on mount
    }
  );

  return {
    isManualRefreshing,
    onRefresh,
  };
}
