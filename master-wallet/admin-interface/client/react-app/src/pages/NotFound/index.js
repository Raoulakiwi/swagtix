import React from 'react';
import { Container, Box, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

function NotFound() {
  return (
    <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
      <Box sx={{ mb: 4 }}>
        <ErrorOutlineIcon sx={{ fontSize: 80, color: 'error.main' }} />
        <Typography variant="h1" component="h1" gutterBottom sx={{ mt: 2 }}>
          404
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          The page you are looking for does not exist or an other error occurred.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          component={RouterLink}
          to="/"
        >
          Go to Dashboard
        </Button>
      </Box>
    </Container>
  );
}

export default NotFound;
