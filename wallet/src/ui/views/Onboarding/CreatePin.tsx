import React, { useState, useRef, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { LockOutlined, ArrowLeftOutlined, CheckCircleFilled } from '@ant-design/icons';
import LogoSVG from '@/ui/assets/logo.svg';
import { SWAGTIX_COLORS } from '@/ui/utils/theme';
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
    letter-spacing: 8px;
    text-align: center;
    
    &:focus {
      border-color: ${SWAGTIX_COLORS.PURPLE};
      box-shadow: 0 0 0 2px rgba(123, 91, 255, 0.2);
    }
    
    &::placeholder {
      color: rgba(255, 255, 255, 0.5);
      letter-spacing: normal;
    }
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

const InfoText = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 24px;
  text-align: center;
  line-height: 1.5;
`;

const SuccessContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const SuccessIcon = styled(CheckCircleFilled)`
  font-size: 64px;
  color: ${SWAGTIX_COLORS.PURPLE};
  margin-bottom: 24px;
`;

const CreatePin: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const wallet = useWallet();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [pinCreated, setPinCreated] = useState(false);
  const confirmPinRef = useRef<Input | null>(null);

  const handleBack = () => {
    history.push('/onboarding/signup');
  };

  const handleSubmit = async (values: { pin: string; confirmPin: string }) => {
    const { pin, confirmPin } = values;
    
    if (pin !== confirmPin) {
      message.error(t('PINs do not match. Please try again.'));
      return;
    }
    
    if (pin.length < 4 || pin.length > 6) {
      message.error(t('PIN must be 4-6 digits.'));
      return;
    }
    
    setLoading(true);
    
    try {
      // Store PIN securely in the wallet
      await wallet.setUnlockPin(pin);
      
      // Show success state
      setPinCreated(true);
      
      // Redirect to main app after a short delay
      setTimeout(() => {
        history.push('/');
      }, 2000);
      
    } catch (error) {
      console.error('Error setting PIN:', error);
      message.error(t('Failed to set PIN. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Focus on confirm PIN input when PIN is entered
  const handlePinComplete = () => {
    if (confirmPinRef.current) {
      confirmPinRef.current.focus();
    }
  };

  // Validate PIN is numeric only
  const validateNumeric = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error(t('Please enter a PIN')));
    }
    
    if (!/^\d+$/.test(value)) {
      return Promise.reject(new Error(t('PIN must contain only numbers')));
    }
    
    if (value.length < 4 || value.length > 6) {
      return Promise.reject(new Error(t('PIN must be 4-6 digits')));
    }
    
    return Promise.resolve();
  };

  if (pinCreated) {
    return (
      <Container>
        <Card>
          <SuccessContainer>
            <SuccessIcon />
            <Title>{t('PIN Created Successfully!')}</Title>
            <Subtitle>{t('Taking you to your tickets...')}</Subtitle>
          </SuccessContainer>
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
        <Title>{t('Create a PIN')}</Title>
        <Subtitle>
          {t('Set a 4-6 digit PIN for quick access to your tickets')}
        </Subtitle>
        
        <StyledForm
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="pin"
            rules={[
              { required: true, message: t('Please enter a PIN') },
              { validator: validateNumeric }
            ]}
            label={<span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{t('Enter PIN')}</span>}
          >
            <PinInput
              prefix={<LockOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />}
              placeholder={t('4-6 digits')}
              maxLength={6}
              onChange={(e) => {
                if (e.target.value.length >= 4) {
                  handlePinComplete();
                }
              }}
              visibilityToggle={false}
              autoComplete="new-password"
            />
          </Form.Item>
          
          <Form.Item
            name="confirmPin"
            rules={[
              { required: true, message: t('Please confirm your PIN') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('pin') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('PINs do not match')));
                },
              }),
            ]}
            label={<span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{t('Confirm PIN')}</span>}
          >
            <PinInput
              ref={confirmPinRef}
              prefix={<LockOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />}
              placeholder={t('Re-enter PIN')}
              maxLength={6}
              visibilityToggle={false}
              autoComplete="new-password"
            />
          </Form.Item>
          
          <SubmitButton 
            type="primary" 
            htmlType="submit"
            loading={loading}
            disabled={loading}
          >
            {loading ? t('Creating...') : t('Create PIN')}
          </SubmitButton>
        </StyledForm>
        
        <InfoText>
          {t('You\'ll use this PIN to quickly access your tickets. Make sure it\'s something you\'ll remember!')}
        </InfoText>
      </Card>
    </Container>
  );
};

export default CreatePin;
