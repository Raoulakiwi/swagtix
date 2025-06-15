const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

class WalletService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the wallet service
   */
  /**
   * @param {string} walletPassword - Password used to decrypt encrypted-wallet.json
   * @returns {Promise<boolean>} true when the wallet is initialised
   */
  async initialize(walletPassword) {
    try {
      // -------------------------------------------------------------------
      // 1. Provider
      // -------------------------------------------------------------------
      const rpcUrl = process.env.PULSECHAIN_RPC_URL;
      this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      
      // -------------------------------------------------------------------
      // 2. Locate encrypted wallet file
      // -------------------------------------------------------------------
      const walletPath =
        process.env.WALLET_PATH ||
        path.join(__dirname, '..', '..', 'secure', 'encrypted-wallet.json');

      if (!fs.existsSync(walletPath)) {
        throw new Error(
          `Encrypted wallet not found at ${walletPath}. ` +
          `Set WALLET_PATH env var or place the wallet in the secure folder.`
        );
      }

      // -------------------------------------------------------------------
      // 3. Read & decrypt wallet
      // -------------------------------------------------------------------
      const encryptedWallet = fs.readFileSync(walletPath, 'utf8');
      
      // Decrypt the wallet with the provided password
      this.wallet = await ethers.Wallet.fromEncryptedJson(encryptedWallet, walletPassword);
      this.wallet = this.wallet.connect(this.provider);
      
      // Check connection by getting the balance
      const balance = await this.wallet.getBalance();
      
      logger.info(`Master wallet initialized successfully. Address: ${this.wallet.address}`);
      logger.info(`Current balance: ${ethers.utils.formatEther(balance)} PLS`);
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      logger.error('Failed to initialize wallet:', error);
      this.isInitialized = false;
      throw new Error(`Wallet initialization failed: ${error.message}`);
    }
  }

  /**
   * Return an ethers.Signer for external services
   */
  getSigner() {
    if (!this.isInitialized) {
      throw new Error('Wallet not initialized');
    }
    return this.wallet;
  }

  /**
   * Get wallet info
   */
  getWalletInfo() {
    if (!this.isInitialized) {
      throw new Error('Wallet not initialized');
    }
    
    return {
      address: this.wallet.address,
      isConnected: this.provider.isConnected(),
      network: this.provider.network
    };
  }

  /**
   * Get wallet balance
   */
  async getBalance() {
    if (!this.isInitialized) {
      throw new Error('Wallet not initialized');
    }
    
    const balance = await this.wallet.getBalance();
    return {
      wei: balance.toString(),
      pls: ethers.utils.formatEther(balance)
    };
  }

  /**
   * Estimate gas price
   */
  async getGasPrice() {
    if (!this.isInitialized) {
      throw new Error('Wallet not initialized');
    }
    
    const gasPrice = await this.provider.getGasPrice();
    return {
      wei: gasPrice.toString(),
      gwei: ethers.utils.formatUnits(gasPrice, 'gwei')
    };
  }

  /**
   * Get transaction count
   */
  async getTransactionCount() {
    if (!this.isInitialized) {
      throw new Error('Wallet not initialized');
    }
    
    return await this.wallet.getTransactionCount();
  }

  /**
   * Get the contract instance
   */
  getContract(contractAddress, contractAbi) {
    if (!this.isInitialized) {
      throw new Error('Wallet not initialized');
    }
    
    return new ethers.Contract(contractAddress, contractAbi, this.wallet);
  }

  /**
   * Sign a message
   */
  async signMessage(message) {
    if (!this.isInitialized) {
      throw new Error('Wallet not initialized');
    }
    
    return await this.wallet.signMessage(message);
  }

  /**
   * Send a transaction
   */
  async sendTransaction(to, value, data = '0x') {
    if (!this.isInitialized) {
      throw new Error('Wallet not initialized');
    }
    
    const tx = {
      to,
      value: ethers.utils.parseEther(value),
      data,
      gasLimit: 100000, // Set appropriate gas limit
      gasPrice: await this.provider.getGasPrice()
    };
    
    const transaction = await this.wallet.sendTransaction(tx);
    return transaction;
  }
}

// Singleton instance
const walletService = new WalletService();
module.exports = walletService;
