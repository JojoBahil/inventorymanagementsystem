import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { getSessionUser } from '@/lib/auth'
import { createAuditLog } from '@/app/api/audit-logs/route'

// Body shape: { supplierId?, supplierName?, locationId, lines: [{ itemId, qty, unitCost }] }
export async function POST(request) {
  const body = await request.json()
  const { supplierId, supplierName, locationId, lines } = body || {}

  if (!Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json({ error: 'lines are required' }, { status: 400 })
  }

  // Get current user for audit logging
  const sessionUser = await getSessionUser()
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supplierCompanyId = await (async () => {
      if (supplierId) return Number(supplierId)
      if (supplierName) {
        const supplier = await prisma.company.findFirst({ where: { name: supplierName } })
        return supplier?.id ?? null
      }
      return null
    })()

    const result = await prisma.$transaction(async (tx) => {
      // Resolve destination location
      let dstLocationId = locationId ? Number(locationId) : null
      if (!dstLocationId) {
        const anyLoc = await tx.location.findFirst({ where: { isActive: true } })
        if (!anyLoc) throw new Error('No active location found')
        dstLocationId = anyLoc.id
      }
      // Create header
      const header = await tx.txnheader.create({
        data: {
          docNo: `GRN-${Date.now()}`,
          type: 'GRN',
          status: 'POSTED',
          supplierCompanyId,
        }
      })

      for (const line of lines) {
        const { itemId, qty, unitCost } = line
        if (!itemId || !qty || Number(qty) <= 0) continue

        // Create txn line (simple, using base UOM)
        const item = await tx.item.findFirst({ where: { id: itemId }, include: { uom: true } })
        if (!item) continue

        const tline = await tx.txnline.create({
          data: {
            headerId: header.id,
            itemId: item.id,
            uomId: item.baseUomId,
            locationId: dstLocationId,
            qty: new Prisma.Decimal(qty),
            unitCost: new Prisma.Decimal(unitCost ?? 0),
          }
        })

        // Post stock movement in
        await tx.stockmovement.create({
          data: {
            itemId: item.id,
            dstLocationId: dstLocationId,
            qtyIn: new Prisma.Decimal(qty),
            unitCost: new Prisma.Decimal(unitCost ?? 0),
            refHeaderId: header.id,
            refLineId: tline.id,
          }
        })

        // Upsert stock
        const existing = await tx.stock.findFirst({ where: { itemId: item.id, locationId: dstLocationId, lotId: null } })
        if (existing) {
          await tx.stock.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity.plus(new Prisma.Decimal(qty)) }
          })
        } else {
          await tx.stock.create({ data: { itemId: item.id, locationId: dstLocationId, quantity: new Prisma.Decimal(qty) } })
        }

        // Moving average cost update (global standardCost)
        const allStocks = await tx.stock.findMany({ where: { itemId: item.id } })
        const totalQty = allStocks.reduce((s, r) => s + Number(r.quantity), 0)
        const newStd = totalQty > 0 ? Number(unitCost ?? 0) : Number(item.standardCost)
        await tx.item.update({ where: { id: item.id }, data: { standardCost: newStd } })
      }

      return header
    })

    // Log the GRN creation with detailed item information
    try {
      console.log('Creating audit log for GRN:', result.id)
      
      // Get detailed item information for the audit log
      const itemDetails = await Promise.all(lines.map(async (line) => {
        const item = await prisma.item.findUnique({
          where: { id: line.itemId },
          include: { brand: true, category: true }
        })
        return {
          itemName: item?.name || 'Unknown Item',
          itemSku: item?.sku || 'N/A',
          brand: item?.brand?.name || 'N/A',
          category: item?.category?.name || 'N/A',
          quantity: Number(line.qty),
          unitCost: Number(line.unitCost || 0),
          totalAmount: Number(line.qty) * Number(line.unitCost || 0)
        }
      }))
      
             await createAuditLog(
               sessionUser.id,
               'CREATE',
               'GRN',
               result.id,
               {
                 supplierId: supplierCompanyId,
                 locationId,
                 itemCount: lines.length,
                 totalValue: lines.reduce((sum, line) => sum + (Number(line.qty) * Number(line.unitCost || 0)), 0),
                 items: itemDetails
               },
               request
             )
      console.log('Audit log created successfully for GRN:', result.id)
    } catch (auditError) {
      console.error('Failed to create audit log for GRN:', auditError)
      // Don't fail the GRN creation if audit logging fails
    }

    return NextResponse.json({ ok: true, headerId: result.id })
  } catch (error) {
    console.error('Error posting GRN:', error)
    return NextResponse.json({ error: 'Failed to post GRN' }, { status: 500 })
  }
}


