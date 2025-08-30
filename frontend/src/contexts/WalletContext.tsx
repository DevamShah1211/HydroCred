import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

interface WalletContextType {
  account: string | null;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  isConnecting: boolean;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  getBalance: () => Promise<string>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

const SUPPORTED_CHAINS = {
  SEPOLIA: 11155111,
  POLYGON: 137,
  POLYGON_AMOY: 80002,
  LOCALHOST: 1337,
};

const CHAIN_NAMES = {
  [SUPPORTED_CHAINS.SEPOLIA]: 'Sepolia Testnet',
  [SUPPORTED_CHAINS.POLYGON]: 'Polygon Mainnet',
  [SUPPORTED_CHAINS.POLYGON_AMOY]: 'Polygon Amoy Testnet',
  [SUPPORTED_CHAINS.LOCALHOST]: 'Localhost',
};

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const isConnected = !!account && !!provider && !!signer;

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask;
  };

  // Get the current provider
  const getProvider = () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    return null;
  };

  // Connect wallet
  const connect = async () => {
    if (!isMetaMaskInstalled()) {
      toast.error('MetaMask is not installed. Please install MetaMask first.');
      return;
    }

    try {
      setIsConnecting(true);
      
      const provider = getProvider();
      if (!provider) {
        throw new Error('Failed to get provider');
      }

      // Request account access
      const accounts = await provider.send('eth_requestAccounts', []);
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const account = accounts[0];
      const network = await provider.getNetwork();
      const signer = await provider.getSigner();

      setAccount(account);
      setChainId(Number(network.chainId));
      setProvider(provider);
      setSigner(signer);

      toast.success('Wallet connected successfully!');
      
      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAccount(accounts[0]);
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', (chainId: string) => {
        setChainId(Number(chainId));
        window.location.reload();
      });

    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast.error('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    setAccount(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    toast.success('Wallet disconnected');
  };

  // Switch network
  const switchNetwork = async (targetChainId: number) => {
    if (!provider || !window.ethereum) {
      toast.error('Wallet not connected');
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
      
      toast.success(`Switched to ${CHAIN_NAMES[targetChainId as keyof typeof CHAIN_NAMES]}`);
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain not added, try to add it
        try {
          await addNetwork(targetChainId);
        } catch (addError) {
          toast.error('Failed to add network');
        }
      } else {
        toast.error('Failed to switch network');
      }
    }
  };

  // Add network
  const addNetwork = async (chainId: number) => {
    if (!window.ethereum) return;

    const networkConfig = {
      [SUPPORTED_CHAINS.SEPOLIA]: {
        chainId: `0x${SUPPORTED_CHAINS.SEPOLIA.toString(16)}`,
        chainName: 'Sepolia Testnet',
        nativeCurrency: { name: 'Sepolia Ether', symbol: 'SEP', decimals: 18 },
        rpcUrls: ['https://sepolia.infura.io/v3/your-project-id'],
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
      },
      [SUPPORTED_CHAINS.POLYGON]: {
        chainId: `0x${SUPPORTED_CHAINS.POLYGON.toString(16)}`,
        chainName: 'Polygon Mainnet',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        rpcUrls: ['https://polygon-rpc.com'],
        blockExplorerUrls: ['https://polygonscan.com'],
      },
      [SUPPORTED_CHAINS.POLYGON_AMOY]: {
        chainId: `0x${SUPPORTED_CHAINS.POLYGON_AMOY.toString(16)}`,
        chainName: 'Polygon Amoy Testnet',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        rpcUrls: ['https://rpc-amoy.polygon.technology'],
        blockExplorerUrls: ['https://www.oklink.com/amoy'],
      },
    };

    const config = networkConfig[chainId as keyof typeof networkConfig];
    if (!config) {
      toast.error('Unsupported network');
      return;
    }

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [config],
    });
  };

  // Sign message
  const signMessage = async (message: string): Promise<string> => {
    if (!signer) {
      throw new Error('Wallet not connected');
    }
    return await signer.signMessage(message);
  };

  // Get balance
  const getBalance = async (): Promise<string> => {
    if (!provider || !account) {
      throw new Error('Wallet not connected');
    }
    const balance = await provider.getBalance(account);
    return ethers.formatEther(balance);
  };

  // Auto-connect on mount if previously connected
  useEffect(() => {
    const connectWallet = async () => {
      if (isMetaMaskInstalled() && window.ethereum.selectedAddress) {
        await connect();
      }
    };

    connectWallet();
  }, []);

  const value: WalletContextType = {
    account,
    chainId,
    provider,
    signer,
    isConnecting,
    isConnected,
    connect,
    disconnect,
    switchNetwork,
    signMessage,
    getBalance,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};