'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Download, Filter, Calendar, FileText, FileSpreadsheet, ChevronLeft } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import Link from 'next/link'

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
  const [movements, setMovements] = useState([])
  const [filteredMovements, setFilteredMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [itemFilter, setItemFilter] = useState('')
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
        const response = await fetch('/api/movements?limit=1000')
        
        if (!response.ok) {
          throw new Error('Failed to fetch movements data')
        }

        const data = await response.json()
        setMovements(data.movements || [])
      } catch (error) {
        console.error('Error fetching movements:', error)
        toast.error('Failed to load movements data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Apply filters
  useEffect(() => {
    let filtered = movements

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(movement => 
        new Date(movement.timestamp) >= new Date(dateFrom)
      )
    }
    if (dateTo) {
      filtered = filtered.filter(movement => 
        new Date(movement.timestamp) <= new Date(dateTo + 'T23:59:59')
      )
    }

    // Type filter
    if (typeFilter) {
      filtered = filtered.filter(movement => movement.type === typeFilter)
    }

    // Item filter
    if (itemFilter) {
      filtered = filtered.filter(movement => 
        movement.itemName.toLowerCase().includes(itemFilter.toLowerCase())
      )
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    setFilteredMovements(filtered)
  }, [movements, dateFrom, dateTo, typeFilter, itemFilter])

  const exportToCSV = () => {
    const headers = ['Date/Time', 'Item', 'Type', 'Qty In', 'Qty Out', 'Destination', 'Unit Cost', 'Total Value']
    const csvContent = [
      headers.join(','),
      ...filteredMovements.map(movement => [
        movement.timestamp,
        `"${movement.itemName}"`,
        movement.type,
        movement.qtyIn || 0,
        movement.qtyOut || 0,
        movement.destination || '',
        movement.unitCost || 0,
        (movement.qtyIn || movement.qtyOut || 0) * (movement.unitCost || 0)
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

  const exportToPDF = () => {
    toast.info('PDF export feature coming soon!')
  }

  const clearFilters = () => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    setDateTo(today.toISOString().split('T')[0])
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0])
    setTypeFilter('')
    setItemFilter('')
  }

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

  const getSummaryStats = () => {
    const totalIn = filteredMovements.reduce((sum, m) => sum + (m.qtyIn || 0), 0)
    const totalOut = filteredMovements.reduce((sum, m) => sum + (m.qtyOut || 0), 0)
    const totalValueIn = filteredMovements.reduce((sum, m) => sum + ((m.qtyIn || 0) * (m.unitCost || 0)), 0)
    const totalValueOut = filteredMovements.reduce((sum, m) => sum + ((m.qtyOut || 0) * (m.unitCost || 0)), 0)
    
    return { totalIn, totalOut, totalValueIn, totalValueOut }
  }

  const stats = getSummaryStats()

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
            <h1 className="text-4xl font-bold text-primary">Stock Movements</h1>
            <p className="text-lg text-secondary">Incoming and outgoing inventory transactions</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="input"
                >
                  <option value="">All Types</option>
                  <option value="GRN">Received</option>
                  <option value="ISSUE">Issued</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Item</label>
                <input
                  type="text"
                  value={itemFilter}
                  onChange={(e) => setItemFilter(e.target.value)}
                  placeholder="Search items..."
                  className="input"
                />
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

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Total Received</p>
                <p className="text-3xl font-bold text-success">{filteredMovements.filter(m => m.qtyIn > 0).length}</p>
                <p className="text-sm text-muted">{formatCurrency(stats.totalValueIn)}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-success/60" />
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Total Issued</p>
                <p className="text-3xl font-bold text-error">{filteredMovements.filter(m => m.qtyOut > 0).length}</p>
                <p className="text-sm text-muted">{formatCurrency(stats.totalValueOut)}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-error/60" />
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Net Value</p>
                <p className="text-3xl font-bold text-primary">{formatCurrency(stats.totalValueIn - stats.totalValueOut)}</p>
                <p className="text-sm text-muted">Inventory change</p>
              </div>
              <TrendingUp className="w-10 h-10 text-primary/60" />
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Total Transactions</p>
                <p className="text-3xl font-bold text-info">{filteredMovements.length}</p>
                <p className="text-sm text-muted">All movements</p>
              </div>
              <Calendar className="w-10 h-10 text-info/60" />
            </div>
          </div>
        </div>

        {/* Movements Table */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="px-6 py-5">Date/Time</th>
                <th className="px-6 py-5">Item</th>
                <th className="px-6 py-5">Type</th>
                <th className="px-6 py-5">Qty In</th>
                <th className="px-6 py-5">Qty Out</th>
                <th className="px-6 py-5">Destination</th>
                <th className="px-6 py-5">Unit Cost</th>
                <th className="px-6 py-5">Total Value</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.length > 0 ? (
                filteredMovements.map((movement, index) => {
                  const qty = movement.qtyIn || movement.qtyOut || 0
                  const totalValue = qty * (movement.unitCost || 0)
                  
                  return (
                    <tr key={index}>
                      <td className="px-6 py-5 text-sm">{formatDate(movement.timestamp)}</td>
                      <td className="px-6 py-5 font-medium">{movement.itemName}</td>
                      <td className="px-6 py-5">{getTypeBadge(movement.type)}</td>
                      <td className="px-6 py-5 text-success font-medium">{movement.qtyIn || '-'}</td>
                      <td className="px-6 py-5 text-error font-medium">{movement.qtyOut || '-'}</td>
                      <td className="px-6 py-5">{movement.destination || '-'}</td>
                      <td className="px-6 py-5">{formatCurrency(movement.unitCost || 0)}</td>
                      <td className="px-6 py-5 font-medium">{formatCurrency(totalValue)}</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center">
                      <TrendingUp className="w-16 h-16 text-muted mb-4" />
                      <h3 className="text-lg font-semibold text-muted mb-2">No movements found</h3>
                      <p className="text-sm text-muted max-w-sm text-center">
                        Try adjusting your date range or filters.
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
