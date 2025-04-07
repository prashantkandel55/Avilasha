interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    isCoinbaseWallet?: boolean;
    isBraveWallet?: boolean;
    request: (args: any) => Promise<any>;
    on: (event: string, listener: any) => void;
    removeAllListeners: (event: string) => void;
  };
  web3?: any;
  coinbaseWalletExtension?: any;
  brave?: any;
  
  // Electron bridge API
  electron?: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    isMaximized: () => Promise<boolean>;
    onMaximizeChange: (callback: (isMaximized: boolean) => void) => void;
    onUpdateAvailable: (callback: () => void) => void;
    onUpdateDownloaded: (callback: () => void) => void;
    hideToTray: () => void;
    showFromTray: () => void;
    onShowError: (callback: (error: { title: string; message: string }) => void) => void;
  };
}

// Ensure TypeScript considers this a module
export {};
