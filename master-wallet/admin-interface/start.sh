#!/bin/bash

# This script is used to start/restart the SwagTix Admin Interface
# It handles the wallet password setup for PM2 by creating a temporary password file.

# IMPORTANT: Replace 'your_wallet_password' with your actual wallet password.
# This password is used to decrypt the encrypted-wallet.json file.
WALLET_PASSWORD="your_wallet_password" 

# Path to your application directory
APP_DIR="/opt/swagtix/app"

# Navigate to the application directory
cd "$APP_DIR" || { echo "Error: Could not change to application directory $APP_DIR"; exit 1; }

# Create a temporary password file that the server.js will read
# This file will be deleted by server.js after reading for security
echo "$WALLET_PASSWORD" > .wallet_password
chmod 600 .wallet_password # Set strict permissions for the password file

# Restart the application with PM2
# PM2 will pick up the server.js, which will then read the .wallet_password file
pm2 restart swagtix-admin

echo "Server restarting. Check logs with: pm2 logs swagtix-admin"
echo "The .wallet_password file will be automatically deleted by the server after use."
