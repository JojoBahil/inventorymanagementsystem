'use client'

import { LayoutDashboard, Package, FileText, ArrowDownToLine, ArrowUpFromLine, FileSpreadsheet, Upload, LogOut, Settings } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Items', href: '/items', icon: Package },
  { 
    name: 'Transactions',
    icon: FileText,
    children: [
      { name: 'Goods Receipt', href: '/transactions/new/grn', icon: ArrowDownToLine },
      { name: 'Issue', href: '/transactions/new/issue', icon: ArrowUpFromLine }
    ]
  },
  { name: 'Reports', href: '/reports/stock-on-hand', icon: FileSpreadsheet },
  { name: 'Imports', href: '/imports', icon: Upload }
]

export default function DashboardLayout({ children }) {
  const pathname = usePathname()

  return (
    <div className="flex bg-background">
      {/* Professional Sidebar */}
      <aside className="w-80 bg-surface border-r border-border flex flex-col">
        {/* Logo Section */}
        <div className="h-24 flex items-center px-8 border-b border-border">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="SSII"
                width={280}
                height={280}
                className="dark:invert"
              />
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-6">
          <div className="space-y-8">
            {/* Main Navigation */}
            <div className="nav-section">
              <div className="nav-section-title">Main</div>
              <div className="space-y-2">
                {navigation.slice(0, 2).map(item => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      "nav-link",
                      pathname === item.href && "nav-link-active"
                    )}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Transactions Section */}
            <div className="nav-section">
              <div className="nav-section-title">Transactions</div>
              <div className="space-y-2">
                {navigation[2].children.map(child => (
                  <Link
                    key={child.name}
                    href={child.href}
                    className={clsx(
                      "nav-link text-sm",
                      pathname === child.href && "nav-link-active"
                    )}
                  >
                    <child.icon className="w-4 h-4 mr-3" />
                    {child.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Reports & Data Section */}
            <div className="nav-section">
              <div className="nav-section-title">Reports & Data</div>
              <div className="space-y-2">
                {navigation.slice(3).map(item => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      "nav-link",
                      pathname === item.href && "nav-link-active"
                    )}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                ))}
                <Link
                  href="/dashboard/admin"
                  className={clsx(
                    "nav-link",
                    pathname.startsWith('/dashboard/admin') && "nav-link-active"
                  )}
                >
                  <Settings className="w-5 h-5 mr-3" />
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* User Section */}
        <div className="p-6 border-t border-border">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-sm font-semibold text-white">JD</span>
            </div>
            <div>
              <p className="text-sm font-medium text-primary">John Doe</p>
              <p className="text-xs text-muted">Administrator</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <button className="nav-link w-full text-left">
              <Settings className="w-4 h-4 mr-3" />
              Settings
            </button>
            <button
              onClick={() => {
                document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
                window.location.href = '/login';
              }}
              className="nav-link w-full text-left hover:bg-error/10 hover:text-error"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen">
        <div className="max-w-7xl w-full mx-auto px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}