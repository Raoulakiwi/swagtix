import React, { useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { matomoRequestEvent } from '@/utils/matomo-request';
import { sortBy } from 'lodash';
import { StrayPageWithButton } from 'ui/component';
import AddressItem from 'ui/component/AddressList/AddressItem';
import { getUiType } from 'ui/utils';
import { Account } from 'background/service/preference';
import clsx from 'clsx';
import stats from '@/stats';
import { KEYRING_ICONS, WALLET_BRAND_CONTENT, KEYRING_CLASS } from 'consts';
import { ReactComponent as IconImportSuccess } from 'ui/assets/success-logo-big.svg';
import { useNewUserGuideStore } from './hooks/useNewUserGuideStore';
// Removed useRabbyDispatch from '@/ui/store'
import { ga4 } from '@/utils/ga4';

export const ImportOrCreatedSuccess = ({
  isPopup = false,
}: {
  isPopup?: boolean;
}) => {
  const history = useHistory();
  const { state } = useLocation<{
    accounts: Account[];
    hasDivider?: boolean;
    title?: string;
    brand?: string;
    image?: string;
    editing?: boolean;
    showImportIcon?: boolean;
    isMnemonics?: boolean;
    importedLength?: number;
    isHw?: boolean;
    brandName?: string;
    keyringType?: string;
  }>();
  const addressItems = useRef(new Array(state.accounts?.length || 0));
  const { t } = useTranslation();
  const { setStore } = useNewUserGuideStore();

  const {
    accounts,
    hasDivider = true,
    title = t('page.importSuccess.title'),
    editing = false,
    showImportIcon = false,
    isMnemonics = false,
    importedLength = 0,
    isHw = false,
  } = state;
  const importedIcon =
    KEYRING_ICONS[accounts?.[0]?.type] ||
    WALLET_BRAND_CONTENT[accounts?.[0]?.brandName]?.image;

  const handleNextClick = (e: React.MouseEvent<HTMLElement>) => {
    e?.stopPropagation();
    history.replace('/new-user/ready');
  };

  useEffect(() => {
    if (accounts?.[0]) {
      matomoRequestEvent({
        category: 'User',
        action: 'importAddress',
        label: accounts[0].type,
      });
      ga4.fireEvent(`Import_${state.keyringType || accounts[0].type}`, {
        event_category: 'Import Address',
        event_label: state.brandName || accounts[0].brandName,
      });
    }
    if (
      Object.values(KEYRING_CLASS.HARDWARE).includes(
        accounts?.[0]?.type as any
      )
    ) {
      stats.report('importHardware', {
        type: accounts[0].type,
      });
    }
    // Removed: dispatch.account.getCurrentAccountAsync();
    setStore({ isPrivateKeyOnboarding: false });
  }, []);

  return (
    <StrayPageWithButton
      custom={true}
      className={clsx('rabby-stray-page')}
      hasDivider={hasDivider}
      NextButtonContent={t('global.Done')}
      onNextClick={handleNextClick}
      footerFixed={false}
      noPadding={isPopup}
      isScrollContainer={isPopup}
      noHeader={true}
    >
      <div className={clsx(isPopup && 'rabby-container', 'overflow-auto')}>
        <div
          className={clsx(
            'flex flex-col justify-center text-center',
            {
              'flex-1': isPopup,
              'overflow-auto': isPopup,
              'px-20': isPopup,
            },
            'pt-[60px]'
          )}
        >
          <div className="w-[100px] h-[100px] mx-auto">
            <IconImportSuccess />
          </div>
          <div className="text-r-neutral-title1 text-[24px] mb-12 mt-20 font-bold">
            {title}
          </div>
          <div className="text-r-neutral-body text-14 mb-12">
            {isHw
              ? t('page.importSuccess.hwAddressCount', {
                  count: accounts?.length,
                })
              : t('page.importSuccess.addressCount', {
                  count: accounts?.length,
                })}
          </div>
          <div
            className={clsx(
              'pt-20 success-import',
              !isPopup && 'lg:h-[200px] lg:w-[460px]'
            )}
          >
            {sortBy(accounts, (item) => item?.index).map((account, index) => (
              <AddressItem
                className="mb-12 rounded bg-r-neutral-card-2 py-12 pl-16 h-[60px] flex"
                key={account.address}
                account={account}
                showAssets={false}
                icon={importedIcon}
                showImportIcon={showImportIcon}
                editing={editing}
                index={index}
                showIndex={!editing}
                importedAccount
                isMnemonics={isMnemonics}
                importedLength={importedLength}
                stopEditing={true}
                canEditing={() => null}
                showEditIcon={false}
                ellipsis={false}
                ref={(el) => {
                  addressItems.current[index] = el;
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </StrayPageWithButton>
  );
};
