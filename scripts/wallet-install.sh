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
# Path to your Git repository on the server (where you pull changes)
REPO_DIR="$HOME/swagtix"
# Path to the wallet directory
WALLET_DIR="$REPO_DIR/wallet"
# Build type (pro, dev, debug)
BUILD_TYPE="pro"

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

# --- Main Script ---
log_info "Starting SwagTix wallet installation and build process..."

# Check if wallet directory exists
if [ ! -d "$WALLET_DIR" ]; then
  log_error "Wallet directory not found at $WALLET_DIR"
  log_info "Please make sure you've cloned the repository correctly"
  exit 1
fi

# 1. Check for Yarn
log_info "Checking for Yarn installation..."
if ! command -v yarn >/dev/null 2>&1; then
  log_info "Yarn not found. Installing Yarn..."
  
  # 2. Install Yarn if not present
  # First check if npm is available
  if ! command -v npm >/dev/null 2>&1; then
    log_error "npm is not installed. Please install Node.js and npm first."
    log_info "Visit https://nodejs.org/ for installation instructions"
    exit 1
  fi
  
  # Install Yarn using npm
  npm install -g yarn
  
  # Verify installation
  if ! command -v yarn >/dev/null 2>&1; then
    log_error "Failed to install Yarn. Please install it manually."
    exit 1
  fi
  
  log_success "Yarn installed successfully."
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

log_info "Cleaning Yarn cache for this project..."
yarn cache clean

# 4. Install dependencies with Yarn
log_info "Installing wallet dependencies using Yarn..."
yarn install

# 5. Build the wallet
log_info "Building wallet (${BUILD_TYPE} build)..."
yarn "build:${BUILD_TYPE}"

log_success "Wallet built successfully!"
log_info "Build output is available in: $WALLET_DIR/dist"

# Provide next steps
log_info ""
log_info "Next steps:"
log_info "1. Copy the wallet build to your deployment directory"
log_info "2. Configure your environment variables in .env"
log_info "3. Start the server using PM2 or your preferred method"

exit 0
