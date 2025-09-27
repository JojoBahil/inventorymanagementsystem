import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export async function GET(request) {
  try {
    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user with role information
    const userWithRole = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      include: {
        role: {
          select: { name: true }
        }
      }
    })

    if (!userWithRole) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let whereClause = {}

    // Apply role-based filtering (same logic as main audit logs)
    const userRole = userWithRole.role.name.toUpperCase()

    if (userRole === 'ADMIN') {
      // Admin users can view all logs - no additional filtering
      whereClause = {}
    } else if (userRole === 'VIEWER') {
      // Viewer users can view all activity logs done by manager users
      const managerUsers = await prisma.user.findMany({
        where: {
          role: {
            name: { equals: 'MANAGER', mode: 'insensitive' }
          }
        },
        select: { id: true }
      })
      const managerIds = managerUsers.map(user => user.id)
      whereClause = {
        actorId: { in: managerIds }
      }
    } else if (userRole === 'MANAGER') {
      // Manager users can view their own logs only
      whereClause = {
        actorId: sessionUser.id
      }
    } else {
      // For any other role, only show their own logs
      whereClause = {
        actorId: sessionUser.id
      }
    }

    // Get all unique action-entity combinations
    const uniqueActions = await prisma.auditlog.findMany({
      where: whereClause,
      select: {
        action: true,
        entity: true
      },
      distinct: ['action', 'entity'],
      orderBy: [
        { action: 'asc' },
        { entity: 'asc' }
      ]
    })

    return NextResponse.json(uniqueActions)
  } catch (error) {
    console.error('Error fetching unique actions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch unique actions' },
      { status: 500 }
    )
  }
}
