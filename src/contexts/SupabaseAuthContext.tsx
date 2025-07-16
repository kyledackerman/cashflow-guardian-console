import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roleValidating: boolean;
  signUp: (email: string, password: string, name: string, role?: string) => Promise<{ error: any }>;
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
  const [roleValidating, setRoleValidating] = useState(false);
  const [validationAbortController, setValidationAbortController] = useState<AbortController | null>(null);
  const { toast } = useToast();

  // Helper function to validate user role with abort controller
  const validateUserRole = async (userId: string, abortController: AbortController) => {
    try {
      const { data: canLogin, error: rpcError } = await supabase.rpc('can_user_login', {
        user_id: userId
      });

      // Check if validation was aborted
      if (abortController.signal.aborted) {
        return null;
      }

      if (rpcError) {
        console.error('RPC error:', rpcError);
        throw rpcError;
      }

      return canLogin;
    } catch (error) {
      if (abortController.signal.aborted) {
        return null;
      }
      throw error;
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Cancel any pending validation
        if (validationAbortController) {
          validationAbortController.abort();
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && session?.user) {
          // Create new abort controller for this validation
          const abortController = new AbortController();
          setValidationAbortController(abortController);
          setRoleValidating(true);

          try {
            const canLogin = await validateUserRole(session.user.id, abortController);
            
            // If validation was aborted, don't proceed
            if (canLogin === null) return;

            if (!canLogin) {
              await supabase.auth.signOut();
              toast({
                title: "Access Restricted",
                description: "Employee accounts cannot log in. Please contact management for access.",
                variant: "destructive"
              });
              return;
            }

            toast({
              title: "Welcome back!",
              description: "You have been successfully signed in."
            });
          } catch (error) {
            console.error('Error checking user permissions:', error);
            await supabase.auth.signOut();
            toast({
              title: "Access Error",
              description: "Unable to verify account permissions. Please try again.",
              variant: "destructive"
            });
          } finally {
            if (!abortController.signal.aborted) {
              setRoleValidating(false);
              setValidationAbortController(null);
            }
          }
        } else {
          setRoleValidating(false);
          setValidationAbortController(null);
        }
      }
    );

    // Check for existing session - simplified to avoid duplicate validation
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      // Role validation will be handled by onAuthStateChange if user is signed in
    });

    return () => {
      subscription.unsubscribe();
      // Cleanup any pending validation
      if (validationAbortController) {
        validationAbortController.abort();
      }
    };
  }, [toast]);

  const signUp = async (email: string, password: string, name: string, role: string = 'employee') => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name,
            role
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

  const signIn = async (email: string, password: string) => {
    try {
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

      // Role validation is now handled in onAuthStateChange to avoid redundancy
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
    roleValidating,
    signUp,
    signIn,
    signOut,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};