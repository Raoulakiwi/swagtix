import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  CircularProgress,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  FormHelperText,
  Card,
  CardContent,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  EventNote as EventIcon,
  LocalOffer as TicketIcon,
  Check as CheckIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  QrCode as QrCodeIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useFormik } from 'formik';
import * as yup from 'yup';

// Placeholder for API calls - In a real app, this would be a dedicated API service
const api = {
  get: async (url) => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call delay
    if (url === '/api/v1/contract/status') {
      const deployed = localStorage.getItem('contractDeployed') === 'true';
      const contractAddress = localStorage.getItem('deployedContractAddress') || '0x0000000000000000000000000000000000000000';
      return { data: { success: true, isInitialized: deployed, contractAddress: contractAddress } };
    }
    if (url === '/api/v1/contract/tickets') {
      const tickets = JSON.parse(localStorage.getItem('mintedTickets') || '[]');
      return { data: { success: true, data: tickets } };
    }
    return { data: {} };
  },
  post: async (url, data) => {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call delay
    if (url === '/api/v1/contract/mint') {
      const newTicket = {
        tokenId: (JSON.parse(localStorage.getItem('mintedTickets') || '[]').length + 1).toString(),
        owner: data.to,
        eventTimestamp: data.eventTimestamp,
        qrCodeUri: data.qrCodeUri,
        mediaUri: data.mediaUri,
        metadata: {
          name: data.eventName,
          description: data.description,
          eventName: data.eventName,
          eventDate: data.eventTimestamp,
          venue: data.venue,
          ticketType: data.ticketType,
        },
      };
      const currentTickets = JSON.parse(localStorage.getItem('mintedTickets') || '[]');
      localStorage.setItem('mintedTickets', JSON.stringify([...currentTickets, newTicket]));
      return { data: { success: true, tokenId: newTicket.tokenId, to: data.to, amount: data.amount } };
    }
    return { data: { success: false, message: 'Unknown API endpoint' } };
  },
};

// Validation schema for ticket minting
const validationSchema = yup.object({
  to: yup
    .string()
    .matches(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid Ethereum address')
    .required('Recipient address is required'),
  amount: yup
    .number()
    .positive('Amount must be positive')
    .integer('Amount must be an integer')
    .required('Amount is required'),
  eventName: yup
    .string()
    .max(100, 'Event name cannot exceed 100 characters')
    .required('Event name is required'),
  eventDate: yup
    .date()
    .min(new Date(), 'Event date must be in the future')
    .required('Event date is required'),
  venue: yup
    .string()
    .max(200, 'Venue cannot exceed 200 characters')
    .required('Venue is required'),
  ticketType: yup
    .string()
    .max(50, 'Ticket type cannot exceed 50 characters')
    .required('Ticket type is required'),
  qrCodeUri: yup
    .string()
    .url('Must be a valid URL')
    .required('QR Code URI is required'),
  mediaUri: yup
    .string()
    .url('Must be a valid URL')
    .required('Media URI is required'),
});

function TicketManagement() {
  const { enqueueSnackbar } = useSnackbar();
  const [contractStatus, setContractStatus] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);

  const formik = useFormik({
    initialValues: {
      to: '',
      amount: 1,
      eventName: '',
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
      venue: '',
      ticketType: 'General Admission',
      qrCodeUri: '',
      mediaUri: '',
      description: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setMinting(true);
      try {
        const eventTimestamp = Math.floor(values.eventDate.getTime() / 1000);
        const res = await api.post('/api/v1/contract/mint', {
          to: values.to,
          amount: values.amount,
          eventTimestamp,
          qrCodeUri: values.qrCodeUri,
          mediaUri: values.mediaUri,
          eventName: values.eventName,
          description: values.description,
          venue: values.venue,
          ticketType: values.ticketType,
        });
        if (res.data.success) {
          enqueueSnackbar(`Successfully minted ticket(s)! Token ID: ${res.data.tokenId}`, { variant: 'success' });
          formik.resetForm();
          fetchTickets();
        } else {
          enqueueSnackbar(`Failed to mint ticket: ${res.data.message}`, { variant: 'error' });
        }
      } catch (error) {
        console.error('Error minting ticket:', error);
        enqueueSnackbar(`Error minting ticket: ${error.message}`, { variant: 'error' });
      } finally {
        setMinting(false);
      }
    },
  });

  const fetchContractStatus = async () => {
    try {
      const res = await api.get('/api/v1/contract/status');
      setContractStatus(res.data);
      if (res.data.isInitialized) {
        fetchTickets();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching contract status:', error);
      enqueueSnackbar('Failed to fetch contract status', { variant: 'error' });
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await api.get('/api/v1/contract/tickets');
      setTickets(res.data.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      enqueueSnackbar('Failed to fetch tickets', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractStatus();
  }, []);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading Ticket Management...</Typography>
      </Box>
    );
  }

  if (!contractStatus?.isInitialized) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            Ticket Management
          </Typography>
        </Box>
        <Paper sx={{ p: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            EventTicket1155 contract is not deployed. Please deploy the contract first to mint tickets.
          </Alert>
          <Button
            variant="contained"
            href="/contracts"
            startIcon={<AddIcon />}
          >
            Go to Contract Management
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Ticket Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={fetchTickets}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Tickets'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Mint New Tickets Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Mint New Event Tickets</Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={formik.handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="to"
                    name="to"
                    label="Recipient Address (0x...)"
                    variant="outlined"
                    value={formik.values.to}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.to && Boolean(formik.errors.to)}
                    helperText={formik.touched.to && formik.errors.to}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="amount"
                    name="amount"
                    label="Number of Tickets"
                    type="number"
                    variant="outlined"
                    value={formik.values.amount}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.amount && Boolean(formik.errors.amount)}
                    helperText={formik.touched.amount && formik.errors.amount}
                    InputProps={{
                      inputProps: { min: 1 },
                      startAdornment: (
                        <InputAdornment position="start">
                          <TicketIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined" error={formik.touched.ticketType && Boolean(formik.errors.ticketType)}>
                    <InputLabel id="ticket-type-label">Ticket Type</InputLabel>
                    <Select
                      labelId="ticket-type-label"
                      id="ticketType"
                      name="ticketType"
                      value={formik.values.ticketType}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      label="Ticket Type"
                    >
                      <MenuItem value="General Admission">General Admission</MenuItem>
                      <MenuItem value="VIP">VIP</MenuItem>
                      <MenuItem value="Backstage Pass">Backstage Pass</MenuItem>
                      <MenuItem value="Early Access">Early Access</MenuItem>
                      <MenuItem value="Staff Pass">Staff Pass</MenuItem>
                    </Select>
                    {formik.touched.ticketType && formik.errors.ticketType && (
                      <FormHelperText>{formik.errors.ticketType}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="eventName"
                    name="eventName"
                    label="Event Name"
                    variant="outlined"
                    value={formik.values.eventName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.eventName && Boolean(formik.errors.eventName)}
                    helperText={formik.touched.eventName && formik.errors.eventName}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EventIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                      label="Event Date & Time"
                      value={formik.values.eventDate}
                      onChange={(newValue) => {
                        formik.setFieldValue('eventDate', newValue);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          id="eventDate"
                          name="eventDate"
                          variant="outlined"
                          error={formik.touched.eventDate && Boolean(formik.errors.eventDate)}
                          helperText={formik.touched.eventDate && formik.errors.eventDate}
                        />
                      )}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="venue"
                    name="venue"
                    label="Venue"
                    variant="outlined"
                    value={formik.values.venue}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.venue && Boolean(formik.errors.venue)}
                    helperText={formik.touched.venue && formik.errors.venue}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="qrCodeUri"
                    name="qrCodeUri"
                    label="QR Code Image URI"
                    variant="outlined"
                    value={formik.values.qrCodeUri}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.qrCodeUri && Boolean(formik.errors.qrCodeUri)}
                    helperText={formik.touched.qrCodeUri && formik.errors.qrCodeUri}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <QrCodeIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="mediaUri"
                    name="mediaUri"
                    label="Media Image/Video URI (Post-Event)"
                    variant="outlined"
                    value={formik.values.mediaUri}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.mediaUri && Boolean(formik.errors.mediaUri)}
                    helperText={formik.touched.mediaUri && formik.errors.mediaUri}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <ImageIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="description"
                    name="description"
                    label="Description (Optional)"
                    variant="outlined"
                    multiline
                    rows={3}
                    value={formik.values.description}
                    onChange={formik.handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={minting}
                    startIcon={minting ? <CircularProgress size={20} /> : <AddIcon />}
                  >
                    {minting ? 'Minting...' : 'Mint Tickets'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>

        {/* Existing Tickets Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Existing Tickets</Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={fetchTickets}
              >
                Refresh
              </Button>
            </Box>
            <Divider sx={{ mb: 3 }} />

            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : tickets.length === 0 ? (
              <Alert severity="info">No tickets have been minted yet.</Alert>
            ) : (
              <Grid container spacing={3}>
                {tickets.map((ticket) => (
                  <Grid item xs={12} sm={6} md={4} key={ticket.tokenId}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Ticket #{ticket.tokenId}
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <img
                            src={ticket.qrCodeUri}
                            alt="Ticket QR Code"
                            style={{ width: '100%', borderRadius: '4px' }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Event:</strong> {ticket.metadata?.eventName || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Date:</strong> {formatTimestamp(ticket.eventTimestamp)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Venue:</strong> {ticket.metadata?.venue || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Type:</strong> {ticket.metadata?.ticketType || 'General'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Owner:</strong> {`${ticket.owner.substring(0, 6)}...${ticket.owner.substring(ticket.owner.length - 4)}`}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default TicketManagement;
