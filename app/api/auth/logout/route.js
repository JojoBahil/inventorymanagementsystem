import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createAuditLog } from '@/app/api/audit-logs/route'

export async function POST(request) {
  try {
    // Get current user before clearing session
    const sessionUser = await getSessionUser()
    
    // Clear session cookie
    cookies().set('session', '', { maxAge: 0, path: '/' })
    
    // Log logout if user was authenticated
    if (sessionUser) {
      await createAuditLog(
        sessionUser.id,
        'LOGOUT',
        'USER',
        sessionUser.id,
        { email: sessionUser.email },
        request
      )
    }
    
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
  } catch (error) {
    console.error('Logout error:', error)
    // Still clear the session even if audit logging fails
    cookies().set('session', '', { maxAge: 0, path: '/' })
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
  }
}


