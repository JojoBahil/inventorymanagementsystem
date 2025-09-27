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

           const { searchParams } = new URL(request.url)
           const page = parseInt(searchParams.get('page') || '1')
           const limit = parseInt(searchParams.get('limit') || '10') // Default to 10 for better UX
           const skip = (page - 1) * limit
           const actionFilter = searchParams.get('action')
           const searchTerm = searchParams.get('search')
           const userIdFilter = searchParams.get('userId') ? parseInt(searchParams.get('userId')) : null

    let whereClause = {}

    // Apply role-based filtering
    const userRole = userWithRole.role.name.toUpperCase()

    if (userRole === 'ADMIN') {
      // Admin users can view all logs - no additional filtering
      whereClause = {}
    } else if (userRole === 'VIEWER') {
      // Viewer users can view all activity logs done by manager users
      const managerUsers = await prisma.user.findMany({
        where: {
          role: {
            name: { equals: 'MANAGER' }
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

    // Apply userId filter if provided (for personal activity logs)
    // Only allow if user is admin or if they're requesting their own logs
    if (userIdFilter && !isNaN(userIdFilter)) {
      if (userRole === 'ADMIN' || userIdFilter === sessionUser.id) {
        whereClause = {
          ...whereClause,
          actorId: userIdFilter
        }
      } else {
        // Non-admin users can only view their own logs
        whereClause = {
          ...whereClause,
          actorId: sessionUser.id
        }
      }
    }

    // Apply action filter if provided
    if (actionFilter) {
      const [action, entity] = actionFilter.split('-')
      whereClause = {
        ...whereClause,
        action: action,
        entity: entity
      }
    }

    // Apply search filter if provided
    if (searchTerm) {
      whereClause = {
        ...whereClause,
        OR: [
          { action: { contains: searchTerm } },
          { entity: { contains: searchTerm } },
          { diff: { contains: searchTerm } },
          { user: { name: { contains: searchTerm } } },
          { user: { email: { contains: searchTerm } } }
        ]
      }
    }


    const [auditLogs, total] = await Promise.all([
      prisma.auditlog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }),
      prisma.auditlog.count({ where: whereClause })
    ])

    const formattedLogs = auditLogs.map((log, index) => {
      let parsedDetails = log.diff
      try {
        // Try to parse as JSON if it's a string
        if (typeof log.diff === 'string') {
          parsedDetails = JSON.parse(log.diff)
        }
      } catch (e) {
        // If parsing fails, keep as string
        parsedDetails = log.diff
      }
      
      return {
        id: log.id,
        uniqueKey: `${log.id}-${index}`, // Ensure unique key
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        details: parsedDetails,
        timestamp: log.createdAt.toISOString(),
        ipAddress: log.ip,
        userAgent: log.userAgent,
        user: {
          name: log.user.name,
          email: log.user.email,
          role: log.user.role.name
        }
      }
    })

    return NextResponse.json({
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      userRole: userRole
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}

// Helper function to create audit log entries
export async function createAuditLog(userId, action, entity, entityId, details, request) {
  try {
    console.log('createAuditLog called with:', { userId, action, entity, entityId, details })
    console.log('Request headers:', {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })
    
    const auditLog = await prisma.auditlog.create({
      data: {
        actorId: userId,
        action,
        entity,
        entityId: entityId ? entityId.toString() : null,
        diff: typeof details === 'string' ? details : JSON.stringify(details),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })
    console.log('Audit log created successfully:', auditLog.id)
    return auditLog
  } catch (error) {
    console.error('Error creating audit log:', error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    // Don't throw error - audit logging should not break the main functionality
  }
}
