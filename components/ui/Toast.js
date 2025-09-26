'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'

// Toast Context
const ToastContext = createContext()

// Toast Provider Component
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = (toast) => {
    const id = Date.now() + Math.random()
    const newToast = {
      id,
      type: 'info', // default
      duration: 5000, // 5 seconds default
      ...toast
    }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto remove after duration
    setTimeout(() => {
      removeToast(id)
    }, newToast.duration)
    
    return id
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const success = (message, options = {}) => {
    return addToast({ type: 'success', message, ...options })
  }

  const error = (message, options = {}) => {
    return addToast({ type: 'error', message, ...options })
  }

  const warning = (message, options = {}) => {
    return addToast({ type: 'warning', message, ...options })
  }

  const info = (message, options = {}) => {
    return addToast({ type: 'info', message, ...options })
  }

  const value = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Individual Toast Component
function Toast({ toast, onRemove }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleRemove = () => {
    setIsLeaving(true)
    setTimeout(() => onRemove(toast.id), 300)
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-error" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning" />
      case 'info':
      default:
        return <Info className="w-5 h-5 text-info" />
    }
  }

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-success/10 border-success/20'
      case 'error':
        return 'bg-error/10 border-error/20'
      case 'warning':
        return 'bg-warning/10 border-warning/20'
      case 'info':
      default:
        return 'bg-info/10 border-info/20'
    }
  }

  return (
    <div
      className={clsx(
        'card card-elevated p-4 min-w-[320px] max-w-[480px] transform transition-all duration-300 ease-in-out',
        getBackgroundColor(),
        isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          {toast.title && (
            <h4 className="text-sm font-semibold text-primary mb-1">
              {toast.title}
            </h4>
          )}
          <p className="text-sm text-secondary leading-relaxed">
            {toast.message}
          </p>
        </div>
        <button
          onClick={handleRemove}
          className="flex-shrink-0 p-1 text-muted hover:text-primary transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Toast Container
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onRemove={removeToast} />
        </div>
      ))}
    </div>
  )
}

// Confirmation Modal Component
export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", type = "warning" }) {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertCircle className="w-6 h-6 text-error" />
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-warning" />
      case 'info':
        return <Info className="w-6 h-6 text-info" />
      default:
        return <AlertTriangle className="w-6 h-6 text-warning" />
    }
  }

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'btn btn-error'
      case 'warning':
        return 'btn btn-warning'
      case 'info':
        return 'btn btn-primary'
      default:
        return 'btn btn-warning'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative card card-elevated p-6 max-w-md w-full">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-primary mb-2">
              {title}
            </h3>
            <p className="text-secondary mb-6">
              {message}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="btn btn-secondary"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm()
                  onClose()
                }}
                className={getConfirmButtonClass()}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
