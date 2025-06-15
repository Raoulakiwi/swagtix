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
  TextField,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Refresh as RefreshIcon, AccountBalanceWallet as WalletIcon, Public as PublicIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';

// Placeholder for API calls - In a real app, this would be a dedicated API service
const api = {
  get: async (url) => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call delay
    if (url === '/api/v1/wallet/status') {
      const address = localStorage.getItem('masterWalletAddress') || '0xMasterWalletAddressHere';
      const isConnected = address !== '0xMasterWalletAddressHere';
      return { data: { success: true, status: isConnected ? 'connected' : 'not_initialized', address: isConnected ? address : 'N/A', network: 'PulseChain Mainnet' } };
    }
    if (url === '/api/v1/wallet/balance') {
      return { data: { success: true, balance: '123.45' } };
    }
    if (url === '/api/v1/network/config') {
      return { data: { success: true, rpcUrl: 'https://rpc.pulsechain.com', chainId: '369', explorerUrl: 'https://scan.pulsechain.com' } };
    }
    return { data: {} };
  },
  post: async (url, data) => {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call delay
    if (url === '/api/v1/settings/update') {
      console.log('Updating settings:', data);
      return { data: { success: true, message: 'Settings updated successfully!' } };
    }
    return { data: { success: false, message: 'Unknown API endpoint' } };
  },
};

function Settings() {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [walletInfo, setWalletInfo] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);
  const [networkConfig, setNetworkConfig] = useState(null);
  const [darkMode, setDarkMode] = useState(false); // Example setting

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const walletRes = await api.get('/api/v1/wallet/status');
      setWalletInfo(walletRes.data);

      if (walletRes.data.success && walletRes.data.status === 'connected') {
        const balanceRes = await api.get('/api/v1/wallet/balance');
        setWalletBalance(balanceRes.data.balance);
      } else {
        setWalletBalance('N/A');
      }

      const networkRes = await api.get('/api/v1/network/config');
      setNetworkConfig(networkRes.data);

      enqueueSnackbar('Settings data refreshed!', { variant: 'success' });
    } catch (error) {
      console.error('Error fetching settings data:', error);
      enqueueSnackbar('Failed to fetch settings data', { variant: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const res = await api.post('/api/v1/settings/update', { darkMode });
      if (res.data.success) {
        enqueueSnackbar('Settings saved successfully!', { variant: 'success' });
      } else {
        enqueueSnackbar(`Failed to save settings: ${res.data.message}`, { variant: 'error' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      enqueueSnackbar(`Error saving settings: ${error.message}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading Settings...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
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
        {/* Wallet Settings */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <WalletIcon sx={{ verticalAlign: 'middle', mr: 1 }} /> Master Wallet Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Wallet Address"
                  value={walletInfo?.address || 'N/A'}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Current Balance (PLS)"
                  value={walletBalance || 'N/A'}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Wallet Status"
                  value={walletInfo?.status === 'connected' ? 'Connected' : 'Not Initialized'}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Network Settings */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <PublicIcon sx={{ verticalAlign: 'middle', mr: 1 }} /> Network Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="PulseChain RPC URL"
                  value={networkConfig?.rpcUrl || 'N/A'}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Chain ID"
                  value={networkConfig?.chainId || 'N/A'}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Explorer URL"
                  value={networkConfig?.explorerUrl || 'N/A'}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* General App Settings */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <SettingsIcon sx={{ verticalAlign: 'middle', mr: 1 }} /> General App Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={darkMode}
                      onChange={(e) => setDarkMode(e.target.checked)}
                      name="darkMode"
                      color="primary"
                    />
                  }
                  label="Enable Dark Mode (Placeholder)"
                />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" color="primary" onClick={handleSaveSettings} disabled={loading}>
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Settings'}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Settings;
