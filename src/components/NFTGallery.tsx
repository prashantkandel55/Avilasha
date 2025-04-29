import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cryptoService } from '@/services/crypto-service-integration';
import { walletService } from '@/services/wallet.service';
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Tag, CircleDot, ExternalLink } from 'lucide-react';

interface NFTItem {
  token_address: string;
  token_id: string;
  name: string;
  symbol: string;
  contract_type: string;
  image?: string;
  metadata?: any;
  normalized_metadata?: {
    name: string;
    description: string;
    image: string;
    attributes: Array<{ trait_type: string; value: string }>;
  };
}

interface NFTCollection {
  token_address: string;
  name: string;
  symbol: string;
  total_supply?: string;
  floor_price?: number;
  image?: string;
}

interface NFTTransfer {
  block_timestamp: string;
  transaction_hash: string;
  from_address: string;
  to_address: string;
  token_id: string;
  token_address: string;
  value: string;
  contract_type: string;
}

const getActivityIcon = (from: string, to: string, walletAddress: string) => {
  const lowerWallet = walletAddress.toLowerCase();
  
  if (from === '0x0000000000000000000000000000000000000000') {
    return <ArrowDownLeft className="text-green-500" title="Mint" />;
  } else if (to.toLowerCase() === lowerWallet) {
    return <ArrowDownLeft className="text-green-500" title="Received" />;
  } else if (from.toLowerCase() === lowerWallet) {
    return <ArrowUpRight className="text-pink-500" title="Sent" />;
  } else {
    return <RefreshCw className="text-blue-500" title="Transfer" />;
  }
};

const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

const NFTGallery: React.FC<{ walletAddress?: string }> = ({ walletAddress }) => {
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const [transfers, setTransfers] = useState<NFTTransfer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('nfts');
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [wallets, setWallets] = useState<any[]>([]);

  useEffect(() => {
    async function fetchWallets() {
      const allWallets = await walletService.getAllWallets?.() || [];
      setWallets(allWallets);
      
      // If walletAddress is provided, use it; otherwise use the first wallet
      const address = walletAddress || (allWallets.length > 0 ? allWallets[0].address : '');
      setSelectedWallet(address);
    }
    fetchWallets();
  }, [walletAddress]);

  useEffect(() => {
    if (selectedWallet) {
      fetchNFTData(selectedWallet);
    }
  }, [selectedWallet, activeTab]);

  const fetchNFTData = async (address: string) => {
    setLoading(true);
    try {
      if (activeTab === 'nfts' || activeTab === 'all') {
        const nftData = await cryptoService.getWalletNFTs(address, 'eth');
        setNfts(nftData);
      }
      
      if (activeTab === 'collections' || activeTab === 'all') {
        const collectionsData = await cryptoService.getWalletNFTCollections(address, 'eth');
        setCollections(collectionsData);
      }
      
      if (activeTab === 'activity' || activeTab === 'all') {
        const transfersData = await cryptoService.getNFTTransfers(address, 'eth');
        setTransfers(transfersData);
      }
    } catch (error) {
      console.error('Error fetching NFT data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (selectedWallet) {
      fetchNFTData(selectedWallet);
    }
  };

  const renderNFTs = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (nfts.length === 0) {
      return (
        <div className="text-center p-8">
          <p className="text-muted-foreground">No NFTs found for this wallet</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nfts.map((nft) => {
          const metadata = nft.normalized_metadata || 
            (nft.metadata && typeof nft.metadata === 'string' ? JSON.parse(nft.metadata) : nft.metadata) || {};
          
          const imageUrl = metadata?.image || nft.image || `https://via.placeholder.com/300x300?text=${encodeURIComponent(nft.name || 'NFT')}`;
          
          return (
            <Card key={`${nft.token_address}-${nft.token_id}`} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-square overflow-hidden bg-muted">
                <img 
                  src={imageUrl} 
                  alt={metadata?.name || nft.name || 'NFT'}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://via.placeholder.com/300x300?text=${encodeURIComponent(nft.name || 'NFT')}`;
                  }}
                />
              </div>
              <CardContent className="p-4">
                <CardTitle className="text-lg truncate">{metadata?.name || nft.name || 'Unnamed NFT'}</CardTitle>
                <CardDescription className="truncate">
                  {nft.symbol} #{nft.token_id}
                </CardDescription>
                {metadata?.attributes && metadata.attributes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {metadata.attributes.slice(0, 3).map((attr: any, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {attr.trait_type}: {attr.value}
                      </Badge>
                    ))}
                    {metadata.attributes.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{metadata.attributes.length - 3} more</Badge>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between">
                <Button variant="outline" size="sm" className="text-xs">
                  View Details
                </Button>
                <a 
                  href={`https://etherscan.io/token/${nft.token_address}?a=${nft.token_id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  <ExternalLink size={16} />
                </a>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderCollections = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (collections.length === 0) {
      return (
        <div className="text-center p-8">
          <p className="text-muted-foreground">No collections found for this wallet</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((collection) => (
          <Card key={collection.token_address}>
            <CardHeader>
              <CardTitle className="text-lg">{collection.name}</CardTitle>
              <CardDescription>{collection.symbol}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Floor Price</span>
                <span className="font-medium">{collection.floor_price ? `${collection.floor_price} ETH` : 'N/A'}</span>
              </div>
              {collection.total_supply && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Supply</span>
                  <span className="font-medium">{parseInt(collection.total_supply).toLocaleString()}</span>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full">
                View Collection
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  const renderActivity = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      );
    }

    if (transfers.length === 0) {
      return (
        <div className="text-center p-8">
          <p className="text-muted-foreground">No activity found for this wallet</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {transfers.map((transfer) => {
          const date = new Date(transfer.block_timestamp);
          const formattedDate = date.toLocaleDateString();
          
          return (
            <div key={transfer.transaction_hash} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex-shrink-0">
                {getActivityIcon(transfer.from_address, transfer.to_address, selectedWallet)}
              </div>
              <div className="flex-1">
                <div className="font-medium">
                  {transfer.from_address === '0x0000000000000000000000000000000000000000' 
                    ? 'Minted' 
                    : transfer.from_address.toLowerCase() === selectedWallet.toLowerCase()
                    ? `Sent to ${formatAddress(transfer.to_address)}`
                    : `Received from ${formatAddress(transfer.from_address)}`
                  }
                </div>
                <div className="text-sm text-muted-foreground">
                  Token ID: {transfer.token_id} • {formattedDate}
                </div>
              </div>
              <a 
                href={`https://etherscan.io/tx/${transfer.transaction_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
              >
                <ExternalLink size={16} />
              </a>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">NFT Gallery</h2>
          <p className="text-muted-foreground">View and manage your NFT collection</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="nfts" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full sm:w-[400px]">
          <TabsTrigger value="nfts">NFTs</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="nfts" className="mt-0">
            {renderNFTs()}
          </TabsContent>
          <TabsContent value="collections" className="mt-0">
            {renderCollections()}
          </TabsContent>
          <TabsContent value="activity" className="mt-0">
            {renderActivity()}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default NFTGallery;