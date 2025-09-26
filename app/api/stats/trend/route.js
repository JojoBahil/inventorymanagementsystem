import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function toDateKey(d) {
  const dd = new Date(d)
  dd.setHours(0, 0, 0, 0)
  const year = dd.getFullYear()
  const month = String(dd.getMonth() + 1).padStart(2, '0')
  const day = String(dd.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function GET() {
  try {
    const end = new Date()
    end.setHours(0, 0, 0, 0)
    const start = new Date(end)
    start.setDate(start.getDate() - 6)

    // Get current stock values to calculate starting point
    const currentStocks = await prisma.stock.findMany({
      include: { item: true }
    })

    // Calculate current total stock value
    const currentStockValue = currentStocks.reduce((total, s) => {
      return total + Number(s.quantity) * (Number(s.item?.standardCost) || 0)
    }, 0)

    // Build per-item current quantities
    const currentQuantitiesByItem = new Map()
    for (const s of currentStocks) {
      const key = s.itemId
      currentQuantitiesByItem.set(key, (currentQuantitiesByItem.get(key) || 0) + Number(s.quantity))
    }

    const movements = await prisma.stockmovement.findMany({
      where: {
        createdAt: {
          gte: start,
          lt: new Date(end.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      select: { 
        createdAt: true, 
        qtyIn: true, 
        qtyOut: true, 
        unitCost: true,
        itemId: true,
        item: {
          select: {
            name: true,
            standardCost: true,
            uom: {
              select: {
                name: true
              }
            }
          }
        },
        txnheader: {
          select: {
            type: true,
            customerCompanyId: true,
            company_txnheader_customerCompanyIdTocompany: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    // Group movements by day
    const movementsByDay = new Map()
    for (const m of movements) {
      const key = toDateKey(m.createdAt)
      if (!movementsByDay.has(key)) {
        movementsByDay.set(key, [])
      }
      movementsByDay.get(key).push(m)
    }

    const byDay = new Map()
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const key = toDateKey(d)
      
      // Get movements for this day
      const dayMovements = movementsByDay.get(key) || []
      
      let dayIn = 0
      let dayOut = 0
      let dayInValue = 0
      let dayOutValue = 0
      let dayBranchTransfers = 0
      let dayInternalUsage = 0

      // Process movements for this day
      for (const m of dayMovements) {
        const qtyIn = Number(m.qtyIn || 0)
        const qtyOut = Number(m.qtyOut || 0)
        const unitCost = Number(m.unitCost || 0)
        
        // Raw quantities
        dayIn += qtyIn
        dayOut += qtyOut
        
        // Value-based calculations
        dayInValue += qtyIn * unitCost
        dayOutValue += qtyOut * unitCost
        
        // Branch transfers vs internal usage
        const isBranchTransfer = m.txnheader?.type === 'ISSUE' && m.txnheader?.customerCompanyId
        const isInternalUsage = m.txnheader?.type === 'ISSUE' && !m.txnheader?.customerCompanyId
        
        if (isBranchTransfer && qtyOut > 0) {
          dayBranchTransfers += qtyOut * unitCost
        } else if (isInternalUsage && qtyOut > 0) {
          dayInternalUsage += qtyOut * unitCost
        }
      }

      // For stock value, if this is today, use current stock value
      // Otherwise, calculate what the stock value was on this day
      let dayStockValue = currentStockValue
      
      if (key !== toDateKey(end)) {
        // This is not today, so calculate the stock value for this day
        // Start with current quantities and work backwards
        let dayQuantitiesByItem = new Map(currentQuantitiesByItem)
        
        // Subtract all movements from this day onwards to get quantities on this day
        for (let j = i; j < 7; j++) {
          const futureDay = new Date(start)
          futureDay.setDate(start.getDate() + j)
          const futureKey = toDateKey(futureDay)
          const futureMovements = movementsByDay.get(futureKey) || []
          
          for (const m of futureMovements) {
            const qtyIn = Number(m.qtyIn || 0)
            const qtyOut = Number(m.qtyOut || 0)
            const currentQty = dayQuantitiesByItem.get(m.itemId) || 0
            dayQuantitiesByItem.set(m.itemId, currentQty - qtyIn + qtyOut)
          }
        }
        
        // Calculate stock value for this day using standard costs
        dayStockValue = 0
        for (const [itemId, qty] of dayQuantitiesByItem) {
          const item = currentStocks.find(s => s.itemId === itemId)?.item
          if (item) {
            dayStockValue += qty * Number(item.standardCost || 0)
          }
        }
      }

      byDay.set(key, {
        date: key,
        in: dayIn,
        out: dayOut,
        inValue: dayInValue,
        outValue: dayOutValue,
        netValue: dayInValue - dayOutValue,
        branchTransfers: dayBranchTransfers,
        internalUsage: dayInternalUsage,
        stockValue: dayStockValue
      })
    }

    const rows = Array.from(byDay.values()).map(r => ({ 
      ...r, 
      net: r.in - r.out
    }))
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error building trend:', error)
    return NextResponse.json({ error: 'Failed to fetch trend' }, { status: 500 })
  }
}


