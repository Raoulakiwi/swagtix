import React, { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Route, Switch, Redirect } from 'react-router-dom';
import { message } from '@/background/webapi';
import { useWallet } from '@/ui/utils';
import { getUiType, useWalletRequest } from 'ui/utils';
import { WalletProvider } from 'ui/utils/WalletContext';
import { Spin } from 'antd';
import { initTheme } from '@/ui/utils/theme';

// Onboarding & Authentication
const Welcome = lazy(() => import('../views/Onboarding/Welcome'));
const EmailSignup = lazy(() => import('../views/Onboarding/EmailSignup'));
const CreatePin = lazy(() => import('../views/Onboarding/CreatePin'));
const PinEntry = lazy(() => import('../views/Unlock/PinEntry'));
const Web3AuthLogin = lazy(() => import('../views/Unlock/Web3AuthLogin'));
const Unlock = lazy(() => import('../views/Unlock'));

// Main App Views
const NFTTickets = lazy(() => import('../views/NFTTickets'));
const TransferTicket = lazy(() => import('../views/TransferTicket'));
const Settings = lazy(() => import('../views/Settings'));
const Approval = lazy(() => import('../views/Approval'));
const RequestPermission = lazy(() => import('../views/RequestPermission'));
const Splash = lazy(() => import('../views/Splash'));

// Simplified terminology components
const MyAccount = lazy(() => import('../views/Account'));
const ScanTicket = lazy(() => import('../views/ScanQR'));
const TicketDetails = lazy(() => import('../views/NFTDetail'));

// Legacy components that might be needed
const Notification = lazy(() => import('../views/Notification'));
const History = lazy(() => import('../views/History'));
const Dashboard = lazy(() => import('../views/Dashboard'));
const AddressDetail = lazy(() => import('../views/AddressDetail'));
const SignatureApproval = lazy(() => import('../views/SignatureApproval'));
const ConnectedSites = lazy(() => import('../views/ConnectedSites'));

// Loading component for Suspense
const PageLoading = () => (
  <div style={{ 
    height: '100vh', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    background: 'linear-gradient(135deg, #121212 0%, #192945 100%)'
  }}>
    <Spin size="large" />
  </div>
);

const AppRoutes = () => {
  const wallet = useWallet();
  const [isUnlocked, isUnlockedLoading] = useWalletRequest(wallet.isUnlocked, []);
  const [hasPendingApproval, hasPendingApprovalLoading] = useWalletRequest(
    wallet.hasPendingApproval,
    []
  );
  const [isPinSetup, isPinSetupLoading] = useWalletRequest(
    wallet.isPinSetup,
    []
  );

  // Initialize theme on app load
  useEffect(() => {
    initTheme();
  }, []);

  // Handle pending approvals
  useEffect(() => {
    if (hasPendingApproval && isUnlocked) {
      if (getUiType() === 'notification') {
        window.location.href = '#/approval';
      } else if (getUiType() === 'popup') {
        message.send('OPEN_APPROVAL_PAGE');
      }
    }
  }, [hasPendingApproval, isUnlocked]);

  // Show loading while checking wallet status
  if (isUnlockedLoading || hasPendingApprovalLoading || isPinSetupLoading) {
    return <PageLoading />;
  }

  // Handle pending approvals for notification UI
  if (getUiType() === 'notification') {
    if (hasPendingApproval) {
      return (
        <Suspense fallback={<PageLoading />}>
          <Approval />
        </Suspense>
      );
    } else {
      return (
        <Suspense fallback={<PageLoading />}>
          <Notification />
        </Suspense>
      );
    }
  }

  return (
    <HashRouter>
      <Suspense fallback={<PageLoading />}>
        <Switch>
          {/* Splash Screen */}
          <Route exact path="/splash">
            <Splash />
          </Route>

          {/* Authentication Routes */}
          <Route exact path="/unlock">
            {isUnlocked ? (
              <Redirect to="/" />
            ) : isPinSetup ? (
              <PinEntry />
            ) : (
              <Web3AuthLogin />
            )}
          </Route>
          <Route exact path="/unlock/password">
            <Unlock />
          </Route>

          {/* Onboarding Routes */}
          <Route exact path="/onboarding/welcome">
            <Welcome />
          </Route>
          <Route exact path="/onboarding/signup">
            <EmailSignup />
          </Route>
          <Route exact path="/onboarding/create-pin">
            <CreatePin />
          </Route>

          {/* Protected Routes (require authentication) */}
          <Route
            path="/"
            render={({ location }) => {
              // If not unlocked, redirect to unlock page
              if (!isUnlocked) {
                return (
                  <Redirect
                    to={{
                      pathname: '/splash',
                      state: { from: location },
                    }}
                  />
                );
              }

              // Main app routes (protected)
              return (
                <Switch>
                  {/* Main dashboard - NFT Tickets */}
                  <Route exact path="/">
                    <NFTTickets />
                  </Route>
                  
                  {/* Ticket Management */}
                  <Route exact path="/transfer-ticket">
                    <TransferTicket />
                  </Route>
                  <Route exact path="/ticket/:id">
                    <TicketDetails />
                  </Route>
                  <Route exact path="/scan">
                    <ScanTicket />
                  </Route>

                  {/* User Account */}
                  <Route exact path="/account">
                    <MyAccount />
                  </Route>
                  
                  {/* Settings */}
                  <Route path="/settings">
                    <Settings />
                  </Route>

                  {/* Transaction History */}
                  <Route exact path="/history">
                    <History />
                  </Route>

                  {/* Legacy Routes (may be needed for compatibility) */}
                  <Route exact path="/dashboard">
                    <Dashboard />
                  </Route>
                  <Route exact path="/address-detail">
                    <AddressDetail />
                  </Route>
                  <Route exact path="/connected-sites">
                    <ConnectedSites />
                  </Route>

                  {/* Approval Routes */}
                  <Route exact path="/approval">
                    <Approval />
                  </Route>
                  <Route exact path="/sign-approval">
                    <SignatureApproval />
                  </Route>
                  <Route exact path="/request-permission">
                    <RequestPermission />
                  </Route>

                  {/* Fallback - redirect to main dashboard */}
                  <Route path="*">
                    <Redirect to="/" />
                  </Route>
                </Switch>
              );
            }}
          />
        </Switch>
      </Suspense>
    </HashRouter>
  );
};

export default function Routes() {
  return (
    <WalletProvider>
      <AppRoutes />
    </WalletProvider>
  );
}
