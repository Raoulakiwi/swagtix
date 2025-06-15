const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Minimal configurable logger.
 * Supported levels: error < warn < info < debug
 * Use environment variable LOG_LEVEL to control verbosity.
 *   - LOG_LEVEL=error : only errors
 *   - LOG_LEVEL=warn  : errors + warnings
 *   - LOG_LEVEL=info  : errors + warnings + info   (default)
 *   - LOG_LEVEL=debug : everything
 */

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel =
  LEVELS[(process.env.LOG_LEVEL || 'info').toLowerCase()] ?? LEVELS.info;

function shouldLog(level) {
  return LEVELS[level] <= currentLevel;
}

function format(level, message) {
  const ts = new Date().toISOString();
  return `[${level.toUpperCase()}][${ts}] ${message}`;
}

// Logger implementation
const logger = {
  error: (message, ...args) => {
    if (shouldLog('error')) console.error(format('error', message), ...args);
  },
  warn: (message, ...args) => {
    if (shouldLog('warn')) console.warn(format('warn', message), ...args);
  },
  info: (message, ...args) => {
    if (shouldLog('info')) console.log(format('info', message), ...args);
  },
  debug: (message, ...args) => {
    if (shouldLog('debug')) console.debug
      ? console.debug(format('debug', message), ...args)
      : console.log(format('debug', message), ...args);
  }
};

module.exports = logger;
