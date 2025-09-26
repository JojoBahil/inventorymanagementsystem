import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import bcrypt from 'bcryptjs'

// GET /api/users/[id] - Get specific user
export async function GET(request, { params }) {
  try {
    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(sessionUser, PERMISSIONS.USERS_VIEW)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = params
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        role: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Remove sensitive data
    const { hashedPassword, ...safeUser } = user

    return NextResponse.json(safeUser)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(request, { params }) {
  try {
    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(sessionUser, PERMISSIONS.USERS_UPDATE)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()
    const { name, email, password, roleId, isActive } = body

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }

      // Check if email already exists (excluding current user)
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          id: { not: parseInt(id) }
        }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        )
      }
    }

    // Validate password strength if provided
    if (password && password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Verify role exists if provided
    if (roleId) {
      const role = await prisma.role.findUnique({
        where: { id: parseInt(roleId) }
      })

      if (!role) {
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData = {
      ...(name && { name }),
      ...(email && { email }),
      ...(roleId && { roleId: parseInt(roleId) }),
      ...(typeof isActive === 'boolean' && { isActive })
    }

    // Hash password if provided
    if (password) {
      updateData.hashedPassword = await bcrypt.hash(password, 12)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        role: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Log the action
    await prisma.auditlog.create({
      data: {
        actorId: sessionUser.id,
        action: 'USER_UPDATED',
        entity: 'user',
        entityId: updatedUser.id.toString(),
        diff: `Updated user: ${updatedUser.name} (${updatedUser.email})`,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    // Remove sensitive data
    const { hashedPassword: _, ...safeUser } = updatedUser

    return NextResponse.json(safeUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Delete user (soft delete)
export async function DELETE(request, { params }) {
  try {
    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(sessionUser, PERMISSIONS.USERS_DELETE)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = params
    const userId = parseInt(id)

    // Prevent self-deletion
    if (userId === sessionUser.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Soft delete user
    await prisma.user.update({
      where: { id: userId },
      data: { 
        deletedAt: new Date(),
        isActive: false
      }
    })

    // Log the action
    await prisma.auditlog.create({
      data: {
        actorId: sessionUser.id,
        action: 'USER_DELETED',
        entity: 'user',
        entityId: userId.toString(),
        diff: `Deleted user: ${user.name} (${user.email})`,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
