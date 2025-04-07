import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Newspaper, Search, Bookmark, Share2, Calendar, TrendingUp, Clock, BarChart, ArrowUpRight, ExternalLink, Filter, BellPlus, Check, MoreHorizontal, ChevronDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { newsApiService, NewsItem } from '@/services/news-api';
import { Skeleton } from "@/components/ui/skeleton";

const News = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [topHeadlines, setTopHeadlines] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  useEffect(() => {
    fetchNews();
    fetchTopHeadlines();
  }, []);
  
  const fetchNews = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const latestNews = await newsApiService.getLatestNews(page);
      
      if (page === 1) {
        setNews(latestNews);
      } else {
        setNews(prev => [...prev, ...latestNews]);
      }
      
      setCurrentPage(page);
    } catch (err) {
      setError('Failed to load news. Please try again later.');
      toast({
        title: 'Error',
        description: 'Failed to load news data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchTopHeadlines = async () => {
    try {
      const headlines = await newsApiService.getTopHeadlines();
      setTopHeadlines(headlines);
    } catch (err) {
      console.error('Failed to load headlines:', err);
    }
  };
  
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setSearchLoading(true);
      const results = await newsApiService.searchNews(searchTerm);
      setNews(results);
    } catch (err) {
      toast({
        title: 'Search Failed',
        description: 'Unable to search news at this time',
        variant: 'destructive',
      });
    } finally {
      setSearchLoading(false);
    }
  };
  
  const handleToggleBookmark = (id: string) => {
    const isBookmarked = newsApiService.toggleSaveNews(id);
    
    // Update state to reflect the change
    setNews(news.map(item => {
      if (item.id === id) {
        return { ...item, saved: isBookmarked };
      }
      return item;
    }));
    
    if (topHeadlines.length > 0) {
      setTopHeadlines(topHeadlines.map(item => {
        if (item.id === id) {
          return { ...item, saved: isBookmarked };
        }
        return item;
      }));
    }

    const newsItem = news.find(item => item.id === id);
    const action = isBookmarked ? 'added to' : 'removed from';
    
    toast({
      title: isBookmarked ? 'Added to Bookmarks' : 'Removed from Bookmarks',
      description: newsItem ? `"${newsItem.title.substring(0, 30)}..." has been ${action} your bookmarks` : '',
      variant: 'default',
    });
  };

  const handleKeywordAlert = (keyword: string) => {
    toast({
      title: 'News Alert Created',
      description: `You'll be notified when news about "${keyword}" is published`,
      variant: 'default',
    });
  };

  const handleShare = (newsItem: NewsItem) => {
    navigator.clipboard.writeText(newsItem.url);
    toast({
      title: 'Link Copied',
      description: 'News article link copied to clipboard',
      variant: 'default',
    });
  };

  const filteredNews = news.filter(item => {
    if (!searchTerm) return true;
    return (
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const loadMore = () => {
    fetchNews(currentPage + 1);
  };

  return (
    <div className="container mx-auto pt-6 pb-12">
      <div className="flex flex-col space-y-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Crypto News</h1>
          <p className="text-muted-foreground">Stay updated with the latest cryptocurrency news and insights</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for news articles..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={searchLoading || !searchTerm.trim()}
          >
            {searchLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
        
        {error && (
          <Card className="bg-destructive/10 border-destructive">
            <CardContent className="pt-6">
              <p>{error}</p>
              <Button 
                variant="outline" 
                className="mt-2" 
                onClick={() => fetchNews()}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All News</TabsTrigger>
            <TabsTrigger value="markets">Markets</TabsTrigger>
            <TabsTrigger value="technology">Technology</TabsTrigger>
            <TabsTrigger value="regulation">Regulation</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
          </TabsList>
      
          <TabsContent value="all">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {loading && news.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <Skeleton className="h-72 w-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-8 w-2/3" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : news.length > 0 ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="relative mb-6">
                        <AspectRatio ratio={16 / 9}>
                          <img 
                            src={news[0].image} 
                            alt={news[0].title} 
                            className="rounded-lg object-cover w-full h-full"
                          />
                        </AspectRatio>
                        
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <Badge variant="secondary" className="bg-black/70 hover:bg-black/70 text-white">
                            Featured
                          </Badge>
                          <Badge className="bg-primary/90 hover:bg-primary/90">
                            {news[0].category}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm text-muted-foreground">{news[0].date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {news[0].timeToRead}
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-semibold mb-2">{news[0].title}</h3>
                      <p className="text-muted-foreground mb-4">{news[0].summary}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          Source: {news[0].source}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleToggleBookmark(news[0].id)}
                          >
                            <Bookmark className={`h-4 w-4 ${news[0].saved ? 'fill-primary text-primary' : ''}`} />
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleShare(news[0])}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => setSelectedNews(news[0])}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-6 flex justify-center items-center min-h-[200px]">
                      <div className="text-center">
                        <Newspaper className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                        <h3 className="font-medium mb-1">No News Found</h3>
                        <p className="text-muted-foreground">
                          {searchTerm 
                            ? 'Try a different search term' 
                            : 'News articles will appear here'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {loading && news.length === 0 ? (
                    Array(6).fill(0).map((_, i) => (
                      <Card key={i}>
                        <CardContent className="pt-6">
                          <div className="space-y-2">
                            <Skeleton className="h-32 w-full rounded" />
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-8 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    filteredNews.slice(1, 7).map((item) => (
                      <Card key={item.id}>
                        <CardContent className="p-4">
                          <div className="mb-3 relative">
                            <AspectRatio ratio={16 / 9}>
                              <img 
                                src={item.image} 
                                alt={item.title} 
                                className="rounded object-cover w-full h-full"
                              />
                            </AspectRatio>
                            <Badge className="absolute top-2 left-2">
                              {item.category}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <span>{item.date}</span>
                            <span>•</span>
                            <span>{item.timeToRead}</span>
                          </div>
                          
                          <h4 className="font-medium leading-tight mb-1 line-clamp-2">
                            {item.title}
                          </h4>
                          
                          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                            {item.summary}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs">
                              {item.source}
                            </span>
                            
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0" 
                                onClick={() => handleToggleBookmark(item.id)}
                              >
                                <Bookmark className={`h-4 w-4 ${item.saved ? 'fill-primary text-primary' : ''}`} />
                              </Button>
                              
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                onClick={() => setSelectedNews(item)}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Latest News</CardTitle>
                    <CardDescription>Most recent crypto news updates</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="px-3">
                    {loading && news.length === 0 ? (
                      <div className="space-y-4">
                        {Array(5).fill(0).map((_, i) => (
                          <div key={i} className="flex gap-2">
                            <Skeleton className="h-12 w-12 rounded" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-3 w-2/3" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      filteredNews
                        .slice(0, 10)
                        .map((item) => (
                          <div key={item.id} className="flex items-center gap-3 py-3 border-b last:border-b-0">
                            <div className="flex-shrink-0">
                              <img 
                                src={item.image} 
                                alt={item.title} 
                                className="h-12 w-12 rounded object-cover"
                              />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h5 className="text-sm font-medium line-clamp-2">
                                {item.title}
                              </h5>
                              <div className="flex items-center text-xs text-muted-foreground mt-1">
                                <span>{item.source}</span>
                                <span className="mx-1">•</span>
                                <span>{item.date}</span>
                              </div>
                            </div>
                            
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 flex-shrink-0"
                              onClick={() => setSelectedNews(item)}
                            >
                              <ArrowUpRight className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                    )}
                  </CardContent>
                  
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={loadMore}
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : 'Load More News'}
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Bookmarks</CardTitle>
                    <CardDescription>News you've saved for later</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="px-3">
                    {filteredNews
                      .filter(item => item.saved)
                      .map((item) => (
                        <div key={item.id} className="flex items-center gap-3 py-3 border-b last:border-b-0">
                          <div className="flex-shrink-0">
                            <img 
                              src={item.image} 
                              alt={item.title} 
                              className="h-12 w-12 rounded object-cover"
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-medium line-clamp-2">
                              {item.title}
                            </h5>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <span>{item.source}</span>
                              <span className="mx-1">•</span>
                              <span>{item.date}</span>
                            </div>
                          </div>
                          
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 flex-shrink-0"
                            onClick={() => setSelectedNews(item)}
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    
                    {filteredNews.filter(item => item.saved).length === 0 && (
                      <div className="text-center py-6">
                        <Bookmark className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <h3 className="font-medium mb-1">No Bookmarks</h3>
                        <p className="text-muted-foreground text-sm">
                          Save articles to read later
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Market Sentiment</CardTitle>
                    <CardDescription>Based on news and social media</CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {['Bitcoin', 'Ethereum', 'Solana', 'Market'].map((coin) => {
                        // Calculate sentiment based on available news
                        const coinNews = filteredNews.filter(item => 
                          item.title.toLowerCase().includes(coin.toLowerCase()) || 
                          item.summary.toLowerCase().includes(coin.toLowerCase())
                        );
                        
                        const positiveCount = coinNews.filter(item => item.sentiment === 'positive').length;
                        const negativeCount = coinNews.filter(item => item.sentiment === 'negative').length;
                        const neutralCount = coinNews.filter(item => item.sentiment === 'neutral').length;
                        
                        const total = Math.max(1, positiveCount + negativeCount + neutralCount);
                        const positivePercentage = (positiveCount / total) * 100;
                        const negativePercentage = (negativeCount / total) * 100;
                        
                        let sentiment = 'Neutral';
                        if (positivePercentage > 60) sentiment = 'Bullish';
                        else if (negativePercentage > 60) sentiment = 'Bearish';
                        
                        return (
                          <div key={coin} className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">{coin}</span>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                Based on {total} articles
                              </div>
                            </div>
                            
                            <div>
                              <Badge 
                                variant={sentiment === 'Bullish' 
                                  ? 'default' 
                                  : sentiment === 'Bearish' 
                                    ? 'destructive' 
                                    : 'secondary'
                                }
                              >
                                {sentiment}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>News Alerts</CardTitle>
                    <CardDescription>Set up custom news notifications</CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Input 
                          placeholder="Enter keyword..."
                          id="alert-input"
                        />
                        <Button 
                          size="sm"
                          onClick={() => {
                            const input = document.getElementById('alert-input') as HTMLInputElement;
                            if (input.value) {
                              handleKeywordAlert(input.value);
                              input.value = '';
                            }
                          }}
                        >
                          <BellPlus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary" />
                            <span>Bitcoin</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary" />
                            <span>Regulation</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground mt-2">
                        Notifies about major Bitcoin news and price movements
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="markets">
            <div className="text-center py-12">
              <BarChart className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="font-medium mb-1">Markets News Coming Soon</h3>
              <p className="text-muted-foreground">
                We're working on bringing you the latest market updates
              </p>
            </div>
          </TabsContent>
          
          {["technology", "regulation", "business"].map((tab) => (
            <TabsContent key={tab} value={tab}>
              <div className="text-center py-12">
                <Newspaper className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="font-medium mb-1">{tab.charAt(0).toUpperCase() + tab.slice(1)} News Coming Soon</h3>
                <p className="text-muted-foreground">
                  We're expanding our news categories
                </p>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
      
      {selectedNews && (
        <div className="fixed inset-0 bg-background/80 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{selectedNews.title}</h3>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setSelectedNews(null)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </Button>
              </div>
            </div>
            
            <div className="p-6">
              <img 
                src={selectedNews.image} 
                alt={selectedNews.title} 
                className="rounded-lg w-full h-auto mb-4"
              />
              
              <div className="flex items-center gap-3 text-sm mb-4">
                <Badge>{selectedNews.category}</Badge>
                <span>{selectedNews.date}</span>
                <span>•</span>
                <span>{selectedNews.timeToRead}</span>
              </div>
              
              <div className="prose prose-sm max-w-none mb-6">
                <h2>{selectedNews.title}</h2>
                <p className="text-muted-foreground">{selectedNews.summary}</p>
                <p>{selectedNews.content}</p>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="text-sm">Source: {selectedNews.source}</p>
                  {selectedNews.author && (
                    <p className="text-sm text-muted-foreground">By {selectedNews.author}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      handleToggleBookmark(selectedNews.id);
                      setSelectedNews({
                        ...selectedNews,
                        saved: !selectedNews.saved
                      });
                    }}
                  >
                    <Bookmark className={`h-4 w-4 mr-2 ${selectedNews.saved ? 'fill-primary text-primary' : ''}`} />
                    {selectedNews.saved ? 'Bookmarked' : 'Bookmark'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleShare(selectedNews)}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      window.open(selectedNews.url, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Original
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default News;
