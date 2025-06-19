#!/bin/bash

# upgrade-node.sh
# Script to upgrade Node.js to v18.19.1 using nvm and configure memory settings
# This script will:
# 1. Install nvm (Node Version Manager) if not already installed
# 2. Install Node.js v18.19.1
# 3. Configure increased memory limits for Node.js
# 4. Update npm to the latest version

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

# Function to handle errors and exit
handle_error() {
  log_error "Error: $1"
  exit 1
}

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to add a line to a file if it doesn't already exist
add_to_file_if_not_exists() {
  local line="$1"
  local file="$2"
  
  if [ ! -f "$file" ]; then
    echo "$line" > "$file"
    return
  fi
  
  grep -qF -- "$line" "$file" || echo "$line" >> "$file"
}

# --- Main Script ---
log_info "Starting Node.js upgrade process..."

# Check current Node.js version
if command_exists node; then
  CURRENT_NODE_VERSION=$(node -v)
  log_info "Current Node.js version: $CURRENT_NODE_VERSION"
else
  log_warn "Node.js is not currently installed."
fi

# Check if nvm is installed
if ! command_exists nvm; then
  # Check if nvm is available after sourcing profile
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    log_info "nvm is installed but not loaded. Loading nvm..."
    export NVM_DIR="$HOME/.nvm"
    # shellcheck disable=SC1090
    . "$NVM_DIR/nvm.sh"
  else
    log_info "nvm is not installed. Installing nvm..."
    
    # Install nvm
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash || handle_error "Failed to install nvm"
    
    # Setup nvm environment
    export NVM_DIR="$HOME/.nvm"
    # shellcheck disable=SC1090
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    
    # Verify nvm installation
    if ! command_exists nvm; then
      log_error "nvm installation failed. Please install nvm manually:"
      log_info "Visit: https://github.com/nvm-sh/nvm#installing-and-updating"
      exit 1
    fi
  fi
fi

log_success "nvm is installed: $(nvm --version)"

# Install Node.js v18.19.1
log_info "Installing Node.js v18.19.1..."
nvm install 18.19.1 || handle_error "Failed to install Node.js v18.19.1"
nvm use 18.19.1 || handle_error "Failed to use Node.js v18.19.1"
nvm alias default 18.19.1 || log_warn "Failed to set Node.js v18.19.1 as default"

log_success "Node.js v18.19.1 installed and activated"
log_info "Node.js version: $(node -v)"
log_info "npm version: $(npm -v)"

# Update npm to the latest version
log_info "Updating npm to the latest version..."
npm install -g npm@latest || log_warn "Failed to update npm to the latest version"
log_success "npm updated to version: $(npm -v)"

# Configure increased memory limits
log_info "Configuring increased memory limits for Node.js..."

# Create .npmrc in home directory with increased memory limit
NPMRC_FILE="$HOME/.npmrc"
log_info "Adding memory configuration to $NPMRC_FILE"
add_to_file_if_not_exists "node-options=--max-old-space-size=8192" "$NPMRC_FILE"

# Add NODE_OPTIONS to .bashrc or .profile
SHELL_RC="$HOME/.bashrc"
if [ ! -f "$SHELL_RC" ]; then
  SHELL_RC="$HOME/.profile"
fi

NODE_OPTIONS_LINE='export NODE_OPTIONS="--max-old-space-size=8192"'
log_info "Adding NODE_OPTIONS to $SHELL_RC"
add_to_file_if_not_exists "$NODE_OPTIONS_LINE" "$SHELL_RC"

# Export NODE_OPTIONS in current session
export NODE_OPTIONS="--max-old-space-size=8192"

log_success "Memory limits configured. Node.js can now use up to 8GB of memory"

# Create a project-specific .npmrc file
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_NPMRC="$PROJECT_DIR/.npmrc"
log_info "Creating project-specific .npmrc at $PROJECT_NPMRC"
echo "node-options=--max-old-space-size=8192" > "$PROJECT_NPMRC"

# Final instructions
log_success "Node.js upgrade complete!"
log_info ""
log_info "To apply all changes immediately, run:"
log_info "  source $SHELL_RC"
log_info ""
log_info "To verify the installation, run:"
log_info "  node -v  # Should show v18.19.1"
log_info "  npm -v   # Should show the latest npm version"
log_info "  echo \$NODE_OPTIONS  # Should show --max-old-space-size=8192"
log_info ""
log_info "Now you can build the wallet with increased memory:"
log_info "  cd $PROJECT_DIR"
log_info "  ./scripts/wallet-install.sh"
log_info ""
log_info "If you still encounter memory issues, you can manually run the build with:"
log_info "  NODE_OPTIONS=--max-old-space-size=8192 yarn build:pro"
log_info ""

exit 0
