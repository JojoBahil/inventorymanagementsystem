import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // Check if we have any data at all
    const itemCount = await prisma.item.count()
    const stockCount = await prisma.stock.count()
    const movementCount = await prisma.stockmovement.count()

    // If no data exists, return empty stats
    if (itemCount === 0 && stockCount === 0 && movementCount === 0) {
      return NextResponse.json({
        stockValue: 0,
        itemsBelowMin: 0,
        receipts: 0,
        issues: 0,
        todaysBranchTransfers: 0,
        stockValueTrend: 0,
        itemsBelowMinTrend: 0
      })
    }

    // Get stocks without complex includes to avoid relationship issues
    const stocks = await prisma.stock.findMany()
    
    // Manually fetch item data for each stock
    const stocksWithItems = await Promise.all(stocks.map(async (stock) => {
      const item = await prisma.item.findUnique({ where: { id: stock.itemId } })
      return { ...stock, item }
    }))

    // Compute current stock value
    const stockValue = stocksWithItems.reduce((total, s) => {
      return total + Number(s.quantity) * (Number(s.item?.standardCost) || 0)
    }, 0)

    // Build per-item on hand now
    const onHandNowByItem = new Map()
    for (const s of stocksWithItems) {
      const key = s.itemId
      onHandNowByItem.set(key, (onHandNowByItem.get(key) || 0) + Number(s.quantity))
    }

    // Items with minStock
    const itemsWithMin = await prisma.item.findMany({
      where: { minStock: { not: null } },
      select: { id: true, minStock: true }
    })

    // Movements today for trend calculations
    const todaysMovements = await prisma.stockmovement.findMany({
      where: { createdAt: { gte: todayStart } }
    })
    
    // Manually fetch txnheader data for each movement
    const todaysMovementsWithTxn = await Promise.all(todaysMovements.map(async (movement) => {
      const txnheader = movement.refHeaderId ? await prisma.txnheader.findUnique({ 
        where: { id: movement.refHeaderId },
        select: {
          type: true,
          customerCompanyId: true
        }
      }) : null
      return { ...movement, txnheader }
    }))

    // Net value moved today and today's sales income
    const netValueToday = todaysMovementsWithTxn.reduce((sum, m) => {
      return sum + Number(m.qtyIn || 0) * Number(m.unitCost || 0) - Number(m.qtyOut || 0) * Number(m.unitCost || 0)
    }, 0)

    // Calculate today's branch transfers (at cost, no profit)
    const todaysBranchTransfers = todaysMovementsWithTxn.reduce((sum, m) => {
      if (m.txnheader?.type === 'ISSUE' && m.txnheader?.customerCompanyId && m.qtyOut) {
        return sum + Number(m.qtyOut) * Number(m.unitCost || 0)
      }
      return sum
    }, 0)

    // Per-item net qty today
    const netQtyTodayByItem = new Map()
    for (const m of todaysMovementsWithTxn) {
      const net = Number(m.qtyIn || 0) - Number(m.qtyOut || 0)
      netQtyTodayByItem.set(m.itemId, (netQtyTodayByItem.get(m.itemId) || 0) + net)
    }

    // Below-min now and at start-of-day (approx by removing today's net)
    let belowMinNow = 0
    let belowMinStart = 0
    for (const it of itemsWithMin) {
      const nowQty = onHandNowByItem.get(it.id) || 0
      const startQty = nowQty - (netQtyTodayByItem.get(it.id) || 0)
      if (nowQty < Number(it.minStock)) belowMinNow += 1
      if (startQty < Number(it.minStock)) belowMinStart += 1
    }

    const receipts = todaysMovementsWithTxn.filter(m => Number(m.qtyIn) > 0).length
    const issues = todaysMovementsWithTxn.filter(m => Number(m.qtyOut) > 0).length

    const stockValueTrend = (netValueToday / Math.max(stockValue || 0, 1)) * 100
    const itemsBelowMinTrend = ((belowMinNow - belowMinStart) / Math.max(belowMinStart || 0, 1)) * 100

    return NextResponse.json({
      stockValue,
      itemsBelowMin: belowMinNow,
      receipts,
      issues,
      todaysBranchTransfers,
      stockValueTrend,
      itemsBelowMinTrend
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    // Return empty stats instead of error
    return NextResponse.json({
      stockValue: 0,
      itemsBelowMin: 0,
      receipts: 0,
      issues: 0,
      todaysBranchTransfers: 0,
      stockValueTrend: 0,
      itemsBelowMinTrend: 0
    })
  }
}
