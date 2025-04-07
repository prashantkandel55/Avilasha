import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { authService } from '@/services/auth';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (!validateEmail(loginData.email)) {
        throw new Error('Please enter a valid email address');
      }

      if (!validatePassword(loginData.password)) {
        throw new Error('Password must be at least 8 characters long');
      }

      const response = await authService.login(loginData.email, loginData.password);
      
      if (!response || !response.token) {
        throw new Error('Login failed. Please try again.');
      }
      
      // Show success toast
      toast({
        title: "Login Successful",
        description: `Welcome back, ${response.user.fullName || 'User'}!`,
        duration: 2000
      });
      
      // Dispatch auth state change event before navigation
      window.dispatchEvent(new CustomEvent('auth-state-changed', { 
        detail: { isAuthenticated: true, user: response.user }
      }));
      
      // Store auth token
      localStorage.setItem('auth_token', response.token);
      
      // Navigate to dashboard after state update
      // Reduced timeout since we're now properly handling the auth token
      setTimeout(() => navigate('/', { replace: true }), 500);
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      setError(errorMessage);
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!signupData.fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!validateEmail(signupData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!validatePassword(signupData.password)) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await authService.signup(signupData.email, signupData.password, signupData.fullName);
      
      toast({
        title: "Account Created",
        description: `Welcome to Avilasha, ${signupData.fullName}! Please log in with your credentials.`
      });
      
      // Switch to login tab after successful signup
      document.querySelector('[data-tab="login"]')?.click();
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A1A0F] p-4 relative overflow-hidden">
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute right-0 w-1/2 h-full bg-[#0F3320] blur-[100px] opacity-20" />
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-[#0F3320] rounded-full blur-[100px] opacity-20" />
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-[#0F3320] rounded-full blur-[100px] opacity-20" />
      </div>
      <Card className="w-full max-w-md bg-black/20 backdrop-blur-xl relative z-10 border border-white/10 shadow-[0_0_15px_rgba(0,255,0,0.1)] hover:shadow-[0_0_30px_rgba(0,255,0,0.2)] transition-all duration-300">
        <CardHeader className="text-center space-y-2 pb-2">
          <div className="mx-auto mb-2 w-16 h-16">
            <img src="/avilasha.png" alt="Avilasha Logo" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(0,255,0,0.3)]" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">Welcome to Avilasha</CardTitle>
          <CardDescription className="text-gray-400">
            Your comprehensive crypto portfolio tracker
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/40 p-1">
            <TabsTrigger value="login" data-tab="login" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">Login</TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-gray-300">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    className="bg-black/40 border-white/10 focus:border-green-500/50 focus:ring-green-500/20 placeholder:text-gray-500"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-gray-300">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    className="bg-black/40 border-white/10 focus:border-green-500/50 focus:ring-green-500/20 placeholder:text-gray-500"
                    required
                  />
                </div>
              </CardContent>
              
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2 rounded-md transition-all duration-300 border-none shadow-[0_0_10px_rgba(0,255,0,0.2)] hover:shadow-[0_0_20px_rgba(0,255,0,0.3)]"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={handleSignup}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-gray-300">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({...signupData, fullName: e.target.value})}
                    className="bg-black/40 border-white/10 focus:border-green-500/50 focus:ring-green-500/20 placeholder:text-gray-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-gray-300">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={signupData.email}
                    onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                    className="bg-black/40 border-white/10 focus:border-green-500/50 focus:ring-green-500/20 placeholder:text-gray-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-gray-300">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={signupData.password}
                    onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                    className="bg-black/40 border-white/10 focus:border-green-500/50 focus:ring-green-500/20 placeholder:text-gray-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password" className="text-gray-300">Confirm Password</Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                    className="bg-black/40 border-white/10 focus:border-green-500/50 focus:ring-green-500/20 placeholder:text-gray-500"
                    required
                  />
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2 rounded-md transition-all duration-300 border-none shadow-[0_0_10px_rgba(0,255,0,0.2)] hover:shadow-[0_0_20px_rgba(0,255,0,0.3)]"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;