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
const multer = require('multer'); // Import multer

// Import services and logger
const walletService = require('./services/walletService');
const contractService = require('./services/contractService');
const logger = require('./utils/logger');
const NFTStorageService = require('./services/nftStorageService'); // Import NFTStorageService
// QR-code (ticket) generation
const createQrCodeService = require('./services/qrCodeService');   // factory returns instance

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
/**
 * --------------------------------------------------------------------------
 * Helmet security middleware
 * --------------------------------------------------------------------------
 * We replace Helmet's restrictive CSP with our own permissive one that
 * explicitly allows unsafe-eval and unsafe-inline for our development
 * environment. This is needed for React and various libraries.
 */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", "wss:", "ws:", "http:", "https:"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"],
      },
    },
  })
);
/**
 * CORS configuration
 * ------------------------------------------------------------------
 *  - If an explicit CORS_ORIGIN env var is supplied we use that.
 *  - Otherwise we default-allow the local dev hostnames AND
 *    the static LAN address 192.168.0.143 so the dashboard can
 *    be reached from other devices on the network without manual
 *    re-configuration.
 */
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost',
  'http://localhost:3000',
  'http://192.168.0.143',
  'http://192.168.0.143:3000'
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
 * --------------------------------------------------------------------------
 * Rate limiting
 * --------------------------------------------------------------------------
 * We previously attempted to use `express-rate-limit`, however version ≥7
 * throws `ERR_ERL_PERMISSIVE_TRUST_PROXY` when `app.set('trust proxy', true)`
 * (or other permissive values) is detected – a configuration that is
 * required for our Nginx reverse-proxy setup.
 *
 * Until we migrate to a proxy-aware alternative or configure stricter IP
 * validation, **rate limiting is disabled**.  Do **NOT** re-introduce
 * express-rate-limit without first verifying proxy safety.
 */

// Logging
app.use(morgan('combined', { stream: accessLogStream }));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for in-memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Initialize NFT.storage service
const nftStorageService = new NFTStorageService();
if (process.env.NFT_STORAGE_API_KEY) {
  try {
    nftStorageService.initialize();
    logger.info('NFT.storage service initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize NFT.storage service:', error);
  }
}

// Initialise QR-code service (depends on NFT.storage; still works if key missing)
const qrCodeService = createQrCodeService(nftStorageService);

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
        message: error.message,
        error: {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
        }
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
      
      logger.info('Minting tickets:', req.body);
      const result = await contractService.mintTickets(
        to, 
        amount, 
        eventTimestamp, 
        qrCodeUri, 
        mediaUri
      );
      
      res.json({
        success: true,
        message: `Successfully minted ${amount} tickets`,
        data: result
      });
    } catch (error) {
      logger.error('Minting failed:', error);
      res.status(500).json({
        success: false,
        message: `Minting failed: ${error.message}`,
        error: {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
        }
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

/**
 * Contract API Routes
 */
app.get('/api/v1/contract/status', (req, res) => {
  try {
    const status = contractService.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting contract status:', error);
    res.status(500).json({
      success: false,
      message: `Error getting contract status: ${error.message}`
    });
  }
});

app.post('/api/contract/deploy', async (req, res) => {
  try {
    logger.info('Deploying contract...');
    const result = await contractService.deployEventTicketContract();
    logger.info('Contract deployment successful:', result);
    res.json({
      success: true,
      message: 'Contract deployed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Contract deployment failed:', error);
    res.status(500).json({
      success: false,
      message: `Contract deployment failed: ${error.message}`,
      error: {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
      }
    });
  }
});

app.post('/api/contract/mint', async (req, res) => {
  try {
    const { to, amount, eventTimestamp, qrCodeUri, mediaUri } = req.body;
    
    if (!to || !amount || !eventTimestamp || !qrCodeUri || !mediaUri) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }
    
    logger.info('Minting tickets:', req.body);
    const result = await contractService.mintTickets(
      to, 
      amount, 
      eventTimestamp, 
      qrCodeUri, 
      mediaUri
    );
    
    res.json({
      success: true,
      message: `Successfully minted ${amount} tickets`,
      data: result
    });
  } catch (error) {
    logger.error('Minting failed:', error);
    res.status(500).json({
      success: false,
      message: `Minting failed: ${error.message}`,
      error: {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
      }
    });
  }
});

// --- NFT Storage Routes ---
app.post('/api/storage/upload', upload.single('file'), async (req, res) => {
  try {
    if (!nftStorageService.isInitialized()) {
      nftStorageService.initialize(); // Attempt to initialize if not already
    }
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const description = req.body.description || 'Uploaded with SwagTix';
    
    logger.info(`Processing file upload: ${fileName}`);
    const result = await nftStorageService.uploadImage(fileBuffer, fileName, description);
    
    res.json({
      success: true,
      message: 'File uploaded to IPFS successfully',
      data: result
    });
  } catch (error) {
    logger.error('File upload failed:', error);
    res.status(500).json({
      success: false,
      message: `File upload failed: ${error.message}`
    });
  }
});

// --- QR-code Routes ----------------------------------------------------------
// Generate a single QR-code and return a data-URL (base64 png)
app.post('/api/qrcode/generate', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text) {
      return res.status(400).json({ success: false, message: 'Parameter "text" is required' });
    }
    const buffer = await qrCodeService.generateQRCode(text);
    const dataUrl = `data:image/png;base64,${buffer.toString('base64')}`;
    res.json({ success: true, dataUrl });
  } catch (err) {
    logger.error('QR-code generation failed:', err);
    res.status(500).json({ success: false, message: `QR-code generation failed: ${err.message}` });
  }
});

// Generate a batch of QR codes for tickets (and optionally upload to IPFS)
app.post('/api/qrcode/batch', async (req, res) => {
  try {
    const { baseUrl, startId, count } = req.body || {};
    if (!baseUrl || !startId || !count) {
      return res.status(400).json({
        success: false,
        message: 'Parameters "baseUrl", "startId" and "count" are required'
      });
    }
    const result = await qrCodeService.generateQRCodesForTickets(baseUrl, Number(startId), Number(count));
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error('Batch QR-code generation failed:', err);
    res.status(500).json({ success: false, message: `Batch QR-code generation failed: ${err.message}` });
  }
});

app.post('/api/storage/metadata', async (req, res) => {
  try {
    if (!nftStorageService.isInitialized()) {
      nftStorageService.initialize(); // Attempt to initialize if not already
    }
    const { metadata } = req.body;
    
    if (!metadata) {
      return res.status(400).json({
        success: false,
        message: 'No metadata provided'
      });
    }
    
    logger.info('Processing metadata upload');
    const result = await nftStorageService.uploadMetadata(metadata);
    
    res.json({
      success: true,
      message: 'Metadata uploaded to IPFS successfully',
      data: result
    });
  } catch (error) {
    logger.error('Metadata upload failed:', error);
    res.status(500).json({
      success: false,
      message: `Metadata upload failed: ${error.message}`
    });
  }
});

// Start the server
function startServer() {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

// Initialize services and start server
async function init() {
  try {
    // Initialize wallet service
    await walletService.initialize();
    
    // Initialize contract service
    await contractService.initialize();
    
    // Start the server
    startServer();
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// If this file is run directly, initialize and start the server
if (require.main === module) {
  init();
}

// Export for testing
module.exports = app;
