import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const customers = await prisma.company.findMany({
      where: { type: 'CUSTOMER', isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(customers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json([])
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const name = (body?.name || '').trim()
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    let customer = await prisma.company.findFirst({ where: { name, type: 'CUSTOMER' } })
    if (!customer) {
      customer = await prisma.company.create({ data: { name, code: `CUS-${Date.now()}`, type: 'CUSTOMER', isActive: true } })
    }
    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
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
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json()
    const id = Number(body?.id)
    const force = body?.force === true
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    // Check if customer has transaction headers
    const txnHeaders = await prisma.txnheader.count({
      where: { customerCompanyId: id }
    })

    // Check if customer has price lists
    const priceLists = await prisma.pricelist.count({
      where: { customerId: id }
    })

    // If not forcing deletion and there are references, return warning
    if (!force && (txnHeaders > 0 || priceLists > 0)) {
      const warnings = []
      if (txnHeaders > 0) warnings.push(`${txnHeaders} transaction(s)`)
      if (priceLists > 0) warnings.push(`${priceLists} price list(s)`)
      
      return NextResponse.json({ 
        error: `This customer is currently being used by ${warnings.join(', ')}. Deleting it will remove the customer reference from these records. Do you want to continue?`,
        requiresConfirmation: true,
        affectedRecords: {
          transactions: txnHeaders,
          priceLists: priceLists
        }
      }, { status: 400 })
    }

    // If forcing deletion or no references, proceed with deletion
    if (force || txnHeaders > 0 || priceLists > 0) {
      // Delete price lists that use this customer
      if (priceLists > 0) {
        await prisma.pricelist.deleteMany({
          where: { customerId: id }
        })
      }

      // Note: We don't delete transaction headers as they are historical records
      // The customer reference will remain in transactions for audit purposes
    }

    // Delete the customer
    await prisma.company.delete({ where: { id } })
    
    return NextResponse.json({ 
      ok: true,
      message: `Customer deleted successfully. ${priceLists > 0 ? `${priceLists} price list(s) were deleted.` : ''}${txnHeaders > 0 ? ` ${txnHeaders} transaction(s) will keep the customer reference for historical records.` : ''}`
    })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}


