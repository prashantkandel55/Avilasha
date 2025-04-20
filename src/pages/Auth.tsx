import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AuthService } from '@/services/authService';
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

      const { user, error } = await AuthService.signIn(loginData.email, loginData.password);
      if (error || !user) {
        throw new Error(error?.message || 'Login failed. Please try again.');
      }
      
      // Show success toast
      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.email || 'User'}!`,
        duration: 2000
      });
      
      // Dispatch auth state change event before navigation
      window.dispatchEvent(new CustomEvent('auth-state-changed', { 
        detail: { isAuthenticated: true, user: user }
      }));
      
      // Navigate to dashboard after state update
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
      const { user, error } = await AuthService.signUp(signupData.email, signupData.password);
      if (error || !user) {
        setError(error?.message || 'Signup failed. Please try again.');
        toast({
          title: "Signup Failed",
          description: error?.message || 'Signup failed. Please try again.',
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Account Created",
        description: `Welcome to Avilasha, ${signupData.email}! Please log in with your credentials.`
      });
      
      // Switch to login tab after successful signup
      const loginTab = document.querySelector('[data-tab="login"]');
      if (loginTab && loginTab instanceof HTMLElement) {
        loginTab.click();
      }
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
        <CardHeader className="flex flex-col items-center space-y-2 pb-2">
          <div className="mx-auto mb-2 w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-700 shadow-lg flex items-center justify-center">
            <img src="Avilasha.svg" alt="Avilasha Logo" className="w-16 h-16 object-contain drop-shadow-[0_0_10px_rgba(0,255,0,0.3)]" onError={e => (e.currentTarget.style.display = 'none')}/>
          </div>
          <CardTitle className="text-3xl font-extrabold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent tracking-tight">
            Welcome to Avilasha
          </CardTitle>
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

              <div className="flex flex-col gap-3 mt-4">
                <Button type="button" variant="outline" className="flex items-center justify-center gap-2 border border-neutral-700 hover:bg-neutral-900 transition text-base font-semibold">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20.947 8.305c.013.176.013.353.013.53 0 5.392-4.107 11.616-11.616 11.616-2.308 0-4.454-.676-6.264-1.84.321.038.63.05.963.05 1.92 0 3.685-.655 5.096-1.757-1.793-.037-3.308-1.217-3.832-2.846.253.038.506.064.772.064.372 0 .744-.05 1.09-.143-1.872-.376-3.28-2.03-3.28-4.012v-.05c.553.307 1.19.492 1.868.518-.693-.462-1.15-1.25-1.15-2.144 0-.47.126-.908.345-1.286 1.258 1.547 3.143 2.563 5.267 2.67-.044-.188-.07-.39-.07-.593 0-1.44 1.168-2.608 2.608-2.608.75 0 1.428.316 1.904.827.594-.117 1.15-.334 1.653-.635-.195.608-.608 1.117-1.15 1.44.528-.063 1.03-.203 1.497-.41-.347.522-.788.982-1.297 1.35z" fill="#1D9BF0"/></svg>
                  Login with X
                </Button>
                <Button type="button" variant="outline" className="flex items-center justify-center gap-2 border border-neutral-700 hover:bg-neutral-900 transition text-base font-semibold">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6.3 13.775c-.2-.6-.314-1.244-.314-1.91s.114-1.311.314-1.91v-2.648h-3.308c-.67 1.32-1.055 2.797-1.055 4.558s.385 3.238 1.055 4.558l3.308-2.648z" fill="#FBBC05"/><path d="M12.04 7.687c1.477 0 2.484.637 3.055 1.17l2.23-2.17c-1.297-1.201-2.97-1.93-5.285-1.93-3.773 0-7.39 2.304-9.048 5.577l3.308 2.648c.81-2.418 3.072-4.215 5.74-4.215z" fill="#EA4335"/><path d="M20.447 20.452h-3.554v-5.569c0-1.327-.027-3.036-1.849-3.036-1.851 0-2.132 1.445-2.132 2.939v5.666h-3.554v-11.5h3.414v1.569h.049c.476-.899 1.637-1.849 3.37-1.849 3.602 0 4.267 2.369 4.267 5.455v6.325zM5.337 7.433c-1.144 0-2.07-.926-2.07-2.07 0-1.143.926-2.07 2.07-2.07 1.143 0 2.07.927 2.07 2.07 0 1.144-.927 2.07-2.07 2.07zm1.777 13.019h-3.554v-11.5h3.554v11.5z" fill="#333"/></svg>
                  Login with Google
                </Button>
                <Button type="button" variant="outline" className="flex items-center justify-center gap-2 border border-neutral-700 hover:bg-neutral-900 transition text-base font-semibold">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20.947 8.305c.013.176.013.353.013.53 0 5.392-4.107 11.616-11.616 11.616-2.308 0-4.454-.676-6.264-1.84.321.038.63.05.963.05 1.92 0 3.685-.655 5.096-1.757-1.793-.037-3.308-1.217-3.832-2.846.253.038.506.064.772.064.372 0 .744-.05 1.09-.143-1.872-.376-3.28-2.03-3.28-4.012v-.05c.553.307 1.19.492 1.868.518-.693-.462-1.15-1.25-1.15-2.144 0-.47.126-.908.345-1.286 1.258 1.547 3.143 2.563 5.267 2.67-.044-.188-.07-.39-.07-.593 0-1.44 1.168-2.608 2.608-2.608.75 0 1.428.316 1.904.827.594-.117 1.15-.334 1.653-.635-.195.608-.608 1.117-1.15 1.44.528-.063 1.03-.203 1.497-.41-.347.522-.788.982-1.297 1.35z" fill="#1D9BF0"/></svg>
                  Login with GitHub
                </Button>
              </div>

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