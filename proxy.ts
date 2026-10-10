import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  const { supabase, supabaseResponse } = await updateSession(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl
  const path = url.pathname

  const isPublicRoute = path === '/' || path.startsWith('/login')
  
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && path === '/login') {
    const redirectTo = url.searchParams.get('redirect_to')
    if (redirectTo && redirectTo.startsWith('/')) {
        return NextResponse.redirect(new URL(redirectTo, request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Khusus /pengaturan, cek jika role bukan ADMIN
  if (user && path.startsWith('/pengaturan')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'ADMIN') {
       const redirectUrl = new URL('/dashboard', request.url)
       redirectUrl.searchParams.set('error', 'unauthorized')
       return NextResponse.redirect(redirectUrl)
    }
  }

  // Batasi Cache-Control: no-store hanya untuk rute terproteksi (di dalam grup (app)),
  // bukan untuk /, /login, dan aset statis.
  if (!isPublicRoute) {
    supabaseResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  }
  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
