/**
 * Free Crypto API Demo Component
 * Demonstrates how to use the free cryptocurrency API services
 */

import { useState, useEffect } from 'react';
import { cryptoService } from '@/services/crypto-service-integration';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

export function FreeCryptoApiDemo() {
  // State for cryptocurrency data
  const [prices, setPrices] = useState<Record<string, Record<string, number>>>({});
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for wallet data
  const [walletAddress, setWalletAddress] = useState('');
  const [walletTokens, setWalletTokens] = useState<any[]>([]);
  const [walletNfts, setWalletNfts] = useState<any[]>([]);
  const [walletLoading, setWalletLoading] = useState(false);

  // Fetch cryptocurrency data on component mount
  useEffect(() => {
    async function fetchCryptoData() {
      try {
        setLoading(true);
        
        // Fetch prices for top cryptocurrencies
        const priceData = await cryptoService.getPrices(
          ['bitcoin', 'ethereum', 'solana', 'cardano', 'ripple'],
          ['usd']
        );
        setPrices(priceData);
        
        // Fetch trending coins
        const trendingData = await cryptoService.getTrendingCoins();
        setTrending(trendingData.coins || []);
      } catch (error) {
        console.error('Error fetching crypto data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch cryptocurrency data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchCryptoData();
  }, []);

  // Handle wallet data fetching
  const handleFetchWalletData = async () => {
    if (!walletAddress || walletAddress.length < 40) {
      toast({
        title: 'Invalid Address',
        description: 'Please enter a valid wallet address',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setWalletLoading(true);
      
      // Fetch wallet tokens (ERC20)
      const tokens = await cryptoService.getWalletTokens(walletAddress);
      setWalletTokens(tokens);
      
      // Fetch wallet NFTs
      const nfts = await cryptoService.getWalletNFTs(walletAddress);
      setWalletNfts(nfts);
      
      toast({
        title: 'Success',
        description: 'Wallet data fetched successfully',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch wallet data',
        variant: 'destructive'
      });
    } finally {
      setWalletLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h2 className="text-3xl font-bold">Free Crypto API Demo</h2>
      <p className="text-muted-foreground">
        This component demonstrates the integration with free cryptocurrency APIs
      </p>
      
      <Tabs defaultValue="prices">
        <TabsList>
          <TabsTrigger value="prices">Crypto Prices</TabsTrigger>
          <TabsTrigger value="wallet">Wallet Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="prices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Prices</CardTitle>
              <CardDescription>
                Real-time cryptocurrency prices from CoinGecko API
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(prices).map(([coinId, priceData]) => (
                    <div key={coinId} className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium capitalize">{coinId}</span>
                      <span className="font-mono">
                        ${priceData.usd?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setLoading(true);
                  cryptoService.getPrices(
                    ['bitcoin', 'ethereum', 'solana', 'cardano', 'ripple'],
                    ['usd']
                  ).then(setPrices).finally(() => setLoading(false));
                }}
              >
                Refresh Prices
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Trending Coins</CardTitle>
              <CardDescription>
                Currently trending cryptocurrencies from CoinGecko API
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  {trending.slice(0, 5).map((coin, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">#{index + 1}</span>
                        <span className="font-medium">{coin.item?.name || 'Unknown'}</span>
                        <span className="text-muted-foreground text-xs">{coin.item?.symbol || '?'}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {coin.item?.price_btc ? `₿${coin.item.price_btc.toFixed(8)}` : 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="wallet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Explorer</CardTitle>
              <CardDescription>
                View tokens and NFTs for any Ethereum wallet address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Ethereum wallet address"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleFetchWalletData}
                  disabled={walletLoading}
                >
                  {walletLoading ? 'Loading...' : 'Fetch Data'}
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Tokens</h3>
                  {walletLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ) : walletTokens.length > 0 ? (
                    <div className="space-y-2">
                      {walletTokens.slice(0, 5).map((token, index) => (
                        <div key={index} className="flex justify-between items-center border-b pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{token.symbol || 'Unknown'}</span>
                            <span className="text-muted-foreground text-xs">{token.name || 'Unknown Token'}</span>
                          </div>
                          <span className="font-mono text-sm">
                            {token.balance_formatted || token.balance || '0'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No tokens found or wallet address not entered</p>
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">NFTs</h3>
                  {walletLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ) : walletNfts.length > 0 ? (
                    <div className="space-y-2">
                      {walletNfts.slice(0, 5).map((nft, index) => (
                        <div key={index} className="flex justify-between items-center border-b pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{nft.name || 'Unnamed NFT'}</span>
                            <span className="text-muted-foreground text-xs">#{nft.token_id?.substring(0, 8) || '?'}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {nft.contract_type || 'Unknown Type'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No NFTs found or wallet address not entered</p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              Data provided by Covalent, Moralis, and Etherscan APIs
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default FreeCryptoApiDemo;