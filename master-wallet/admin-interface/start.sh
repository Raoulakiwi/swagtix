#!/bin/bash

# This script is used to start/restart the SwagTix Admin Interface
# It handles the wallet password setup for PM2 by creating a temporary password file.

# IMPORTANT: Replace 'your_wallet_password' with your actual wallet password.
# This password is used to decrypt the encrypted-wallet.json file.
# Use single quotes around the password if it contains special characters.
# Example: WALLET_PASSWORD='my!Secure@P4ssw0rd$'
WALLET_PASSWORD="your_wallet_password" 

# Path to your application directory
APP_DIR="/opt/swagtix/app"

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
  log_error "Script failed at step: $1"
  exit 1
}

# --- Main Script ---

log_info "Starting SwagTix Admin Interface..."

# 1. Navigate to the application directory
log_info "Navigating to application directory: $APP_DIR"
cd "$APP_DIR" || handle_error "Could not change to application directory $APP_DIR"

# 2. Check Node.js and npm installation
log_info "Verifying Node.js and npm installation..."
if ! command -v node >/dev/null 2>&1; then
  handle_error "Node.js is not installed or not in PATH. Please install it."
fi
if ! command -v npm >/dev/null 2>&1; then
  handle_error "npm is not installed or not in PATH. Please install it."
fi
log_info "Node.js version: $(node -v)"
log_info "npm version: $(npm -v)"
log_success "Node.js and npm verified."

# 3. Create a temporary password file
log_info "Creating temporary wallet password file..."
# Use printf to ensure no trailing newline
printf "%s" "$WALLET_PASSWORD" > .wallet_password || handle_error "Failed to create .wallet_password file"
chmod 600 .wallet_password || handle_error "Failed to set permissions for .wallet_password"
log_success "Temporary wallet password file created."

# 4. Stop and delete any existing PM2 process to guarantee a clean start
log_info "Checking for existing PM2 process: swagtix-admin"
if pm2 list | grep -q "swagtix-admin"; then
  log_info "Stopping existing PM2 process..."
  pm2 stop swagtix-admin || log_warn "Failed to stop existing PM2 process (might not be running)"
  pm2 delete swagtix-admin || log_warn "Failed to delete existing PM2 process (might not exist)"
  log_success "Existing PM2 process stopped and deleted."
else
  log_info "No existing PM2 process found."
fi

# 5. Start the application with PM2
log_info "Starting SwagTix Admin Interface with PM2..."
# The server.js will read the .wallet_password file
pm2 start server.js --name swagtix-admin || handle_error "Failed to start SwagTix Admin Interface with PM2"
log_success "SwagTix Admin Interface started with PM2."

# 6. Basic health-check to ensure the server is listening
log_info "Running post-startup health check..."
# Give the server a moment to start
sleep 5 
if curl -s --max-time 10 http://127.0.0.1:3000/api/status | grep -q '\"success\":true'; then
  log_success "Backend responded successfully on 127.0.0.1:3000"
else
  log_warn "Health check failed – backend did not respond on port 3000. Check PM2 logs for details."
  log_warn "You might still be able to access it via Nginx if that's configured correctly."
fi

log_success "SwagTix Admin Interface deployment process completed."
log_info "Check PM2 logs for detailed application output: pm2 logs swagtix-admin"
log_info "Access the admin interface via your configured Nginx proxy (e.g., http://your_private_ip/dashboard)"
log_info "Or directly via: http://your_private_ip:3000/dashboard"
log_info "Remember to update the bytecode in $APP_DIR/abis/EventTicket1155.json if you haven't already."
log_info "Also, ensure your wallet password is correctly set in this start.sh script."
