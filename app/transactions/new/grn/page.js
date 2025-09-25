'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'

function LineRow({ index, line, items, onChange, onRemove }) {
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
        <label className="block text-sm font-medium text-primary mb-1">Qty</label>
        <input className="input" type="number" min="0" step="0.0001" value={line.qty ?? ''} onChange={e => onChange(index, { ...line, qty: e.target.value })} />
      </div>
      <div className="md:col-span-3">
        <label className="block text-sm font-medium text-primary mb-1">Unit Cost (₱)</label>
        <input className="input" type="number" min="0" step="0.01" value={line.unitCost ?? ''} onChange={e => onChange(index, { ...line, unitCost: e.target.value })} />
      </div>
      <div className="md:col-span-1 flex md:justify-end">
        <button className="btn btn-secondary" type="button" onClick={() => onRemove(index)}>Remove</button>
      </div>
    </div>
  )
}

export default function NewGRNPage() {
  const [suppliers, setSuppliers] = useState([])
  const [items, setItems] = useState([])
  const [locations, setLocations] = useState([])
  const [supplierName, setSupplierName] = useState('')
  const [locationId, setLocationId] = useState('')
  const [lines, setLines] = useState([{ itemId: null, qty: '', unitCost: '' }])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    ;(async () => {
      const [supRes, itemRes, locRes] = await Promise.all([
        fetch('/api/suppliers'),
        fetch('/api/items'),
        fetch('/api/locations')
      ])
      setSuppliers(supRes.ok ? await supRes.json() : [])
      setItems(itemRes.ok ? await itemRes.json() : [])
      setLocations(locRes.ok ? await locRes.json() : [])
    })()
  }, [])

  const addLine = () => setLines(prev => [...prev, { itemId: null, qty: '', unitCost: '' }])
  const updateLine = (idx, value) => setLines(prev => prev.map((l, i) => i === idx ? value : l))
  const removeLine = (idx) => setLines(prev => prev.filter((_, i) => i !== idx))

  const submit = async (e) => {
    e.preventDefault()
    if (!locationId || lines.length === 0) return
    setIsSubmitting(true)
    try {
      const payload = {
        supplierName: supplierName || undefined,
        locationId: Number(locationId),
        lines: lines
          .filter(l => l.itemId && Number(l.qty) > 0)
          .map(l => ({ itemId: l.itemId, qty: Number(l.qty), unitCost: Number(l.unitCost || 0) }))
      }
      const res = await fetch('/api/grn', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('Failed to post GRN')
      window.location.href = '/dashboard'
    } catch (err) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={open} onClose={() => (window.history.back(), setOpen(false))} title="New Receipt (GRN)" size="lg">
      <form onSubmit={submit} className="space-y-8">
        <div className="card card-compact space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Supplier</label>
              <input list="supplier-list" className="input" value={supplierName} onChange={e => setSupplierName(e.target.value)} placeholder="Type to search supplier" />
              <datalist id="supplier-list">
                {suppliers.map(s => <option key={s.id} value={s.name} />)}
              </datalist>
            </div>
            {/* Location hidden (auto) */}
          </div>
        </div>

        <div className="card card-compact space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-primary">Lines</h2>
            <button type="button" className="btn btn-primary" onClick={addLine}>Add Line</button>
          </div>

          <div className="space-y-4">
            {lines.map((line, idx) => (
              <LineRow key={idx} index={idx} line={line} items={items} onChange={updateLine} onRemove={removeLine} />
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? 'Posting...' : 'Post Receipt'}
          </button>
        </div>
        <div className="flex justify-end">
          <button type="button" className="btn btn-secondary mr-3" onClick={() => (window.history.back(), setOpen(false))}>Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? 'Posting...' : 'Post Receipt'}
          </button>
        </div>
      </form>
    </Modal>
  )
}


