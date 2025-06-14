#!/bin/bash

# deploy-live.sh
# Automates the deployment of the SwagTix Admin Interface on the live server.
# This script pulls the latest changes from GitHub, copies necessary files,
# installs dependencies, and restarts the PM2 service.

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
# Path to your Git repository on the server (where you pull changes)
REPO_DIR="$HOME/swagtix"
# Path to your deployed application directory (where the server runs from)
APP_DIR="/opt/swagtix/app"
# PM2 process name
PM2_APP_NAME="swagtix-admin"
# Path to React admin interface inside the repo
REACT_SRC_DIR="$REPO_DIR/master-wallet/admin-interface/client/react-app"
# Final location of the compiled React build on the live server
REACT_BUILD_DIR="$APP_DIR/client/build"

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

# Function to handle errors and exit
handle_error() {
  log_error "Deployment failed at step: $1"
  exit 1
}

# --- Main Deployment Process ---

log_info "Starting SwagTix Admin Interface deployment..."

# 1. Navigate to repository and pull latest changes
log_info "Navigating to repository directory: $REPO_DIR"
if [ ! -d "$REPO_DIR" ]; then
  handle_error "Repository directory not found at $REPO_DIR. Please clone it first."
fi
cd "$REPO_DIR" || handle_error "Failed to change directory to $REPO_DIR"

log_info "Pulling latest changes from Git..."
git pull origin main || handle_error "Git pull failed"
log_success "Latest changes pulled successfully."

# 1.5 Build / update the React admin interface
if [ -d "$REACT_SRC_DIR" ]; then
  log_info "Installing React frontend dependencies..."
  cd "$REACT_SRC_DIR" || handle_error "Cannot cd to $REACT_SRC_DIR"

  # Decide whether to run npm ci or npm install
  # Use npm ci only when both node_modules **and** package-lock.json exist
  # This avoids the first-time deployment failure when node_modules exists
  # (e.g., copied from an earlier incomplete run) but the lock-file is missing.
  if [[ -f "package-lock.json" && -d "node_modules" ]]; then
    log_info "package-lock.json and node_modules found – running npm ci"
    npm ci --silent || handle_error "npm ci failed for React app"
  else
    log_info "Running npm install (first-time or lockfile missing)"
    npm install --silent || handle_error "npm install failed for React app"
  fi

  log_info "Building React frontend…"
  npm run build --silent || handle_error "React build failed"
  log_success "React frontend built successfully."
  cd "$REPO_DIR" || handle_error "Failed to return to $REPO_DIR"
else
  log_warn "React source directory not found at $REACT_SRC_DIR – skipping frontend build."
fi

# 2. Copy updated files to the deployment location
log_info "Copying updated files to deployment directory: $APP_DIR"

# Create necessary subdirectories in APP_DIR if they don't exist
sudo mkdir -p "$APP_DIR/abis" || handle_error "Failed to create $APP_DIR/abis"
sudo mkdir -p "$APP_DIR/services" || handle_error "Failed to create $APP_DIR/services"
sudo mkdir -p "$APP_DIR/utils" || handle_error "Failed to create $APP_DIR/utils"
sudo mkdir -p "$APP_DIR/client" || handle_error "Failed to create $APP_DIR/client"

# Copy React build (if it was built)
if [ -d "$REACT_SRC_DIR/build" ]; then
  log_info "Deploying React frontend to $REACT_BUILD_DIR"
  sudo rm -rf "$REACT_BUILD_DIR"
  sudo mkdir -p "$REACT_BUILD_DIR"
  sudo cp -r "$REACT_SRC_DIR/build/"* "$REACT_BUILD_DIR/" || handle_error "Failed to copy React build"
  log_success "React frontend deployed."
fi

# Copy backend files
sudo cp "$REPO_DIR/master-wallet/admin-interface/server.js" "$APP_DIR/" || handle_error "Failed to copy server.js"
sudo cp "$REPO_DIR/master-wallet/admin-interface/services/walletService.js" "$APP_DIR/services/" || handle_error "Failed to copy walletService.js"
sudo cp "$REPO_DIR/master-wallet/admin-interface/services/contractService.js" "$APP_DIR/services/" || handle_error "Failed to copy contractService.js"
sudo cp "$REPO_DIR/master-wallet/admin-interface/utils/logger.js" "$APP_DIR/utils/" || handle_error "Failed to copy logger.js"
sudo cp "$REPO_DIR/master-wallet/admin-interface/abis/EventTicket1155.json" "$APP_DIR/abis/" || handle_error "Failed to copy EventTicket1155.json"
sudo cp "$REPO_DIR/master-wallet/admin-interface/client/dashboard.html" "$APP_DIR/client/" || handle_error "Failed to copy dashboard.html"
sudo cp "$REPO_DIR/master-wallet/admin-interface/start.sh" "$APP_DIR/" || handle_error "Failed to copy start.sh"
sudo cp "$REPO_DIR/master-wallet/admin-interface/.env" "$APP_DIR/" || log_warn "No .env file found in repo, ensure it's configured in $APP_DIR"
sudo cp "$REPO_DIR/master-wallet/admin-interface/ecosystem.config.js" "$APP_DIR/" || log_warn "No ecosystem.config.js found in repo, ensure it's configured in $APP_DIR"

log_success "Files copied to $APP_DIR."

# 3. Set proper file permissions
log_info "Setting file permissions..."
sudo chown -R swagtix:swagtix "$APP_DIR" || handle_error "Failed to set ownership for $APP_DIR"
sudo chmod 644 "$APP_DIR/server.js" || handle_error "Failed to set permissions for server.js"
sudo chmod 644 "$APP_DIR/services/walletService.js" || handle_error "Failed to set permissions for walletService.js"
sudo chmod 644 "$APP_DIR/services/contractService.js" || handle_error "Failed to set permissions for contractService.js"
sudo chmod 644 "$APP_DIR/utils/logger.js" || handle_error "Failed to set permissions for logger.js"
sudo chmod 644 "$APP_DIR/abis/EventTicket1155.json" || handle_error "Failed to set permissions for EventTicket1155.json"
sudo chmod 644 "$APP_DIR/client/dashboard.html" || handle_error "Failed to set permissions for dashboard.html"
sudo chmod 755 "$APP_DIR/start.sh" || handle_error "Failed to set permissions for start.sh"
log_success "File permissions set."

# 4. Install/Update Node.js dependencies
log_info "Navigating to application directory for npm install: $APP_DIR"
cd "$APP_DIR" || handle_error "Failed to change directory to $APP_DIR"

log_info "Installing/updating Node.js dependencies..."
npm install || handle_error "npm install failed"
log_success "Node.js dependencies installed."

# 5. Restart the PM2 service
log_info "Restarting PM2 service: $PM2_APP_NAME"
# Use the start.sh script to handle password and PM2 restart
"$APP_DIR/start.sh" || handle_error "Failed to restart PM2 service via start.sh"
log_success "PM2 service restarted. Check logs for status: pm2 logs $PM2_APP_NAME"

log_success "SwagTix Admin Interface deployment complete!"
log_info "Access your admin interface at http://your_private_ip:3000/dashboard"
log_info "Remember to update the bytecode in $APP_DIR/abis/EventTicket1155.json if you haven't already."
log_info "Also, ensure your wallet password is correctly set in $APP_DIR/.wallet_password or start.sh."
