'use client'

import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Package } from 'lucide-react'
import clsx from 'clsx'

export function DataTable({ data, columns, className, isLoading }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) {
    return (
      <div className="table-container">
        <div className="p-6 space-y-4">
          <div className="h-6 rounded w-1/4 skeleton"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 rounded skeleton"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={clsx('table-container', className)}>
      <table className="table">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="text-center py-16">
                <div className="flex flex-col items-center">
                  <Package className="w-16 h-16 text-muted mb-4" />
                  <h3 className="text-lg font-semibold text-muted mb-2">No data available</h3>
                  <p className="text-sm text-muted max-w-sm text-center">
                    Stock movements will appear here once transactions are posted.
                  </p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}