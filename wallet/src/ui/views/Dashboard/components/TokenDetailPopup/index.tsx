// Placeholder for TokenItem until full type definitions are restored.
interface TokenItem {
  [key: string]: any;
}
import { Popup } from '@/ui/component';
import React from 'react';
import TokenDetail from './TokenDetail';
import './style.less';
import { getUiType, isSameAddress, useWallet } from '@/ui/utils';
import { Account, Token } from '@/background/service/preference';
// Removed useRabbyDispatch and portfolio helpers (not needed in trimmed wallet)
import { useLocation } from 'react-router-dom';

const isTab = getUiType().isTab;
const getContainer = isTab ? '.js-rabby-popup-container' : undefined;

interface TokenDetailProps {
  visible?: boolean;
  onClose?(): void;
  token?: TokenItem | null;
  variant?: 'add';
  canClickToken?: boolean;
  hideOperationButtons?: boolean;
  tipsFromTokenSelect?: string;
  account?: Account;
}
export const TokenDetailPopup = ({
  token,
  visible,
  onClose,
  variant,
  canClickToken = true,
  hideOperationButtons = false,
  tipsFromTokenSelect,
  account,
}: TokenDetailProps) => {
  const wallet = useWallet();
  const [isAdded, setIsAdded] = React.useState(false);

  const location = useLocation();
  const isInSwap = location.pathname === '/dex-swap';
  const isInSend = location.pathname === '/send-token';
  const isBridge = location.pathname === '/bridge';

  const handleAddToken = React.useCallback((tokenWithAmount) => {
    if (!tokenWithAmount) return;
    // In the simplified wallet we just toggle local state.
    setIsAdded(true);
  }, []);

  const handleRemoveToken = React.useCallback((tokenWithAmount) => {
    if (!tokenWithAmount) return;
    setIsAdded(false);
  }, []);

  const checkIsAdded = React.useCallback(async () => {
    if (!token) return;

    let list: Token[] = [];
    if (token.is_core) {
      list = await wallet.getBlockedToken();
    } else {
      list = await wallet.getCustomizedToken();
    }

    const isAdded = list.some(
      (item) =>
        isSameAddress(item.address, token.id) && item.chain === token.chain
    );
    setIsAdded(isAdded);
  }, [token]);

  React.useEffect(() => {
    checkIsAdded();
  }, [checkIsAdded]);

  const popupHeight = isInSend || isInSwap || isBridge ? 540 : 494;

  return (
    <Popup
      visible={visible}
      closable={true}
      height={popupHeight}
      onClose={onClose}
      className="token-detail-popup"
      push={false}
      getContainer={getContainer}
    >
      {visible && token && (
        <TokenDetail
          account={account}
          token={token}
          popupHeight={popupHeight}
          addToken={handleAddToken}
          removeToken={handleRemoveToken}
          variant={variant}
          isAdded={isAdded}
          onClose={onClose}
          canClickToken={canClickToken}
          hideOperationButtons={hideOperationButtons}
          tipsFromTokenSelect={tipsFromTokenSelect}
        />
      )}
    </Popup>
  );
};
