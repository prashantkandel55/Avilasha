import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, X, Send, Minimize, Maximize, Bot, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    content: "👋 Hello! I'm your Avilasha Agent. I can help you navigate the app, understand features, and answer any questions about cryptocurrency. How can I assist you today?",
    sender: 'agent',
    timestamp: new Date()
  }
];

// Knowledge base for the agent
const KNOWLEDGE_BASE = {
  dashboard: "The Dashboard provides an overview of your portfolio, market trends, and important notifications. You can see your total balance, portfolio performance, and active coins at a glance.",
  portfolio: "The Portfolio Analytics page helps you track your investments and analyze performance over time. You can view historical data, asset allocation, and performance metrics.",
  market: "The Market Analysis page shows current market trends, price movements, and trading volumes for various cryptocurrencies.",
  assets: "The Assets page displays all your cryptocurrency holdings and their current values. You can track individual asset performance and manage your portfolio.",
  wallets: "The Wallets page allows you to manage your connected wallets, view balances, and track transactions. You can add new wallets or remove existing ones.",
  defi: "The DeFi page shows your decentralized finance investments, including staking, lending, and yield farming positions.",
  nfts: "The NFTs page displays your non-fungible token collection and relevant market data.",
  mining: "The Mining page allows you to mine AVI tokens with your hardware. You can upgrade your mining equipment, purchase upgrades, and earn achievements.",
  history: "The History page shows all your past transactions across different wallets and platforms.",
  alerts: "The Alerts page lets you set up price notifications for specific cryptocurrencies.",
  news: "The News page provides the latest updates and articles from the crypto world.",
  help: "The Help Center provides guides, tutorials, and FAQs to help you use the app effectively.",
  settings: "The Settings page allows you to customize the app according to your preferences.",
  connect_wallet: "To connect a wallet, click on the 'Connect Wallet' button in the header or go to the Wallets page. We support Ethereum, Solana, and Sui wallets.",
  track_wallet: "To track a wallet, click on the 'Track Wallet' button in the header. You can enter any wallet address to monitor its activity without connecting it.",
  themes: "Avilasha offers multiple themes including Light, Dark, Luxury, and Royal. You can change the theme from the theme switcher in the top right corner.",
  mining_guide: "To start mining, go to the Mining page and click 'Start Mining'. You can upgrade your hardware and purchase improvements to increase your mining efficiency.",
  alerts_setup: "To set up price alerts, go to the Alerts page and click 'Create Alert'. You can set alerts for price movements, volume changes, and security events."
};

const AvilashaAgent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isMinimized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate agent thinking
    setTimeout(() => {
      const response = generateResponse(input);
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'agent',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, agentMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
  };

  const generateResponse = (query: string): string => {
    const normalizedQuery = query.toLowerCase();
    
    // Check for greetings
    if (/^(hi|hello|hey|greetings)/.test(normalizedQuery)) {
      return "Hello! How can I help you with Avilasha today?";
    }
    
    // Check for thanks
    if (/thank|thanks/.test(normalizedQuery)) {
      return "You're welcome! Is there anything else I can help you with?";
    }
    
    // Check for specific page inquiries
    for (const [key, info] of Object.entries(KNOWLEDGE_BASE)) {
      if (normalizedQuery.includes(key)) {
        return info;
      }
    }
    
    // Check for how-to questions
    if (/how (to|do I|can I)/.test(normalizedQuery)) {
      if (/connect wallet/.test(normalizedQuery)) {
        return KNOWLEDGE_BASE.connect_wallet;
      }
      if (/track wallet/.test(normalizedQuery)) {
        return KNOWLEDGE_BASE.track_wallet;
      }
      if (/change theme|switch theme/.test(normalizedQuery)) {
        return KNOWLEDGE_BASE.themes;
      }
      if (/mine|mining/.test(normalizedQuery)) {
        return KNOWLEDGE_BASE.mining_guide;
      }
      if (/alert|notification/.test(normalizedQuery)) {
        return KNOWLEDGE_BASE.alerts_setup;
      }
    }
    
    // Check for what-is questions
    if (/what is|what are|what does/.test(normalizedQuery)) {
      if (/dashboard/.test(normalizedQuery)) {
        return KNOWLEDGE_BASE.dashboard;
      }
      if (/portfolio/.test(normalizedQuery)) {
        return KNOWLEDGE_BASE.portfolio;
      }
      if (/defi/.test(normalizedQuery)) {
        return KNOWLEDGE_BASE.defi;
      }
      if (/nft/.test(normalizedQuery)) {
        return KNOWLEDGE_BASE.nfts;
      }
    }
    
    // Default responses for unknown queries
    const defaultResponses = [
      "I'm not sure I understand. Could you rephrase your question?",
      "That's an interesting question. Let me help you navigate to the right section of the app.",
      "I don't have specific information about that, but I can help you explore the app's features.",
      "Let me know if you need help with any specific feature of Avilasha."
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const minimizeChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(true);
  };

  return (
    <>
      {/* Floating button when closed */}
      {!isOpen && !isMinimized && (
        <motion.div 
          className="fixed bottom-6 right-6 z-50"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Button 
            onClick={toggleChat} 
            className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-amber-600 to-yellow-500 hover:shadow-xl transition-all duration-300 p-0"
          >
            <Bot className="h-6 w-6" />
          </Button>
        </motion.div>
      )}

      {/* Minimized state */}
      {isMinimized && (
        <motion.div 
          className="fixed bottom-6 right-6 z-50"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
        >
          <Button 
            onClick={() => setIsMinimized(false)} 
            className="h-14 px-4 rounded-full shadow-lg bg-gradient-to-r from-amber-600 to-yellow-500 hover:shadow-xl transition-all duration-300"
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            <span>Avilasha Agent</span>
          </Button>
        </motion.div>
      )}

      {/* Chat interface */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div 
            className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 shadow-2xl"
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden border border-primary/20 bg-gradient-to-br from-card via-card/90 to-card/80">
              <div className="bg-gradient-to-r from-amber-600 to-yellow-500 p-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border-2 border-black/20">
                    <AvatarImage src="/Avilasha.svg" alt="Avilasha Agent" />
                    <AvatarFallback className="bg-amber-600 text-white">AA</AvatarFallback>
                  </Avatar>
                  <div className="font-semibold text-black">Avilasha Agent</div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={minimizeChat} className="h-6 w-6 text-black hover:bg-black/10 rounded-full p-0">
                    <Minimize className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-6 w-6 text-black hover:bg-black/10 rounded-full p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <CardContent className="p-0">
                <div className="h-80 overflow-y-auto p-4 bg-gradient-to-b from-black/20 to-transparent">
                  {messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.sender === 'agent' && (
                        <Avatar className="h-8 w-8 mr-2 mt-1 border border-primary/30">
                          <AvatarImage src="/Avilasha.svg" alt="Avilasha Agent" />
                          <AvatarFallback className="bg-amber-600 text-white">AA</AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div 
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.sender === 'user' 
                            ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black' 
                            : 'bg-secondary/80 border border-primary/20'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className="text-xs mt-1 opacity-70">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      
                      {message.sender === 'user' && (
                        <Avatar className="h-8 w-8 ml-2 mt-1">
                          <AvatarFallback className="bg-primary/20 text-primary">You</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex mb-4">
                      <Avatar className="h-8 w-8 mr-2 mt-1 border border-primary/30">
                        <AvatarImage src="/Avilasha.svg" alt="Avilasha Agent" />
                        <AvatarFallback className="bg-amber-600 text-white">AA</AvatarFallback>
                      </Avatar>
                      <div className="bg-secondary/80 rounded-lg p-3 border border-primary/20">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
                
                <div className="p-3 border-t border-border flex gap-2 bg-card">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything..."
                    className="flex-1 bg-secondary/50 border-primary/20 focus-visible:ring-primary"
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    size="icon"
                    className="bg-gradient-to-r from-amber-600 to-yellow-500 text-black hover:from-amber-500 hover:to-yellow-400"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AvilashaAgent;