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
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const brand = searchParams.get('brand')
    const status = searchParams.get('status')

    // Build where clause for items
    let itemWhereClause = {
      isActive: true
    }

    if (search) {
      itemWhereClause.OR = [
        { name: { contains: search } },
        { sku: { contains: search } }
      ]
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

    // Get all items with safe stock handling and proper filtering
    const allItems = await prisma.item.findMany({
      where: itemWhereClause,
      include: {
        category: true,
        brand: true,
        uom: true
      },
      orderBy: { name: 'asc' }
    })

    // Get stock data separately to avoid relationship issues
    const itemIds = allItems.map(item => item.id)
    const stockData = await prisma.stock.findMany({
      where: {
        itemId: { in: itemIds }
      },
      include: {
        location: true
      }
    })

    // Process items to calculate stock levels
    let processedItems = allItems.map(item => {
      // Find stock records for this item
      const itemStock = stockData.filter(s => s.itemId === item.id)
      const totalStock = itemStock.reduce((sum, s) => sum + Number(s.quantity), 0)
      const minStock = Number(item.minStock) || 0
      
      let stockStatus = 'in-stock'
      if (totalStock === 0) stockStatus = 'out-of-stock'
      else if (minStock > 0 && totalStock < minStock) stockStatus = 'below-min'

      return {
        ...item,
        totalStock,
        stockStatus,
        stockByLocation: itemStock.map(s => ({
          locationName: s.location?.name || 'Unknown Location',
          quantity: Number(s.quantity)
        }))
      }
    })

    // Apply status filter
    if (status) {
      processedItems = processedItems.filter(item => {
        switch (status) {
          case 'in-stock':
            return item.totalStock > 0
          case 'out-of-stock':
            return item.totalStock === 0
          case 'low-stock':
            return item.totalStock > 0 && item.minStock > 0 && item.totalStock < item.minStock
          case 'below-min':
            return item.minStock > 0 && item.totalStock < item.minStock
          default:
            return true
        }
      })
    }

    // Apply pagination after filtering
    const total = processedItems.length
    const paginatedItems = processedItems.slice(skip, skip + limit)

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
        statuses: [
          { value: 'in-stock', label: 'In Stock' },
          { value: 'out-of-stock', label: 'Out of Stock' },
          { value: 'low-stock', label: 'Low Stock' },
          { value: 'below-min', label: 'Below Minimum' }
        ]
      }
    })
  } catch (error) {
    console.error('Error fetching stock on hand report:', error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Failed to fetch stock on hand report', details: error.message },
      { status: 500 }
    )
  }
}
