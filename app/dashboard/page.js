'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { ItemForm } from '@/components/ui/ItemForm'
import { StatsSection } from '@/components/dashboard/StatsSection'
import { MiniTrend } from '@/components/dashboard/MiniTrend'
import { MovementsSection } from '@/components/dashboard/MovementsSection'
import { ArrowDownToLine, ArrowUpFromLine, ChevronRight, Plus } from 'lucide-react'
import clsx from 'clsx'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

// Format date as local
const formatDate = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short'
})

// Table columns for recent movements
  const columns = [
    {
      accessorKey: 'timestamp',
      header: 'Date/Time'
    },
    {
      accessorKey: 'itemName',
      header: 'Item'
    },
    {
      accessorKey: 'destination',
      header: 'Destination'
    },
    {
      accessorKey: 'qtyIn',
      header: 'Qty In'
    },
    {
      accessorKey: 'qtyOut',
      header: 'Qty Out'
    },
    {
      accessorKey: 'type',
      header: 'Type'
    }
  ]


function QuickActions({ onAddItem, user }) {
  const actions = [
    { 
      name: 'Add New Item', 
      onClick: onAddItem, 
      icon: Plus, 
      color: 'success',
      description: 'Create a new inventory item',
      permission: PERMISSIONS.ITEMS_CREATE
    },
    { 
      name: 'Receive Stock', 
      href: '/transactions/new/grn', 
      icon: ArrowDownToLine, 
      color: 'info',
      description: 'Record incoming inventory',
      permission: PERMISSIONS.TRANSACTIONS_CREATE
    },
    { 
      name: 'New Issue', 
      href: '/transactions/new/issue', 
      icon: ArrowUpFromLine, 
      color: 'error',
      description: 'Record outgoing inventory',
      permission: PERMISSIONS.TRANSACTIONS_CREATE
    },
  ]

  return (
    <div className="space-y-4">
      {actions.map(action => {
        const hasAccess = user && hasPermission(user, action.permission)
        const isDisabled = !hasAccess
        
        return action.onClick ? (
          <button
            key={action.name}
            onClick={isDisabled ? undefined : action.onClick}
            disabled={isDisabled}
            className={clsx(
              "card card-compact p-6 flex items-center transition-all duration-200 group w-full text-left",
              isDisabled 
                ? "opacity-50 cursor-not-allowed" 
                : "hover:border-primary cursor-pointer"
            )}
          >
            <div className={clsx(
              'p-3 rounded-xl transition-colors',
              isDisabled ? 'bg-muted/10' :
              action.color === 'success' ? 'bg-success/10 group-hover:bg-success/20' :
              action.color === 'info' ? 'bg-info/10 group-hover:bg-info/20' : 'bg-error/10 group-hover:bg-error/20'
            )}>
              <action.icon className={clsx(
                'w-5 h-5',
                isDisabled ? 'text-muted' :
                action.color === 'success' ? 'text-success' :
                action.color === 'info' ? 'text-info' : 'text-error'
              )} />
            </div>
            <div className="ml-4 flex-1">
              <h3 className={clsx(
                "font-semibold transition-colors",
                isDisabled ? "text-muted" : "text-primary group-hover:text-primary"
              )}>
                {action.name}
              </h3>
              <p className="text-sm text-muted mt-1">
                {isDisabled ? 'Access restricted' : action.description}
              </p>
            </div>
            <ChevronRight className={clsx(
              "w-5 h-5 transition-colors",
              isDisabled ? "text-muted" : "text-muted group-hover:text-primary"
            )} />
          </button>
        ) : (
          <a
            key={action.name}
            href={isDisabled ? undefined : action.href}
            onClick={isDisabled ? (e) => e.preventDefault() : undefined}
            className={clsx(
              "card card-compact p-6 flex items-center transition-all duration-200 group",
              isDisabled 
                ? "opacity-50 cursor-not-allowed" 
                : "hover:border-primary cursor-pointer"
            )}
          >
            <div className={clsx(
              'p-3 rounded-xl transition-colors',
              isDisabled ? 'bg-muted/10' :
              action.color === 'info' ? 'bg-info/10 group-hover:bg-info/20' : 'bg-error/10 group-hover:bg-error/20'
            )}>
              <action.icon className={clsx(
                'w-5 h-5',
                isDisabled ? 'text-muted' :
                action.color === 'info' ? 'text-info' : 'text-error'
              )} />
            </div>
            <div className="ml-4 flex-1">
              <h3 className={clsx(
                "font-semibold transition-colors",
                isDisabled ? "text-muted" : "text-primary group-hover:text-primary"
              )}>
                {action.name}
              </h3>
              <p className="text-sm text-muted mt-1">
                {isDisabled ? 'Access restricted' : action.description}
              </p>
            </div>
            <ChevronRight className={clsx(
              "w-5 h-5 transition-colors",
              isDisabled ? "text-muted" : "text-muted group-hover:text-primary"
            )} />
          </a>
        )
      })}
    </div>
  )
}

function StatsLoadingSkeleton() {
  return (
    <div className="flex gap-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="stat-card flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl skeleton"></div>
            <div className="h-4 rounded w-12 skeleton"></div>
          </div>
          <div className="flex-1 flex flex-col justify-end">
            <div className="h-8 rounded w-3/4 skeleton mb-2"></div>
            <div className="h-4 rounded w-1/2 skeleton"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [showItemForm, setShowItemForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
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
      .catch(() => {
        // Fallback for development
        setUser({
          name: 'Dev User',
          email: 'dev@ssii.com',
          role: { name: 'Administrator', permissions: '["*"]' }
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const handleAddItem = () => {
    setShowItemForm(true)
  }

  const handleItemCreated = (newItem) => {
    console.log('New item created:', newItem)
    // Close the form
    setShowItemForm(false)
    // Trigger refresh of child components
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="w-full px-6 lg:px-10">
      <div className="space-y-10">
        {/* Professional Header */}
        <div className="animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight mb-1">Dashboard</h1>
              <p className="text-secondary text-lg md:text-xl">Welcome back! Here's what's happening with your inventory.</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted">Last updated</p>
              <p className="text-sm font-medium text-primary">{formatDate.format(new Date())}</p>
            </div>
          </div>
        </div>
        
                {/* Professional Stats Grid */}
                <div className="animate-fade-in">
                  <StatsSection key={`stats-${refreshKey}`} />
                </div>

                {/* Professional Main Content */}
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
                  <div className="space-y-8">
                    <MovementsSection key={`movements-${refreshKey}`} />
                    <MiniTrend />
                  </div>

          <div className="animate-fade-in">
            <h2 className="text-xl font-semibold text-primary mb-4">Quick Actions</h2>
            <QuickActions onAddItem={handleAddItem} user={user} />
          </div>
        </div>
      </div>

              {/* Item Creation Form Modal */}
              <ItemForm
                isOpen={showItemForm}
                onClose={() => setShowItemForm(false)}
                onSuccess={handleItemCreated}
              />
    </div>
  )
}