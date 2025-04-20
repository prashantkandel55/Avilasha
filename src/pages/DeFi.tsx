import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowUpRight, TrendingUp, ArrowRightLeft, Wallet, Percent, ChevronRight, BarChart, Layers, CreditCard, PiggyBank, Landmark, ChevronDown, Globe, ArrowDownRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { walletService } from '@/services/wallet.service';
import { WalletConnectModal } from '@/components/WalletConnectModal';

const DeFi = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    async function fetchWallets() {
      const allWallets = await walletService.getAllWallets?.() || [];
      setWallets(allWallets);
      setLoading(false);
    }
    fetchWallets();
  }, []);

  if (loading) {
    return <div className="text-center p-10">Loading DeFi dashboard...</div>;
  }

  if (!wallets.length) {
    return (
      <div className="glassmorphism glassmorphism-hover p-8 rounded-2xl shadow-lg animate-fade-in text-center">
        <h2 className="text-2xl font-bold mb-2">No Wallet Connected</h2>
        <p className="mb-4">Connect a wallet to view your DeFi dashboard.</p>
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

  const handleClaimRewards = () => {
    toast({
      title: "Rewards Claimed",
      description: "Your rewards have been successfully claimed",
    });
  };
  
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">DeFi Dashboard</h1>
        <p className="text-muted-foreground">Track and manage your decentralized finance investments</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total Value Locked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$15,483.25</div>
            <div className="flex items-center mt-1 text-sm">
              <span className="text-green-500 font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                +6.8%
              </span>
              <span className="text-muted-foreground ml-2">7d change</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,247.63</div>
            <div className="flex items-center mt-1 text-sm">
              <span className="text-green-500 font-medium flex items-center">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                +$158.45
              </span>
              <span className="text-muted-foreground ml-2">This month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Unclaimed Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$75.32</div>
            <div className="mt-1">
              <Button 
                size="sm" 
                className="h-7 text-xs bg-green-600 hover:bg-green-700"
                onClick={handleClaimRewards}
              >
                Claim All Rewards
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="portfolio" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="portfolio" className="flex items-center gap-2">
            <Wallet size={16} />
            <span>Portfolio</span>
          </TabsTrigger>
          <TabsTrigger value="staking" className="flex items-center gap-2">
            <Percent size={16} />
            <span>Staking</span>
          </TabsTrigger>
          <TabsTrigger value="lending" className="flex items-center gap-2">
            <CreditCard size={16} />
            <span>Lending</span>
          </TabsTrigger>
          <TabsTrigger value="farming" className="flex items-center gap-2">
            <PiggyBank size={16} />
            <span>Yield Farming</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="portfolio" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>DeFi Portfolio</CardTitle>
                  <CardDescription>Your active DeFi positions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { protocol: 'Aave', network: 'Ethereum', assets: 'ETH, USDC', tvl: '$4,850.32', apy: '3.8%', earnings: '+$183.25', logo: '🟣' },
                      { protocol: 'Compound', network: 'Ethereum', assets: 'USDC, DAI', tvl: '$3,200.00', apy: '2.9%', earnings: '+$92.80', logo: '🟢' },
                      { protocol: 'Uniswap', network: 'Ethereum', assets: 'ETH/USDC, ETH/LINK', tvl: '$2,150.50', apy: '12.5%', earnings: '+$268.75', logo: '🦄' },
                      { protocol: 'Lido', network: 'Ethereum', assets: 'stETH', tvl: '$1,930.00', apy: '4.2%', earnings: '+$81.06', logo: '🔷' },
                      { protocol: 'Curve', network: 'Ethereum', assets: '3pool (DAI/USDC/USDT)', tvl: '$1,550.00', apy: '3.5%', earnings: '+$54.25', logo: '⚡' },
                    ].map((position, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-md">
                        <div className="flex items-center mb-2 sm:mb-0">
                          <div className="text-2xl mr-3">{position.logo}</div>
                          <div>
                            <div className="font-medium">{position.protocol}</div>
                            <div className="text-xs text-muted-foreground flex items-center">
                              {position.network}
                              <span className="mx-1.5">•</span>
                              {position.assets}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-right">
                          <div>
                            <div className="text-xs text-muted-foreground">TVL</div>
                            <div className="font-medium">{position.tvl}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">APY</div>
                            <div className="font-medium text-green-500">{position.apy}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Earnings</div>
                            <div className="font-medium text-green-500">{position.earnings}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Asset Allocation by Protocol</CardTitle>
                  <CardDescription>Distribution of your assets across DeFi protocols</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'Aave', percentage: 32, color: 'bg-purple-500' },
                      { name: 'Compound', percentage: 21, color: 'bg-green-500' },
                      { name: 'Uniswap', percentage: 14, color: 'bg-pink-500' },
                      { name: 'Lido', percentage: 12, color: 'bg-blue-500' },
                      { name: 'Curve', percentage: 10, color: 'bg-red-500' },
                      { name: 'Others', percentage: 11, color: 'bg-gray-500' },
                    ].map((protocol) => (
                      <div key={protocol.name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{protocol.name}</span>
                          <span className="font-medium">{protocol.percentage}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className={`${protocol.color} h-2 rounded-full`}
                            style={{ width: `${protocol.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full justify-start">
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    Swap Tokens
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Layers className="mr-2 h-4 w-4" />
                    Bridge Assets
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart className="mr-2 h-4 w-4" />
                    View Analytics
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Gas Prices</CardTitle>
                  <CardDescription>Current network fees</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { network: 'Ethereum', price: '25 Gwei', speed: '~12 sec', status: 'Normal' },
                    { network: 'Polygon', price: '38 Gwei', speed: '~5 sec', status: 'Normal' },
                    { network: 'Arbitrum', price: '0.1 Gwei', speed: '~3 sec', status: 'Low' },
                    { network: 'Optimism', price: '0.001 Gwei', speed: '~2 sec', status: 'Low' },
                  ].map((network) => (
                    <div key={network.network} className="flex justify-between items-center border-b last:border-0 py-2">
                      <span className="font-medium">{network.network}</span>
                      <div className="text-right">
                        <div className="font-medium">{network.price}</div>
                        <div className="text-xs text-muted-foreground">{network.speed}</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>DeFi Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { title: 'Aave V3 launches on zkSync', date: '2h ago' },
                    { title: 'ETH staking rewards increased by 4%', date: '5h ago' },
                    { title: 'New exploit found in popular DeFi project', date: '1d ago' },
                  ].map((insight, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{insight.title}</div>
                        <div className="text-xs text-muted-foreground">{insight.date}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" className="w-full">View All Updates</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="staking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Staking Positions</CardTitle>
              <CardDescription>Your active staking positions across different networks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { token: 'Ethereum', protocol: 'Lido', staked: '0.6 ETH', value: '$1,930.00', apr: '4.2%', rewards: '0.0252 ETH', status: 'Active', logo: '💠' },
                  { token: 'Solana', protocol: 'Marinade', staked: '18.5 SOL', value: '$2,525.62', apr: '6.1%', rewards: '1.13 SOL', status: 'Active', logo: '🟣' },
                  { token: 'Polkadot', protocol: 'Native', staked: '50 DOT', value: '$850.00', apr: '14%', rewards: '7 DOT', status: 'Active', logo: '⚫' },
                  { token: 'Cosmos', protocol: 'Native', staked: '25 ATOM', value: '$625.00', apr: '19%', rewards: '4.75 ATOM', status: 'Active', logo: '⚛️' },
                ].map((position, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">{position.logo}</div>
                        <div>
                          <div className="font-medium flex items-center">
                            {position.token}
                            <Badge variant="outline" className="ml-2 text-xs">{position.protocol}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {position.staked} staked
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-500/10 text-green-500">
                        {position.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Value</div>
                        <div className="font-medium">{position.value}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">APR</div>
                        <div className="font-medium text-green-500">{position.apr}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Rewards</div>
                        <div className="font-medium">{position.rewards}</div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" className="h-8">Claim Rewards</Button>
                      <Button size="sm" variant="outline" className="h-8">Unstake</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Staking Opportunities</CardTitle>
              <CardDescription>Top opportunities based on APR and security</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { token: 'Ethereum', protocol: 'Rocket Pool', apr: '4.5%', security: 'High', minStake: '0.01 ETH', logo: '💠' },
                  { token: 'Cardano', protocol: 'Native', apr: '5.1%', security: 'High', minStake: '10 ADA', logo: '🔵' },
                  { token: 'Tezos', protocol: 'Native', apr: '6.0%', security: 'High', minStake: '1 XTZ', logo: '🔷' },
                  { token: 'Near', protocol: 'Native', apr: '11.0%', security: 'Medium', minStake: '1 NEAR', logo: '🔶' },
                ].map((opportunity, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-md">
                    <div className="flex items-center">
                      <div className="text-2xl mr-3">{opportunity.logo}</div>
                      <div>
                        <div className="font-medium">{opportunity.token}</div>
                        <div className="text-xs text-muted-foreground">
                          Via {opportunity.protocol} • Min {opportunity.minStake}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-500">{opportunity.apr} APR</div>
                      <div className="text-xs">
                        <Badge variant="outline" className="text-xs">
                          {opportunity.security} Security
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">View All Staking Options</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="lending" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Lending Positions</CardTitle>
                <CardDescription>Assets supplied to lending protocols</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { token: 'USDC', protocol: 'Aave', amount: '2,500 USDC', value: '$2,500.00', apy: '3.8%', ltv: '80%', logo: '💵' },
                    { token: 'ETH', protocol: 'Compound', amount: '0.5 ETH', value: '$1,611.78', apy: '2.1%', ltv: '82.5%', logo: '💠' },
                    { token: 'USDT', protocol: 'Aave', amount: '1,000 USDT', value: '$1,000.00', apy: '3.5%', ltv: '75%', logo: '💵' },
                  ].map((position, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <div className="text-xl mr-3">{position.logo}</div>
                          <div>
                            <div className="font-medium">{position.token}</div>
                            <div className="text-xs text-muted-foreground">on {position.protocol}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{position.value}</div>
                          <div className="text-xs text-muted-foreground">{position.amount}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <div className="text-xs text-muted-foreground">Supply APY</div>
                          <div className="text-sm font-medium text-green-500">{position.apy}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Max LTV</div>
                          <div className="text-sm font-medium">{position.ltv}</div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs">Supply More</Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs">Withdraw</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Your Borrowing Positions</CardTitle>
                <CardDescription>Assets borrowed from lending protocols</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { token: 'WBTC', protocol: 'Aave', amount: '0.05 WBTC', value: '$1,350.00', apy: '4.2%', health: '2.3', logo: '🔶' },
                  ].map((position, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <div className="text-xl mr-3">{position.logo}</div>
                          <div>
                            <div className="font-medium">{position.token}</div>
                            <div className="text-xs text-muted-foreground">on {position.protocol}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{position.value}</div>
                          <div className="text-xs text-muted-foreground">{position.amount}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <div className="text-xs text-muted-foreground">Borrow APY</div>
                          <div className="text-sm font-medium text-amber-500">{position.apy}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Health Factor</div>
                          <div className="text-sm font-medium text-green-500">{position.health}</div>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-xs text-muted-foreground mb-1">Health Factor</div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs">Repay</Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs">Borrow More</Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4">
                  <div className="border border-dashed rounded-md p-4 text-center">
                    <Landmark className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <h3 className="font-medium mb-1">No other borrowing positions</h3>
                    <p className="text-sm text-muted-foreground mb-3">You can borrow assets using your supplied collateral</p>
                    <Button size="sm">Borrow Assets</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Lending Market Overview</CardTitle>
              <CardDescription>Current rates across top lending protocols</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Asset</th>
                      <th className="text-right py-3 px-2">Protocol</th>
                      <th className="text-right py-3 px-2">Supply APY</th>
                      <th className="text-right py-3 px-2">Borrow APY</th>
                      <th className="text-right py-3 px-2">Total Supply</th>
                      <th className="text-right py-3 px-2">Utilization</th>
                      <th className="text-right py-3 px-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { asset: 'USDC', protocol: 'Aave', supplyApy: '3.8%', borrowApy: '4.2%', totalSupply: '$1.2B', utilization: '78%', logo: '💵' },
                      { asset: 'ETH', protocol: 'Compound', supplyApy: '2.1%', borrowApy: '3.5%', totalSupply: '$950M', utilization: '65%', logo: '💠' },
                      { asset: 'WBTC', protocol: 'Aave', supplyApy: '1.9%', borrowApy: '3.7%', totalSupply: '$480M', utilization: '62%', logo: '🔶' },
                      { asset: 'DAI', protocol: 'Compound', supplyApy: '3.4%', borrowApy: '4.8%', totalSupply: '$620M', utilization: '72%', logo: '💵' },
                      { asset: 'USDT', protocol: 'Aave', supplyApy: '3.5%', borrowApy: '5.1%', totalSupply: '$860M', utilization: '81%', logo: '💵' },
                    ].map((market, index) => (
                      <tr key={index} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-2">
                          <div className="flex items-center">
                            <div className="mr-2 text-xl">{market.logo}</div>
                            <span className="font-medium">{market.asset}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-2">{market.protocol}</td>
                        <td className="text-right py-3 px-2 text-green-500">{market.supplyApy}</td>
                        <td className="text-right py-3 px-2 text-amber-500">{market.borrowApy}</td>
                        <td className="text-right py-3 px-2">{market.totalSupply}</td>
                        <td className="text-right py-3 px-2">
                          <div className="flex items-center justify-end">
                            <span className="mr-2">{market.utilization}</span>
                            <div className="w-16 bg-secondary rounded-full h-1.5">
                              <div 
                                className="bg-primary h-1.5 rounded-full" 
                                style={{ width: market.utilization }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="text-right py-3 px-2">
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            Supply
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="farming" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Yield Farms</CardTitle>
              <CardDescription>Your active liquidity and farming positions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { 
                    name: 'ETH-USDC',
                    protocol: 'Uniswap V3',
                    value: '$1,550.50',
                    liquidity: '$1,550.50',
                    feesApr: '5.3%',
                    rewardsApr: '7.2%', 
                    totalApr: '12.5%',
                    range: '1,900 - 2,200',
                    logo1: '💠',
                    logo2: '💵'
                  },
                  { 
                    name: 'ETH-LINK',
                    protocol: 'Uniswap V3',
                    value: '$600.00',
                    liquidity: '$600.00',
                    feesApr: '4.8%',
                    rewardsApr: '5.2%', 
                    totalApr: '10.0%',
                    range: '0.0065 - 0.0085',
                    logo1: '💠',
                    logo2: '🔗'
                  },
                  { 
                    name: 'USDC-USDT-DAI',
                    protocol: 'Curve',
                    value: '$1,550.00',
                    liquidity: '$1,550.00',
                    feesApr: '1.5%',
                    rewardsApr: '2.0%', 
                    totalApr: '3.5%',
                    range: 'Stable',
                    logo1: '💵',
                    logo2: '💵'
                  },
                ].map((farm, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                      <div className="flex items-center mb-2 sm:mb-0">
                        <div className="relative mr-4">
                          <span className="text-xl absolute top-0 left-0">{farm.logo1}</span>
                          <span className="text-xl absolute bottom-0 right-0">{farm.logo2}</span>
                          <div className="w-8 h-8"></div>
                        </div>
                        <div>
                          <div className="font-medium">{farm.name}</div>
                          <div className="text-xs text-muted-foreground">{farm.protocol}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 sm:ml-auto sm:mr-2">
                        {farm.totalApr} APR
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Value</div>
                        <div className="font-medium">{farm.value}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Fees APR</div>
                        <div className="font-medium text-green-500">{farm.feesApr}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Rewards APR</div>
                        <div className="font-medium text-green-500">{farm.rewardsApr}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Range</div>
                        <div className="font-medium">{farm.range}</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" className="h-8">Claim Rewards</Button>
                      <Button size="sm" variant="outline" className="h-8">Add Liquidity</Button>
                      <Button size="sm" variant="outline" className="h-8">Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Top Yield Farming Opportunities</CardTitle>
              <CardDescription>Highest yielding opportunities sorted by APR</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Pool</th>
                      <th className="text-right py-3 px-2">Protocol</th>
                      <th className="text-right py-3 px-2">TVL</th>
                      <th className="text-right py-3 px-2">Fees APR</th>
                      <th className="text-right py-3 px-2">Rewards APR</th>
                      <th className="text-right py-3 px-2">Total APR</th>
                      <th className="text-right py-3 px-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { pool: 'ETH-ARB', protocol: 'Camelot', tvl: '$56M', feesApr: '6.8%', rewardsApr: '28.4%', totalApr: '35.2%' },
                      { pool: 'WBTC-ETH', protocol: 'Uniswap V3', tvl: '$235M', feesApr: '7.5%', rewardsApr: '12.3%', totalApr: '19.8%' },
                      { pool: 'GMX-ETH', protocol: 'Sushi', tvl: '$18M', feesApr: '5.4%', rewardsApr: '13.8%', totalApr: '19.2%' },
                      { pool: 'MATIC-ETH', protocol: 'QuickSwap', tvl: '$12M', feesApr: '4.2%', rewardsApr: '14.3%', totalApr: '18.5%' },
                      { pool: 'USDC-ETH', protocol: 'Uniswap V3', tvl: '$185M', feesApr: '5.8%', rewardsApr: '9.3%', totalApr: '15.1%' },
                    ].map((opportunity, index) => (
                      <tr key={index} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-2 font-medium">{opportunity.pool}</td>
                        <td className="text-right py-3 px-2">{opportunity.protocol}</td>
                        <td className="text-right py-3 px-2">{opportunity.tvl}</td>
                        <td className="text-right py-3 px-2 text-green-500">{opportunity.feesApr}</td>
                        <td className="text-right py-3 px-2 text-green-500">{opportunity.rewardsApr}</td>
                        <td className="text-right py-3 px-2 font-medium text-green-500">{opportunity.totalApr}</td>
                        <td className="text-right py-3 px-2">
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            Add Liquidity
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">View All Opportunities</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeFi;
