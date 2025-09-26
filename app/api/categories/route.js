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
    return NextResponse.json([])
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
    const force = body?.force === true
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    // Check if category is being used by items
    const itemsUsingCategory = await prisma.item.count({
      where: { categoryId: id }
    })

    // Check if category has subcategories
    const subcategories = await prisma.category.count({
      where: { parentId: id }
    })

    // If not forcing deletion and there are references, return warning
    if (!force && (itemsUsingCategory > 0 || subcategories > 0)) {
      const warnings = []
      if (itemsUsingCategory > 0) warnings.push(`${itemsUsingCategory} item(s)`)
      if (subcategories > 0) warnings.push(`${subcategories} subcategory(ies)`)
      
      return NextResponse.json({ 
        error: `This category is currently being used by ${warnings.join(', ')}. Deleting it will remove the category reference from these records. Do you want to continue?`,
        requiresConfirmation: true,
        affectedRecords: {
          items: itemsUsingCategory,
          subcategories: subcategories
        }
      }, { status: 400 })
    }

    // If forcing deletion or no references, proceed with deletion
    if (force || itemsUsingCategory > 0 || subcategories > 0) {
      // Remove category references from items (set to null)
      if (itemsUsingCategory > 0) {
        await prisma.item.updateMany({
          where: { categoryId: id },
          data: { categoryId: null }
        })
      }

      // Delete subcategories first
      if (subcategories > 0) {
        await prisma.category.deleteMany({
          where: { parentId: id }
        })
      }
    }

    // Delete the category
    await prisma.category.delete({ where: { id } })
    
    return NextResponse.json({ 
      ok: true,
      message: `Category deleted successfully. ${itemsUsingCategory > 0 ? `${itemsUsingCategory} item(s) now have no category assigned.` : ''}${subcategories > 0 ? ` ${subcategories} subcategory(ies) were also deleted.` : ''}`
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}


