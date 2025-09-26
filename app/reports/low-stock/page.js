'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Download, Filter, FileText, FileSpreadsheet, Package, Calendar, ChevronLeft } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import Link from 'next/link'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0))
}

export default function LowStockReport() {
  const [items, setItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const toast = useToast()

  // Set default date range (last 30 days)
  useEffect(() => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    setDateTo(today.toISOString().split('T')[0])
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0])
  }, [])

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [itemsRes, categoriesRes, brandsRes] = await Promise.all([
          fetch('/api/items?includeStock=true'),
          fetch('/api/categories'),
          fetch('/api/brands')
        ])

        if (!itemsRes.ok || !categoriesRes.ok || !brandsRes.ok) {
          throw new Error('Failed to fetch data')
        }

        const [itemsData, categoriesData, brandsData] = await Promise.all([
          itemsRes.json(),
          categoriesRes.json(),
          brandsRes.json()
        ])

        setItems(itemsData.items || [])
        setCategories(categoriesData.categories || [])
        setBrands(brandsData.brands || [])
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load report data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Filter items that are below minimum stock
  useEffect(() => {
    let filtered = items.filter(item => {
      const onHand = item.stock?.reduce((sum, s) => sum + Number(s.quantity), 0) || 0
      const minStock = Number(item.minStock) || 0
      return minStock > 0 && onHand < minStock
    })

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(item => item.category?.name === categoryFilter)
    }

    // Brand filter
    if (brandFilter) {
      filtered = filtered.filter(item => item.brand?.name === brandFilter)
    }

    // Severity filter
    if (severityFilter) {
      filtered = filtered.filter(item => {
        const onHand = item.stock?.reduce((sum, s) => sum + Number(s.quantity), 0) || 0
        const minStock = Number(item.minStock) || 0
        const percentage = (onHand / minStock) * 100
        
        switch (severityFilter) {
          case 'critical':
            return percentage <= 25
          case 'high':
            return percentage > 25 && percentage <= 50
          case 'medium':
            return percentage > 50 && percentage <= 75
          case 'low':
            return percentage > 75
          default:
            return true
        }
      })
    }

    // Sort by severity (most critical first)
    filtered.sort((a, b) => {
      const aOnHand = a.stock?.reduce((sum, s) => sum + Number(s.quantity), 0) || 0
      const aMinStock = Number(a.minStock) || 0
      const aPercentage = aMinStock > 0 ? (aOnHand / aMinStock) * 100 : 100
      
      const bOnHand = b.stock?.reduce((sum, s) => sum + Number(s.quantity), 0) || 0
      const bMinStock = Number(b.minStock) || 0
      const bPercentage = bMinStock > 0 ? (bOnHand / bMinStock) * 100 : 100
      
      return aPercentage - bPercentage
    })

    setFilteredItems(filtered)
  }, [items, categoryFilter, brandFilter, severityFilter])

  const exportToCSV = () => {
    const headers = ['SKU', 'Item Name', 'Brand', 'Category', 'UOM', 'On Hand', 'Min Stock', 'Percentage', 'Severity', 'Unit Cost', 'Reorder Value']
    const csvContent = [
      headers.join(','),
      ...filteredItems.map(item => {
        const onHand = item.stock?.reduce((sum, s) => sum + Number(s.quantity), 0) || 0
        const minStock = Number(item.minStock) || 0
        const percentage = minStock > 0 ? ((onHand / minStock) * 100).toFixed(1) : 0
        const unitCost = Number(item.standardCost) || 0
        const reorderValue = (minStock - onHand) * unitCost
        
        let severity = 'Low'
        if (percentage <= 25) severity = 'Critical'
        else if (percentage <= 50) severity = 'High'
        else if (percentage <= 75) severity = 'Medium'
        
        return [
          item.sku || '',
          `"${item.name}"`,
          item.brand?.name || '',
          item.category?.name || '',
          item.uom?.name || '',
          onHand,
          minStock,
          percentage + '%',
          severity,
          unitCost,
          reorderValue
        ].join(',')
      })
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

  const exportToPDF = () => {
    toast.info('PDF export feature coming soon!')
  }

  const clearFilters = () => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    setDateTo(today.toISOString().split('T')[0])
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0])
    setCategoryFilter('')
    setBrandFilter('')
    setSeverityFilter('')
  }

  const getSeverityBadge = (item) => {
    const onHand = item.stock?.reduce((sum, s) => sum + Number(s.quantity), 0) || 0
    const minStock = Number(item.minStock) || 0
    const percentage = minStock > 0 ? (onHand / minStock) * 100 : 100
    
    if (percentage <= 25) {
      return <span className="badge badge-error">Critical</span>
    } else if (percentage <= 50) {
      return <span className="badge badge-warning">High</span>
    } else if (percentage <= 75) {
      return <span className="badge badge-info">Medium</span>
    } else {
      return <span className="badge badge-success">Low</span>
    }
  }

  const getSeverityCounts = () => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 }
    
    filteredItems.forEach(item => {
      const onHand = item.stock?.reduce((sum, s) => sum + Number(s.quantity), 0) || 0
      const minStock = Number(item.minStock) || 0
      const percentage = minStock > 0 ? (onHand / minStock) * 100 : 100
      
      if (percentage <= 25) counts.critical++
      else if (percentage <= 50) counts.high++
      else if (percentage <= 75) counts.medium++
      else counts.low++
    })
    
    return counts
  }

  const severityCounts = getSeverityCounts()

  if (loading) {
    return (
      <div className="w-full space-y-8">
        <div className="h-8 bg-surface-elevated rounded animate-pulse"></div>
        <div className="h-64 bg-surface-elevated rounded animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
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
            <h1 className="text-4xl font-bold text-primary">Low Stock Alert</h1>
            <p className="text-lg text-secondary">Items below minimum stock levels requiring attention</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
            <button
              onClick={exportToCSV}
              className="btn btn-secondary"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              CSV
            </button>
            <button
              onClick={exportToPDF}
              className="btn btn-secondary"
            >
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="card p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Date From</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Date To</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="input"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Brand</label>
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="input"
                >
                  <option value="">All Brands</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.name}>{brand.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Severity</label>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="input"
                >
                  <option value="">All Severities</option>
                  <option value="critical">Critical (≤25%)</option>
                  <option value="high">High (26-50%)</option>
                  <option value="medium">Medium (51-75%)</option>
                  <option value="low">Low (76-99%)</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                onClick={clearFilters}
                className="btn btn-secondary btn-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Severity Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Critical</p>
                <p className="text-3xl font-bold text-error">{severityCounts.critical}</p>
                <p className="text-xs text-muted">≤25% of minimum</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-error/60" />
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">High</p>
                <p className="text-3xl font-bold text-warning">{severityCounts.high}</p>
                <p className="text-xs text-muted">26-50% of minimum</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-warning/60" />
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Medium</p>
                <p className="text-3xl font-bold text-info">{severityCounts.medium}</p>
                <p className="text-xs text-muted">51-75% of minimum</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-info/60" />
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Low</p>
                <p className="text-3xl font-bold text-success">{severityCounts.low}</p>
                <p className="text-xs text-muted">76-99% of minimum</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-success/60" />
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="px-6 py-5">Item</th>
                <th className="px-6 py-5">Brand</th>
                <th className="px-6 py-5">Category</th>
                <th className="px-6 py-5">UOM</th>
                <th className="px-6 py-5">On Hand</th>
                <th className="px-6 py-5">Min Stock</th>
                <th className="px-6 py-5">Percentage</th>
                <th className="px-6 py-5">Severity</th>
                <th className="px-6 py-5">Unit Cost</th>
                <th className="px-6 py-5">Reorder Value</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const onHand = item.stock?.reduce((sum, s) => sum + Number(s.quantity), 0) || 0
                  const minStock = Number(item.minStock) || 0
                  const percentage = minStock > 0 ? ((onHand / minStock) * 100).toFixed(1) : 0
                  const unitCost = Number(item.standardCost) || 0
                  const reorderValue = (minStock - onHand) * unitCost
                  
                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-5">
                        <div className="font-medium text-primary">{item.name}</div>
                      </td>
                      <td className="px-6 py-5">{item.brand?.name || '-'}</td>
                      <td className="px-6 py-5">{item.category?.name || '-'}</td>
                      <td className="px-6 py-5">{item.uom?.name || '-'}</td>
                      <td className="px-6 py-5 font-medium">{onHand}</td>
                      <td className="px-6 py-5">{minStock}</td>
                      <td className="px-6 py-5 font-medium">{percentage}%</td>
                      <td className="px-6 py-5">{getSeverityBadge(item)}</td>
                      <td className="px-6 py-5">{formatCurrency(unitCost)}</td>
                      <td className="px-6 py-5 font-medium">{formatCurrency(reorderValue)}</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={10} className="text-center py-16">
                    <div className="flex flex-col items-center">
                      <Package className="w-16 h-16 text-muted mb-4" />
                      <h3 className="text-lg font-semibold text-muted mb-2">No low stock items found</h3>
                      <p className="text-sm text-muted max-w-sm text-center">
                        All items are above their minimum stock levels.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
    </div>
  )
}
