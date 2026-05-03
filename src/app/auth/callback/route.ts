import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * OAuth callback handler
 * This route is called after the user authenticates with Google/OAuth provider
 * 
 * Set this as your redirect URI in:
 * - Supabase: Authentication > Providers > {provider} > Authorized redirect URLs
 * - Google Console: Authorized JavaScript origins
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (code) {
    const supabase = await createServerSupabaseClient();
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Redirect to dashboard on success
      redirect('/dashboard');
    }
  }

  // Redirect to login on failure
  redirect('/login?error=auth_failed');
}
