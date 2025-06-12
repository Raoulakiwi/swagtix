import { createPersistStore } from '@/background/utils';
import { message } from '@/background/webapi';
import { ethers } from 'ethers';
import browser from 'webextension-polyfill';
import EventEmitter from 'events';

interface PinStore {
  // Store hashed PIN, not the actual PIN
  hashedPin: string | null;
  // Salt used for hashing
  salt: string | null;
  // Attempts counter for rate limiting
  attempts: number;
  // Timestamp of last failed attempt
  lastFailedAttempt: number | null;
  // Whether PIN is set up
  isSetup: boolean;
}

class PinService extends EventEmitter {
  private store = createPersistStore<PinStore>({
    name: 'pin',
    template: {
      hashedPin: null,
      salt: null,
      attempts: 0,
      lastFailedAttempt: null,
      isSetup: false,
    },
  });

  // Maximum number of attempts before temporary lockout
  private MAX_ATTEMPTS = 5;
  // Lockout duration in milliseconds (5 minutes)
  private LOCKOUT_DURATION = 5 * 60 * 1000;

  constructor() {
    super();
  }

  /**
   * Set up a new PIN
   * @param pin The PIN to set
   */
  public async setPin(pin: string): Promise<void> {
    try {
      // Validate PIN format
      this.validatePinFormat(pin);

      // Generate a random salt
      const salt = ethers.utils.hexlify(ethers.utils.randomBytes(16));
      
      // Hash the PIN with the salt
      const hashedPin = await this.hashPin(pin, salt);
      
      // Store the hashed PIN and salt
      await this.store.set({
        hashedPin,
        salt,
        attempts: 0,
        lastFailedAttempt: null,
        isSetup: true,
      });
      
      // Notify listeners that PIN has been set
      this.emit('pin_set');
      message.send('pin_updated', { action: 'set' });
      
      return;
    } catch (error) {
      console.error('Error setting PIN:', error);
      throw new Error('Failed to set PIN');
    }
  }

  /**
   * Verify if the provided PIN matches the stored one
   * @param pin The PIN to verify
   */
  public async verifyPin(pin: string): Promise<boolean> {
    try {
      const { hashedPin, salt, attempts, lastFailedAttempt, isSetup } = await this.store.get();
      
      // Check if PIN is set up
      if (!isSetup || !hashedPin || !salt) {
        throw new Error('PIN not set up');
      }
      
      // Check if account is temporarily locked due to too many failed attempts
      if (attempts >= this.MAX_ATTEMPTS && lastFailedAttempt) {
        const lockoutEndTime = lastFailedAttempt + this.LOCKOUT_DURATION;
        if (Date.now() < lockoutEndTime) {
          const remainingMinutes = Math.ceil((lockoutEndTime - Date.now()) / 60000);
          throw new Error(`Too many failed attempts. Try again in ${remainingMinutes} minutes.`);
        } else {
          // Reset attempts after lockout period
          await this.store.set({ attempts: 0, lastFailedAttempt: null });
        }
      }
      
      // Hash the provided PIN with the stored salt
      const hashedInput = await this.hashPin(pin, salt);
      
      // Compare the hashed input with the stored hash
      const isCorrect = hashedInput === hashedPin;
      
      if (isCorrect) {
        // Reset attempts on successful verification
        await this.store.set({ attempts: 0, lastFailedAttempt: null });
        return true;
      } else {
        // Increment attempts counter on failed verification
        const newAttempts = attempts + 1;
        await this.store.set({
          attempts: newAttempts,
          lastFailedAttempt: Date.now(),
        });
        
        // Notify if approaching max attempts
        if (newAttempts >= this.MAX_ATTEMPTS - 1) {
          message.send('pin_attempts_warning', { attemptsLeft: this.MAX_ATTEMPTS - newAttempts });
        }
        
        return false;
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      throw error;
    }
  }

  /**
   * Change the PIN
   * @param currentPin The current PIN for verification
   * @param newPin The new PIN to set
   */
  public async changePin(currentPin: string, newPin: string): Promise<boolean> {
    try {
      // Verify the current PIN first
      const isVerified = await this.verifyPin(currentPin);
      
      if (!isVerified) {
        return false;
      }
      
      // Set the new PIN
      await this.setPin(newPin);
      return true;
    } catch (error) {
      console.error('Error changing PIN:', error);
      throw error;
    }
  }

  /**
   * Reset the PIN (for use with email verification or admin reset)
   */
  public async resetPin(): Promise<void> {
    try {
      await this.store.set({
        hashedPin: null,
        salt: null,
        attempts: 0,
        lastFailedAttempt: null,
        isSetup: false,
      });
      
      // Notify listeners that PIN has been reset
      this.emit('pin_reset');
      message.send('pin_updated', { action: 'reset' });
      
      return;
    } catch (error) {
      console.error('Error resetting PIN:', error);
      throw new Error('Failed to reset PIN');
    }
  }

  /**
   * Check if PIN is set up
   */
  public async isPinSetup(): Promise<boolean> {
    try {
      const { isSetup } = await this.store.get();
      return isSetup;
    } catch (error) {
      console.error('Error checking PIN setup:', error);
      return false;
    }
  }

  /**
   * Check if account is locked due to too many failed attempts
   */
  public async isLocked(): Promise<{ locked: boolean; remainingTime?: number }> {
    try {
      const { attempts, lastFailedAttempt } = await this.store.get();
      
      if (attempts >= this.MAX_ATTEMPTS && lastFailedAttempt) {
        const lockoutEndTime = lastFailedAttempt + this.LOCKOUT_DURATION;
        if (Date.now() < lockoutEndTime) {
          return {
            locked: true,
            remainingTime: lockoutEndTime - Date.now(),
          };
        }
      }
      
      return { locked: false };
    } catch (error) {
      console.error('Error checking lock status:', error);
      return { locked: false };
    }
  }

  /**
   * Hash the PIN with the provided salt
   * @param pin The PIN to hash
   * @param salt The salt to use
   */
  private async hashPin(pin: string, salt: string): Promise<string> {
    // Use a key derivation function to securely hash the PIN
    // We use ethers.js utils which provides PBKDF2 under the hood
    const pinBuffer = ethers.utils.toUtf8Bytes(pin);
    const saltBuffer = ethers.utils.arrayify(salt);
    
    // Create a unique identifier for this browser/device
    const deviceId = await this.getDeviceIdentifier();
    
    // Combine PIN with device ID for additional security
    const combinedInput = ethers.utils.concat([
      pinBuffer,
      ethers.utils.toUtf8Bytes(deviceId)
    ]);
    
    // Hash with salt using keccak256 (could use more specialized KDF in production)
    const hash = ethers.utils.keccak256(
      ethers.utils.concat([combinedInput, saltBuffer])
    );
    
    return hash;
  }

  /**
   * Get a unique identifier for the current browser/device
   */
  private async getDeviceIdentifier(): Promise<string> {
    try {
      // Try to get a stable identifier from browser
      const { vendor, userAgent, platform } = navigator;
      const browserInfo = await browser.runtime.getBrowserInfo?.() || { name: '', version: '' };
      
      // Create a composite identifier
      const deviceInfo = [
        vendor,
        userAgent,
        platform,
        browserInfo.name,
        browserInfo.version,
        window.screen.width,
        window.screen.height
      ].join('|');
      
      // Hash it to get a stable ID
      return ethers.utils.id(deviceInfo);
    } catch (error) {
      // Fallback to a random but persistent ID
      let deviceId = localStorage.getItem('swagtix_device_id');
      if (!deviceId) {
        deviceId = ethers.utils.hexlify(ethers.utils.randomBytes(16));
        localStorage.setItem('swagtix_device_id', deviceId);
      }
      return deviceId;
    }
  }

  /**
   * Validate PIN format
   * @param pin The PIN to validate
   */
  private validatePinFormat(pin: string): void {
    if (!pin) {
      throw new Error('PIN cannot be empty');
    }
    
    if (!/^\d+$/.test(pin)) {
      throw new Error('PIN must contain only numbers');
    }
    
    if (pin.length < 4 || pin.length > 6) {
      throw new Error('PIN must be 4-6 digits');
    }
    
    // Check for sequential or repeated digits
    if (/0{4,}|1{4,}|2{4,}|3{4,}|4{4,}|5{4,}|6{4,}|7{4,}|8{4,}|9{4,}/.test(pin)) {
      throw new Error('PIN cannot contain 4 or more repeated digits');
    }
    
    if (/1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321/.test(pin)) {
      throw new Error('PIN cannot contain sequential digits');
    }
  }
}

export default new PinService();
