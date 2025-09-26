'use client'

import { useState } from 'react'
import { ItemForm } from '@/components/ui/ItemForm'
import { Modal } from '@/components/ui/Modal'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { useToast, ConfirmModal } from '@/components/ui/Toast'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0))
}

export function ItemsTable({ items, allBrands, allCategories, onRefresh, user }) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const toast = useToast()

  const editItem = (item) => {
    setSelectedItem(item)
    setShowEditModal(true)
  }

  const viewItemDetails = (item) => {
    setSelectedItem(item)
    setShowDetailsModal(true)
  }

  const deleteItem = async (item) => {
    setConfirmAction({
      type: 'delete',
      item,
      message: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      confirmText: 'Delete Item'
    })
    setShowConfirmModal(true)
  }

  const executeDeleteItem = async (item) => {
    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete item')
      }

      toast.success('Item deleted successfully!')
      onRefresh?.()
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Failed to delete item. Please try again.')
    }
  }

  const handleItemSuccess = () => {
    setShowAddModal(false)
    setShowEditModal(false)
    setSelectedItem(null)
    onRefresh?.()
  }

  return (
    <>
      {/* Items Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th className="px-6 py-5 text-left">Name</th>
              <th className="px-6 py-5 text-left">Brand</th>
              <th className="px-6 py-5 text-left">Category</th>
              <th className="px-6 py-5 text-left">UOM</th>
              <th className="px-6 py-5 text-right">On Hand</th>
              <th className="px-6 py-5 text-right">Min</th>
              <th className="px-6 py-5 text-right">Std Cost</th>
              <th className="px-6 py-5 text-right">Value</th>
              {(user && (hasPermission(user, PERMISSIONS.ITEMS_UPDATE) || hasPermission(user, PERMISSIONS.ITEMS_DELETE))) && (
                <th className="px-6 py-5 text-center">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {items.map(r => (
              <tr key={r.id} className="hover:bg-surface-elevated">
                <td className="px-6 py-5 text-primary font-medium">
                  {r.name}
                  {r.belowMin && <span className="ml-2 text-xs text-error bg-error/10 px-2 py-0.5 rounded">Below min</span>}
                </td>
                <td className="px-6 py-5">{r.brand}</td>
                <td className="px-6 py-5">{r.category}</td>
                <td className="px-6 py-5">{r.uom}</td>
                <td className="px-6 py-5 text-right">{r.onHand}</td>
                <td className="px-6 py-5 text-right">{r.min ?? '-'}</td>
                <td className="px-6 py-5 text-right">{formatCurrency(r.cost)}</td>
                <td className="px-6 py-5 text-right">{formatCurrency(r.value)}</td>
                {(user && (hasPermission(user, PERMISSIONS.ITEMS_UPDATE) || hasPermission(user, PERMISSIONS.ITEMS_DELETE))) && (
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => viewItemDetails(r)}
                        className="p-1.5 text-info hover:bg-info/10 rounded transition-colors"
                        title="View Details"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {user && hasPermission(user, PERMISSIONS.ITEMS_UPDATE) && (
                        <button 
                          onClick={() => editItem(r)}
                          className="p-1.5 text-warning hover:bg-warning/10 rounded transition-colors"
                          title="Edit Item"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                      {user && hasPermission(user, PERMISSIONS.ITEMS_DELETE) && (
                        <button 
                          onClick={() => deleteItem(r)}
                          className="p-1.5 text-error hover:bg-error/10 rounded transition-colors"
                          title="Delete Item"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={user && (hasPermission(user, PERMISSIONS.ITEMS_UPDATE) || hasPermission(user, PERMISSIONS.ITEMS_DELETE)) ? 9 : 8} className="text-center text-muted py-8">No items match your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <ItemForm 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onSuccess={handleItemSuccess}
      />

      <ItemForm 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        onSuccess={handleItemSuccess}
        editItem={selectedItem}
      />

      {/* View Details Modal */}
      <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} title="Item Details" size="lg">
        {selectedItem && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Item Name</label>
                  <div className="text-lg font-semibold text-primary">{selectedItem.name}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Brand</label>
                  <div className="text-primary">{selectedItem.brand}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Category</label>
                  <div className="text-primary">{selectedItem.category}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Unit of Measure</label>
                  <div className="text-primary">{selectedItem.uom}</div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Current Stock</label>
                  <div className="text-2xl font-bold text-primary">{selectedItem.onHand}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Minimum Stock</label>
                  <div className="text-primary">{selectedItem.min ?? 'Not set'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Standard Cost</label>
                  <div className="text-primary">{formatCurrency(selectedItem.cost)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Total Value</label>
                  <div className="text-xl font-bold text-success">{formatCurrency(selectedItem.value)}</div>
                </div>
              </div>
            </div>
            {selectedItem.belowMin && (
              <div className="bg-error/10 border border-error/20 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-error mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-error font-medium">This item is below minimum stock level</span>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          if (confirmAction?.type === 'delete') {
            executeDeleteItem(confirmAction.item)
          }
          setShowConfirmModal(false)
          setConfirmAction(null)
        }}
        title="Confirm Action"
        message={confirmAction?.message || ''}
        confirmText={confirmAction?.confirmText || 'Confirm'}
        type="danger"
      />
    </>
  )
}
