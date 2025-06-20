import React, { useRef } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { getUiType } from 'ui/utils';
import { KEYRING_CLASS } from 'consts';
import './style.less';
import { HDManager } from '../HDManager/HDManager';

type State = {
  keyring: string;
  isMnemonics?: boolean;
  isWebHID?: boolean;
  path?: string;
  keyringId?: number | null;
  ledgerLive?: boolean;
  brand?: string;
};

const SelectAddress = () => {
  const history = useHistory();
  const { state = {} as State, search } = useLocation<{
    keyring: string;
    isMnemonics?: boolean;
    isWebHID?: boolean;
    path?: string;
    keyringId?: number | null;
    ledgerLive?: boolean;
    brand?: string;
  }>();
  const query = new URLSearchParams(search);

  state.keyring = state?.keyring || (query.get('hd') as string);
  state.brand = state?.brand || (query.get('brand') as string);
  if (query.get('keyringId') && !state.keyringId) {
    state.keyringId = Number(query.get('keyringId') as string);
  }

  if (!state) {
    if (getUiType().isTab) {
      if (history.length) {
        history.goBack();
      } else {
        window.close();
      }
    } else {
      history.replace('/dashboard');
    }
    return null;
  }

  const [isMounted, setIsMounted] = React.useState(false);
  const initMnemonics = async () => {
    // In the stripped-down SwagTix wallet we no longer rely on the
    // global Redux store.  If switching the active key-ring is required
    // the parent component should handle it via the `wallet` service
    // when this page finishes.  For now we simply mark the component as
    // mounted so that the HDManager can render.
    setIsMounted(true);
  };
  React.useEffect(() => {
    initMnemonics();
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const { keyring, brand } = state;
  const keyringId = useRef<number | null | undefined>(state.keyringId);
  const isMnemonic = keyring === KEYRING_CLASS.MNEMONIC;

  if (isMnemonic) {
    if (!isMounted) return null;
  }

  return (
    <HDManager
      keyringId={keyringId.current ?? null}
      keyring={keyring}
      brand={brand}
    />
  );
};

export default SelectAddress;
