'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Eye, EyeOff, Shield, History, User } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showAuditModal, setShowAuditModal] = useState(false)
  const toast = useToast()

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'audit', name: 'Activity Log', icon: History }
  ]

  return (
    <div className="w-full px-6 lg:px-10">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight mb-1">Settings</h1>
          <p className="text-secondary text-lg md:text-xl">Manage your account and view system activity</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-primary hover:border-border'
                  }
                `}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'security' && <SecurityTab onOpenPasswordModal={() => setShowPasswordModal(true)} />}
          {activeTab === 'audit' && <AuditTab onOpenAuditModal={() => setShowAuditModal(true)} />}
        </div>
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
      />

      {/* Audit Log Modal */}
      <AuditLogModal 
        isOpen={showAuditModal} 
        onClose={() => setShowAuditModal(false)} 
      />
    </div>
  )
}

function ProfileTab() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user/current')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
        }
      })
      .catch(error => {
        console.error('Error fetching user:', error)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-primary mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i}>
                <div className="h-4 bg-surface-elevated rounded animate-pulse mb-1"></div>
                <div className="h-10 bg-surface-elevated rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Full Name</label>
            <div className="input bg-surface-elevated">{user?.name || 'Dev User'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Email</label>
            <div className="input bg-surface-elevated">{user?.email || 'dev@ssii.com'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Role</label>
            <div className="input bg-surface-elevated">{user?.role?.name || 'Administrator'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Status</label>
            <div className="input bg-surface-elevated">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                user?.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
              }`}>
                {user?.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted mt-4">
          Account created: {user?.createdAt ? new Date(user.createdAt).toLocaleString() : 'Unknown'} • Contact your system administrator to modify account details
        </p>
      </div>
    </div>
  )
}

function SecurityTab({ onOpenPasswordModal }) {
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">Security Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-surface-elevated rounded-lg">
            <div>
              <h4 className="font-medium text-primary">Password</h4>
              <p className="text-sm text-muted">Last changed 30 days ago</p>
            </div>
            <button 
              onClick={onOpenPasswordModal}
              className="btn btn-primary"
            >
              Change Password
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-surface-elevated rounded-lg">
            <div>
              <h4 className="font-medium text-primary">Two-Factor Authentication</h4>
              <p className="text-sm text-muted">Add an extra layer of security to your account</p>
            </div>
            <button className="btn btn-secondary" disabled>
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AuditTab({ onOpenAuditModal }) {
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">Activity Log</h3>
        <p className="text-muted mb-4">
          View your recent activity history. Shows the last 20 actions you've performed in the system.
        </p>
        <button 
          onClick={onOpenAuditModal}
          className="btn btn-primary"
        >
          View Activity Log
        </button>
      </div>
    </div>
  )
}

function PasswordChangeModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password')
      }

      toast.success('Password changed successfully!')
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      onClose()
    } catch (error) {
      toast.error(error.message || 'Failed to change password. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Password" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Current Password</label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="input pr-10"
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-primary"
              >
                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1">New Password</label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                className="input pr-10"
                placeholder="Enter new password"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-primary"
              >
                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted mt-1">Password must be at least 8 characters long</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="input pr-10"
                placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-primary"
              >
                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
              <p className="text-xs text-error mt-1">Passwords do not match</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting || formData.newPassword !== formData.confirmPassword}
            className="btn btn-primary"
          >
            {isSubmitting ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function AuditLogModal({ isOpen, onClose }) {
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    if (isOpen) {
      fetchCurrentUser()
    }
  }, [isOpen])

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/user/current')
      const data = await res.json()
      if (data.user) {
        setCurrentUser(data.user)
        fetchUserAuditLogs(data.user.id)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const fetchUserAuditLogs = async (userId) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/audit-logs?userId=${userId}&limit=20`)
      const data = await res.json()
      if (data.logs) {
        setAuditLogs(data.logs)
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) {
        return 'Invalid Date'
      }
      return date.toLocaleString()
    } catch (error) {
      console.error('Error formatting timestamp:', timestamp, error)
      return 'Invalid Date'
    }
  }

  const formatAction = (action, entity) => {
    const actionMap = {
      'CREATE': 'Created',
      'UPDATE': 'Updated', 
      'DELETE': 'Deleted',
      'LOGIN': 'Logged In',
      'LOGOUT': 'Logged Out',
      'PASSWORD_CHANGE': 'Changed Password'
    }
    
    const entityMap = {
      'item': 'Item',
      'stockmovement': 'Stock Movement',
      'user': 'User',
      'category': 'Category',
      'brand': 'Brand',
      'supplier': 'Supplier',
      'customer': 'Customer',
      'uom': 'Unit of Measure'
    }

    const actionText = actionMap[action] || action
    const entityText = entityMap[entity] || entity
    
    return `${actionText} ${entityText}`
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Activity Log" size="lg">
      <div className="space-y-4">
        <div className="text-sm text-muted">
          Showing your last 20 activities. Only important actions are logged.
        </div>
        
        {loading ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="p-4 bg-surface-elevated rounded-lg border border-border">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {auditLogs.length === 0 ? (
              <div className="text-center py-8 text-muted">
                No activity logs found for your account.
              </div>
            ) : (
              auditLogs.map(log => (
                <div key={log.id} className="p-4 bg-surface-elevated rounded-lg border border-border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-primary">
                          {formatAction(log.action, log.entity)}
                        </span>
                        <span className="text-xs text-muted">•</span>
                        <span className="text-xs text-muted">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      {log.diff && (
                        <p className="text-sm text-secondary">
                          {typeof log.diff === 'string' ? log.diff : JSON.stringify(log.diff)}
                        </p>
                      )}
                      <p className="text-xs text-muted mt-1">IP: {log.ipAddress}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
      </div>
    </Modal>
  )
}
