'use client'
import clsx from 'clsx'
import { ChevronDown } from 'lucide-react'

export function SelectField({ 
  label,
  options,
  value,
  onChange,
  error,
  className,
  placeholder = 'Select...'
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block mb-1 text-sm font-medium">{label}</label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className={clsx(
            'input appearance-none pr-10',
            error && 'border-[--color-danger] focus:ring-[--color-danger]'
          )}
        >
          <option value="">{placeholder}</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-silver] pointer-events-none" />
      </div>
      {error && (
        <div className="mt-1 text-sm text-[--color-danger]">{error}</div>
      )}
    </div>
  )
}
