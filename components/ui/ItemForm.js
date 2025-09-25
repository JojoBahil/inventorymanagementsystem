'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Package, AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import clsx from 'clsx'

// Categories will be fetched from the backend
const emptyArr = []
const units = ['Pieces', 'Kg', 'Liters', 'Meters', 'Boxes', 'Rolls']

export function ItemForm({ isOpen, onClose, onSuccess }) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState(emptyArr)
  const [uoms, setUoms] = useState(emptyArr)
  const [brands, setBrands] = useState(emptyArr)
  const [brandInput, setBrandInput] = useState('')
  const [suppliers, setSuppliers] = useState(emptyArr)
  const [supplierInput, setSupplierInput] = useState('')

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create item')
      }

      const newItem = await response.json()
      onSuccess?.(newItem)
      reset()
      onClose()
    } catch (error) {
      console.error('Error creating item:', error)
      alert(error.message)
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
          setBrands(Array.isArray(brandData) ? brandData : [])
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Item" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              <select
                {...register('category', { required: 'Category is required' })}
                className={clsx('input', errors.category && 'border-error focus:border-error')}
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
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
            <select
              {...register('unit', { required: 'Unit is required' })}
              className={clsx('input', errors.unit && 'border-error focus:border-error')}
            >
              <option value="">Select unit</option>
              {uoms.map(u => (
                <option key={u.id || u.code} value={u.name}>{u.name}</option>
              ))}
            </select>
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
            <h3 className="text-lg font-semibold text-primary">Pricing & Stock Levels</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-primary">
                Standard Cost
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted">₱</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('standardCost')}
                  className="input pl-8"
                  placeholder="0.00"
                />
              </div>
            </div>

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
            {/* Brand with typeahead create */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-primary">
                Brand
              </label>
              <input
                list="brand-options"
                value={brandInput}
                onChange={(e) => setBrandInput(e.target.value)}
                className="input"
                placeholder="Type to search or enter new brand"
              />
              <datalist id="brand-options">
                {brands.map(b => (
                  <option key={b.id} value={b.name} />
                ))}
              </datalist>
              <input type="hidden" {...register('brand')} value={brandInput} readOnly />
              <p className="text-xs text-muted">Press Enter to keep a new brand name.</p>
            </div>

            {/* Supplier with typeahead (from suppliers list) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-primary">
                Supplier
              </label>
              <input
                list="supplier-options"
                value={supplierInput}
                onChange={(e) => setSupplierInput(e.target.value)}
                className="input"
                placeholder="Type to search supplier"
              />
              <datalist id="supplier-options">
                {suppliers.map(s => (
                  <option key={s.id} value={s.name} />
                ))}
              </datalist>
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
            className="btn btn-primary flex items-center"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Item
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
