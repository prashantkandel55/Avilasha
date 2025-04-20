import React, { useState } from 'react';
import { walletService } from '@/services/wallet.service';
import { Loader2, CheckCircle, XCircle, X } from 'lucide-react';

const NETWORKS = [
  { label: 'Ethereum', value: 'ethereum' },
  { label: 'Solana', value: 'solana' },
  { label: 'Sui', value: 'sui' },
];

export const WalletConnectModal: React.FC<{ onConnect?: () => void, onClose?: () => void }> = ({ onConnect, onClose }) => {
  const [selectedNetwork, setSelectedNetwork] = useState('ethereum');
  const [connecting, setConnecting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    setSuccess(false);
    let address: string | null = null;
    try {
      if (selectedNetwork === 'ethereum') {
        address = await walletService.connectEthereumWallet();
      } else if (selectedNetwork === 'solana') {
        address = await walletService.connectSolanaWallet();
      } else if (selectedNetwork === 'sui') {
        address = await walletService.connectSuiWallet();
      }
      if (address) {
        await walletService.addWallet(address, selectedNetwork);
        setSuccess(true);
        setTimeout(() => {
          setConnecting(false);
          setSuccess(false);
          if (onConnect) onConnect();
        }, 1000);
      } else {
        setError('Wallet connection failed or was cancelled. Make sure the extension is installed and permission is granted.');
        setConnecting(false);
      }
    } catch (e: any) {
      setError(e.message || 'Connection error. Make sure the wallet extension is installed and permission is granted.');
      setConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-start bg-black/40">
      <div className="relative mt-16 w-full max-w-md bg-gradient-to-br from-emerald-900/90 to-black/90 rounded-3xl shadow-2xl p-8 flex flex-col items-center border border-emerald-700/40 animate-slide-down">
        <button
          className="absolute top-5 right-5 text-emerald-300 hover:text-emerald-100 transition text-lg"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={26} />
        </button>
        <h2 className="text-2xl font-extrabold mb-4 bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent tracking-tight">Connect Wallet</h2>
        <div className="mb-4 w-full">
          <label className="block mb-2 font-medium">Select Chain</label>
          <select
            value={selectedNetwork}
            onChange={e => setSelectedNetwork(e.target.value)}
            className="w-full p-2 rounded-lg border focus:outline-primary bg-black/30 text-white"
            disabled={connecting}
          >
            {NETWORKS.map(net => (
              <option key={net.value} value={net.value}>{net.label}</option>
            ))}
          </select>
        </div>
        <button
          className={`relative flex items-center justify-center gap-2 bg-primary text-white px-6 py-2 rounded-lg w-full mt-2 font-semibold text-lg transition-all duration-200 
            ${connecting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary/90'} 
            ${success ? 'bg-green-600' : ''}`}
          onClick={handleConnect}
          disabled={connecting || success}
        >
          {connecting && <Loader2 className="animate-spin mr-2" size={22} />}
          {success && <CheckCircle className="text-green-200 mr-2" size={22} />}
          {!connecting && !success && `Connect ${NETWORKS.find(n => n.value === selectedNetwork)?.label} Wallet`}
          {connecting && !success && 'Connecting...'}
          {success && 'Connected!'}
        </button>
        {error && (
          <div className="flex items-center text-red-500 mt-3 text-center gap-2">
            <XCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        <div className="text-xs text-muted-foreground mt-3 text-center">
          <p>
            {selectedNetwork === 'ethereum' && 'Requires MetaMask or compatible Ethereum wallet extension.'}
            {selectedNetwork === 'solana' && 'Requires Phantom Wallet extension.'}
            {selectedNetwork === 'sui' && 'Requires Sui Wallet extension (e.g. Sui Wallet by Mysten Labs).'}
          </p>
        </div>
      </div>
      <style>{`
        @keyframes slide-down {
          0% { transform: translateY(-60px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-down { animation: slide-down 0.35s cubic-bezier(.38,1.15,.7,1) both; }
      `}</style>
    </div>
  );
};
