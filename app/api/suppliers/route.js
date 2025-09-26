import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const suppliers = await prisma.company.findMany({
      where: { type: 'SUPPLIER', isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(suppliers)
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json([])
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const name = (body?.name || '').trim()
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    let supplier = await prisma.company.findFirst({ where: { name, type: 'SUPPLIER' } })
    if (!supplier) {
      supplier = await prisma.company.create({ data: { name, code: `SUP-${Date.now()}`, type: 'SUPPLIER', isActive: true } })
    }
    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    const id = Number(body?.id)
    const name = (body?.name || '').trim()
    if (!id || !name) return NextResponse.json({ error: 'id and name required' }, { status: 400 })
    const updated = await prisma.company.update({ where: { id }, data: { name } })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating supplier:', error)
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json()
    const id = Number(body?.id)
    const force = body?.force === true
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    // Check if supplier is being used by items
    const itemsUsingSupplier = await prisma.item.count({
      where: { defaultSupplierCompanyId: id }
    })

    // Check if supplier has transaction headers
    const txnHeaders = await prisma.txnheader.count({
      where: { 
        OR: [
          { companyId: id },
          { supplierCompanyId: id }
        ]
      }
    })

    // If not forcing deletion and there are references, return warning
    if (!force && (itemsUsingSupplier > 0 || txnHeaders > 0)) {
      const warnings = []
      if (itemsUsingSupplier > 0) warnings.push(`${itemsUsingSupplier} item(s)`)
      if (txnHeaders > 0) warnings.push(`${txnHeaders} transaction(s)`)
      
      return NextResponse.json({ 
        error: `This supplier is currently being used by ${warnings.join(', ')}. Deleting it will remove the supplier reference from these records. Do you want to continue?`,
        requiresConfirmation: true,
        affectedRecords: {
          items: itemsUsingSupplier,
          transactions: txnHeaders
        }
      }, { status: 400 })
    }

    // If forcing deletion or no references, proceed with deletion
    if (force || itemsUsingSupplier > 0 || txnHeaders > 0) {
      // Remove supplier references from items (set to null)
      if (itemsUsingSupplier > 0) {
        await prisma.item.updateMany({
          where: { defaultSupplierCompanyId: id },
          data: { defaultSupplierCompanyId: null }
        })
      }

      // Note: We don't delete transaction headers as they are historical records
      // The supplier reference will remain in transactions for audit purposes
    }

    // Delete the supplier
    await prisma.company.delete({ where: { id } })
    
    return NextResponse.json({ 
      ok: true,
      message: `Supplier deleted successfully. ${itemsUsingSupplier > 0 ? `${itemsUsingSupplier} item(s) now have no supplier assigned.` : ''}${txnHeaders > 0 ? ` ${txnHeaders} transaction(s) will keep the supplier reference for historical records.` : ''}`
    })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 })
  }
}


