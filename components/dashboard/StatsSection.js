'use client'

import { useState, useEffect } from 'react'
import { Package, ArrowDownToLine, ArrowUpFromLine, TrendingDown, ExternalLink } from 'lucide-react'
import clsx from 'clsx'
import Link from 'next/link'

// Format currency as PHP (Philippine Peso)
const formatCurrency = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP'
})

function StatCard({ title, value, icon: Icon, color, href, isClickable = false }) {
  const colorConfig = {
    primary: {
      icon: 'bg-primary/10 text-primary'
    },
    success: {
      icon: 'bg-success/10 text-success'
    },
    warning: {
      icon: 'bg-warning/10 text-warning'
    },
    info: {
      icon: 'bg-info/10 text-info'
    },
    error: {
      icon: 'bg-error/10 text-error'
    }
  }

  const config = colorConfig[color]

  const cardContent = (
    <div className={clsx(
      'stat-card p-6 animate-fade-in h-full flex flex-col w-full',
      isClickable && 'cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105'
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className={clsx('stat-card-icon', config.icon.split(' ')[0])}>
          <Icon className={clsx('w-6 h-6', config.icon.split(' ')[1])} />
        </div>
        {isClickable && (
          <ExternalLink className="w-4 h-4 text-muted opacity-60" />
        )}
      </div>
      
      <div className="flex-1 flex flex-col justify-end">
        <div className="stat-card-value mb-2">{value}</div>
        <div className="stat-card-label">{title}</div>
      </div>
    </div>
  )

  if (isClickable && href) {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}

async function fetchStats() {
  try {
    const response = await fetch('/api/stats', {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch stats')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching stats:', error)
      return {
        stockValue: 0,
        itemsBelowMin: 0,
        receipts: 0,
        issues: 0
      }
  }
}

function StatsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="stat-card p-6 flex-1 w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl skeleton"></div>
            <div className="h-4 rounded w-12 skeleton"></div>
          </div>
          <div className="flex-1 flex flex-col justify-end">
            <div className="h-8 rounded w-3/4 skeleton mb-2"></div>
            <div className="h-4 rounded w-1/2 skeleton"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function StatsSection() {
  const [stats, setStats] = useState({
    stockValue: 0,
    itemsBelowMin: 0,
    receipts: 0,
    issues: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const data = await fetchStats()
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  if (isLoading) {
    return <StatsLoadingSkeleton />
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      <StatCard
        title="Total Stock Value"
        value={formatCurrency.format(stats.stockValue)}
        icon={Package}
        color="primary"
      />
      <StatCard
        title="Items Below Min"
        value={stats.itemsBelowMin.toString()}
        icon={TrendingDown}
        color="warning"
        href="/reports/low-stock"
        isClickable={stats.itemsBelowMin > 0}
      />
      <StatCard
        title="Today's Receipts"
        value={stats.receipts.toString()}
        icon={ArrowDownToLine}
        color="success"
      />
      <StatCard
        title="Today's Issues"
        value={stats.issues.toString()}
        icon={ArrowUpFromLine}
        color="info"
      />
    </div>
  )
}