import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Form, Input, Button, message, Checkbox } from 'antd';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import LogoSVG from '@/ui/assets/logo.svg';
import { SWAGTIX_COLORS } from '@/ui/utils/theme';
import { useWallet } from '@/ui/utils';
import web3authService from '@/background/service/web3auth'; // Assuming this service exists

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
  padding: 24px;
  background: linear-gradient(135deg, #121212 0%, #192945 100%);
  color: white;
`;

const BackButton = styled(Button)`
  position: absolute;
  top: 24px;
  left: 24px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }
`;

const Logo = styled.img`
  width: 80px;
  margin-top: 60px;
  margin-bottom: 40px;
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 32px;
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
  text-align: center;
  color: white;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 32px;
  text-align: center;
`;

const StyledForm = styled(Form)`
  width: 100%;
  
  .ant-form-item-label > label {
    color: rgba(255, 255, 255, 0.8);
  }
  
  .ant-input-affix-wrapper {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: white;
    height: 50px;
    
    &:focus-within {
      border-color: ${SWAGTIX_COLORS.PURPLE};
      box-shadow: 0 0 0 2px rgba(123, 91, 255, 0.2);
    }
    
    .ant-input {
      background: transparent;
      color: white;
      font-size: 16px;
      
      &::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }
    }
    
    .ant-input-prefix {
      color: rgba(255, 255, 255, 0.5);
    }
  }
`;

const SubmitButton = styled(Button)`
  width: 100%;
  height: 50px;
  font-size: 18px;
  font-weight: 600;
  border-radius: 8px;
  margin-top: 16px;
  background: linear-gradient(to right, ${SWAGTIX_COLORS.PURPLE}, ${SWAGTIX_COLORS.PINK});
  border: none;
  
  &:hover, &:focus {
    background: linear-gradient(to right, ${SWAGTIX_COLORS.BLUE}, ${SWAGTIX_COLORS.PURPLE});
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    opacity: 0.6;
    background: linear-gradient(to right, ${SWAGTIX_COLORS.PURPLE}, ${SWAGTIX_COLORS.PINK});
  }
`;

const TermsText = styled.p`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 24px;
  text-align: center;
  line-height: 1.5;
  
  a {
    color: ${SWAGTIX_COLORS.BLUE};
    text-decoration: underline;
    
    &:hover {
      color: ${SWAGTIX_COLORS.PURPLE};
    }
  }
`;

const EmailSignup: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const wallet = useWallet(); // Assuming useWallet provides necessary wallet interactions
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleBack = () => {
    history.push('/onboarding/welcome'); // Or wherever the previous step is
  };

  const handleSubmitAsync = async (values: { email: string; }) => {
    const { email } = values;
    setLoading(true);
    
    try {
      // Initialize Web3Auth login
      await web3authService.init(); // Make sure this is idempotent or handled correctly
      const loginResult = await web3authService.loginWithEmail(email);
      
      if (loginResult && loginResult.privKey) {
        // Use the private key to set up the wallet
        // This might involve creating a new keyring or importing the private key
        // The exact method depends on how Rabby's core (or your simplified version) handles it
        
        // Example: (This needs to be adapted to your wallet's specific methods)
        // const accounts = await wallet.createKeyringWithPrivateKey(loginResult.privKey);
        // await wallet.unlockKeyring(accounts[0].type, accounts[0].brandName, loginResult.privKey); 
        // await wallet.addKeyring(accounts[0].type, accounts[0].brandName, loginResult.privKey);

        // For SwagTix, we might want to directly use the private key to create/unlock
        // a SimpleKeyring or a specific Web3Auth keyring type if Rabby supports it.
        
        // Placeholder for wallet setup logic with the private key from Web3Auth
        // This is a critical part that needs to be implemented based on your wallet's architecture.
        // For now, let's assume a successful login means we can proceed.
        
        // Check if a PIN is already set. If not, redirect to PIN creation.
        const pinIsSet = await wallet.isPinSet();
        if (pinIsSet) {
          history.push('/'); // Go to main app (or PIN entry if needed)
        } else {
          history.push('/onboarding/create-pin'); // Redirect to PIN creation
        }
        
      } else {
        message.error(t('Login failed. Please check your email or try again.'));
      }
      
    } catch (error: any) {
      console.error('Email login error:', error);
      message.error(error.message || t('An error occurred during login. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (values: { email: string; }): void => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    handleSubmitAsync(values);
  };

  return (
    <Container>
      <BackButton 
        type="default" 
        icon={<ArrowLeftOutlined />} 
        onClick={handleBack} 
      />
      
      <Logo src={LogoSVG} alt="SwagTix Logo" />
      
      <Card>
        <Title>{t('Sign Up / Log In')}</Title>
        <Subtitle>
          {t('Enter your email to get started with SwagTix')}
        </Subtitle>
        
        <StyledForm
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: t('Please enter your email') },
              { type: 'email', message: t('Please enter a valid email address') }
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />}
              placeholder={t('your.email@example.com')}
              size="large"
              autoFocus
            />
          </Form.Item>
          
          <Form.Item
            name="terms"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value ? Promise.resolve() : Promise.reject(new Error(t('You must accept the terms and conditions'))),
              },
            ]}
          >
            <Checkbox 
              checked={termsAccepted} 
              onChange={(e) => setTermsAccepted(e.target.checked)}
              style={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              {t('I agree to the SwagTix Terms of Service and Privacy Policy')}
            </Checkbox>
          </Form.Item>
          
          <SubmitButton 
            type="primary" 
            htmlType="submit"
            loading={loading}
            disabled={loading || !termsAccepted}
          >
            {loading ? t('Processing...') : t('Continue with Email')}
          </SubmitButton>
        </StyledForm>
        
        <TermsText>
          {t('By continuing, you agree to our')}{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer">{t('Terms of Service')}</a>{' '}
          {t('and')}{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer">{t('Privacy Policy')}</a>.
        </TermsText>
      </Card>
    </Container>
  );
};

export default EmailSignup;
