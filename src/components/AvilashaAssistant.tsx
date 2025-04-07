import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { MessageSquare, Send, X } from 'lucide-react';
import { assistantService, Message } from '@/services/assistant';

interface AvilashaAssistantProps {
  userName?: string;
}

const AvilashaAssistant: React.FC<AvilashaAssistantProps> = ({ userName = 'User' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Initialize assistant service
  useEffect(() => {
    assistantService.initialize({
      userName,
      onNewMessage: (message) => {
        setMessages(prev => [...prev, message]);
      }
    });
    
    // Load initial messages
    setMessages(assistantService.getMessages());
    
    // Check if this is the first visit
    const hasVisited = localStorage.getItem('assistant_introduced');
    if (!hasVisited) {
      // Open assistant on first visit
      setTimeout(() => {
        setIsOpen(true);
        localStorage.setItem('assistant_introduced', 'true');
      }, 2000);
    }
    
    return () => {
      // Cleanup if needed
    };
  }, [userName]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Provide contextual help when page changes
  useEffect(() => {
    const currentPage = location.pathname.replace('/', '') || 'dashboard';
    
    // Only show contextual help if the assistant is open
    if (isOpen && !isFirstVisit) {
      const contextualHelp = assistantService.getContextualHelp(currentPage);
      assistantService.sendMessage(`I'm now on the ${currentPage} page. What can I do here?`);
    }
    
    setIsFirstVisit(false);
  }, [location.pathname, isOpen, isFirstVisit]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = () => {
    if (input.trim()) {
      assistantService.sendMessage(input);
      setInput('');
      
      // Focus the input after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <>
      {/* Floating button when closed */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button 
            onClick={() => setIsOpen(true)} 
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        </div>
      )}
      
      {/* Chat interface */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="sm:max-w-md md:max-w-lg" side="right">
          <SheetHeader className="flex flex-row items-center justify-between pb-4 border-b">
            <div className="flex items-center">
              <Avatar className="h-10 w-10 mr-2">
                <AvatarImage src="/avilasha.png" alt="Avilasha" />
                <AvatarFallback>AV</AvatarFallback>
              </Avatar>
              <SheetTitle>Avilasha Assistant</SheetTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </SheetHeader>
          
          <div className="flex flex-col h-[calc(100vh-10rem)]">
            {/* Messages area */}
            <ScrollArea className="flex-1 pr-4 py-4">
              <div className="flex flex-col space-y-4">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="flex items-start max-w-[80%]">
                      {message.role === 'assistant' && (
                        <Avatar className="h-8 w-8 mr-2 mt-1">
                          <AvatarImage src="/avilasha.png" alt="Avilasha" />
                          <AvatarFallback>AV</AvatarFallback>
                        </Avatar>
                      )}
                      <div>
                        <Card className={`p-3 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <div className="text-sm">{message.content}</div>
                        </Card>
                        <div className="text-xs text-muted-foreground mt-1 ml-1">
                          {formatTimestamp(message.timestamp)}
                        </div>
                      </div>
                      {message.role === 'user' && (
                        <Avatar className="h-8 w-8 ml-2 mt-1">
                          <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            {/* Input area */}
            <div className="border-t pt-4 pb-2">
              <div className="flex items-center space-x-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AvilashaAssistant;