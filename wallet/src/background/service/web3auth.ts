import { CHAIN_INFO } from '@/constant/networks.pulsechain';
import { IWeb3Auth } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { Web3Auth } from '@web3auth/modal';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { ADAPTER_EVENTS, CHAIN_NAMESPACES, WALLET_ADAPTERS } from '@web3auth/base';
import { ethers } from 'ethers';
import EventEmitter from 'events';
import permissionService from './permission';
import { createPersistStore } from '@/background/utils';
import { keyringService } from './keyring';
import { message } from '@/background/webapi';

const WEB3AUTH_CLIENT_ID = process.env.WEB3AUTH_CLIENT_ID || 'YOUR_WEB3AUTH_CLIENT_ID'; // Replace with actual client ID
const WEB3AUTH_NETWORK = 'testnet'; // Change to 'mainnet' for production

interface Web3AuthStore {
  isLoggedIn: boolean;
  userInfo: {
    email?: string;
    name?: string;
    profileImage?: string;
    verifier?: string;
    verifierId?: string;
  } | null;
  sessionId?: string;
}

class Web3AuthService extends EventEmitter {
  private web3auth: IWeb3Auth | null = null;
  private provider: any = null;
  private ethereumProvider: EthereumPrivateKeyProvider | null = null;
  private store = createPersistStore<Web3AuthStore>({
    name: 'web3auth',
    template: {
      isLoggedIn: false,
      userInfo: null,
      sessionId: undefined,
    },
  });

  constructor() {
    super();
    this.init();
  }

  private async init() {
    try {
      // Configure the Ethereum provider for PulseChain
      this.ethereumProvider = new EthereumPrivateKeyProvider({
        config: {
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.EIP155,
            chainId: CHAIN_INFO.PULSE.chainId,
            rpcTarget: CHAIN_INFO.PULSE.rpcUrls[0],
            displayName: CHAIN_INFO.PULSE.chainName,
            blockExplorer: CHAIN_INFO.PULSE.blockExplorerUrls[0],
            ticker: CHAIN_INFO.PULSE.nativeCurrency.symbol,
            tickerName: CHAIN_INFO.PULSE.nativeCurrency.name,
          },
        },
      });

      // Initialize Web3Auth
      this.web3auth = new Web3Auth({
        clientId: WEB3AUTH_CLIENT_ID,
        chainConfig: {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: CHAIN_INFO.PULSE.chainId,
          rpcTarget: CHAIN_INFO.PULSE.rpcUrls[0],
        },
        web3AuthNetwork: WEB3AUTH_NETWORK,
        uiConfig: {
          appName: 'SwagTix Wallet',
          theme: 'dark',
          loginMethodsOrder: ['email_passwordless'],
          defaultLanguage: 'en',
          appLogo: 'https://swagtix.com/logo.png', // Replace with your app logo
        },
      });

      // Configure OpenLogin adapter
      const openloginAdapter = new OpenloginAdapter({
        loginSettings: {
          mfaLevel: 'none',
        },
        adapterSettings: {
          whiteLabel: {
            name: 'SwagTix',
            logoLight: 'https://swagtix.com/logo.png', // Replace with your app logo
            logoDark: 'https://swagtix.com/logo-dark.png', // Replace with your app logo
            defaultLanguage: 'en',
            dark: true,
          },
        },
      });
      
      this.web3auth.configureAdapter(openloginAdapter);

      // Subscribe to Web3Auth events
      this.subscribeToEvents();

      await this.web3auth.initModal();
      
      // Check if user was previously logged in
      if (await this.store.get('isLoggedIn')) {
        try {
          // Attempt to reconnect
          await this.web3auth.connect();
          this.provider = this.web3auth.provider;
          await this.getUserInfo();
        } catch (error) {
          console.error('Failed to reconnect Web3Auth session:', error);
          await this.store.set({
            isLoggedIn: false,
            userInfo: null,
          });
        }
      }
    } catch (error) {
      console.error('Failed to initialize Web3Auth:', error);
    }
  }

  private subscribeToEvents() {
    if (!this.web3auth) return;

    this.web3auth.on(ADAPTER_EVENTS.CONNECTED, async (data) => {
      console.log('Web3Auth connected:', data);
      this.provider = this.web3auth!.provider;
      await this.getUserInfo();
      await this.store.set({ isLoggedIn: true });
      
      // Import the Web3Auth account to Rabby keyring
      await this.importToKeyring();
      
      this.emit('connected', data);
    });

    this.web3auth.on(ADAPTER_EVENTS.DISCONNECTED, async () => {
      console.log('Web3Auth disconnected');
      this.provider = null;
      await this.store.set({
        isLoggedIn: false,
        userInfo: null,
      });
      this.emit('disconnected');
    });

    this.web3auth.on(ADAPTER_EVENTS.ERRORED, (error) => {
      console.error('Web3Auth error:', error);
      this.emit('error', error);
    });
  }

  public async login(): Promise<boolean> {
    if (!this.web3auth) {
      console.error('Web3Auth not initialized');
      return false;
    }

    try {
      this.provider = await this.web3auth.connect();
      return true;
    } catch (error) {
      console.error('Error during Web3Auth login:', error);
      return false;
    }
  }

  public async logout(): Promise<void> {
    if (!this.web3auth) {
      console.error('Web3Auth not initialized');
      return;
    }

    try {
      await this.web3auth.logout();
      this.provider = null;
      await this.store.set({
        isLoggedIn: false,
        userInfo: null,
      });
      this.emit('disconnected');
    } catch (error) {
      console.error('Error during Web3Auth logout:', error);
    }
  }

  public async getUserInfo() {
    if (!this.web3auth || !this.web3auth.connected) {
      console.error('Web3Auth not connected');
      return null;
    }

    try {
      const userInfo = await this.web3auth.getUserInfo();
      await this.store.set({ userInfo });
      return userInfo;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }

  public async getPrivateKey(): Promise<string | null> {
    if (!this.provider) {
      console.error('Provider not initialized');
      return null;
    }

    try {
      const privateKey = await this.provider.request({
        method: 'eth_private_key',
      });
      return privateKey;
    } catch (error) {
      console.error('Error fetching private key:', error);
      return null;
    }
  }

  public async getAccounts(): Promise<string[]> {
    if (!this.provider) {
      console.error('Provider not initialized');
      return [];
    }

    try {
      const ethersProvider = new ethers.providers.Web3Provider(this.provider);
      const signer = ethersProvider.getSigner();
      const address = await signer.getAddress();
      return [address];
    } catch (error) {
      console.error('Error getting accounts:', error);
      return [];
    }
  }

  public async getBalance(): Promise<string> {
    if (!this.provider) {
      console.error('Provider not initialized');
      return '0';
    }

    try {
      const ethersProvider = new ethers.providers.Web3Provider(this.provider);
      const signer = ethersProvider.getSigner();
      const address = await signer.getAddress();
      const balance = await ethersProvider.getBalance(address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }

  public async importToKeyring(): Promise<void> {
    try {
      const privateKey = await this.getPrivateKey();
      if (!privateKey) {
        throw new Error('Failed to get private key from Web3Auth');
      }

      // Check if the account already exists in keyring
      const accounts = await keyringService.getAccounts();
      const userInfo = await this.getUserInfo();
      const email = userInfo?.email || 'web3auth-user';
      
      // Create a formatted private key (add 0x prefix if not present)
      const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
      
      // Import the private key to the keyring
      await keyringService.importPrivateKey(formattedPrivateKey, `Web3Auth (${email})`);
      
      // Notify UI about the imported account
      message.send('wallet_web3auth_imported');
    } catch (error) {
      console.error('Error importing Web3Auth account to keyring:', error);
      throw error;
    }
  }

  public async isLoggedIn(): Promise<boolean> {
    return (await this.store.get('isLoggedIn')) || false;
  }

  public async getProvider() {
    return this.provider;
  }

  public async getWeb3AuthUserInfo() {
    return await this.store.get('userInfo');
  }
}

export default new Web3AuthService();
