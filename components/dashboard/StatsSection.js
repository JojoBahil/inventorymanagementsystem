'use client'

import { useState, useEffect } from 'react'
import { Package, ArrowDownToLine, ArrowUpFromLine, TrendingUp, TrendingDown } from 'lucide-react'
import clsx from 'clsx'

// Format currency as PHP (Philippine Peso)
const formatCurrency = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP'
})

function StatCard({ title, value, icon: Icon, color, trend, trendValue }) {
  const colorConfig = {
    success: {
      icon: 'bg-success/10 text-success',
      trend: trend > 0 ? 'text-success' : 'text-error'
    },
    warning: {
      icon: 'bg-warning/10 text-warning',
      trend: trend > 0 ? 'text-success' : 'text-error'
    },
    info: {
      icon: 'bg-info/10 text-info',
      trend: trend > 0 ? 'text-success' : 'text-error'
    },
    error: {
      icon: 'bg-error/10 text-error',
      trend: trend > 0 ? 'text-success' : 'text-error'
    }
  }

  const config = colorConfig[color]

  return (
    <div className="stat-card animate-fade-in h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className={clsx('stat-card-icon', config.icon.split(' ')[0])}>
          <Icon className={clsx('w-6 h-6', config.icon.split(' ')[1])} />
        </div>
        {trend && (
          <div className={clsx('stat-card-trend flex items-center', config.trend)}>
            {trend > 0 ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 mr-1" />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      
      <div className="flex-1 flex flex-col justify-end">
        <div className="stat-card-value mb-2">{value}</div>
        <div className="stat-card-label">{title}</div>
      </div>
    </div>
  )
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
    <div className="flex gap-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="stat-card flex-1">
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
    <div className="flex gap-6">
      <StatCard
        title="Total Stock Value"
        value={formatCurrency.format(stats.stockValue)}
        icon={ArrowDownToLine}
        color="success"
        trend={12}
      />
      <StatCard
        title="Items Below Min"
        value={stats.itemsBelowMin}
        icon={Package}
        color="warning"
        trend={-5}
      />
      <StatCard
        title="Today's Receipts"
        value={stats.receipts}
        icon={ArrowDownToLine}
        color="info"
      />
      <StatCard
        title="Today's Issues"
        value={stats.issues}
        icon={ArrowUpFromLine}
        color="error"
      />
    </div>
  )
}