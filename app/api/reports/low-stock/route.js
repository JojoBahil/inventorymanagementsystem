import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export async function GET(request) {
  try {
    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Filter parameters
    const category = searchParams.get('category')
    const brand = searchParams.get('brand')
    const severity = searchParams.get('severity')

    // Build where clause for items
    let itemWhereClause = {
      isActive: true,
      minStock: { gt: 0 } // Only items with minimum stock set
    }

    if (category) {
      itemWhereClause.category = {
        name: { equals: category }
      }
    }

    if (brand) {
      itemWhereClause.brand = {
        name: { equals: brand }
      }
    }

    // Get all items that have minimum stock set (simplified query)
    const items = await prisma.item.findMany({
      where: itemWhereClause,
      include: {
        category: true,
        brand: true,
        uom: true
      },
      orderBy: { name: 'asc' }
    })

    // Get stock data separately to avoid relationship issues
    const itemIds = items.map(item => item.id)
    const stockData = await prisma.stock.findMany({
      where: {
        itemId: { in: itemIds }
      },
      include: {
        location: true
      }
    })

    // Process items to find those below minimum stock
    let lowStockItems = items.map(item => {
      // Find stock records for this item
      const itemStock = stockData.filter(s => s.itemId === item.id)
      const totalStock = itemStock.reduce((sum, s) => sum + Number(s.quantity), 0)
      const minStock = Number(item.minStock) || 0
      const percentage = minStock > 0 ? (totalStock / minStock) * 100 : 100
      
      let severityLevel = 'low'
      if (percentage <= 25) severityLevel = 'critical'
      else if (percentage <= 50) severityLevel = 'high'
      else if (percentage <= 75) severityLevel = 'medium'

      return {
        ...item,
        totalStock,
        percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
        severityLevel,
        reorderValue: (minStock - totalStock) * Number(item.standardCost || 0)
      }
    }).filter(item => item.totalStock < item.minStock) // Only items below minimum

    // Apply severity filter
    if (severity) {
      lowStockItems = lowStockItems.filter(item => item.severityLevel === severity)
    }

    // Sort by severity (most critical first)
    lowStockItems.sort((a, b) => a.percentage - b.percentage)

    // Apply pagination
    const total = lowStockItems.length
    const paginatedItems = lowStockItems.slice(skip, skip + limit)

    // Get filter options
    const [categories, brands] = await Promise.all([
      prisma.category.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      }),
      prisma.brand.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      })
    ])

    return NextResponse.json({
      data: paginatedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      filterOptions: {
        categories: categories.map(c => ({ value: c.name, label: c.name })),
        brands: brands.map(b => ({ value: b.name, label: b.name })),
        severities: [
          { value: 'critical', label: 'Critical (≤25%)' },
          { value: 'high', label: 'High (26-50%)' },
          { value: 'medium', label: 'Medium (51-75%)' },
          { value: 'low', label: 'Low (76-99%)' }
        ]
      }
    })
  } catch (error) {
    console.error('Error fetching low stock report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch low stock report' },
      { status: 500 }
    )
  }
}
