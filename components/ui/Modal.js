'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import clsx from 'clsx'

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const [mounted, setMounted] = useState(false)
  const [container, setContainer] = useState(null)

  // Handle escape key + body scroll lock
  useEffect(() => {
    setMounted(true)

    // Create a dedicated portal container
    const el = document.createElement('div')
    el.setAttribute('id', 'modal-root')
    document.body.appendChild(el)
    setContainer(el)

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = prevOverflow
        if (el && el.parentNode) {
          el.parentNode.removeChild(el)
        }
      }
    }
  }, [isOpen, onClose])

  if (!isOpen || !mounted || !container) {
    console.log('Modal not rendering:', { isOpen, mounted, container: !!container })
    return null
  }
  
  console.log('Modal rendering with container:', container)

  const sizeToMaxWidth = {
    sm: 480,   // ~max-w-md
    md: 672,   // ~max-w-2xl
    lg: 896,   // ~max-w-4xl
    xl: 1152,  // ~max-w-6xl
  }

  const modal = (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          WebkitBackdropFilter: 'blur(6px)',
          backdropFilter: 'blur(6px)'
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={clsx(
          'relative w-full bg-surface border border-border rounded-2xl shadow-2xl',
          'transform transition-all duration-300 ease-out',
          'animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4'
        )}
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          maxHeight: '90vh',
          overflow: 'hidden',
          maxWidth: `${sizeToMaxWidth[size] || sizeToMaxWidth.md}px`
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b border-border bg-surface-elevated"
          style={{ padding: '16px 24px' }}
        >
          <h2 className="text-xl font-semibold text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-elevated rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 72px)', padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  )

  return createPortal(modal, container)
}
