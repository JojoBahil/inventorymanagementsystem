'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function SuppliersAdmin() {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/suppliers', { cache: 'no-store' })
    const data = res.ok ? await res.json() : []
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  const add = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    const res = await fetch('/api/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
    if (res.ok) {
      setName('')
      load()
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="w-[93%] mx-auto space-y-8">
      <div>
        <Link href="/dashboard/admin" className="btn btn-secondary inline-flex items-center">
          <ChevronLeft className="w-4 h-4 mr-2" /> Back to Admin
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-primary">Suppliers</h1>
        <p className="text-secondary">Add or edit supplier companies.</p>
      </div>

      <form onSubmit={add} className="card card-compact space-y-4">
        <div>
          <label className="block text-sm font-medium text-primary mb-2">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="input" placeholder="Supplier name" />
        </div>
        <div className="flex justify-end mt-2">
          <button className="btn btn-primary" type="submit">Add Supplier</button>
        </div>
      </form>

      <div className="card mt-4">
        {loading ? (
          <div className="text-muted">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-muted">No suppliers yet.</div>
        ) : (
          <ul className="space-y-2">
            {items.map((s) => (
              <li key={s.id} className="grid grid-cols-[1fr_auto] items-center border-b border-border py-2 gap-2 rounded-lg px-3 hover:bg-surface-elevated/50 transition-colors">
                <span>{s.name}</span>
                <div className="flex justify-end space-x-3">
                  <button className="btn btn-secondary" onClick={async () => {
                    const newName = prompt('Rename supplier', s.name)
                    if (!newName) return
                    await fetch('/api/suppliers', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id, name: newName }) })
                    load()
                  }}>Edit</button>
                  <button className="btn btn-secondary" onClick={async () => {
                    if (!confirm('Delete this supplier?')) return
                    await fetch('/api/suppliers', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id }) })
                    load()
                  }}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}


