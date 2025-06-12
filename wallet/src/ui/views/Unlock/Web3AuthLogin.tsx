import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Button, message, Spin } from 'antd';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import LogoSVG from '@/ui/assets/logo.svg';
import EmailIcon from '@/ui/assets/email.svg';
import { useWallet } from '@/ui/utils';
import web3authService from '@/background/service/web3auth';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: var(--r-neutral-bg-1, #f5f6fa);
`;

const Logo = styled.img`
  width: 80px;
  height: 80px;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 500;
  color: var(--r-neutral-title-1, #192945);
  margin-bottom: 8px;
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: var(--r-neutral-body, #3e495e);
  margin-bottom: 32px;
  text-align: center;
  max-width: 320px;
`;

const LoginCard = styled.div`
  background: var(--r-neutral-card-1, #fff);
  border-radius: 16px;
  padding: 32px;
  width: 400px;
  box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const LoginButton = styled(Button)`
  width: 100%;
  height: 50px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
    margin-right: 8px;
    width: 20px;
    height: 20px;
  }
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background-color: var(--r-neutral-line, #e5e9ef);
  margin: 24px 0;
`;

const Footer = styled.div`
  margin-top: 24px;
  font-size: 14px;
  color: var(--r-neutral-foot, #6a7587);
  text-align: center;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
`;

const LoadingText = styled.p`
  margin-top: 16px;
  font-size: 16px;
  color: var(--r-neutral-body, #3e495e);
`;

const Web3AuthLogin: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check if user is already logged in with Web3Auth
    const checkLoginStatus = async () => {
      try {
        const isLoggedIn = await web3authService.isLoggedIn();
        if (isLoggedIn) {
          // User is already logged in, redirect to dashboard
          history.push('/');
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    checkLoginStatus();
  }, [history]);

  const handleEmailLogin = async () => {
    setLoading(true);
    try {
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
          }, 5000);
        });
        
        message.success(t('Login successful'));
        history.push('/');
      } else {
        message.error(t('Login failed. Please try again.'));
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error(t('An error occurred during login. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleTraditionalLogin = () => {
    // Redirect to traditional login page if needed
    history.push('/unlock/password');
  };

  if (!isInitialized) {
    return (
      <Container>
        <LoadingContainer>
          <Spin size="large" />
          <LoadingText>{t('Initializing...')}</LoadingText>
        </LoadingContainer>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <LoadingContainer>
          <Spin size="large" />
          <LoadingText>{t('Logging in...')}</LoadingText>
        </LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      <LoginCard>
        <Logo src={LogoSVG} alt="SwagTix Logo" />
        <Title>{t('Welcome to SwagTix')}</Title>
        <Subtitle>
          {t('Your NFT ticket wallet for PulseChain events')}
        </Subtitle>

        <LoginButton 
          type="primary" 
          onClick={handleEmailLogin}
          icon={<img src={EmailIcon} alt="Email" />}
        >
          {t('Continue with Email')}
        </LoginButton>

        <Divider />

        <Button 
          type="link" 
          onClick={handleTraditionalLogin}
        >
          {t('Use advanced login options')}
        </Button>

        <Footer>
          {t('By continuing, you agree to our Terms of Service and Privacy Policy')}
        </Footer>
      </LoginCard>
    </Container>
  );
};

export default Web3AuthLogin;
