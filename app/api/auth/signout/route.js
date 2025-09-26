import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Create response with cleared cookie
    const response = NextResponse.json({ success: true, message: 'Signed out successfully' })
    
    // Clear the session cookie
    response.cookies.set('session', '', {
      path: '/',
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })
    
    return response
  } catch (error) {
    console.error('Error signing out:', error)
    return NextResponse.json(
      { error: 'Failed to sign out' },
      { status: 500 }
    )
  }
}
