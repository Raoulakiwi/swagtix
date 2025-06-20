import React from 'react';
import RiskCheck from './RiskCheck';
import DisplayMnemonic from './DisplayMnemonic';
import { useTranslation } from 'react-i18next';

const CreateMnemonic = () => {
  // In the original Rabby wallet `step` came from the Redux store.
  // For the trimmed SwagTix wallet we keep the flow local-state based.
  const [step] = React.useState<'risk-check' | 'display'>('risk-check');
  const { t } = useTranslation();
  let node;

  switch (step) {
    case 'risk-check':
      node = <RiskCheck />;
      break;
    case 'display':
      node = <DisplayMnemonic />;
      break;
    default:
      throw new Error(t('page.newAddress.seedPhrase.importError'));
  }

  return node;
};

export default CreateMnemonic;
