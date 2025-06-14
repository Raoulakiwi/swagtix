import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useSnackbar } from 'notistack';

// Placeholder for API calls
const api = {
  get: async (url) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    if (url === '/api/status') {
      return { data: { success: true, message: 'API is running' } };
    }
    if (url === '/api/v1/wallet/status') {
      // Simulate wallet connected status
      return { data: { success: true, status: 'connected', address: '0xMasterWalletAddressHere', network: 'PulseChain Mainnet' } };
    }
    if (url === '/api/v1/wallet/balance') {
      return { data: { success: true, balance: '123.45' } };
    }
    if (url === '/api/v1/contract/status') {
      // Simulate contract not deployed initially
      return { data: { success: true, isInitialized: false, contractAddress: null } };
    }
    return { data: {} };
  },
};

function Dashboard() {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [walletStatus, setWalletStatus] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);
  const [contractStatus, setContractStatus] = useState(null);
  const [apiStatus, setApiStatus] = useState(null);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const apiRes = await api.get('/api/status');
      setApiStatus(apiRes.data);

      const walletRes = await api.get('/api/v1/wallet/status');
      setWalletStatus(walletRes.data);

      if (walletRes.data.success && walletRes.data.status === 'connected') {
        const balanceRes = await api.get('/api/v1/wallet/balance');
        setWalletBalance(balanceRes.data.balance);
      } else {
        setWalletBalance('N/A');
      }

      const contractRes = await api.get('/api/v1/contract/status');
      setContractStatus(contractRes.data);

      enqueueSnackbar('Dashboard data refreshed!', { variant: 'success' });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      enqueueSnackbar('Failed to fetch dashboard data', { variant: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading Dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={fetchData}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* API Status Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h6" gutterBottom>API Server Status</Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1">
              Status: {apiStatus?.success ? (
                <span style={{ color: 'green', fontWeight: 'bold' }}>Online</span>
              ) : (
                <span style={{ color: 'red', fontWeight: 'bold' }}>Offline</span>
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {apiStatus?.message || 'Could not connect to the backend API.'}
            </Typography>
          </Paper>
        </Grid>

        {/* Wallet Status Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h6" gutterBottom>Master Wallet Status</Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1">
              Connection: {walletStatus?.status === 'connected' ? (
                <span style={{ color: 'green', fontWeight: 'bold' }}>Connected</span>
              ) : (
                <span style={{ color: 'orange', fontWeight: 'bold' }}>{walletStatus?.message || 'Not Initialized'}</span>
              )}
            </Typography>
            <Typography variant="body1">
              Address: {walletStatus?.address || 'N/A'}
            </Typography>
            <Typography variant="body1">
              Balance: {walletBalance} PLS
            </Typography>
            <Typography variant="body1">
              Network: {walletStatus?.network || 'N/A'}
            </Typography>
          </Paper>
        </Grid>

        {/* Contract Status Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h6" gutterBottom>EventTicket1155 Contract</Typography>
            <Divider sx={{ mb: 2 }} />
            {contractStatus?.isInitialized ? (
              <Alert severity="success">
                Contract Deployed at: <br />
                <strong>{contractStatus.contractAddress}</strong>
              </Alert>
            ) : (
              <Alert severity="warning">
                Contract Not Deployed. <br />
                Go to Contract Management to deploy.
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Quick Actions Card */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Actions</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Button variant="contained" fullWidth href="/contracts">
                  Manage Contracts
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Button variant="contained" fullWidth href="/tickets">
                  Mint Tickets
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Button variant="contained" fullWidth href="/settings">
                  Settings
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;
