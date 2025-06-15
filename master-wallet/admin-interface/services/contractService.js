const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const eventTicketABI = require('../abis/EventTicket1155.json');

class ContractService {
  constructor() {
    this.eventTicketAddress = process.env.EVENT_TICKET_CONTRACT;
    this.eventTicketContract = null;
    this.isInitialized = false;
    this.envPath = path.join(__dirname, '..', '.env');
  }

  /**
   * Initialize the contract service.
   * Attempts to connect to the EventTicket1155 contract if its address is configured.
   * This method does NOT block deployment if the contract is not yet deployed.
   * @param {ethers.Signer} signer - The ethers.js Signer object from the wallet service.
   */
  async initialize(signer) {
    try {
      if (!signer) {
        logger.warn('Signer not provided. Contract service cannot connect to contract.');
        this.isInitialized = false;
        return false;
      }

      // If contract address is configured, attempt to connect
      if (this.eventTicketAddress) {
        logger.info(`Attempting to connect to EventTicket1155 contract at ${this.eventTicketAddress}`);
        this.eventTicketContract = new ethers.Contract(
          this.eventTicketAddress,
          eventTicketABI.abi,
          signer // Use the provided signer
        );

        // Verify contract is deployed by trying to call a view function
        try {
          // Call a simple view function to check if the contract exists and is responsive
          await this.eventTicketContract.nextTokenId();
          logger.info(`EventTicket1155 contract connected at ${this.eventTicketAddress}`);
          this.isInitialized = true;
          return true;
        } catch (error) {
          logger.error(`Failed to connect to EventTicket1155 at ${this.eventTicketAddress}. It might not be deployed or the address is incorrect:`, error.message);
          this.eventTicketContract = null; // Reset contract if connection fails
          this.isInitialized = false;
          return false;
        }
      } else {
        logger.warn('EventTicket1155 contract address not configured in environment variables. Contract service will remain uninitialized until deployment.');
        this.isInitialized = false;
        return false;
      }
    } catch (error) {
      logger.error('Failed to initialize contract service:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Deploy a new EventTicket1155 contract to the blockchain.
   * This method does not require the contractService to be pre-initialized,
   * but it does require the walletService to be initialized with a signer.
   * @returns {Promise<{address: string, transactionHash: string}>} - Details of the deployed contract.
   */
  async deployEventTicketContract() {
    try {
      // Ensure walletService is initialized and has a signer
      if (!walletService.isInitialized || !walletService.wallet) {
        throw new Error('Wallet service not initialized or no signer available. Cannot deploy contract.');
      }

      logger.info('Deploying new EventTicket1155 contract...');

      // Create contract factory using the wallet's signer
      const factory = new ethers.ContractFactory(
        eventTicketABI.abi,
        eventTicketABI.bytecode,
        walletService.wallet // Use the connected wallet as the signer
      );

      // Deploy the contract
      const contract = await factory.deploy();

      // Wait for deployment to finish
      await contract.deployed();

      logger.info(`EventTicket1155 contract deployed at ${contract.address}`);

      // Update the contract address and initialize the service with the new contract
      this.eventTicketAddress = contract.address;
      this.eventTicketContract = contract;
      this.isInitialized = true;

      // Persist the new contract address to the .env file for future restarts
      await this.updateEnvFile(contract.address);

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
   * Persist the deployed contract address to the .env file
   * so the service can auto-connect on the next restart.
   * @param {string} address The deployed contract address
   */
  async updateEnvFile(address) {
    try {
      // Read existing .env (create if missing)
      let envContent = '';
      if (fs.existsSync(this.envPath)) {
        envContent = fs.readFileSync(this.envPath, 'utf8');
      }

      const lines = envContent.split(/\r?\n/);
      let found = false;

      const newLines = lines.map((line) => {
        if (line.startsWith('EVENT_TICKET_CONTRACT=')) {
          found = true;
          return `EVENT_TICKET_CONTRACT=${address}`;
        }
        return line;
      });

      if (!found) {
        newLines.push(`EVENT_TICKET_CONTRACT=${address}`);
      }

      fs.writeFileSync(this.envPath, newLines.join('\n'), 'utf8');
      logger.info('.env updated with new EVENT_TICKET_CONTRACT address.');
    } catch (err) {
      logger.warn('Unable to update .env with contract address:', err.message);
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
        throw new Error('Contract service not initialized. Cannot mint tickets.');
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
   * Get detailed information about a specific ticket
   * @param {uint256} tokenId - The token ID to query
   */
  async getTicketInfo(tokenId) {
    try {
      if (!this.isInitialized) {
        throw new Error('Contract service not initialized. Cannot get ticket info.');
      }
      
      logger.info(`Getting info for ticket ${tokenId}...`);
      
      // Call the contract's getTicket function
      const ticketInfo = await this.eventTicketContract.getTicket(tokenId);
      
      return {
        tokenId,
        eventTimestamp: ticketInfo.eventTimestamp.toString(),
        qrCodeUri: ticketInfo.qrCodeUri,
        mediaUri: ticketInfo.mediaUri,
        isUsed: ticketInfo.isUsed
      };
    } catch (error) {
      logger.error(`Failed to get ticket info for token ID ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Get all tickets issued by this contract
   */
  async getAllTickets() {
    try {
      if (!this.isInitialized) {
        throw new Error('Contract service not initialized. Cannot get tickets.');
      }
      
      logger.info('Getting all tickets...');
      
      // Get the next token ID (represents total tickets + 1)
      const nextTokenId = await this.eventTicketContract.nextTokenId();
      const totalTickets = nextTokenId.toNumber() - 1;
      
      const tickets = [];
      for (let i = 1; i <= totalTickets; i++) {
        try {
          const ticket = await this.getTicketInfo(i);
          tickets.push(ticket);
        } catch (error) {
          logger.warn(`Error getting ticket ${i}, skipping:`, error.message);
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
   * @param {uint256} tokenId - The token ID to check
   */
  async ownsTicket(address, tokenId) {
    try {
      if (!this.isInitialized) {
        throw new Error('Contract service not initialized. Cannot check ticket ownership.');
      }
      
      // Call the contract's balanceOf function
      const balance = await this.eventTicketContract.balanceOf(address, tokenId);
      
      return balance.gt(0);
    } catch (error) {
      logger.error(`Failed to check ticket ownership for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get all tickets owned by a specific address
   * @param {string} address - The owner's address
   */
  async getTicketsByOwner(address) {
    try {
      if (!this.isInitialized) {
        throw new Error('Contract service not initialized. Cannot get tickets by owner.');
      }
      
      logger.info(`Getting tickets for address ${address}...`);
      
      // Get all tickets
      const allTickets = await this.getAllTickets();
      const ownedTickets = [];
      
      // Check ownership for each ticket
      for (const ticket of allTickets) {
        const isOwner = await this.ownsTicket(address, ticket.tokenId);
        if (isOwner) {
          ownedTickets.push(ticket);
        }
      }
      
      return ownedTickets;
    } catch (error) {
      logger.error(`Failed to get tickets for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Validate a ticket for an event
   * @param {uint256} tokenId - The token ID to validate
   * @param {string} ownerAddress - The address claiming to own the ticket
   */
  async validateTicket(tokenId, ownerAddress) {
    try {
      if (!this.isInitialized) {
        throw new Error('Contract service not initialized. Cannot validate ticket.');
      }
      
      // Check if the address owns the ticket
      const isOwner = await this.ownsTicket(ownerAddress, tokenId);
      if (!isOwner) {
        return { valid: false, reason: 'Address does not own this ticket' };
      }
      
      // Get ticket info
      const ticketInfo = await this.getTicketInfo(tokenId);
      
      // Check if ticket is already used
      if (ticketInfo.isUsed) {
        return { valid: false, reason: 'Ticket has already been used' };
      }
      
      // Check if event time is valid (not in the past)
      const eventTime = parseInt(ticketInfo.eventTimestamp) * 1000;
      const now = Date.now();
      
      if (eventTime < now) {
        return { valid: false, reason: 'Event has already passed' };
      }
      
      return { valid: true, ticketInfo };
    } catch (error) {
      logger.error(`Failed to validate ticket ${tokenId} for ${ownerAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get the contract address
   * @returns {string|null} The contract address or null if not set
   */
  getContractAddress() {
    return this.eventTicketAddress;
  }

  /**
   * Check if the contract service is initialized
   * @returns {boolean} True if initialized, false otherwise
   */
  isContractInitialized() {
    return this.isInitialized;
  }
}

const walletService = require('./walletService');
const contractService = new ContractService();
module.exports = contractService;
