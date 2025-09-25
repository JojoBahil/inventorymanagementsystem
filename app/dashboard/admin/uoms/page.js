'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function UomsAdmin() {
  const [items, setItems] = useState([])
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/uoms', { cache: 'no-store' })
    const data = res.ok ? await res.json() : []
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  const add = async (e) => {
    e.preventDefault()
    if (!code.trim() || !name.trim()) return
    const res = await fetch('/api/uoms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, name }) })
    if (res.ok) {
      setCode(''); setName('')
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
        <h1 className="text-2xl font-bold text-primary">Units of Measure</h1>
        <p className="text-secondary">Add cm, ml, pc, tube, etc.</p>
      </div>

      <form onSubmit={add} className="card card-compact space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Code</label>
            <input value={code} onChange={e => setCode(e.target.value)} className="input" placeholder="CM" />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input" placeholder="cm" />
          </div>
        </div>
        <div className="flex justify-end mt-2">
          <button className="btn btn-primary" type="submit">Add UOM</button>
        </div>
      </form>

      <div className="card mt-4">
        {loading ? (
          <div className="text-muted">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-muted">No UOMs yet.</div>
        ) : (
          <ul className="space-y-2">
            {items.map((u) => (
              <li key={u.id} className="grid grid-cols-[1fr_1fr_auto] items-center border-b border-border py-2 gap-2 rounded-lg px-3 hover:bg-surface-elevated/50 transition-colors">
                <span className="text-primary font-medium">{u.code}</span>
                <span className="text-secondary">{u.name}</span>
                <div className="flex justify-end space-x-3">
                  <button className="btn btn-secondary" onClick={async () => {
                    const newCode = prompt('Code', u.code)
                    if (!newCode) return
                    const newName = prompt('Name', u.name)
                    if (!newName) return
                    await fetch('/api/uoms', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: u.id, code: newCode, name: newName }) })
                    load()
                  }}>Edit</button>
                  <button className="btn btn-secondary" onClick={async () => {
                    if (!confirm('Delete this UOM?')) return
                    await fetch('/api/uoms', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: u.id }) })
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


