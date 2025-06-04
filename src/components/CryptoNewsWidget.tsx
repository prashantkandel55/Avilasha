import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cryptoService } from '@/services/crypto-service-integration';
import { Search, ExternalLink, Clock, RefreshCw, Filter } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  image: string;
  date: string;
  topics: string[];
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  type: string;
  tickers: string[];
}

interface CryptoNewsWidgetProps {
  coins?: string[];
  limit?: number;
  showSearch?: boolean;
}

const CryptoNewsWidget: React.FC<CryptoNewsWidgetProps> = ({ 
  coins = [], 
  limit = 5,
  showSearch = true
}) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredCoins, setFilteredCoins] = useState<string[]>(coins);

  useEffect(() => {
    fetchNews();
  }, [filteredCoins]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      // Mock news data for demo purposes
      const mockNews: NewsItem[] = [
        {
          id: '1',
          title: 'Bitcoin Surges Past $60,000 as Institutional Interest Grows',
          description: 'Bitcoin has surpassed $60,000 for the first time in weeks as institutional investors continue to show interest in the cryptocurrency.',
          url: 'https://example.com/news/1',
          source: 'Crypto News',
          image: 'https://via.placeholder.com/800x450?text=Bitcoin+News',
          date: '2025-04-15',
          topics: ['Bitcoin', 'Markets'],
          sentiment: 'Positive',
          type: 'news',
          tickers: ['BTC']
        },
        {
          id: '2',
          title: 'Ethereum Upgrade Scheduled for Next Month',
          description: 'Developers have announced that the next major Ethereum upgrade will take place next month, bringing significant improvements to the network.',
          url: 'https://example.com/news/2',
          source: 'Blockchain Daily',
          image: 'https://via.placeholder.com/800x450?text=Ethereum+News',
          date: '2025-04-14',
          topics: ['Ethereum', 'Technology'],
          sentiment: 'Positive',
          type: 'news',
          tickers: ['ETH']
        },
        {
          id: '3',
          title: 'Regulatory Concerns Impact Crypto Markets',
          description: 'New regulatory proposals have caused uncertainty in cryptocurrency markets, with some assets seeing significant price drops.',
          url: 'https://example.com/news/3',
          source: 'Financial Times',
          image: 'https://via.placeholder.com/800x450?text=Regulation+News',
          date: '2025-04-13',
          topics: ['Regulation', 'Markets'],
          sentiment: 'Negative',
          type: 'news',
          tickers: ['BTC', 'ETH', 'XRP']
        },
        {
          id: '4',
          title: 'New DeFi Protocol Launches with $100M TVL',
          description: 'A new decentralized finance protocol has launched with $100 million in total value locked, attracting attention from yield farmers.',
          url: 'https://example.com/news/4',
          source: 'DeFi Pulse',
          image: 'https://via.placeholder.com/800x450?text=DeFi+News',
          date: '2025-04-12',
          topics: ['DeFi', 'Launch'],
          sentiment: 'Positive',
          type: 'news',
          tickers: ['AAVE', 'UNI', 'COMP']
        },
        {
          id: '5',
          title: 'NFT Market Shows Signs of Recovery',
          description: 'After months of declining sales, the NFT market is showing signs of recovery with several high-profile collections seeing increased trading volume.',
          url: 'https://example.com/news/5',
          source: 'NFT Insider',
          image: 'https://via.placeholder.com/800x450?text=NFT+News',
          date: '2025-04-11',
          topics: ['NFTs', 'Markets'],
          sentiment: 'Neutral',
          type: 'news',
          tickers: ['ETH', 'SOL']
        }
      ];
      
      setNews(mockNews);
    } catch (error) {
      console.error('Error fetching news:', error);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchNews();
      return;
    }
    
    setLoading(true);
    try {
      // Filter mock news based on search term
      const filteredNews = news.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setNews(filteredNews);
    } catch (error) {
      console.error('Error searching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchNews();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive':
        return 'bg-green-100 text-green-800';
      case 'Negative':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderSkeleton = () => {
    return Array(limit).fill(0).map((_, i) => (
      <Card key={i} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="space-y-1 flex-1">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
        <CardFooter className="pt-0">
          <div className="flex justify-between items-center w-full">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        </CardFooter>
      </Card>
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Crypto News</h2>
          <p className="text-muted-foreground">Latest updates from the crypto world</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {showSearch && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Search news..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pr-8"
            />
            <Search 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" 
              onClick={handleSearch}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          renderSkeleton()
        ) : news.length === 0 ? (
          <div className="text-center p-8 border rounded-lg">
            <p className="text-muted-foreground">No news found</p>
          </div>
        ) : (
          news.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row">
                {item.image && (
                  <div className="md:w-1/4 h-48 md:h-auto overflow-hidden bg-muted">
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=News';
                      }}
                    />
                  </div>
                )}
                <div className={`flex-1 flex flex-col ${item.image ? 'md:w-3/4' : 'w-full'}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <CardTitle className="text-lg hover:text-primary transition-colors">
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            {item.title}
                          </a>
                        </CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <span>{item.source}</span>
                          <span className="mx-2">•</span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(item.date)}
                          </span>
                        </CardDescription>
                      </div>
                      {item.sentiment && (
                        <Badge className={`${getSentimentColor(item.sentiment)}`}>
                          {item.sentiment}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {item.description}
                    </p>
                  </CardContent>
                  <CardFooter className="mt-auto pt-0">
                    <div className="flex justify-between items-center w-full">
                      <div className="flex flex-wrap gap-1">
                        {item.tickers?.slice(0, 3).map((ticker) => (
                          <Badge key={ticker} variant="outline" className="text-xs">
                            {ticker}
                          </Badge>
                        ))}
                        {item.tickers?.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{item.tickers.length - 3}</Badge>
                        )}
                      </div>
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                      >
                        Read more
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                  </CardFooter>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CryptoNewsWidget;