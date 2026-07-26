import { cache } from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { UserRole } from './roles';
import { isValidRole } from './roles';

export type AuthenticatedUser = {
  id: string;
  email: string | undefined;
  role: UserRole;
};

export type AuthResult =
  | { user: AuthenticatedUser; error: null }
  | { user: null; error: 'unauthenticated' | 'no_profile' | 'invalid_role' };

export const getCurrentUserWithRole = cache(async (): Promise<AuthResult> => {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
        },
      },
    }
  );

  const { data: { user }, error: sessionError } = await supabase.auth.getUser();

  if (sessionError || !user) {
    return { user: null, error: 'unauthenticated' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profile')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { user: null, error: 'no_profile' };
  }

  if (!isValidRole(profile.role)) {
    return { user: null, error: 'invalid_role' };
  }

  return {
    user: { id: user.id, email: user.email, role: profile.role },
    error: null,
  };
});