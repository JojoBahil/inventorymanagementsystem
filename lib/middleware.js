import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

/**
 * Middleware to check if user has required permission
 * @param {string} permission - Required permission
 * @param {Function} handler - API route handler
 * @returns {Function} - Protected API route handler
 */
export function withPermission(permission, handler) {
  return async function protectedHandler(request, context) {
    try {
      const user = await getSessionUser()
      
      if (!user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      if (!hasPermission(user, permission)) {
        return NextResponse.json({ 
          error: 'Insufficient permissions',
          required: permission,
          userRole: user.role.name
        }, { status: 403 })
      }

      return handler(request, context, user)
    } catch (error) {
      console.error('Permission check error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

/**
 * Middleware to check if user has any of the required permissions
 * @param {string[]} permissions - Array of required permissions
 * @param {Function} handler - API route handler
 * @returns {Function} - Protected API route handler
 */
export function withAnyPermission(permissions, handler) {
  return async function protectedHandler(request, context) {
    try {
      const user = await getSessionUser()
      
      if (!user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      const hasAny = permissions.some(permission => hasPermission(user, permission))
      
      if (!hasAny) {
        return NextResponse.json({ 
          error: 'Insufficient permissions',
          required: permissions,
          userRole: user.role.name
        }, { status: 403 })
      }

      return handler(request, context, user)
    } catch (error) {
      console.error('Permission check error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

/**
 * Middleware to check if user is administrator
 * @param {Function} handler - API route handler
 * @returns {Function} - Protected API route handler
 */
export function withAdminAccess(handler) {
  return withPermission('*', handler)
}

/**
 * Middleware to check if user can manage items
 * @param {Function} handler - API route handler
 * @returns {Function} - Protected API route handler
 */
export function withItemManagement(handler) {
  return withAnyPermission([
    PERMISSIONS.ITEMS_CREATE,
    PERMISSIONS.ITEMS_UPDATE,
    PERMISSIONS.ITEMS_DELETE
  ], handler)
}

/**
 * Middleware to check if user can manage transactions
 * @param {Function} handler - API route handler
 * @returns {Function} - Protected API route handler
 */
export function withTransactionManagement(handler) {
  return withAnyPermission([
    PERMISSIONS.TRANSACTIONS_CREATE,
    PERMISSIONS.TRANSACTIONS_UPDATE,
    PERMISSIONS.TRANSACTIONS_DELETE
  ], handler)
}
