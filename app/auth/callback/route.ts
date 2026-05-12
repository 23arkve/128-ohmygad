import { NextResponse } from 'next/server'
import { createClientForServer } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClientForServer()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && user) {
      const { data: profile } = await supabase
        .from('profile')
        .select('role, is_onboarded')
        .eq('id', user.id)
        .single()

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      const baseUrl = isLocalEnv ? origin : forwardedHost ? `https://${forwardedHost}` : origin

      if (!profile) {
        const next = searchParams.get('next')
        if (next === 'onboarding') {
          return NextResponse.redirect(`${baseUrl}/auth/onboarding`)
        }
        return NextResponse.redirect(`${baseUrl}/auth/error`)
      }

      if (!profile.is_onboarded) {
        return NextResponse.redirect(`${baseUrl}/auth/onboarding`)
      }

      const roleRoutes: Record<string, string> = {
        admin: '/admin',
        staff: '/staff',
        faculty: '/faculty',
        student: '/student',
      }

      const destination = roleRoutes[profile.role] ?? '/'
      return NextResponse.redirect(`${baseUrl}${destination}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}