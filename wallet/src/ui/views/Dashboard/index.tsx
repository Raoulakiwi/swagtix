import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { PageHeader } from '@/ui/component'; // Assuming PageHeader is a simple component
import { useWallet } from '@/ui/utils'; // For basic wallet interaction if needed

// Styled components for a basic dashboard layout
const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  min-height: calc(100vh - 60px); // Adjust if header height is different
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--r-neutral-title-1, #192945);
`;

const Subtitle = styled.p`
  font-size: 18px;
  color: var(--r-neutral-body, #5e6b81);
  margin-bottom: 32px;
  max-width: 450px;
`;

const ActionButton = styled(Button)`
  height: 48px;
  font-size: 16px;
  min-width: 200px;
`;

/**
 * Simplified Dashboard for SwagTix Wallet
 *
 * This component serves as the main landing page after login.
 * It provides a welcome message and a primary action to view tickets.
 * All complex DeFi, multi-chain, and Rabby-specific store logic has been removed.
 */
const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const wallet = useWallet();
  const [isLoading, setIsLoading] = useState(true);
  const [isWalletSetup, setIsWalletSetup] = useState(false);

  useEffect(() => {
    const checkWalletStatus = async () => {
      try {
        // A simple check to see if any account exists, indicating setup.
        // Replace with a more robust check if needed, e.g., checking Web3Auth status.
        const accounts = await wallet.getAccounts();
        setIsWalletSetup(accounts && accounts.length > 0);
      } catch (e) {
        console.error('Failed to check wallet status', e);
        setIsWalletSetup(false); // Assume not setup if error
      } finally {
        setIsLoading(false);
      }
    };

    checkWalletStatus();
  }, [wallet]);

  const handleViewTickets = () => {
    // Navigate to the NFTTickets view
    // This route should be defined in MainRoute.tsx or similar router config
    history.push('/nft-tickets');
  };

  const handleSetupWallet = () => {
    // Navigate to the onboarding/welcome route
    history.push('/onboarding/welcome');
  };

  if (isLoading) {
    return (
      <DashboardWrapper>
        <Title>{t('page.dashboard.loadingTitle', 'Loading SwagTix Wallet...')}</Title>
        <p>{t('page.dashboard.loadingSubtitle', 'Please wait a moment.')}</p>
        {/* Can add a spinner component here if desired */}
      </DashboardWrapper>
    );
  }

  return (
    <div className="dashboard">
      {/* Assuming PageHeader is a simple component not reliant on complex store state */}
      <PageHeader>{t('page.dashboard.title', 'SwagTix Dashboard')}</PageHeader>
      <DashboardWrapper>
        <Title>
          {t(
            'page.dashboard.welcomeTitle',
            'Welcome to Your SwagTix Ticket Wallet!'
          )}
        </Title>
        <Subtitle>
          {t(
            'page.dashboard.welcomeSubtitle',
            'Manage your NFT event tickets for PulseChain easily and securely.'
          )}
        </Subtitle>
        {isWalletSetup ? (
          <ActionButton type="primary" size="large" onClick={handleViewTickets}>
            {t('page.dashboard.actions.viewMyTickets', 'View My Tickets')}
          </ActionButton>
        ) : (
          <>
            <Subtitle>
              {t(
                'page.dashboard.setupPrompt',
                "It looks like you haven't set up your wallet yet. Let's get started!"
              )}
            </Subtitle>
            <ActionButton type="primary" size="large" onClick={handleSetupWallet}>
              {t('page.dashboard.actions.setupWallet', 'Setup Your Wallet')}
            </ActionButton>
          </>
        )}
      </DashboardWrapper>
    </div>
  );
};

export default Dashboard;
