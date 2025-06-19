#!/bin/bash

# deploy-live.sh
# Comprehensive deployment script for SwagTix NFT Ticket Platform
# This script handles the complete deployment process including:
# - Pulling latest code
# - Installing dependencies
# - Building components
# - Setting up environment variables
# - Configuring services
# - Restarting services

# Exit immediately if a command exits with a non-zero status
set -e

# --- Command-line flags -------------------------------------------------------
# -s | --simple : Skip React build/deploy (backend + plain HTML only)
# -n | --no-mobile : Skip mobile app build
# -r | --rollback : Rollback to previous deployment if available

# Default configuration
SKIP_REACT=""
SKIP_MOBILE=""
DO_ROLLBACK=""

# Parse command line arguments
for arg in "$@"; do
  case $arg in
    -s|--simple)
      SKIP_REACT="1"
      shift
      ;;
    -n|--no-mobile)
      SKIP_MOBILE="1"
      shift
      ;;
    -r|--rollback)
      DO_ROLLBACK="1"
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [-s|--simple] [-n|--no-mobile] [-r|--rollback]"
      echo "  -s, --simple     Deploy backend & standalone dashboard only (skip React build)"
      echo "  -n, --no-mobile  Skip mobile app build"
      echo "  -r, --rollback   Rollback to previous deployment if available"
      echo "  -h, --help       Show this help message"
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
# Path to secure storage for wallet and sensitive data
SECURE_DIR="/opt/swagtix/secure"
# Path to backup directory
BACKUP_DIR="/opt/swagtix/backups"
# PM2 process name
PM2_APP_NAME="swagtix-admin"
# Path to React admin interface inside the repo
REACT_SRC_DIR="$REPO_DIR/master-wallet/admin-interface/client/react-app"
# Final location of the compiled React build on the live server
REACT_BUILD_DIR="$APP_DIR/client/react-app/build"
# Path to mobile app wrapper inside the repo
MOBILE_APP_DIR="$REPO_DIR/mobile-app"
# Target IP for .env configuration
TARGET_IP="192.168.0.143"
# Timestamp for backups
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

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
  
  if [ -d "$BACKUP_DIR/latest" ]; then
    log_warn "Would you like to rollback to the previous deployment? (y/n)"
    read -r answer
    if [[ "$answer" =~ ^[Yy]$ ]]; then
      rollback
    fi
  fi
  
  exit 1
}

# Function to create a backup of the current deployment
create_backup() {
  log_info "Creating backup of current deployment..."
  
  # Create backup directory
  mkdir -p "$BACKUP_DIR/$TIMESTAMP"
  
  # Backup app directory
  if [ -d "$APP_DIR" ]; then
    cp -r "$APP_DIR" "$BACKUP_DIR/$TIMESTAMP/"
    # Create/update 'latest' symlink
    rm -f "$BACKUP_DIR/latest"
    ln -s "$BACKUP_DIR/$TIMESTAMP" "$BACKUP_DIR/latest"
    log_success "Backup created at $BACKUP_DIR/$TIMESTAMP"
  else
    log_warn "No existing deployment to backup"
  fi
}

# Function to rollback to previous deployment
rollback() {
  if [ -d "$BACKUP_DIR/latest" ]; then
    log_info "Rolling back to previous deployment..."
    
    # Stop PM2 process
    if pm2 list | grep -q "$PM2_APP_NAME"; then
      pm2 stop "$PM2_APP_NAME" || log_warn "Failed to stop PM2 process"
      pm2 delete "$PM2_APP_NAME" || log_warn "Failed to delete PM2 process"
    fi
    
    # Restore from backup
    if [ -d "$BACKUP_DIR/latest/$APP_DIR" ]; then
      rm -rf "$APP_DIR"
      cp -r "$BACKUP_DIR/latest/$APP_DIR" "$(dirname "$APP_DIR")/"
      log_success "Restored app directory from backup"
    fi
    
    # Restart PM2 process
    cd "$APP_DIR" || handle_error "Failed to change directory to $APP_DIR"
    pm2 start ecosystem.config.js || handle_error "Failed to start PM2 process"
    pm2 save || log_warn "Failed to save PM2 process list"
    
    log_success "Rollback completed successfully"
  else
    log_error "No backup available for rollback"
    exit 1
  fi
}

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

# --- Rollback if requested ---
if [ -n "$DO_ROLLBACK" ]; then
  log_info "Rollback requested. Rolling back to previous deployment..."
  rollback
  exit 0
fi

# --- Main Deployment Process ---

log_info "Starting SwagTix NFT Ticket Platform deployment..."

# Create backup before proceeding
create_backup

if [ -n "$SKIP_REACT" ]; then
  log_info "Running in SIMPLE mode (React build skipped)."
fi

if [ -n "$SKIP_MOBILE" ]; then
  log_info "Mobile app build will be skipped."
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
log_info "Using node version: $(node -v)"

# ---------------------------------------------------------------------------
# 1.1 Build / update the main wallet (Rabby fork)
# ---------------------------------------------------------------------------
log_info "Installing and building main wallet (Rabby fork)..."
cd "$REPO_DIR/wallet" || handle_error "Cannot cd to $REPO_DIR/wallet"

# Check if yarn.lock exists, use yarn if available, otherwise npm
if [ -f "yarn.lock" ] && command -v yarn >/dev/null 2>&1; then
  log_info "Using yarn for wallet dependencies"
  run_npm_cmd "yarn install for main wallet" yarn install --silent
  run_npm_cmd "build for main wallet" yarn build:pro --silent
else
  log_info "Using npm for wallet dependencies"
  # Use legacy peer-deps to avoid strict peer-dependency resolution errors
  run_npm_cmd "npm install for main wallet" npm install --legacy-peer-deps --silent
  run_npm_cmd "build for main wallet" npm run build:pro --silent
fi

log_success "Main wallet built successfully."
cd "$REPO_DIR" || handle_error "Failed to return to $REPO_DIR"

# ---------------------------------------------------------------------------
# 1.2 Build / update the React admin interface
# ---------------------------------------------------------------------------
if [ -n "$SKIP_REACT" ]; then
  log_warn "SKIP_REACT flag set – skipping React build."
elif [ -d "$REACT_SRC_DIR" ]; then
  log_info "Installing React frontend dependencies..."
  cd "$REACT_SRC_DIR" || handle_error "Cannot cd to $REACT_SRC_DIR"

  # Decide whether to run npm ci or npm install
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
else
  log_warn "React source directory not found at $REACT_SRC_DIR – skipping frontend build."
fi

# ---------------------------------------------------------------------------
# 1.3 Build / update the mobile app wrapper
# ---------------------------------------------------------------------------
if [ -n "$SKIP_MOBILE" ]; then
  log_warn "SKIP_MOBILE flag set – skipping mobile app build."
elif [ -d "$MOBILE_APP_DIR" ]; then
  log_info "Installing and building mobile app wrapper..."
  cd "$MOBILE_APP_DIR" || handle_error "Cannot cd to $MOBILE_APP_DIR"
  run_npm_cmd "npm install for mobile app" npm install --silent
  run_npm_cmd "build for mobile app" npm run build --silent
  log_success "Mobile app wrapper built successfully."
  cd "$REPO_DIR" || handle_error "Failed to return to $REPO_DIR"
else
  log_warn "Mobile app directory not found at $MOBILE_APP_DIR – skipping mobile app build."
fi

# 2. Copy updated files to the deployment location
log_info "Copying updated files to deployment directory: $APP_DIR"

# Create necessary subdirectories in APP_DIR if they don't exist
sudo mkdir -p "$APP_DIR/abis" || handle_error "Failed to create $APP_DIR/abis"
sudo mkdir -p "$APP_DIR/services" || handle_error "Failed to create $APP_DIR/services"
sudo mkdir -p "$APP_DIR/utils" || handle_error "Failed to create $APP_DIR/utils"
sudo mkdir -p "$APP_DIR/client" || handle_error "Failed to create $APP_DIR/client"
sudo mkdir -p "$APP_DIR/client/react-app/build" || handle_error "Failed to create $APP_DIR/client/react-app/build"
sudo mkdir -p "$APP_DIR/client/www" || handle_error "Failed to create $APP_DIR/client/www"
sudo mkdir -p "$APP_DIR/secure" || handle_error "Failed to create $APP_DIR/secure"
sudo mkdir -p "$APP_DIR/logs" || handle_error "Failed to create $APP_DIR/logs"
sudo mkdir -p "$APP_DIR/temp/qrcodes" || handle_error "Failed to create $APP_DIR/temp/qrcodes"

# Copy React build (if it was built)
if [ -d "$REACT_SRC_DIR/build" ] && [ -z "$SKIP_REACT" ]; then
  log_info "Deploying React frontend to $REACT_BUILD_DIR"
  sudo rm -rf "$REACT_BUILD_DIR"/* # Clear existing build
  sudo cp -r "$REACT_SRC_DIR/build/"* "$REACT_BUILD_DIR/" || handle_error "Failed to copy React build"
  log_success "React frontend deployed."
else
  log_warn "Skipping React frontend deployment."
fi

# Copy mobile app www (if it was built)
if [ -d "$MOBILE_APP_DIR/www" ] && [ -z "$SKIP_MOBILE" ]; then
  log_info "Deploying mobile app web assets to $APP_DIR/client/www"
  sudo rm -rf "$APP_DIR/client/www"/* # Clear existing www
  sudo cp -r "$MOBILE_APP_DIR/www/"* "$APP_DIR/client/www/" || handle_error "Failed to copy mobile app www assets"
  log_success "Mobile app web assets deployed."
else
  log_warn "Mobile app www directory not found or skipped – skipping mobile app web assets deployment."
fi

# Copy backend files
log_info "Copying backend files..."
sudo cp "$REPO_DIR/master-wallet/admin-interface/server.js" "$APP_DIR/" || handle_error "Failed to copy server.js"
sudo cp "$REPO_DIR/master-wallet/admin-interface/services/walletService.js" "$APP_DIR/services/" || handle_error "Failed to copy walletService.js"
sudo cp "$REPO_DIR/master-wallet/admin-interface/services/contractService.js" "$APP_DIR/services/" || handle_error "Failed to copy contractService.js"
sudo cp "$REPO_DIR/master-wallet/admin-interface/services/nftStorageService.js" "$APP_DIR/services/" || handle_error "Failed to copy nftStorageService.js"
sudo cp "$REPO_DIR/master-wallet/admin-interface/services/qrCodeService.js" "$APP_DIR/services/" || handle_error "Failed to copy qrCodeService.js"
sudo cp "$REPO_DIR/master-wallet/admin-interface/utils/logger.js" "$APP_DIR/utils/" || handle_error "Failed to copy logger.js"
sudo cp "$REPO_DIR/master-wallet/admin-interface/abis/EventTicket1155.json" "$APP_DIR/abis/" || handle_error "Failed to copy EventTicket1155.json"
sudo cp "$REPO_DIR/master-wallet/admin-interface/start.sh" "$APP_DIR/" || handle_error "Failed to copy start.sh"
sudo cp -n "$REPO_DIR/master-wallet/admin-interface/.env.example" "$APP_DIR/.env" || log_warn "Skipped copying .env (already exists)"
sudo cp -n "$REPO_DIR/master-wallet/admin-interface/ecosystem.config.js" "$APP_DIR/" || log_warn "Skipped copying ecosystem.config.js (already exists)"

# 3. Update environment variables
log_info "Updating environment variables..."

# Check if .env file exists, if not create it from example
if [ ! -f "$APP_DIR/.env" ]; then
  sudo cp "$REPO_DIR/master-wallet/admin-interface/.env.example" "$APP_DIR/.env" || handle_error "Failed to create .env file"
fi

# Update LOCAL_IP and CORS_ORIGIN in .env
sudo sed -i "s/LOCAL_IP=.*/LOCAL_IP=$TARGET_IP/" "$APP_DIR/.env" || log_warn "Failed to update LOCAL_IP in .env"
sudo sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=http://localhost:3000,http://$TARGET_IP:3000|" "$APP_DIR/.env" || log_warn "Failed to update CORS_ORIGIN in .env"

# Check if NFT_STORAGE_API_KEY is set in .env
if ! grep -q "NFT_STORAGE_API_KEY=" "$APP_DIR/.env"; then
  log_warn "NFT_STORAGE_API_KEY not found in .env file."
  log_info "Please sign up for NFT.storage and add your API key to $APP_DIR/.env"
  echo "NFT_STORAGE_API_KEY=" | sudo tee -a "$APP_DIR/.env" > /dev/null
fi

# 4. Set permissions
log_info "Setting permissions..."
sudo chown -R swagtix:swagtix "$APP_DIR" || handle_error "Failed to set ownership on $APP_DIR"
sudo chmod +x "$APP_DIR/start.sh" || handle_error "Failed to set execute permission on start.sh"

# 5. Configure Nginx
log_info "Configuring Nginx..."

# Create Nginx configuration
NGINX_CONF="/etc/nginx/conf.d/swagtix-admin.conf"
sudo tee "$NGINX_CONF" > /dev/null << EOF
server {
    listen 80;
    server_name _;
    
    # Add permissive CSP headers for development
    add_header Content-Security-Policy "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';" always;
    
    # Serve static files directly from the build directory
    location ~* \.(css|js|html|png|jpg|jpeg|gif|ico|svg)$ {
        root /opt/swagtix/app/client/react-app/build;
        expires 1d;
        add_header Cache-Control "public, max-age=86400";
        try_files \$uri =404;
    }
    
    # Handle API requests
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Disable caching for API requests
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate";
        add_header Pragma "no-cache";
        expires off;
    }
    
    # Default location block
    location / {
        try_files \$uri \$uri/ @backend;
    }
    
    # If not found as a static file, proxy to Express
    location @backend {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Test and reload Nginx
sudo nginx -t || handle_error "Nginx configuration test failed"
sudo systemctl reload nginx || handle_error "Failed to reload Nginx"
log_success "Nginx configured and reloaded successfully."

# 6. Restart PM2 Service
log_info "Restarting PM2 service..."

# Navigate to app directory
cd "$APP_DIR" || handle_error "Failed to change directory to $APP_DIR"

# Stop and delete existing PM2 process if it exists
if pm2 list | grep -q "$PM2_APP_NAME"; then
  pm2 stop "$PM2_APP_NAME" || log_warn "Failed to stop PM2 process"
  pm2 delete "$PM2_APP_NAME" || log_warn "Failed to delete PM2 process"
fi

# Start the service using start.sh
pm2 start ecosystem.config.js || handle_error "Failed to start PM2 process"
pm2 save || log_warn "Failed to save PM2 process list"

log_success "PM2 service restarted successfully."

# 7. Post-Deployment Health Check
log_info "Performing post-deployment health check..."

# Wait a moment for the service to start
sleep 5

# Check if the API is responding
if curl -s "http://localhost:3000/api/status" | grep -q "success"; then
  log_success "API health check passed."
else
  log_warn "API health check failed. Please check the logs for more information."
  log_info "You can check the logs with: pm2 logs $PM2_APP_NAME"
fi

# 8. Final Instructions
log_info "Deployment completed successfully!"
log_info "Your SwagTix Admin Interface is now available at:"
log_info "  http://$TARGET_IP/"
log_info ""
log_info "Important next steps:"
log_info "1. Make sure your wallet is initialized and funded with PLS for gas."
log_info "2. Sign up for NFT.storage and add your API key to $APP_DIR/.env"
log_info "3. Deploy your EventTicket1155 contract through the admin interface."
log_info ""
log_info "To view logs: pm2 logs $PM2_APP_NAME"
log_info "To restart the service: pm2 restart $PM2_APP_NAME"
log_info "To rollback to previous deployment: $0 --rollback"

exit 0
