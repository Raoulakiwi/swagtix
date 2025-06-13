#!/bin/bash

# cleanup-features.sh
# Script to remove DeFi/swap features from the Rabby wallet
# and focus it on NFT ticket functionality for PulseChain

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Set the base directory to the wallet folder
BASE_DIR="$(pwd)/wallet"
if [ ! -d "$BASE_DIR" ]; then
  echo -e "${RED}Error: wallet directory not found. Please run this script from the project root.${NC}"
  exit 1
fi

echo -e "${BLUE}=== SwagTix Wallet Feature Cleanup ===${NC}"
echo -e "${YELLOW}This script will remove DeFi/swap features from the Rabby wallet.${NC}"
echo -e "${YELLOW}The wallet will be focused on NFT ticket functionality for PulseChain only.${NC}"
echo ""

# Function to remove a directory/file and report
remove_item() {
  local path=$1
  local description=$2
  
  if [ -e "$path" ]; then
    rm -rf "$path"
    echo -e "${GREEN}✓ Removed ${description}${NC}"
  else
    echo -e "${YELLOW}⚠ ${description} not found, skipping...${NC}"
  fi
}

# Function to replace file content
replace_file() {
  local path=$1
  local description=$2
  local content=$3
  
  if [ -e "$path" ]; then
    echo "$content" > "$path"
    echo -e "${GREEN}✓ Updated ${description}${NC}"
  else
    echo -e "${YELLOW}⚠ ${description} not found, skipping...${NC}"
    # Create the file if it doesn't exist
    mkdir -p "$(dirname "$path")"
    echo "$content" > "$path"
    echo -e "${GREEN}✓ Created ${description}${NC}"
  fi
}

echo -e "${BLUE}1. Removing Swap Components...${NC}"
# Remove swap-related UI components
remove_item "$BASE_DIR/src/ui/views/Swap" "Swap UI components"
remove_item "$BASE_DIR/src/ui/views/SwapChain" "Swap Chain UI components"
remove_item "$BASE_DIR/src/ui/views/SwapProvider" "Swap Provider UI components"
remove_item "$BASE_DIR/src/ui/views/SwapQuote" "Swap Quote UI components"
remove_item "$BASE_DIR/src/ui/views/SwapSettings" "Swap Settings UI components"
remove_item "$BASE_DIR/src/ui/views/TokenApproval" "Token Approval UI components"

echo -e "${BLUE}2. Removing DeFi Components...${NC}"
# Remove DeFi-related UI components
remove_item "$BASE_DIR/src/ui/views/DappConnection" "DApp Connection UI components"
remove_item "$BASE_DIR/src/ui/views/ApprovalManagement" "Approval Management UI components"
remove_item "$BASE_DIR/src/ui/views/TokenDetail" "Token Detail UI components"

echo -e "${BLUE}3. Removing Swap and DeFi Services...${NC}"
# Remove swap and DeFi-related services
remove_item "$BASE_DIR/src/background/service/swap.ts" "Swap service"
remove_item "$BASE_DIR/src/background/service/openapi.ts" "OpenAPI service"
remove_item "$BASE_DIR/src/background/service/dapp.ts" "DApp service"
remove_item "$BASE_DIR/src/background/service/approval.ts" "Approval service"

echo -e "${BLUE}4. Simplifying Network Configuration...${NC}"
# Replace networks.ts with PulseChain-only configuration
replace_file "$BASE_DIR/src/constant/networks.ts" "Networks configuration" "import { AddEthereumChainParameter } from '@rabby-wallet/rabby-api/dist/types';
import { CHAINS, CHAINS_ENUM, NETWORK_TYPES, NETWORK_COLORS, NETWORK_URL, CHAIN_EXPLORERS, CHAIN_EXPLORERS_API, CHAIN_NATIVE_TOKEN, GAS_SYMBOL, CHAIN_INFO, INITIAL_CHAIN, SUPPORTED_CHAINS, CHAIN_ID_TO_CHAIN } from './networks.pulsechain';

export {
  CHAINS,
  CHAINS_ENUM,
  NETWORK_TYPES,
  NETWORK_COLORS,
  NETWORK_URL,
  CHAIN_EXPLORERS,
  CHAIN_EXPLORERS_API,
  CHAIN_NATIVE_TOKEN,
  GAS_SYMBOL,
  CHAIN_INFO,
  INITIAL_CHAIN,
  SUPPORTED_CHAINS,
  CHAIN_ID_TO_CHAIN
};"

echo -e "${BLUE}5. Updating Navigation...${NC}"
# Simplify navigation by removing swap and DeFi-related routes
replace_file "$BASE_DIR/src/ui/utils/navigation.ts" "Navigation utilities" "import React from 'react';
import { createMemoryHistory } from 'history';
import { NFTTickets, Account, TransferTicket, ScanQR, Settings } from '@/ui/views';

export enum WALLET_TABS_ENUM {
  NFT_TICKETS = 'nft-tickets',
  ACCOUNT = 'account',
  SCAN = 'scan',
  SETTINGS = 'settings',
}

export const WALLET_TABS_INFO = {
  [WALLET_TABS_ENUM.NFT_TICKETS]: {
    name: 'My Tickets',
    path: '/',
    icon: 'tickets',
    component: NFTTickets,
    isTab: true,
  },
  [WALLET_TABS_ENUM.SCAN]: {
    name: 'Scan',
    path: '/scan',
    icon: 'scan',
    component: ScanQR,
    isTab: true,
  },
  [WALLET_TABS_ENUM.ACCOUNT]: {
    name: 'Account',
    path: '/account',
    icon: 'account',
    component: Account,
    isTab: true,
  },
  [WALLET_TABS_ENUM.SETTINGS]: {
    name: 'Settings',
    path: '/settings',
    icon: 'settings',
    component: Settings,
    isTab: true,
  },
};

export const WALLET_TABS = Object.values(WALLET_TABS_INFO);

export const history = createMemoryHistory();"

echo -e "${BLUE}6. Updating Redux/Zustand Stores...${NC}"
# Simplify store by removing swap and DeFi-related state
replace_file "$BASE_DIR/src/ui/store.ts" "Redux/Zustand store" "import { createModel } from '@rematch/core';
import { RootModel } from '.';

export interface UIState {
  isShowSideBar: boolean;
  isShowAccountList: boolean;
  currentTab: string;
  isPinSetup: boolean;
}

export const ui = createModel<RootModel>()({
  name: 'ui',
  state: {
    isShowSideBar: false,
    isShowAccountList: false,
    currentTab: 'nft-tickets',
    isPinSetup: false,
  } as UIState,
  reducers: {
    toggleSideBar(state) {
      return {
        ...state,
        isShowSideBar: !state.isShowSideBar,
      };
    },
    toggleAccountList(state) {
      return {
        ...state,
        isShowAccountList: !state.isShowAccountList,
      };
    },
    setCurrentTab(state, tab: string) {
      return {
        ...state,
        currentTab: tab,
      };
    },
    setIsPinSetup(state, isPinSetup: boolean) {
      return {
        ...state,
        isPinSetup,
      };
    },
  },
});"

echo -e "${BLUE}7. Updating Manifest...${NC}"
# Update manifest to reflect PulseChain-only functionality
replace_file "$BASE_DIR/src/manifest/chrome-mv3/manifest.json" "Chrome manifest" '{
  "name": "SwagTix - NFT Ticket Wallet",
  "description": "Your digital ticket hub for events on the PulseChain network",
  "version": "1.0.0",
  "manifest_version": 3,
  "action": {
    "default_icon": {
      "16": "images/icon-16.png",
      "19": "images/icon-19.png",
      "32": "images/icon-32.png",
      "38": "images/icon-38.png",
      "64": "images/icon-64.png",
      "128": "images/icon-128.png",
      "512": "images/icon-512.png"
    },
    "default_title": "SwagTix",
    "default_popup": "popup.html"
  },
  "author": "SwagTix",
  "background": {
    "service_worker": "background.js"
  },
  "icons": {
    "16": "images/icon-16.png",
    "19": "images/icon-19.png",
    "32": "images/icon-32.png",
    "38": "images/icon-38.png",
    "64": "images/icon-64.png",
    "128": "images/icon-128.png",
    "512": "images/icon-512.png"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content-script.js"],
      "run_at": "document_start",
      "all_frames": true
    }
  ],
  "web_accessible_resources": [
    {
      "resources": ["pageProvider.js"],
      "matches": ["<all_urls>"]
    }
  ],
  "permissions": [
    "storage",
    "unlimitedStorage",
    "activeTab",
    "notifications",
    "clipboardWrite"
  ],
  "host_permissions": ["<all_urls>"],
  "content_security_policy": {
    "extension_pages": "script-src self; object-src self"
  }
}'

echo -e "${BLUE}8. Cleaning Up Package.json...${NC}"
# Remove unnecessary dependencies from package.json
echo -e "${YELLOW}⚠ Please manually review package.json and remove unnecessary dependencies.${NC}"
echo -e "${YELLOW}⚠ This script cannot safely modify JSON with comments.${NC}"

echo ""
echo -e "${GREEN}=== Cleanup Complete! ===${NC}"
echo -e "${BLUE}The wallet has been streamlined to focus on NFT ticket functionality for PulseChain.${NC}"
echo -e "${BLUE}Please review the changes and test the application.${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Update the Web3Auth integration"
echo -e "2. Connect to the EventTicket1155 contract"
echo -e "3. Test the application"
echo -e "4. Build for production"
echo ""
