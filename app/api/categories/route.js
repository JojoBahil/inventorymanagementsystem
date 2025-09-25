import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const name = (body?.name || '').trim()
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const existing = await prisma.category.findFirst({ where: { name } })
    if (existing) return NextResponse.json(existing)

    const created = await prisma.category.create({ data: { name } })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    const id = Number(body?.id)
    const name = (body?.name || '').trim()
    if (!id || !name) return NextResponse.json({ error: 'id and name required' }, { status: 400 })
    const updated = await prisma.category.update({ where: { id }, data: { name } })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json()
    const id = Number(body?.id)
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}


