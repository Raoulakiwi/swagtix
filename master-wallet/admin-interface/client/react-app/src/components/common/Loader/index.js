import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

function Loader({ size = 40, message = 'Loading...' }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh', // Occupy most of the viewport height
      }}
    >
      <CircularProgress size={size} />
      {message && (
        <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
          {message}
        </Typography>
      )}
    </Box>
  );
}

export default Loader;
