import { AddEthereumChainParameter } from '@rabby-wallet/rabby-api/dist/types';

// PulseChain mainnet configuration
export const CHAINS = {
  PULSE: '0x171', // Chain ID 369 in hex
};

export const CHAINS_ENUM = {
  PULSE: 'PULSE',
};

// Network display information
export const NETWORK_TYPES = {
  [CHAINS.PULSE]: 'PulseChain',
};

// Network colors for UI
export const NETWORK_COLORS = {
  [CHAINS.PULSE]: '#00C3F8', // PulseChain blue
};

// RPC configuration
export const NETWORK_URL = {
  [CHAINS.PULSE]: 'https://rpc.pulsechain.com',
};

// Block explorer URLs
export const CHAIN_EXPLORERS = {
  [CHAINS.PULSE]: 'https://scan.pulsechain.com',
};

// Block explorer API URLs
export const CHAIN_EXPLORERS_API = {
  [CHAINS.PULSE]: 'https://scan.pulsechain.com/api',
};

// Native currency configuration
export const CHAIN_NATIVE_TOKEN = {
  [CHAINS.PULSE]: {
    id: 'pulse',
    symbol: 'PLS',
    name: 'Pulse',
    decimals: 18,
    logoURI: 'https://pulsechain.com/img/pulse-logo.svg', // Replace with actual logo URL
  },
};

// Gas token symbols
export const GAS_SYMBOL = {
  [CHAINS.PULSE]: 'PLS',
};

// Chain information for adding to wallets
export const CHAIN_INFO: Record<string, AddEthereumChainParameter> = {
  [CHAINS.PULSE]: {
    chainId: CHAINS.PULSE,
    chainName: 'PulseChain',
    nativeCurrency: {
      name: 'Pulse',
      symbol: 'PLS',
      decimals: 18,
    },
    rpcUrls: ['https://rpc.pulsechain.com'],
    blockExplorerUrls: ['https://scan.pulsechain.com'],
    iconUrls: ['https://pulsechain.com/img/pulse-logo.svg'], // Replace with actual logo URL
  },
};

// Default chain for the wallet
export const INITIAL_CHAIN = CHAINS.PULSE;

// Supported chains list (only PulseChain)
export const SUPPORTED_CHAINS = [CHAINS.PULSE];

// Chain ID to name mapping
export const CHAIN_ID_TO_CHAIN = {
  [CHAINS.PULSE]: CHAINS_ENUM.PULSE,
};
