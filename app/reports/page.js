'use client'

import { useState } from 'react'
import { FileSpreadsheet, Package, TrendingUp, AlertTriangle, Download, Filter, BarChart3, Clock, Users } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import Link from 'next/link'

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState('stock-on-hand')
  const toast = useToast()

  const reportTypes = [
    {
      id: 'stock-on-hand',
      name: 'Stock On Hand',
      description: 'View current inventory levels and stock status for all items',
      icon: Package,
      href: '/reports/stock-on-hand',
      color: 'primary',
      features: ['Real-time stock levels', 'Status indicators', 'Export to CSV/PDF']
    },
    {
      id: 'stock-movements',
      name: 'Stock Movements',
      description: 'Track all incoming and outgoing inventory transactions',
      icon: TrendingUp,
      href: '/reports/stock-movements',
      color: 'info',
      features: ['Transaction history', 'Date range filtering', 'Movement analysis']
    },
    {
      id: 'low-stock',
      name: 'Low Stock Alert',
      description: 'Identify items below minimum stock levels requiring attention',
      icon: AlertTriangle,
      href: '/reports/low-stock',
      color: 'warning',
      features: ['Severity classification', 'Reorder recommendations', 'Alert prioritization']
    },
    {
      id: 'audit-logs',
      name: 'Audit Logs',
      description: 'Track user activities and system changes with detailed logging',
      icon: Clock,
      href: '/reports/audit-logs',
      color: 'success',
      features: ['User activity tracking', 'Role-based access', 'Paginated view']
    }
  ]

  const getColorClasses = (color) => {
    switch (color) {
      case 'primary':
        return 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
      case 'info':
        return 'bg-info/10 text-info border-info/20 hover:bg-info/20'
      case 'warning':
        return 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20'
      case 'success':
        return 'bg-success/10 text-success border-success/20 hover:bg-success/20'
      default:
        return 'bg-muted/10 text-muted border-muted/20 hover:bg-muted/20'
    }
  }

  return (
    <div className="w-full space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary tracking-tight mb-2">Reports</h1>
              <p className="text-base sm:text-lg text-secondary">Generate and export inventory reports for analysis and decision making</p>
            </div>
            <div className="text-center lg:text-right">
              <div className="card p-4">
                <p className="text-sm text-muted">Available Reports</p>
                <p className="text-2xl font-bold text-primary">{reportTypes.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Report Types Grid */}
        <div className="animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {reportTypes.map((report) => {
              const IconComponent = report.icon
              return (
                <Link
                  key={report.id}
                  href={report.href}
                  className={`card p-6 lg:p-8 transition-all duration-300 group cursor-pointer border-2 hover:shadow-lg hover:scale-105 ${getColorClasses(report.color)}`}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-3 lg:gap-4 mb-4 lg:mb-6">
                      <div className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl transition-colors ${getColorClasses(report.color)}`}>
                        <IconComponent className="w-6 h-6 lg:w-8 lg:h-8" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg lg:text-xl mb-1 group-hover:underline">
                          {report.name}
                        </h3>
                        <p className="text-xs lg:text-sm opacity-80 leading-relaxed">
                          {report.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="space-y-1.5 lg:space-y-2">
                        {report.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></div>
                            <span className="text-xs lg:text-sm opacity-80">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-4 lg:mt-6 pt-3 lg:pt-4 border-t border-current/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs lg:text-sm font-medium opacity-80">VIEW REPORT</span>
                        <div className="w-2 h-2 rounded-full bg-current opacity-60 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Features Section */}
        <div className="animate-fade-in">
          <div className="card p-6 lg:p-8">
            <div className="text-center mb-6 lg:mb-8">
              <h2 className="text-xl lg:text-2xl font-bold text-primary mb-2">Report Features</h2>
              <p className="text-sm lg:text-base text-secondary">Everything you need for comprehensive inventory analysis</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              <div className="text-center">
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-primary/10 rounded-xl lg:rounded-2xl flex items-center justify-center mx-auto mb-3 lg:mb-4">
                  <Filter className="w-6 h-6 lg:w-8 lg:h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-base lg:text-lg text-primary mb-2">Advanced Filtering</h3>
                <p className="text-xs lg:text-sm text-muted">Filter by date range, category, brand, and more to get precise insights</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-success/10 rounded-xl lg:rounded-2xl flex items-center justify-center mx-auto mb-3 lg:mb-4">
                  <Download className="w-6 h-6 lg:w-8 lg:h-8 text-success" />
                </div>
                <h3 className="font-semibold text-base lg:text-lg text-primary mb-2">Export Options</h3>
                <p className="text-xs lg:text-sm text-muted">Download reports as CSV or PDF formats for external analysis</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-info/10 rounded-xl lg:rounded-2xl flex items-center justify-center mx-auto mb-3 lg:mb-4">
                  <BarChart3 className="w-6 h-6 lg:w-8 lg:h-8 text-info" />
                </div>
                <h3 className="font-semibold text-base lg:text-lg text-primary mb-2">Real-time Data</h3>
                <p className="text-xs lg:text-sm text-muted">Always up-to-date with current inventory status and movements</p>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}
