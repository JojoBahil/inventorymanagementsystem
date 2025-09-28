'use client'

import { LayoutDashboard, Package, FileText, ArrowDownToLine, ArrowUpFromLine, FileSpreadsheet, LogOut, Settings, Users, Menu, X } from 'lucide-react'
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


  return baseNav
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex bg-background">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-surface border border-border rounded-lg shadow-lg"
      >
        <Menu className="w-5 h-5 text-primary" />
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="mobile-overlay lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modern Sidebar */}
      <aside className={clsx(
        "w-[400px] sm:w-[400px] lg:w-[400px] 2xl:w-[450px] bg-surface-elevated border-r border-border flex flex-col transition-all duration-300",
        "lg:relative lg:translate-x-0 lg:h-auto lg:min-h-screen",
        "fixed top-0 left-0 h-full z-50",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Mobile Close Button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-muted hover:text-primary"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo Section */}
        <div className="px-3 sm:px-6 py-3 sm:py-6 border-b border-border">
          <div className="relative w-full max-w-[120px] sm:max-w-[220px] 2xl:max-w-[240px] aspect-square mx-auto rounded-xl overflow-hidden bg-black">
            <Image
              src="/logo.png"
              alt="SSII"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        
        {/* Navigation - Takes remaining space */}
        <div className="flex-1 overflow-y-auto">
          <NavigationSection pathname={pathname} />
        </div>

        {/* User Section - Sticky to bottom */}
        <div className="mt-auto">
          <UserSection />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen lg:ml-0">
        <div className="w-full px-4 sm:px-6 lg:px-10 2xl:px-12 py-8 pt-16 lg:pt-8">
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
    <nav className="flex-1 p-3 sm:p-6 2xl:p-8">
      <div className="space-y-3 sm:space-y-6 2xl:space-y-8">
        {/* Main Navigation */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-muted uppercase tracking-wider px-3">Main</div>
          <div className="space-y-1">
            {navigation.slice(0, 2).map(item => (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  "flex items-center px-2 sm:px-3 2xl:px-4 py-2 sm:py-2.5 2xl:py-3 rounded-lg text-xs sm:text-sm 2xl:text-base font-medium transition-all duration-200",
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
                    "flex items-center px-2 sm:px-3 2xl:px-4 py-2 sm:py-2.5 2xl:py-3 rounded-lg text-xs sm:text-sm 2xl:text-base font-medium transition-all duration-200",
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
                  "flex items-center px-2 sm:px-3 2xl:px-4 py-2 sm:py-2.5 2xl:py-3 rounded-lg text-xs sm:text-sm 2xl:text-base font-medium transition-all duration-200",
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
                    "flex items-center px-2 sm:px-3 2xl:px-4 py-2 sm:py-2.5 2xl:py-3 rounded-lg text-xs sm:text-sm 2xl:text-base font-medium transition-all duration-200",
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
                    "flex items-center px-2 sm:px-3 2xl:px-4 py-2 sm:py-2.5 2xl:py-3 rounded-lg text-xs sm:text-sm 2xl:text-base font-medium transition-all duration-200",
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
    <div className="p-3 sm:p-6 2xl:p-8 border-t border-border sidebar-user-section">
      <div className="flex items-center space-x-2 sm:space-x-3 2xl:space-x-4 mb-3 sm:mb-4 2xl:mb-6">
        <div className="w-7 h-7 sm:w-10 sm:h-10 2xl:w-12 2xl:h-12 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center border border-primary/20 flex-shrink-0">
          <span className="text-primary font-semibold text-xs sm:text-sm 2xl:text-base">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm 2xl:text-base font-semibold text-primary truncate">{user?.name || 'Dev User'}</p>
          <p className="text-xs 2xl:text-sm text-muted truncate">{user?.role?.name || 'Administrator'}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <Link 
          href="/dashboard/settings" 
          className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-primary hover:bg-primary/5 transition-all duration-200 w-full"
        >
          <Settings className="w-4 h-4 mr-3" />
          Settings
        </Link>
        <Link 
          href="#"
          onClick={async (e) => {
            e.preventDefault()
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
          className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-primary hover:bg-primary/5 transition-all duration-200 w-full"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sign Out
        </Link>
      </div>
    </div>
  )
}