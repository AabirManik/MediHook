import { supabase } from './supabase.js';

export const auth = {
  signUp: async (email, password, fullName, role) => {
    // 1. Sign up user via Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    if (!data.user) throw new Error("No user returned from signup.");

    // 2. Create the profile record in the database
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: data.user.id,
          full_name: fullName,
          email: email,
          role: role,
        }
      ]);
      
    if (profileError) {
      console.error("Profile creation error:", profileError);
      throw new Error("Failed to create user profile.");
    }

    return data.user;
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account'
        }
      }
    });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  updateRole: async (userId, role) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
    if (error) throw error;
  },

  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  getCurrentProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist (e.g. Google Sign-In). Create it using pending role.
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const role = localStorage.getItem('pending_role') || 'patient';
      const newProfile = {
        id: userId,
        full_name: user?.user_metadata?.full_name || 'User',
        email: user?.email,
        role: role,
        health_id: 'SANJ-' + Math.floor(1000 + Math.random() * 9000)
      };
      const { data: created, error: createError } = await supabase.from('profiles').insert([newProfile]).select().single();
      if (createError) {
         console.error("Create profile error:", createError);
         return null;
      }
      return created;
    } else if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    return data;
  },
  
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },
  
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }
};
