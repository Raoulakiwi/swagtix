import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Form, Input, Button, Select, message, Steps, Card, Modal, Tooltip, Spin } from 'antd';
import { ArrowLeftOutlined, SendOutlined, UserOutlined, FileTextOutlined, InfoCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { ethers } from 'ethers';
import { useWallet } from '@/ui/utils';
import { SWAGTIX_COLORS } from '@/ui/utils/theme';
import nftTicketsService from '@/background/service/nftTickets';
import { CHAINS } from '@/constant/networks.pulsechain';
import eventTicketABI from '@/constant/abi/EventTicket1155.json';

const { Step } = Steps;
const { Option } = Select;

// Interfaces for ticket data
interface TicketMetadata {
  name: string;
  description: string;
  image: string;
  eventName?: string;
  eventDate?: number;
  venue?: string;
  ticketType?: string;
  seatInfo?: string;
  organizer?: string;
  terms?: string;
}

interface Ticket {
  tokenId: string;
  balance: number;
  metadata: TicketMetadata;
  contractInfo?: {
    eventTimestamp: number;
    qrCodeUri: string;
    mediaUri: string;
  };
}

// Styled components
const Container = styled.div`
  padding: 24px;
  max-width: 600px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 24px;
`;

const BackButton = styled(Button)`
  margin-right: 16px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 0;
`;

const StepsContainer = styled.div`
  margin-bottom: 32px;
`;

const FormContainer = styled.div`
  margin-top: 24px;
`;

const TicketCardStyled = styled(Card)`
  margin-bottom: 16px;
  border-radius: 12px;
  
  .ant-card-body {
    padding: 16px;
  }
`;

const TicketImage = styled.img`
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const TicketInfo = styled.div`
  margin-bottom: 16px;
`;

const TicketName = styled.h3`
  font-size: 18px;
  margin-bottom: 8px;
`;

const TicketDetail = styled.p`
  margin-bottom: 4px;
  color: rgba(0, 0, 0, 0.65);
`;

const InfoBox = styled.div`
  background-color: rgba(123, 91, 255, 0.1);
  border-left: 4px solid ${SWAGTIX_COLORS.PURPLE};
  padding: 12px 16px;
  margin-bottom: 24px;
  border-radius: 4px;
`;

const SubmitButton = styled(Button)`
  background: linear-gradient(to right, ${SWAGTIX_COLORS.PURPLE}, ${SWAGTIX_COLORS.PINK});
  border: none;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  width: 100%;
  
  &:hover, &:focus {
    background: linear-gradient(to right, ${SWAGTIX_COLORS.BLUE}, ${SWAGTIX_COLORS.PURPLE});
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
`;

const GasEstimateBox = styled.div`
  background-color: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 12px;
  margin-top: 16px;
  font-size: 14px;
`;

const TransferTicket: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const wallet = useWallet();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [managementWallet, setManagementWallet] = useState<string>('');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<number>(1);
  const [walletBalance, setWalletBalance] = useState<string>('0.0');
  const [estimatedGas, setEstimatedGas] = useState<string>('0.0');
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Fetch user's wallet address and balance
  useEffect(() => {
    const fetchWalletInfo = async () => {
      try {
        const account = await wallet.getCurrentAccount();
        if (account?.address) {
          setManagementWallet(account.address);
          const balance = await wallet.getBalance(account.address);
          setWalletBalance(ethers.utils.formatEther(balance));
        }
      } catch (error) {
        console.error('Error fetching wallet info:', error);
        message.error(t('Failed to load wallet information.'));
      }
    };
    fetchWalletInfo();
  }, [wallet, t]);

  // Fetch user's tickets
  useEffect(() => {
    const fetchUserTickets = async () => {
      setLoading(true);
      try {
        const account = await wallet.getCurrentAccount();
        if (!account?.address) {
          message.error(t('No account found to fetch tickets.'));
          setLoading(false);
          return;
        }
        
        const tickets = await nftTicketsService.getTicketsByOwner(account.address);
        setUserTickets(tickets);

        // If a tokenId is passed in the URL, pre-select it
        const query = new URLSearchParams(location.search);
        const tokenIdFromUrl = query.get('tokenId');
        if (tokenIdFromUrl) {
          const preSelected = tickets.find(t => t.tokenId === tokenIdFromUrl);
          if (preSelected) {
            setSelectedTicket(preSelected);
            setTransferAmount(1); // Default to 1 ticket
          } else {
            message.warn(t('Pre-selected ticket not found or not owned.'));
          }
        }
      } catch (error) {
        console.error('Error fetching user tickets:', error);
        message.error(t('Failed to load your tickets.'));
      } finally {
        setLoading(false);
      }
    };
    fetchUserTickets();
  }, [wallet, location.search, t]);

  // Estimate gas when ticket or amount changes
  useEffect(() => {
    const estimateGas = async () => {
      if (selectedTicket && recipientAddress) {
        try {
          const gasEstimate = await nftTicketsService.estimateTransferGas(
            managementWallet,
            recipientAddress,
            selectedTicket.tokenId,
            transferAmount
          );
          setEstimatedGas(ethers.utils.formatEther(gasEstimate));
        } catch (error) {
          console.error('Error estimating gas:', error);
          setEstimatedGas('0.0');
        }
      }
    };
    
    if (selectedTicket && recipientAddress) {
      estimateGas();
    }
  }, [selectedTicket, recipientAddress, transferAmount, managementWallet]);

  // Format date from timestamp
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString();
  };
  
  // Format time from timestamp
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp * 1000).toLocaleTimeString();
  };

  // Handle ticket selection
  const handleTicketSelect = (tokenId: string) => {
    const ticket = userTickets.find(t => t.tokenId === tokenId);
    setSelectedTicket(ticket || null);
    if (ticket) {
      // Set default transfer amount to 1 or max if less than 1
      setTransferAmount(Math.min(1, ticket.balance));
    }
  };

  // Handle amount change
  const handleAmountChange = (value: number) => {
    if (selectedTicket && value > 0 && value <= selectedTicket.balance) {
      setTransferAmount(value);
    }
  };

  // Handle recipient address change
  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipientAddress(e.target.value);
  };

  // Validate Ethereum address
  const isValidEthereumAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // Handle next step
  const handleNextStep = () => {
    // Validate current step
    if (currentStep === 0) {
      if (!selectedTicket) {
        message.error(t('Please select a ticket to transfer.'));
        return;
      }
      
      if (!isValidEthereumAddress(recipientAddress)) {
        message.error(t('Please enter a valid recipient address.'));
        return;
      }
      
      if (!transferAmount || transferAmount <= 0 || (selectedTicket && transferAmount > selectedTicket.balance)) {
        message.error(t('Please enter a valid transfer amount.'));
        return;
      }
    }
    
    setCurrentStep(currentStep + 1);
  };

  // Handle transfer confirmation
  const handleConfirmTransfer = async () => {
    if (!selectedTicket) {
      message.error(t('No ticket selected for transfer.'));
      return;
    }
    
    setTransferring(true);
    setError('');
    
    try {
      const txHash = await nftTicketsService.transferTicket(
        managementWallet,
        recipientAddress,
        selectedTicket.tokenId,
        transferAmount
      );
      
      setTransactionHash(txHash);
      setTransferSuccess(true);
      
      // Refresh ticket list after successful transfer
      const updatedTickets = await nftTicketsService.getTicketsByOwner(managementWallet);
      setUserTickets(updatedTickets);
      
    } catch (error: any) {
      console.error('Error during transfer:', error);
      setError(error.message || t('Transfer failed. Please try again.'));
    } finally {
      setTransferring(false);
    }
  };

  // Handle back button
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      history.goBack();
    }
  };

  // Handle success modal close
  const handleSuccessModalClose = () => {
    setTransferSuccess(false);
    history.push('/nft-tickets'); // Go back to My Tickets
  };

  // Show loading state
  if (loading) {
    return (
      <LoadingContainer>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>{t('Loading tickets and wallet info...')}</p>
      </LoadingContainer>
    );
  }

  // Render steps
  const steps = [
    {
      title: t('Select Ticket'),
      icon: <FileTextOutlined />
    },
    {
      title: t('Confirm Transfer'),
      icon: <SendOutlined />
    }
  ];

  return (
    <Container>
      <Header>
        <BackButton 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
        />
        <Title>{t('Transfer Ticket')}</Title>
      </Header>
      
      <StepsContainer>
        <Steps current={currentStep}>
          {steps.map(step => (
            <Step key={step.title} title={step.title} icon={step.icon} />
          ))}
        </Steps>
      </StepsContainer>
      
      {currentStep === 0 && (
        <FormContainer>
          <Form layout="vertical">
            <Form.Item 
              label={t('Select Ticket')}
              required
              validateStatus={!selectedTicket ? 'error' : ''}
              help={!selectedTicket ? t('Please select a ticket') : ''}
            >
              <Select
                placeholder={t('Choose a ticket to transfer')}
                onChange={handleTicketSelect}
                value={selectedTicket?.tokenId}
                style={{ width: '100%' }}
                size="large"
                showSearch
                optionFilterProp="children"
              >
                {userTickets.map(ticket => (
                  <Option key={ticket.tokenId} value={ticket.tokenId}>
                    {ticket.metadata.eventName || ticket.metadata.name} (ID: {ticket.tokenId}, Qty: {ticket.balance})
                  </Option>
                ))}
              </Select>
            </Form.Item>
            
            {selectedTicket && (
              <TicketCardStyled>
                <TicketImage
                  src={selectedTicket.metadata.image}
                  alt={selectedTicket.metadata.name}
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.src = '/images/ticket-placeholder.png';
                  }}
                />
                <TicketInfo>
                  <TicketName>{selectedTicket.metadata.eventName || selectedTicket.metadata.name}</TicketName>
                  {selectedTicket.contractInfo?.eventTimestamp && (
                    <TicketDetail>
                      <strong>{t('Event Date')}:</strong> {formatDate(selectedTicket.contractInfo.eventTimestamp)} {formatTime(selectedTicket.contractInfo.eventTimestamp)}
                    </TicketDetail>
                  )}
                  {selectedTicket.metadata.venue && (
                    <TicketDetail>
                      <strong>{t('Venue')}:</strong> {selectedTicket.metadata.venue}
                    </TicketDetail>
                  )}
                  <TicketDetail>
                    <strong>{t('Ticket ID')}:</strong> {selectedTicket.tokenId}
                  </TicketDetail>
                  <TicketDetail>
                    <strong>{t('Available Quantity')}:</strong> {selectedTicket.balance}
                  </TicketDetail>
                </TicketInfo>
              </TicketCardStyled>
            )}
            
            <Form.Item 
              label={t('Recipient Address')}
              required
              validateStatus={recipientAddress && !isValidEthereumAddress(recipientAddress) ? 'error' : ''}
              help={recipientAddress && !isValidEthereumAddress(recipientAddress) ? t('Invalid Ethereum address') : ''}
            >
              <Input
                placeholder="0x..."
                value={recipientAddress}
                onChange={handleRecipientChange}
                size="large"
                prefix={<UserOutlined />}
              />
            </Form.Item>
            
            <Form.Item 
              label={t('Transfer Amount')}
              required
              validateStatus={
                !transferAmount || 
                transferAmount <= 0 || 
                (selectedTicket && transferAmount > selectedTicket.balance) ? 'error' : ''
              }
              help={
                !transferAmount ? t('Please enter an amount') :
                transferAmount <= 0 ? t('Amount must be positive') :
                (selectedTicket && transferAmount > selectedTicket.balance) ? t('Amount exceeds available balance') : ''
              }
            >
              <Input
                type="number"
                min={1}
                max={selectedTicket?.balance || 1}
                value={transferAmount}
                onChange={e => handleAmountChange(parseInt(e.target.value) || 0)}
                size="large"
                suffix={
                  <Tooltip title={t('Maximum available: {balance}', { balance: selectedTicket?.balance || 0 })}>
                    <InfoCircleOutlined style={{ color: 'rgba(0,0,0,.45)' }} />
                  </Tooltip>
                }
              />
            </Form.Item>
            
            {selectedTicket && recipientAddress && isValidEthereumAddress(recipientAddress) && (
              <GasEstimateBox>
                <p><strong>{t('Estimated Gas')}:</strong> {estimatedGas} PLS</p>
                <p><strong>{t('Wallet Balance')}:</strong> {walletBalance} PLS</p>
              </GasEstimateBox>
            )}
            
            <SubmitButton
              type="primary"
              onClick={handleNextStep}
              disabled={
                !selectedTicket || 
                !recipientAddress || 
                !isValidEthereumAddress(recipientAddress) ||
                !transferAmount || 
                transferAmount <= 0 || 
                (selectedTicket && transferAmount > selectedTicket.balance)
              }
            >
              {t('Next')}
            </SubmitButton>
          </Form>
        </FormContainer>
      )}
      
      {currentStep === 1 && (
        <FormContainer>
          <InfoBox>
            <p>{t('You are about to transfer tickets from your wallet. Please review the details below carefully.')}</p>
          </InfoBox>
          
          <TicketCardStyled>
            <TicketInfo>
              <TicketName>{selectedTicket?.metadata.eventName || selectedTicket?.metadata.name}</TicketName>
              <TicketDetail>
                <strong>{t('From')}:</strong> {managementWallet}
              </TicketDetail>
              <TicketDetail>
                <strong>{t('To')}:</strong> {recipientAddress}
              </TicketDetail>
              <TicketDetail>
                <strong>{t('Ticket ID')}:</strong> {selectedTicket?.tokenId}
              </TicketDetail>
              <TicketDetail>
                <strong>{t('Amount')}:</strong> {transferAmount}
              </TicketDetail>
              <TicketDetail>
                <strong>{t('Estimated Gas')}:</strong> {estimatedGas} PLS
              </TicketDetail>
            </TicketInfo>
          </TicketCardStyled>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <Button 
              onClick={handleBack}
              disabled={transferring}
              style={{ flex: 1 }}
            >
              {t('Back')}
            </Button>
            <SubmitButton
              type="primary"
              onClick={handleConfirmTransfer}
              loading={transferring}
              style={{ flex: 1 }}
            >
              {transferring ? t('Transferring...') : t('Confirm Transfer')}
            </SubmitButton>
          </div>
          
          {error && (
            <div style={{ marginTop: '16px', color: '#ff4d4f', textAlign: 'center' }}>
              <ExclamationCircleOutlined style={{ marginRight: '8px' }} />
              {error}
            </div>
          )}
        </FormContainer>
      )}
      
      <Modal
        title={t('Transfer Successful')}
        visible={transferSuccess}
        onCancel={handleSuccessModalClose}
        footer={[
          <Button key="back" onClick={handleSuccessModalClose}>
            {t('Back to My Tickets')}
          </Button>
        ]}
      >
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 24 }} />
          <h3>{t('Your tickets have been transferred successfully!')}</h3>
          <p>{t('Transaction Hash')}: {transactionHash.substring(0, 10)}...{transactionHash.substring(transactionHash.length - 8)}</p>
          <p>
            <a 
              href={`${CHAINS.pulsechain.blockExplorerURL}/tx/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('View on Explorer')}
            </a>
          </p>
        </div>
      </Modal>
    </Container>
  );
};

export default TransferTicket;
