import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import LogoSVG from '@/ui/assets/logo.svg';
import { SWAGTIX_COLORS } from '@/ui/utils/theme';
import { useWallet } from '@/ui/utils';
import web3authService from '@/background/service/web3auth';

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
`;

const PinInput = styled(Input.Password)`
  &.ant-input-affix-wrapper {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: white;
    height: 50px;
    font-size: 24px;
    letter-spacing: 8px;
    text-align: center;
    
    &:focus, &-focused {
      border-color: ${SWAGTIX_COLORS.PURPLE};
      box-shadow: 0 0 0 2px rgba(123, 91, 255, 0.2);
    }
    
    .ant-input {
      background: transparent;
      text-align: center;
      color: white;
      font-size: 24px;
      letter-spacing: 8px;
    }
    
    .ant-input-suffix {
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

const ForgotPinButton = styled(Button)`
  background: transparent;
  border: none;
  color: ${SWAGTIX_COLORS.BLUE};
  margin-top: 16px;
  font-size: 14px;
  
  &:hover, &:focus {
    color: ${SWAGTIX_COLORS.PURPLE};
    background: transparent;
  }
`;

const InfoText = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 24px;
  text-align: center;
  line-height: 1.5;
`;

const EmailLoginButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 44px;
  font-size: 16px;
  border-radius: 8px;
  margin-top: 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  
  &:hover, &:focus {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }
  
  .anticon {
    margin-right: 8px;
  }
`;

const PinEntry: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const wallet = useWallet();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // Get user email on component mount
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const info = await web3authService.getWeb3AuthUserInfo();
        if (info?.email) {
          setUserEmail(info.email);
        }
      } catch (error) {
        console.error('Error getting user info:', error);
      }
    };
    
    getUserInfo();
  }, []);

  const handleSubmit = async (values: { pin: string }) => {
    const { pin } = values;
    
    setLoading(true);
    
    try {
      // Verify PIN with wallet service
      const isCorrect = await wallet.verifyUnlockPin(pin);
      
      if (isCorrect) {
        // Reset attempts counter
        setAttempts(0);
        
        // Unlock the wallet
        await wallet.unlock(pin);
        
        // Redirect to main app
        history.push('/');
      } else {
        // Increment attempts counter
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        // Show error message
        if (newAttempts >= 3) {
          message.error(t('Too many incorrect attempts. Consider using email login.'));
        } else {
          message.error(t('Incorrect PIN. Please try again.'));
        }
        
        // Clear the form
        form.setFieldsValue({ pin: '' });
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      message.error(t('Failed to verify PIN. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    try {
      // Reset the wallet and redirect to email login
      await wallet.resetUnlockPin();
      history.push('/onboarding/signup');
    } catch (error) {
      console.error('Error resetting PIN:', error);
      message.error(t('Failed to reset PIN. Please try again.'));
    }
  };

  // Validate PIN is numeric only
  const validateNumeric = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error(t('Please enter your PIN')));
    }
    
    if (!/^\d+$/.test(value)) {
      return Promise.reject(new Error(t('PIN must contain only numbers')));
    }
    
    return Promise.resolve();
  };

  return (
    <Container>
      <Logo src={LogoSVG} alt="SwagTix Logo" />
      
      <Card>
        <Title>{t('Welcome Back!')}</Title>
        <Subtitle>
          {userEmail ? t('Enter your PIN to access your tickets') : t('Enter your PIN to continue')}
        </Subtitle>
        
        <StyledForm
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="pin"
            rules={[
              { required: true, message: t('Please enter your PIN') },
              { validator: validateNumeric }
            ]}
          >
            <PinInput
              prefix={<LockOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />}
              placeholder={t('Enter PIN')}
              maxLength={6}
              visibilityToggle={false}
              autoFocus
              autoComplete="current-password"
            />
          </Form.Item>
          
          <SubmitButton 
            type="primary" 
            htmlType="submit"
            loading={loading}
            disabled={loading}
          >
            {loading ? t('Verifying...') : t('Unlock')}
          </SubmitButton>
        </StyledForm>
        
        <ForgotPinButton 
          type="link" 
          onClick={handleEmailLogin}
        >
          {t('Forgot PIN?')}
        </ForgotPinButton>
        
        {attempts >= 3 && (
          <EmailLoginButton 
            onClick={handleEmailLogin}
            icon={<MailOutlined />}
          >
            {t('Login with Email Instead')}
          </EmailLoginButton>
        )}
        
        {userEmail && (
          <InfoText>
            {t('Signed in as')}: {userEmail}
          </InfoText>
        )}
      </Card>
    </Container>
  );
};

export default PinEntry;
