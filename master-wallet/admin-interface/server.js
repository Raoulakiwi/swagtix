require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const { ethers } = require('ethers');
const compression = require('compression');
const { body, param, validationResult } = require('express-validator');

// Import services and logger
const walletService = require('./services/walletService');
const contractService = require('./services/contractService');
const logger = require('./utils/logger');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Tell Express that it is sitting behind a reverse-proxy (e.g. Nginx).
 * This makes `req.ip`, `req.protocol`, secure cookies, etc. use the
 * correct values from the `X-Forwarded-*` headers injected by the proxy.
 * See: https://expressjs.com/en/guide/behind-proxies.html
 */
/**
 * Security note:
 *   Setting `trust proxy` to a blanket `true` is considered unsafe by
 *   express-rate-limit because clients can spoof the `X-Forwarded-For`
 *   header and bypass IP-based limits.  We instead:
 *     • trust only local reverse–proxies (default: 'loopback')
 *     • allow override via `TRUST_PROXY` env (e.g. '127.0.0.1')
 */
const TRUST_PROXY = process.env.TRUST_PROXY || 'loopback';
app.set('trust proxy', TRUST_PROXY);

// Ensure logs directory exists
const logDir = path.dirname(process.env.LOG_FILE || './logs/admin-interface.log');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Create a write stream for logs
const accessLogStream = fs.createWriteStream(process.env.LOG_FILE || './logs/admin-interface.log', { flags: 'a' });

// Security middleware
app.use(helmet());
/**
 * CORS configuration
 * ------------------------------------------------------------------
 *  - If an explicit CORS_ORIGIN env var is supplied we use that.
 *  - Otherwise we default-allow the local dev hostnames AND
 *    the static LAN address 192.168.0.199 so the dashboard can
 *    be reached from other devices on the network without manual
 *    re-configuration.
 */
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost',
  'http://localhost:3000',
  'http://192.168.0.199',
  'http://192.168.0.199:3000'
];

/**
 * Merge user-supplied origins (comma-separated list in CORS_ORIGIN env)
 * with the defaults so we support both direct LAN access AND the public
 * hostname served by the reverse proxy.
 */
const extraOrigins =
  process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean)
    : [];
const ALLOWED_ORIGINS = [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...extraOrigins])];

app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  })
);

// ------------------------------------------------------------
// Debug helper – log real client IP & forwarded header
// ------------------------------------------------------------
app.use((req, _res, next) => {
  // Logs will only be visible when LOG_LEVEL includes 'debug'
  if (typeof logger.debug === 'function') {
    logger.debug(
      `Incoming request from ${req.ip}. x-forwarded-for=${
        req.headers['x-forwarded-for'] || 'N/A'
      }`
    );
  }
  next();
});

/**
 * NOTE: Request rate-limiting has been temporarily disabled because the upstream
 * `express-rate-limit` package enforces a strict proxy-validation rule that is
 * incompatible with our reverse-proxy setup and was preventing the server from
 * starting.  Re-enable a limiter later once a compatible configuration or
 * alternative library is chosen.
 */

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

// Middleware to ensure wallet service is initialized for protected routes
const ensureWalletInitialized = (req, res, next) => {
  if (!walletService.isInitialized) {
    return res.status(503).json({
      success: false,
      message: 'Wallet service is not initialized. Please check server logs.'
    });
  }
  next();
};

// Middleware to ensure both wallet and contract services are initialized for protected routes
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
  ensureWalletInitialized, // only wallet is required for deployment
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

// ---------------------------------------------------------------------------
// Front-end static file handling
// ---------------------------------------------------------------------------
// 1. Prefer the React build generated by CRA located in client/react-app/build
// 2. Fall back to the previous “client/build” directory (legacy)
// 3. If no build exists, try the old dashboard.html
// ---------------------------------------------------------------------------

const reactBuildPath   = path.join(__dirname, 'client', 'react-app', 'build');
const legacyBuildPath  = path.join(__dirname, 'client', 'build');
// Stand-alone HTML dashboard (legacy interim UI)
const dashboardPath    = path.join(__dirname, 'client', 'dashboard.html');

function serveSpa(buildPath) {
  // Serve static assets
  app.use(express.static(buildPath));
  // Return index.html for all non-API routes (client-side routing support)
  app.get('*', (req, res, next) => {
    // If the request starts with /api we pass through to the next middleware
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

if (fs.existsSync(reactBuildPath)) {
  logger.info('Serving React build from client/react-app/build');
  serveSpa(reactBuildPath);
} else if (fs.existsSync(legacyBuildPath)) {
  logger.info('Serving legacy build from client/build');
  serveSpa(legacyBuildPath);
} else {
  /**
   * Serve standalone dashboard if it exists.
   * This allows basic contract deployment & management before
   * a full React build is available.
   */
  if (fs.existsSync(dashboardPath)) {
    // Dedicated route so users can always access the dashboard directly
    app.get('/dashboard', (req, res) => {
      res.sendFile(dashboardPath);
    });

    // Default root points to the dashboard as well
    app.get('/', (req, res) => {
      res.sendFile(dashboardPath);
    });
  } else {
    // Plain HTML fallback when neither build nor dashboard are present
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
              <li>Your <code>.env</code> file is properly configured with <code>WALLET_PASSWORD</code> or you've created a <code>.wallet_password</code> file.</li>
              <li>You've placed the <code>dashboard.html</code> file in the <code>client</code> directory.</li>
            </ol>
            <p>Once these steps are complete, restart the server and navigate to <a href="/dashboard">/dashboard</a>.</p>
          </div>
        </div>
      </body>
      </html>
      `);
    });
  }
}

// Function to get the wallet password from file or environment variable
const getWalletPassword = () => {
  try {
    // Try to read from .wallet_password file first
    const passwordFilePath = process.env.WALLET_PASSWORD_FILE || '.wallet_password';
    if (fs.existsSync(passwordFilePath)) {
      const rawPassword = fs.readFileSync(passwordFilePath, 'utf8');
      // Log password details for debugging (length and hex representation)
      if (typeof logger.debug === 'function') {
        logger.debug(`Read password from file. Raw length: ${rawPassword.length}`);
        logger.debug(`Password hex: ${Buffer.from(rawPassword).toString('hex')}`);
      }
      
      // Trim the password to avoid whitespace issues
      const trimmedPassword = rawPassword.trim();
      if (typeof logger.debug === 'function') {
        logger.debug(`Trimmed password length: ${trimmedPassword.length}`);
      }
      
      return trimmedPassword;
    }
    
    // Fall back to environment variable
    if (process.env.WALLET_PASSWORD) {
      const envPassword = process.env.WALLET_PASSWORD.trim();
      if (typeof logger.debug === 'function') {
        logger.debug(`Using password from environment variable. Length: ${envPassword.length}`);
      }
      return envPassword;
    }
    
    throw new Error('Wallet password not found in file or environment variables');
  } catch (error) {
    logger.error('Error reading wallet password:', error);
    throw error;
  }
};

// Start server function
const startServer = async () => {
  try {
    // Initialize wallet service
    const walletPassword = getWalletPassword();
    await walletService.initialize(walletPassword);
    logger.info('Wallet service initialized successfully');
    
    // Try to initialize contract service if address is available
    try {
      await contractService.initialize(walletService.getSigner());
      logger.info('Contract service initialized successfully');
    } catch (error) {
      logger.warn('Contract service initialization skipped:', error.message);
      logger.info('You can deploy a new contract through the admin interface');
    }
    
    // Start server
    const HOST = '0.0.0.0'; // bind to all interfaces so LAN devices can reach the server
    app.listen(PORT, HOST, () => {
      const localIP = process.env.LOCAL_IP || '192.168.0.199';
      logger.info('SwagTix Admin Interface running and accessible at:');
      logger.info(`  Local:   http://localhost:${PORT}`);
      logger.info(`  Network: http://${localIP}:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app; // Export for testing
