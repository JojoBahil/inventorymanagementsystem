'use client'
import { useState } from 'react'
import { Search } from 'lucide-react'

export function ItemSelect({ value, onChange, error }) {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  async function searchItems(search) {
    setLoading(true)
    try {
      const res = await fetch(`/api/items/search?q=${encodeURIComponent(search)}`)
      const data = await res.json()
      setItems(data)
    } catch (err) {
      console.error('Failed to search items:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          className={clsx(
            'input pl-10',
            error && 'border-[--color-danger] focus:ring-[--color-danger]'
          )}
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            searchItems(e.target.value)
          }}
          placeholder="Search items..."
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-silver]" />
      </div>
      
      {(loading || items.length > 0) && (
        <ul className="absolute z-10 w-full mt-1 card max-h-64 overflow-y-auto">
          {loading ? (
            <li className="px-3 py-2 text-[--color-silver]">Loading...</li>
          ) : (
            items.map(item => (
              <li key={item.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-[--color-muted]"
                  onClick={() => {
                    onChange(item)
                    setQuery(item.name)
                    setItems([])
                  }}
                >
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-[--color-silver]">{item.sku}</div>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
      
      {error && (
        <div className="mt-1 text-sm text-[--color-danger]">{error}</div>
      )}
    </div>
  )
}
