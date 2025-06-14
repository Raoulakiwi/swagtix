require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const { ethers } = require('ethers');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { body, param, validationResult } = require('express-validator');

// Import services and logger
const walletService = require('./services/walletService');
const contractService = require('./services/contractService');
const logger = require('./utils/logger');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Ensure logs directory exists
const logDir = path.dirname(process.env.LOG_FILE || './logs/admin-interface.log');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Create a write stream for logs
const accessLogStream = fs.createWriteStream(process.env.LOG_FILE || './logs/admin-interface.log', { flags: 'a' });

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || 100),
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Logging
app.use(morgan('combined', { stream: accessLogStream }));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---

// Basic status endpoint (accessible without wallet initialization)
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'SwagTix Admin API is running',
    timestamp: new Date(),
    environment: process.env.NODE_ENV,
    services: {
      wallet: walletService.isInitialized ? 'Loaded' : 'Not loaded',
      contract: contractService.isContractInitialized() ? 'Loaded' : 'Not loaded'
    }
  });
});

// Middleware to ensure wallet and contract services are initialized for protected routes
const ensureServicesInitialized = (req, res, next) => {
  if (!walletService.isInitialized) {
    return res.status(503).json({
      success: false,
      message: 'Wallet service is not initialized. Please check server logs.'
    });
  }
  if (!contractService.isContractInitialized()) {
    return res.status(503).json({
      success: false,
      message: 'Contract service is not initialized. Please deploy the contract or check its address.'
    });
  }
  next();
};

// Wallet Routes
app.get(`${process.env.API_BASE_URL || '/api/v1'}/wallet/status`, ensureServicesInitialized, (req, res) => {
  try {
    const walletInfo = walletService.getWalletInfo();
    res.json({
      success: true,
      status: 'connected',
      address: walletInfo.address,
      network: walletInfo.network
    });
  } catch (error) {
    logger.error('Error getting wallet status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get(`${process.env.API_BASE_URL || '/api/v1'}/wallet/balance`, ensureServicesInitialized, async (req, res) => {
  try {
    const balance = await walletService.getBalance();
    res.json({
      success: true,
      balance
    });
  } catch (error) {
    logger.error('Error getting wallet balance:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Contract Routes
app.get(`${process.env.API_BASE_URL || '/api/v1'}/contract/status`, (req, res) => {
  try {
    const isInitialized = contractService.isContractInitialized();
    const contractAddress = contractService.getContractAddress();
    
    res.json({
      success: true,
      isInitialized,
      contractAddress,
      message: isInitialized 
        ? `Contract initialized at ${contractAddress}` 
        : 'Contract not initialized'
    });
  } catch (error) {
    logger.error('Error getting contract status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.post(
  `${process.env.API_BASE_URL || '/api/v1'}/contract/deploy`,
  ensureServicesInitialized,
  async (req, res) => {
    try {
      const result = await contractService.deployEventTicketContract();
      
      res.json({
        success: true,
        message: 'Contract deployed successfully',
        data: result
      });
    } catch (error) {
      logger.error('Failed to deploy contract:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

app.post(
  `${process.env.API_BASE_URL || '/api/v1'}/contract/mint`,
  ensureServicesInitialized,
  [
    body('to').isEthereumAddress().withMessage('Valid Ethereum address required'),
    body('amount').isInt({ min: 1 }).withMessage('Amount must be at least 1'),
    body('eventTimestamp').isInt({ min: 0 }).withMessage('Valid timestamp required'),
    body('qrCodeUri').isURL().withMessage('Valid QR code URI required'),
    body('mediaUri').isURL().withMessage('Valid media URI required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    try {
      const { to, amount, eventTimestamp, qrCodeUri, mediaUri } = req.body;
      
      const result = await contractService.mintTickets(
        to,
        amount,
        eventTimestamp,
        qrCodeUri,
        mediaUri
      );
      
      res.json({
        success: true,
        message: 'Ticket minted successfully',
        data: result
      });
    } catch (error) {
      logger.error('Failed to mint ticket:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

app.get(
  `${process.env.API_BASE_URL || '/api/v1'}/contract/tickets/:tokenId`,
  ensureServicesInitialized,
  [
    param('tokenId').isInt({ min: 1 }).withMessage('Valid token ID required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    try {
      const tokenId = req.params.tokenId;
      const ticket = await contractService.getTicketInfo(tokenId);
      
      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      logger.error(`Failed to get ticket info for token ${tokenId}:`, error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

app.get(`${process.env.API_BASE_URL || '/api/v1'}/contract/tickets`, ensureServicesInitialized, async (req, res) => {
  try {
    const tickets = await contractService.getAllTickets();
    
    res.json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (error) {
    logger.error('Failed to get all tickets:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Serve static files in production
const clientBuildPath = path.join(__dirname, 'client/build');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  // Fallback for when client/build doesn't exist (e.g., during initial setup)
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SwagTix Admin Interface</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          h1 { color: #2c3e50; }
          .card { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 4px; }
          .btn { display: inline-block; background: #3498db; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>SwagTix Admin Interface</h1>
          <div class="card">
            <h2>Setup in progress...</h2>
            <p>The backend API server is running. To proceed, please ensure:</p>
            <ol>
              <li>You have generated your master wallet and placed <code>encrypted-wallet.json</code> in <code>/opt/swagtix/secure/</code>.</li>
              <li>Your <code>.env</code> file in <code>/opt/swagtix/app/</code> is correctly configured with <code>WALLET_PATH</code> and other secrets.</li>
              <li>You have run the <code>start.sh</code> script with your wallet password.</li>
              <li>The frontend application is built and copied to <code>/opt/swagtix/app/client/build/</code>.</li>
            </ol>
            <p>Check the server logs for more details: <code>pm2 logs swagtix-admin</code></p>
            <a href="/api/status" class="btn">Check API Status</a>
          </div>
        </div>
      </body>
      </html>
    `);
  });
}

// Function to get wallet password from file or environment variable
async function getWalletPassword() {
  console.log("--- PASSWORD DEBUGGING START ---");
  
  const passwordFilePath = path.join(__dirname, '.wallet_password');
  console.log(`Looking for password file at: ${passwordFilePath}`);
  
  if (fs.existsSync(passwordFilePath)) {
    console.log("Password file found");
    try {
      // Read raw file content
      const rawPassword = fs.readFileSync(passwordFilePath, 'utf8');
      
      // Debug info
      console.log(`Raw password length: ${rawPassword.length}`);
      console.log(`Raw password last character code: ${rawPassword.charCodeAt(rawPassword.length - 1)}`);
      
      // If last char is newline (10), log it
      if (rawPassword.charCodeAt(rawPassword.length - 1) === 10) {
        console.log("WARNING: Password ends with newline character (10)");
      }
      
      // Convert to hex for debugging (shows invisible chars)
      let hexRepresentation = '';
      for (let i = 0; i < rawPassword.length; i++) {
        hexRepresentation += rawPassword.charCodeAt(i).toString(16).padStart(2, '0') + ' ';
      }
      console.log(`Password hex representation: ${hexRepresentation}`);
      
      // Trim all whitespace
      const trimmedPassword = rawPassword.trim();
      console.log(`Trimmed password length: ${trimmedPassword.length}`);
      
      // Compare
      if (rawPassword.length !== trimmedPassword.length) {
        console.log(`WARNING: Trimmed ${rawPassword.length - trimmedPassword.length} whitespace characters`);
      }
      
      // Show first and last character for validation
      if (trimmedPassword.length > 0) {
        console.log(`First character: ${trimmedPassword[0]}`);
        console.log(`Last character: ${trimmedPassword[trimmedPassword.length - 1]}`);
      }
      
      console.log("--- PASSWORD DEBUGGING END ---");
      return trimmedPassword;
    } catch (error) {
      console.error('Error reading password file:', error.message);
    }
  } else {
    console.log("Password file not found!");
  }
  
  // Fallback to environment variable
  if (process.env.WALLET_PASSWORD) {
    console.log("Using password from environment variable");
    const envPassword = process.env.WALLET_PASSWORD.trim();
    console.log(`Env password length: ${envPassword.length}`);
    console.log("--- PASSWORD DEBUGGING END ---");
    return envPassword;
  }
  
  console.error('No wallet password available');
  console.log("--- PASSWORD DEBUGGING END ---");
  return null;
}

// Start server
async function startServer() {
  try {
    // Start the server first
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      logger.info(`Access the admin interface at http://localhost:${PORT}`);
    });
    
    // Get wallet password
    const walletPassword = await getWalletPassword();
    if (!walletPassword) {
      logger.error('No wallet password available. Cannot initialize wallet.');
      return;
    }
    
    // Initialize wallet service
    try {
      const walletPath = process.env.WALLET_PATH;
      if (!walletPath || !fs.existsSync(walletPath)) {
        logger.error(`Wallet file not found at ${walletPath || 'undefined path'}`);
        return;
      }
      
      const walletInitialized = await walletService.initialize(walletPath, walletPassword);
      if (!walletInitialized) {
        logger.error('Wallet initialization failed: Error: Wallet initialization failed');
        return;
      }
      
      logger.info('Wallet service initialized successfully');
      
      // Initialize contract service after wallet is initialized
      const contractInitialized = await contractService.initialize();
      if (contractInitialized) {
        logger.info('Contract service initialized successfully');
      } else {
        logger.warn('Contract service not initialized. Deploy a contract or configure the contract address.');
      }
    } catch (error) {
      logger.error('Wallet initialization failed:', error);
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Export app for testing
module.exports = app;
