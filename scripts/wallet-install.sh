#!/bin/bash

# wallet-install.sh
# Helper script for installing and building the SwagTix wallet
# Handles Yarn installation, dependency management, and build process

# Exit immediately if a command exits with a non-zero status
set -e

# --- Colors for output ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Functions ---
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1" >&2
}

# --- Configuration ---
# Resolve repository directory relative to this script’s location so it works
# the same whether run with sudo or as a normal user.
SCRIPT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Repo root is one directory up from scripts/
REPO_DIR="$(realpath "${SCRIPT_DIR}/..")"

# Path to the wallet directory
WALLET_DIR="$REPO_DIR/wallet"
# Build type (pro, dev, debug)
BUILD_TYPE="pro"
# Force-npm flag (fallback if Yarn unavailable)
USE_NPM=""

# Parse command line arguments
for arg in "$@"; do
  case $arg in
    --dev)
      BUILD_TYPE="dev"
      shift
      ;;
    --debug)
      BUILD_TYPE="debug"
      shift
      ;;
    --pro)
      BUILD_TYPE="pro"
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [--dev|--debug|--pro]"
      echo "  --dev     Build development version"
      echo "  --debug   Build debug version"
      echo "  --pro     Build production version (default)"
      echo "  -h, --help Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg"
      echo "Run with -h for help."
      exit 1
      ;;
  esac
done

# If executed via sudo remember the invoking user’s home for Yarn global install
ORIG_USER="${SUDO_USER:-$USER}"
ORIG_HOME="$(eval echo "~${ORIG_USER}")"

# Helper that prefixes sudo only when needed
need_sudo() {
  if [ "$(id -u)" -ne 0 ]; then
    sudo "$@"
  else
    "$@"
  fi
}

# --- Main Script ---
log_info "Starting SwagTix wallet installation and build process..."

# Warn if Node version is lower than recommended
NODE_MAJOR="$(node -v | cut -d. -f1 | tr -d 'v')"
if [ "$NODE_MAJOR" -lt 18 ]; then
  log_warn "Detected Node.js v$(node -v). Some wallet dependencies expect Node >=18."
  log_warn "Proceeding by ignoring engine checks during installation."
fi

# Check if wallet directory exists
if [ ! -d "$WALLET_DIR" ]; then
  log_error "Wallet directory not found at $WALLET_DIR"
  log_info "Please make sure you've cloned the repository correctly"
  exit 1
fi

# 1. Check for Yarn
log_info "Checking for Yarn installation..."
if [ -z "$USE_NPM" ] && ! command -v yarn >/dev/null 2>&1; then
  log_info "Yarn not found. Installing Yarn..."
  
  # Try corepack (bundled with modern Node versions) first
  if command -v corepack >/dev/null 2>&1; then
    need_sudo corepack enable yarn
  else
    # Fallback to npm global install
    if ! command -v npm >/dev/null 2>&1; then
      log_error "npm is not installed. Please install Node.js and npm first."
      exit 1
    fi
    need_sudo npm install -g yarn
  fi

  if ! command -v yarn >/dev/null 2>&1; then
    log_warn "Automatic Yarn installation failed."
    log_warn "Either install Yarn manually or rerun with --use-npm to fall back to npm."
    exit 1
  fi

  log_success "Yarn installed successfully: $(yarn --version)"
else
  log_success "Yarn is already installed: $(yarn --version)"
fi

# Navigate to wallet directory
log_info "Navigating to wallet directory: $WALLET_DIR"
cd "$WALLET_DIR" || exit 1

# 3. Clean node_modules and yarn cache
log_info "Cleaning previous installations..."
if [ -d "node_modules" ]; then
  log_info "Removing node_modules directory..."
  rm -rf node_modules
fi

# ------------------------------------------------------------------
# 3.5 Enhanced network test – ensure we can reach the Yarn registry
# ------------------------------------------------------------------
YARN_REGISTRY_URL="https://registry.yarnpkg.com"
CURL_VERBOSE_OUTPUT_FILE="/tmp/yarn_registry_curl_verbose.log"
log_info "Checking connectivity to Yarn registry ($YARN_REGISTRY_URL)..."

# Check for proxy environment variables
PROXY_ENV_VARS_SET=0
if [ -n "$HTTP_PROXY" ] || [ -n "$HTTPS_PROXY" ] || [ -n "$http_proxy" ] || [ -n "$https_proxy" ]; then
  PROXY_ENV_VARS_SET=1
  log_warn "Proxy environment variables (HTTP_PROXY/HTTPS_PROXY) are set."
  log_warn "If connectivity fails, ensure your proxy settings are correct and allow access to $YARN_REGISTRY_URL."
  log_warn "You might need to configure Yarn or npm to use this proxy."
fi

# Primary connectivity check (follow redirects, silent, get HTTP status code)
HTTP_STATUS_CODE=$(curl -L --connect-timeout 10 --silent --output /dev/null --write-out "%{http_code}" "$YARN_REGISTRY_URL")

if [ "$HTTP_STATUS_CODE" -eq 200 ]; then
  log_success "Yarn registry reachable (HTTP $HTTP_STATUS_CODE)."
else
  log_warn "Initial connectivity check to $YARN_REGISTRY_URL failed (HTTP $HTTP_STATUS_CODE)."
  
  log_info "Running verbose connectivity test. Output will be in $CURL_VERBOSE_OUTPUT_FILE"
  if curl -L -v --connect-timeout 15 "$YARN_REGISTRY_URL" --output /dev/null 2>"$CURL_VERBOSE_OUTPUT_FILE"; then
    log_warn "Verbose test command succeeded, but the initial status code was not 200. This is unusual."
    log_warn "Please check $CURL_VERBOSE_OUTPUT_FILE for details."
  else
    log_error "Verbose connectivity test also failed. Please check $CURL_VERBOSE_OUTPUT_FILE for detailed curl logs."
  fi

  log_info "Attempting insecure connectivity test (ignoring SSL certificate issues)..."
  HTTP_STATUS_CODE_INSECURE=$(curl -L -k --connect-timeout 10 --silent --output /dev/null --write-out "%{http_code}" "$YARN_REGISTRY_URL")
  if [ "$HTTP_STATUS_CODE_INSECURE" -eq 200 ]; then
    log_warn "Connection to $YARN_REGISTRY_URL succeeded with -k (insecure SSL)."
    log_warn "This might indicate an SSL certificate issue on your server, network, or an intermediate proxy."
    log_warn "This is NOT recommended for production and is only for diagnosis."
  else
    log_warn "Insecure connectivity test also failed (HTTP $HTTP_STATUS_CODE_INSECURE)."
  fi

  log_error "Unable to reliably reach $YARN_REGISTRY_URL."
  log_info "Please verify internet connectivity, DNS resolution, firewall rules, and proxy settings."
  exit 1
fi

log_info "Cleaning Yarn cache for this project..."
yarn cache clean

# 4. Install dependencies
if [ -n "$USE_NPM" ]; then
  log_info "Installing wallet dependencies using npm (legacy-peer-deps)..."
  npm install --legacy-peer-deps
else
  log_info "Installing wallet dependencies using Yarn..."
  # --ignore-engines skips strict Node-engine checks (work-around for servers running Node <18)
  # Capture output so we can print helpful diagnostics on failure
  if ! yarn install --ignore-engines; then
    log_error "yarn install failed."
    log_warn "Common causes:"
    log_warn "  • Temporary outage on registry.yarnpkg.com (retry in a few minutes)"
    log_warn "  • Corporate proxy / firewall blocking the registry"
    log_warn "  • Intermittent network connection"
    log_warn ""
    log_info "Troubleshooting tips:"
    log_info "  1. Re-run this script with: yarn install --ignore-engines --network-timeout 100000"
    log_info "  2. Configure proxy for Yarn: yarn config set https-proxy http://<proxy>:<port>"
    log_info "  3. Try installing just the problematic package manually to identify the issue."
    exit 1
  fi
fi

# 5. Build the wallet
log_info "Building wallet (${BUILD_TYPE} build)..."
if [ -n "$USE_NPM" ]; then
  npm run "build:${BUILD_TYPE}"
else
  yarn "build:${BUILD_TYPE}"
fi

log_success "Wallet built successfully!"
log_info "Build output is available in: $WALLET_DIR/dist"

# Provide next steps
log_info ""
log_info "Next steps:"
log_info "1. Copy the wallet build to your deployment directory"
log_info "2. Configure your environment variables in .env"
log_info "3. Start the server using PM2 or your preferred method"

exit 0
