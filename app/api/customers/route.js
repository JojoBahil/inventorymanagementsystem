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
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
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
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await prisma.company.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}


