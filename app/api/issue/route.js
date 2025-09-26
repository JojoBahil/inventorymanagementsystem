import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// Body: { locationId, customerId?, customerName?, lines: [{ itemId, qty }] }
export async function POST(request) {
  const body = await request.json()
  const { locationId, customerId, customerName, lines } = body || {}
  if (!Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json({ error: 'lines are required' }, { status: 400 })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Resolve optional customer (branch)
      let customerCompanyId = null
      if (customerId) {
        customerCompanyId = Number(customerId)
      } else if (customerName) {
        const customer = await tx.company.findFirst({ where: { name: customerName, type: 'CUSTOMER' } })
        customerCompanyId = customer?.id ?? null
      }
      const header = await tx.txnheader.create({
        data: { docNo: `ISS-${Date.now()}`, type: 'ISSUE', status: 'POSTED', customerCompanyId }
      })

      for (const line of lines) {
        const { itemId, qty } = line
        if (!itemId || !qty || Number(qty) <= 0) continue

        const item = await tx.item.findFirst({ where: { id: itemId }, include: { uom: true } })
        if (!item) continue

        // Check stock on hand for given location (no lots for now)
        // Determine src location; if none provided, use any active location with stock
        let srcLocation = null
        if (locationId) {
          srcLocation = await tx.stock.findFirst({ where: { itemId: item.id, locationId, lotId: null } })
        } else {
          srcLocation = await tx.stock.findFirst({ where: { itemId: item.id, quantity: { gt: new Prisma.Decimal(0) } } })
        }
        const onHand = srcLocation ? Number(srcLocation.quantity) : 0
        const srcLocId = srcLocation ? srcLocation.locationId : locationId
        if (onHand < Number(qty)) {
          throw new Error(`Insufficient stock for ${item.name}. On hand: ${onHand}`)
        }

        const tline = await tx.txnline.create({
          data: {
            headerId: header.id,
            itemId: item.id,
            uomId: item.baseUomId,
            locationId: srcLocId,
            qty: new Prisma.Decimal(qty),
            unitCost: item.standardCost, // use current standard cost
          }
        })

        await tx.stockmovement.create({
          data: {
            itemId: item.id,
            srcLocationId: srcLocId,
            qtyOut: new Prisma.Decimal(qty),
            unitCost: item.standardCost,
            refHeaderId: header.id,
            refLineId: tline.id,
          }
        })

        // Reduce stock
        await tx.stock.update({
          where: { id: srcLocation.id },
          data: { quantity: srcLocation.quantity.minus(new Prisma.Decimal(qty)) }
        })
      }

      return header
    })

    return NextResponse.json({ ok: true, headerId: result.id })
  } catch (error) {
    console.error('Error posting Issue:', error)
    return NextResponse.json({ error: error.message || 'Failed to post Issue' }, { status: 400 })
  }
}


