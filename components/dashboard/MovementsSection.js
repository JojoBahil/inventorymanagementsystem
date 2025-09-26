'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { Activity, RefreshCw } from 'lucide-react'

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

async function fetchRecentMovements() {
  try {
    const response = await fetch('/api/movements', {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch movements')
    }
    
    const data = await response.json()
    return data.movements || []
  } catch (error) {
    console.error('Error fetching movements:', error)
    return []
  }
}

export function MovementsSection() {
  const [movements, setMovements] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasActualMovements, setHasActualMovements] = useState(false)

  const loadMovements = async () => {
    setIsLoading(true)
    try {
      const data = await fetchRecentMovements()
      setMovements(data)
      setHasActualMovements(data.length > 0 && data[0]?.type !== 'ITEM_CREATED')
    } catch (error) {
      console.error('Error loading movements:', error)
      setMovements([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMovements()
  }, [])

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-primary">
          {hasActualMovements ? 'Recent Stock Movements' : 'Recent Activity'}
        </h2>
        <div className="flex items-center space-x-3">
          <div className="flex items-center text-sm text-muted">
            <Activity className="w-4 h-4 mr-2" />
            {hasActualMovements ? 'Last 10 transactions' : 'Recent items created'}
          </div>
          <button
            onClick={loadMovements}
            className="p-2 hover:bg-surface-elevated rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-muted ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      <DataTable
        data={movements}
        columns={columns}
        isLoading={isLoading}
      />
    </div>
  )
}