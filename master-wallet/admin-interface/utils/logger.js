const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Simple logger implementation
const logger = {
  info: (message, ...args) => {
    const timestamp = new Date().toISOString();
    console.log(`[INFO][${timestamp}] ${message}`, ...args);
  },
  warn: (message, ...args) => {
    const timestamp = new Date().toISOString();
    console.warn(`[WARN][${timestamp}] ${message}`, ...args);
  },
  error: (message, ...args) => {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR][${timestamp}] ${message}`, ...args);
  }
};

module.exports = logger;
