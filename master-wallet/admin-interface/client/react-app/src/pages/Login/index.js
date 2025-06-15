import React, { useState } from 'react';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import LockIcon from '@mui/icons-material/Lock';

export default function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false); // Placeholder for loading state

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setLoading(true);

    if (!formData.username || !formData.password) {
      setFormError('Username and password are required');
      setLoading(false);
      return;
    }

    // Placeholder for actual login logic
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (formData.username === 'admin' && formData.password === 'password') { // Replace with actual authentication
        console.log('Login successful!');
        // In a real app, you'd store a token and redirect
        setFormError('');
      } else {
        setFormError('Invalid username or password');
      }
    } catch (err) {
      setFormError('An error occurred during login.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
            width: '100%',
          }}
        >
          {/* Placeholder for Logo */}
          <Box sx={{ width: 70, height: 70, bgcolor: 'primary.main', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LockIcon sx={{ color: 'white', fontSize: 40 }} />
          </Box>
          <Typography component="h1" variant="h5" sx={{ mt: 2, mb: 1 }}>
            SwagTix Admin Login
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
            Access your Master Wallet
          </Typography>

          {formError && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {formError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                background: 'linear-gradient(to right, #7B5BFF, #FF3D8A)',
                '&:hover': {
                  background: 'linear-gradient(to right, #00A3FF, #7B5BFF)',
                },
              }}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LockIcon />}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Box>
        </Paper>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          &copy; {new Date().getFullYear()} SwagTix. All rights reserved.
        </Typography>
      </Box>
    </Container>
  );
}
