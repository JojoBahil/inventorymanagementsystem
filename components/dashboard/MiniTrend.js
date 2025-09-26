'use client'

import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

function TrendChart({ data }) {
  if (!data || data.length === 0) return null

  // Use actual stock value for each day
  const trendData = data.map(day => day.stockValue || 0)

  // Calculate cumulative branch transfers
  let cumulativeBranchTransfers = 0
  const branchTransfersData = data.map(day => {
    cumulativeBranchTransfers += day.branchTransfers
    return cumulativeBranchTransfers
  })

  const labels = data.map(day => 
    new Date(day.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  )

  // Chart.js configuration
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 11
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      }
    }
  }

  // Inventory value trend chart data
  const inventoryTrendChartData = {
    labels,
    datasets: [
      {
        label: 'Total Stock Value',
        data: trendData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: trendData.map(value =>
          value >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
        ),
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  }

  // Branch transfers chart data
  const branchTransfersChartData = {
    labels,
    datasets: [
      {
        label: 'Branch Transfers Trend',
        data: branchTransfersData,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  }

  // Inventory value bar chart data
  const inventoryBarChartData = {
    labels,
    datasets: [
      {
        label: 'Value In',
        data: data.map(day => day.inValue),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      },
      {
        label: 'Value Out',
        data: data.map(day => day.outValue),
        backgroundColor: 'rgba(245, 158, 11, 0.6)',
        borderColor: 'rgb(245, 158, 11)',
        borderWidth: 1
      }
    ]
  }

  // Daily usage breakdown bar chart
  const dailyUsageChartData = {
    labels,
    datasets: [
      {
        label: 'Branch Transfers',
        data: data.map(day => day.branchTransfers),
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1
      },
      {
        label: 'Internal Usage',
        data: data.map(day => day.internalUsage),
        backgroundColor: 'rgba(245, 158, 11, 0.6)',
        borderColor: 'rgb(245, 158, 11)',
        borderWidth: 1
      }
    ]
  }

  return (
    <div className="p-4 space-y-6">
      {/* Side by side charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left side - Inventory Value Charts */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-primary mb-3">Inventory Value Trend</h4>
            <div className="h-32">
              <Line data={inventoryTrendChartData} options={chartOptions} />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-primary mb-3">Daily Value Activity</h4>
            <div className="h-32">
              <Bar data={inventoryBarChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Right side - Usage Analysis Charts */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-primary mb-3">Branch Transfers Trend</h4>
            <div className="h-32">
              <Line data={branchTransfersChartData} options={chartOptions} />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-primary mb-3">Daily Usage Breakdown</h4>
            <div className="h-32">
              <Bar data={dailyUsageChartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function MiniTrend() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/stats/trend', { cache: 'no-store' })
        const data = res.ok ? await res.json() : []
        setRows(Array.isArray(data) ? data : [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="table-container">
      <div className="px-4 py-3 border-b border-border bg-surface-elevated">
        <h3 className="text-sm font-semibold text-primary">Last 7 Days Trend</h3>
      </div>
      
      {loading ? (
        <div className="p-8 text-center text-muted">
          <div className="animate-pulse">Loading chart...</div>
        </div>
      ) : rows.length === 0 ? (
        <div className="p-8 text-center text-muted">No activity in the last 7 days</div>
      ) : (
        <TrendChart data={rows} />
      )}
    </div>
  )
}


