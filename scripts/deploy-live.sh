#!/bin/bash

# deploy-live.sh
# Automates the deployment of the SwagTix Admin Interface on the live server.
# This script pulls the latest changes from GitHub, copies necessary files,
# installs dependencies, and restarts the PM2 service.

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Command-line flags -------------------------------------------------------
# -s | --simple : Skip React build/deploy (backend + plain HTML only)

# Default
SKIP_REACT=""

for arg in "$@"; do
  case $arg in
    -s|--simple)
      SKIP_REACT="1"
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [-s|--simple]"
      echo "  -s, --simple   Deploy backend & standalone dashboard only (skip React build)"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg"
      echo "Run with -h for help."
      exit 1
      ;;
  esac
done

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

if [ -n "$SKIP_REACT" ]; then
  log_info "Running in SIMPLE mode (React build skipped)."
fi

# 1. Navigate to repository and pull latest changes
log_info "Navigating to repository directory: $REPO_DIR"
if [ ! -d "$REPO_DIR" ]; then
  handle_error "Repository directory not found at $REPO_DIR. Please clone it first."
fi
cd "$REPO_DIR" || handle_error "Failed to change directory to $REPO_DIR"

log_info "Pulling latest changes from Git..."
git pull origin main || handle_error "Git pull failed"
log_success "Latest changes pulled successfully."

# --- NPM diagnostics (run once early) ---
if ! command -v npm >/dev/null 2>&1; then
  handle_error "npm is not installed or not in PATH. Aborting."
fi
log_info "Using npm version: $(npm -v)"

# Helper for running npm with verbose error capture
run_npm_cmd() {
  local DESC="$1"
  shift
  log_info "Running: $*"
  if ! OUTPUT=$("$@" 2>&1); then
    echo "$OUTPUT" >&2
    handle_error "$DESC – command failed"
  fi
}

# ---------------------------------------------------------------------------
# 1.5 Build / update the React admin interface
# ---------------------------------------------------------------------------

# If user requested SIMPLE mode, skip React handling entirely.
if [ -n "$SKIP_REACT" ]; then
  log_warn "SKIP_REACT flag set – skipping React build."

# Otherwise, proceed only if the React source directory exists
elif [ -d "$REACT_SRC_DIR" ]; then
  log_info "Installing React frontend dependencies..."
  cd "$REACT_SRC_DIR" || handle_error "Cannot cd to $REACT_SRC_DIR"

  # Decide whether to run npm ci or npm install
  # Use npm ci only when both node_modules **and** package-lock.json exist
  # This avoids the first-time deployment failure when node_modules exists
  # (e.g., copied from an earlier incomplete run) but the lock-file is missing.
  if [[ -f "package-lock.json" && -d "node_modules" ]]; then
    log_info "package-lock.json and node_modules found – running npm ci"
    run_npm_cmd "npm ci for React app" npm ci --silent
  else
    log_info "Running npm install (first-time or lockfile missing)"
    run_npm_cmd "npm install for React app" npm install --silent
  fi

  log_info "Building React frontend…"
  run_npm_cmd "React build" npm run build --silent
  log_success "React frontend built successfully."
  cd "$REPO_DIR" || handle_error "Failed to return to $REPO_DIR"

# React directory not found
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

# ---------------------------------------------------------------------------
# 2.1 Ensure network configuration inside .env
# ---------------------------------------------------------------------------
# The backend prints its LAN URL in logs and sets default CORS rules based on
# LOCAL_IP.  Make sure this value matches the server’s static LAN address
# (192.168.0.199 in our case).  If an .env does not yet exist, create a minimal
# one so the server can start with sensible defaults.

log_info "Ensuring .env has correct LOCAL_IP and CORS_ORIGIN settings..."

ENV_FILE="$APP_DIR/.env"
TARGET_IP="192.168.0.199"

if [ -f "$ENV_FILE" ]; then
  # Update or append LOCAL_IP
  if grep -q '^LOCAL_IP=' "$ENV_FILE"; then
    sudo sed -i "s/^LOCAL_IP=.*/LOCAL_IP=${TARGET_IP}/" "$ENV_FILE"
  else
    echo "LOCAL_IP=${TARGET_IP}" | sudo tee -a "$ENV_FILE" >/dev/null
  fi

  # Update or append CORS_ORIGIN to include the LAN address
  if grep -q '^CORS_ORIGIN=' "$ENV_FILE"; then
    sudo sed -i "s/^CORS_ORIGIN=.*/CORS_ORIGIN=http:\/\/localhost:3000,http:\/\/${TARGET_IP}:3000/" "$ENV_FILE"
  else
    echo "CORS_ORIGIN=http://localhost:3000,http://${TARGET_IP}:3000" | sudo tee -a "$ENV_FILE" >/dev/null
  fi
  log_success ".env updated with LOCAL_IP=${TARGET_IP}"
else
  # Create a minimal .env if none exists
  sudo bash -c "cat > \"$ENV_FILE\" <<EOF
# Auto-generated by deploy-live.sh
LOCAL_IP=${TARGET_IP}
CORS_ORIGIN=http://localhost:3000,http://${TARGET_IP}:3000
EOF"
  log_success "Created new .env with LOCAL_IP=${TARGET_IP}"
fi

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
