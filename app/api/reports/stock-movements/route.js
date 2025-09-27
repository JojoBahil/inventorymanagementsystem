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
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const type = searchParams.get('type')
    const item = searchParams.get('item')

    // Build where clause - simplified to avoid relationship issues
    let whereClause = {}

    // Date range filter
    if (dateFrom || dateTo) {
      whereClause.createdAt = {}
      if (dateFrom) {
        whereClause.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        whereClause.createdAt.lte = new Date(dateTo + 'T23:59:59')
      }
    }

    // Get all movements with safe relationship handling (no pagination yet)
    const movements = await prisma.stockmovement.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })

    // Get related data separately to avoid relationship issues
    const movementIds = movements.map(m => m.id)
    const itemIds = movements.map(m => m.itemId).filter(Boolean)
    const locationIds = [...new Set([
      ...movements.map(m => m.srcLocationId).filter(Boolean),
      ...movements.map(m => m.dstLocationId).filter(Boolean)
    ])]
    const refHeaderIds = movements.map(m => m.refHeaderId).filter(Boolean)

    const [items, locations, refHeaders] = await Promise.all([
      prisma.item.findMany({
        where: { id: { in: itemIds } },
        select: { id: true, name: true, sku: true }
      }),
      prisma.location.findMany({
        where: { id: { in: locationIds } },
        select: { id: true, name: true }
      }),
      prisma.txnheader.findMany({
        where: { id: { in: refHeaderIds } },
        select: { 
          id: true, 
          type: true, 
          docNo: true, 
          createdAt: true, 
          customerCompanyId: true,
          company_txnheader_customerCompanyIdTocompany: {
            select: { name: true }
          }
        }
      })
    ])

    // Get total count for date filtering only (before type/item filtering)
    const totalBeforeFilters = await prisma.stockmovement.count({ where: whereClause })

    // Process movements for display
    let processedMovements = movements.map(movement => {
      const qtyIn = Number(movement.qtyIn) || 0
      const qtyOut = Number(movement.qtyOut) || 0
      const unitCost = Number(movement.unitCost) || 0
      const totalValue = (qtyIn + qtyOut) * unitCost

      // Find related data
      const item = items.find(i => i.id === movement.itemId)
      const srcLocation = locations.find(l => l.id === movement.srcLocationId)
      const dstLocation = locations.find(l => l.id === movement.dstLocationId)
      const refHeader = refHeaders.find(r => r.id === movement.refHeaderId)

      // Determine destination based on transaction type
      let destination = 'Unknown'
      if (refHeader?.type === 'GRN') {
        // For GRN (Goods Receipt), destination is where items are received (dstLocation)
        destination = dstLocation?.name || 'Unknown Location'
      } else if (refHeader?.type === 'ISSUE') {
        // For ISSUE, destination is the customer/branch name or "SSI HQ" for in-house
        if (refHeader.company_txnheader_customerCompanyIdTocompany?.name) {
          destination = refHeader.company_txnheader_customerCompanyIdTocompany.name
        } else {
          destination = 'SSI HQ'
        }
      } else {
        // Fallback logic for other types
        destination = dstLocation?.name || srcLocation?.name || 'Unknown'
      }

      return {
        id: movement.id,
        timestamp: movement.createdAt.toISOString(),
        itemName: item?.name || 'Unknown Item',
        itemSku: item?.sku || 'UNKNOWN',
        type: refHeader?.type || 'UNKNOWN',
        qtyIn: qtyIn > 0 ? qtyIn : null,
        qtyOut: qtyOut > 0 ? qtyOut : null,
        destination,
        unitCost,
        totalValue,
        docNo: refHeader?.docNo
      }
    })

    // Apply type filter
    if (type) {
      processedMovements = processedMovements.filter(movement => movement.type === type)
    }

    // Apply item filter
    if (item) {
      processedMovements = processedMovements.filter(movement => 
        movement.itemName.toLowerCase().includes(item.toLowerCase())
      )
    }

    // Apply pagination after filtering
    const total = processedMovements.length
    const paginatedMovements = processedMovements.slice(skip, skip + limit)

    // Get unique types for filter options
    const uniqueTypes = await prisma.txnheader.findMany({
      select: { type: true },
      distinct: ['type'],
      where: { type: { in: ['GRN', 'ISSUE'] } }
    })

    return NextResponse.json({
      data: paginatedMovements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      filterOptions: {
        types: uniqueTypes.map(t => ({
          value: t.type,
          label: t.type === 'GRN' ? 'Received' : t.type === 'ISSUE' ? 'Issued' : t.type
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching stock movements report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock movements report' },
      { status: 500 }
    )
  }
}
