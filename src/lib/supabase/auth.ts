'use client';

import { supabase } from '@/lib/supabase/client';
import { errorEmitter } from '@/firebase/error-emitter';
import type { SupabaseAuthError } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
}

export async function signUp(data: any) {
  const { email, password, displayName } = data;

  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Failed to create user account');
    }

    const user = authData.user;

    // Create user profile in database
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: user.id,
          email: user.email,
          display_name: displayName,
          subscription_tier: 'free',
          is_admin: false,
          created_at: new Date().toISOString(),
        },
      ]);

    if (profileError) {
      // Attempt to delete the auth user if profile creation fails
      await supabase.auth.admin?.deleteUser(user.id).catch(err => {
        console.error('Failed to rollback user creation:', err);
      });

      throw new Error('Failed to create user profile. Please try again.');
    }

    // Send verification email
    await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        shouldCreateUser: false,
      },
    }).catch(err => {
      console.warn('Failed to send verification email:', err);
    });

    return user;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
}

export async function signIn(data: any) {
  const { email, password } = data;

  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (!authData.user) {
      throw new Error('Failed to sign in');
    }

    return authData.user;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
      },
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/reset-password`,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
}

export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Update password error:', error);
    throw error;
  }
}
