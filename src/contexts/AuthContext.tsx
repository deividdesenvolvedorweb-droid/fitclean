import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, ROLE_PERMISSIONS, RolePermissions } from '@/types/admin';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  permissions: RolePermissions | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isManagerOrAbove: boolean;
  isSupportOrAbove: boolean;
  hasAnyAdminRole: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      // No role yet is a valid state for non-admin users
      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      return data?.role as AppRole | null;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role fetch with setTimeout to avoid deadlock
        if (session?.user) {
          setRoleLoading(true);
          setTimeout(() => {
            fetchUserRole(session.user.id).then((fetchedRole) => {
              setRole(fetchedRole);
              setRoleLoading(false);
            });
          }, 0);
        } else {
          setRole(null);
          setRoleLoading(false);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setRoleLoading(true);
        fetchUserRole(session.user.id).then((fetchedRole) => {
          setRole(fetchedRole);
          setRoleLoading(false);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Combined loading state - only false when both auth and role are loaded
  const isFullyLoaded = !loading && !roleLoading;

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        return { error };
      }

      // Create profile after signup
      if (data.user) {
        await supabase.from('profiles').insert({
          user_id: data.user.id,
          email: email,
          full_name: fullName,
        });
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  const permissions = role ? ROLE_PERMISSIONS[role] : null;
  const isAdmin = role === 'admin';
  const isManagerOrAbove = role === 'admin' || role === 'manager';
  const isSupportOrAbove = role === 'admin' || role === 'manager' || role === 'support';
  const hasAnyAdminRole = role !== null;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        permissions,
        loading: !isFullyLoaded,
        signIn,
        signUp,
        signOut,
        isAdmin,
        isManagerOrAbove,
        isSupportOrAbove,
        hasAnyAdminRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
