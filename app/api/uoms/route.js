import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const uoms = await prisma.uom.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(uoms)
  } catch (error) {
    console.error('Error fetching UOMs:', error)
    return NextResponse.json([])
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const code = (body?.code || '').trim().toUpperCase()
    const name = (body?.name || '').trim()
    if (!code || !name) {
      return NextResponse.json({ error: 'code and name are required' }, { status: 400 })
    }

    let uom = await prisma.uom.findFirst({ where: { OR: [{ code }, { name }] } })
    if (!uom) {
      uom = await prisma.uom.create({ data: { code, name, defaultFactor: 1.0 } })
    }
    return NextResponse.json(uom, { status: 201 })
  } catch (error) {
    console.error('Error creating UOM:', error)
    return NextResponse.json({ error: 'Failed to create UOM' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    const id = Number(body?.id)
    const code = (body?.code || '').trim().toUpperCase()
    const name = (body?.name || '').trim()
    if (!id || !code || !name) return NextResponse.json({ error: 'id, code, name required' }, { status: 400 })
    const updated = await prisma.uom.update({ where: { id }, data: { code, name } })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating UOM:', error)
    return NextResponse.json({ error: 'Failed to update UOM' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json()
    const id = Number(body?.id)
    const force = body?.force === true // Allow force deletion
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    // Check if UOM is being used by items
    const itemsUsingUom = await prisma.item.count({
      where: { baseUomId: id }
    })

    // Check if UOM is being used by price lists
    const priceListsUsingUom = await prisma.pricelist.count({
      where: { uomId: id }
    })

    // Check if UOM is being used by transaction lines
    const txnLinesUsingUom = await prisma.txnline.count({
      where: { uomId: id }
    })

    // If not forcing deletion and there are references, return warning
    if (!force && (itemsUsingUom > 0 || priceListsUsingUom > 0 || txnLinesUsingUom > 0)) {
      const warnings = []
      if (itemsUsingUom > 0) warnings.push(`${itemsUsingUom} item(s)`)
      if (priceListsUsingUom > 0) warnings.push(`${priceListsUsingUom} price list(s)`)
      if (txnLinesUsingUom > 0) warnings.push(`${txnLinesUsingUom} transaction line(s)`)
      
      return NextResponse.json({ 
        error: `This UOM is currently being used by ${warnings.join(', ')}. Deleting it will remove the UOM reference from these records. Do you want to continue?`,
        requiresConfirmation: true,
        affectedRecords: {
          items: itemsUsingUom,
          priceLists: priceListsUsingUom,
          txnLines: txnLinesUsingUom
        }
      }, { status: 400 })
    }

    // If forcing deletion or no references, proceed with deletion
    if (force || itemsUsingUom > 0 || priceListsUsingUom > 0 || txnLinesUsingUom > 0) {
      // Remove UOM references from items (set to null)
      if (itemsUsingUom > 0) {
        await prisma.item.updateMany({
          where: { baseUomId: id },
          data: { baseUomId: null }
        })
      }

      // Delete price lists that use this UOM
      if (priceListsUsingUom > 0) {
        await prisma.pricelist.deleteMany({
          where: { uomId: id }
        })
      }

      // Note: We don't delete transaction lines as they are historical records
      // The UOM reference will remain in transaction lines for audit purposes
    }

    // Delete the UOM
    await prisma.uom.delete({ where: { id } })
    
    return NextResponse.json({ 
      ok: true,
      message: `UOM deleted successfully. ${itemsUsingUom > 0 ? `${itemsUsingUom} item(s) now have no UOM assigned.` : ''}`
    })
  } catch (error) {
    console.error('Error deleting UOM:', error)
    return NextResponse.json({ error: 'Failed to delete UOM' }, { status: 500 })
  }
}

