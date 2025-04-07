
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  HelpCircle, 
  BookOpen, 
  MessageCircle, 
  FileText, 
  Code, 
  Shield, 
  Wallet, 
  Lock, 
  ExternalLink, 
  ThumbsUp, 
  ThumbsDown, 
  ChevronDown, 
  ChevronRight,
  PlayCircle,
  LifeBuoy,
  MessagesSquare,
  Users,
  BarChart3,
  Bell,
  Blocks,
  CreditCard,
  User,
  LayoutDashboard,
  Clock,
  Calendar,
  Check,
  MessageSquare,
  X,
  Send,
  Globe,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Create components for missing elements
const DotSeparator = ({ className }: { className?: string }) => (
  <span className={className}></span>
);

const PlayIcon = ({ className }: { className?: string }) => (
  <PlayCircle className={className} />
);

const ImageSquare = ({ className }: { className?: string }) => (
  <div className={className}>
    <FileText />
  </div>
);

interface FaqItem {
  question: string;
  answer: string;
  category: string;
  featured?: boolean;
}

const faqs: FaqItem[] = [
  {
    question: "How do I add a new wallet?",
    answer: "To add a new wallet, click on the 'Add New Wallet' button on the wallets page. You can either connect an existing wallet by providing the address or create a new one through our integrations with popular wallet providers.",
    category: "wallets",
    featured: true
  },
  {
    question: "How can I track my portfolio performance?",
    answer: "Your portfolio performance is automatically tracked in the Portfolio Analytics section. You can view different metrics including total value, profit/loss, and historical performance across different time periods.",
    category: "portfolio",
    featured: true
  },
  {
    question: "How do I set up price alerts?",
    answer: "Navigate to the Alerts page, click on 'Create Alert', select 'Price Alert' as the type, choose your asset, set your desired price threshold, and save. You'll receive notifications when the price crosses your specified threshold.",
    category: "alerts",
    featured: true
  },
  {
    question: "What is DeFi and how can I use it in this app?",
    answer: "DeFi (Decentralized Finance) refers to financial services built on blockchain technology without central intermediaries. In our app, you can track your DeFi investments through the DeFi Dashboard, monitor yield farming positions, lending activities, and staking rewards.",
    category: "defi"
  },
  {
    question: "How are NFTs valued in the dashboard?",
    answer: "NFTs in your dashboard are valued based on the last sale price or current floor price of the collection. For rarer NFTs, we use additional metrics like trait rarity and historical sales data to provide a more accurate valuation.",
    category: "nfts"
  },
  {
    question: "How secure is my wallet information?",
    answer: "Your wallet information is secure because we only track public addresses without requiring private keys. We use end-to-end encryption for all data storage and transmission. You can additionally enable 2FA for an extra layer of security in the settings.",
    category: "security",
    featured: true
  },
  {
    question: "Can I connect multiple wallets from different blockchains?",
    answer: "Yes, you can connect multiple wallets from various blockchains including Ethereum, Bitcoin, Solana, and more. Our platform aggregates data across all connected wallets to give you a unified view of your entire crypto portfolio.",
    category: "wallets"
  },
  {
    question: "How often is market data updated?",
    answer: "Market data is updated in real-time for most major cryptocurrencies. For smaller altcoins, data may be refreshed every few minutes. Historical data and analytics are updated hourly to ensure accurate portfolio tracking.",
    category: "general"
  },
  {
    question: "How do I export my transaction history for tax purposes?",
    answer: "You can export your transaction history in the History page. Click on 'Export CSV' and select your preferred date range and wallets. The exported file is compatible with most crypto tax software solutions.",
    category: "taxes"
  }
];

const HelpCenter = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  
  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleFeedbackSubmit = () => {
    toast({
      title: "Feedback Submitted",
      description: "Thank you for your feedback. We'll get back to you soon.",
    });
    setFeedbackSubmitted(true);
  };
  
  const toggleFaq = (question: string) => {
    if (expandedFaq === question) {
      setExpandedFaq(null);
    } else {
      setExpandedFaq(question);
    }
  };
  
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Help Center</h1>
        <p className="text-muted-foreground">Find answers and support for using Avilasha</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for help articles, FAQs, or topics..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <MessageCircle className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Contact Support</DialogTitle>
              <DialogDescription>
                Fill out the form below and our team will get back to you as soon as possible.
              </DialogDescription>
            </DialogHeader>
            
            {feedbackSubmitted ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-medium text-lg mb-2">Support Request Submitted</h3>
                <p className="text-muted-foreground mb-4">
                  Thank you for contacting us. We've received your request and will respond within 24 hours.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setFeedbackSubmitted(false)}
                >
                  Submit Another Request
                </Button>
              </div>
            ) : (
              <>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" placeholder="Your name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="Your email address" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select defaultValue="general">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="account">Account Issues</SelectItem>
                        <SelectItem value="technical">Technical Support</SelectItem>
                        <SelectItem value="billing">Billing & Subscription</SelectItem>
                        <SelectItem value="feature">Feature Request</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Describe your issue or question in detail..." 
                      rows={5}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="attachments">Attachments (optional)</Label>
                    <Input id="attachments" type="file" />
                    <p className="text-xs text-muted-foreground">
                      Max file size: 10MB. Supported formats: JPG, PNG, PDF
                    </p>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" className="w-full sm:w-auto">Cancel</Button>
                  <Button onClick={handleFeedbackSubmit} className="w-full sm:w-auto">Submit Request</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs defaultValue="faq" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <HelpCircle size={16} />
            <span>FAQs</span>
          </TabsTrigger>
          <TabsTrigger value="guides" className="flex items-center gap-2">
            <BookOpen size={16} />
            <span>Guides</span>
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <PlayCircle size={16} />
            <span>Tutorial Videos</span>
          </TabsTrigger>
          <TabsTrigger value="community" className="flex items-center gap-2">
            <Users size={16} />
            <span>Community</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="faq" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {[
              { title: 'Getting Started', icon: <LifeBuoy className="h-5 w-5" />, count: 12 },
              { title: 'Wallets & Security', icon: <Shield className="h-5 w-5" />, count: 15 },
              { title: 'Portfolio Tracking', icon: <BarChart3 className="h-5 w-5" />, count: 8 },
              { title: 'Trading & Alerts', icon: <Bell className="h-5 w-5" />, count: 10 },
              { title: 'DeFi & NFTs', icon: <Blocks className="h-5 w-5" />, count: 14 },
              { title: 'Account & Billing', icon: <CreditCard className="h-5 w-5" />, count: 6 },
            ].map((category, i) => (
              <Card 
                key={i} 
                className="hover:border-primary/50 cursor-pointer transition-colors"
                onClick={() => setSearchTerm(category.title)}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="font-medium">{category.title}</h3>
                    <p className="text-sm text-muted-foreground">{category.count} articles</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>
                {searchTerm ? `Search results for "${searchTerm}"` : "Common questions about using Avilasha"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, index) => (
                  <div key={index} className="border rounded-md overflow-hidden">
                    <div 
                      className={`p-4 flex justify-between items-center cursor-pointer hover:bg-muted/50 ${expandedFaq === faq.question ? 'bg-muted/50' : ''}`}
                      onClick={() => toggleFaq(faq.question)}
                    >
                      <div className="font-medium pr-4">
                        {faq.question}
                        {faq.featured && (
                          <Badge className="ml-2 bg-primary/20 text-primary" variant="secondary">
                            Popular
                          </Badge>
                        )}
                      </div>
                      {expandedFaq === faq.question ? (
                        <ChevronDown className="h-5 w-5 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-5 w-5 flex-shrink-0" />
                      )}
                    </div>
                    
                    {expandedFaq === faq.question && (
                      <div className="p-4 border-t bg-muted/20">
                        <p className="text-muted-foreground">{faq.answer}</p>
                        
                        <div className="mt-4 pt-4 border-t flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            Was this helpful?
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="h-8">
                              <ThumbsUp className="mr-2 h-3.5 w-3.5" />
                              Yes
                            </Button>
                            <Button variant="outline" size="sm" className="h-8">
                              <ThumbsDown className="mr-2 h-3.5 w-3.5" />
                              No
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">No results found</h3>
                  <p className="text-muted-foreground mb-4">
                    We couldn't find any FAQs matching your search
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button onClick={() => setSearchTerm('')}>Clear Search</Button>
                    <Button variant="outline">Contact Support</Button>
                  </div>
                </div>
              )}
            </CardContent>
            {filteredFaqs.length > 0 && (
              <CardFooter className="flex flex-col items-center border-t p-6">
                <p className="text-muted-foreground mb-2">Still need help?</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Contact Support Team</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Contact Support</DialogTitle>
                      <DialogDescription>
                        Fill out the form below and our team will get back to you as soon as possible.
                      </DialogDescription>
                    </DialogHeader>
                    
                    {feedbackSubmitted ? (
                      <div className="text-center py-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                          <Check className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="font-medium text-lg mb-2">Support Request Submitted</h3>
                        <p className="text-muted-foreground mb-4">
                          Thank you for contacting us. We've received your request and will respond within 24 hours.
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={() => setFeedbackSubmitted(false)}
                        >
                          Submit Another Request
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="name">Name</Label>
                              <Input id="name" placeholder="Your name" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email">Email</Label>
                              <Input id="email" type="email" placeholder="Your email address" />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Select defaultValue="general">
                              <SelectTrigger>
                                <SelectValue placeholder="Select a topic" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="general">General Inquiry</SelectItem>
                                <SelectItem value="account">Account Issues</SelectItem>
                                <SelectItem value="technical">Technical Support</SelectItem>
                                <SelectItem value="billing">Billing & Subscription</SelectItem>
                                <SelectItem value="feature">Feature Request</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea 
                              id="message" 
                              placeholder="Describe your issue or question in detail..." 
                              rows={5}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="attachments">Attachments (optional)</Label>
                            <Input id="attachments" type="file" />
                            <p className="text-xs text-muted-foreground">
                              Max file size: 10MB. Supported formats: JPG, PNG, PDF
                            </p>
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button variant="outline" className="w-full sm:w-auto">Cancel</Button>
                          <Button onClick={handleFeedbackSubmit} className="w-full sm:w-auto">Submit Request</Button>
                        </DialogFooter>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="guides" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>User Guides & Tutorials</CardTitle>
                  <CardDescription>Step-by-step instructions for using Avilasha</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border rounded-md overflow-hidden">
                    <div className="bg-muted/30 p-4">
                      <h3 className="font-medium text-lg">Getting Started with Avilasha</h3>
                      <div className="text-sm text-muted-foreground mt-1">A complete beginner's guide</div>
                    </div>
                    
                    <div className="p-4">
                      <div className="space-y-4">
                        {[
                          { title: 'Creating Your Account', icon: <User className="h-4 w-4" />, time: '5 min' },
                          { title: 'Connecting Your First Wallet', icon: <Wallet className="h-4 w-4" />, time: '8 min' },
                          { title: 'Understanding the Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, time: '10 min' },
                          { title: 'Setting Up Price Alerts', icon: <Bell className="h-4 w-4" />, time: '6 min' },
                        ].map((guide, i) => (
                          <div key={i} className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/20 cursor-pointer">
                            <div className="flex items-center">
                              <div className="bg-primary/10 p-2 rounded-full mr-3">
                                {guide.icon}
                              </div>
                              <div className="font-medium">{guide.title}</div>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="mr-1 h-3.5 w-3.5" />
                              {guide.time} read
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <Button className="mt-4 w-full">
                        View Complete Guide
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        title: 'Advanced Portfolio Analytics',
                        description: 'Learn how to use advanced portfolio tracking features',
                        icon: <BarChart3 className="h-5 w-5" />,
                        articles: 6
                      },
                      {
                        title: 'Security Best Practices',
                        description: 'Keeping your crypto assets safe and secure',
                        icon: <Shield className="h-5 w-5" />,
                        articles: 8
                      },
                      {
                        title: 'DeFi Integration Guide',
                        description: 'How to track your DeFi investments',
                        icon: <Blocks className="h-5 w-5" />,
                        articles: 7
                      },
                      {
                        title: 'NFT Collection Management',
                        description: 'Organize and track your NFT portfolio',
                        icon: <ImageSquare className="h-5 w-5" />,
                        articles: 5
                      },
                    ].map((guide, i) => (
                      <Card key={i} className="border hover:border-primary/50 cursor-pointer transition-colors">
                        <CardContent className="p-6">
                          <div className="bg-primary/10 p-2 w-fit rounded-full mb-3">
                            {guide.icon}
                          </div>
                          <h3 className="font-medium mb-1">{guide.title}</h3>
                          <p className="text-sm text-muted-foreground mb-3">{guide.description}</p>
                          <div className="text-sm flex items-center text-primary">
                            <FileText className="mr-1 h-3.5 w-3.5" />
                            {guide.articles} articles
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Popular Articles</CardTitle>
                  <CardDescription>Most read support content</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { title: 'How to import transactions', views: '2.4k', time: '6 min' },
                    { title: 'Setting up 2FA security', views: '1.8k', time: '4 min' },
                    { title: 'Tax reporting guide', views: '1.5k', time: '12 min' },
                    { title: 'API key management', views: '1.2k', time: '5 min' },
                  ].map((article, i) => (
                    <div key={i} className="flex justify-between items-center p-3 border rounded-md cursor-pointer hover:bg-muted/20">
                      <div className="font-medium">{article.title}</div>
                      <div className="text-sm text-muted-foreground">{article.views} views</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Resources</CardTitle>
                  <CardDescription>Helpful documentation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { title: 'API Documentation', icon: <Code className="h-4 w-4" /> },
                    { title: 'Security Whitepaper', icon: <Shield className="h-4 w-4" /> },
                    { title: 'Terms of Service', icon: <FileText className="h-4 w-4" /> },
                    { title: 'Privacy Policy', icon: <Lock className="h-4 w-4" /> },
                  ].map((resource, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center">
                        {resource.icon}
                        <span className="ml-2">{resource.title}</span>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-500/10 p-2 rounded-full">
                      <MessageCircle className="h-5 w-5 text-blue-500" />
                    </div>
                    <h3 className="font-medium">Need Personalized Help?</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Our support team is available 24/7 to answer your questions.
                  </p>
                  <Button className="w-full">Contact Support</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="videos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Video Tutorials</CardTitle>
              <CardDescription>Learn how to use Avilasha with step-by-step video guides</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { 
                    title: 'Getting Started with Avilasha', 
                    thumbnail: 'https://via.placeholder.com/400x225/3949AB/FFFFFF?text=Tutorial', 
                    duration: '5:24',
                    views: '12K'
                  },
                  { 
                    title: 'How to Connect Multiple Wallets', 
                    thumbnail: 'https://via.placeholder.com/400x225/00897B/FFFFFF?text=Wallets', 
                    duration: '4:18',
                    views: '8.5K'
                  },
                  { 
                    title: 'Advanced Portfolio Tracking Features', 
                    thumbnail: 'https://via.placeholder.com/400x225/E53935/FFFFFF?text=Portfolio', 
                    duration: '7:32',
                    views: '10K'
                  },
                  { 
                    title: 'Setting Up Customized Alerts', 
                    thumbnail: 'https://via.placeholder.com/400x225/F57C00/FFFFFF?text=Alerts', 
                    duration: '3:45',
                    views: '6.2K'
                  },
                  { 
                    title: 'NFT Collection Management', 
                    thumbnail: 'https://via.placeholder.com/400x225/8E24AA/FFFFFF?text=NFTs', 
                    duration: '6:15',
                    views: '7.8K'
                  },
                  { 
                    title: 'DeFi Dashboard Tutorial', 
                    thumbnail: 'https://via.placeholder.com/400x225/43A047/FFFFFF?text=DeFi', 
                    duration: '8:10',
                    views: '9.1K'
                  },
                ].map((video, i) => (
                  <div key={i} className="rounded-md overflow-hidden border">
                    <div className="relative">
                      <img src={video.thumbnail} alt={video.title} className="w-full aspect-video object-cover" />
                      <div className="absolute bottom-2 right-2 bg-black/75 text-white px-1.5 py-0.5 text-xs rounded">
                        {video.duration}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary transition-colors">
                          <PlayIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium mb-1">{video.title}</h3>
                      <div className="text-sm text-muted-foreground">{video.views} views</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-center border-t p-6">
              <Button variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Full Tutorial Library
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Featured Tutorial</CardTitle>
              <CardDescription>Complete walkthrough of Avilasha's features</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative aspect-video bg-muted flex items-center justify-center">
                <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary transition-colors">
                  <PlayIcon className="h-8 w-8 text-white" />
                </div>
                <div className="absolute bottom-4 left-4 bg-background/90 p-3 rounded-md max-w-md">
                  <h3 className="font-medium mb-1">Avilasha Platform Tour 2023</h3>
                  <p className="text-sm text-muted-foreground">
                    A comprehensive overview of all features and how to get the most out of your crypto portfolio tracking
                  </p>
                  <div className="flex items-center mt-2 text-sm">
                    <Clock className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">15:32</span>
                    <DotSeparator className="mx-1 h-1 w-1 rounded-full bg-current inline-block text-muted-foreground" />
                    <Users className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">25.4K views</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="community" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Community Forum</CardTitle>
                  <CardDescription>Connect with other users and find answers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { 
                        title: 'Getting Started', 
                        icon: <BookOpen className="h-5 w-5" />, 
                        topics: 342, 
                        posts: '2.1K',
                        description: 'New user introductions and basic questions' 
                      },
                      { 
                        title: 'Wallet Integration', 
                        icon: <Wallet className="h-5 w-5" />, 
                        topics: 186, 
                        posts: '1.4K',
                        description: 'Help with connecting and managing wallets' 
                      },
                      { 
                        title: 'Portfolio Tracking', 
                        icon: <BarChart3 className="h-5 w-5" />, 
                        topics: 253, 
                        posts: '1.7K',
                        description: 'Discussions about tracking your assets' 
                      },
                      { 
                        title: 'DeFi & NFTs', 
                        icon: <Blocks className="h-5 w-5" />, 
                        topics: 194, 
                        posts: '1.3K',
                        description: 'Topics related to DeFi and NFT features' 
                      },
                    ].map((forum, i) => (
                      <div key={i} className="border rounded-md p-4 hover:border-primary/50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="bg-primary/10 p-2 rounded-full">
                            {forum.icon}
                          </div>
                          <h3 className="font-medium">{forum.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{forum.description}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MessagesSquare className="mr-1 h-3.5 w-3.5" />
                          <span>{forum.topics} topics</span>
                          <DotSeparator className="mx-1 h-1 w-1 rounded-full bg-current inline-block text-muted-foreground" />
                          <MessageCircle className="mr-1 h-3.5 w-3.5" />
                          <span>{forum.posts} posts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Discussions</CardTitle>
                  <CardDescription>Latest topics from the community</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { title: 'How can I track my eth 2.0 staking?', user: 'cryptostaker', replies: 8, time: '3h ago' },
                    { title: 'Best wallets for NFT collectors?', user: 'nft_lover', replies: 14, time: '12h ago' },
                    { title: 'Mobile app release date?', user: 'mobilefirst', replies: 3, time: '1d ago' },
                    { title: 'CSV export formatting issue', user: 'taxtime', replies: 6, time: '2d ago' },
                  ].map((topic, i) => (
                    <div key={i} className="border-b pb-3 last:border-0 last:pb-0">
                      <div className="font-medium hover:text-primary cursor-pointer">{topic.title}</div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <User className="h-3 w-3 mr-1" />
                        <span>{topic.user}</span>
                        <DotSeparator className="mx-1 h-1 w-1 rounded-full bg-current inline-block" />
                        <MessageSquare className="h-3 w-3 mr-1" />
                        <span>{topic.replies} replies</span>
                        <DotSeparator className="mx-1 h-1 w-1 rounded-full bg-current inline-block" />
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{topic.time}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="justify-center border-t">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Discussions
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Community Stats</CardTitle>
                  <CardDescription>Our growing community</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-primary" />
                      <span>Members</span>
                    </div>
                    <div className="font-medium">24,892</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <MessageCircle className="h-4 w-4 mr-2 text-primary" />
                      <span>Topics</span>
                    </div>
                    <div className="font-medium">8,761</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2 text-primary" />
                      <span>Posts</span>
                    </div>
                    <div className="font-medium">47,205</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-primary" />
                      <span>Online Today</span>
                    </div>
                    <div className="font-medium">983</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="font-medium mb-1">Join Our Discord</h3>
                    <p className="text-sm text-muted-foreground">
                      Chat with community members and get live support.
                    </p>
                  </div>
                  <Button className="w-full">
                    <Globe className="mr-2 h-4 w-4" />
                    Join Discord Server
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HelpCenter;
