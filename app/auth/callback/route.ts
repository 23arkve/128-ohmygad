import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
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
        .maybeSingle()

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
        admin: '/admin/events',
        staff: '/staff/events',
        faculty: '/faculty/events',
        student: '/student/events',
      }

      const defaultRoleRoutes: Record<string, string> = {
        admin: '/admin',
        staff: '/staff',
        faculty: '/faculty',
        student: '/student',
      }

      const cookieStore = await cookies()
      const eventId = searchParams.get('event') || cookieStore.get('event_redirect_id')?.value
      if (cookieStore.has('event_redirect_id')) {
        cookieStore.delete('event_redirect_id')
      }

      const destination = eventId
        ? `${roleRoutes[profile.role] ?? '/student/events'}?event=${eventId}`
        : (defaultRoleRoutes[profile.role] ?? '/')

      return NextResponse.redirect(`${baseUrl}${destination}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}