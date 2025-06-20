import { Account } from '@/background/service/preference';
import AddressItem from '@/ui/component/AddressList/AddressItem';
import { KEYRING_TYPE_TEXT } from '@/constant';
import { useCommonPopupView, useWallet } from '@/ui/utils';
import { useVirtualList } from 'ahooks';
import clsx from 'clsx';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { FixedSizeList } from 'react-window';
// Removed useRabbyDispatch and connectStore
// import { useRabbyDispatch, connectStore } from 'ui/store';
import { useSetCurrentAccount } from './hooks';
import { useScrollToCurrentAccount } from './useScrollToCurrentAccount';
import { useGroupAccounts } from './useGroupAccounts';
import { useSortAccounts } from './useSortAccounts';

interface AddressListProps {
  accounts: Account[];
  onEditAlianName?: (address: string, name: string) => void;
  onDelete?: (address: string) => void;
  onSelect?: (account: Account) => void;
  currentAccount: Account | undefined | null;
  showAssets?: boolean;
  className?: string;
  pinnedAccounts?: Account[];
  height?: number;
  itemHeight?: number;
  variableHeight?: boolean;
  Header?: React.ComponentType;
  Footer?: React.ComponentType;
  EmptyComponent?: React.ComponentType;
  isPopup?: boolean;
  isHideCurrentAccount?: boolean;
}

const List = ({
  accounts,
  onEditAlianName,
  onDelete,
  onSelect,
  currentAccount,
  showAssets = true,
  className,
  pinnedAccounts = [],
  height = 360,
  itemHeight = 60,
  variableHeight = false,
  Header,
  Footer,
  EmptyComponent,
  isPopup = false,
  isHideCurrentAccount = false,
}: AddressListProps) => {
  const wallet = useWallet();
  // Removed useRabbyDispatch
  // const dispatch = useRabbyDispatch();
  const { activePopup } = useCommonPopupView();
  const { t } = useTranslation();

  const { sortedAccounts, sortType } = useSortAccounts(accounts);
  const { groupedAccounts, otherTypeAccounts, isHD } = useGroupAccounts(
    sortedAccounts,
    pinnedAccounts
  );

  const handleSetCurrentAccount = useCallback(
    async (account: Account) => {
      // Removed dispatch.account.setCurrentAccount(account)
      // The parent component should handle setting the current account if needed,
      // possibly through the onSelect callback.
      // This component will still set the last selected address via wallet service.
      await wallet.setLastSelectedAddress(account.address);
    },
    [wallet] // Removed dispatch
  );

  const { handleClick } = useSetCurrentAccount({
    onSelect,
    handleSetCurrentAccount,
    currentAccount,
    isPopup,
    activePopup,
  });

  const { listRef, scrollToAccount } = useScrollToCurrentAccount({
    accounts: sortedAccounts,
    currentAccount,
    height,
    itemHeight,
    variableHeight,
    isHideCurrentAccount,
  });

  const renderAddressItem = ({
    account,
    index,
    style,
  }: {
    account: Account;
    index: number;
    style?: React.CSSProperties;
  }) => {
    return (
      <AddressItem
        className="rectangle address-item"
        key={account.address}
        account={account}
        style={style}
        onClick={() => handleClick(account)}
        showAssets={showAssets}
        currentAccount={currentAccount}
        onEditAlianName={onEditAlianName}
        onDelete={onDelete}
        isPopup={isPopup}
      />
    );
  };

  const renderGroup = (
    title: string,
    list: Account[],
    hideAssets = false
  ) => {
    if (list.length === 0) return null;
    return (
      <div className="address-group">
        <div className="address-group-title">{title}</div>
        {list.map((account, index) =>
          renderAddressItem({ account, index, style: {} })
        )}
      </div>
    );
  };

  const { list, containerProps, wrapperProps } = useVirtualList(
    otherTypeAccounts,
    {
      itemHeight: itemHeight + 12, // 12 is margin-bottom of address-item
      overscan: 10,
      height,
    }
  );

  return (
    <div className={clsx('address-list-container', className)}>
      {Header && <Header />}
      {!accounts.length && EmptyComponent && <EmptyComponent />}
      {accounts.length > 0 && (
        <div className="address-list">
          {isHD &&
            groupedAccounts.map((group) =>
              renderGroup(
                `${KEYRING_TYPE_TEXT[group.type]} (${group.accounts.length})`,
                group.accounts
              )
            )}
          <div
            className={clsx('address-group other-group', {
              'has-hd': isHD,
            })}
          >
            <div className="address-group-title">
              {t('page.manageAddress.otherTypeAccounts', {
                count: otherTypeAccounts.length,
              })}
            </div>
            {variableHeight ? (
              <div {...containerProps} ref={listRef as any}>
                <div {...wrapperProps}>
                  {list.map((item, index) =>
                    renderAddressItem({
                      account: item.data,
                      index,
                      style: {
                        height: itemHeight,
                        marginBottom: 12,
                      },
                    })
                  )}
                </div>
              </div>
            ) : (
              <FixedSizeList
                height={height}
                width="100%"
                itemData={otherTypeAccounts}
                itemCount={otherTypeAccounts.length}
                itemSize={itemHeight + 12} // 12 is margin-bottom of address-item
                ref={listRef}
                className="other-list"
              >
                {({ data, index, style }) =>
                  renderAddressItem({ account: data[index], index, style })
                }
              </FixedSizeList>
            )}
          </div>
        </div>
      )}
      {Footer && <Footer />}
    </div>
  );
};

// Removed connectStore HOC, export component directly
export default List;
