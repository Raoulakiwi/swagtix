import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LogoSVG from '@/ui/assets/logo.svg';
import { SWAGTIX_COLORS } from '@/ui/utils/theme';
import { useWallet } from '@/ui/utils';

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(123, 91, 255, 0.7);
  }
  
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px rgba(123, 91, 255, 0);
  }
  
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(123, 91, 255, 0);
  }
`;

const loadingDots = keyframes`
  0% { content: "."; }
  33% { content: ".."; }
  66% { content: "..."; }
`;

// Styled Components
const SplashContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #121212 0%, #192945 100%);
  color: white;
  animation: ${fadeIn} 0.5s ease-in;
`;

const LogoContainer = styled.div`
  width: 150px;
  height: 150px;
  margin-bottom: 40px;
  animation: ${pulse} 2s infinite;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Logo = styled.img`
  width: 100%;
  height: 100%;
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 16px;
  background: linear-gradient(to right, ${SWAGTIX_COLORS.BLUE}, ${SWAGTIX_COLORS.PURPLE}, ${SWAGTIX_COLORS.PINK});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
`;

const Subtitle = styled.p`
  font-size: 18px;
  color: #e5e9ef;
  margin-bottom: 40px;
  text-align: center;
  max-width: 80%;
`;

const LoadingText = styled.div`
  font-size: 16px;
  color: #8e99ab;
  margin-top: 20px;
  
  &::after {
    content: ".";
    animation: ${loadingDots} 1.5s infinite;
  }
`;

const ProgressBar = styled.div`
  width: 200px;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
  margin-top: 20px;
`;

const Progress = styled.div<{ width: number }>`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: ${props => props.width}%;
  background: linear-gradient(to right, ${SWAGTIX_COLORS.BLUE}, ${SWAGTIX_COLORS.PURPLE}, ${SWAGTIX_COLORS.PINK});
  border-radius: 2px;
  transition: width 0.3s ease;
`;

const SplashScreen: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const wallet = useWallet();
  const [progress, setProgress] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prevProgress => {
        const newProgress = prevProgress + 5;
        if (newProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return newProgress;
      });
    }, 150);

    // Check if wallet is unlocked
    const checkWalletStatus = async () => {
      try {
        const isUnlocked = await wallet.isUnlocked();
        
        // Ensure minimum display time of splash screen (for branding purposes)
        setTimeout(() => {
          setIsInitializing(false);
          if (isUnlocked) {
            history.push('/');
          } else {
            history.push('/unlock');
          }
        }, 2500);
      } catch (error) {
        console.error('Error checking wallet status:', error);
        setTimeout(() => {
          setIsInitializing(false);
          history.push('/unlock');
        }, 2500);
      }
    };

    checkWalletStatus();

    return () => {
      clearInterval(interval);
    };
  }, [wallet, history]);

  return (
    <SplashContainer>
      <LogoContainer>
        <Logo src={LogoSVG} alt="SwagTix Logo" />
      </LogoContainer>
      <Title>{t('SwagTix')}</Title>
      <Subtitle>{t('Your NFT Ticket Wallet for PulseChain Events')}</Subtitle>
      <ProgressBar>
        <Progress width={progress} />
      </ProgressBar>
      <LoadingText>{t('Initializing')}</LoadingText>
    </SplashContainer>
  );
};

export default SplashScreen;
