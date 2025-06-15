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
  Link,
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon, Launch as LaunchIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';

// Placeholder for API calls - In a real app, this would be a dedicated API service
const api = {
  get: async (url) => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call delay
    if (url === '/api/v1/contract/status') {
      // Simulate contract not deployed initially, then deployed after a "deploy" action
      const deployed = localStorage.getItem('contractDeployed') === 'true';
      const contractAddress = localStorage.getItem('deployedContractAddress') || '0x0000000000000000000000000000000000000000';
      return { data: { success: true, isInitialized: deployed, contractAddress: contractAddress } };
    }
    return { data: {} };
  },
  post: async (url, data) => {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call delay
    if (url === '/api/v1/contract/deploy') {
      const newContractAddress = '0x' + Math.random().toString(16).substring(2, 42); // Simulate new address
      localStorage.setItem('contractDeployed', 'true');
      localStorage.setItem('deployedContractAddress', newContractAddress);
      return { data: { success: true, contractAddress: newContractAddress } };
    }
    return { data: { success: false, message: 'Unknown API endpoint' } };
  },
};

function ContractManagement() {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [contractStatus, setContractStatus] = useState(null);

  const fetchContractStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/contract/status');
      setContractStatus(res.data);
      enqueueSnackbar('Contract status refreshed!', { variant: 'success' });
    } catch (error) {
      console.error('Error fetching contract status:', error);
      enqueueSnackbar('Failed to fetch contract status', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeployContract = async () => {
    setDeploying(true);
    try {
      const res = await api.post('/api/v1/contract/deploy');
      if (res.data.success) {
        enqueueSnackbar(`Contract deployed successfully at ${res.data.contractAddress}`, { variant: 'success' });
        await fetchContractStatus(); // Refresh status after deployment
      } else {
        enqueueSnackbar(`Failed to deploy contract: ${res.data.message}`, { variant: 'error' });
      }
    } catch (error) {
      console.error('Error deploying contract:', error);
      enqueueSnackbar(`Error deploying contract: ${error.message}`, { variant: 'error' });
    } finally {
      setDeploying(false);
    }
  };

  useEffect(() => {
    fetchContractStatus();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading Contract Status...</Typography>
      </Box>
    );
  }

  const explorerBaseUrl = 'https://scan.pulsechain.com/address/';

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Contract Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={fetchContractStatus}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>EventTicket1155 Contract Status</Typography>
            <Divider sx={{ mb: 2 }} />

            {contractStatus?.isInitialized ? (
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Contract is deployed and initialized!
                </Alert>
                <Typography variant="body1" gutterBottom>
                  Contract Address: <strong>{contractStatus.contractAddress}</strong>
                </Typography>
                <Link href={`${explorerBaseUrl}${contractStatus.contractAddress}`} target="_blank" rel="noopener" sx={{ mt: 1, display: 'inline-flex', alignItems: 'center' }}>
                  View on PulseChain Explorer <LaunchIcon sx={{ ml: 0.5, fontSize: '1rem' }} />
                </Link>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  You can now proceed to the Ticket Management section to mint new NFT tickets.
                </Typography>
              </Box>
            ) : (
              <Box>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  EventTicket1155 contract is not yet deployed.
                </Alert>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={deploying ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                  onClick={handleDeployContract}
                  disabled={deploying}
                >
                  {deploying ? 'Deploying Contract...' : 'Deploy New Contract'}
                </Button>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Ensure your master wallet is funded with PLS before deploying.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Placeholder for other contract-related features like contract info, owner, etc. */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Contract Functions (Coming Soon)</Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              This section will allow you to interact with the deployed contract, e.g., check owner, transfer ownership, etc.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default ContractManagement;
