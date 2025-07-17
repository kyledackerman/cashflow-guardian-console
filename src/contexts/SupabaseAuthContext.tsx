import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useSupabaseAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const SupabaseAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Role validation is now handled by RLS policies and the simplified role system

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && session?.user) {
          toast({
            title: "Welcome back!",
            description: "You have been successfully signed in."
          });
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name
            // Role is now automatically set to 'user' in the database trigger
          }
        }
      });

      if (error) {
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Check your email",
          description: "A confirmation link has been sent to your email address."
        });
      }

      return { error };
    } catch (error: any) {
      toast({
        title: "Sign Up Failed",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
      return { error };
    }
  };

  // Rate limiting state
  const [lastSignInAttempt, setLastSignInAttempt] = useState(0);
  const [signInAttempts, setSignInAttempts] = useState(0);

  const signIn = async (email: string, password: string) => {
    try {
      // Basic rate limiting: max 5 attempts per minute
      const now = Date.now();
      const timeSinceLastAttempt = now - lastSignInAttempt;
      
      if (timeSinceLastAttempt < 60000 && signInAttempts >= 5) {
        toast({
          title: "Too Many Attempts",
          description: "Please wait a minute before trying again.",
          variant: "destructive"
        });
        return { error: { message: "Rate limited" } };
      }
      
      // Reset attempts if more than a minute has passed
      if (timeSinceLastAttempt >= 60000) {
        setSignInAttempts(0);
      }
      
      setLastSignInAttempt(now);
      setSignInAttempts(prev => prev + 1);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out."
      });
    } catch (error: any) {
      toast({
        title: "Sign Out Failed",
        description: "An error occurred while signing out.",
        variant: "destructive"
      });
    }
  };

  const isAuthenticated = !!session;

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};