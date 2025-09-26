'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

function LineRow({ index, line, items, onChange, onRemove }) {
  const selectedItem = items.find(i => i.id === line.itemId)
  const currentStock = selectedItem && selectedItem.stock ? selectedItem.stock.reduce((sum, s) => sum + Number(s.quantity), 0) : 0
  const requestedQty = Number(line.qty) || 0
  const exceedsStock = requestedQty > currentStock && currentStock > 0
  
  // Determine step and precision based on UOM
  const uomName = selectedItem?.uom?.name?.toLowerCase() || ''
  const isDecimalUom = ['ml', 'cm', 'm', 'kg', 'g', 'l', 'liter', 'meter', 'kilogram', 'gram'].includes(uomName)
  const step = isDecimalUom ? '0.0001' : '1'
  const precision = isDecimalUom ? 4 : 0
  
  const formatQuantity = (qty) => {
    return isDecimalUom ? qty.toFixed(precision) : Math.round(qty).toString()
  }
  
  const handleItemChange = (e) => {
    onChange(index, { ...line, itemId: Number(e.target.value) || null, qty: '' })
  }
  
  const handleQtyChange = (e) => {
    onChange(index, { ...line, qty: e.target.value })
  }
  
  const handleRemove = () => {
    onRemove(index)
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
      <div className="md:col-span-5">
        <label className="block text-sm font-medium text-primary mb-1">Item</label>
        <select className="input" value={line.itemId || ''} onChange={handleItemChange}>
          <option value="">Select item</option>
          {items.map(i => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>
      </div>
      <div className="md:col-span-4">
        <label className="block text-sm font-medium text-primary mb-1">
          Qty to Issue
          {selectedItem && (
            <span className="text-xs text-muted font-normal ml-2">
              (Available: {formatQuantity(currentStock)} {selectedItem.uom?.name || ''})
            </span>
          )}
        </label>
        <input 
          className={`input ${exceedsStock ? 'border-error focus:border-error focus:ring-error/20' : ''}`} 
          type="number" 
          min="0" 
          max={currentStock}
          step={step}
          value={line.qty ?? ''} 
          onChange={handleQtyChange} 
        />
        {exceedsStock && (
          <p className="text-xs text-error mt-1">
            Exceeds available stock by {formatQuantity(requestedQty - currentStock)}
          </p>
        )}
      </div>
      <div className="md:col-span-3 flex md:justify-end">
        <button className="btn btn-error btn-sm" type="button" onClick={handleRemove}>
          Remove
        </button>
      </div>
    </div>
  )
}

export default function NewIssuePage() {
  const [items, setItems] = useState([])
  const [locations, setLocations] = useState([])
  const [customers, setCustomers] = useState([])
  const [locationId, setLocationId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [lines, setLines] = useState([{ id: Date.now(), itemId: null, qty: '' }])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(true)
  const toast = useToast()

  // Check if any line has validation errors
  const hasValidationErrors = lines.some(line => {
    if (!line.itemId || !line.qty) return false
    const item = items.find(i => i.id === line.itemId)
    if (!item || !item.stock) return false
    const currentStock = item.stock.reduce((sum, s) => sum + Number(s.quantity), 0)
    const requestedQty = Number(line.qty)
    return requestedQty > currentStock && currentStock > 0
  })

  useEffect(() => {
    ;(async () => {
      const [itemRes, locRes, custRes] = await Promise.all([
        fetch('/api/items?includeStock=true'),
        fetch('/api/locations'),
        fetch('/api/customers')
      ])
      const itemsData = itemRes.ok ? await itemRes.json() : { items: [] }
      setItems(itemsData.items || [])
      const locs = locRes.ok ? await locRes.json() : []
      setLocations(locs)
      if (locs.length === 1) {
        setLocationId(String(locs[0].id))
      }
      setCustomers(custRes.ok ? await custRes.json() : [])
    })()
  }, [])

  const addLine = useCallback(() => setLines(prev => [...prev, { id: Date.now(), itemId: null, qty: '' }]), [])
  const updateLine = useCallback((idx, value) => setLines(prev => prev.map((l, i) => i === idx ? value : l)), [])
  const removeLine = useCallback((idx) => setLines(prev => prev.filter((_, i) => i !== idx)), [])
  const handleClose = useCallback(() => {
    window.history.back()
    setOpen(false)
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!locationId || lines.length === 0) return
    
    // Validate quantities don't exceed available stock
    const validLines = lines.filter(l => l.itemId && Number(l.qty) > 0)
    for (const line of validLines) {
      const item = items.find(i => i.id === line.itemId)
      if (item && item.stock) {
        const currentStock = item.stock.reduce((sum, s) => sum + Number(s.quantity), 0)
        const requestedQty = Number(line.qty)
        if (requestedQty > currentStock) {
          // Format quantities based on UOM
          const uomName = item.uom?.name?.toLowerCase() || ''
          const isDecimalUom = ['ml', 'cm', 'm', 'kg', 'g', 'l', 'liter', 'meter', 'kilogram', 'gram'].includes(uomName)
          const formatQty = (qty) => isDecimalUom ? qty.toFixed(4) : Math.round(qty).toString()
          
          toast.error(`Cannot issue ${formatQty(requestedQty)} of ${item.name}. Only ${formatQty(currentStock)} available.`)
          return
        }
      }
    }
    
    setIsSubmitting(true)
    try {
      const payload = {
        locationId: Number(locationId),
        customerName: customerName || undefined,
        lines: validLines.map(l => ({ itemId: l.itemId, qty: Number(l.qty) }))
      }
      const res = await fetch('/api/issue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to post Issue')
      toast.success('Items issued successfully!')
      window.location.href = '/dashboard'
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={open} onClose={handleClose} title="New Issue" size="lg">
      <form onSubmit={submit} className="space-y-8">
        <div className="card card-compact p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {locations.length <= 1 ? (
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Location</label>
                <div className="input">
                  {locations[0] ? `${locations[0].warehouse?.code || ''} ${locations[0].name}` : 'No location'}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Location</label>
                <select className="input" value={locationId} onChange={e => setLocationId(e.target.value)}>
                  <option value="">Select location</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.warehouse?.code || ''} {l.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Issue To (Branch or leave blank for In-house)</label>
              <input list="customer-list" className="input" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Type to search branch (optional)" />
              <datalist id="customer-list">
                {customers.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
              <p className="text-xs text-muted mt-1">If left blank, treated as in-house (no payment).</p>
            </div>
          </div>
        </div>

        <div className="card card-compact p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-primary">Lines</h2>
            <button type="button" className="btn btn-primary" onClick={addLine}>Add Line</button>
          </div>

          <div className="space-y-4">
            {lines.map((line, idx) => (
              <LineRow key={line.id} index={idx} line={line} items={items} onChange={updateLine} onRemove={removeLine} />
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="button" className="btn btn-secondary mr-3" onClick={handleClose}>Cancel</button>
          <button type="submit" disabled={isSubmitting || hasValidationErrors} className="btn btn-primary">
            {isSubmitting ? 'Posting...' : 'Post Issue'}
          </button>
        </div>
        {hasValidationErrors && (
          <div className="bg-error/10 border border-error/20 rounded-lg p-4">
            <p className="text-sm text-error">
              <strong>Cannot submit:</strong> Some quantities exceed available stock. Please adjust the quantities or remove invalid lines.
            </p>
          </div>
        )}
      </form>
    </Modal>
  )
}


