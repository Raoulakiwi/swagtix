import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CHAINS_ENUM, KEYRING_TYPE } from 'consts';
import { useCommonPopupView, useWallet } from 'ui/utils';
import { SvgIconOpenExternal } from 'ui/assets';
import {
  SecurityCheckResponse,
  SecurityCheckDecision,
} from 'background/service/openapi';
import { Chain } from '@debank/common';
import SecurityCheckResult from '../SecurityCheckResult';
import SecurityCheckDetail from '../SecurityCheckDetail';
import { findChain }
  from '@/utils/chain';
import { TooltipWithMagnetArrow } from '@/ui/component/Tooltip/TooltipWithMagnetArrow';
import { getCurrentSite } from 'ui/utils/site';
import { useAsync } from 'react-use';
import { getCurrentTab } from '@/ui/utils/webapi';
import { isSameAddress } from '@/ui/utils/address';
import { query2obj } from '@/ui/utils/url';
import { useLocation }V2 from 'react-router-dom';
import { useLedgerDeviceConnected } from '@/utils/ledger';
import { IconCurrentSite } from './IconCurrentSite';
import { useThemeMode } from '@/ui/hooks/usePreference';
import { useIsKeystoneUsb } from '@/ui/hooks/useIsKeystoneUsb';
import { useCurrentAccount } from '@/ui/hooks/useCurrentAccount';

// Removed useRabbySelector and related store logic
// const { currentAccount, currentConnection, highlightTag } = useRabbySelector(
//   (s: RootState) => ({
//     currentAccount: s.account.currentAccount,
//     currentConnection: s.openapi.currentConnection,
//     highlightTag: s.preference.highlightTag,
//   })
// );

// Placeholder for current account - replace with actual logic if needed
const useCurrentAccountPlaceholder = () => {
  const wallet = useWallet();
  const [account, setAccount] = useState(null);
  useEffect(() => {
    const fetchAccount = async () => {
      const acc = await wallet.getCurrentAccount();
      // @ts-expect-error we need to update the type of account
      setAccount(acc);
    };
    fetchAccount();
  }, [wallet]);
  return account;
};

// Placeholder for current connection - replace with actual logic if needed
const useCurrentConnectionPlaceholder = () => {
  const [connection, setConnection] = useState(null);
  useEffect(() => {
    const fetchConnection = async () => {
      const tab = await getCurrentTab();
      if (tab?.id) {
        const site = await getCurrentSite(tab.id);
        // @ts-expect-error we need to update the type of connection
        setConnection(site);
      }
    };
    fetchConnection();
  }, []);
  return connection;
};

const ChainAndSiteSelector = ({
  className,
  leftSlot,
  rightSlot,
  onAfterOpenLoginModal,
  hideChain = false,
}: {
  className?: string;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  onAfterOpenLoginModal?: () => void;
  hideChain?: boolean;
}) => {
  const { t } = useTranslation();
  const wallet = useWallet();
  const currentAccount = useCurrentAccountPlaceholder();
  const currentConnection = useCurrentConnectionPlaceholder();

  // For SwagTix, we are PulseChain only.
  const chain = findChain({ enum: CHAINS_ENUM.PULSE });

  const { activePopup } = useCommonPopupView();
  const [securityCheckStatus, setSecurityCheckStatus] =
    useState<SecurityCheckDecision>('pending');
  const [securityCheckAlert, setSecurityCheckAlert] = useState('Checking...');
  const [showSecurityCheckDetail, setShowSecurityCheckDetail] = useState(false);
  const [
    securityCheckDetailContent,
    setSecurityCheckDetailContent,
  ] = useState<SecurityCheckResponse | null>(null);

  const { isDarkTheme } = useThemeMode();

  const { value: site } = useAsync(async () => {
    if (!currentConnection || !currentConnection.origin) return undefined;
    return wallet.findConnectedSite(currentConnection.origin);
  }, [currentConnection]);

  const isCurrentSiteConnected = useMemo(() => {
    if (!site) return false;
    if (currentAccount?.type === KEYRING_TYPE.GnosisKeyring) {
      return isSameAddress(site.chain, currentAccount.address);
    }
    return site.isConnected && !site.isTopProviderPriority;
  }, [site, currentAccount]);

  const isShowChain = useMemo(() => {
    if (hideChain) return false;
    return !!chain;
  }, [chain, hideChain]);

  const { value: _isConnectedLedgerDevice } = useLedgerDeviceConnected();
  const isKeystoneUsb = useIsKeystoneUsb();

  const { search } = useLocationV2();

  const query = useMemo(() => query2obj(search), [search]);

  const isShowSecurityCheckIcon = useMemo(() => {
    if (!currentConnection || !currentConnection.origin) return false;
    if (query.approveAll) return false;
    return true;
  }, [currentConnection, query]);

  const openSecurityCheckDetail = async () => {
    const tab = await getCurrentTab();
    if (!tab.id) return;
    const site = await getCurrentSite(tab.id);
    const res = await wallet.openapi.checkOrigin(
      // @ts-expect-error currentAccount type needs to be updated
      currentAccount.address,
      site.origin
    );
    setSecurityCheckDetailContent(res);
    setShowSecurityCheckDetail(true);
  };

  const updateSecurityCheckStatus = async (
    origin: string,
    // @ts-expect-error currentAccount type needs to be updated
    address: string,
    // @ts-expect-error chain type needs to be updated
    chain: Chain
  ) => {
    const site = await wallet.openapi.checkOrigin(address, origin);
    const siteInfo = await wallet.openapi.getSite(origin);
    const decision = await wallet.openapi.checkText(
      address,
      origin,
      siteInfo.name
    );
    setSecurityCheckStatus(decision);
    setSecurityCheckAlert(
      wallet.openapi.getSecurityCheckAlert(decision, site.is_marked)
    );
  };

  useEffect(() => {
    if (currentConnection && currentAccount && chain) {
      updateSecurityCheckStatus(
        currentConnection.origin,
        // @ts-expect-error currentAccount type needs to be updated
        currentAccount.address,
        chain
      );
    }
  }, [currentConnection, currentAccount, chain]);

  const { value: isLogin } = useAsync(async () => {
    return wallet.isLogin();
  }, []);

  const handleLogin = async () => {
    await wallet.showLoginPopup();
    onAfterOpenLoginModal?.();
  };

  if (!isLogin) {
    return (
      <div className="flex items-center justify-center pt-[100px]">
        <Button type="primary" size="large" onClick={handleLogin}>
          {t('page.dashboard.home.connectAddress')}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={className}
      onClick={(e) => {
        // @ts-expect-error currentAccount type needs to be updated
        if (!currentAccount?.address) {
          e.stopPropagation();
          handleLogin();
        }
      }}
    >
      {leftSlot && <div className="flex items-center">{leftSlot}</div>}
      <div className="connected-site">
        {currentConnection && (
          <div className="connected-site-inner">
            {/* Simplified: always show PulseChain logo */}
            <img
              className="icon icon-chain"
              src={
                findChain({ enum: CHAINS_ENUM.PULSE })?.logo ||
                'https://static.debank.com/image/chain/logo_url/pls/a769482775305274017a678243e57550.png'
              }
              alt="PulseChain"
            />
            <div className="site-name">
              <TooltipWithMagnetArrow
                title={currentConnection.origin}
                className="rectangle w-[max-content]"
              >
                <IconCurrentSite
                  isDark={isDarkTheme}
                  origin={currentConnection.origin}
                  className="icon icon-site"
                />
              </TooltipWithMagnetArrow>
              <span className="text-13 font-medium text-r-neutral-title-1">
                {currentConnection.origin.replace(/^https?:\/\//, '')}
              </span>
            </div>
            {isShowSecurityCheckIcon && (
              <SecurityCheckResult
                status={securityCheckStatus}
                alert={securityCheckAlert}
                onClick={openSecurityCheckDetail}
              />
            )}
            <SecurityCheckDetail
              visible={showSecurityCheckDetail}
              onCancel={() => setShowSecurityCheckDetail(false)}
              data={securityCheckDetailContent}
              // @ts-expect-error currentAccount type needs to be updated
              address={currentAccount?.address || ''}
              chain={chain}
            />
          </div>
        )}
      </div>
      {rightSlot && <div className="flex items-center">{rightSlot}</div>}
    </div>
  );
};

export default ChainAndSiteSelector;
