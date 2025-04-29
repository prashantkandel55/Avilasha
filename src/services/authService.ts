import { supabase } from './supabaseClient';

// Helper to check if Supabase is configured
function isSupabaseConfigured() {
  return !!(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    import.meta.env.VITE_SUPABASE_URL.startsWith('http') &&
    import.meta.env.VITE_SUPABASE_ANON_KEY.length > 10
  );
}

// Add failed login tracking (demo mode only)
function incrementFailedLoginCount(email: string) {
  const failed = JSON.parse(localStorage.getItem('failedLoginAttempts') || '{}');
  failed[email] = (failed[email] || 0) + 1;
  localStorage.setItem('failedLoginAttempts', JSON.stringify(failed));
}

function resetFailedLoginCount(email: string) {
  const failed = JSON.parse(localStorage.getItem('failedLoginAttempts') || '{}');
  failed[email] = 0;
  localStorage.setItem('failedLoginAttempts', JSON.stringify(failed));
}

function getRecentFailedLoginAttempts(email: string): number {
  const failed = JSON.parse(localStorage.getItem('failedLoginAttempts') || '{}');
  return failed[email] || 0;
}

export const AuthService = {
  /**
   * Sign up a new user with email and password, and store profile info in 'profiles' table
   * Falls back to demo mode if Supabase is not configured
   */
  async signUp(email: string, password: string, fullName?: string, avatarUrl?: string) {
    if (!isSupabaseConfigured()) {
      // Demo mode: store mock user in localStorage
      const mockUsers = JSON.parse(localStorage.getItem('mockUsers') || '{}');
      if (mockUsers[email]) {
        return { user: null, error: { message: 'This email is already in use (demo mode)' } };
      }
      const mockUser = {
        id: email,
        email,
        full_name: fullName,
        avatar_url: avatarUrl
      };
      mockUsers[email] = { password, user: mockUser };
      localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
      return { user: mockUser, error: null };
    }
    // Real Supabase
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.user) return { user: data.user, error };
    if (fullName || avatarUrl) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
        avatar_url: avatarUrl
      });
    }
    return { user: data.user, error };
  },

  /**
   * Log in an existing user with email and password
   * Falls back to demo mode if Supabase is not configured
   */
  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured()) {
      const mockUsers = JSON.parse(localStorage.getItem('mockUsers') || '{}');
      if (mockUsers[email] && mockUsers[email].password === password) {
        resetFailedLoginCount(email);
        return { user: mockUsers[email].user, error: null };
      }
      incrementFailedLoginCount(email);
      return { user: null, error: { message: 'Invalid email or password (demo mode)' } };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    // (Optionally: track failed logins for real auth here)
    return { user: data.user, error };
  },

  /**
   * Sign in with OAuth provider (Google, GitHub, Twitter)
   */
  async signInWithOAuth(provider: 'google' | 'github' | 'twitter') {
    if (!isSupabaseConfigured()) {
      return { user: null, error: { message: 'OAuth not available in demo mode' } };
    }
    const { data, error } = await supabase.auth.signInWithOAuth({ provider });
    return { user: data?.user || null, error };
  },

  /**
   * Log out the current user
   */
  async signOut() {
    if (!isSupabaseConfigured()) {
      // Demo mode: clear mock user session
      sessionStorage.removeItem('user_data');
      localStorage.removeItem('user_data');
      return { error: null };
    }
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  /**
   * Get the currently authenticated user
   */
  async getCurrentUser() {
    if (!isSupabaseConfigured()) {
      // Demo mode: get mock user from session/localStorage
      const user = JSON.parse(localStorage.getItem('user_data') || sessionStorage.getItem('user_data') || 'null');
      return user;
    }
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  /**
   * Listen for auth state changes (login/logout)
   */
  onAuthStateChange(callback) {
    if (!isSupabaseConfigured()) {
      // Demo mode: no real auth state changes
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange(callback);
  },

  /**
   * Get profile from 'profiles' table
   */
  async getProfile(userId) {
    if (!isSupabaseConfigured()) {
      // Demo mode: get mock user profile
      const mockUsers = JSON.parse(localStorage.getItem('mockUsers') || '{}');
      const user = Object.values(mockUsers).find((u) => u.user.id === userId)?.user;
      return { profile: user, error: null };
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    return { profile: data, error };
  },

  /**
   * Update profile in 'profiles' table
   */
  async updateProfile(userId, updates) {
    if (!isSupabaseConfigured()) {
      // Demo mode: update mock user
      const mockUsers = JSON.parse(localStorage.getItem('mockUsers') || '{}');
      for (const email in mockUsers) {
        if (mockUsers[email].user.id === userId) {
          mockUsers[email].user = { ...mockUsers[email].user, ...updates };
        }
      }
      localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
      return { profile: updates, error: null };
    }
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).single();
    return { profile: data, error };
  },

  /**
   * Send password reset email (Supabase only)
   */
  async sendPasswordReset(email: string) {
    if (!isSupabaseConfigured()) {
      // Demo mode: do nothing
      return { error: null };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  },

  /**
   * Get recent failed login attempts
   */
  getRecentFailedLoginAttempts(email: string): number {
    return getRecentFailedLoginAttempts(email);
  },
};
