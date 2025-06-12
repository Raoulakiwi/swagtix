import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Form, Input, Button, message, Spin } from 'antd';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import LogoSVG from '@/ui/assets/logo.svg';
import { SWAGTIX_COLORS } from '@/ui/utils/theme';
import web3authService from '@/background/service/web3auth';
import { useWallet } from '@/ui/utils';

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
  
  .ant-input {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: white;
    height: 50px;
    font-size: 16px;
    
    &:focus {
      border-color: ${SWAGTIX_COLORS.PURPLE};
      box-shadow: 0 0 0 2px rgba(123, 91, 255, 0.2);
    }
    
    &::placeholder {
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

const InfoText = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 24px;
  text-align: center;
  line-height: 1.5;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 40px 0;
`;

const LoadingText = styled.p`
  margin-top: 16px;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
`;

const EmailSignup: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const wallet = useWallet();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  
  // Check if Web3Auth is already initialized
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const isLoggedIn = await web3authService.isLoggedIn();
        if (isLoggedIn) {
          // User is already logged in, redirect to PIN setup
          history.push('/onboarding/create-pin');
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      }
    };

    checkLoginStatus();
  }, [history]);

  const handleBack = () => {
    history.push('/onboarding/welcome');
  };

  const handleSubmit = async (values: { email: string }) => {
    setLoading(true);
    try {
      // Start the Web3Auth login process with email
      setVerifyingEmail(true);
      const success = await web3authService.login();
      
      if (success) {
        // Wait for the account to be imported to the keyring
        await new Promise(resolve => {
          const handleImported = () => {
            resolve(true);
            wallet.removeMessageListener('wallet_web3auth_imported', handleImported);
          };
          wallet.addMessageListener('wallet_web3auth_imported', handleImported);
          
          // Set a timeout in case the event is not fired
          setTimeout(() => {
            resolve(false);
            wallet.removeMessageListener('wallet_web3auth_imported', handleImported);
          }, 10000);
        });
        
        message.success(t('Email verified successfully!'));
        
        // Redirect to PIN creation
        history.push('/onboarding/create-pin');
      } else {
        message.error(t('Verification failed. Please try again.'));
        setVerifyingEmail(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error(t('An error occurred. Please try again.'));
      setVerifyingEmail(false);
    } finally {
      setLoading(false);
    }
  };

  if (verifyingEmail) {
    return (
      <Container>
        <Card>
          <LoadingContainer>
            <Spin size="large" />
            <LoadingText>{t('Verifying your email...')}</LoadingText>
            <Subtitle>
              {t('Check your inbox for a verification link. Click it to continue.')}
            </Subtitle>
          </LoadingContainer>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <BackButton 
        type="default" 
        icon={<ArrowLeftOutlined />} 
        onClick={handleBack} 
      />
      
      <Logo src={LogoSVG} alt="SwagTix Logo" />
      
      <Card>
        <Title>{t('Create Your Ticket Account')}</Title>
        <Subtitle>
          {t('Enter your email to get started. We\'ll send you a verification link.')}
        </Subtitle>
        
        <StyledForm
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: t('Please enter your email address') },
              { type: 'email', message: t('Please enter a valid email address') }
            ]}
          >
            <Input 
              prefix={<MailOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />} 
              placeholder={t('Email address')}
              size="large"
              autoComplete="email"
            />
          </Form.Item>
          
          <SubmitButton 
            type="primary" 
            htmlType="submit"
            loading={loading}
            disabled={loading}
          >
            {loading ? t('Sending...') : t('Continue')}
          </SubmitButton>
        </StyledForm>
        
        <InfoText>
          {t('We\'ll use this email to secure your tickets and help you recover your account if needed.')}
        </InfoText>
      </Card>
    </Container>
  );
};

export default EmailSignup;
