import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Form, Input, Button, Select, message, Steps, Card, Modal, Spin } from 'antd';
import { ArrowLeftOutlined, SendOutlined, UserOutlined, TicketOutlined, InfoCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { ethers } from 'ethers';
import { useWallet } from '@/ui/utils';
import { SWAGTIX_COLORS, getTicketStyle } from '@/ui/utils/theme';
import eventTicketABI from '@/constant/abi/EventTicket1155.json';
import { CHAINS } from '@/constant/networks.pulsechain';

// Contract address for the EventTicket1155 contract
const EVENT_TICKET_CONTRACT = process.env.EVENT_TICKET_CONTRACT || '0x0000000000000000000000000000000000000000';

const { Step } = Steps;
const { Option } = Select;

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

const TicketCard = styled(Card)`
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

interface Ticket {
  tokenId: string;
  balance: number;
  metadata: {
    name: string;
    description: string;
    image: string;
    eventName?: string;
    eventDate?: number;
    venue?: string;
  };
}

const TransferTicket: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const wallet = useWallet();
  const [form] = Form.useForm();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [transferSuccess, setTransferSuccess] = useState(false);
  
  // Parse tokenId from query params if available
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const tokenId = query.get('tokenId');
    
    if (tokenId) {
      form.setFieldsValue({ tokenId });
      fetchTicketDetails(tokenId);
    } else {
      fetchUserTickets();
    }
  }, [location, form]);
  
  // Fetch all user tickets
  const fetchUserTickets = async () => {
    setLoading(true);
    try {
      const currentAccount = await wallet.getCurrentAccount();
      if (!currentAccount?.address) {
        message.error(t('No account found'));
        return;
      }
      
      const provider = await wallet.getProvider(CHAINS.PULSE);
      const contract = new ethers.Contract(EVENT_TICKET_CONTRACT, eventTicketABI, provider);
      
      const ticketsArray: Ticket[] = [];
      
      // Check first 20 token IDs (simplified for placeholder)
      for (let tokenId = 1; tokenId <= 20; tokenId++) {
        try {
          const balance = await contract.balanceOf(currentAccount.address, tokenId);
          
          if (balance.gt(0)) {
            const uri = await contract.uri(tokenId);
            let metadata = {
              name: `Ticket #${tokenId}`,
              description: '',
              image: 'https://via.placeholder.com/300x180?text=Ticket+Image'
            };
            
            // Parse metadata from URI (simplified)
            if (uri.startsWith('data:application/json')) {
              const json = decodeURIComponent(uri.split(',')[1]);
              metadata = JSON.parse(json);
            }
            
            ticketsArray.push({
              tokenId: tokenId.toString(),
              balance: balance.toNumber(),
              metadata
            });
          }
        } catch (err) {
          console.error(`Error fetching token ${tokenId}:`, err);
        }
      }
      
      setTickets(ticketsArray);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      message.error(t('Failed to load your tickets'));
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch details for a specific ticket
  const fetchTicketDetails = async (tokenId: string) => {
    setLoading(true);
    try {
      const currentAccount = await wallet.getCurrentAccount();
      if (!currentAccount?.address) {
        message.error(t('No account found'));
        return;
      }
      
      const provider = await wallet.getProvider(CHAINS.PULSE);
      const contract = new ethers.Contract(EVENT_TICKET_CONTRACT, eventTicketABI, provider);
      
      const balance = await contract.balanceOf(currentAccount.address, tokenId);
      
      if (balance.gt(0)) {
        const uri = await contract.uri(tokenId);
        let metadata = {
          name: `Ticket #${tokenId}`,
          description: '',
          image: 'https://via.placeholder.com/300x180?text=Ticket+Image'
        };
        
        // Parse metadata from URI (simplified)
        if (uri.startsWith('data:application/json')) {
          const json = decodeURIComponent(uri.split(',')[1]);
          metadata = JSON.parse(json);
        }
        
        const ticket = {
          tokenId,
          balance: balance.toNumber(),
          metadata
        };
        
        setSelectedTicket(ticket);
        setTickets([ticket]);
      } else {
        message.error(t('You don\'t own this ticket'));
        history.push('/');
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      message.error(t('Failed to load ticket details'));
      history.push('/');
    } finally {
      setLoading(false);
    }
  };
  
  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString();
  };
  
  // Handle ticket selection
  const handleTicketSelect = (tokenId: string) => {
    const ticket = tickets.find(t => t.tokenId === tokenId);
    setSelectedTicket(ticket || null);
  };
  
  // Handle form submission for recipient
  const handleRecipientSubmit = (values: { recipient: string }) => {
    if (!selectedTicket) {
      message.error(t('Please select a ticket first'));
      return;
    }
    
    // Move to confirmation step
    setCurrentStep(1);
  };
  
  // Handle transfer confirmation
  const handleConfirmTransfer = async () => {
    if (!selectedTicket) {
      message.error(t('No ticket selected'));
      return;
    }
    
    const values = form.getFieldsValue();
    const { recipient, quantity = 1 } = values;
    
    setTransferring(true);
    
    try {
      // This is a placeholder - in a real implementation, we would:
      // 1. Validate the recipient address
      // 2. Connect to the contract
      // 3. Call safeTransferFrom to transfer the ticket
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message
      setTransferSuccess(true);
      
      // In a real implementation, we would refresh the user's tickets here
    } catch (error) {
      console.error('Error transferring ticket:', error);
      message.error(t('Failed to transfer ticket'));
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
  const handleSuccessClose = () => {
    history.push('/');
  };
  
  // Render loading state
  if (loading) {
    return (
      <Container>
        <Header>
          <BackButton icon={<ArrowLeftOutlined />} onClick={handleBack} />
          <Title>{t('Transfer Ticket')}</Title>
        </Header>
        <LoadingContainer>
          <Spin size="large" />
          <p style={{ marginTop: 16 }}>{t('Loading ticket information...')}</p>
        </LoadingContainer>
      </Container>
    );
  }
  
  // Render success modal
  const renderSuccessModal = () => (
    <Modal
      visible={transferSuccess}
      title={t('Transfer Complete!')}
      onCancel={handleSuccessClose}
      footer={[
        <Button key="back" type="primary" onClick={handleSuccessClose}>
          {t('Back to My Tickets')}
        </Button>,
      ]}
      centered
    >
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ fontSize: 64, color: SWAGTIX_COLORS.PURPLE, marginBottom: 16 }}>
          ✓
        </div>
        <h3>{t('Your ticket has been sent')}</h3>
        <p>{t('The recipient can now access this ticket in their account.')}</p>
      </div>
    </Modal>
  );
  
  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Select ticket and recipient
        return (
          <FormContainer>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleRecipientSubmit}
            >
              {tickets.length > 1 && (
                <Form.Item
                  name="tokenId"
                  label={t('Select Ticket')}
                  rules={[{ required: true, message: t('Please select a ticket') }]}
                >
                  <Select 
                    placeholder={t('Choose a ticket')}
                    onChange={handleTicketSelect}
                    size="large"
                  >
                    {tickets.map(ticket => (
                      <Option key={ticket.tokenId} value={ticket.tokenId}>
                        {ticket.metadata.eventName || ticket.metadata.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              )}
              
              {selectedTicket && (
                <TicketCard>
                  <TicketImage 
                    src={selectedTicket.metadata.image} 
                    alt={selectedTicket.metadata.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x180?text=Ticket+Image';
                    }}
                  />
                  <TicketInfo>
                    <TicketName>
                      {selectedTicket.metadata.eventName || selectedTicket.metadata.name}
                    </TicketName>
                    {selectedTicket.metadata.eventDate && (
                      <TicketDetail>
                        <strong>{t('Date')}:</strong> {formatDate(selectedTicket.metadata.eventDate)}
                      </TicketDetail>
                    )}
                    {selectedTicket.metadata.venue && (
                      <TicketDetail>
                        <strong>{t('Venue')}:</strong> {selectedTicket.metadata.venue}
                      </TicketDetail>
                    )}
                    <TicketDetail>
                      <strong>{t('Quantity')}:</strong> {selectedTicket.balance}
                    </TicketDetail>
                  </TicketInfo>
                </TicketCard>
              )}
              
              {selectedTicket && selectedTicket.balance > 1 && (
                <Form.Item
                  name="quantity"
                  label={t('Quantity to Transfer')}
                  initialValue={1}
                  rules={[
                    { required: true, message: t('Please enter quantity') },
                    { 
                      type: 'number', 
                      min: 1, 
                      max: selectedTicket.balance, 
                      message: t('Invalid quantity') 
                    }
                  ]}
                >
                  <Select size="large">
                    {Array.from({ length: selectedTicket.balance }, (_, i) => i + 1).map(num => (
                      <Option key={num} value={num}>{num}</Option>
                    ))}
                  </Select>
                </Form.Item>
              )}
              
              <Form.Item
                name="recipient"
                label={t('Recipient')}
                rules={[
                  { required: true, message: t('Please enter recipient address or email') },
                ]}
                tooltip={t('Enter the recipient\'s account ID or email address')}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder={t('Address or Email')}
                  size="large"
                />
              </Form.Item>
              
              <InfoBox>
                <InfoCircleOutlined style={{ marginRight: 8 }} />
                {t('Make sure you\'re sending this ticket to the right person. Transfers cannot be undone.')}
              </InfoBox>
              
              <SubmitButton 
                type="primary" 
                htmlType="submit"
                icon={<SendOutlined />}
              >
                {t('Continue')}
              </SubmitButton>
            </Form>
          </FormContainer>
        );
        
      case 1: // Confirmation
        return (
          <FormContainer>
            <h3>{t('Confirm Transfer')}</h3>
            
            {selectedTicket && (
              <TicketCard>
                <TicketInfo>
                  <TicketName>
                    {selectedTicket.metadata.eventName || selectedTicket.metadata.name}
                  </TicketName>
                  {selectedTicket.metadata.eventDate && (
                    <TicketDetail>
                      <strong>{t('Date')}:</strong> {formatDate(selectedTicket.metadata.eventDate)}
                    </TicketDetail>
                  )}
                  <TicketDetail>
                    <strong>{t('Quantity')}:</strong> {form.getFieldValue('quantity') || 1}
                  </TicketDetail>
                  <TicketDetail>
                    <strong>{t('Recipient')}:</strong> {form.getFieldValue('recipient')}
                  </TicketDetail>
                </TicketInfo>
              </TicketCard>
            )}
            
            <InfoBox>
              <InfoCircleOutlined style={{ marginRight: 8 }} />
              {t('This action cannot be undone. The recipient will receive this ticket in their account.')}
            </InfoBox>
            
            <div style={{ display: 'flex', gap: 16 }}>
              <Button 
                onClick={handleBack} 
                style={{ flex: 1 }}
                size="large"
                disabled={transferring}
              >
                {t('Back')}
              </Button>
              <SubmitButton 
                type="primary"
                onClick={handleConfirmTransfer}
                loading={transferring}
                disabled={transferring}
                style={{ flex: 2 }}
              >
                {transferring ? t('Transferring...') : t('Confirm Transfer')}
              </SubmitButton>
            </div>
          </FormContainer>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Container>
      <Header>
        <BackButton icon={<ArrowLeftOutlined />} onClick={handleBack} />
        <Title>{t('Transfer Ticket')}</Title>
      </Header>
      
      <StepsContainer>
        <Steps current={currentStep} size="small">
          <Step title={t('Details')} icon={<TicketOutlined />} />
          <Step title={t('Confirm')} icon={<SendOutlined />} />
        </Steps>
      </StepsContainer>
      
      {renderStepContent()}
      {renderSuccessModal()}
    </Container>
  );
};

export default TransferTicket;
