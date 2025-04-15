import { supabase } from './supabaseClient';

export const AuthService = {
  /**
   * Sign up a new user with email and password, and store profile info in 'profiles' table
   */
  async signUp(email: string, password: string, fullName?: string, avatarUrl?: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.user) return { user: data.user, error };
    // If fullName or avatarUrl provided, insert into profiles table
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
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { user: data.user, error };
  },

  /**
   * Log out the current user
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  /**
   * Get the currently authenticated user
   */
  async getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  /**
   * Listen for auth state changes (login/logout)
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  /**
   * Get profile from 'profiles' table
   */
  async getProfile(userId: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    return { profile: data, error };
  },

  /**
   * Update profile in 'profiles' table
   */
  async updateProfile(userId: string, updates: { full_name?: string; avatar_url?: string; phone?: string }) {
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).single();
    return { profile: data, error };
  }
};
