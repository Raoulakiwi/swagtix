const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const walletService = require('./walletService');
const logger = require('../utils/logger');
const eventTicketABI = require('../abis/EventTicket1155.json');

class ContractService {
  constructor() {
    this.eventTicketAddress = process.env.EVENT_TICKET_CONTRACT;
    this.eventTicketContract = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the contract service
   */
  async initialize() {
    try {
      if (!walletService.isInitialized) {
        logger.warn('Wallet service not initialized. Contract service cannot connect to contract yet.');
        return false;
      }
      
      if (this.eventTicketAddress) {
        logger.info(`Attempting to connect to EventTicket1155 contract at ${this.eventTicketAddress}`);
        this.eventTicketContract = walletService.getContract(
          this.eventTicketAddress,
          eventTicketABI.abi
        );
        
        // Verify contract is deployed by trying to call a view function
        try {
          await this.eventTicketContract.nextTokenId();
          logger.info(`EventTicket1155 contract connected at ${this.eventTicketAddress}`);
          this.isInitialized = true;
          return true;
        } catch (error) {
          logger.error(`Failed to connect to EventTicket1155 at ${this.eventTicketAddress}. It might not be deployed or the address is incorrect:`, error.message);
          this.eventTicketContract = null;
          return false;
        }
      } else {
        logger.warn('EventTicket1155 contract address not configured in environment variables.');
        return false;
      }
    } catch (error) {
      logger.error('Failed to initialize contract service:', error);
      return false;
    }
  }

  /**
   * Deploy a new EventTicket1155 contract
   */
  async deployEventTicketContract() {
    try {
      if (!walletService.isInitialized) {
        throw new Error('Wallet service not initialized. Cannot deploy contract.');
      }
      
      logger.info('Deploying new EventTicket1155 contract...');
      
      // Create contract factory
      const factory = new ethers.ContractFactory(
        eventTicketABI.abi,
        eventTicketABI.bytecode,
        walletService.wallet
      );
      
      // Deploy the contract
      const contract = await factory.deploy();
      
      // Wait for deployment to finish
      await contract.deployed();
      
      logger.info(`EventTicket1155 contract deployed at ${contract.address}`);
      
      // Update the contract address
      this.eventTicketAddress = contract.address;
      this.eventTicketContract = contract;
      this.isInitialized = true;
      
      return {
        address: contract.address,
        transactionHash: contract.deployTransaction.hash
      };
    } catch (error) {
      logger.error('Failed to deploy EventTicket1155 contract:', error);
      throw error;
    }
  }

  /**
   * Mint new tickets
   * @param {string} to - Recipient address
   * @param {uint256} amount - Number of tickets
   * @param {uint256} eventTimestamp - Event time (unix timestamp)
   * @param {string} qrCodeUri - URI to QR code image
   * @param {string} mediaUri - URI to photo or video (shown after event)
   */
  async mintTickets(to, amount, eventTimestamp, qrCodeUri, mediaUri) {
    try {
      if (!this.isInitialized) {
        throw new Error('Contract service not initialized.');
      }
      
      logger.info(`Minting ${amount} tickets to ${to} for event at ${eventTimestamp}...`);
      
      // Mint tickets using the contract's mintTicket function
      const tx = await this.eventTicketContract.mintTicket(
        to,
        amount,
        eventTimestamp,
        qrCodeUri,
        mediaUri
      );
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Get the token ID from the event logs (assuming TransferSingle event is emitted)
      const transferEvent = receipt.events.find(e => e.event === 'TransferSingle');
      const tokenId = transferEvent ? transferEvent.args.id.toString() : 'unknown';
      
      logger.info(`Successfully minted ${amount} tickets with token ID ${tokenId}`);
      
      return {
        tokenId,
        to,
        amount,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      logger.error('Failed to mint tickets:', error);
      throw error;
    }
  }

  /**
   * Get ticket information
   * @param {number} tokenId - The ID of the ticket
   */
  async getTicketInfo(tokenId) {
    try {
      if (!this.isInitialized) {
        throw new Error('Contract service not initialized.');
      }
      
      logger.info(`Getting information for ticket ${tokenId}...`);
      
      // Get ticket metadata and info from the contract
      const uri = await this.eventTicketContract.uri(tokenId);
      const ticketData = await this.eventTicketContract.ticketInfo(tokenId);
      
      // Parse metadata JSON from URI
      let metadata = { name: `Ticket #${tokenId}`, description: '', image: '' };
      try {
        // Assuming uri returns data:application/json;utf8,... or http(s)://...
        if (uri.startsWith('data:application/json')) {
          const jsonString = decodeURIComponent(uri.split(',')[1]);
          metadata = JSON.parse(jsonString);
        } else if (uri.startsWith('http')) {
          const response = await fetch(uri);
          metadata = await response.json();
        }
      } catch (e) {
        logger.warn(`Could not parse metadata for ticket ${tokenId}:`, e.message);
      }
      
      return {
        tokenId,
        metadataURI: uri,
        eventTimestamp: ticketData.eventTimestamp.toString(),
        qrCodeUri: ticketData.qrCodeUri,
        mediaUri: ticketData.mediaUri,
        metadata
      };
    } catch (error) {
      logger.error(`Failed to get ticket info for token ID ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Get all tickets
   */
  async getAllTickets() {
    try {
      if (!this.isInitialized) {
        throw new Error('Contract service not initialized.');
      }
      
      logger.info('Getting all tickets...');
      
      // Get the nextTokenId to iterate through all minted tickets
      const nextTokenId = await this.eventTicketContract.nextTokenId();
      
      const tickets = [];
      for (let i = 1; i < nextTokenId.toNumber(); i++) {
        try {
          const ticket = await this.getTicketInfo(i);
          tickets.push(ticket);
        } catch (error) {
          logger.warn(`Error getting info for ticket ${i}:`, error.message);
        }
      }
      
      return tickets;
    } catch (error) {
      logger.error('Failed to get all tickets:', error);
      throw error;
    }
  }

  /**
   * Check if an address owns a specific ticket
   * @param {string} address - The address to check
   * @param {number} tokenId - The ID of the ticket
   */
  async ownsTicket(address, tokenId) {
    try {
      if (!this.isInitialized) {
        throw new Error('Contract service not initialized.');
      }
      
      const balance = await this.eventTicketContract.balanceOf(address, tokenId);
      return balance.toNumber() > 0;
    } catch (error) {
      logger.error(`Failed to check ticket ownership for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get tickets owned by an address
   * @param {string} address - The address to check
   */
  async getTicketsByOwner(address) {
    try {
      if (!this.isInitialized) {
        throw new Error('Contract service not initialized.');
      }
      
      logger.info(`Getting tickets owned by ${address}...`);
      
      const nextTokenId = await this.eventTicketContract.nextTokenId();
      const ownedTickets = [];
      for (let i = 1; i < nextTokenId.toNumber(); i++) {
        const balance = await this.eventTicketContract.balanceOf(address, i);
        if (balance.toNumber() > 0) {
          const ticketInfo = await this.getTicketInfo(i);
          ownedTickets.push({
            ...ticketInfo,
            balance: balance.toNumber()
          });
        }
      }
      
      return ownedTickets;
    } catch (error) {
      logger.error(`Failed to get tickets for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Validate a ticket (placeholder - actual validation logic would be more complex)
   * @param {number} tokenId - The ID of the ticket
   * @param {string} ownerAddress - The address of the ticket owner
   */
  async validateTicket(tokenId, ownerAddress) {
    try {
      if (!this.isInitialized) {
        throw new Error('Contract service not initialized.');
      }
      
      logger.info(`Validating ticket ${tokenId} for ${ownerAddress}...`);
      
      // Placeholder for actual validation logic
      const ownsTicket = await this.ownsTicket(ownerAddress, tokenId);
      if (!ownsTicket) {
        return {
          valid: false,
          reason: 'Address does not own this ticket'
        };
      }
      
      // In a real scenario, you'd interact with the contract to mark it as used
      // For now, we'll just simulate success
      logger.info(`Successfully validated ticket ${tokenId} for ${ownerAddress} (simulated)`);
      
      return {
        valid: true,
        tokenId,
        owner: ownerAddress,
        transactionHash: 'simulated_tx_hash'
      };
    } catch (error) {
      logger.error(`Failed to validate ticket ${tokenId} for ${ownerAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get contract address
   */
  getContractAddress() {
    return this.eventTicketAddress;
  }

  /**
   * Check if contract service is initialized
   */
  isContractInitialized() {
    return this.isInitialized;
  }
}

// Singleton instance
const contractService = new ContractService();
module.exports = contractService;