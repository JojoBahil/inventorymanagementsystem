'use client'

import { useState } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { ItemForm } from '@/components/ui/ItemForm'
import { StatsSection } from '@/components/dashboard/StatsSection'
import { MovementsSection } from '@/components/dashboard/MovementsSection'
import { ArrowDownToLine, ArrowUpFromLine, ChevronRight, Plus } from 'lucide-react'
import clsx from 'clsx'

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
    accessorKey: 'locationName',
    header: 'To Location'
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


function QuickActions({ onAddItem }) {
  const actions = [
    { 
      name: 'Add New Item', 
      onClick: onAddItem, 
      icon: Plus, 
      color: 'success',
      description: 'Create a new inventory item'
    },
    { 
      name: 'New Receipt', 
      href: '/transactions/new/grn', 
      icon: ArrowDownToLine, 
      color: 'info',
      description: 'Record incoming inventory'
    },
    { 
      name: 'New Issue', 
      href: '/transactions/new/issue', 
      icon: ArrowUpFromLine, 
      color: 'error',
      description: 'Record outgoing inventory'
    },
  ]

  return (
    <div className="space-y-4">
      {actions.map(action => (
        action.onClick ? (
          <button
            key={action.name}
            onClick={action.onClick}
            className="card card-compact p-6 flex items-center hover:border-primary transition-all duration-200 group cursor-pointer w-full text-left"
          >
            <div className={clsx(
              'p-3 rounded-xl transition-colors',
              action.color === 'success' ? 'bg-success/10 group-hover:bg-success/20' :
              action.color === 'info' ? 'bg-info/10 group-hover:bg-info/20' : 'bg-error/10 group-hover:bg-error/20'
            )}>
              <action.icon className={clsx(
                'w-5 h-5',
                action.color === 'success' ? 'text-success' :
                action.color === 'info' ? 'text-info' : 'text-error'
              )} />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="font-semibold text-primary group-hover:text-primary transition-colors">
                {action.name}
              </h3>
              <p className="text-sm text-muted mt-1">{action.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
          </button>
        ) : (
          <a
            key={action.name}
            href={action.href}
            className="card card-compact p-6 flex items-center hover:border-primary transition-all duration-200 group cursor-pointer"
          >
            <div className={clsx(
              'p-3 rounded-xl transition-colors',
              action.color === 'info' ? 'bg-info/10 group-hover:bg-info/20' : 'bg-error/10 group-hover:bg-error/20'
            )}>
              <action.icon className={clsx(
                'w-5 h-5',
                action.color === 'info' ? 'text-info' : 'text-error'
              )} />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="font-semibold text-primary group-hover:text-primary transition-colors">
                {action.name}
              </h3>
              <p className="text-sm text-muted mt-1">{action.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
          </a>
        )
      ))}
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
    <div className="w-[93%] mx-auto">
      <div className="space-y-8">
        {/* Professional Header */}
        <div className="animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">Dashboard</h1>
              <p className="text-secondary text-lg">Welcome back! Here's what's happening with your inventory.</p>
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
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">
                  <MovementsSection key={`movements-${refreshKey}`} />

          <div className="animate-fade-in">
            <h2 className="text-xl font-semibold text-primary mb-6">Quick Actions</h2>
            <QuickActions onAddItem={handleAddItem} />
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