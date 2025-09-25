import { NextResponse } from 'next/server'
 
export function middleware(request) {
  // Get the session cookie
  const session = request.cookies.get('session')
  
  // Public paths that don't require auth
  const publicPaths = ['/login']
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )
  
  // Redirect to login if no session and trying to access protected route
  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Redirect to dashboard if has session and trying to access login
  if (session && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return NextResponse.next()
}
 
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (we'll handle auth there separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
  ],
}
