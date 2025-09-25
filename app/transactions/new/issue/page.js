'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'

function LineRow({ index, line, items, onChange, onRemove }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
      <div className="md:col-span-6">
        <label className="block text-sm font-medium text-primary mb-1">Item</label>
        <select className="input" value={line.itemId || ''} onChange={e => onChange(index, { ...line, itemId: Number(e.target.value) || null })}>
          <option value="">Select item</option>
          {items.map(i => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>
      </div>
      <div className="md:col-span-5">
        <label className="block text-sm font-medium text-primary mb-1">Qty</label>
        <input className="input" type="number" min="0" step="0.0001" value={line.qty ?? ''} onChange={e => onChange(index, { ...line, qty: e.target.value })} />
      </div>
      <div className="md:col-span-1 flex md:justify-end">
        <button className="btn btn-secondary" type="button" onClick={() => onRemove(index)}>Remove</button>
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
  const [lines, setLines] = useState([{ itemId: null, qty: '' }])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    ;(async () => {
      const [itemRes, locRes, custRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/locations'),
        fetch('/api/customers')
      ])
      setItems(itemRes.ok ? await itemRes.json() : [])
      const locs = locRes.ok ? await locRes.json() : []
      setLocations(locs)
      if (locs.length === 1) {
        setLocationId(String(locs[0].id))
      }
      setCustomers(custRes.ok ? await custRes.json() : [])
    })()
  }, [])

  const addLine = () => setLines(prev => [...prev, { itemId: null, qty: '' }])
  const updateLine = (idx, value) => setLines(prev => prev.map((l, i) => i === idx ? value : l))
  const removeLine = (idx) => setLines(prev => prev.filter((_, i) => i !== idx))

  const submit = async (e) => {
    e.preventDefault()
    if (!locationId || lines.length === 0) return
    setIsSubmitting(true)
    try {
      const payload = {
        locationId: Number(locationId),
        customerName: customerName || undefined,
        lines: lines
          .filter(l => l.itemId && Number(l.qty) > 0)
          .map(l => ({ itemId: l.itemId, qty: Number(l.qty) }))
      }
      const res = await fetch('/api/issue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to post Issue')
      window.location.href = '/dashboard'
    } catch (err) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={open} onClose={() => (window.history.back(), setOpen(false))} title="New Issue" size="lg">
      <form onSubmit={submit} className="space-y-8">
        <div className="card card-compact space-y-4">
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
          <button type="button" className="btn btn-secondary mr-3" onClick={() => (window.history.back(), setOpen(false))}>Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? 'Posting...' : 'Post Issue'}
          </button>
        </div>
      </form>
    </Modal>
  )
}


