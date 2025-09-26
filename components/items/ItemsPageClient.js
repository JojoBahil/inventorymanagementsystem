'use client'

import { useState, useEffect } from 'react'
import { ItemsTable } from './ItemsTable'
import { ItemForm } from '@/components/ui/ItemForm'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export function ItemsPageClient({ 
  initialRows, 
  allBrands, 
  allCategories, 
  searchParams,
  kpis,
  page,
  totalPages,
  total
}) {
  const [rows, setRows] = useState(initialRows)
  const [showAddModal, setShowAddModal] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  console.log('ItemsPageClient render - showAddModal:', showAddModal)

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

  const handleRefresh = () => {
    // Reload the page to get fresh data
    window.location.reload()
  }

  return (
    <div className="w-[93%] mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight mb-1">Items</h1>
          <p className="text-secondary text-lg md:text-xl">Inventory master list</p>
        </div>
        <div className="flex items-center gap-3 whitespace-nowrap">
          {user && hasPermission(user, PERMISSIONS.ITEMS_CREATE) && (
            <button onClick={() => {
              console.log('Add New Item button clicked')
              setShowAddModal(true)
            }} className="btn btn-primary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Item
            </button>
          )}
          <a href={getExportHref()} className="btn btn-secondary">Export CSV</a>
          <a href={getPdfExportHref()} className="btn btn-secondary">Export PDF</a>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-sm text-muted mb-1">Total Items</div>
          <div className="text-lg font-semibold text-primary">{kpis.totalItems}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-muted mb-1">Below Min</div>
          <div className="text-lg font-semibold text-error">{kpis.belowMinCount}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-muted mb-1">Total Value</div>
          <div className="text-lg font-semibold text-primary">{formatCurrency(kpis.totalValue)}</div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters - Compact sidebar */}
        <div className="lg:w-80 flex-shrink-0">
          <form className="card card-compact p-4 space-y-4">
            <h3 className="text-sm font-semibold text-primary mb-3">Filters</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Search</label>
                <input name="q" defaultValue={searchParams.q || ''} className="input text-sm" placeholder="Item Name" />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Brand</label>
                <select name="brand" defaultValue={searchParams.brand || ''} className="input text-sm">
                  <option value="">All brands</option>
                  {allBrands.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Category</label>
                <select name="category" defaultValue={searchParams.category || ''} className="input text-sm">
                  <option value="">All categories</option>
                  {allCategories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="flex items-center gap-3 text-sm select-none cursor-pointer">
                  <input type="checkbox" name="below" value="1" defaultChecked={searchParams.below === '1'} className="peer sr-only" />
                  <span className="inline-block h-5 w-9 rounded-full bg-surface-elevated border border-border transition-colors relative peer-checked:bg-emerald-500/40 peer-checked:border-emerald-500 peer-focus:ring-2 peer-focus:ring-sky-400/40 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4"></span>
                  <span className="text-xs text-secondary transition-colors peer-checked:text-emerald-400">Below min only</span>
                </label>
              </div>
            </div>
            
            <button className="btn btn-primary w-full text-sm">Apply Filters</button>
          </form>
        </div>

        {/* Table - Takes remaining space */}
        <div className="flex-1 min-w-0">
      <ItemsTable 
        items={rows} 
        allBrands={allBrands} 
        allCategories={allCategories}
        onRefresh={handleRefresh}
        user={user}
      />

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted">Page {page} of {totalPages} · Showing {rows.length} of {total} items</div>
            <div className="flex gap-2">
              <a className="btn btn-secondary" aria-disabled={page <= 1} href={page <= 1 ? undefined : getQueryUrl(page - 1)}>Prev</a>
              <a className="btn btn-secondary" aria-disabled={page >= totalPages} href={page >= totalPages ? undefined : getQueryUrl(page + 1)}>Next</a>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Item Modal */}
      <ItemForm 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onSuccess={() => {
          setShowAddModal(false)
          handleRefresh()
        }}
      />
    </div>
  )

  function formatCurrency(value) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0))
  }

  function getExportHref() {
    const sp = new URLSearchParams()
    if (searchParams.q) sp.set('q', searchParams.q)
    if (searchParams.brand) sp.set('brand', searchParams.brand)
    if (searchParams.category) sp.set('category', searchParams.category)
    if (searchParams.below === '1') sp.set('below', '1')
    return `/api/items/export?${sp.toString()}`
  }

  function getPdfExportHref() {
    const sp = new URLSearchParams()
    if (searchParams.q) sp.set('q', searchParams.q)
    if (searchParams.brand) sp.set('brand', searchParams.brand)
    if (searchParams.category) sp.set('category', searchParams.category)
    if (searchParams.below === '1') sp.set('below', '1')
    return `/api/items/export/pdf?${sp.toString()}`
  }

  function getQueryUrl(nextPage) {
    const sp = new URLSearchParams()
    if (searchParams.q) sp.set('q', searchParams.q)
    if (searchParams.brand) sp.set('brand', searchParams.brand)
    if (searchParams.category) sp.set('category', searchParams.category)
    if (searchParams.below === '1') sp.set('below', '1')
    sp.set('page', String(nextPage))
    return `?${sp.toString()}`
  }
}
