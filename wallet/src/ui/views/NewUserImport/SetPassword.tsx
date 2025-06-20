import React, { useEffect, useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StrayPageWithButton, PasswordStrength } from 'ui/component';
import { useWallet, useWalletRequest } from 'ui/utils';
// Removed useRabbyDispatch from 'ui/store'
import { passwordReg } from 'consts';
import { useNewUserGuideStore } from './hooks/useNewUserGuideStore';
import { query2obj } from '@/ui/utils/url';
import { MatomoTime } from '@/utils/matomo-time';
import { KEYRING_TYPE } from 'consts';
import { ga4 } from '@/utils/ga4';

export const NewUserSetPassword = () => {
  const history = useHistory();
  const wallet = useWallet();
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { store } = useNewUserGuideStore();
  const { search } = history.location;
  const query = query2obj(search);
  const isNewUser = !!query.isNewUser;

  const [passwordChanged, setPasswordChanged] = useState(false);

  const [run, loading] = useWalletRequest(
    async (password: string) => {
      // Refactored wallet creation logic
      // The wallet.boot method should handle password setting and keyring creation
      // based on the data stored in the 'store' (from useNewUserGuideStore)
      let alianName = '';
      let createdAccount;

      if (store.keyringType === KEYRING_TYPE.HdKeyring && store.seedPhrase) {
        // For HD Wallets (Seed Phrase)
        const result = await wallet.boot(
          password,
          store.seedPhrase,
          store.passphrase
        );
        alianName = result.alianName;
        createdAccount = result;
      } else if (
        store.keyringType === KEYRING_TYPE.SimpleKeyring &&
        store.privateKey
      ) {
        // For Simple Keyrings (Private Key)
        const result = await wallet.boot(
          password,
          undefined, // no mnemonic
          undefined, // no passphrase
          store.privateKey
        );
        alianName = result.alianName;
        createdAccount = result;
      } else if (store.keyringId && store.isHw) {
        // For Hardware Wallets or other pre-existing keyrings
        // This flow might need specific handling if `wallet.boot` is not suitable
        // For now, we assume that if keyringId exists, the wallet is already "created"
        // and we just need to set the password for the app.
        await wallet.unlock(password); // This sets the app password
        const currentAcc = await wallet.getCurrentAccount();
        alianName = currentAcc?.alianName || 'Hardware Wallet';
        createdAccount = currentAcc;
      } else {
        throw new Error(
          'No valid import method data found (seed phrase, private key, or keyringId).'
        );
      }

      // Set preference that wallet has been booted/setup
      await wallet.setPreference('booted', true);

      return { alianName, createdAccount };
    },
    {
      onSuccess({ alianName, createdAccount }) {
        if (isNewUser) {
          history.replace({
            pathname: '/new-user/success',
            state: {
              alianName,
              keyringType: store.keyringType || createdAccount?.type,
              brandName: store.brandName || createdAccount?.brandName,
              accounts: store.accounts || (createdAccount ? [createdAccount] : []),
              showImportIcon: store.showImportIcon,
              isHw: store.isHw,
            },
          });
        } else {
          // This path might not be relevant for a simplified new user flow
          // but kept for structural integrity from original Rabby code.
          history.replace({
            pathname: '/popup/import/success',
            state: {
              alianName,
              keyringType: store.keyringType || createdAccount?.type,
              brandName: store.brandName || createdAccount?.brandName,
              accounts: store.accounts || (createdAccount ? [createdAccount] : []),
              showImportIcon: store.showImportIcon,
              isHw: store.isHw,
            },
          });
        }
      },
      onError(err) {
        message.error(
          t('page.newAddress.setPassword.failedToCreateAPassword')
        );
        console.error('Error setting password / booting wallet:', err);
      },
    }
  );

  useEffect(() => {
    const MatomoTime = new MatomoTime();
    MatomoTime.start();
    return () => {
      MatomoTime.end({
        category: 'User',
        action: 'Create Password Page Time',
      });
    };
  }, []);

  useEffect(() => {
    if (store.isHw) {
      ga4.fireEvent('hw_wallet_set_password', {
        event_category: 'User',
        event_label: store.brandName,
      });
    }
  }, [store.isHw, store.brandName]);

  return (
    <StrayPageWithButton
      custom={isNewUser}
      header={{
        title: t('page.newAddress.setPassword.title'),
        center: true,
        customBack: isNewUser ? () => history.goBack() : undefined,
      }}
      headerOnMobile={isNewUser}
      className="new-user-set-password"
      hasBack={isNewUser}
      onBackClick={isNewUser ? () => history.goBack() : undefined}
      footerFixed={!isNewUser}
      spinning={loading}
    >
      <div className="rabby-container">
        <div className="px-20">
          <Form
            form={form}
            onFinish={({ password }) => {
              run(password);
            }}
            onValuesChange={() => setPasswordChanged(true)}
          >
            <div className="text-center text-r-neutral-title1 text-20 mb-12 font-medium">
              {t('page.newAddress.setPassword.subTitle')}
            </div>
            <p className="text-r-neutral-foot text-14 mb-[25px] text-center">
              {t('page.newAddress.setPassword.desc')}
            </p>
            <Form.Item
              name="password"
              rules={[
                {
                  required: true,
                  message: t(
                    'page.newAddress.setPassword.passwordIsRequired'
                  ),
                },
                {
                  pattern: passwordReg,
                  message: t(
                    'page.newAddress.setPassword.passwordLengthInvalid'
                  ),
                },
              ]}
            >
              <Input
                className="h-[52px]ลก"
                type="password"
                placeholder={t(
                  'page.newAddress.setPassword.placeholderPassword'
                )}
                size="large"
                autoFocus
              />
            </Form.Item>
            <PasswordStrength password={form.getFieldValue('password')} />
            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                {
                  required: true,
                  message: t(
                    'page.newAddress.setPassword.confirmPasswordIsRequired'
                  ),
                },
                {
                  pattern: passwordReg,
                  message: t(
                    'page.newAddress.setPassword.passwordLengthInvalid'
                  ),
                },
                ({ getFieldValue }) => ({
                  validator(rule, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      t('page.newAddress.setPassword.passwordNotMatch')
                    );
                  },
                }),
              ]}
            >
              <Input
                className="h-[52px]"
                type="password"
                placeholder={t(
                  'page.newAddress.setPassword.placeholderConfirmPassword'
                )}
                size="large"
              />
            </Form.Item>
            {!isNewUser && (
              <div className="fixed-footer">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  className="w-[200px]"
                  disabled={!passwordChanged}
                >
                  {t('global.confirm')}
                </Button>
              </div>
            )}

            {isNewUser && (
              <div className="flex justify-center mt-[20px]">
                <Button
                  type="primary"
                  className="w-[250px] h-[52px]"
                  htmlType="submit"
                  size="large"
                  disabled={!passwordChanged}
                >
                  {t('global.next')}
                </Button>
              </div>
            )}
          </Form>
        </div>
      </div>
    </StrayPageWithButton>
  );
};
