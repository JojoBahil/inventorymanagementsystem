import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export async function GET(request) {
  try {
    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const userId = searchParams.get('userId')

    const skip = (page - 1) * limit

    const where = userId ? { actorId: parseInt(userId) } : { actorId: sessionUser.id }

    const [auditLogs, total] = await Promise.all([
      prisma.auditlog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.auditlog.count({ where })
    ])

    const formattedLogs = auditLogs.map(log => ({
      id: log.id,
      action: log.action,
      details: log.diff,
      timestamp: log.createdAt.toISOString(),
      ipAddress: log.ip,
      userAgent: log.userAgent,
      user: log.user
    }))

    return NextResponse.json({
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
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
    await prisma.auditlog.create({
      data: {
        actorId: userId,
        action,
        entity,
        entityId: entityId.toString(),
        diff: details,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })
  } catch (error) {
    console.error('Error creating audit log:', error)
    // Don't throw error - audit logging should not break the main functionality
  }
}
