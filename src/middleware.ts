import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if accessing admin routes
  if (pathname.startsWith('/Admin')) {
    // Get admin auth token from dedicated admin cookie
    const adminToken = request.cookies.get('admin-auth-token')?.value

    // Fallback to general auth token for backward compatibility
    const generalToken = request.cookies.get('auth-token')?.value

    const authToken = adminToken || generalToken

    if (!authToken) {
      // No auth token, redirect to login
      return NextResponse.redirect(new URL('/Login', request.url))
    }

    try {
      // Parse user data from cookie
      const user = JSON.parse(authToken)

      // Check if user has admin role
      if (user.role !== 'admin') {
        // Not admin, redirect to home
        return NextResponse.redirect(new URL('/', request.url))
      }

      // User is admin, allow access
      return NextResponse.next()
    } catch (error) {
      // Invalid cookie, redirect to login
      console.error('Invalid auth token:', error)
      return NextResponse.redirect(new URL('/Login', request.url))
    }
  }

  // Check if accessing protected routes (cart, checkout)
  // NOTE: Detail page is publicly accessible to avoid SSR hydration issues.
  if (pathname.startsWith('/cart') || pathname.startsWith('/checkout')) {
    // Get user auth token from dedicated user cookie
    const userToken = request.cookies.get('user-auth-token')?.value

    // Fallback to general auth token for backward compatibility
    const generalToken = request.cookies.get('auth-token')?.value

    const authToken = userToken || generalToken

    if (!authToken) {
      // No auth token, redirect to login
      return NextResponse.redirect(new URL('/Login', request.url))
    }

    try {
      // Parse user data from cookie
      const user = JSON.parse(authToken)

      // User is authenticated, allow access
      return NextResponse.next()
    } catch (error) {
      // Invalid cookie, redirect to login
      console.error('Invalid auth token:', error)
      return NextResponse.redirect(new URL('/Login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/Admin/:path*',
    '/cart/:path*',
    '/checkout/:path*',
  ]
}
