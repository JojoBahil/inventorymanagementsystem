'use client'

import { useState, useEffect } from 'react'
import { Package, FileText, FileSpreadsheet } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { ReportTable } from '@/components/reports/ReportTable'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0))
}

export default function StockOnHandReport() {
  const [filterOptions, setFilterOptions] = useState([])
  const toast = useToast()


  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await fetch('/api/reports/stock-on-hand?page=1&limit=1')
        if (response.ok) {
          const data = await response.json()
          setFilterOptions([
            {
              key: 'search',
              label: 'Search',
              type: 'text',
              placeholder: 'Search items...'
            },
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
              key: 'status',
              label: 'Status',
              type: 'select',
              options: data.filterOptions?.statuses || []
            }
          ])
        }
      } catch (error) {
        console.error('Error fetching filter options:', error)
      }
    }

    fetchFilterOptions()
  }, [])

  const getStatusBadge = (item) => {
    if (item.totalStock === 0) {
      return <span className="badge badge-error">Out of Stock</span>
    } else if (item.minStock > 0 && item.totalStock < item.minStock) {
      return <span className="badge badge-warning">Below Minimum</span>
    } else {
      return <span className="badge badge-success">In Stock</span>
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
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original)
    },
    {
      accessorKey: 'standardCost',
      header: 'Unit Cost',
      cell: ({ row }) => formatCurrency(row.original.standardCost || 0)
    },
    {
      accessorKey: 'totalValue',
      header: 'Total Value',
      cell: ({ row }) => {
        const totalValue = row.original.totalStock * (row.original.standardCost || 0)
        return <div className="font-medium">{formatCurrency(totalValue)}</div>
      }
    }
  ]

  const exportToCSV = async () => {
    try {
      const response = await fetch('/api/reports/stock-on-hand?limit=10000')
      if (response.ok) {
        const data = await response.json()
        const headers = ['SKU', 'Item Name', 'Brand', 'Category', 'UOM', 'On Hand', 'Min Stock', 'Status', 'Unit Cost', 'Total Value']
        const csvContent = [
          headers.join(','),
          ...data.data.map(item => {
            const totalValue = item.totalStock * (item.standardCost || 0)
            let status = 'In Stock'
            if (item.totalStock === 0) status = 'Out of Stock'
            else if (item.minStock > 0 && item.totalStock < item.minStock) status = 'Below Minimum'
            
            return [
              item.sku || '',
              `"${item.name}"`,
              item.brand?.name || '',
              item.category?.name || '',
              item.uom?.name || '',
              item.totalStock,
              item.minStock,
              status,
              item.standardCost || 0,
              totalValue
            ].join(',')
          })
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `stock-on-hand-${new Date().toISOString().split('T')[0]}.csv`
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
      title="Stock On Hand"
      description="Current inventory levels for all items"
      apiEndpoint="/api/reports/stock-on-hand"
      columns={columns}
      filterOptions={filterOptions}
      exportFunctions={{
        csv: exportToCSV,
        pdf: exportToPDF
      }}
      emptyMessage="No items found. Try adjusting your filters or search terms."
    />
  )
}
