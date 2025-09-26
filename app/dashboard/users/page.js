'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useToast, ConfirmModal } from '@/components/ui/Toast'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const toast = useToast()

  // Fetch users
  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter })
      })

      const response = await fetch(`/api/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setPagination(data.pagination)
      } else {
        console.error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch roles
  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles')
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    }
  }

  // Fetch current user
  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/user/current')
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data.user)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchRoles()
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers(1)
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, roleFilter])

  const handleDeleteUser = async (userId, userName) => {
    // Prevent self-deletion
    if (currentUser && userId === currentUser.id) {
      toast.error('You cannot delete your own account')
      return
    }

    setConfirmAction({
      type: 'delete',
      userId,
      userName,
      message: `Are you sure you want to delete user "${userName}"? This action cannot be undone.`,
      confirmText: 'Delete User'
    })
    setShowConfirmModal(true)
  }

  const executeDeleteUser = async (userId) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('User deleted successfully')
        fetchUsers(pagination.page)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }

  const handleToggleUserStatus = async (userId, currentStatus) => {
    // Prevent self-deactivation
    if (currentUser && userId === currentUser.id) {
      toast.error('You cannot deactivate your own account')
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isActive: !currentStatus
        })
      })

      if (response.ok) {
        toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
        fetchUsers(pagination.page)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update user status')
      }
    } catch (error) {
      console.error('Error updating user status:', error)
      toast.error('Failed to update user status')
    }
  }

  return (
    <div className="w-full mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight mb-1">User Management</h1>
          <p className="text-secondary text-lg md:text-xl">Manage system users and their permissions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Search Users</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Filter by Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input"
            >
              <option value="">All Roles</option>
              {roles.map(role => (
                <option key={role.id} value={role.name}>{role.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('')
                setRoleFilter('')
              }}
              className="btn btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-surface-elevated rounded animate-pulse"></div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted text-lg">No users found</p>
              <p className="text-muted text-sm mt-1">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-primary">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-primary">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-primary">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-primary">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-primary">Created</th>
                    <th className="text-left py-3 px-4 font-medium text-primary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-border hover:bg-surface-elevated/50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-primary">{user.name}</div>
                      </td>
                      <td className="py-3 px-4 text-muted">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                          {user.role.name}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.isActive 
                            ? 'bg-success/10 text-success' 
                            : 'bg-error/10 text-error'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-1 text-primary hover:bg-primary/10 rounded transition-colors"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {currentUser && user.id === currentUser.id ? (
                            <button
                              disabled
                              className="p-1 text-muted cursor-not-allowed opacity-50"
                              title="Cannot deactivate your own account"
                            >
                              {user.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                              className="p-1 text-warning hover:bg-warning/10 rounded transition-colors"
                              title={user.isActive ? 'Deactivate User' : 'Activate User'}
                            >
                              {user.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}
                          {currentUser && user.id === currentUser.id ? (
                            <button
                              disabled
                              className="p-1 text-muted cursor-not-allowed opacity-50"
                              title="Cannot delete your own account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              className="p-1 text-error hover:bg-error/10 rounded transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <div className="text-sm text-muted">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-muted px-3">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="btn btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit User Modal */}
      {(showAddModal || editingUser) && (
        <UserFormModal
          isOpen={showAddModal || !!editingUser}
          onClose={() => {
            setShowAddModal(false)
            setEditingUser(null)
          }}
          onSuccess={() => {
            setShowAddModal(false)
            setEditingUser(null)
            fetchUsers(pagination.page)
          }}
          user={editingUser}
          roles={roles}
          currentUser={currentUser}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          if (confirmAction?.type === 'delete') {
            executeDeleteUser(confirmAction.userId)
          }
          setShowConfirmModal(false)
          setConfirmAction(null)
        }}
        title="Confirm Action"
        message={confirmAction?.message || ''}
        confirmText={confirmAction?.confirmText || 'Confirm'}
        type="danger"
      />
    </div>
  )
}

// User Form Modal Component
function UserFormModal({ isOpen, onClose, onSuccess, user, roles, currentUser }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
    isActive: true
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        roleId: user.role?.id?.toString() || '',
        isActive: user.isActive ?? true
      })
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        roleId: '',
        isActive: true
      })
    }
  }, [user, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = user ? `/api/users/${user.id}` : '/api/users'
      const method = user ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          roleId: parseInt(formData.roleId),
          ...(user && !formData.password && { password: undefined }) // Don't send empty password for updates
        })
      })

      if (response.ok) {
        toast.success(user ? 'User updated successfully' : 'User created successfully')
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.error || `Failed to ${user ? 'update' : 'create'} user`)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error(`Failed to ${user ? 'update' : 'create'} user`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={user ? "Edit User" : "Add New User"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-1">
            Password {!user && '*'}
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input pr-10"
              required={!user}
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-primary"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {!user && <p className="text-xs text-muted mt-1">Minimum 8 characters</p>}
          {user && <p className="text-xs text-muted mt-1">Leave blank to keep current password</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Role *</label>
            <select
              name="roleId"
              value={formData.roleId}
              onChange={handleChange}
              className="input"
              required
              disabled={currentUser && user && user.id === currentUser.id}
            >
              <option value="">Select a role</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
            {currentUser && user && user.id === currentUser.id && (
              <p className="text-xs text-muted mt-1">Cannot change your own role</p>
            )}
          </div>
          <div>
            <label className="flex items-center gap-3 text-sm select-none cursor-pointer">
              <input 
                type="checkbox" 
                name="isActive" 
                checked={formData.isActive}
                onChange={handleChange}
                disabled={currentUser && user && user.id === currentUser.id}
                className="peer sr-only" 
              />
              <span className={`inline-block h-5 w-9 rounded-full bg-surface-elevated border border-border transition-colors relative peer-checked:bg-emerald-500/40 peer-checked:border-emerald-500 peer-focus:ring-2 peer-focus:ring-sky-400/40 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4 ${currentUser && user && user.id === currentUser.id ? 'opacity-50 cursor-not-allowed' : ''}`}></span>
              <span className={`text-sm font-medium text-primary transition-colors peer-checked:text-emerald-400 ${currentUser && user && user.id === currentUser.id ? 'text-muted' : ''}`}>
                Active User
                {currentUser && user && user.id === currentUser.id && (
                  <span className="text-muted ml-1">(Cannot change your own status)</span>
                )}
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? 'Saving...' : (user ? 'Update User' : 'Create User')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
