#!/usr/bin/env node
/**
 * SwagTix Master Wallet Generator
 * 
 * This script generates a new Ethereum wallet for managing PulseChain deployments.
 * It creates a wallet with address, private key, and mnemonic phrase.
 * 
 * SECURITY WARNING: The private key and mnemonic phrase are sensitive information.
 * Never share them with anyone or commit them to version control.
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

// PulseChain configuration
const PULSECHAIN_CONFIG = {
  chainId: 369, // PulseChain mainnet
  name: 'PulseChain',
  rpcUrl: 'https://rpc.pulsechain.com',
  explorerUrl: 'https://scan.pulsechain.com',
  symbol: 'PLS',
  decimals: 18
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Generate a new random wallet
 */
function generateWallet() {
  // Create a random mnemonic (uses crypto.randomBytes under the hood)
  const wallet = ethers.Wallet.createRandom();
  return wallet;
}

/**
 * Encrypt the wallet with a password
 */
async function encryptWallet(wallet, password) {
  const encryptedJson = await wallet.encrypt(password);
  return encryptedJson;
}

/**
 * Save wallet information to files
 */
function saveWalletInfo(wallet, encryptedJson, outputDir) {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save wallet address (public information)
  fs.writeFileSync(
    path.join(outputDir, 'wallet-address.txt'),
    wallet.address
  );

  // Save encrypted wallet
  fs.writeFileSync(
    path.join(outputDir, 'encrypted-wallet.json'),
    encryptedJson
  );

  // Create a README with instructions
  const readmeContent = `# SwagTix Master Wallet

Wallet Address: ${wallet.address}

## SECURITY WARNING
The files in this directory contain sensitive information. Never share them with anyone or commit them to version control.

## Files
- wallet-address.txt: Contains the public wallet address (safe to share)
- encrypted-wallet.json: Contains the encrypted wallet (keep secure)

## Usage
To use this wallet with the SwagTix admin interface, you'll need to:
1. Securely transfer the encrypted wallet file to your server
2. Configure the admin interface with the file location and provide the password when needed

## PulseChain Configuration
- Network: PulseChain Mainnet
- Chain ID: ${PULSECHAIN_CONFIG.chainId}
- RPC URL: ${PULSECHAIN_CONFIG.rpcUrl}
- Explorer: ${PULSECHAIN_CONFIG.explorerUrl}

## Funding
Before using this wallet for deployments, you'll need to fund it with PLS for gas fees.
Send PLS to the address above.
`;

  fs.writeFileSync(
    path.join(outputDir, 'README.md'),
    readmeContent
  );

  return {
    walletAddressPath: path.join(outputDir, 'wallet-address.txt'),
    encryptedWalletPath: path.join(outputDir, 'encrypted-wallet.json'),
    readmePath: path.join(outputDir, 'README.md')
  };
}

/**
 * Display wallet information with security warnings
 */
function displayWalletInfo(wallet) {
  console.log('\n' + '='.repeat(80));
  console.log('🔐 SWAGTIX MASTER WALLET GENERATED');
  console.log('='.repeat(80));
  
  console.log('\n⚠️  SECURITY WARNING ⚠️');
  console.log('The following information is HIGHLY SENSITIVE.');
  console.log('Never share it with anyone or commit it to version control.\n');
  
  console.log('📋 Wallet Information:');
  console.log('-'.repeat(50));
  console.log(`🔑 Address:      ${wallet.address}`);
  console.log(`🔒 Private Key:  ${wallet.privateKey}`);
  console.log(`📝 Mnemonic:     ${wallet.mnemonic.phrase}`);
  
  console.log('\n📊 PulseChain Mainnet Configuration:');
  console.log('-'.repeat(50));
  console.log(`Chain ID:       ${PULSECHAIN_CONFIG.chainId}`);
  console.log(`RPC URL:        ${PULSECHAIN_CONFIG.rpcUrl}`);
  console.log(`Explorer:       ${PULSECHAIN_CONFIG.explorerUrl}`);
  
  console.log('\n' + '='.repeat(80));
  console.log('⚠️  WRITE DOWN THE MNEMONIC PHRASE AND STORE IT SECURELY ⚠️');
  console.log('='.repeat(80) + '\n');
}

/**
 * Main function to run the wallet generation process
 */
async function main() {
  console.log('🔐 SwagTix Master Wallet Generator 🔐');
  console.log('This script will generate a new wallet for PulseChain deployments.\n');

  // Generate a new wallet
  const wallet = generateWallet();
  
  // Display the wallet information
  displayWalletInfo(wallet);
  
  // Ask if the user wants to save the wallet
  rl.question('\nDo you want to save the wallet to encrypted files? (y/n): ', async (answer) => {
    if (answer.toLowerCase() === 'y') {
      rl.question('Enter a strong password to encrypt the wallet: ', async (password) => {
        if (password.length < 8) {
          console.log('Password is too short. Please use at least 8 characters.');
          rl.close();
          return;
        }
        
        console.log('\nEncrypting wallet... This may take a moment.');
        const encryptedJson = await encryptWallet(wallet, password);
        
        rl.question('Enter output directory path (default: ./master-wallet): ', (outputDir) => {
          const dir = outputDir || './master-wallet';
          
          try {
            const paths = saveWalletInfo(wallet, encryptedJson, dir);
            
            console.log('\n✅ Wallet information saved successfully!');
            console.log(`📁 Wallet address:    ${paths.walletAddressPath}`);
            console.log(`📁 Encrypted wallet:  ${paths.encryptedWalletPath}`);
            console.log(`📁 README:           ${paths.readmePath}`);
            
            console.log('\n⚠️  IMPORTANT: Keep your password safe. If you lose it, you cannot recover the wallet.');
            console.log('⚠️  Make sure to back up these files securely.\n');
          } catch (error) {
            console.error('Error saving wallet information:', error);
          }
          
          rl.close();
        });
      });
    } else {
      console.log('\n⚠️  Wallet information was not saved to disk.');
      console.log('⚠️  Make sure you have written down the mnemonic phrase and private key.\n');
      rl.close();
    }
  });
}

// Run the main function
main().catch((error) => {
  console.error('Error generating wallet:', error);
  process.exit(1);
});