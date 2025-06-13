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
          eventTicketABI
        );
        
        // Verify contract is deployed by trying to call a view function
        try {
          await this.eventTicketContract.name();
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
   * @param {string} name - The name of the ticket contract
   * @param {string} symbol - The symbol of the ticket contract
   * @param {string} baseURI - The base URI for ticket metadata
   */
  async deployEventTicketContract(name, symbol, baseURI) {
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
      const contract = await factory.deploy(name, symbol, baseURI);
      
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
   * @param {string} eventId - The ID of the event
   * @param {string} eventName - The name of the event
   * @param {string} eventDate - The date of the event
   * @param {string} venue - The venue of the event
   * @param {string} ticketType - The type of ticket
   * @param {number} amount - The number of tickets to mint
   * @param {string} price - The price of each ticket in PLS
   * @param {string} metadataURI - The URI for the ticket metadata
   */
  async mintTickets(eventId, eventName, eventDate, venue, ticketType, amount, price, metadataURI) {
    try {
      if (!this.isInitialized) {
        throw new Error('Contract service not initialized.');
      }
      
      logger.info(`Minting ${amount} tickets for event ${eventName}...`);
      
      // Create ticket metadata
      const ticketMetadata = {
        eventId,
        eventName,
        eventDate,
        venue,
        ticketType,
        price
      };
      
      // Convert price to wei
      const priceInWei = ethers.utils.parseEther(price.toString());
      
      // Mint tickets
      const tx = await this.eventTicketContract.mintBatch(
        amount,
        priceInWei,
        metadataURI,
        JSON.stringify(ticketMetadata)
      );
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Get the token ID from the event logs
      const mintEvent = receipt.events.find(e => e.event === 'TicketsMinted');
      const tokenId = mintEvent.args.tokenId.toNumber();
      
      logger.info(`Successfully minted ${amount} tickets with token ID ${tokenId}`);
      
      return {
        tokenId,
        amount,
        price: price.toString(),
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
      
      // Get ticket metadata
      const metadataURI = await this.eventTicketContract.uri(tokenId);
      const ticketData = await this.eventTicketContract.getTicketData(tokenId);
      const price = ethers.utils.formatEther(ticketData.price);
      const totalSupply = await this.eventTicketContract.totalSupply(tokenId);
      const availableSupply = await this.eventTicketContract.availableSupply(tokenId);
      
      // Parse metadata JSON if it's stored on-chain
      let metadata = {};
      try {
        metadata = JSON.parse(ticketData.metadata);
      } catch (e) {
        logger.warn(`Could not parse metadata for ticket ${tokenId}`);
      }
      
      return {
        tokenId,
        metadataURI,
        price,
        totalSupply: totalSupply.toNumber(),
        availableSupply: availableSupply.toNumber(),
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
      
      // Get the total number of ticket types
      const ticketCount = await this.eventTicketContract.getTicketCount();
      
      // Get information for each ticket type
      const tickets = [];
      for (let i = 1; i <= ticketCount; i++) {
        try {
          const ticketInfo = await this.getTicketInfo(i);
          tickets.push(ticketInfo);
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
   * Purchase tickets
   * @param {number} tokenId - The ID of the ticket
   * @param {number} amount - The number of tickets to purchase
   * @param {string} buyerAddress - The address of the buyer
   */
  async purchaseTickets(tokenId, amount, buyerAddress) {
    try {
      if (!this.isInitialized) {
        throw new Error('Contract service not initialized.');
      }
      
      logger.info(`Processing purchase of ${amount} tickets with ID ${tokenId} for ${buyerAddress}...`);
      
      // Get ticket price
      const ticketData = await this.eventTicketContract.getTicketData(tokenId);
      const pricePerTicket = ticketData.price;
      const totalPrice = pricePerTicket.mul(amount);
      
      // Purchase tickets
      const tx = await this.eventTicketContract.purchaseTickets(tokenId, amount, buyerAddress, {
        value: totalPrice
      });
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      logger.info(`Successfully purchased ${amount} tickets for ${buyerAddress}`);
      
      return {
        tokenId,
        amount,
        buyer: buyerAddress,
        totalPrice: ethers.utils.formatEther(totalPrice),
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      logger.error('Failed to purchase tickets:', error);
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
      
      // Get the total number of ticket types
      const ticketCount = await this.eventTicketContract.getTicketCount();
      
      // Check ownership for each ticket type
      const ownedTickets = [];
      for (let i = 1; i <= ticketCount; i++) {
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
   * Validate a ticket
   * @param {number} tokenId - The ID of the ticket
   * @param {string} ownerAddress - The address of the ticket owner
   */
  async validateTicket(tokenId, ownerAddress) {
    try {
      if (!this.isInitialized) {
        throw new Error('Contract service not initialized.');
      }
      
      logger.info(`Validating ticket ${tokenId} for ${ownerAddress}...`);
      
      // Check if the address owns the ticket
      const ownsTicket = await this.ownsTicket(ownerAddress, tokenId);
      if (!ownsTicket) {
        return {
          valid: false,
          reason: 'Address does not own this ticket'
        };
      }
      
      // Check if the ticket has been used
      const isUsed = await this.eventTicketContract.isTicketUsed(tokenId, ownerAddress);
      if (isUsed) {
        return {
          valid: false,
          reason: 'Ticket has already been used'
        };
      }
      
      // Mark the ticket as used
      const tx = await this.eventTicketContract.useTicket(tokenId, ownerAddress);
      await tx.wait();
      
      logger.info(`Successfully validated ticket ${tokenId} for ${ownerAddress}`);
      
      return {
        valid: true,
        tokenId,
        owner: ownerAddress,
        transactionHash: tx.hash
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
