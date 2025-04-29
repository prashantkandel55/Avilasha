/**
 * DeFiLlama API Demo Component
 * Demonstrates how to use the DeFiLlama API integration
 */

import { useState, useEffect } from 'react';
import { cryptoService } from '@/services/crypto-service-integration';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { BarChart, TrendingUp, DollarSign, Percent } from 'lucide-react';

export function DeFiLlamaDemo() {
  // State for DeFi data
  const [protocols, setProtocols] = useState<any[]>([]);
  const [chainsTvl, setChainsTvl] = useState<any[]>([]);
  const [yieldPools, setYieldPools] = useState<any[]>([]);
  const [globalTvl, setGlobalTvl] = useState<any[]>([]);
  const [stablecoins, setStablecoins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProtocol, setSelectedProtocol] = useState('');
  const [protocolTvl, setProtocolTvl] = useState<any[]>([]);
  const [protocolLoading, setProtocolLoading] = useState(false);

  // Fetch DeFi data on component mount
  useEffect(() => {
    async function fetchDeFiData() {
      try {
        setLoading(true);
        
        // Fetch all protocols
        const protocolsData = await cryptoService.getAllDeFiProtocols();
        setProtocols(protocolsData.slice(0, 10)); // Show top 10 protocols
        
        // Fetch chains TVL
        const chainsTvlData = await cryptoService.getChainsTvl();
        setChainsTvl(chainsTvlData.slice(0, 10)); // Show top 10 chains
        
        // Fetch yield pools
        const yieldPoolsData = await cryptoService.getYieldPools(10); // Get top 10 yield pools
        setYieldPools(yieldPoolsData);
        
        // Fetch global TVL
        const globalTvlData = await cryptoService.getGlobalTvl();
        // Get last 30 days of data
        const recentGlobalTvl = globalTvlData.slice(-30);
        setGlobalTvl(recentGlobalTvl);
        
        // Fetch stablecoins
        const stablecoinsData = await cryptoService.getStablecoins();
        setStablecoins(stablecoinsData.slice(0, 10)); // Show top 10 stablecoins
      } catch (error) {
        console.error('Error fetching DeFi data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch DeFi data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchDeFiData();
  }, []);

  // Handle protocol selection for TVL data
  const handleProtocolSelect = async (protocol: string) => {
    if (!protocol) return;
    
    try {
      setProtocolLoading(true);
      setSelectedProtocol(protocol);
      
      // Fetch TVL data for selected protocol
      const tvlData = await cryptoService.getProtocolTvl(protocol);
      setProtocolTvl(tvlData.slice(-30)); // Get last 30 days of data
      
      toast({
        title: 'Success',
        description: `TVL data fetched for ${protocol}`,
        variant: 'default'
      });
    } catch (error) {
      console.error(`Error fetching TVL for protocol ${protocol}:`, error);
      toast({
        title: 'Error',
        description: `Failed to fetch TVL data for ${protocol}`,
        variant: 'destructive'
      });
    } finally {
      setProtocolLoading(false);
    }
  };

  // Format TVL value
  const formatTvl = (tvl: number) => {
    if (tvl >= 1e9) {
      return `$${(tvl / 1e9).toFixed(2)}B`;
    } else if (tvl >= 1e6) {
      return `$${(tvl / 1e6).toFixed(2)}M`;
    } else if (tvl >= 1e3) {
      return `$${(tvl / 1e3).toFixed(2)}K`;
    } else {
      return `$${tvl.toFixed(2)}`;
    }
  };

  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };

  // Format percentage change
  const formatChange = (change: number | undefined) => {
    if (change === undefined) return 'N/A';
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h2 className="text-3xl font-bold">DeFiLlama API Demo</h2>
      <p className="text-muted-foreground">
        This component demonstrates how to use the DeFiLlama API integration to access DeFi protocol data, TVL metrics, and yield information.
      </p>
      
      <Tabs defaultValue="protocols" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="protocols">Top Protocols</TabsTrigger>
          <TabsTrigger value="chains">Chains TVL</TabsTrigger>
          <TabsTrigger value="yields">Yield Pools</TabsTrigger>
          <TabsTrigger value="stablecoins">Stablecoins</TabsTrigger>
        </TabsList>
        
        {/* Top Protocols Tab */}
        <TabsContent value="protocols" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Protocols List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Top DeFi Protocols
                </CardTitle>
                <CardDescription>
                  Protocols ranked by Total Value Locked (TVL)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {Array(5).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {protocols.map((protocol) => (
                      <div key={protocol.id} className="flex justify-between items-center p-2 hover:bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                          {protocol.logo && (
                            <img 
                              src={protocol.logo} 
                              alt={protocol.name} 
                              className="h-6 w-6 rounded-full"
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          )}
                          <span className="font-medium">{protocol.name}</span>
                          {protocol.chain && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              {protocol.chain}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatTvl(protocol.tvl)}</div>
                          <div className={`text-xs ${protocol.change_1d >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {formatChange(protocol.change_1d)} (24h)
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => window.open('https://defillama.com/protocols', '_blank')}
                >
                  View All Protocols
                </Button>
              </CardFooter>
            </Card>
            
            {/* Protocol TVL Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Protocol TVL History
                </CardTitle>
                <CardDescription>
                  Select a protocol to view its TVL history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedProtocol}
                    onChange={(e) => handleProtocolSelect(e.target.value)}
                  >
                    <option value="">Select a protocol</option>
                    {protocols.map((protocol) => (
                      <option key={protocol.id} value={protocol.id}>
                        {protocol.name}
                      </option>
                    ))}
                  </select>
                  
                  {protocolLoading ? (
                    <Skeleton className="h-40 w-full" />
                  ) : protocolTvl.length > 0 ? (
                    <div className="h-40 relative">
                      {/* Simple TVL visualization */}
                      <div className="flex items-end h-full gap-1">
                        {protocolTvl.map((data, index) => {
                          const maxTvl = Math.max(...protocolTvl.map(d => d.tvl));
                          const height = (data.tvl / maxTvl) * 100;
                          return (
                            <div 
                              key={index}
                              className="bg-primary/80 hover:bg-primary flex-1"
                              style={{ height: `${height}%` }}
                              title={`${formatDate(data.date)}: ${formatTvl(data.tvl)}`}
                            />
                          );
                        })}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                        <span>{formatDate(protocolTvl[0]?.date)}</span>
                        <span>{formatDate(protocolTvl[protocolTvl.length - 1]?.date)}</span>
                      </div>
                    </div>
                  ) : selectedProtocol ? (
                    <div className="h-40 flex items-center justify-center border rounded-md">
                      No TVL data available for this protocol
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center border rounded-md">
                      Select a protocol to view TVL history
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Chains TVL Tab */}
        <TabsContent value="chains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Chains by TVL
              </CardTitle>
              <CardDescription>
                Blockchain networks ranked by Total Value Locked
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {chainsTvl.map((chain, index) => (
                    <div key={index} className="flex justify-between items-center p-2 hover:bg-muted rounded-md">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{chain.name}</span>
                        {chain.tokenSymbol && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {chain.tokenSymbol}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatTvl(chain.tvl)}</div>
                        <div className={`text-xs ${chain.change_1d >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatChange(chain.change_1d)} (24h)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => window.open('https://defillama.com/chains', '_blank')}
              >
                View All Chains
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Yield Pools Tab */}
        <TabsContent value="yields" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Top Yield Pools
              </CardTitle>
              <CardDescription>
                DeFi yield opportunities ranked by APY
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {yieldPools.map((pool, index) => (
                    <div key={index} className="flex justify-between items-center p-2 hover:bg-muted rounded-md">
                      <div>
                        <div className="font-medium">{pool.project} - {pool.symbol}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {pool.chain}
                          </span>
                          <span>TVL: {formatTvl(pool.tvlUsd)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-green-500">{pool.apy.toFixed(2)}% APY</div>
                        {pool.apyBase && pool.apyReward && (
                          <div className="text-xs text-muted-foreground">
                            Base: {pool.apyBase.toFixed(2)}% + Reward: {pool.apyReward.toFixed(2)}%
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => window.open('https://defillama.com/yields', '_blank')}
              >
                View All Yield Pools
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Stablecoins Tab */}
        <TabsContent value="stablecoins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Top Stablecoins
              </CardTitle>
              <CardDescription>
                Stablecoins ranked by market cap
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {stablecoins.map((stablecoin, index) => (
                    <div key={index} className="flex justify-between items-center p-2 hover:bg-muted rounded-md">
                      <div>
                        <div className="font-medium">{stablecoin.name} ({stablecoin.symbol})</div>
                        <div className="text-xs text-muted-foreground">
                          {stablecoin.pegType} • {stablecoin.pegMechanism}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatTvl(stablecoin.circulating?.pegged)}</div>
                        <div className={`text-xs ${stablecoin.price >= 0.99 && stablecoin.price <= 1.01 ? 'text-green-500' : 'text-red-500'}`}>
                          ${stablecoin.price?.toFixed(3) || 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => window.open('https://defillama.com/stablecoins', '_blank')}
              >
                View All Stablecoins
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DeFiLlamaDemo;