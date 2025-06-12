import { ethers } from 'ethers';
import EventEmitter from 'events';
import { createPersistStore } from '@/background/utils';
import { message } from '@/background/webapi';
import { CHAINS } from '@/constant/networks.pulsechain';
import eventTicketABI from '@/constant/abi/EventTicket1155.json';
import env from '@/utils/env';
import { walletController } from '../controller';

// Ticket metadata interface
export interface TicketMetadata {
  name: string;
  description: string;
  image: string;
  eventName?: string;
  eventDate?: number;
  venue?: string;
  ticketType?: string;
  seatInfo?: string;
  organizer?: string;
  terms?: string;
}

// Ticket interface
export interface Ticket {
  tokenId: string;
  balance: number;
  metadata: TicketMetadata;
  contractInfo?: {
    eventTimestamp: number;
    qrCodeUri: string;
    mediaUri: string;
  };
}

// Store interface for caching
interface NFTTicketsStore {
  tickets: Record<string, Ticket[]>; // address -> tickets
  lastFetched: Record<string, number>; // address -> timestamp
}

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

class NFTTicketsService extends EventEmitter {
  private store = createPersistStore<NFTTicketsStore>({
    name: 'nftTickets',
    template: {
      tickets: {},
      lastFetched: {},
    },
  });

  constructor() {
    super();
    this.init();
  }

  private async init() {
    // Subscribe to transaction events to refresh tickets after transfers
    walletController.on('tx:confirmed', this.handleTransactionConfirmed.bind(this));
  }

  /**
   * Handle transaction confirmed event to refresh tickets
   */
  private async handleTransactionConfirmed(tx: any) {
    try {
      // Check if this is a ticket transfer transaction
      if (tx.to?.toLowerCase() === env.contracts.eventTicket.toLowerCase()) {
        const currentAccount = await walletController.getCurrentAccount();
        if (currentAccount?.address) {
          // Clear cache for this address
          await this.clearCache(currentAccount.address);
          // Notify UI to refresh tickets
          message.send('tickets_updated');
        }
      }
    } catch (error) {
      console.error('Error handling transaction confirmed:', error);
    }
  }

  /**
   * Get the contract instance for EventTicket1155
   */
  private async getContract() {
    try {
      const provider = await walletController.getProvider(CHAINS.PULSE);
      return new ethers.Contract(env.contracts.eventTicket, eventTicketABI, provider);
    } catch (error) {
      console.error('Error getting contract:', error);
      throw new Error('Failed to connect to ticket contract');
    }
  }

  /**
   * Clear cache for an address
   */
  public async clearCache(address: string) {
    const store = await this.store.get();
    
    // Remove tickets for this address
    if (store.tickets[address]) {
      delete store.tickets[address];
    }
    
    // Remove last fetched timestamp
    if (store.lastFetched[address]) {
      delete store.lastFetched[address];
    }
    
    await this.store.set(store);
  }

  /**
   * Get all tickets owned by an address
   */
  public async getTickets(address: string, forceRefresh = false): Promise<Ticket[]> {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const store = await this.store.get();
        const lastFetched = store.lastFetched[address] || 0;
        const now = Date.now();
        
        // If cache is still valid, return cached tickets
        if (now - lastFetched < CACHE_EXPIRATION && store.tickets[address]?.length > 0) {
          return store.tickets[address];
        }
      }
      
      // Get contract instance
      const contract = await this.getContract();
      
      // Get the next token ID to know how many tokens to check
      const nextTokenId = await contract.nextTokenId();
      const maxTokensToCheck = Math.min(nextTokenId.toNumber(), 100); // Limit to 100 tokens for performance
      
      const ticketsArray: Ticket[] = [];
      
      // Check each token ID
      for (let tokenId = 1; tokenId < maxTokensToCheck; tokenId++) {
        try {
          const balance = await contract.balanceOf(address, tokenId);
          
          if (balance.gt(0)) {
            // Get ticket info from contract
            const ticketInfo = await contract.ticketInfo(tokenId);
            
            // Get URI and parse metadata
            const uri = await contract.uri(tokenId);
            const metadata = await this.parseMetadata(uri, tokenId.toString());
            
            // Add ticket to array
            ticketsArray.push({
              tokenId: tokenId.toString(),
              balance: balance.toNumber(),
              metadata,
              contractInfo: {
                eventTimestamp: ticketInfo.eventTimestamp.toNumber(),
                qrCodeUri: ticketInfo.qrCodeUri,
                mediaUri: ticketInfo.mediaUri,
              },
            });
          }
        } catch (err) {
          console.error(`Error fetching token ${tokenId}:`, err);
          // Continue to next token
        }
      }
      
      // Update cache
      const store = await this.store.get();
      store.tickets[address] = ticketsArray;
      store.lastFetched[address] = Date.now();
      await this.store.set(store);
      
      return ticketsArray;
    } catch (error) {
      console.error('Error fetching tickets:', error);
      throw new Error('Failed to load your tickets');
    }
  }

  /**
   * Get a specific ticket by ID
   */
  public async getTicket(address: string, tokenId: string): Promise<Ticket | null> {
    try {
      // Get contract instance
      const contract = await this.getContract();
      
      // Check if the user owns this ticket
      const balance = await contract.balanceOf(address, tokenId);
      
      if (balance.gt(0)) {
        // Get ticket info from contract
        const ticketInfo = await contract.ticketInfo(tokenId);
        
        // Get URI and parse metadata
        const uri = await contract.uri(tokenId);
        const metadata = await this.parseMetadata(uri, tokenId);
        
        return {
          tokenId,
          balance: balance.toNumber(),
          metadata,
          contractInfo: {
            eventTimestamp: ticketInfo.eventTimestamp.toNumber(),
            qrCodeUri: ticketInfo.qrCodeUri,
            mediaUri: ticketInfo.mediaUri,
          },
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching ticket:', error);
      throw new Error('Failed to load ticket details');
    }
  }

  /**
   * Parse metadata from URI
   */
  private async parseMetadata(uri: string, tokenId: string): Promise<TicketMetadata> {
    try {
      let metadata: TicketMetadata = {
        name: `Ticket #${tokenId}`,
        description: '',
        image: 'https://via.placeholder.com/300x180?text=Ticket+Image',
      };
      
      // Parse metadata from URI
      if (uri.startsWith('data:application/json')) {
        // Parse inline JSON data
        const base64Data = uri.split(',')[1];
        const jsonString = decodeURIComponent(escape(atob(base64Data)));
        const parsedData = JSON.parse(jsonString);
        metadata = { ...metadata, ...parsedData };
      } else if (uri.startsWith('http')) {
        // Fetch from URL
        const response = await fetch(uri);
        const parsedData = await response.json();
        metadata = { ...metadata, ...parsedData };
      }
      
      // Extract event date from description if not explicitly provided
      if (!metadata.eventDate && metadata.description) {
        const match = metadata.description.match(/timestamp (\d+)/);
        if (match) {
          metadata.eventDate = parseInt(match[1]);
        }
      }
      
      return metadata;
    } catch (error) {
      console.error('Error parsing metadata:', error);
      return {
        name: `Ticket #${tokenId}`,
        description: 'Error loading ticket metadata',
        image: 'https://via.placeholder.com/300x180?text=Error+Loading+Ticket',
      };
    }
  }

  /**
   * Transfer a ticket to another address
   */
  public async transferTicket(
    fromAddress: string,
    toAddress: string,
    tokenId: string,
    amount: number
  ): Promise<string> {
    try {
      // Get contract instance with signer
      const provider = await walletController.getProvider(CHAINS.PULSE);
      const signer = provider.getSigner(fromAddress);
      const contract = new ethers.Contract(env.contracts.eventTicket, eventTicketABI, signer);
      
      // Transfer the ticket
      const tx = await contract.safeTransferFrom(
        fromAddress,
        toAddress,
        tokenId,
        amount,
        '0x' // No data
      );
      
      // Wait for transaction confirmation
      await tx.wait();
      
      // Clear cache
      await this.clearCache(fromAddress);
      
      // Notify UI
      message.send('tickets_updated');
      
      return tx.hash;
    } catch (error) {
      console.error('Error transferring ticket:', error);
      throw new Error('Failed to transfer ticket');
    }
  }

  /**
   * Generate QR code data for a ticket
   */
  public generateTicketQR(address: string, tokenId: string): string {
    // Create a secure, verifiable QR code data
    const data = {
      contract: env.contracts.eventTicket,
      tokenId,
      owner: address,
      timestamp: Date.now(),
      type: 'swagtix-ticket',
    };
    
    // In a real implementation, this data should be signed for security
    return JSON.stringify(data);
  }

  /**
   * Check if a ticket is valid for an event
   */
  public async isTicketValid(tokenId: string): Promise<boolean> {
    try {
      // Get contract instance
      const contract = await this.getContract();
      
      // Get ticket info
      const ticketInfo = await contract.ticketInfo(tokenId);
      
      // Check if event timestamp exists (ticket is valid)
      return ticketInfo.eventTimestamp.gt(0);
    } catch (error) {
      console.error('Error checking ticket validity:', error);
      return false;
    }
  }

  /**
   * Get ticket status based on event date
   */
  public getTicketStatus(eventDate?: number): 'upcoming' | 'today' | 'past' {
    if (!eventDate) return 'upcoming';
    
    const now = Math.floor(Date.now() / 1000);
    
    if (eventDate > now) {
      return 'upcoming';
    } else if (eventDate > now - 86400) { // Within 24 hours
      return 'today';
    } else {
      return 'past';
    }
  }

  /**
   * Format date from timestamp
   */
  public formatDate(timestamp?: number): string {
    if (!timestamp) return 'TBD';
    return new Date(timestamp * 1000).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Format time from timestamp
   */
  public formatTime(timestamp?: number): string {
    if (!timestamp) return '';
    return new Date(timestamp * 1000).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

export default new NFTTicketsService();
