import React, { useEffect, useState, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { ethers } from 'ethers';
import { useWallet } from '@/ui/utils';
import { Button, Skeleton, Empty, Modal, Tooltip } from 'antd';
import { QRCodeSVG } from 'qrcode.react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import { CHAINS } from '@/constant/networks.pulsechain';
import IconArrowRight from '@/ui/assets/arrow-right-gray.svg';
import IconRefresh from '@/ui/assets/refresh.svg';
import eventTicketABI from '@/constant/abi/EventTicket1155.json';

// Contract address for the EventTicket1155 contract
const EVENT_TICKET_CONTRACT = '0x0000000000000000000000000000000000000000'; // Replace with actual contract address

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
}

interface Ticket {
  tokenId: string;
  balance: number;
  metadata: TicketMetadata;
  qrData: string;
}

// Styled components
const PageWrapper = styled.div`
  padding: 20px;
  height: 100%;
  overflow-y: auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 24px;
  margin: 0;
`;

const RefreshButton = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  color: var(--r-blue-default, #7084ff);
  font-size: 14px;
  
  img {
    margin-right: 4px;
    width: 16px;
    height: 16px;
  }
`;

const TicketList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
`;

const TicketCard = styled.div`
  border: 1px solid var(--r-neutral-line, #e5e9ef);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: transform 0.2s;
  background-color: var(--r-neutral-card-1, #fff);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const TicketImage = styled.div`
  width: 100%;
  height: 180px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const TicketInfo = styled.div`
  margin-bottom: 12px;
`;

const EventName = styled.h3`
  font-size: 18px;
  margin: 0 0 8px 0;
  color: var(--r-neutral-title-1, #192945);
`;

const EventDetail = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  color: var(--r-neutral-body, #3e495e);
  font-size: 14px;
  
  strong {
    margin-right: 4px;
    min-width: 60px;
  }
`;

const TicketActions = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
`;

const QRModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 16px;
    overflow: hidden;
  }
  
  .ant-modal-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px;
  }
`;

const QRContainer = styled.div`
  padding: 20px;
  background: white;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const EmptyStateWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
`;

// Main component
const NFTTickets: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const wallet = useWallet();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  
  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString();
  };
  
  // Extract event date from description
  const parseEventDate = (description: string) => {
    const match = description?.match(/timestamp (\d+)/);
    return match ? parseInt(match[1]) : undefined;
  };
  
  // Generate QR code data
  const generateQRData = (address: string, tokenId: string) => {
    return JSON.stringify({
      address,
      tokenId,
      timestamp: Date.now(),
      type: 'swagtix-ticket'
    });
  };
  
  // Fetch tickets from the contract
  const fetchTickets = async () => {
    try {
      setLoading(true);
      
      const currentAddress = await wallet.getCurrentAccount();
      if (!currentAddress?.address) {
        setTickets([]);
        setLoading(false);
        return;
      }
      
      const provider = await wallet.getProvider(CHAINS.PULSE);
      const contract = new ethers.Contract(EVENT_TICKET_CONTRACT, eventTicketABI, provider);
      
      const ticketsArray: Ticket[] = [];
      
      // Check first 50 token IDs (can be optimized with events/subgraph later)
      for (let tokenId = 1; tokenId <= 50; tokenId++) {
        try {
          const balance = await contract.balanceOf(currentAddress.address, tokenId);
          
          if (balance.gt(0)) {
            const uri = await contract.uri(tokenId);
            let metadata: TicketMetadata = {
              name: `Ticket #${tokenId}`,
              description: '',
              image: ''
            };
            
            // Parse metadata from URI
            if (uri.startsWith('data:application/json')) {
              const json = decodeURIComponent(uri.split(',')[1]);
              metadata = JSON.parse(json);
            } else if (uri.startsWith('http')) {
              const response = await fetch(uri);
              metadata = await response.json();
            }
            
            // Extract event date from description if not explicitly provided
            if (!metadata.eventDate && metadata.description) {
              metadata.eventDate = parseEventDate(metadata.description);
            }
            
            // Generate QR code data
            const qrData = generateQRData(currentAddress.address, tokenId.toString());
            
            ticketsArray.push({
              tokenId: tokenId.toString(),
              balance: balance.toNumber(),
              metadata,
              qrData
            });
          }
        } catch (err) {
          console.error(`Error fetching token ${tokenId}:`, err);
          // Continue to next token
        }
      }
      
      setTickets(ticketsArray);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      message.error(t('Error loading tickets'));
    } finally {
      setLoading(false);
    }
  };
  
  // Load tickets on component mount
  useEffect(() => {
    fetchTickets();
  }, []);
  
  // Handle ticket click
  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setQrModalVisible(true);
  };
  
  // Handle ticket transfer
  const handleTransfer = (e: React.MouseEvent, ticket: Ticket) => {
    e.stopPropagation();
    // Navigate to transfer page with ticket data
    history.push(`/transfer-ticket?tokenId=${ticket.tokenId}`);
  };
  
  // Render ticket status based on event date
  const renderTicketStatus = (eventDate?: number) => {
    if (!eventDate) return null;
    
    const now = Math.floor(Date.now() / 1000);
    
    if (eventDate > now) {
      return (
        <div style={{ 
          background: '#e6f7ff', 
          color: '#1890ff', 
          padding: '4px 8px', 
          borderRadius: '4px',
          fontSize: '12px',
          display: 'inline-block'
        }}>
          Upcoming
        </div>
      );
    } else if (eventDate < now && eventDate > now - 86400) { // Within 24 hours
      return (
        <div style={{ 
          background: '#fff7e6', 
          color: '#fa8c16', 
          padding: '4px 8px', 
          borderRadius: '4px',
          fontSize: '12px',
          display: 'inline-block'
        }}>
          Today
        </div>
      );
    } else {
      return (
        <div style={{ 
          background: '#f5f5f5', 
          color: '#8c8c8c', 
          padding: '4px 8px', 
          borderRadius: '4px',
          fontSize: '12px',
          display: 'inline-block'
        }}>
          Past
        </div>
      );
    }
  };
  
  // Render loading state
  const renderLoading = () => (
    <TicketList>
      {[1, 2, 3, 4].map((i) => (
        <TicketCard key={i}>
          <Skeleton.Image style={{ width: '100%', height: 180 }} active />
          <Skeleton active paragraph={{ rows: 3 }} />
        </TicketCard>
      ))}
    </TicketList>
  );
  
  // Render empty state
  const renderEmpty = () => (
    <EmptyStateWrapper>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={t('No tickets found')}
      />
      <Button 
        type="primary" 
        style={{ marginTop: 16 }}
        onClick={() => history.push('/')}
      >
        {t('Browse Events')}
      </Button>
    </EmptyStateWrapper>
  );
  
  // Render tickets
  const renderTickets = () => (
    <TicketList>
      {tickets.map((ticket) => (
        <TicketCard 
          key={ticket.tokenId}
          onClick={() => handleTicketClick(ticket)}
        >
          <TicketImage>
            <img 
              src={ticket.metadata.image} 
              alt={ticket.metadata.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x180?text=Ticket+Image';
              }}
            />
          </TicketImage>
          
          <TicketInfo>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <EventName>{ticket.metadata.eventName || ticket.metadata.name}</EventName>
              {renderTicketStatus(ticket.metadata.eventDate)}
            </div>
            
            <EventDetail>
              <strong>{t('Date')}:</strong> 
              {ticket.metadata.eventDate ? formatDate(ticket.metadata.eventDate) : 'N/A'}
            </EventDetail>
            
            <EventDetail>
              <strong>{t('Venue')}:</strong> 
              {ticket.metadata.venue || 'N/A'}
            </EventDetail>
            
            {ticket.metadata.ticketType && (
              <EventDetail>
                <strong>{t('Type')}:</strong> 
                {ticket.metadata.ticketType}
              </EventDetail>
            )}
            
            {ticket.metadata.seatInfo && (
              <EventDetail>
                <strong>{t('Seat')}:</strong> 
                {ticket.metadata.seatInfo}
              </EventDetail>
            )}
            
            <EventDetail>
              <strong>{t('Quantity')}:</strong> 
              {ticket.balance}
            </EventDetail>
          </TicketInfo>
          
          <TicketActions>
            <Button 
              type="primary" 
              onClick={(e) => handleTransfer(e, ticket)}
            >
              {t('Transfer')}
            </Button>
            <Tooltip title={t('View QR Code')}>
              <Button>
                {t('Show Ticket')} <IconArrowRight />
              </Button>
            </Tooltip>
          </TicketActions>
        </TicketCard>
      ))}
    </TicketList>
  );
  
  return (
    <PageWrapper>
      <Header>
        <Title>{t('My Tickets')}</Title>
        <RefreshButton onClick={fetchTickets}>
          <img src={IconRefresh} alt="Refresh" />
          {t('Refresh')}
        </RefreshButton>
      </Header>
      
      {loading ? renderLoading() : tickets.length > 0 ? renderTickets() : renderEmpty()}
      
      {/* QR Code Modal */}
      <QRModal
        visible={qrModalVisible}
        title={selectedTicket?.metadata.eventName || selectedTicket?.metadata.name}
        footer={null}
        onCancel={() => setQrModalVisible(false)}
        width={400}
        centered
      >
        {selectedTicket && (
          <>
            <QRContainer>
              <QRCodeSVG
                value={selectedTicket.qrData}
                size={250}
                level="H"
                includeMargin
              />
            </QRContainer>
            
            <EventDetail>
              <strong>{t('Event')}:</strong> 
              {selectedTicket.metadata.eventName || selectedTicket.metadata.name}
            </EventDetail>
            
            <EventDetail>
              <strong>{t('Date')}:</strong> 
              {selectedTicket.metadata.eventDate ? formatDate(selectedTicket.metadata.eventDate) : 'N/A'}
            </EventDetail>
            
            <EventDetail>
              <strong>{t('Venue')}:</strong> 
              {selectedTicket.metadata.venue || 'N/A'}
            </EventDetail>
            
            {selectedTicket.metadata.ticketType && (
              <EventDetail>
                <strong>{t('Type')}:</strong> 
                {selectedTicket.metadata.ticketType}
              </EventDetail>
            )}
            
            {selectedTicket.metadata.seatInfo && (
              <EventDetail>
                <strong>{t('Seat')}:</strong> 
                {selectedTicket.metadata.seatInfo}
              </EventDetail>
            )}
            
            <Button 
              type="primary" 
              style={{ marginTop: 16, width: '100%' }}
              onClick={() => setQrModalVisible(false)}
            >
              {t('Close')}
            </Button>
          </>
        )}
      </QRModal>
    </PageWrapper>
  );
};

export default NFTTickets;
