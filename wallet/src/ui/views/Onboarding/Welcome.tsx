import React from 'react';
import { useHistory } from 'react-router-dom';
import { Button } from 'antd';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import LogoWithText from '@/ui/assets/logo-with-text.svg';
import { SWAGTIX_COLORS } from '@/ui/utils/theme';
import { getGradientTextStyle } from '@/ui/utils/theme';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 24px;
  background: linear-gradient(135deg, #121212 0%, #192945 100%);
  color: white;
`;

const Logo = styled.img`
  width: 240px;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 16px;
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 18px;
  color: #e5e9ef;
  margin-bottom: 40px;
  text-align: center;
  max-width: 400px;
  line-height: 1.6;
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

const FeatureList = styled.ul`
  margin-bottom: 32px;
  width: 100%;
  padding-left: 20px;
`;

const FeatureItem = styled.li`
  margin-bottom: 12px;
  color: #e5e9ef;
  font-size: 16px;
  line-height: 1.5;
  
  &::marker {
    color: ${SWAGTIX_COLORS.PURPLE};
  }
`;

const StartButton = styled(Button)`
  width: 100%;
  height: 50px;
  font-size: 18px;
  font-weight: 600;
  border-radius: 8px;
  background: linear-gradient(to right, ${SWAGTIX_COLORS.PURPLE}, ${SWAGTIX_COLORS.PINK});
  border: none;
  
  &:hover, &:focus {
    background: linear-gradient(to right, ${SWAGTIX_COLORS.BLUE}, ${SWAGTIX_COLORS.PURPLE});
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`;

const Footer = styled.div`
  margin-top: 32px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
`;

const GradientText = styled.span`
  ${getGradientTextStyle()}
`;

const Welcome: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();

  const handleGetStarted = () => {
    history.push('/onboarding/signup');
  };

  return (
    <Container>
      <Card>
        <Logo src={LogoWithText} alt="SwagTix Logo" />
        
        <Title>
          <GradientText>{t('Welcome to SwagTix')}</GradientText>
        </Title>
        
        <Subtitle>
          {t('Your digital ticket hub for events on the PulseChain network')}
        </Subtitle>

        <FeatureList>
          <FeatureItem>
            {t('Store and view your event tickets in one place')}
          </FeatureItem>
          <FeatureItem>
            {t('Easy access with email login and PIN code')}
          </FeatureItem>
          <FeatureItem>
            {t('Show QR codes at venues for quick entry')}
          </FeatureItem>
          <FeatureItem>
            {t('Transfer tickets to friends securely')}
          </FeatureItem>
        </FeatureList>

        <StartButton 
          type="primary" 
          onClick={handleGetStarted}
          size="large"
        >
          {t('Get Started')}
        </StartButton>
        
        <Footer>
          {t('By continuing, you agree to our Terms of Service and Privacy Policy')}
        </Footer>
      </Card>
    </Container>
  );
};

export default Welcome;
