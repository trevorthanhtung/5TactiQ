import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  isGuest: boolean;
  isLoading: boolean;
  isPasswordRecovery: boolean;
  setSession: (session: Session | null) => void;
  setGuest: (isGuest: boolean) => void;
  setIsPasswordRecovery: (isPasswordRecovery: boolean) => void;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isGuest: localStorage.getItem('katfc_is_guest') === 'true',
  isLoading: true,
  isPasswordRecovery: false,
  
  setSession: (session) => {
    set({ session, user: session?.user || null, isLoading: false });
    if (session) {
      // If we log in, we are no longer a guest
      localStorage.removeItem('katfc_is_guest');
      set({ isGuest: false });
    }
  },
  
  setGuest: (isGuest) => {
    if (isGuest) {
      localStorage.setItem('katfc_is_guest', 'true');
    } else {
      localStorage.removeItem('katfc_is_guest');
    }
    set({ isGuest, isLoading: false });
  },
  
  setIsPasswordRecovery: (isPasswordRecovery) => set({ isPasswordRecovery }),
  
  signOut: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('katfc_is_guest');
    set({ session: null, user: null, isGuest: false });
  },
  
  initialize: async () => {
    set({ isLoading: true });
    
    // Get initial session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error.message);
    }
    
    set({ 
      session, 
      user: session?.user || null, 
      isLoading: false 
    });

    const syncProfileData = async (sess: Session | null) => {
      if (!sess?.user) return;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', sess.user.id)
          .maybeSingle();

        const customName = sess.user.user_metadata?.custom_display_name;
        const profileName = profile?.full_name;
        const targetName = customName || profileName;

        if (targetName && targetName !== sess.user.user_metadata?.full_name) {
          const updatedUser = {
            ...sess.user,
            user_metadata: {
              ...sess.user.user_metadata,
              custom_display_name: targetName,
              full_name: targetName
            }
          };
          set({
            session: { ...sess, user: updatedUser },
            user: updatedUser
          });
        }
      } catch (e) {}
    };

    if (session) {
      syncProfileData(session);
    }

    // Check if current URL contains recovery type
    const href = window.location.href;
    if (href.includes('type=recovery') || href.includes('error_description')) {
      set({ isPasswordRecovery: true });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      set({ session, user: session?.user || null });
      if (event === 'PASSWORD_RECOVERY') {
        set({ isPasswordRecovery: true });
      }
      if (session) {
        localStorage.removeItem('katfc_is_guest');
        set({ isGuest: false });
        syncProfileData(session);
      }
    });
  }
}));
