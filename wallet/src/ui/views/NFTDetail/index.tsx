import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { 
  Button, 
  Card, 
  Descriptions, 
  Tag, 
  Divider, 
  Modal, 
  message, 
  Spin, 
  Tooltip,
  Typography
} from 'antd';
import { 
  ArrowLeftOutlined, 
  QrcodeOutlined, 
  ShareAltOutlined, 
  InfoCircleOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  TeamOutlined,
  ClockOutlined
} from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useWallet } from '@/ui/utils';
import { SWAGTIX_COLORS, getTicketStyle, useTheme } from '@/ui/utils/theme';
import { ethers } from 'ethers';
import { CHAINS } from '@/constant/networks.pulsechain';
import eventTicketABI from '@/constant/abi/EventTicket1155.json';

// Contract address for the EventTicket1155 contract
const EVENT_TICKET_CONTRACT = process.env.EVENT_TICKET_CONTRACT || '0x0000000000000000000000000000000000000000';

const { Title, Paragraph, Text } = Typography;

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

const HeaderTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 0;
`;

const TicketImageContainer = styled.div`
  position: relative;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const TicketImage = styled.img`
  width: 100%;
  height: auto;
  display: block;
`;

const EventDateBadge = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  background: linear-gradient(to right, ${SWAGTIX_COLORS.PURPLE}, ${SWAGTIX_COLORS.PINK});
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

const TicketStatus = styled(Tag)<{ status: 'upcoming' | 'today' | 'past' }>`
  margin: 0;
  font-size: 14px;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 500;
  border: none;
  
  ${props => props.status === 'upcoming' && `
    background-color: #e6f7ff;
    color: #1890ff;
  `}
  
  ${props => props.status === 'today' && `
    background-color: #fff7e6;
    color: #fa8c16;
  `}
  
  ${props => props.status === 'past' && `
    background-color: #f5f5f5;
    color: #8c8c8c;
  `}
`;

const TicketInfoCard = styled(Card)`
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const EventTitle = styled(Title)`
  margin-bottom: 8px !important;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
  
  .anticon {
    font-size: 18px;
    margin-right: 12px;
    margin-top: 2px;
    color: ${SWAGTIX_COLORS.PURPLE};
  }
`;

const InfoContent = styled.div`
  flex: 1;
`;

const InfoLabel = styled.div`
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
  margin-bottom: 4px;
`;

const InfoValue = styled.div`
  font-size: 16px;
  font-weight: 500;
`;

const ActionButton = styled(Button)`
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
`;

const PrimaryButton = styled(ActionButton)`
  background: linear-gradient(to right, ${SWAGTIX_COLORS.PURPLE}, ${SWAGTIX_COLORS.PINK});
  border: none;
  
  &:hover, &:focus {
    background: linear-gradient(to right, ${SWAGTIX_COLORS.BLUE}, ${SWAGTIX_COLORS.PURPLE});
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const ActionGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
`;

const QRContainer = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const AdditionalInfoCard = styled(Card)`
  margin-bottom: 24px;
  border-radius: 12px;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 0;
`;

interface RouteParams {
  id: string;
}

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
  qrData: string;
}

const NFTDetail: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { id } = useParams<RouteParams>();
  const wallet = useWallet();
  const { isDark } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  
  // Fetch ticket details
  useEffect(() => {
    const fetchTicketDetails = async () => {
      setLoading(true);
      try {
        const currentAccount = await wallet.getCurrentAccount();
        if (!currentAccount?.address) {
          message.error(t('No account found'));
          return;
        }
        
        const provider = await wallet.getProvider(CHAINS.PULSE);
        const contract = new ethers.Contract(EVENT_TICKET_CONTRACT, eventTicketABI, provider);
        
        const tokenId = id;
        const balance = await contract.balanceOf(currentAccount.address, tokenId);
        
        if (balance.gt(0)) {
          const uri = await contract.uri(tokenId);
          let metadata: TicketMetadata = {
            name: `Ticket #${tokenId}`,
            description: '',
            image: 'https://via.placeholder.com/600x400?text=Event+Image',
            eventName: 'Sample Event',
            eventDate: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days from now
            venue: 'Sample Venue, City',
            ticketType: 'General Admission',
            seatInfo: 'Section A, Row 3, Seat 12',
            organizer: 'SwagTix Events',
            terms: 'Standard terms and conditions apply. No refunds or exchanges.'
          };
          
          // Parse metadata from URI (simplified)
          if (uri.startsWith('data:application/json')) {
            const json = decodeURIComponent(uri.split(',')[1]);
            metadata = { ...metadata, ...JSON.parse(json) };
          }
          
          // Generate QR code data
          const qrData = JSON.stringify({
            address: currentAccount.address,
            tokenId,
            timestamp: Date.now(),
            type: 'swagtix-ticket'
          });
          
          setTicket({
            tokenId,
            balance: balance.toNumber(),
            metadata,
            qrData
          });
        } else {
          message.error(t('You don\'t own this ticket'));
          history.push('/');
        }
      } catch (error) {
        console.error('Error fetching ticket details:', error);
        message.error(t('Failed to load ticket details'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchTicketDetails();
  }, [id, wallet, history, t]);
  
  // Handle back button
  const handleBack = () => {
    history.goBack();
  };
  
  // Handle show QR code
  const handleShowQR = () => {
    setQrModalVisible(true);
  };
  
  // Handle transfer ticket
  const handleTransfer = () => {
    history.push(`/transfer-ticket?tokenId=${id}`);
  };
  
  // Format date from timestamp
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'TBD';
    return new Date(timestamp * 1000).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Format time from timestamp
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp * 1000).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get ticket status based on event date
  const getTicketStatus = (eventDate?: number) => {
    if (!eventDate) return 'upcoming';
    
    const now = Math.floor(Date.now() / 1000);
    
    if (eventDate > now) {
      return 'upcoming';
    } else if (eventDate > now - 86400) { // Within 24 hours
      return 'today';
    } else {
      return 'past';
    }
  };
  
  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'upcoming':
        return t('Upcoming');
      case 'today':
        return t('Today');
      case 'past':
        return t('Past Event');
      default:
        return '';
    }
  };
  
  if (loading) {
    return (
      <Container>
        <Header>
          <BackButton icon={<ArrowLeftOutlined />} onClick={handleBack} />
          <HeaderTitle>{t('Ticket Details')}</HeaderTitle>
        </Header>
        <LoadingContainer>
          <Spin size="large" />
          <p style={{ marginTop: 16 }}>{t('Loading ticket information...')}</p>
        </LoadingContainer>
      </Container>
    );
  }
  
  if (!ticket) {
    return (
      <Container>
        <Header>
          <BackButton icon={<ArrowLeftOutlined />} onClick={handleBack} />
          <HeaderTitle>{t('Ticket Details')}</HeaderTitle>
        </Header>
        <Card>
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <InfoCircleOutlined style={{ fontSize: 48, color: '#f5222d', marginBottom: 16 }} />
            <h3>{t('Ticket Not Found')}</h3>
            <p>{t('This ticket does not exist or you do not have access to it.')}</p>
            <Button type="primary" onClick={() => history.push('/')}>
              {t('Back to My Tickets')}
            </Button>
          </div>
        </Card>
      </Container>
    );
  }
  
  const ticketStatus = getTicketStatus(ticket.metadata.eventDate);
  
  return (
    <Container>
      <Header>
        <BackButton icon={<ArrowLeftOutlined />} onClick={handleBack} />
        <HeaderTitle>{t('Ticket Details')}</HeaderTitle>
      </Header>
      
      {/* Ticket Image */}
      <TicketImageContainer>
        <TicketImage 
          src={ticket.metadata.image} 
          alt={ticket.metadata.eventName || ticket.metadata.name}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=Event+Image';
          }}
        />
        {ticket.metadata.eventDate && (
          <EventDateBadge>
            {formatDate(ticket.metadata.eventDate)}
          </EventDateBadge>
        )}
      </TicketImageContainer>
      
      {/* Ticket Info */}
      <TicketInfoCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <EventTitle level={3}>
            {ticket.metadata.eventName || ticket.metadata.name}
          </EventTitle>
          <TicketStatus status={ticketStatus as 'upcoming' | 'today' | 'past'}>
            {getStatusLabel(ticketStatus)}
          </TicketStatus>
        </div>
        
        <InfoItem>
          <CalendarOutlined />
          <InfoContent>
            <InfoLabel>{t('Date & Time')}</InfoLabel>
            <InfoValue>
              {formatDate(ticket.metadata.eventDate)}
              {ticket.metadata.eventDate && ` at ${formatTime(ticket.metadata.eventDate)}`}
            </InfoValue>
          </InfoContent>
        </InfoItem>
        
        <InfoItem>
          <EnvironmentOutlined />
          <InfoContent>
            <InfoLabel>{t('Venue')}</InfoLabel>
            <InfoValue>{ticket.metadata.venue || t('TBD')}</InfoValue>
          </InfoContent>
        </InfoItem>
        
        {ticket.metadata.ticketType && (
          <InfoItem>
            <TicketImage />
            <InfoContent>
              <InfoLabel>{t('Ticket Type')}</InfoLabel>
              <InfoValue>{ticket.metadata.ticketType}</InfoValue>
            </InfoContent>
          </InfoItem>
        )}
        
        {ticket.metadata.seatInfo && (
          <InfoItem>
            <TeamOutlined />
            <InfoContent>
              <InfoLabel>{t('Seat Information')}</InfoLabel>
              <InfoValue>{ticket.metadata.seatInfo}</InfoValue>
            </InfoContent>
          </InfoItem>
        )}
        
        {ticket.metadata.organizer && (
          <InfoItem>
            <InfoCircleOutlined />
            <InfoContent>
              <InfoLabel>{t('Organizer')}</InfoLabel>
              <InfoValue>{ticket.metadata.organizer}</InfoValue>
            </InfoContent>
          </InfoItem>
        )}
        
        <Divider />
        
        <Paragraph>
          {ticket.metadata.description || t('No additional information provided for this event.')}
        </Paragraph>
        
        {ticket.metadata.terms && (
          <Button 
            type="link" 
            onClick={() => setTermsModalVisible(true)}
            style={{ padding: 0 }}
          >
            {t('View Terms & Conditions')}
          </Button>
        )}
      </TicketInfoCard>
      
      {/* Action Buttons */}
      <ActionGroup>
        <PrimaryButton 
          icon={<QrcodeOutlined />}
          onClick={handleShowQR}
        >
          {t('Show Ticket')}
        </PrimaryButton>
        
        <ActionButton 
          icon={<ShareAltOutlined />}
          onClick={handleTransfer}
        >
          {t('Transfer')}
        </ActionButton>
      </ActionGroup>
      
      {/* Additional Info */}
      <AdditionalInfoCard title={t('Ticket Information')}>
        <Descriptions column={1}>
          <Descriptions.Item label={t('Ticket ID')}>#{ticket.tokenId}</Descriptions.Item>
          <Descriptions.Item label={t('Quantity')}>{ticket.balance}</Descriptions.Item>
          <Descriptions.Item label={t('Transferable')}>
            {ticketStatus !== 'past' ? t('Yes') : t('No (Event Passed)')}
          </Descriptions.Item>
        </Descriptions>
      </AdditionalInfoCard>
      
      {/* QR Code Modal */}
      <Modal
        visible={qrModalVisible}
        title={t('Your Ticket')}
        onCancel={() => setQrModalVisible(false)}
        footer={[
          <Button 
            key="close" 
            type="primary" 
            onClick={() => setQrModalVisible(false)}
          >
            {t('Close')}
          </Button>
        ]}
        centered
        width={350}
      >
        <QRContainer>
          <QRCodeSVG
            value={ticket.qrData}
            size={250}
            level="H"
            includeMargin
          />
          <Divider style={{ margin: '16px 0' }} />
          <Title level={4} style={{ margin: '0 0 8px 0', textAlign: 'center' }}>
            {ticket.metadata.eventName || ticket.metadata.name}
          </Title>
          <Text type="secondary" style={{ textAlign: 'center', display: 'block', marginBottom: 8 }}>
            {formatDate(ticket.metadata.eventDate)}
          </Text>
          {ticket.metadata.seatInfo && (
            <Tag color={SWAGTIX_COLORS.PURPLE} style={{ margin: '8px 0' }}>
              {ticket.metadata.seatInfo}
            </Tag>
          )}
          <Text type="secondary" style={{ fontSize: 12, marginTop: 16, textAlign: 'center' }}>
            {t('Present this QR code at the venue for entry')}
          </Text>
        </QRContainer>
      </Modal>
      
      {/* Terms & Conditions Modal */}
      <Modal
        visible={termsModalVisible}
        title={t('Terms & Conditions')}
        onCancel={() => setTermsModalVisible(false)}
        footer={[
          <Button 
            key="close" 
            type="primary" 
            onClick={() => setTermsModalVisible(false)}
          >
            {t('Close')}
          </Button>
        ]}
        centered
      >
        <div style={{ maxHeight: '60vh', overflow: 'auto', padding: '0 4px' }}>
          <Paragraph>
            {ticket.metadata.terms || t('No terms and conditions provided for this event.')}
          </Paragraph>
        </div>
      </Modal>
    </Container>
  );
};

export default NFTDetail;
