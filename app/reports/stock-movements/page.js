'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, FileText, FileSpreadsheet } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { ReportTable } from '@/components/reports/ReportTable'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0))
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(dateString))
}

export default function StockMovementsReport() {
  const [filterOptions, setFilterOptions] = useState([])
  const toast = useToast()

  // Set default date range (last 30 days)
  const getDefaultDateRange = () => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    return {
      dateTo: today.toISOString().split('T')[0],
      dateFrom: thirtyDaysAgo.toISOString().split('T')[0]
    }
  }

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await fetch('/api/reports/stock-movements?page=1&limit=1')
        if (response.ok) {
          const data = await response.json()
          const defaultDates = getDefaultDateRange()
          
          setFilterOptions([
            {
              key: 'dateFrom',
              label: 'Date From',
              type: 'date',
              defaultValue: defaultDates.dateFrom
            },
            {
              key: 'dateTo',
              label: 'Date To',
              type: 'date',
              defaultValue: defaultDates.dateTo
            },
            {
              key: 'type',
              label: 'Type',
              type: 'select',
              options: data.filterOptions?.types || []
            },
            {
              key: 'item',
              label: 'Item',
              type: 'text',
              placeholder: 'Search items...'
            }
          ])
        }
      } catch (error) {
        console.error('Error fetching filter options:', error)
      }
    }

    fetchFilterOptions()
  }, [])

  const getTypeBadge = (type) => {
    switch (type) {
      case 'GRN':
        return <span className="badge badge-success">Received</span>
      case 'ISSUE':
        return <span className="badge badge-error">Issued</span>
      default:
        return <span className="badge badge-secondary">{type}</span>
    }
  }

  const columns = [
    {
      accessorKey: 'timestamp',
      header: 'Date/Time',
      cell: ({ row }) => (
        <div className="text-sm">{formatDate(row.original.timestamp)}</div>
      )
    },
    {
      accessorKey: 'itemName',
      header: 'Item',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.itemName}</div>
      )
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => getTypeBadge(row.original.type)
    },
    {
      accessorKey: 'qtyIn',
      header: 'Qty In',
      cell: ({ row }) => (
        <div className="text-success font-medium">
          {row.original.qtyIn || '-'}
        </div>
      )
    },
    {
      accessorKey: 'qtyOut',
      header: 'Qty Out',
      cell: ({ row }) => (
        <div className="text-error font-medium">
          {row.original.qtyOut || '-'}
        </div>
      )
    },
    {
      accessorKey: 'destination',
      header: 'Destination',
      cell: ({ row }) => row.original.destination || '-'
    },
    {
      accessorKey: 'unitCost',
      header: 'Unit Cost',
      cell: ({ row }) => formatCurrency(row.original.unitCost || 0)
    },
    {
      accessorKey: 'totalValue',
      header: 'Total Value',
      cell: ({ row }) => (
        <div className="font-medium">{formatCurrency(row.original.totalValue || 0)}</div>
      )
    }
  ]

  const exportToCSV = async () => {
    try {
      const response = await fetch('/api/reports/stock-movements?limit=10000')
      if (response.ok) {
        const data = await response.json()
        const headers = ['Date/Time', 'Item', 'Type', 'Qty In', 'Qty Out', 'Destination', 'Unit Cost', 'Total Value']
        const csvContent = [
          headers.join(','),
          ...data.data.map(movement => [
            movement.timestamp,
            `"${movement.itemName}"`,
            movement.type,
            movement.qtyIn || 0,
            movement.qtyOut || 0,
            movement.destination || '',
            movement.unitCost || 0,
            movement.totalValue || 0
          ].join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `stock-movements-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
        
        toast.success('CSV exported successfully!')
      }
    } catch (error) {
      toast.error('Failed to export CSV')
    }
  }

  const exportToPDF = () => {
    toast.info('PDF export feature coming soon!')
  }

  return (
    <ReportTable
      title="Stock Movements"
      description="Incoming and outgoing inventory transactions"
      apiEndpoint="/api/reports/stock-movements"
      columns={columns}
      filterOptions={filterOptions}
      defaultFilters={getDefaultDateRange()}
      exportFunctions={{
        csv: exportToCSV,
        pdf: exportToPDF
      }}
      emptyMessage="No movements found. Try adjusting your date range or filters."
    />
  )
}
