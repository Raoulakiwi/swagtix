const { NFTStorage, File } = require('nft.storage');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class NFTStorageService {
  constructor() {
    this.client = null;
    this.initialized = false;
    this.apiKey = process.env.NFT_STORAGE_API_KEY;
  }

  initialize() {
    if (!this.apiKey) {
      logger.error('NFT.storage API key not found in environment variables. Please set NFT_STORAGE_API_KEY.');
      throw new Error('NFT.storage API key not found');
    }
    this.client = new NFTStorage({ token: this.apiKey });
    this.initialized = true;
    logger.info('NFT.storage service initialized');
    return this.initialized;
  }

  isInitialized() {
    return this.initialized;
  }

  /**
   * Uploads an image buffer to IPFS via NFT.storage.
   * @param {Buffer} imageBuffer - The image data as a Buffer.
   * @param {string} fileName - The name of the file.
   * @param {string} description - A description for the NFT.storage upload.
   * @returns {Promise<{success: boolean, url: string, cid: string}>} - The URL and CID of the uploaded image.
   */
  async uploadImage(imageBuffer, fileName, description = 'Uploaded with SwagTix') {
    if (!this.isInitialized()) {
      this.initialize(); // Attempt to initialize if not already
    }

    try {
      const file = new File([imageBuffer], fileName, { type: 'image/png' });
      
      logger.info(`Uploading ${fileName} to NFT.storage...`);
      const cid = await this.client.storeBlob(file);
      
      const url = `https://${cid}.ipfs.nftstorage.link/${fileName}`; // Construct URL with filename
      logger.info(`Uploaded to NFT.storage: ${url}`);
      
      return {
        success: true,
        url,
        cid
      };
    } catch (error) {
      logger.error('NFT.storage image upload failed:', error);
      throw new Error(`Failed to upload image to NFT.storage: ${error.message}`);
    }
  }

  /**
   * Uploads JSON metadata to IPFS via NFT.storage.
   * @param {object} metadata - The JSON metadata object.
   * @returns {Promise<{success: boolean, url: string, cid: string}>} - The URL and CID of the uploaded metadata.
   */
  async uploadMetadata(metadata) {
    if (!this.isInitialized()) {
      this.initialize(); // Attempt to initialize if not already
    }

    try {
      logger.info(`Uploading metadata to NFT.storage...`);
      const metadataString = JSON.stringify(metadata);
      const metadataBlob = new Blob([metadataString], { type: 'application/json' });
      const cid = await this.client.storeBlob(metadataBlob);
      
      const url = `https://${cid}.ipfs.nftstorage.link/metadata.json`; // Standard filename for metadata
      logger.info(`Metadata uploaded to NFT.storage: ${url}`);
      
      return {
        success: true,
        url,
        cid
      };
    } catch (error) {
      logger.error('NFT.storage metadata upload failed:', error);
      throw new Error(`Failed to upload metadata to NFT.storage: ${error.message}`);
    }
  }

  /**
   * Placeholder for generating and uploading QR codes.
   * This method will be fully implemented once QRCodeService is available.
   * @param {string} baseUrl - The base URL for the QR codes.
   * @param {number} startId - The starting ticket ID.
   * @param {number} count - The number of QR codes to generate.
   * @returns {Promise<{success: boolean, url: string, message: string}>} - A promise resolving to the result of the operation.
   */
  async generateQRCodesAndUpload(baseUrl, startId, count) {
    logger.warn('generateQRCodesAndUpload is a placeholder and needs QRCodeService implementation.');
    return {
      success: true,
      url: `${baseUrl}`,
      message: 'QR code base URL ready (placeholder)'
    };
  }
}

module.exports = NFTStorageService;
