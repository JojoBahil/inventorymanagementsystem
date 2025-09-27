'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Search, ChevronDown, X, Plus } from 'lucide-react'

export function SearchableSelect({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Select an option...", 
  className = "", 
  allowCreate = false, 
  onCreateNew,
  disabled = false
}) {
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
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
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
  const showCreateOption = allowCreate && searchTerm.trim() && !filteredOptions.some(opt => opt.label.toLowerCase() === searchTerm.toLowerCase())

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
              {option.label}
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
        className={`input cursor-pointer flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen)
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 0)
            }
          }
        }}
      >
        <span className={selectedOption ? 'text-foreground' : 'text-muted'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center space-x-2">
          {value && !disabled && (
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
