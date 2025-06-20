import React, { useEffect, useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { KEYRING_TYPE } from 'consts';
import { PageHeader } from 'ui/component';
import { useWallet, useWalletRequest } from 'ui/utils';
// Removed store imports: connectStore, useRabbyDispatch, useRabbySelector
// import { connectStore, useRabbyDispatch, useRabbySelector } from 'ui/store';
import IconArrowRight from 'ui/assets/arrow-right-gray.svg';
import './style.less';
import { MatomoTime } from '@/utils/matomo-time';
import { matomoRequestEvent } from '@/utils/matomo-request';
import { query2obj } from '@/ui/utils/url';
import { IS_CHROME } from '@/utils/env';

const DisplayMnemonic = ({ mnemonics }: { mnemonics: string }) => {
  const history = useHistory();
  const wallet = useWallet();
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [confirmed, setConfirmed] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [isSubmit, setIsSubmit] = useState(false);

  // Removed dispatch and selector hooks
  // const dispatch = useRabbyDispatch();
  // const { isAdvanced } = useRabbySelector((state) => state.preference);

  // Placeholder for isAdvanced logic, assuming false for simplicity
  const isAdvanced = false;

  const { search } = history.location;
  const query = query2obj(search);
  const isNewUser = !!query.isNewUser;

  const handleConfirm = (e: CheckboxChangeEvent) => {
    setConfirmed(e.target.checked);
  };

  const [run, loading] = useWalletRequest(
    async (mnemonics) => {
      const {alianName} = await wallet.boot(undefined, mnemonics);
      return {
        alianName
      }
    },
    {
      onSuccess({ alianName }) {
        history.replace({
          pathname: '/popup/import/success',
          state: {
            alianName,
            keyringType: KEYRING_TYPE.HdKeyring,
          },
        });
      },
      onError(err) {
        message.error(err?.message);
      },
    }
  );

  const handleNextClick = async ({ doubleCheckMnemonics }) => {
    if (!confirmed) {
      setErrMsg(t('page.newAddress.displayMnemonics.agrementError'));
      return;
    }
    if (doubleCheckMnemonics !== mnemonics) {
      form.setFields([
        {
          name: 'doubleCheckMnemonics',
          errors: [t('page.newAddress.displayMnemonics.doubleCheckError')],
        },
      ]);
      return;
    }
    setIsSubmit(true);
    matomoRequestEvent({
      category: 'User',
      action: 'createAddress',
      label: KEYRING_TYPE.HdKeyring,
    });
    if (isNewUser) {
      await run(mnemonics);
      return;
    }

    // Store-related logic removed/commented out:
    // This part needs to be refactored to work without the old Redux store.
    // The parent component or a service should handle wallet creation and state updates.
    try {
      // const accounts = await dispatch.account.createHDWallet({
      //   mnemonic: mnemonics,
      //   isAdvanced,
      // });
      // await dispatch.preference.setIsBackup(true);
      // if (accounts && accounts.length > 0) {
      //   dispatch.account.unlock();
      // }

      // For now, simulate success and navigate.
      // In a real implementation, you'd await the wallet creation and then navigate.
      console.log(
        'TODO: Implement wallet creation logic here without Redux dispatch'
      );
      message.success(
        'Wallet creation logic needs to be implemented. Navigating to success page for now.'
      );
      history.push({
        pathname: '/popup/import/success',
        state: {
          keyringType: KEYRING_TYPE.HdKeyring,
        },
      });
    } catch (e) {
      setIsSubmit(false);
      message.error(t(e.message));
    }
  };

  useEffect(() => {
    const MatomoTime = new MatomoTime();
    MatomoTime.start();
    return () => {
      MatomoTime.end({
        category: 'User',
        action: 'Create Mnemonics Page Time',
      });
    };
  }, []);

  return (
    <div className="display-mnemonic">
      <PageHeader fixed>{t('page.newAddress.title.createMnemonics')}</PageHeader>
      <div className="rabby-container">
        <div className="pt-20 text-20 text-gray-title text-center font-medium">
          {t('page.newAddress.displayMnemonics.title')}
        </div>
        <div className="mt-16 text-13 text-gray-subTitle text-center">
          {t('page.newAddress.displayMnemonics.subTitle')}
        </div>
        <div className="p-12 mt-32 bg-gray-bg rounded">
          <div className="grid grid-cols-3 gap-12">
            {mnemonics.split(' ').map((word, index) => (
              <div
                className="bg-white rounded px-12 h-[36px] flex items-center justify-center text-gray-subTitle"
                key={index}
              >
                <span className="text-gray-comment mr-4">{index + 1}</span>
                {word}
              </div>
            ))}
          </div>
        </div>
        <Form onFinish={handleNextClick} form={form}>
          <Form.Item
            className="mt-20 h-[60px]"
            name="doubleCheckMnemonics"
            rules={[
              {
                required: true,
                message: t(
                  'page.newAddress.displayMnemonics.doubleCheckError'
                ),
              },
            ]}
          >
            <Input.TextArea
              className="h-[60px] p-12 text-13 text-gray-subTitle"
              placeholder={t(
                'page.newAddress.displayMnemonics.doubleCheckPlaceholder'
              )}
              spellCheck={false}
            />
          </Form.Item>
          <div
            className={clsx(
              'mt-12 text-12 text-red-light text-center h-[16px]',
              {
                'opacity-0': !errMsg,
              }
            )}
          >
            {errMsg}
          </div>
          <div className="flex justify-center mt-32 pb-[55px]">
            <Button
              type="primary"
              htmlType="submit"
              className="w-[200px]"
              size="large"
              loading={isSubmit || loading}
            >
              {t('global.next')}
              <img src={IconArrowRight} className="icon icon-arrow-right" />
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

// Removed connectStore HOC
// export default connectStore()(DisplayMnemonic);
export default DisplayMnemonic;
