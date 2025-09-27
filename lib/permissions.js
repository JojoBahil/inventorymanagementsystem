/**
 * Role-Based Access Control (RBAC) utility functions
 */

/**
 * Check if a user has a specific permission
 * @param {Object} user - User object with role and permissions
 * @param {string} permission - Permission to check (e.g., 'items:create')
 * @returns {boolean} - True if user has permission
 */
export function hasPermission(user, permission) {
  if (!user || !user.role) {
    return false;
  }

  const permissions = JSON.parse(user.role.permissions || '[]');
  
  // Administrator has all permissions
  if (permissions.includes('*')) {
    return true;
  }
  
  // Check specific permission
  return permissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 * @param {Object} user - User object
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} - True if user has any of the permissions
 */
export function hasAnyPermission(user, permissions) {
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Check if user has all of the specified permissions
 * @param {Object} user - User object
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} - True if user has all permissions
 */
export function hasAllPermissions(user, permissions) {
  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Get user's role name
 * @param {Object} user - User object
 * @returns {string} - Role name or 'Unknown'
 */
export function getUserRole(user) {
  return user?.role?.name || 'Unknown';
}

/**
 * Check if user is administrator
 * @param {Object} user - User object
 * @returns {boolean} - True if user is administrator
 */
export function isAdministrator(user) {
  return getUserRole(user) === 'Administrator';
}

/**
 * Check if user is manager
 * @param {Object} user - User object
 * @returns {boolean} - True if user is manager
 */
export function isManager(user) {
  return getUserRole(user) === 'Manager';
}

/**
 * Check if user is viewer
 * @param {Object} user - User object
 * @returns {boolean} - True if user is viewer
 */
export function isViewer(user) {
  return getUserRole(user) === 'Viewer';
}

/**
 * Permission constants for easy reference
 */
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard:view',
  
  // Items
  ITEMS_VIEW: 'items:read',
  ITEMS_CREATE: 'items:create',
  ITEMS_UPDATE: 'items:update',
  ITEMS_DELETE: 'items:delete',
  
  // Transactions
  TRANSACTIONS_VIEW: 'transactions:read',
  TRANSACTIONS_CREATE: 'transactions:create',
  TRANSACTIONS_UPDATE: 'transactions:update',
  TRANSACTIONS_DELETE: 'transactions:delete',
  
  // Reports
  REPORTS_VIEW: 'reports:read',
  REPORTS_EXPORT: 'reports:export',
  
  // Admin/References
  ADMIN_VIEW: 'references:read',
  ADMIN_MANAGE: 'references:create',
  
  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_UPDATE: 'settings:update',
  
  // User Management
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  
  // Role Management
  ROLES_VIEW: 'roles:view',
  ROLES_CREATE: 'roles:create',
  ROLES_UPDATE: 'roles:update',
  ROLES_DELETE: 'roles:delete'
};
