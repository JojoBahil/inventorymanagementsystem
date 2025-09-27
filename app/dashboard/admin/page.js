'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/Toast'
import { ConfirmModal } from '@/components/ui/Toast'
import { 
  Tag, 
  Ruler, 
  Award, 
  Truck, 
  Building2, 
  Plus, 
  Edit, 
  Trash2,
  X
} from 'lucide-react'

export default function ReferencesPage() {
  const [activeModal, setActiveModal] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [loading, setLoading] = useState({})
  const [data, setData] = useState({
    categories: [],
    uoms: [],
    brands: [],
    suppliers: [],
    customers: []
  })
  const [formData, setFormData] = useState({})
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToast()

  const referenceTypes = [
    {
      id: 'categories',
      name: 'Categories',
      singularName: 'Category',
      icon: Tag,
      description: 'Product categories',
      fields: [
        { key: 'name', label: 'Category Name', type: 'text', placeholder: 'Electronics, Clothing, etc.' }
      ]
    },
    {
      id: 'uoms',
      name: 'Units of Measure',
      singularName: 'Unit of Measure',
      icon: Ruler,
      description: 'Measurement units',
      fields: [
        { key: 'name', label: 'Unit Name', type: 'text', placeholder: 'Centimeter' },
        { key: 'code', label: 'Unit Code', type: 'text', placeholder: 'cm' }
      ]
    },
    {
      id: 'brands',
      name: 'Brands',
      singularName: 'Brand',
      icon: Award,
      description: 'Product brands',
      fields: [
        { key: 'name', label: 'Brand Name', type: 'text', placeholder: 'Nike, Apple, etc.' }
      ]
    },
    {
      id: 'suppliers',
      name: 'Suppliers',
      singularName: 'Supplier',
      icon: Truck,
      description: 'Vendor companies',
      fields: [
        { key: 'name', label: 'Company Name', type: 'text', placeholder: 'Supplier company name' }
      ]
    },
    {
      id: 'customers',
      name: 'Branches',
      singularName: 'Branch',
      icon: Building2,
      description: 'SSII branch locations',
      fields: [
        { key: 'name', label: 'Branch Name', type: 'text', placeholder: 'Branch location name' }
      ]
    }
  ]

  const loadData = async (type) => {
    setLoading(prev => ({ ...prev, [type]: true }))
    try {
      const endpoint = type === 'customers' ? '/api/customers' : `/api/${type}`
      const res = await fetch(endpoint, { cache: 'no-store' })
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      
      const items = await res.json()
      
      // Handle different response formats
      let dataArray = []
      if (Array.isArray(items)) {
        dataArray = items
      } else if (items && Array.isArray(items.brands)) {
        dataArray = items.brands
      } else if (items && Array.isArray(items.categories)) {
        dataArray = items.categories
      } else if (items && Array.isArray(items.uoms)) {
        dataArray = items.uoms
      } else if (items && Array.isArray(items.suppliers)) {
        dataArray = items.suppliers
      } else if (items && Array.isArray(items.customers)) {
        dataArray = items.customers
      }
      
      setData(prev => ({ ...prev, [type]: dataArray }))
    } catch (error) {
      console.error(`Error loading ${type}:`, error)
      toast.error(`Failed to load ${type}: ${error.message}`)
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }))
    }
  }

  const loadAllData = async () => {
    for (const type of referenceTypes.map(t => t.id)) {
      await loadData(type)
    }
  }

  const handleAdd = async (type) => {
    try {
      const endpoint = type === 'customers' ? '/api/customers' : `/api/${type}`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData[type] || {})
      })
      
      if (res.ok) {
        toast.success(`${referenceTypes.find(t => t.id === type)?.name} added successfully`)
        setFormData(prev => ({ ...prev, [type]: {} }))
        setActiveModal(null)
        await loadData(type)
      } else {
        const errorData = await res.json().catch(() => ({}))
        const errorMessage = errorData.error || `HTTP ${res.status}: ${res.statusText}`
        toast.error(`Failed to add ${referenceTypes.find(t => t.id === type)?.name}: ${errorMessage}`)
      }
    } catch (error) {
      console.error(`Error adding ${type}:`, error)
      toast.error(`Failed to add ${referenceTypes.find(t => t.id === type)?.name}: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async (type, item) => {
    try {
      const endpoint = type === 'customers' ? '/api/customers' : `/api/${type}`
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, ...formData[type] })
      })
      
      if (res.ok) {
        toast.success(`${referenceTypes.find(t => t.id === type)?.name} updated successfully`)
        setFormData(prev => ({ ...prev, [type]: {} }))
        setEditingItem(null)
        setActiveModal(null)
        await loadData(type)
      } else {
        const errorData = await res.json().catch(() => ({}))
        const errorMessage = errorData.error || `HTTP ${res.status}: ${res.statusText}`
        toast.error(`Failed to update ${referenceTypes.find(t => t.id === type)?.name}: ${errorMessage}`)
      }
    } catch (error) {
      console.error(`Error updating ${type}:`, error)
      toast.error(`Failed to update ${referenceTypes.find(t => t.id === type)?.name}: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = async (type, item) => {
    // First try to delete normally - this will either succeed or return a confirmation request
    await executeDelete(type, item, false)
  }

  const executeDelete = async (type, item, force = false) => {
    try {
      const endpoint = type === 'customers' ? '/api/customers' : `/api/${type}`
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, force })
      })
      
      if (res.ok) {
        const responseData = await res.json()
        const successMessage = responseData.message || `${referenceTypes.find(t => t.id === type)?.name} deleted successfully`
        toast.success(successMessage)
        await loadData(type)
      } else {
        const errorData = await res.json().catch(() => ({}))
        
        // Special handling for deletion that requires confirmation
        if (errorData.requiresConfirmation) {
          const { affectedRecords } = errorData
          let detailedMessage = errorData.error + '\n\n'
          
          // Build detailed message based on reference type and affected records
          if (type === 'uoms') {
            if (affectedRecords.items > 0) {
              detailedMessage += `• ${affectedRecords.items} item(s) will have their UOM removed\n`
            }
            if (affectedRecords.priceLists > 0) {
              detailedMessage += `• ${affectedRecords.priceLists} price list(s) will be deleted\n`
            }
            if (affectedRecords.txnLines > 0) {
              detailedMessage += `• ${affectedRecords.txnLines} transaction line(s) will keep the UOM reference for historical records\n`
            }
          } else if (type === 'categories') {
            if (affectedRecords.items > 0) {
              detailedMessage += `• ${affectedRecords.items} item(s) will have their category removed\n`
            }
            if (affectedRecords.subcategories > 0) {
              detailedMessage += `• ${affectedRecords.subcategories} subcategory(ies) will be deleted\n`
            }
          } else if (type === 'brands') {
            if (affectedRecords.items > 0) {
              detailedMessage += `• ${affectedRecords.items} item(s) will have their brand removed\n`
            }
          } else if (type === 'suppliers') {
            if (affectedRecords.items > 0) {
              detailedMessage += `• ${affectedRecords.items} item(s) will have their supplier removed\n`
            }
            if (affectedRecords.transactions > 0) {
              detailedMessage += `• ${affectedRecords.transactions} transaction(s) will keep the supplier reference for historical records\n`
            }
          } else if (type === 'customers') {
            if (affectedRecords.transactions > 0) {
              detailedMessage += `• ${affectedRecords.transactions} transaction(s) will keep the customer reference for historical records\n`
            }
            if (affectedRecords.priceLists > 0) {
              detailedMessage += `• ${affectedRecords.priceLists} price list(s) will be deleted\n`
            }
          }
          
          detailedMessage += '\nThis action cannot be undone.'
          
          setConfirmAction({
            type: 'forceDelete',
            referenceType: type,
            item,
            message: detailedMessage,
            confirmText: 'Delete Anyway',
            affectedRecords: errorData.affectedRecords
          })
          setShowConfirmModal(true)
          return
        }
        
        const errorMessage = errorData.error || `HTTP ${res.status}: ${res.statusText}`
        toast.error(`Failed to delete ${referenceTypes.find(t => t.id === type)?.name}: ${errorMessage}`)
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error)
      toast.error(`Failed to delete ${referenceTypes.find(t => t.id === type)?.name}: ${error.message}`)
    }
  }

  const openModal = (type, item = null) => {
    setActiveModal(type)
    if (item) {
      setEditingItem(item)
      // Only include the form fields, not all item properties
      const typeConfig = referenceTypes.find(t => t.id === type)
      const formFields = {}
      if (typeConfig) {
        typeConfig.fields.forEach(field => {
          formFields[field.key] = item[field.key] || ''
        })
      }
      setFormData(prev => ({ ...prev, [type]: formFields }))
    } else {
      setEditingItem(null)
      setFormData(prev => ({ ...prev, [type]: {} }))
    }
  }

  const closeModal = () => {
    setActiveModal(null)
    setEditingItem(null)
    setFormData({})
    setIsSubmitting(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && activeModal && !isSubmitting) {
      e.preventDefault()
      const type = referenceTypes.find(t => t.id === activeModal)
      if (!type) return

      const currentData = formData[activeModal] || {}
      const hasContent = type.fields.some(field => {
        const value = currentData[field.key]
        return value && typeof value === 'string' && value.trim()
      })

      if (hasContent) {
        setIsSubmitting(true)
        if (editingItem) {
          handleEdit(activeModal, editingItem)
        } else {
          handleAdd(activeModal)
        }
      }
    }
  }

  const updateFormData = (type, field, value) => {
    setFormData(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }))
  }

  useEffect(() => {
    loadAllData()
  }, [])

  const renderModal = () => {
    if (!activeModal) return null

    const type = referenceTypes.find(t => t.id === activeModal)
    if (!type) return null

    const isEditing = !!editingItem
    const currentData = formData[activeModal] || {}

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onKeyDown={handleKeyDown} tabIndex={-1}>
        <div className="bg-surface rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-primary">
              {isEditing ? `Edit ${type.name}` : `Add ${type.name}`}
            </h2>
            <button
              onClick={closeModal}
              className="text-muted hover:text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {type.fields.map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-primary mb-2">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={currentData[field.key] || ''}
                  onChange={(e) => updateFormData(activeModal, field.key, e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="input w-full"
                  placeholder={field.placeholder}
                  autoFocus={field.key === type.fields[0].key}
                />
              </div>
            ))}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={closeModal}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => isEditing ? handleEdit(activeModal, editingItem) : handleAdd(activeModal)}
                className="btn btn-primary w-full"
                disabled={isSubmitting || !type.fields.some(field => {
                  const value = currentData[field.key]
                  return value && typeof value === 'string' && value.trim()
                })}
              >
                {isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Add')} {type.singularName}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight mb-1">References</h1>
        <p className="text-secondary text-lg md:text-xl">Manage reference data and master settings</p>
      </div>

      {/* Reference Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {referenceTypes.map(type => {
          const IconComponent = type.icon
          const items = data[type.id] || []
          const isLoading = loading[type.id]

          return (
            <div key={type.id} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <IconComponent className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">{type.name}</h3>
                    <p className="text-sm text-muted">{type.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => openModal(type.id)}
                  className="btn btn-primary btn-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {isLoading ? (
                  <div className="text-sm text-muted">Loading...</div>
                ) : items.length === 0 ? (
                  <div className="text-sm text-muted">No {type.name.toLowerCase()} yet</div>
                ) : (
                  items.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 cursor-pointer"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-primary truncate">
                          {item.name}
                        </div>
                        {item.code && type.id !== 'customers' && (
                          <div className="text-xs text-muted">{item.code}</div>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => openModal(type.id, item)}
                          className="p-1 text-muted hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors duration-200"
                          title="Edit"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => confirmDelete(type.id, item)}
                          className="p-1 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors duration-200"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {renderModal()}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          if (confirmAction?.type === 'forceDelete') {
            executeDelete(confirmAction.referenceType, confirmAction.item, true)
          }
          setShowConfirmModal(false)
          setConfirmAction(null)
        }}
        title="Confirm Force Delete"
        message={confirmAction?.message || ''}
        confirmText={confirmAction?.confirmText || 'Delete Anyway'}
        type="danger"
      />
    </div>
  )
}