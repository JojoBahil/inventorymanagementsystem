import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get total stock value - simplified query
    const stocks = await prisma.stock.findMany({
      include: {
        item: true
      }
    })

    const stockValue = stocks.reduce((total, stock) => {
      return total + (Number(stock.quantity) * (Number(stock.item?.standardCost) || 0))
    }, 0)

    // Get items below minimum - using correct field names
    const itemsBelowMin = await prisma.item.findMany({
      where: {
        minStock: { not: null }
      },
      include: {
        stock: true
      }
    })

    // Calculate items below min in JS since we need to compare with minStock
    const belowMinCount = itemsBelowMin.filter(item => {
      const totalStock = item.stock.reduce((sum, stock) => sum + Number(stock.quantity), 0)
      return totalStock < Number(item.minStock)
    }).length

    // Get today's receipts and issues
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayMovements = await prisma.stockmovement.findMany({
      where: {
        createdAt: {
          gte: today
        }
      }
    })

    const receipts = todayMovements.filter(m => Number(m.qtyIn) > 0).length
    const issues = todayMovements.filter(m => Number(m.qtyOut) > 0).length

    return NextResponse.json({
      stockValue,
      itemsBelowMin: belowMinCount,
      receipts,
      issues
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
