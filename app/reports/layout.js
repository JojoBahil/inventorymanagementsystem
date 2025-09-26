'use client'

import { LayoutDashboard, Package, FileText, ArrowDownToLine, ArrowUpFromLine, FileSpreadsheet, Upload, LogOut, Settings, Users } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

const getNavigation = (user) => {
  const baseNav = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: LayoutDashboard,
      permission: PERMISSIONS.DASHBOARD_VIEW
    },
    { 
      name: 'Items', 
      href: '/items', 
      icon: Package,
      permission: PERMISSIONS.ITEMS_VIEW
    }
  ]

  // Add transactions if user can view them
  if (hasPermission(user, PERMISSIONS.TRANSACTIONS_VIEW)) {
    const transactionChildren = []
    
    if (hasPermission(user, PERMISSIONS.TRANSACTIONS_CREATE)) {
      transactionChildren.push(
        { name: 'Receive Stock', href: '/transactions/new/grn', icon: ArrowDownToLine },
        { name: 'Issue', href: '/transactions/new/issue', icon: ArrowUpFromLine }
      )
    }
    
    if (transactionChildren.length > 0) {
      baseNav.push({
        name: 'Transactions',
        icon: FileText,
        children: transactionChildren
      })
    }
  }

  // Add reports if user can view them
  if (hasPermission(user, PERMISSIONS.REPORTS_VIEW)) {
    baseNav.push({ 
      name: 'Reports', 
      href: '/reports', 
      icon: FileSpreadsheet 
    })
  }

  // Add imports if user is admin
  if (hasPermission(user, PERMISSIONS.ADMIN_VIEW)) {
    baseNav.push({ 
      name: 'Imports', 
      href: '/imports', 
      icon: Upload 
    })
  }

  return baseNav
}

export default function ReportsLayout({ children }) {
  const pathname = usePathname()

  return (
    <div className="flex bg-background">
      {/* Modern Sidebar */}
      <aside className="w-72 bg-surface-elevated border-r border-border flex flex-col">
        {/* Logo Section */}
        <div className="px-6 py-6 border-b border-border">
          <div className="relative w-full max-w-[220px] aspect-square mx-auto rounded-xl overflow-hidden bg-black">
            <Image
              src="/logo.png"
              alt="SSII"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        
        {/* Navigation */}
        <NavigationSection pathname={pathname} />

        {/* User Section */}
        <UserSection />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen">
        <div className="w-full px-6 lg:px-10 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}

function NavigationSection({ pathname }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user/current')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
        }
      })
      .catch(() => {
        // Fallback for development
        setUser({
          name: 'Dev User',
          email: 'dev@ssii.com',
          role: { name: 'Administrator', permissions: '["*"]' }
        })
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading || !user) {
    return (
      <nav className="flex-1 p-6">
        <div className="space-y-8 text-[15px]">
          <div className="nav-section">
            <div className="h-4 bg-surface-elevated rounded animate-pulse mb-4"></div>
            <div className="space-y-1.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 bg-surface-elevated rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </nav>
    )
  }

  const navigation = getNavigation(user)

  return (
    <nav className="flex-1 p-6">
      <div className="space-y-6">
        {/* Main Navigation */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-muted uppercase tracking-wider px-3">Main</div>
          <div className="space-y-1">
            {navigation.slice(0, 2).map(item => (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === item.href 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "text-muted hover:text-primary hover:bg-primary/5"
                )}
              >
                <item.icon className="w-5 h-5 mr-3 shrink-0" />
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Transactions Section */}
        {navigation.find(item => item.name === 'Transactions') && (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-muted uppercase tracking-wider px-3">Transactions</div>
            <div className="space-y-1">
              {navigation.find(item => item.name === 'Transactions')?.children?.map(child => (
                <Link
                  key={child.name}
                  href={child.href}
                  className={clsx(
                    "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    pathname === child.href 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "text-muted hover:text-primary hover:bg-primary/5"
                  )}
                >
                  <child.icon className="w-4 h-4 mr-3 shrink-0" />
                  {child.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Reports & Data Section */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-muted uppercase tracking-wider px-3">Reports & Data</div>
          <div className="space-y-1">
            {navigation.slice(2).filter(item => item.name !== 'Transactions').map(item => (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === item.href 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "text-muted hover:text-primary hover:bg-primary/5"
                )}
              >
                <item.icon className="w-5 h-5 mr-3 shrink-0" />
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Administration Section */}
        {(hasPermission(user, PERMISSIONS.ADMIN_VIEW) || hasPermission(user, PERMISSIONS.USERS_VIEW)) && (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-muted uppercase tracking-wider px-3">Administration</div>
            <div className="space-y-1">
              {hasPermission(user, PERMISSIONS.ADMIN_VIEW) && (
                <Link
                  href="/dashboard/admin"
                  className={clsx(
                    "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    pathname.startsWith('/dashboard/admin') 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "text-muted hover:text-primary hover:bg-primary/5"
                  )}
                >
                  <Settings className="w-5 h-5 mr-3 shrink-0" />
                  References
                </Link>
              )}
              {hasPermission(user, PERMISSIONS.USERS_VIEW) && (
                <Link
                  href="/dashboard/users"
                  className={clsx(
                    "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    pathname.startsWith('/dashboard/users') 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "text-muted hover:text-primary hover:bg-primary/5"
                  )}
                >
                  <Users className="w-5 h-5 mr-3 shrink-0" />
                  Users
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

function UserSection() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Get user from session/token
    // For now, fetch the dev user
    fetch('/api/user/current')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
        } else {
          // Fallback to dev user for development
          setUser({
            name: 'Dev User',
            email: 'dev@ssii.com',
            role: { name: 'Administrator' }
          })
        }
      })
      .catch(() => {
        // Fallback to dev user for development
        setUser({
          name: 'Dev User',
          email: 'dev@ssii.com',
          role: { name: 'Administrator' }
        })
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 border-t border-border">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-surface-elevated rounded-lg animate-pulse"></div>
          <div className="flex-1">
            <div className="h-4 bg-surface-elevated rounded animate-pulse mb-1"></div>
            <div className="h-3 bg-surface-elevated rounded animate-pulse w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'DU'

  return (
    <div className="p-6 border-t border-border">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
          <span className="text-sm font-semibold text-primary">{initials}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-primary">{user?.name || 'Dev User'}</p>
          <p className="text-xs text-muted">{user?.role?.name || 'Administrator'}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <Link href="/dashboard/settings" className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-muted hover:text-primary hover:bg-primary/5 w-full text-left">
          <Settings className="w-4 h-4 mr-3" />
          Settings
        </Link>
        <button
          onClick={async () => {
            try {
              await fetch('/api/auth/signout', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
              })
              // Redirect to login page
              window.location.href = '/login'
            } catch (error) {
              console.error('Error signing out:', error)
              // Fallback: clear cookie manually and redirect
              document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
              window.location.href = '/login'
            }
          }}
          className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-muted hover:text-error hover:bg-error/10 w-full text-left"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
