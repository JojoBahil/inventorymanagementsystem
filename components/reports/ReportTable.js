'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Search, Filter, FileText, FileSpreadsheet } from 'lucide-react'
import { DataTable } from '@/components/ui/DataTable'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import Link from 'next/link'

export function ReportTable({ 
  title, 
  description, 
  apiEndpoint, 
  columns, 
  filterOptions = [], 
  defaultFilters = {},
  exportFunctions = {},
  backHref = '/reports',
  emptyMessage = 'No data found'
}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [filters, setFilters] = useState(defaultFilters)
  const [showFilters, setShowFilters] = useState(false)

  const fetchData = async (page = 1) => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      })
      
      // Add all active filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value)
        }
      })
      
      const url = `${apiEndpoint}?${params.toString()}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`)
      }
      const result = await response.json()
      
      setData(result.data || [])
      setPagination(prev => ({
        ...prev,
        ...result.pagination
      }))
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handlePageChange = (newPage) => {
    fetchData(newPage)
  }

  const handleFilterChange = (key, value) => {
    const newFilters = {
      ...filters,
      [key]: value
    }
    setFilters(newFilters)
    
    // Build query parameters with new filters
    const params = new URLSearchParams({
      page: '1',
      limit: pagination.limit.toString()
    })
    
    // Add all active filters
    Object.entries(newFilters).forEach(([filterKey, filterValue]) => {
      if (filterValue && filterValue !== '') {
        params.append(filterKey, filterValue)
      }
    })
    
    // Refetch data with new filters
    const url = `${apiEndpoint}?${params.toString()}`
    fetch(url)
      .then(response => response.json())
      .then(result => {
        setData(result.data || [])
        setPagination(prev => ({
          ...prev,
          ...result.pagination
        }))
      })
      .catch(error => {
        console.error('Error fetching filtered data:', error)
      })
  }

  const clearFilters = () => {
    setFilters(defaultFilters)
    fetchData(1)
  }

  const hasActiveFilters = Object.values(filters).some(value => value && value !== '')

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2">
            <Link 
              href={backHref} 
              className="btn btn-secondary inline-flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Reports
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-primary">{title}</h1>
          <p className="text-lg text-secondary">{description}</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          
          {exportFunctions.csv && (
            <button
              onClick={exportFunctions.csv}
              className="btn btn-secondary"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              CSV
            </button>
          )}
          
          {exportFunctions.pdf && (
            <button
              onClick={exportFunctions.pdf}
              className="btn btn-secondary"
            >
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-surface-elevated rounded-lg border border-border p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterOptions.map((filter) => (
              <div key={filter.key}>
                <label className="block text-sm font-medium text-primary mb-2">
                  {filter.label}
                </label>
                {filter.type === 'select' ? (
                  <SearchableSelect
                    options={[
                      { value: '', label: `All ${filter.label}` },
                      ...(filter.options || [])
                    ]}
                    value={filters[filter.key] || ''}
                    onChange={(value) => handleFilterChange(filter.key, value)}
                    placeholder={`All ${filter.label}`}
                  />
                ) : filter.type === 'searchable-select' ? (
                  <SearchableSelect
                    options={[
                      { value: '', label: `All ${filter.label}` },
                      ...(filter.options || [])
                    ]}
                    value={filters[filter.key] || ''}
                    onChange={(value) => handleFilterChange(filter.key, value)}
                    placeholder={`All ${filter.label}`}
                  />
                ) : filter.type === 'date' ? (
                  <input
                    type="date"
                    value={filters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="input"
                  />
                ) : (
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      value={filters[filter.key] || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      placeholder={filter.placeholder || `Search ${filter.label.toLowerCase()}...`}
                      className="input pl-10"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {hasActiveFilters && (
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-muted">
                <span>Active filters: </span>
                {Object.entries(filters).map(([key, value]) => {
                  if (!value || value === '') return null
                  const filter = filterOptions.find(f => f.key === key)
                  const displayValue = filter?.options?.find(o => o.value === value)?.label || value
                  return (
                    <span key={key} className="inline-block bg-primary/10 text-primary px-2 py-1 rounded mr-2">
                      {filter?.label}: {displayValue}
                    </span>
                  )
                })}
              </div>
              <button
                onClick={clearFilters}
                className="btn btn-secondary btn-sm"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Data Table */}
      <div className="bg-surface-elevated rounded-lg border border-border overflow-hidden">
        <DataTable
          data={data}
          columns={columns}
          isLoading={loading}
          emptyMessage={emptyMessage}
        />
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-surface-elevated rounded-lg border border-border p-4">
          <div className="text-sm text-muted">
            Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
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
