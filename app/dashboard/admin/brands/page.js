'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function BrandsAdmin() {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/brands', { cache: 'no-store' })
    const data = res.ok ? await res.json() : []
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  const add = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    const res = await fetch('/api/brands', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
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
        <h1 className="text-2xl font-bold text-primary">Brands</h1>
        <p className="text-secondary">Add or edit brands.</p>
      </div>

      <form onSubmit={add} className="card card-compact space-y-4">
        <div>
          <label className="block text-sm font-medium text-primary mb-2">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="input" placeholder="Brand name" />
        </div>
        <div className="flex justify-end mt-2">
          <button className="btn btn-primary" type="submit">Add Brand</button>
        </div>
      </form>

      <div className="card mt-4">
        {loading ? (
          <div className="text-muted">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-muted">No brands yet.</div>
        ) : (
          <ul className="space-y-2">
            {items.map((b) => (
              <li key={b.id} className="flex items-center justify-between border-b border-border py-2 rounded-lg px-3 hover:bg-surface-elevated/50 transition-colors">
                <span>{b.name}</span>
                <div className="space-x-3">
                  <button className="btn btn-secondary" onClick={async () => {
                    const newName = prompt('Rename brand', b.name)
                    if (!newName) return
                    await fetch('/api/brands', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: b.id, name: newName }) })
                    load()
                  }}>Edit</button>
                  <button className="btn btn-secondary" onClick={async () => {
                    if (!confirm('Delete this brand?')) return
                    await fetch('/api/brands', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: b.id }) })
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


