'use client'

import Link from 'next/link'

export default function AdminHome() {
  const links = [
    { href: '/dashboard/admin/categories', label: 'Categories' },
    { href: '/dashboard/admin/uoms', label: 'Units of Measure' },
    { href: '/dashboard/admin/brands', label: 'Brands' },
    { href: '/dashboard/admin/suppliers', label: 'Suppliers' },
    { href: '/dashboard/admin/customers', label: 'Branches (Customers)' },
  ]

  return (
    <div className="w-[93%] mx-auto h-100">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight mb-1">References</h1>
        <p className="text-secondary text-lg md:text-xl">Manage reference data and master settings</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {links.map(l => (
          <Link key={l.href} href={l.href} className="card card-compact p-6 hover:border-primary">
            <div className="text-lg font-semibold text-primary">{l.label}</div>
            <div className="text-sm text-muted mt-2">Create and maintain {l.label.toLowerCase()}.</div>
          </Link>
        ))}
      </div>
    </div>
  )
}


