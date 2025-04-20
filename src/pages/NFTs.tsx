import React, { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Tag, CircleDot } from 'lucide-react';
import { walletService } from '@/services/wallet.service';
import { WalletConnectModal } from '@/components/WalletConnectModal';

const getActivityIcon = (type: string) => {
  if (type === "Purchase" || type === "Mint") {
    return <ArrowDownLeft className="text-green-500" />;
  } else if (type === "Sale") {
    return <ArrowUpRight className="text-pink-500" />;
  } else if (type === "Transfer") {
    return <RefreshCw className="text-blue-500" />;
  } else if (type === "Offer") {
    return <Tag className="text-purple-500" />;
  } else {
    return <CircleDot className="text-gray-500" />;
  }
};

// Create some sample NFT data
const nftCollections = [
  {
    id: 1,
    name: "Crypto Punks",
    items: 4,
    floorPrice: 68.5,
    totalValue: 274,
    image: "https://via.placeholder.com/150/FF5733/FFFFFF?text=CryptoPunks"
  },
  {
    id: 2,
    name: "Bored Apes",
    items: 2,
    floorPrice: 32.8,
    totalValue: 65.6,
    image: "https://via.placeholder.com/150/33A8FF/FFFFFF?text=BoredApes"
  },
  {
    id: 3,
    name: "Azuki",
    items: 3,
    floorPrice: 12.2,
    totalValue: 36.6,
    image: "https://via.placeholder.com/150/8333FF/FFFFFF?text=Azuki"
  },
  {
    id: 4,
    name: "Doodles",
    items: 1,
    floorPrice: 6.8,
    totalValue: 6.8,
    image: "https://via.placeholder.com/150/FF33A8/FFFFFF?text=Doodles"
  }
];

const NFTs = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWalletModal, setShowWalletModal] = useState(false);

  useEffect(() => {
    async function fetchWallets() {
      const allWallets = await walletService.getAllWallets?.() || [];
      setWallets(allWallets);
      setLoading(false);
    }
    fetchWallets();
  }, []);

  if (loading) {
    return <div className="text-center p-10">Loading NFTs...</div>;
  }

  if (!wallets.length) {
    return (
      <div className="glassmorphism glassmorphism-hover p-8 rounded-2xl shadow-lg animate-fade-in text-center">
        <h2 className="text-2xl font-bold mb-2">No Wallet Connected</h2>
        <p className="mb-4">Connect a wallet to view your NFTs.</p>
        <button
          className="inline-block bg-primary text-white px-6 py-2 rounded-lg shadow hover:bg-primary/90 transition"
          onClick={() => setShowWalletModal(true)}
        >
          Connect Wallet
        </button>
        {showWalletModal && (
          <WalletConnectModal onConnect={() => {
            setShowWalletModal(false);
            (async () => {
              const allWallets = await walletService.getAllWallets?.() || [];
              setWallets(allWallets);
            })();
          }} />
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="slide-up-animation">
        <h1 className="text-3xl font-bold mb-1">NFT Collection</h1>
        <p className="text-muted-foreground mb-6">Manage and track your NFT portfolio across multiple chains</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="rounded-xl border p-6 bg-card transition-all duration-300 hover:shadow-lg">
          <h3 className="text-lg font-medium mb-1 text-muted-foreground">Total Collections</h3>
          <div className="text-3xl font-bold">{nftCollections.length}</div>
        </div>
        <div className="rounded-xl border p-6 bg-card transition-all duration-300 hover:shadow-lg">
          <h3 className="text-lg font-medium mb-1 text-muted-foreground">Total Items</h3>
          <div className="text-3xl font-bold">{nftCollections.reduce((sum, coll) => sum + coll.items, 0)}</div>
        </div>
        <div className="rounded-xl border p-6 bg-card transition-all duration-300 hover:shadow-lg">
          <h3 className="text-lg font-medium mb-1 text-muted-foreground">Highest Floor</h3>
          <div className="text-3xl font-bold">{Math.max(...nftCollections.map(coll => coll.floorPrice))} ETH</div>
        </div>
        <div className="rounded-xl border p-6 bg-card transition-all duration-300 hover:shadow-lg">
          <h3 className="text-lg font-medium mb-1 text-muted-foreground">Total Value</h3>
          <div className="text-3xl font-bold">{nftCollections.reduce((sum, coll) => sum + coll.totalValue, 0).toFixed(1)} ETH</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 fade-in-animation" style={{animationDelay: "0.2s"}}>
        {nftCollections.map((collection) => (
          <div 
            key={collection.id} 
            className="rounded-xl border overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary cursor-pointer group"
          >
            <div className="relative">
              <img src={collection.image} alt={collection.name} className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                <div>
                  <h3 className="text-white font-bold text-lg">{collection.name}</h3>
                  <p className="text-white/80 text-sm">{collection.items} items</p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Floor Price</div>
                  <div className="font-medium">{collection.floorPrice} ETH</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Total Value</div>
                  <div className="font-medium">{collection.totalValue} ETH</div>
                </div>
              </div>
              
              <hr className="border-muted" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Recent Activity</span>
                <div className="flex space-x-1">
                  {["Purchase", "Sale", "Transfer"].map((type, i) => (
                    <div key={i} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                      {getActivityIcon(type)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NFTs;
