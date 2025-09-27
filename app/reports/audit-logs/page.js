'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Search, Filter, Calendar, User, Activity } from 'lucide-react'
import { DataTable } from '@/components/ui/DataTable'
import Link from 'next/link'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 30,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [userRole, setUserRole] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [allActions, setAllActions] = useState([])

  const fetchAllActions = async () => {
    try {
      const response = await fetch('/api/audit-logs/actions')
      if (response.ok) {
        const actions = await response.json()
        setAllActions(actions)
      }
    } catch (error) {
      console.error('Error fetching all actions:', error)
    }
  }

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      
      if (filterAction) {
        params.append('action', filterAction)
      }
      
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      
      const response = await fetch(`/api/audit-logs?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs')
      }
      const data = await response.json()
      setLogs(data.logs)
      setPagination(data.pagination)
      setUserRole(data.userRole)
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    fetchAllActions()
  }, [])

  // Refetch logs when filters change
  useEffect(() => {
    if (filterAction || searchTerm) {
      fetchLogs(1) // Reset to page 1 when filtering
    }
  }, [filterAction, searchTerm])

  const handlePageChange = (newPage) => {
    fetchLogs(newPage)
  }

  const clearFilters = () => {
    setFilterAction('')
    setSearchTerm('')
    fetchLogs(1)
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  const getActionBadgeColor = (action, entity) => {
    // Special colors for specific actions
    if (action === 'CREATE' && entity === 'ISSUE') {
      return 'bg-orange-100 text-orange-800'
    }
    
    const actionColors = {
      'CREATE': 'bg-green-100 text-green-800',
      'UPDATE': 'bg-blue-100 text-blue-800',
      'DELETE': 'bg-red-100 text-red-800',
      'LOGIN': 'bg-purple-100 text-purple-800',
      'LOGOUT': 'bg-gray-100 text-gray-800',
      'VIEW': 'bg-yellow-100 text-yellow-800'
    }
    return actionColors[action] || 'bg-gray-100 text-gray-800'
  }

  const getHumanReadableAction = (action, entity) => {
    const actionMap = {
      'CREATE': {
        'GRN': 'Received Stock',
        'ISSUE': 'Issued Stock',
        'ITEM': 'Created Item',
        'USER': 'Created User',
        'default': 'Created'
      },
      'UPDATE': {
        'default': 'Updated'
      },
      'DELETE': {
        'default': 'Deleted'
      },
      'LOGIN': {
        'default': 'Logged In'
      },
      'LOGOUT': {
        'default': 'Logged Out'
      },
      'VIEW': {
        'default': 'Viewed'
      }
    }

    return actionMap[action]?.[entity] || actionMap[action]?.default || action
  }

  const getHumanReadableEntity = (entity) => {
    const entityMap = {
      'GRN': 'Received',
      'ISSUE': 'Issued',
      'ITEM': 'Item',
      'USER': 'User',
      'default': entity
    }
    return entityMap[entity] || entityMap.default
  }

  const getHumanReadableDetails = (action, entity, details) => {
    if (typeof details === 'string') {
      return details
    }

    if (!details || typeof details !== 'object') {
      return 'No additional details'
    }

    switch (action) {
      case 'CREATE':
        switch (entity) {
                 case 'GRN':
                   if (details.items && Array.isArray(details.items)) {
                     const itemList = details.items.map(item =>
                       `${item.itemName} (${item.quantity} pcs × ₱${item.unitCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })})`
                     ).join(', ')
                     return `Received: ${itemList}. Total: ₱${(details.totalValue || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                   }
                   return `Received ${details.itemCount || 0} item(s) worth ₱${(details.totalValue || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
          case 'ISSUE':
            if (details.items && Array.isArray(details.items)) {
              const itemList = details.items.map(item => 
                `${item.itemName} (${item.quantity} pcs × ₱${item.unitCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })})`
              ).join(', ')
              return `Issued: ${itemList}. Total: ₱${(details.totalValue || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
            }
            return `Issued ${details.itemCount || 0} item(s) with total quantity of ${details.totalQuantity || 0} units`
          case 'ITEM':
            return `Created new item: ${details.name || 'Unknown'}`
          case 'USER':
            return `Created new user: ${details.email || 'Unknown'}`
          default:
            return `Created new ${entity.toLowerCase()}`
        }
      case 'LOGIN':
        return `User logged in successfully (Role: ${details.role || 'Unknown'})`
      case 'LOGOUT':
        return `User logged out successfully`
      case 'UPDATE':
        return `Updated ${entity.toLowerCase()} information`
      case 'DELETE':
        return `Deleted ${entity.toLowerCase()}`
      default:
        return JSON.stringify(details)
    }
  }

         // No client-side filtering needed - server handles all filtering
         const filteredLogs = logs

  const columns = [
    {
      accessorKey: 'timestamp',
      header: 'Date & Time',
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="font-medium text-foreground">
            {formatTimestamp(row.original.timestamp)}
          </div>
        </div>
      )
    },
    {
      accessorKey: 'user',
      header: 'User',
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="font-medium text-foreground">{row.original.user.name}</div>
          <div className="text-muted text-xs">{row.original.user.role}</div>
        </div>
      )
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(row.original.action, row.original.entity)}`}>
          {getHumanReadableAction(row.original.action, row.original.entity)}
        </span>
      )
    },
    {
      accessorKey: 'entity',
      header: 'Entity',
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="font-medium text-foreground">{getHumanReadableEntity(row.original.entity) || 'System'}</div>
          {row.original.entityId && (
            <div className="text-muted text-xs">ID: {row.original.entityId}</div>
          )}
        </div>
      )
    },
    {
      accessorKey: 'details',
      header: 'Details',
      cell: ({ row }) => (
        <div className="text-sm text-foreground max-w-lg">
          {getHumanReadableDetails(row.original.action, row.original.entity, row.original.details)}
        </div>
      )
    },
    {
      accessorKey: 'ipAddress',
      header: 'IP Address',
      cell: ({ row }) => (
        <div className="text-sm text-muted font-mono">
          {row.original.ipAddress}
        </div>
      )
    }
  ]

         const uniqueActions = allActions.map(action => ({
           value: `${action.action}-${action.entity}`,
           label: getHumanReadableAction(action.action, action.entity)
         })).sort((a, b) => a.label.localeCompare(b.label))

         if (loading) {
           return (
             <div className="space-y-6">
               <div>
                 <div className="mb-2">
                   <Link 
                     href="/reports" 
                     className="btn btn-secondary inline-flex items-center"
                   >
                     <ChevronLeft className="w-4 h-4 mr-2" />
                     Back to Reports
                   </Link>
                 </div>
                 <div className="flex items-center space-x-4">
                   <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                     <Activity className="w-5 h-5 text-primary" />
                   </div>
                   <div>
                     <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
                     <p className="text-muted">Track system activities and user actions</p>
                   </div>
                 </div>
               </div>
        
        <div className="bg-surface-elevated rounded-lg border border-border p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-surface rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-surface rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

         return (
           <div className="space-y-6">
             {/* Header */}
             <div>
               <div className="mb-2">
                 <Link 
                   href="/reports" 
                   className="btn btn-secondary inline-flex items-center"
                 >
                   <ChevronLeft className="w-4 h-4 mr-2" />
                   Back to Reports
                 </Link>
               </div>
               <div className="flex items-center space-x-4">
                 <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                   <Activity className="w-5 h-5 text-primary" />
                 </div>
                 <div>
                   <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
                   <p className="text-muted">
                     {userRole === 'ADMIN' && 'Viewing all system activities'}
                     {userRole === 'VIEWER' && 'Viewing manager activities'}
                     {userRole === 'MANAGER' && 'Viewing your activities'}
                   </p>
                 </div>
               </div>
             </div>

             {/* Filters */}
             <div className="bg-surface-elevated rounded-lg border border-border p-6">
               <div className="flex flex-wrap gap-4 items-end">
                 <div className="flex-1 min-w-64">
                   <div className="relative">
                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-4 h-4" />
                     <input
                       type="text"
                       placeholder="Search by action, entity, user..."
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                     />
                   </div>
                 </div>

                 <select
                   value={filterAction}
                   onChange={(e) => setFilterAction(e.target.value)}
                   className="px-4 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                 >
                   <option value="">All Actions</option>
                   {uniqueActions.map((action, index) => (
                     <option key={`${action.value}-${index}`} value={action.value}>{action.label}</option>
                   ))}
                 </select>

                 {(filterAction || searchTerm) && (
                   <button
                     onClick={clearFilters}
                     className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                   >
                     Clear Filters
                   </button>
                 )}
               </div>
               
               {(filterAction || searchTerm) && (
                 <div className="mt-3 text-sm text-muted">
                   <span>Active filters: </span>
                   {searchTerm && <span className="inline-block bg-primary/10 text-primary px-2 py-1 rounded mr-2">Search: "{searchTerm}"</span>}
                   {filterAction && <span className="inline-block bg-primary/10 text-primary px-2 py-1 rounded">Action: {uniqueActions.find(a => a.value === filterAction)?.label}</span>}
                 </div>
               )}
             </div>

      {/* Data Table */}
      <div className="bg-surface-elevated rounded-lg border border-border overflow-hidden">
        <DataTable
          data={filteredLogs}
          columns={columns}
          emptyMessage="No audit logs found"
        />
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-surface-elevated rounded-lg border border-border p-4">
          <div className="text-sm text-muted">
            Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="p-2 rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center space-x-1">
              {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                let pageNum
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1
                } else if (pagination.page <= 3) {
                  pageNum = i + 1
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i
                } else {
                  pageNum = pagination.page - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      pageNum === pagination.page
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-surface border border-border'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="p-2 rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
