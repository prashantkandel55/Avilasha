
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, BarChart, PieChart, Wallet, TrendingUp, Calendar } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const data = [
  { name: 'Jan', value: 4500 },
  { name: 'Feb', value: 5000 },
  { name: 'Mar', value: 6800 },
  { name: 'Apr', value: 8100 },
  { name: 'May', value: 9000 },
  { name: 'Jun', value: 10200 },
  { name: 'Jul', value: 11500 },
];

const PortfolioAnalytics = () => {
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Portfolio Analytics</h1>
        <p className="text-muted-foreground">Track and analyze your portfolio performance over time</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <PieChart size={16} />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp size={16} />
            <span>Performance</span>
          </TabsTrigger>
          <TabsTrigger value="allocation" className="flex items-center gap-2">
            <Wallet size={16} />
            <span>Allocation</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Calendar size={16} />
            <span>Historical</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total Portfolio Value</CardTitle>
                <CardDescription>Current value of all your assets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">$48,256.78</div>
                <div className="flex items-center mt-1 text-sm">
                  <span className="text-green-500 font-medium flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +5.34%
                  </span>
                  <span className="text-muted-foreground ml-2">Last 24h</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total Profit/Loss</CardTitle>
                <CardDescription>All-time performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">+$12,835.45</div>
                <div className="text-sm text-muted-foreground mt-1">+36.2% ROI</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Daily Change</CardTitle>
                <CardDescription>Value change in last 24h</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">+$1,267.32</div>
                <div className="text-sm text-muted-foreground mt-1">+2.7% from previous day</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Portfolio Growth</CardTitle>
              <CardDescription>How your portfolio has grown over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#8884d8"
                      fillOpacity={1}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Key metrics about your portfolio performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="bg-card border rounded-md p-4">
                  <div className="text-sm text-muted-foreground">ROI</div>
                  <div className="text-2xl font-bold mt-1">36.2%</div>
                </div>
                <div className="bg-card border rounded-md p-4">
                  <div className="text-sm text-muted-foreground">Annualized Return</div>
                  <div className="text-2xl font-bold mt-1">18.5%</div>
                </div>
                <div className="bg-card border rounded-md p-4">
                  <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                  <div className="text-2xl font-bold mt-1">1.23</div>
                </div>
                <div className="bg-card border rounded-md p-4">
                  <div className="text-sm text-muted-foreground">Max Drawdown</div>
                  <div className="text-2xl font-bold mt-1">-28.7%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Best & Worst Performers</CardTitle>
              <CardDescription>Your best and worst performing assets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium mb-3">Top Performers</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'Solana', symbol: 'SOL', price: '$136.52', change: '+18.7%' },
                      { name: 'Ethereum', symbol: 'ETH', price: '$3,245.67', change: '+12.3%' },
                      { name: 'Arbitrum', symbol: 'ARB', price: '$1.82', change: '+8.5%' },
                    ].map((asset) => (
                      <div key={asset.symbol} className="flex justify-between items-center p-3 border rounded-md">
                        <div className="flex items-center gap-2">
                          <div className="bg-primary/20 p-2 rounded-full">
                            <TrendingUp size={16} className="text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{asset.name}</div>
                            <div className="text-sm text-muted-foreground">{asset.symbol}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{asset.price}</div>
                          <div className="text-sm text-green-500">{asset.change}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Worst Performers</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'Dogecoin', symbol: 'DOGE', price: '$0.12', change: '-5.7%' },
                      { name: 'Cardano', symbol: 'ADA', price: '$0.45', change: '-3.8%' },
                      { name: 'Polkadot', symbol: 'DOT', price: '$6.72', change: '-2.1%' },
                    ].map((asset) => (
                      <div key={asset.symbol} className="flex justify-between items-center p-3 border rounded-md">
                        <div className="flex items-center gap-2">
                          <div className="bg-red-500/20 p-2 rounded-full">
                            <TrendingUp size={16} className="text-red-500 transform rotate-180" />
                          </div>
                          <div>
                            <div className="font-medium">{asset.name}</div>
                            <div className="text-sm text-muted-foreground">{asset.symbol}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{asset.price}</div>
                          <div className="text-sm text-red-500">{asset.change}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocation" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation</CardTitle>
                <CardDescription>Breakdown of your portfolio by asset</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  {/* Placeholder for Pie chart */}
                  <div className="h-64 w-64 mx-auto bg-muted rounded-full flex items-center justify-center">
                    <PieChart size={64} className="text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Bitcoin (BTC)', percentage: '45%', color: 'bg-yellow-500' },
                    { name: 'Ethereum (ETH)', percentage: '30%', color: 'bg-blue-500' },
                    { name: 'Solana (SOL)', percentage: '15%', color: 'bg-purple-500' },
                    { name: 'Others', percentage: '10%', color: 'bg-gray-500' },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <div className="flex-1">{item.name}</div>
                      <div>{item.percentage}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Market Category Exposure</CardTitle>
                <CardDescription>Exposure to different market segments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Layer 1 Blockchains', percentage: 65, value: '65%' },
                    { name: 'DeFi Protocols', percentage: 20, value: '20%' },
                    { name: 'NFT & Gaming', percentage: 8, value: '8%' },
                    { name: 'Web3 Infrastructure', percentage: 5, value: '5%' },
                    { name: 'Stablecoins', percentage: 2, value: '2%' },
                  ].map((category) => (
                    <div key={category.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{category.name}</span>
                        <span className="font-medium">{category.value}</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2.5">
                        <div
                          className="bg-primary h-2.5 rounded-full"
                          style={{ width: category.value }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historical Performance</CardTitle>
              <CardDescription>View your portfolio's performance over different time periods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                {['1D', '1W', '1M', '3M', 'YTD', '1Y', 'All'].map((period) => (
                  <button
                    key={period}
                    className={`px-3 py-1 text-sm rounded-md ${
                      period === '1M' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>

              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorValue2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#8884d8"
                      fillOpacity={1}
                      fill="url(#colorValue2)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PortfolioAnalytics;
