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
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
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
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await prisma.company.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 })
  }
}


