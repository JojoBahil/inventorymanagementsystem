'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

function LineRow({ index, line, items, onChange, onRemove }) {
  const selectedItem = items.find(i => i.id === line.itemId)
  
  // Determine step based on UOM
  const uomCode = selectedItem?.uom?.code?.toLowerCase() || ''
  const isDecimalUom = ['ml', 'cm', 'm', 'kg', 'g', 'l', 'liter', 'meter', 'kilogram', 'gram'].includes(uomCode)
  const step = isDecimalUom ? '0.0001' : '1'
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
      <div className="md:col-span-5">
        <label className="block text-sm font-medium text-primary mb-1">Item</label>
        <select className="input" value={line.itemId || ''} onChange={e => onChange(index, { ...line, itemId: Number(e.target.value) || null })}>
          <option value="">Select item</option>
          {items.map(i => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>
      </div>
      <div className="md:col-span-3">
        <label className="block text-sm font-medium text-primary mb-1">
          Qty to Receive
          {selectedItem && (
            <span className="text-xs text-muted font-normal ml-2">
              ({selectedItem.uom?.code || ''})
            </span>
          )}
        </label>
        <input className="input" type="number" min="0" step={step} value={line.qty ?? ''} onChange={e => onChange(index, { ...line, qty: e.target.value })} />
      </div>
      <div className="md:col-span-3">
        <label className="block text-sm font-medium text-primary mb-1">Unit Cost (₱)</label>
        <input className="input" type="number" min="0" step="0.01" value={line.unitCost ?? ''} onChange={e => onChange(index, { ...line, unitCost: e.target.value })} />
      </div>
      <div className="md:col-span-1 flex md:justify-end">
        <button className="btn btn-error btn-sm" type="button" onClick={() => onRemove(index)}>
          Remove
        </button>
      </div>
    </div>
  )
}

export default function NewGRNPage() {
  const [items, setItems] = useState([])
  const [locations, setLocations] = useState([])
  const [locationId, setLocationId] = useState('')
  const [lines, setLines] = useState([{ id: Date.now(), itemId: null, qty: '', unitCost: '' }])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(true)
  const toast = useToast()

  useEffect(() => {
    ;(async () => {
      const [itemRes, locRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/locations')
      ])
      const itemsData = itemRes.ok ? await itemRes.json() : { items: [] }
      setItems(itemsData.items || [])
      const locs = locRes.ok ? await locRes.json() : []
      setLocations(locs)
      if (locs.length === 1) {
        setLocationId(String(locs[0].id))
      }
    })()
  }, [])

  const addLine = useCallback(() => setLines(prev => [...prev, { id: Date.now(), itemId: null, qty: '', unitCost: '' }]), [])
  const updateLine = useCallback((idx, value) => setLines(prev => prev.map((l, i) => i === idx ? value : l)), [])
  const removeLine = useCallback((idx) => setLines(prev => prev.filter((_, i) => i !== idx)), [])
  const handleClose = useCallback(() => {
    window.history.back()
    setOpen(false)
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (lines.length === 0) {
      toast.error('Add at least one item to receive')
      return
    }
    setIsSubmitting(true)
    try {
      const payload = {
        locationId: locationId ? Number(locationId) : undefined,
        lines: lines
          .filter(l => l.itemId && Number(l.qty) > 0)
          .map(l => ({ itemId: l.itemId, qty: Number(l.qty), unitCost: Number(l.unitCost || 0) }))
      }
      const res = await fetch('/api/grn', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to post GRN')
      toast.success('Stock received successfully!')
      window.location.href = '/dashboard'
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={open} onClose={handleClose} title="Receive Stock" size="lg">
      <form onSubmit={submit} className="space-y-8">
        {/* Header info (location auto-selected) */}

        <div className="card card-compact p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-primary">Items to Receive</h2>
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
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? 'Posting...' : 'Receive Stock'}
          </button>
        </div>
      </form>
    </Modal>
  )
}


