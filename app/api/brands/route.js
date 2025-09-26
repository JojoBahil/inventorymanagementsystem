import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        isActive: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(brands)
  } catch (error) {
    console.error('Error fetching brands:', error)
    return NextResponse.json([])
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const name = (body?.name || '').trim()
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const existing = await prisma.brand.findFirst({ where: { name } })
    if (existing) return NextResponse.json(existing)

    const created = await prisma.brand.create({ data: { name, isActive: true } })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Error creating brand:', error)
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    const id = Number(body?.id)
    const name = (body?.name || '').trim()
    if (!id || !name) return NextResponse.json({ error: 'id and name required' }, { status: 400 })
    const updated = await prisma.brand.update({ where: { id }, data: { name } })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating brand:', error)
    return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json()
    const id = Number(body?.id)
    const force = body?.force === true
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    // Check if brand is being used by items
    const itemsUsingBrand = await prisma.item.count({
      where: { brandId: id }
    })

    // If not forcing deletion and there are references, return warning
    if (!force && itemsUsingBrand > 0) {
      return NextResponse.json({ 
        error: `This brand is currently being used by ${itemsUsingBrand} item(s). Deleting it will remove the brand reference from these records. Do you want to continue?`,
        requiresConfirmation: true,
        affectedRecords: {
          items: itemsUsingBrand
        }
      }, { status: 400 })
    }

    // If forcing deletion or no references, proceed with deletion
    if (force || itemsUsingBrand > 0) {
      // Remove brand references from items (set to null)
      if (itemsUsingBrand > 0) {
        await prisma.item.updateMany({
          where: { brandId: id },
          data: { brandId: null }
        })
      }
    }

    // Delete the brand
    await prisma.brand.delete({ where: { id } })
    
    return NextResponse.json({ 
      ok: true,
      message: `Brand deleted successfully. ${itemsUsingBrand > 0 ? `${itemsUsingBrand} item(s) now have no brand assigned.` : ''}`
    })
  } catch (error) {
    console.error('Error deleting brand:', error)
    return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 })
  }
}