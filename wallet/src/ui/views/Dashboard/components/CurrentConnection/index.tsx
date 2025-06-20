import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { Button } from 'antd';
import clsx from 'clsx';
import { KEYRING_TYPE } from 'consts';
import { useWallet, getCurrentSite } from 'ui/utils';
import { getCurrentTab } from '@/ui/utils/webapi';
import { Account } from '@/background/service/preference';
import { matomoRequestEvent } from '@/utils/matomo-request';
import { useCommonPopupView } from '@/ui/utils/popup';
import { useCurrentAccount } from '@/ui/hooks/useCurrentAccount'; // Assuming this hook was simplified
import './style.less';

interface CurrentConnectionProps {
  onChainChange?: () => void;
  onAfterOpenLoginModal?: () => void;
  showChainSelector?: boolean;
  showAddressManagement?: boolean;
  showChangeAccount?: boolean;
  showDisconnect?: boolean;
}

const CurrentConnection = ({
  onAfterOpenLoginModal,
  showChangeAccount = true,
  showDisconnect = true,
}: CurrentConnectionProps) => {
  const { t } = useTranslation();
  const wallet = useWallet();
  const history = useHistory();
  const { activePopup } = useCommonPopupView();

  const [currentConnection, setCurrentConnection] = useState<any>(null);
  const currentAccount = useCurrentAccount(); // Use the simplified hook

  useEffect(() => {
    const init = async () => {
      const tab = await getCurrentTab();
      if (tab?.id) {
        const site = await getCurrentSite(tab.id);
        setCurrentConnection(site);
      }
    };
    init();
  }, []);

  const handleLogin = async () => {
    await wallet.showLoginPopup();
    onAfterOpenLoginModal?.();
  };

  const handleChange = async () => {
    if (
      currentAccount &&
      [KEYRING_TYPE.WatchAddressKeyring].includes(currentAccount.type)
    ) {
      await wallet.requestAddressPermission();
      return;
    }
    activePopup('SwitchAddress');
    matomoRequestEvent({
      category: 'Front Page',
      action: 'clickChangeAddress',
      label: currentAccount?.type,
    });
  };

  const handleDisconnect = async () => {
    if (currentConnection) {
      await wallet.disconnectSite(currentConnection.origin, currentAccount);
      const site = await getCurrentSite(currentConnection.id);
      setCurrentConnection(site);
    }
  };

  const isGnosis = currentAccount?.type === KEYRING_TYPE.GnosisKeyring;

  const content = useMemo(() => {
    if (!currentAccount) {
      return (
        <div className="no-account" onClick={handleLogin}>
          {t('page.dashboard.home.noAddress')}
        </div>
      );
    }
    if (!currentConnection) {
      return (
        <div className="no-site">
          <p className="text-gray-content text-14 text-center">
            {t('page.dashboard.home.noConnectedSite')}
          </p>
        </div>
      );
    }
    return (
      <div className="site">
        <img
          src={currentConnection.icon || '/images/icon-default-dapp.svg'}
          className="site-icon"
          alt={currentConnection.origin}
        />
        <div className="site-name" title={currentConnection.origin}>
          {currentConnection.origin.replace(/^https?:\/\//, '')}
        </div>
      </div>
    );
  }, [currentAccount, currentConnection, t]);

  // In a simplified wallet, we might not need the ChainAndSiteSelector
  // or its complex logic. This component now focuses on displaying
  // the basic connection status.

  return (
    <div
      className={clsx(
        'current-connection',
        !currentAccount && 'no-account-padding'
      )}
    >
      <div className="current-connection-inner">{content}</div>
      {currentAccount && currentConnection && (
        <div className="flex items-center">
          {showChangeAccount && (
            <Button
              className={clsx(
                'ml-auto text-13 text-r-neutral-title2',
                'hover:text-r-blue-default',
                'btn-change-account',
                isGnosis && 'text-r-blue-default'
              )}
              type="text"
              onClick={handleChange}
            >
              {isGnosis
                ? t('page.dashboard.home.gnosisSafe')
                : t('page.dashboard.home.change')}
            </Button>
          )}
          {showDisconnect && (
            <Button
              className={clsx(
                'text-13 text-r-neutral-title2',
                'hover:text-r-blue-default',
                'btn-disconnect-account'
              )}
              type="text"
              onClick={handleDisconnect}
            >
              {t('page.dashboard.home.disconnect')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default CurrentConnection;
