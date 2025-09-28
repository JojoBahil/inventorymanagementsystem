'use client'

import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Package } from 'lucide-react'
import clsx from 'clsx'

export function DataTable({ data, columns, className, isLoading, emptyMessage = "No data available" }) {
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
      {/* Desktop Table */}
      <div className="hidden md:block">
        <table className="table">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="px-4 lg:px-6 py-3 lg:py-5">
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
              table.getRowModel().rows.map((row, index) => (
                <tr key={row.original.uniqueKey || row.id || index}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 lg:px-6 py-3 lg:py-5">
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
                    <h3 className="text-lg font-semibold text-muted mb-2">{emptyMessage}</h3>
                    <p className="text-sm text-muted max-w-sm text-center">
                      {emptyMessage === "No audit logs found" 
                        ? "Audit logs will appear here as users perform actions in the system."
                        : "Data will appear here once available."
                      }
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden">
        {table.getRowModel().rows?.length ? (
          <div className="space-y-3 p-4">
            {table.getRowModel().rows.map((row, index) => (
              <div key={row.original.uniqueKey || row.id || index} className="card p-4">
                <div className="space-y-2">
                  {row.getVisibleCells().map(cell => (
                    <div key={cell.id} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted">
                        {cell.column.columnDef.header}
                      </span>
                      <span className="text-sm text-primary text-right">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="flex flex-col items-center">
              <Package className="w-16 h-16 text-muted mb-4" />
              <h3 className="text-lg font-semibold text-muted mb-2">{emptyMessage}</h3>
              <p className="text-sm text-muted max-w-sm text-center">
                {emptyMessage === "No audit logs found" 
                  ? "Audit logs will appear here as users perform actions in the system."
                  : "Data will appear here once available."
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}