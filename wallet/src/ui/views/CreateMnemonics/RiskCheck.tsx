import React, { useEffect } from 'react';
import { Button }ikaCheckbox } from 'antd';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { PageHeader } from 'ui/component';
// Removed store imports: connectStore, useRabbyDispatch
// import { connectStore, useRabbyDispatch } from 'ui/store';
import IconArrowRight from 'ui/assets/arrow-right-gray.svg';
import IconCheckbox from 'ui/assets/checkbox.svg';
import IconCheckboxEmpty from 'ui/assets/checkbox-empty.svg';
import { query2obj } from '@/ui/utils/url';
import { MatomoTime } from '@/utils/matomo-time';
import { useWallet } from 'ui/utils'; // Import useWallet for setIsBackup if needed

const RiskCheck = () => {
  const history = useHistory();
  const wallet = useWallet(); // Added useWallet
  const { t } = useTranslation();
  const [checked, setChecked] = React.useState(false);
  const { search } = history.location;
  const query = query2obj(search);
  const isNewUser = !!query.isNewUser;

  // Removed useRabbyDispatch
  // const dispatch = useRabbyDispatch();

  const handleNextClick = async () => {
    if (!checked) {
      return;
    }
    // The original logic dispatched 'preference.setIsBackup(true)'
    // In the simplified SwagTix wallet, this state might be managed differently.
    // For now, we can call a wallet service method if such a method exists,
    // or assume the parent component handles this state after navigation.
    try {
      // Example: Call a wallet service method to set backup status
      // This method would need to be implemented in the wallet service
      await wallet.setIsBackup(true);
      console.log('User acknowledged backup risk.');
    } catch (error) {
      console.error('Failed to set backup status:', error);
      // Decide how to handle this error, e.g., show a message to the user
    }

    if (isNewUser) {
      history.push('/new-user/success');
    } else {
      history.push({
        pathname: '/popup/import/success',
        state: {
          showHeader: true,
        },
      });
    }
  };

  const handleCheck = (checked: boolean) => {
    setChecked(checked);
  };

  useEffect(() => {
    const MatomoTime = new MatomoTime();
    MatomoTime.start();
    return () => {
      MatomoTime.end({
        category: 'User',
        action: 'Create Mnemonics Risk Check Page Time',
      });
    };
  }, []);

  return (
    <div className="risk-check">
      <PageHeader fixed>{t('page.newAddress.title.createMnemonics')}</PageHeader>
      <div className="rabby-container">
        <div className="pt-20 text-20 text-gray-title text-center font-medium">
          {t('page.newAddress.riskCheck.title')}
        </div>
        <div className="mt-16 text-13 text-gray-subTitle text-center">
          {t('page.newAddress.riskCheck.subTitle')}
        </div>
        <div className="mt-32 text-13 text-gray-subTitle">
          <p className="mb-12">
            {t('page.newAddress.riskCheck.line1')}
          </p>
          <p className="mb-12">
            {t('page.newAddress.riskCheck.line2')}
          </p>
          <p className="mb-12">
            {t('page.newAddress.riskCheck.line3')}
          </p>
        </div>
        <div
          className="mt-32 text-13 text-gray-subTitle flex items-center"
          onClick={() => handleCheck(!checked)}
        >
          <img
            src={checked ? IconCheckbox : IconCheckboxEmpty}
            className="icon icon-checkbox cursor-pointer"
          />
          {t('page.newAddress.riskCheck.confirm')}
        </div>
        <div className="flex justify-center mt-48 pb-[55px]">
          <Button
            type="primary"
            className="w-[200px]"
            size="large"
            onClick={handleNextClick}
            disabled={!checked}
          >
            {t('global.next')}
            <img src={IconArrowRight} className="icon icon-arrow-right" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Removed connectStore HOC
// export default connectStore()(RiskCheck);
export default RiskCheck;
