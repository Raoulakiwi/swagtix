const QRCode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class QRCodeService {
  constructor(nftStorageService) {
    this.nftStorageService = nftStorageService;
  }

  /**
   * Generates a QR code for the given text and returns it as a Buffer.
   * @param {string} text - The text to encode in the QR code.
   * @param {object} [options={}] - Options for QR code generation (e.g., width, errorCorrectionLevel).
   * @returns {Promise<Buffer>} - A Promise that resolves with the QR code image as a Buffer.
   */
  async generateQRCode(text, options = {}) {
    try {
      // Generate QR code as data URL
      const dataUrl = await QRCode.toDataURL(text, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 300,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        ...options
      });
      
      // Convert data URL to buffer
      const data = dataUrl.split(',')[1];
      const buffer = Buffer.from(data, 'base64');
      
      return buffer;
    } catch (error) {
      logger.error('QR code generation failed:', error);
      throw new Error(`QR code generation failed: ${error.message}`);
    }
  }

  /**
   * Generates a batch of QR codes for tickets and optionally uploads them to NFT.storage.
   * @param {string} baseUrl - The base URL for the ticket (e.g., "https://example.com/ticket/"). The ticket ID will be appended.
   * @param {number} startId - The starting ticket ID for the batch.
   * @param {number} count - The number of QR codes to generate.
   * @returns {Promise<{success: boolean, url?: string, message?: string, qrCodes?: Array<object>}>} - Result of the batch generation/upload.
   */
  async generateQRCodesForTickets(baseUrl, startId, count) {
    try {
      logger.info(`Generating QR codes for ${count} tickets starting from ID ${startId}`);
      
      const qrCodes = [];
      
      // Create temporary directory for QR codes
      const tempDir = path.join(__dirname, '../temp/qrcodes');
      await fs.mkdir(tempDir, { recursive: true });
      
      // Generate QR codes
      for (let i = 0; i < count; i++) {
        const ticketId = startId + i;
        const ticketUrl = `${baseUrl}${ticketId}`;
        
        // Generate QR code
        const qrBuffer = await this.generateQRCode(ticketUrl);
        
        // Save QR code to temp file
        const filePath = path.join(tempDir, `ticket_${ticketId}.png`);
        await fs.writeFile(filePath, qrBuffer);
        
        qrCodes.push({
          ticketId,
          url: ticketUrl,
          filePath
        });
      }
      
      // If NFT.storage service is available, upload QR codes
      if (this.nftStorageService && this.nftStorageService.isInitialized()) {
        logger.info('Uploading QR codes to NFT.storage...');
        
        // Prepare metadata for the collection of QR codes
        const metadata = {
          name: 'Ticket QR Codes Collection',
          description: `QR codes for tickets ${startId} to ${startId + count - 1} for SwagTix event.`,
          image: `https://${qrCodes[0].cid}.ipfs.nftstorage.link/${path.basename(qrCodes[0].filePath)}`, // Use first QR as cover
          properties: {
            ticket_range: `${startId}-${startId + count - 1}`,
            base_url: baseUrl,
            qr_codes_count: count
          }
        };
        
        // Upload metadata
        const metadataResult = await this.nftStorageService.uploadMetadata(metadata);
        
        // Upload each QR code individually
        for (const qrCode of qrCodes) {
          const fileBuffer = await fs.readFile(qrCode.filePath);
          const fileName = path.basename(qrCode.filePath);
          
          await this.nftStorageService.uploadImage(
            fileBuffer,
            fileName,
            `QR code for ticket ${qrCode.ticketId}`
          );
        }
        
        // Clean up temporary files
        await fs.rm(tempDir, { recursive: true, force: true });

        return {
          success: true,
          url: metadataResult.url, // URL to the metadata on IPFS
          cid: metadataResult.cid,
          message: `Generated and uploaded ${qrCodes.length} QR codes to NFT.storage.`,
          qrCodes: qrCodes.map(qr => ({ ticketId: qr.ticketId, url: qr.url })) // Return basic info
        };
      }
      
      // If NFT.storage is not available, return local QR code data
      logger.warn('NFT.storage service not initialized. QR codes generated locally but not uploaded.');
      return {
        success: true,
        message: 'QR codes generated locally (NFT.storage not configured).',
        count: qrCodes.length,
        qrCodes: qrCodes.map(qr => ({ ticketId: qr.ticketId, url: qr.url, filePath: qr.filePath }))
      };
    } catch (error) {
      logger.error('Batch QR code generation failed:', error);
      throw new Error(`Batch QR code generation failed: ${error.message}`);
    }
  }
}

// Export a function that takes nftStorageService as a dependency
module.exports = (nftStorageService) => new QRCodeService(nftStorageService);
