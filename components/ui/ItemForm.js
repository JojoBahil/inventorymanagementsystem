'use client'

import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { createPortal } from 'react-dom'
import { Plus, Package, AlertTriangle, ChevronDown, Search, X } from 'lucide-react'
import { Modal } from './Modal'
import { useToast } from './Toast'
import clsx from 'clsx'

// Categories will be fetched from the backend
const emptyArr = []
const units = ['Pieces', 'Kg', 'Liters', 'Meters', 'Boxes', 'Rolls']

function SearchableSelect({ options, value, onChange, placeholder, className = "", allowCreate = false, onCreateNew }) {
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

  const handleCreateNew = () => {
    if (allowCreate && searchTerm.trim() && onCreateNew) {
      onCreateNew(searchTerm.trim())
      setIsOpen(false)
      setSearchTerm('')
    }
  }

  const handleClear = () => {
    onChange('')
    setSearchTerm('')
  }

  const selectedOption = options.find(opt => opt.value === value)
  const showCreateOption = allowCreate && searchTerm.trim() && !filteredOptions.some(opt => opt.name.toLowerCase() === searchTerm.toLowerCase())

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
        {showCreateOption && (
          <div
            className="px-4 py-2 hover:bg-primary/10 cursor-pointer text-primary border-t border-border"
            onClick={(e) => {
              e.stopPropagation()
              handleCreateNew()
            }}
          >
            <div className="flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Create "{searchTerm}"
            </div>
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

export function ItemForm({ isOpen, onClose, onSuccess, editItem }) {
  const { register, handleSubmit, formState: { errors }, reset, setValue, getValues } = useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState(emptyArr)
  const [uoms, setUoms] = useState(emptyArr)
  const [brands, setBrands] = useState(emptyArr)
  const [brandInput, setBrandInput] = useState('')
  const [suppliers, setSuppliers] = useState(emptyArr)
  const toast = useToast()
  const [supplierInput, setSupplierInput] = useState('')

  const onSubmit = async (data) => {
    console.log('onSubmit called with data:', data)
    console.log('brandInput value:', brandInput)
    
    // Validate brand field
    if (!brandInput.trim()) {
      console.log('Brand validation failed - brandInput is empty')
      toast.error('Brand is required')
      return
    }
    
    // Ensure brand is included from the brandInput state
    const formData = {
      ...data,
      brand: brandInput
    }
    
    console.log('Form submitted with data:', formData)
    console.log('About to make API request...')
    setIsSubmitting(true)
    try {
      const url = editItem ? `/api/items/${editItem.id}` : '/api/items'
      const method = editItem ? 'PUT' : 'POST'
      
      console.log('Making request to:', url, 'with method:', method)
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${editItem ? 'update' : 'create'} item`)
      }

      const item = await response.json()
      onSuccess?.(item)
      reset()
      toast.success(editItem ? 'Item updated successfully!' : 'Item created successfully!')
      onClose()
    } catch (error) {
      console.error(`Error ${editItem ? 'updating' : 'creating'} item:`, error)
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    ;(async () => {
      try {
        const [catRes, uomRes, brandRes, supplierRes] = await Promise.all([
          fetch('/api/categories', { cache: 'no-store' }),
          fetch('/api/uoms', { cache: 'no-store' }),
          fetch('/api/brands', { cache: 'no-store' }),
          fetch('/api/suppliers', { cache: 'no-store' })
        ])

        if (catRes.ok) {
          const cats = await catRes.json()
          setCategories(Array.isArray(cats) ? cats : [])
        }

        if (brandRes.ok) {
          const brandData = await brandRes.json()
          console.log('Fetched brands:', brandData)
          setBrands(Array.isArray(brandData) ? brandData : [])
        } else {
          console.log('Brand API failed:', brandRes.status, brandRes.statusText)
        }

        if (supplierRes.ok) {
          const supData = await supplierRes.json()
          setSuppliers(Array.isArray(supData) ? supData : [])
        }

        if (uomRes.ok) {
          const uomsData = await uomRes.json()
          setUoms(Array.isArray(uomsData) ? uomsData : [])
        }
      } catch (e) {
        // fallback already set
      }
    })()
  }, [isOpen])

  // Populate form when editing
  useEffect(() => {
    if (editItem && isOpen) {
      setValue('name', editItem.name)
      setValue('category', editItem.category)
      setValue('unit', editItem.uom)
      setValue('minStock', editItem.min)
      setValue('brand', editItem.brand)
      setBrandInput(editItem.brand)
      setSupplierInput('') // Supplier not available in current data
    } else if (!editItem && isOpen) {
      // Reset form for new item
      reset()
      setBrandInput('')
      setSupplierInput('')
    }
  }, [editItem, isOpen, setValue, reset])

  // Sync brandInput with form
  useEffect(() => {
    setValue('brand', brandInput)
  }, [brandInput, setValue])

  console.log('ItemForm render - isOpen:', isOpen, 'editItem:', editItem)
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editItem ? "Edit Item" : "Add New Item"} size="lg">
      <form onSubmit={(e) => {
        console.log('Form submit event triggered')
        console.log('Form errors:', errors)
        console.log('Form values:', getValues())
        handleSubmit(onSubmit)(e)
      }} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 pb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-primary">Basic Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-primary">
                Item Name *
              </label>
              <input
                type="text"
                {...register('name', { required: 'Item name is required' })}
                className={clsx('input', errors.name && 'border-error focus:border-error')}
                placeholder="Enter item name"
                autoComplete="off"
              />
              {errors.name && (
                <p className="text-sm text-error flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-primary">
                Category *
              </label>
              <SearchableSelect
                options={categories.map(cat => ({ 
                  value: cat.name, 
                  name: cat.name 
                }))}
                value={getValues('category') || ''}
                onChange={(value) => setValue('category', value)}
                placeholder="Select category"
                className={errors.category ? 'border-error focus:border-error' : ''}
              />
              {errors.category && (
                <p className="text-sm text-error flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {errors.category.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-primary">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="input resize-none"
              placeholder="Enter item description (optional)"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-primary">
              Unit of Measure *
            </label>
            <SearchableSelect
              options={uoms.map(u => ({ 
                value: u.code, 
                name: `${u.code} - ${u.name}` 
              }))}
              value={getValues('unit') || ''}
              onChange={(value) => setValue('unit', value)}
              placeholder="Select unit"
              className={errors.unit ? 'border-error focus:border-error' : ''}
            />
            {errors.unit && (
              <p className="text-sm text-error flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                {errors.unit.message}
              </p>
            )}
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 pb-3">
            {/* <div className="p-2 bg-success/10 rounded-lg">
              ₱
            </div> */}
            <h3 className="text-lg font-semibold text-primary">Stock Levels</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-primary">
                Min Stock Level
              </label>
              <input
                type="number"
                min="0"
                {...register('minStock')}
                className="input"
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-primary">
                Max Stock Level
              </label>
              <input
                type="number"
                min="0"
                {...register('maxStock')}
                className="input"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Brand & Supplier */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 pb-3">
            <h3 className="text-lg font-semibold text-primary">Brand & Supplier</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Brand with dropdown and create option */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-primary">
                Brand *
              </label>
              <SearchableSelect
                options={brands.map(b => ({ 
                  value: b.name, 
                  name: b.name 
                }))}
                value={brandInput}
                onChange={setBrandInput}
                placeholder="Select or create brand"
                allowCreate={true}
                onCreateNew={(newBrand) => {
                  setBrandInput(newBrand)
                  // Add the new brand to the local state for immediate use
                  setBrands(prev => [...prev, { id: Date.now(), name: newBrand }])
                }}
                className={!brandInput ? 'border-warning focus:border-warning' : ''}
              />
              <input type="hidden" {...register('brand', { required: 'Brand is required' })} />
              <p className="text-xs text-muted">
                Select from existing brands or create a new one.
              </p>
            </div>

            {/* Supplier with typeahead (from suppliers list) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-primary">
                Supplier
              </label>
              <SearchableSelect
                options={suppliers.map(s => ({ 
                  value: s.name, 
                  name: s.name 
                }))}
                value={supplierInput}
                onChange={setSupplierInput}
                placeholder="Select supplier"
              />
              <input type="hidden" {...register('supplierName')} value={supplierInput} readOnly />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
              <button
                type="submit"
                disabled={isSubmitting}
                onClick={(e) => {
                  console.log('Submit button clicked')
                  console.log('Form validation errors:', errors)
                }}
                className="btn btn-primary flex items-center"
              >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                {editItem ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                {editItem ? 'Update Item' : 'Create Item'}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
