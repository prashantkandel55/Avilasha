// --- ENHANCED AVILASHA AUTH PAGE ---
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AuthService } from '@/services/authService';
import { AlertCircle, Lock, UserPlus, LogIn, Mail, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AvilashaLogo from '/Avilasha.svg';
import { supabase } from '@/services/supabaseClient';
// @ts-ignore
import Cropper from 'react-easy-crop';

// --- GLASSMORPHISM STYLES ---
const glassStyles: React.CSSProperties = {
  background: 'rgba(30, 32, 48, 0.55)',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.17)',
  backdropFilter: 'blur(16px) saturate(180%)',
  WebkitBackdropFilter: 'blur(16px) saturate(180%)',
  borderRadius: '24px',
  border: '1.5px solid rgba(255, 255, 255, 0.18)',
};

const AnimatedBg = () => (
  <div className="fixed inset-0 z-0 bg-gradient-to-br from-black via-gray-900 to-gray-800 animate-gradient-x overflow-hidden">
    <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary opacity-20 rounded-full blur-3xl animate-float" />
    <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary opacity-20 rounded-full blur-2xl animate-float2" />
  </div>
);

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [showMenu, setShowMenu] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const user = await AuthService.getCurrentUser?.();
      if (user && user.id) {
        const { profile } = await AuthService.getProfile(user.id);
        setProfile(profile);
      }
    })();
  }, []);

  useEffect(() => {
    let sub: any;
    (async () => {
      const user = await AuthService.getCurrentUser?.();
      if (user && user.id && supabase) {
        sub = supabase
          .channel('public:profiles')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, payload => {
            if (payload.new) setProfile(payload.new);
          })
          .subscribe();
      }
    })();
    return () => { if (sub) supabase.removeChannel(sub); };
  }, []);

  const handleLogout = async () => {
    await AuthService.signOut();
    setProfile(null);
    toast({ title: 'Logged out', description: 'You have been logged out.' });
    navigate('/');
  };

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ email: '', password: '', confirmPassword: '', fullName: '' });

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password: string) => password.length >= 8;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (!validateEmail(loginData.email)) throw new Error('Please enter a valid email address');
      if (!validatePassword(loginData.password)) throw new Error('Password must be at least 8 characters long');
      const { user, error } = await AuthService.signIn(loginData.email, loginData.password);
      if (error || !user) throw new Error(error?.message || 'Login failed. Please try again.');
      toast({ title: "Login Successful", description: `Welcome back!`, variant: "default" });
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (!validateEmail(signupData.email)) throw new Error('Please enter a valid email address');
      if (!validatePassword(signupData.password)) throw new Error('Password must be at least 8 characters long');
      if (signupData.password !== signupData.confirmPassword) throw new Error('Passwords do not match');
      if (!signupData.fullName) throw new Error('Please enter your full name');
      const { user, error } = await AuthService.signUp(signupData.email, signupData.password, signupData.fullName);
      if (error || !user) throw new Error(error?.message || 'Signup failed. Please try again.');
      toast({ title: "Signup Successful", description: `Welcome, ${signupData.fullName}!`, variant: "default" });
      setTab('login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- OAUTH HANDLERS ---
  const handleOAuth = async (provider: 'google' | 'github' | 'twitter') => {
    setIsLoading(true);
    setError('');
    try {
      const { error } = await AuthService.signInWithOAuth(provider);
      if (error) throw new Error(error.message || `Could not sign in with ${provider}`);
      toast({ title: `Signed in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}` });
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Profile edit modal ---
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editProfile, setEditProfile] = useState<any>(null);
  const [pwResetEmail, setPwResetEmail] = useState('');
  const [pwResetSent, setPwResetSent] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setShowCropper(true);
  };

  const handleAvatarCropSave = async () => {
    if (!avatarFile || !croppedAreaPixels) return;
    setUploadingAvatar(true);
    try {
      // Crop image in browser
      const image = await createImageBitmap(avatarFile);
      const canvas = document.createElement('canvas');
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );
      const blob = await new Promise<Blob>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
      // Upload cropped avatar
      const fileExt = 'jpg';
      const userId = profile?.id || 'user';
      const filePath = `avatars/${userId}_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('avatars').upload(filePath, blob);
      if (error) throw error;
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      if (publicUrlData?.publicUrl) {
        setEditProfile({ ...editProfile, avatar_url: publicUrlData.publicUrl });
        toast({ title: 'Avatar uploaded', description: 'Avatar updated successfully.' });
      }
      setShowCropper(false);
      setAvatarFile(null);
    } catch (err) {
      toast({ title: 'Upload failed', description: 'Could not upload avatar.', variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const openProfileModal = () => {
    setEditProfile(profile);
    setShowProfileModal(true);
  };
  const handleProfileSave = async () => {
    if (!editProfile) return;
    const user = await AuthService.getCurrentUser?.();
    if (user && user.id && AuthService.updateProfile) {
      await AuthService.updateProfile(user.id, {
        full_name: editProfile.full_name,
        email: editProfile.email,
        avatar_url: editProfile.avatar_url,
        phone: editProfile.phone,
        bio: editProfile.bio,
        location: editProfile.location,
        twitter: editProfile.twitter,
        telegram: editProfile.telegram
      });
      setProfile(editProfile);
      setShowProfileModal(false);
      toast({ title: 'Profile updated', description: 'Your profile was updated.' });
    }
  };
  const handlePasswordReset = async () => {
    setPwResetSent(false);
    if (!pwResetEmail) return;
    try {
      if (AuthService.sendPasswordReset) {
        await AuthService.sendPasswordReset(pwResetEmail);
        setPwResetSent(true);
        toast({ title: 'Password Reset', description: 'Reset email sent.' });
      }
    } catch {
      toast({ title: 'Password Reset Failed', description: 'Could not send reset email.', variant: 'destructive' });
    }
  };

  return (
    <div className="relative min-h-screen flex justify-center items-center bg-gray-950">
      <AnimatedBg />
      {profile && (
        <div className="absolute top-6 right-6 z-10">
          <button onClick={() => setShowMenu(!showMenu)} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-full shadow hover:bg-gray-700">
            <img src={profile.avatar_url || '/user-avatar.svg'} alt="avatar" className="w-7 h-7 rounded-full" />
            <span>{profile.full_name || profile.email}</span>
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg rounded-lg p-2 z-20">
              <button onClick={openProfileModal} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Edit Profile</button>
              <button onClick={handleLogout} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Logout</button>
            </div>
          )}
        </div>
      )}
      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setShowProfileModal(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
            <div className="flex flex-col items-center mb-4">
              <img src={editProfile?.avatar_url || '/user-avatar.svg'} alt="avatar" className="w-20 h-20 rounded-full object-cover mb-2 border" />
              <label className="bg-gray-200 px-2 py-1 rounded cursor-pointer text-xs">
                {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} disabled={uploadingAvatar} />
              </label>
            </div>
            <div className="grid grid-cols-1 gap-3 mb-6">
              <label className="block text-xs font-semibold">Full Name
                <input type="text" className="w-full border rounded px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-200" value={editProfile?.full_name || ''} onChange={e => setEditProfile({ ...editProfile, full_name: e.target.value })} />
              </label>
              <label className="block text-xs font-semibold">Email
                <input type="email" className="w-full border rounded px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-200" value={editProfile?.email || ''} onChange={e => setEditProfile({ ...editProfile, email: e.target.value })} />
              </label>
              <label className="block text-xs font-semibold">Avatar URL
                <input type="text" className="w-full border rounded px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-200" value={editProfile?.avatar_url || ''} onChange={e => setEditProfile({ ...editProfile, avatar_url: e.target.value })} />
              </label>
              <label className="block text-xs font-semibold">Phone
                <input type="text" className="w-full border rounded px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-200" value={editProfile?.phone || ''} onChange={e => setEditProfile({ ...editProfile, phone: e.target.value })} />
              </label>
              <label className="block text-xs font-semibold">Bio
                <textarea className="w-full border rounded px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-200" value={editProfile?.bio || ''} onChange={e => setEditProfile({ ...editProfile, bio: e.target.value })} />
              </label>
              <label className="block text-xs font-semibold">Location
                <input type="text" className="w-full border rounded px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-200" value={editProfile?.location || ''} onChange={e => setEditProfile({ ...editProfile, location: e.target.value })} />
              </label>
              <label className="block text-xs font-semibold">Twitter
                <input type="text" className="w-full border rounded px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-200" value={editProfile?.twitter || ''} onChange={e => setEditProfile({ ...editProfile, twitter: e.target.value })} />
              </label>
              <label className="block text-xs font-semibold">Telegram
                <input type="text" className="w-full border rounded px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-200" value={editProfile?.telegram || ''} onChange={e => setEditProfile({ ...editProfile, telegram: e.target.value })} />
              </label>
            </div>
            {showCropper && (
              <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                <div className="bg-white p-4 rounded-xl shadow-lg flex flex-col items-center">
                  <Cropper
                    image={avatarFile ? URL.createObjectURL(avatarFile) : ''}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                  <div className="flex gap-2 mt-4">
                    <button onClick={handleAvatarCropSave} className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
                    <button onClick={() => setShowCropper(false)} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
                  </div>
                </div>
              </div>
            )}
            <button onClick={handleProfileSave} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mb-3 transition">Save</button>
            <hr className="my-5" />
            <h3 className="text-lg font-semibold mb-2">Reset Password</h3>
            <div className="flex items-center mb-3">
              <input type="email" className="flex-grow border rounded px-3 py-2 mr-2 focus:ring-2 focus:ring-yellow-200" placeholder="Enter your email" value={pwResetEmail} onChange={e => setPwResetEmail(e.target.value)} />
              <button onClick={handlePasswordReset} className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition">Send</button>
            </div>
            {pwResetSent && <div className="text-green-600 text-sm">Password reset email sent!</div>}
          </div>
        </div>
      )}
      <div className="z-10 w-full max-w-md mx-auto" style={glassStyles}>
        <Card>
          <CardHeader>
            <img src={AvilashaLogo} alt="Avilasha Logo" className="w-14 mx-auto mb-2" />
            <CardTitle className="text-center">Avilasha Wallet</CardTitle>
            <CardDescription className="text-center">Sign in or create an account</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={v => setTab(v as 'login' | 'signup')} className="w-full">
              <TabsList className="w-full flex justify-center mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <Card className="bg-background/60 shadow-lg border-none rounded-2xl" style={glassStyles}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><LogIn size={20}/> Login</CardTitle>
                    <CardDescription>Sign in to your account</CardDescription>
                  </CardHeader>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <Input
                      type="email"
                      placeholder="Email"
                      value={loginData.email}
                      onChange={e => setLoginData({ ...loginData, email: e.target.value })}
                      autoFocus
                      required
                    />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={loginData.password}
                      onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Logging in...' : 'Login'}</Button>
                    {/* --- OAUTH POLISH --- */}
                    <div className="flex items-center my-4">
                      <div className="flex-grow border-t border-gray-300" />
                      <span className="mx-3 text-xs text-gray-500">or sign in with</span>
                      <div className="flex-grow border-t border-gray-300" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button type="button" variant="outline" className="w-full flex items-center gap-2 hover:bg-gray-50 transition" onClick={() => handleOAuth('google')} disabled={isLoading}>
                        <img src="/google-icon.svg" alt="Google" className="w-5 h-5" /> Continue with Google
                      </Button>
                      <Button type="button" variant="outline" className="w-full flex items-center gap-2 hover:bg-gray-50 transition" onClick={() => handleOAuth('github')} disabled={isLoading}>
                        <img src="/github-icon.svg" alt="GitHub" className="w-5 h-5" /> Continue with GitHub
                      </Button>
                      <Button type="button" variant="outline" className="w-full flex items-center gap-2 hover:bg-gray-50 transition" onClick={() => handleOAuth('twitter')} disabled={isLoading}>
                        <img src="/twitter-icon.svg" alt="Twitter" className="w-5 h-5" /> Continue with Twitter
                      </Button>
                    </div>
                    {/* --- END OAUTH POLISH --- */}
                  </form>
                </Card>
              </TabsContent>
              <TabsContent value="signup">
                <Card className="bg-background/60 shadow-lg border-none rounded-2xl" style={glassStyles}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserPlus size={20}/> Sign Up</CardTitle>
                    <CardDescription>Create a new account</CardDescription>
                  </CardHeader>
                  <form onSubmit={handleSignup} className="flex flex-col gap-4 mt-4">
                    <Label htmlFor="signup-fullname" className="text-left flex items-center gap-2"><User size={16}/> Full Name</Label>
                    <Input id="signup-fullname" type="text" value={signupData.fullName} onChange={e => setSignupData({ ...signupData, fullName: e.target.value })} className="bg-background/80 border border-primary/40 focus:border-primary text-lg rounded-lg px-4 py-2" required />
                    <Label htmlFor="signup-email" className="text-left flex items-center gap-2"><Mail size={16}/> Email</Label>
                    <Input id="signup-email" type="email" autoComplete="username" value={signupData.email} onChange={e => setSignupData({ ...signupData, email: e.target.value })} className="bg-background/80 border border-primary/40 focus:border-primary text-lg rounded-lg px-4 py-2" required />
                    <Label htmlFor="signup-password" className="text-left flex items-center gap-2"><Lock size={16}/> Password</Label>
                    <Input id="signup-password" type="password" autoComplete="new-password" value={signupData.password} onChange={e => setSignupData({ ...signupData, password: e.target.value })} className="bg-background/80 border border-primary/40 focus:border-primary text-lg rounded-lg px-4 py-2" required />
                    <Label htmlFor="signup-confirm-password" className="text-left flex items-center gap-2"><Lock size={16}/> Confirm Password</Label>
                    <Input id="signup-confirm-password" type="password" autoComplete="new-password" value={signupData.confirmPassword} onChange={e => setSignupData({ ...signupData, confirmPassword: e.target.value })} className="bg-background/80 border border-primary/40 focus:border-primary text-lg rounded-lg px-4 py-2" required />
                    {error && tab === 'signup' && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <Button type="submit" className="mt-2 w-full no-drag" disabled={isLoading}>{isLoading ? 'Signing up...' : 'Sign Up'}</Button>
                    {/* --- OAUTH POLISH SIGNUP --- */}
                    <div className="flex items-center my-4">
                      <div className="flex-grow border-t border-gray-300" />
                      <span className="mx-3 text-xs text-gray-500">or sign up with</span>
                      <div className="flex-grow border-t border-gray-300" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button type="button" variant="outline" className="w-full flex items-center gap-2 hover:bg-gray-50 transition" onClick={() => handleOAuth('google')} disabled={isLoading}>
                        <img src="/google-icon.svg" alt="Google" className="w-5 h-5" /> Sign up with Google
                      </Button>
                      <Button type="button" variant="outline" className="w-full flex items-center gap-2 hover:bg-gray-50 transition" onClick={() => handleOAuth('github')} disabled={isLoading}>
                        <img src="/github-icon.svg" alt="GitHub" className="w-5 h-5" /> Sign up with GitHub
                      </Button>
                      <Button type="button" variant="outline" className="w-full flex items-center gap-2 hover:bg-gray-50 transition" onClick={() => handleOAuth('twitter')} disabled={isLoading}>
                        <img src="/twitter-icon.svg" alt="Twitter" className="w-5 h-5" /> Sign up with Twitter
                      </Button>
                    </div>
                    {/* --- END OAUTH POLISH SIGNUP --- */}
                  </form>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
// --- END ENHANCED AUTH PAGE ---