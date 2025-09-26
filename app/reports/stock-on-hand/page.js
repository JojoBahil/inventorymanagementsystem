'use client'

import { useState, useEffect } from 'react'
import { Package, Download, Filter, Search, FileText, FileSpreadsheet, ChevronLeft } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import Link from 'next/link'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0))
}

export default function StockOnHandReport() {
  const [items, setItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const toast = useToast()


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

  // Apply filters
  useEffect(() => {
    let filtered = items

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(item => item.category?.name === categoryFilter)
    }

    // Brand filter
    if (brandFilter) {
      filtered = filtered.filter(item => item.brand?.name === brandFilter)
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(item => {
        const onHand = item.stock?.reduce((sum, s) => sum + Number(s.quantity), 0) || 0
        const minStock = Number(item.minStock) || 0
        
        switch (statusFilter) {
          case 'in-stock':
            return onHand > 0
          case 'out-of-stock':
            return onHand === 0
          case 'low-stock':
            return onHand > 0 && onHand < minStock
          case 'below-min':
            return minStock > 0 && onHand < minStock
          default:
            return true
        }
      })
    }

    setFilteredItems(filtered)
  }, [items, searchTerm, categoryFilter, brandFilter, statusFilter])

  const exportToCSV = () => {
    const headers = ['SKU', 'Item Name', 'Brand', 'Category', 'UOM', 'On Hand', 'Min Stock', 'Status', 'Unit Cost', 'Total Value']
    const csvContent = [
      headers.join(','),
      ...filteredItems.map(item => {
        const onHand = item.stock?.reduce((sum, s) => sum + Number(s.quantity), 0) || 0
        const minStock = Number(item.minStock) || 0
        const unitCost = Number(item.standardCost) || 0
        const totalValue = onHand * unitCost
        
        let status = 'In Stock'
        if (onHand === 0) status = 'Out of Stock'
        else if (minStock > 0 && onHand < minStock) status = 'Below Minimum'
        
        return [
          item.sku || '',
          `"${item.name}"`,
          item.brand?.name || '',
          item.category?.name || '',
          item.uom?.name || '',
          onHand,
          minStock,
          status,
          unitCost,
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

  const exportToPDF = () => {
    toast.info('PDF export feature coming soon!')
  }

  const clearFilters = () => {
    setSearchTerm('')
    setCategoryFilter('')
    setBrandFilter('')
    setStatusFilter('')
  }

  const getStatusBadge = (item) => {
    const onHand = item.stock?.reduce((sum, s) => sum + Number(s.quantity), 0) || 0
    const minStock = Number(item.minStock) || 0
    
    if (onHand === 0) {
      return <span className="badge badge-error">Out of Stock</span>
    } else if (minStock > 0 && onHand < minStock) {
      return <span className="badge badge-warning">Below Minimum</span>
    } else {
      return <span className="badge badge-success">In Stock</span>
    }
  }

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
            <h1 className="text-4xl font-bold text-primary">Stock On Hand</h1>
            <p className="text-lg text-secondary">Current inventory levels for all items</p>
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
          <div className="card p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Search</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search items..."
                    className="input pl-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
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
                <label className="block text-sm font-medium text-primary mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input"
                >
                  <option value="">All Status</option>
                  <option value="in-stock">In Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                  <option value="low-stock">Low Stock</option>
                  <option value="below-min">Below Minimum</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={clearFilters}
                className="btn btn-secondary btn-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Total Items</p>
                <p className="text-3xl font-bold text-primary">{filteredItems.length}</p>
              </div>
              <Package className="w-10 h-10 text-primary/60" />
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">In Stock</p>
                <p className="text-3xl font-bold text-success">
                  {filteredItems.filter(item => {
                    const onHand = item.stock?.reduce((sum, s) => sum + Number(s.quantity), 0) || 0
                    return onHand > 0
                  }).length}
                </p>
              </div>
              <Package className="w-10 h-10 text-success/60" />
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Out of Stock</p>
                <p className="text-3xl font-bold text-error">
                  {filteredItems.filter(item => {
                    const onHand = item.stock?.reduce((sum, s) => sum + Number(s.quantity), 0) || 0
                    return onHand === 0
                  }).length}
                </p>
              </div>
              <Package className="w-10 h-10 text-error/60" />
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Below Minimum</p>
                <p className="text-3xl font-bold text-warning">
                  {filteredItems.filter(item => {
                    const onHand = item.stock?.reduce((sum, s) => sum + Number(s.quantity), 0) || 0
                    const minStock = Number(item.minStock) || 0
                    return minStock > 0 && onHand < minStock
                  }).length}
                </p>
              </div>
              <Package className="w-10 h-10 text-warning/60" />
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
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Unit Cost</th>
                <th className="px-6 py-5">Total Value</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const onHand = item.stock?.reduce((sum, s) => sum + Number(s.quantity), 0) || 0
                  const minStock = Number(item.minStock) || 0
                  const unitCost = Number(item.standardCost) || 0
                  const totalValue = onHand * unitCost
                  
                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-5">
                        <div className="font-medium text-primary">{item.name}</div>
                      </td>
                      <td className="px-6 py-5">{item.brand?.name || '-'}</td>
                      <td className="px-6 py-5">{item.category?.name || '-'}</td>
                      <td className="px-6 py-5">{item.uom?.name || '-'}</td>
                      <td className="px-6 py-5 font-medium">{onHand}</td>
                      <td className="px-6 py-5">{minStock || '-'}</td>
                      <td className="px-6 py-5">{getStatusBadge(item)}</td>
                      <td className="px-6 py-5">{formatCurrency(unitCost)}</td>
                      <td className="px-6 py-5 font-medium">{formatCurrency(totalValue)}</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-16">
                    <div className="flex flex-col items-center">
                      <Package className="w-16 h-16 text-muted mb-4" />
                      <h3 className="text-lg font-semibold text-muted mb-2">No items found</h3>
                      <p className="text-sm text-muted max-w-sm text-center">
                        Try adjusting your filters or search terms.
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
