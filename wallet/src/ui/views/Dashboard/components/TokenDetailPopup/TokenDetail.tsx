import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router-dom';
import { Chain } from '@debank/common';
import { Skeleton } from 'antd';
import BigNumber from 'bignumber.js';
import clsx from 'clsx';
import { Account } from 'background/service/preference';
import { findChain }
  from '@/utils/chain';
import { TokenChange } from 'ui/component';
import { splitNumberByStep, useWallet, openInTab, isSameAddress } from 'ui/utils';
import { HistoryItem } from '@/ui/views/History/components/HistoryItem';
import { sinceTime } from 'ui/utils';
import { getTokenSymbol } from '@/ui/utils/token';
import LessPalette from '@/ui/style/var-defs';
import { ReactComponent as RcIconArrowRight } from 'ui/assets/arrow-right-gray.svg';
import { ReactComponent as RcIconExternal } from 'ui/assets/icon-share-currentcolor.svg';
import { TokenChart } from './TokenChart';
import { useTokenPrice } from '@/ui/hooks/useTokenPrice';
import { useTokenHistory } from '@/ui/hooks/useTokenHistory';
import { useCommonPopupView } from '@/ui/utils/popup';
import { getTxScanLink } from '@/utils';

// ---------------------------------------------------------------------------
// Placeholder types for compatibility after removing OpenAPI imports
// ---------------------------------------------------------------------------
interface TokenItem {
  id: string;
  chain: string;
  name: string;
  symbol: string;
  display_symbol: string | null;
  optimized_symbol: string | null;
  decimals: number;
  logo_url: string | null;
  protocol_id: string | null;
  price: number | null;
  price_24h_change: number | null;
  is_verified: boolean;
  is_core: boolean;
  is_wallet: boolean;
  amount: number;
  raw_amount_hex_str?: string;
  [key: string]: any; // Allow any additional properties
}

interface TxHistoryItem {
  time_at?: number; // Added to fix TS2339
  [key: string]: any;
}

interface TxDisplayItem {
  [key: string]: any;
}
// ---------------------------------------------------------------------------

interface TokenDetailProps {
  token: TokenItem;
  addToken: (token: TokenItem) => void;
  removeToken: (token: TokenItem) => void;
  isAdded: boolean;
  variant?: 'add';
  popupHeight?: number;
  onClose?: () => void;
  canClickToken?: boolean;
  hideOperationButtons?: boolean;
  tipsFromTokenSelect?: string;
  account?: Account;
}

const TokenDetail = ({
  token,
  addToken,
  removeToken,
  isAdded,
  variant,
  popupHeight = 494,
  onClose,
  canClickToken = true,
  hideOperationButtons = false,
  tipsFromTokenSelect,
  account,
}: TokenDetailProps) => {
  const wallet = useWallet();
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const { getTokenChart, getTokenChartError, tokenChartLoading } =
    useTokenPrice(token?.id, token?.chain, !token?.is_core);
  const {
    getTokenHistory,
    tokenHistoryList,
    tokenHistoryLoading,
    tokenHistoryError,
  } = useTokenHistory(token, account);
  const { setData } = useCommonPopupView();

  const isShowTokenPrice = token?.price && !new BigNumber(token.price).isZero();

  const handleTokenChange = (token: TokenItem) => {
    if (!canClickToken) return;
    setData({
      selectedToken: token,
    });
    history.push({
      pathname: '/select-token',
      state: {
        from: 'token-detail',
        token,
        // to prevent circle push
        // selectedToken will be reset to undefined when back to select-token page
        // selectedToken: undefined,
      },
      search: location.search,
    });
  };

  const chain = findChain({
    serverId: token?.chain,
  });

  const isNativeToken = useMemo(
    () => token?.id === chain?.nativeTokenAddress,
    [token?.id, chain?.nativeTokenAddress]
  );

  const handleViewOnScan = () => {
    if (!chain) return;
    openInTab(getTxScanLink(chain.scanLink, token.id, true));
  };

  const handleViewTokenPriceChart = () => {
    if (!token?.id || !chain) return;
    const params = new URLSearchParams();
    params.set('token', `${chain.serverId}:${token.id}`);
    const query = params.toString();
    history.push(`/token-price-chart?${query}`);
  };

  React.useEffect(() => {
    if (token && account) {
      getTokenHistory();
    }
  }, [token, account]);

  React.useEffect(() => {
    if (token?.id && token?.chain) {
      getTokenChart();
    }
  }, [token?.id, token?.chain]);

  if (!token) {
    return (
      <div
        className="token-detail"
        style={{
          height: popupHeight,
        }}
      >
        <Skeleton active />
      </div>
    );
  }

  const isShowPriceChart =
    !tokenChartLoading &&
    !getTokenChartError &&
    isShowTokenPrice &&
    !isNativeToken;

  return (
    <div
      className="token-detail"
      style={{
        height: popupHeight,
      }}
    >
      <div className="token-detail-header">
        <div className="token-detail-header-left" onClick={onClose}>
          <img
            src={token.logo_url || ''}
            alt={token.name}
            className="token-detail-logo"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src =
                'https://raw.githubusercontent.com/DeBankDeFi/icon/master/token-default.svg';
            }}
          />
          <div className="token-detail-info">
            <p className="token-detail-name" title={token.name}>
              {token.name}
            </p>
            <p className="token-detail-symbol" title={getTokenSymbol(token)}>
              {getTokenSymbol(token)}
            </p>
          </div>
        </div>
        <div className="token-detail-header-right">
          <div className="token-detail-price">
            {isShowTokenPrice && (
              <p className="token-detail-price-text">
                ${splitNumberByStep(token.price!.toFixed(2))}
              </p>
            )}
            {token.price_24h_change && isShowTokenPrice && (
              <p
                className={clsx(
                  'token-detail-price-change',
                  token.price_24h_change >= 0 ? 'up' : 'down'
                )}
              >
                {token.price_24h_change >= 0 ? '+' : ''}
                {(token.price_24h_change * 100).toFixed(2)}%
              </p>
            )}
          </div>
          <div className="token-detail-icons">
            <RcIconExternal
              className="icon icon-share"
              onClick={handleViewOnScan}
            />
          </div>
        </div>
      </div>
      {tipsFromTokenSelect && (
        <div className="token-detail-tips">{tipsFromTokenSelect}</div>
      )}
      <div className="token-detail-content">
        {isShowPriceChart && (
          <div className="token-price-chart" onClick={handleViewTokenPriceChart}>
            <TokenChart data={getTokenChart()} />
            <div className="token-price-chart-mask">
              <RcIconArrowRight className="icon icon-arrow-right" />
            </div>
          </div>
        )}
        {!tokenHistoryLoading &&
          !tokenHistoryError &&
          tokenHistoryList.length <= 0 && (
            <div className="token-detail-empty">
              {t('page.dashboard.tokenDetail.noTransactions')}
            </div>
          )}
        {tokenHistoryList.map((item) => (
          <HistoryItem
            data={item}
            key={item.id}
            projectDict={item.projectDict}
            cateDict={item.cateDict}
            tokenDict={item.tokenDict}
            canClickToken={canClickToken}
            onClose={onClose}
          />
        ))}
        {tokenHistoryLoading && (
          <div className="token-detail-empty">
            <Skeleton active />
          </div>
        )}
        {tokenHistoryError && (
          <div className="token-detail-empty">
            {t('page.dashboard.tokenDetail.failToLoadTransactions')}
          </div>
        )}
      </div>
      {/* Removed token action buttons as they relied on complex store logic */}
    </div>
  );
};

export default TokenDetail;
