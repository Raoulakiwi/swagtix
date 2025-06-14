import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
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

// Protected route wrapper
const PrivateRoute = ({ children, ...rest }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <Loader />;
  }
  
  return (
    <Route
      {...rest}
      render={({ location }) =>
        isAuthenticated ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: "/login",
              state: { from: location }
            }}
          />
        )
      }
    />
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <SnackbarProvider maxSnack={3}>
          <CssBaseline />
          <Router>
            <Switch>
              <Route path="/login" component={Login} />
              <PrivateRoute path="/">
                <Layout>
                  <Switch>
                    <Route exact path="/" component={Dashboard} />
                    <Route path="/contracts" component={ContractManagement} />
                    <Route path="/tickets" component={TicketManagement} />
                    <Route path="/settings" component={Settings} />
                    <Route component={NotFound} />
                  </Switch>
                </Layout>
              </PrivateRoute>
            </Switch>
          </Router>
        </SnackbarProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
