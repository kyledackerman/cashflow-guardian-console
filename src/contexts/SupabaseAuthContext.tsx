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
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && session?.user) {
          // Validate role access with proper loading state
          setRoleValidating(true);
          setTimeout(async () => {
            try {
              const { data: canLogin, error: rpcError } = await supabase.rpc('can_user_login', {
                user_id: session.user.id
              });

              if (rpcError) {
                console.error('RPC error:', rpcError);
                throw rpcError;
              }

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
              setRoleValidating(false);
            }
          }, 0);
        } else {
          setRoleValidating(false);
        }
      }
    );

    // Check for existing session with role validation
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Validate existing session role access
      if (session?.user) {
        setRoleValidating(true);
        try {
          const { data: canLogin, error: rpcError } = await supabase.rpc('can_user_login', {
            user_id: session.user.id
          });

          if (rpcError) {
            console.error('Session validation RPC error:', rpcError);
            throw rpcError;
          }

          if (!canLogin) {
            await supabase.auth.signOut();
            toast({
              title: "Session Invalid",
              description: "Your account does not have access permissions.",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('Error validating existing session:', error);
          await supabase.auth.signOut();
        } finally {
          setRoleValidating(false);
        }
      }
    });

    return () => subscription.unsubscribe();
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