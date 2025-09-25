import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    
    // For development, accept any email/password
    // TODO: Add proper authentication later
    if (body.email && body.password) {
      // Set a session cookie that expires in 24 hours
      cookies().set('session', 'dev', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 // 24 hours
      })
      
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
