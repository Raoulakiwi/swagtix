#!/bin/bash

# Script to safely remove the .git directory from the wallet folder
# This prevents having a Git repository inside another Git repository

# Check if wallet directory exists
if [ ! -d "wallet" ]; then
  echo "Error: wallet directory not found"
  exit 1
fi

# Check if wallet/.git directory exists
if [ -d "wallet/.git" ]; then
  echo "Removing .git directory from wallet folder..."
  
  # Use find to locate and remove the .git directory
  find wallet -name ".git" -type d -exec rm -rf {} \; 2>/dev/null || true
  
  # Check if removal was successful
  if [ ! -d "wallet/.git" ]; then
    echo "Successfully removed .git directory from wallet folder"
    echo "You can now add the wallet directory to your repository"
  else
    echo "Error: Failed to remove .git directory"
    exit 1
  fi
else
  echo "No .git directory found in wallet folder"
fi

# Make sure the wallet directory can be added to the main repository
echo "Now you can run: git add wallet"
