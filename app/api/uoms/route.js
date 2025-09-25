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
    return NextResponse.json({ error: 'Failed to fetch UOMs' }, { status: 500 })
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
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await prisma.uom.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting UOM:', error)
    return NextResponse.json({ error: 'Failed to delete UOM' }, { status: 500 })
  }
}

