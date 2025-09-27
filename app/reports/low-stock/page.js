'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, FileText, FileSpreadsheet, Package } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { ReportTable } from '@/components/reports/ReportTable'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0))
}

export default function LowStockReport() {
  const [filterOptions, setFilterOptions] = useState([])
  const toast = useToast()

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await fetch('/api/reports/low-stock?page=1&limit=1')
        if (response.ok) {
          const data = await response.json()
          
          setFilterOptions([
            {
              key: 'category',
              label: 'Category',
              type: 'searchable-select',
              options: data.filterOptions?.categories || []
            },
            {
              key: 'brand',
              label: 'Brand',
              type: 'searchable-select',
              options: data.filterOptions?.brands || []
            },
            {
              key: 'severity',
              label: 'Severity',
              type: 'select',
              options: data.filterOptions?.severities || []
            }
          ])
        }
      } catch (error) {
        console.error('Error fetching filter options:', error)
      }
    }

    fetchFilterOptions()
  }, [])

  const getSeverityBadge = (severityLevel) => {
    switch (severityLevel) {
      case 'critical':
        return <span className="badge badge-error">Critical</span>
      case 'high':
        return <span className="badge badge-warning">High</span>
      case 'medium':
        return <span className="badge badge-info">Medium</span>
      case 'low':
        return <span className="badge badge-success">Low</span>
      default:
        return <span className="badge badge-secondary">Unknown</span>
    }
  }

  const columns = [
    {
      accessorKey: 'name',
      header: 'Item',
      cell: ({ row }) => (
        <div className="font-medium text-primary">{row.original.name}</div>
      )
    },
    {
      accessorKey: 'brand',
      header: 'Brand',
      cell: ({ row }) => row.original.brand?.name || '-'
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => row.original.category?.name || '-'
    },
    {
      accessorKey: 'uom',
      header: 'UOM',
      cell: ({ row }) => row.original.uom?.name || '-'
    },
    {
      accessorKey: 'totalStock',
      header: 'On Hand',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.totalStock}</div>
      )
    },
    {
      accessorKey: 'minStock',
      header: 'Min Stock',
      cell: ({ row }) => row.original.minStock || '-'
    },
    {
      accessorKey: 'percentage',
      header: 'Percentage',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.percentage}%</div>
      )
    },
    {
      accessorKey: 'severityLevel',
      header: 'Severity',
      cell: ({ row }) => getSeverityBadge(row.original.severityLevel)
    },
    {
      accessorKey: 'standardCost',
      header: 'Unit Cost',
      cell: ({ row }) => formatCurrency(row.original.standardCost || 0)
    },
    {
      accessorKey: 'reorderValue',
      header: 'Reorder Value',
      cell: ({ row }) => (
        <div className="font-medium">{formatCurrency(row.original.reorderValue || 0)}</div>
      )
    }
  ]

  const exportToCSV = async () => {
    try {
      const response = await fetch('/api/reports/low-stock?limit=10000')
      if (response.ok) {
        const data = await response.json()
        const headers = ['SKU', 'Item Name', 'Brand', 'Category', 'UOM', 'On Hand', 'Min Stock', 'Percentage', 'Severity', 'Unit Cost', 'Reorder Value']
        const csvContent = [
          headers.join(','),
          ...data.data.map(item => [
            item.sku || '',
            `"${item.name}"`,
            item.brand?.name || '',
            item.category?.name || '',
            item.uom?.name || '',
            item.totalStock,
            item.minStock,
            item.percentage + '%',
            item.severityLevel.charAt(0).toUpperCase() + item.severityLevel.slice(1),
            item.standardCost || 0,
            item.reorderValue || 0
          ].join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `low-stock-alert-${new Date().toISOString().split('T')[0]}.csv`
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
      title="Low Stock Alert"
      description="Items below minimum stock levels requiring attention"
      apiEndpoint="/api/reports/low-stock"
      columns={columns}
      filterOptions={filterOptions}
      exportFunctions={{
        csv: exportToCSV,
        pdf: exportToPDF
      }}
      emptyMessage="No low stock items found. All items are above their minimum stock levels."
    />
  )
}
