import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ContractManagement from './pages/ContractManagement';
import TicketManagement from './pages/TicketManagement';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Loader from './components/common/Loader';

// Theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#7B5BFF', // SwagTix purple
      light: '#9B85FF',
      dark: '#5A3BFF',
    },
    secondary: {
      main: '#FF3D8A', // SwagTix pink
      light: '#FF6BA9',
      dark: '#D6226D',
    },
    background: {
      default: '#F5F6FA', // Light background
      paper: '#FFFFFF',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    success: {
      main: '#4caf50',
    },
    info: {
      main: '#00A3FF', // SwagTix blue
    },
  },
  typography: {
    fontFamily: '\"Roboto\", \"Helvetica\", \"Arial\", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider maxSnack={3}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Protected area wrapped in Layout – add auth later */}
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="contracts" element={<ContractManagement />} />
              <Route path="tickets" element={<TicketManagement />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Redirect all unknown paths */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
