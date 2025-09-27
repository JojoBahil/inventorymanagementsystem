'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { ChevronDown, Search, X } from 'lucide-react'

function SearchableSelect({ options, value, onChange, placeholder, className = "" }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredOptions, setFilteredOptions] = useState(options)
  const [dropdownStyle, setDropdownStyle] = useState({})
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  // Filter options based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = options.filter(option =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredOptions(filtered)
    } else {
      setFilteredOptions(options)
    }
  }, [searchTerm, options])

  // Calculate dropdown position when opened
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const dropdownHeight = 240 // max-h-60 = 240px
      
      let top = rect.bottom + 4 // Default: below the input
      let maxHeight = 240
      
      // If dropdown would exceed bottom of viewport, position it above
      if (rect.bottom + dropdownHeight > viewportHeight) {
        top = rect.top - dropdownHeight - 4
        // If it would also exceed top, limit the height
        if (top < 0) {
          top = 8
          maxHeight = viewportHeight - 16
        }
      }
      
      setDropdownStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 9999,
        maxHeight: `${maxHeight}px`
      })
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside both the input and the dropdown
      const isClickOnInput = dropdownRef.current && dropdownRef.current.contains(event.target)
      const isClickOnDropdown = event.target.closest('[data-dropdown-portal]')
      
      if (!isClickOnInput && !isClickOnDropdown) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (option) => {
    onChange(option.value)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = () => {
    onChange('')
    setSearchTerm('')
  }

  const selectedOption = options.find(opt => opt.value === value)

  const dropdownContent = isOpen && (
    <div 
      data-dropdown-portal
      className="bg-surface border border-border rounded-lg shadow-lg overflow-hidden"
      style={dropdownStyle}
    >
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-4 h-4" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: `${parseInt(dropdownStyle.maxHeight) - 60}px` }}>
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => (
            <div
              key={option.value}
              className="px-4 py-2 hover:bg-surface-elevated cursor-pointer text-foreground"
              onClick={(e) => {
                e.stopPropagation()
                handleSelect(option)
              }}
            >
              {option.name}
            </div>
          ))
        ) : (
          <div className="px-4 py-2 text-muted text-center">
            No options found
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className="input cursor-pointer flex items-center justify-between"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 0)
          }
        }}
      >
        <span className={selectedOption ? 'text-foreground' : 'text-muted'}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <div className="flex items-center space-x-2">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleClear()
              }}
              className="text-muted hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {typeof window !== 'undefined' && createPortal(dropdownContent, document.body)}
    </div>
  )
}

function LineRow({ index, line, items, onChange, onRemove }) {
  const selectedItem = items.find(i => i.id === line.itemId)
  
  // Determine step based on UOM
  const uomCode = selectedItem?.uom?.code?.toLowerCase() || ''
  const isDecimalUom = ['ml', 'cm', 'm', 'kg', 'g', 'l', 'liter', 'meter', 'kilogram', 'gram'].includes(uomCode)
  const step = isDecimalUom ? '0.0001' : '1'
  
  const handleItemChange = (itemId) => {
    onChange(index, { ...line, itemId: Number(itemId) || null })
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
      <div className="md:col-span-5">
        <label className="block text-sm font-medium text-primary mb-1">Item</label>
        <SearchableSelect
          options={items.map(i => ({ 
            value: i.id.toString(), 
            name: i.name
          }))}
          value={line.itemId ? line.itemId.toString() : ''}
          onChange={handleItemChange}
          placeholder="Select item"
        />
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


