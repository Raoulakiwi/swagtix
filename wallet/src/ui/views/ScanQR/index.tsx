import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { Button, message, Modal, Spin, Result } from 'antd';
import { 
  ArrowLeftOutlined, 
  QrcodeOutlined, 
  ScanOutlined, 
  EditOutlined, 
  BulbOutlined,
  CheckCircleFilled
} from '@ant-design/icons';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { SWAGTIX_COLORS } from '@/ui/utils/theme';
import { useWallet } from '@/ui/utils';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #000;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
`;

const BackButton = styled(Button)`
  background: transparent;
  border: none;
  color: white;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
`;

const Title = styled.h1`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 0 16px;
  color: white;
`;

const ScannerContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
`;

const CameraViewport = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #111;
  position: relative;
`;

const MockCamera = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, #111, #222);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ScanFrame = styled.div`
  width: 280px;
  height: 280px;
  border: 2px solid ${SWAGTIX_COLORS.PURPLE};
  border-radius: 20px;
  position: relative;
  
  &::before, &::after {
    content: '';
    position: absolute;
    width: 40px;
    height: 40px;
    border-color: ${SWAGTIX_COLORS.BLUE};
    border-style: solid;
    border-width: 0;
  }
  
  &::before {
    top: -2px;
    left: -2px;
    border-top-width: 4px;
    border-left-width: 4px;
    border-top-left-radius: 20px;
  }
  
  &::after {
    top: -2px;
    right: -2px;
    border-top-width: 4px;
    border-right-width: 4px;
    border-top-right-radius: 20px;
  }
`;

const ScannerLine = styled.div`
  position: absolute;
  width: calc(100% - 20px);
  height: 2px;
  background: linear-gradient(to right, ${SWAGTIX_COLORS.BLUE}, ${SWAGTIX_COLORS.PURPLE}, ${SWAGTIX_COLORS.PINK});
  top: 50%;
  left: 10px;
  transform: translateY(-50%);
  animation: scanAnimation 2s infinite linear;
  box-shadow: 0 0 8px rgba(123, 91, 255, 0.8);
  
  @keyframes scanAnimation {
    0% {
      top: 10%;
    }
    50% {
      top: 90%;
    }
    100% {
      top: 10%;
    }
  }
`;

const InstructionText = styled.p`
  position: absolute;
  bottom: 120px;
  left: 0;
  right: 0;
  text-align: center;
  color: white;
  font-size: 16px;
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.7);
  margin: 0;
`;

const BottomControls = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 20px;
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
`;

const ControlButton = styled(Button)`
  background: transparent;
  border: none;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
  
  .anticon {
    font-size: 24px;
    margin-bottom: 4px;
  }
`;

const ButtonText = styled.span`
  font-size: 12px;
  margin-top: 4px;
`;

const ManualEntryModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 16px;
    overflow: hidden;
  }
  
  .ant-modal-header {
    background: linear-gradient(to right, ${SWAGTIX_COLORS.BLUE}, ${SWAGTIX_COLORS.PURPLE});
    border-bottom: none;
    
    .ant-modal-title {
      color: white;
    }
  }
  
  .ant-modal-body {
    padding: 24px;
  }
  
  .ant-input {
    border-radius: 8px;
    height: 48px;
    font-size: 16px;
  }
  
  .ant-btn-primary {
    background: linear-gradient(to right, ${SWAGTIX_COLORS.PURPLE}, ${SWAGTIX_COLORS.PINK});
    border: none;
    height: 40px;
    border-radius: 8px;
    
    &:hover {
      background: linear-gradient(to right, ${SWAGTIX_COLORS.BLUE}, ${SWAGTIX_COLORS.PURPLE});
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }
`;

const SuccessIcon = styled(CheckCircleFilled)`
  font-size: 64px;
  color: ${SWAGTIX_COLORS.PURPLE};
`;

const ScanQR: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const wallet = useWallet();
  
  const [scanning, setScanning] = useState(true);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [manualEntryVisible, setManualEntryVisible] = useState(false);
  const [ticketScanned, setTicketScanned] = useState(false);
  const [scannedTicketId, setScannedTicketId] = useState<string | null>(null);
  
  // Simulate scanning a QR code after a few seconds
  useEffect(() => {
    if (scanning) {
      const timer = setTimeout(() => {
        // Simulate finding a QR code
        const mockTicketId = '123456';
        setScannedTicketId(mockTicketId);
        setTicketScanned(true);
        setScanning(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [scanning]);
  
  // Handle going back
  const handleBack = () => {
    history.goBack();
  };
  
  // Toggle flashlight (placeholder)
  const toggleFlashlight = () => {
    setFlashlightOn(!flashlightOn);
    message.info(t(flashlightOn ? 'Flashlight turned off' : 'Flashlight turned on'));
  };
  
  // Show manual entry modal
  const showManualEntry = () => {
    setManualEntryVisible(true);
  };
  
  // Handle manual ticket code submission
  const handleManualSubmit = () => {
    // Simulate processing
    setManualEntryVisible(false);
    message.loading(t('Verifying ticket...'), 1.5, () => {
      setScannedTicketId('MANUAL123');
      setTicketScanned(true);
    });
  };
  
  // Restart scanning
  const handleRescan = () => {
    setTicketScanned(false);
    setScanning(true);
  };
  
  // View scanned ticket details
  const viewTicketDetails = () => {
    if (scannedTicketId) {
      history.push(`/ticket/${scannedTicketId}`);
    }
  };
  
  return (
    <Container>
      <Header>
        <BackButton 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack} 
        />
        <Title>{t('Scan Ticket')}</Title>
      </Header>
      
      <ScannerContainer>
        {scanning ? (
          <CameraViewport>
            <MockCamera>
              <ScanFrame>
                <ScannerLine />
              </ScanFrame>
            </MockCamera>
            
            <InstructionText>
              {t('Point your camera at the ticket QR code')}
            </InstructionText>
          </CameraViewport>
        ) : (
          <Result
            icon={<SuccessIcon />}
            title={t('Ticket Found!')}
            subTitle={t('Ticket ID: {{id}}', { id: scannedTicketId })}
            extra={[
              <Button 
                key="view" 
                type="primary" 
                onClick={viewTicketDetails}
                style={{ 
                  background: `linear-gradient(to right, ${SWAGTIX_COLORS.PURPLE}, ${SWAGTIX_COLORS.PINK})`,
                  border: 'none',
                  height: '44px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  marginBottom: '12px'
                }}
              >
                {t('View Ticket')}
              </Button>,
              <Button 
                key="scan" 
                onClick={handleRescan}
              >
                {t('Scan Another')}
              </Button>
            ]}
            style={{ 
              background: 'white', 
              padding: '32px', 
              borderRadius: '16px',
              margin: '24px'
            }}
          />
        )}
      </ScannerContainer>
      
      {scanning && (
        <BottomControls>
          <ControlButton onClick={toggleFlashlight}>
            <BulbOutlined />
            <ButtonText>
              {flashlightOn ? t('Light Off') : t('Light On')}
            </ButtonText>
          </ControlButton>
          
          <ControlButton onClick={showManualEntry}>
            <EditOutlined />
            <ButtonText>{t('Enter Code')}</ButtonText>
          </ControlButton>
        </BottomControls>
      )}
      
      <ManualEntryModal
        title={t('Enter Ticket Code')}
        visible={manualEntryVisible}
        onCancel={() => setManualEntryVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setManualEntryVisible(false)}>
            {t('Cancel')}
          </Button>,
          <Button key="submit" type="primary" onClick={handleManualSubmit}>
            {t('Verify')}
          </Button>
        ]}
        centered
      >
        <p>{t('Enter the ticket code manually:')}</p>
        <input
          placeholder={t('e.g. TICKET-123456')}
          style={{ 
            width: '100%', 
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #d9d9d9',
            fontSize: '16px'
          }}
        />
      </ManualEntryModal>
    </Container>
  );
};

export default ScanQR;
