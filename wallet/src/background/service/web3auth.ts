import { Web3Auth } from '@web3auth/modal';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { CHAIN_NAMESPACES, SafeEventEmitterProvider } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { CHAINS } from '@/constant/networks.pulsechain'; // Adjusted path

// Environment variables (ensure these are set in your .env or build process)
const WEB3AUTH_CLIENT_ID = process.env.REACT_APP_WEB3AUTH_CLIENT_ID || 'YOUR_WEB3AUTH_CLIENT_ID_STAGING'; // Fallback to a generic one for now
const WEB3AUTH_NETWORK = process.env.REACT_APP_WEB3AUTH_NETWORK || 'sapphire_devnet'; // Or 'sapphire_mainnet'

class Web3AuthService {
  private web3auth: Web3Auth | null = null;
  private provider: SafeEventEmitterProvider | null = null;

  constructor() {
    // console.log('Web3AuthService constructor called');
    // console.log('WEB3AUTH_CLIENT_ID:', WEB3AUTH_CLIENT_ID);
    // console.log('WEB3AUTH_NETWORK:', WEB3AUTH_NETWORK);
  }

  // Public method to initialize Web3Auth
  public async init(): Promise<void> {
    if (this.web3auth) {
      // console.log('Web3Auth already initialized.');
      return;
    }
    try {
      // console.log('Initializing Web3Auth...');
      const chainConfig = {
        chainNamespace: CHAIN_NAMESPACES.EIP155,
        chainId: CHAINS.PULSE.chainId, // Use 0x171 for PulseChain mainnet (369 in decimal)
        rpcTarget: CHAINS.PULSE.rpcURL,
        displayName: CHAINS.PULSE.name,
        blockExplorer: CHAINS.PULSE.blockExplorerURL,
        ticker: CHAINS.PULSE.symbol,
        tickerName: CHAINS.PULSE.name,
      };

      this.web3auth = new Web3Auth({
        clientId: WEB3AUTH_CLIENT_ID,
        web3AuthNetwork: WEB3AUTH_NETWORK as any, // Allowed values: 'sapphire_devnet', 'sapphire_mainnet', 'mainnet', 'cyan', 'aqua', 'celeste'
        chainConfig,
        uiConfig: {
          appName: 'SwagTix',
          theme: 'dark',
          loginMethodsOrder: ['email_passwordless', 'google', 'twitter'],
          defaultLanguage: 'en',
        },
        enableLogging: process.env.NODE_ENV === 'development',
      });

      const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });

      const openloginAdapter = new OpenloginAdapter({
        privateKeyProvider,
        adapterSettings: {
          uxMode: 'popup', // Can be 'popup' or 'redirect'
          loginConfig: {
            jwt: {
              verifier: 'swagtix-email-verifier', // Name of your Web3Auth verifier
              typeOfLogin: 'jwt',
              clientId: WEB3AUTH_CLIENT_ID,
            },
          },
        },
      });
      this.web3auth.configureAdapter(openloginAdapter);
      await this.web3auth.initModal();
      // console.log('Web3Auth Modal initialized.');
      if (this.web3auth.provider) {
        this.provider = this.web3auth.provider;
        // console.log('Web3Auth provider set.');
      }
    } catch (error) {
      console.error('Error initializing Web3Auth:', error);
      this.web3auth = null; // Reset on error
      throw error; // Re-throw to allow caller to handle
    }
  }

  // Public method for email login
  public async loginWithEmail(email: string): Promise<{ privateKey: string; email: string; name?: string } | null> {
    if (!this.web3auth) {
      // console.log('Web3Auth not initialized. Initializing now...');
      await this.init(); // Ensure it's initialized
      if (!this.web3auth) { // Check again after init attempt
        throw new Error('Web3Auth could not be initialized.');
      }
    }
    
    try {
      // console.log('Attempting Web3Auth login with email:', email);
      // The OpenloginAdapter typically handles the UI for email input and OTP.
      // The `connectTo` with `loginProvider: 'email_passwordless'` and specific `extraLoginOptions`
      // might be needed if you want to trigger a specific flow.
      // For a general email login, usually, initModal and then connect() is enough,
      // and the modal allows the user to choose email.
      // If you want to directly trigger email, it's more complex and might involve
      // directly interacting with the OpenloginAdapter's specific methods if available,
      // or ensuring your verifier is set up for direct email triggers.

      // This simplified call assumes the modal will handle email input
      // or that the verifier is set up for direct email.
      const web3authProvider = await this.web3auth.connect();
      if (!web3authProvider) {
        // console.log('Web3Auth connect() did not return a provider.');
        return null;
      }
      this.provider = web3authProvider;
      // console.log('Web3Auth connected, provider obtained.');

      const privateKey = await this.provider.request({ method: 'eth_private_key' });
      const userInfo = await this.web3auth.getUserInfo();

      // console.log('Login successful. Private Key:', privateKey, 'User Info:', userInfo);
      return {
        privateKey: privateKey as string,
        email: userInfo.email || email, // Prefer email from Web3Auth if available
        name: userInfo.name,
      };
    } catch (error) {
      console.error('Web3Auth Login Error:', error);
      return null;
    }
  }

  public async isLoggedIn(): Promise<boolean> {
    if (!this.web3auth) {
      try {
        await this.init();
      } catch (initError) {
        console.error('Failed to init Web3Auth in isLoggedIn check:', initError);
        return false;
      }
      if (!this.web3auth) return false;
    }
    // @ts-ignore TODO: web3auth.status is poorly typed upstream
    return this.web3auth.status === 'connected';
  }

  public async getUserInfo(): Promise<any> {
    if (!this.web3auth || !(await this.isLoggedIn())) {
      // console.log('Cannot get user info, Web3Auth not connected.');
      return null;
    }
    try {
      const userInfo = await this.web3auth.getUserInfo();
      // console.log('User Info from Web3Auth:', userInfo);
      return userInfo;
    } catch (error) {
      console.error('Error getting user info from Web3Auth:', error);
      return null;
    }
  }

  public async logout(): Promise<void> {
    if (!this.web3auth || !(await this.isLoggedIn())) {
      // console.log('Not logged in or Web3Auth not initialized.');
      return;
    }
    try {
      // console.log('Logging out from Web3Auth...');
      await this.web3auth.logout();
      this.provider = null;
      // console.log('Web3Auth logout successful.');
    } catch (error) {
      console.error('Web3Auth Logout Error:', error);
    }
  }

  public getProvider(): SafeEventEmitterProvider | null {
    return this.provider;
  }
}

// Export a singleton instance
const web3authService = new Web3AuthService();
export default web3authService;
