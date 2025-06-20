import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Account } from '@/background/service/preference';

/**
 * Simplified BalanceView
 * The original implementation depended on complex Redux selectors,
 * background services, and heavy logic. For the stripped-down SwagTix
 * wallet we show a simple placeholder. Replace or extend with real
 * PulseChain balance logic when available.
 */

const BalanceView = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentAccount,
}: {
  currentAccount?: Account | null;
}) => {
  const { t } = useTranslation();

  return (
    <div className="balance-view-placeholder">
      {t('balanceView.placeholder', 'Balance view under construction')}
    </div>
  );
};

export default BalanceView;
  const { isManualRefreshing, onRefresh } = useRefreshHomeBalanceView({
/* NOTE:
 * All previous heavy logic, external hooks, and Redux dependencies have been
 * stripped.  When real PulseChain balance retrieval is implemented, expand
 * this component accordingly without re-introducing removed global store hooks.
 */
    refreshBalance,
    refreshCurve,
    isExpired: getCacheExpired,
  });

  // const refreshTimerlegacy = useRef<NodeJS.Timeout>();
  // only execute once on component mounted or address changed
  useEffect(
    () => {
      (async () => {
        let expirationInfo: IExtractFromPromise<
          ReturnType<typeof getCacheExpired>
        > | null = null;
        if (!currentHomeBalanceCache?.balance) {
          onRefresh({
            balanceExpired: true,
            curveExpired: true,
            isManual: false,
          });
        } else if (
          (expirationInfo = await getCacheExpired()) &&
          expirationInfo.expired
        ) {
          onRefresh({
            balanceExpired: expirationInfo.balanceExpired,
            curveExpired: expirationInfo.curveExpired,
            isManual: false,
          });
        }
      })();

      // const handler = async ({ address }) => {
      //   if (
      //     !currentAccount?.address ||
      //     !isSameAddress(address, currentAccount.address)
      //   )
      //     return;

      //   const count = await dispatch.transactions.getPendingTxCountAsync(
      //     currentAccount.address
      //   );
      //   if (count === 0) {
      //     if (refreshTimerlegacy.current)
      //       clearTimeout(refreshTimerlegacy.current);

      //     refreshTimerlegacy.current = setTimeout(() => {
      //       // increase accountBalanceUpdateNonce to trigger useCurrentBalance re-fetch account balance
      //       // delay 5s for waiting db sync data
      //       setAccountBalanceUpdateNonce((prev) => prev + 1);
      //     }, 5000);
      //   }
      // };
      // eventBus.addEventListener(EVENTS.TX_COMPLETED, handler);

      // return () => {
      //   eventBus.removeEventListener(EVENTS.TX_COMPLETED, handler);
      // };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      // currentHomeBalanceCache?.balance,
      // onRefresh,
      // getCacheExpired
    ]
  );

  const handleIsGnosisChange = useCallback(async () => {
    if (!currentAccount) return;
    const networkIds = await wallet.getGnosisNetworkIds(currentAccount.address);
    const chains = networkIds
      .map((networkId) => {
        return findChain({
          id: Number(networkId),
        });
      })
      .filter((v) => !!v);
    setGnosisNetworks(chains as Chain[]);
  }, [currentAccount, wallet]);

  const handleHoverCurve = (data) => {
    setCurvePoint(data);
  };

  const { activePopup, setData, componentName } = useCommonPopupView();
  const onClickViewAssets = () => {
    activePopup('AssetList');
  };

  useEffect(() => {
    if (componentName === 'AssetList') {
      setData({
        matteredChainBalances: chainBalancesWithValue,
        balance,
        balanceLoading,
        isEmptyAssets: !matteredChainBalances.length,
        isOffline: !loadBalanceSuccess,
      });
    }
  }, [
    chainBalancesWithValue,
    matteredChainBalances.length,
    balance,
    balanceLoading,
    componentName,
    setData,
    loadBalanceSuccess,
  ]);

  useEffect(() => {
    if (currentAccount) {
      setIsGnosis(currentAccount.type === KEYRING_TYPE.GnosisKeyring);
    }
  }, [currentAccount]);

  useEffect(() => {
    if (isGnosis) {
      handleIsGnosisChange();
    }
  }, [isGnosis, handleIsGnosisChange]);

  useEffect(() => {
    if (!isHover) {
      setCurvePoint(undefined);
    }
  }, [isHover]);

  // useEffect(() => {
  //   if (!balanceLoading && !curveLoading) {
  //     setIsManualRefreshing(false);
  //   }
  // }, [balanceLoading, curveLoading]);

  const onMouseMove = () => {
    setHover(true);
  };
  const onMouseLeave = () => {
    setHover(false);
    setIsDebounceHover(false);
  };

  useDebounce(
    () => {
      if (isHover) {
        setIsDebounceHover(true);
      }
    },
    300,
    [isHover]
  );

  const currentHover = isDebounceHover;

  const currentBalance = currentHover ? curvePoint?.value || balance : balance;
  const currentChangePercent = currentHover
    ? curvePoint?.changePercent || curveChartData?.changePercent
    : curveChartData?.changePercent;
  const currentIsLoss =
    currentHover && curvePoint ? curvePoint.isLoss : curveChartData?.isLoss;
  const currentChangeValue = currentHover ? curvePoint?.change : null;
  // Simplified wallet: always show balance (no Redux preference store)
  const hiddenBalance = false;

  const shouldShowRefreshButton =
    isManualRefreshing || balanceLoading || curveLoading;

  const couldShowLoadingDueToBalanceNil =
    currentBalance === null || (balanceFromCache && currentBalance === 0);
  // const couldShowLoadingDueToUpdateSource = !balanceFromCache || isManualRefreshing;
  const couldShowLoadingDueToUpdateSource =
    !currentHomeBalanceCache?.balance || isManualRefreshing;

  const shouldShowBalanceLoading =
    couldShowLoadingDueToBalanceNil ||
    (couldShowLoadingDueToUpdateSource && balanceLoading);
  const shouldShowCurveLoading =
    couldShowLoadingDueToBalanceNil ||
    (couldShowLoadingDueToUpdateSource && curveLoading);
  const shouldShowLoading = shouldShowBalanceLoading || shouldShowCurveLoading;
  const shouldHidePercentChange =
    !currentChangePercent ||
    hiddenBalance ||
    shouldShowLoading ||
    !curveChartData?.startUsdValue;

  const shouldRenderCurve =
    !shouldShowLoading && !hiddenBalance && !!curveChartData;

  return (
    <div onMouseLeave={onMouseLeave} className={clsx('assets flex')}>
      <div className="left relative overflow-x-hidden mx-10">
        <div className={clsx('amount group w-[100%]', 'text-32 mt-6')}>
          <div className={clsx('amount-number leading-[38px] max-w-full')}>
            {shouldShowBalanceLoading ? (
              <Skeleton.Input active className="w-[200px] h-[38px] rounded" />
            ) : (
              <BalanceLabel
                // isCache={balanceFromCache}
                balance={currentBalance || 0}
              />
            )}
          </div>
          <div
            className="flex flex-end items-center gap-[8px] mb-[5px] min-h-[20px]"
            onClick={() => onRefresh({ isManual: true })}
          >
            <div
              className={clsx(
                currentIsLoss ? 'text-[#FF6E6E]' : 'text-[#33CE43]',
                'text-15 font-normal',
                {
                  hidden: shouldHidePercentChange,
                }
              )}
            >
              {currentIsLoss ? '-' : '+'}
              <span>
                {currentChangePercent === '0%' ? '0.00%' : currentChangePercent}
              </span>
              {currentChangeValue ? (
                <span className="ml-4">({currentChangeValue})</span>
              ) : null}
            </div>
            {missingList?.length ? (
              <TooltipWithMagnetArrow
                overlayClassName="rectangle font-normal whitespace-pre-wrap"
                title={t('page.dashboard.home.missingDataTooltip', {
                  text:
                    missingList.join(t('page.dashboard.home.chain')) +
                    t('page.dashboard.home.chainEnd'),
                })}
              >
                <div onClick={(evt) => evt.stopPropagation()}>
                  <WarningSVG />
                </div>
              </TooltipWithMagnetArrow>
            ) : null}
            <div
              className={clsx({
                'block animate-spin': shouldShowRefreshButton,
                hidden: !shouldShowRefreshButton,
                'group-hover:block': !hiddenBalance,
              })}
            >
              <UpdateSVG />
            </div>
          </div>
        </div>
        <div
          onClick={onClickViewAssets}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          className={clsx(
            'mt-[4px] mb-10',
            currentHover && 'bg-[#000] bg-opacity-10',
            'rounded-[4px] relative cursor-pointer',
            'overflow-hidden'
          )}
        >
          <img
            src={ArrowNextSVG}
            className={clsx(
              'absolute w-[20px] h-[20px] top-[8px] right-[10px]',
              !currentHover && 'opacity-80'
              // balanceFromCache
              //   ? !currentHover && 'opacity-0'
              //   : !currentHover && 'opacity-80'
            )}
          />
          <div
            className={clsx(
              'extra flex h-[28px]',
              'mx-[10px] pt-[8px] mb-[8px]'
            )}
          >
            {shouldShowLoading ? (
              <>
                <Skeleton.Input active className="w-[130px] h-[20px] rounded" />
              </>
            ) : !loadBalanceSuccess ? (
              <>
                <SvgIconOffline className="mr-4 text-white" />
                <span className="leading-tight">
                  {t('page.dashboard.home.offline')}
                </span>
              </>
            ) : chainBalancesWithValue.length > 0 ? (
              <div
                className={clsx(
                  'flex space-x-4',
                  !currentHover && 'opacity-80'
                )}
              >
                <ChainList
                  isGnosis={isGnosis}
                  matteredChainBalances={chainBalancesWithValue.slice(0)}
                  gnosisNetworks={gnosisNetworks}
                />
              </div>
            ) : (
              <span
                className={clsx(
                  'text-14 text-r-neutral-title-2',
                  !currentHover && 'opacity-70'
                )}
              >
                {t('page.dashboard.assets.noAssets')}
              </span>
            )}
          </div>
          <div className={clsx('h-[80px] w-full relative')}>
            {!!shouldRenderCurve && !!curveChartData && (
              <CurveThumbnail
                isHover={currentHover}
                data={curveChartData}
                onHover={handleHoverCurve}
              />
            )}
            {!!shouldShowLoading && (
              <div className="flex mt-[14px]">
                <Skeleton.Input
                  active
                  className="m-auto w-[360px] h-[72px] rounded"
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <OfflineChainNotify />
    </div>
  );
};

export default BalanceView;
