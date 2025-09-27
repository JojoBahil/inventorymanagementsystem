import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function getSessionUser() {
  try {
    const cookieStore = cookies()
    const session = cookieStore.get('session')
    
    if (!session) {
      return null
    }

    // Extract user ID from session token
    // Format: user_${userId}_${timestamp}
    const sessionParts = session.value.split('_')
    
    if (sessionParts.length < 2 || sessionParts[0] !== 'user') {
      return null
    }

    const userId = parseInt(sessionParts[1])
    
    if (isNaN(userId)) {
      return null
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true
      }
    })

    if (!user || !user.isActive) {
      return null
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    }
  } catch (error) {
    console.error('Error getting session user:', error)
    return null
  }
}

export async function requireAuth() {
  const user = await getSessionUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}
