import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(request, { params }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      )
    }

    // Check if item exists
    const item = await prisma.item.findUnique({
      where: { id: parseInt(id) },
      include: {
        stock: true
      }
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    // Check if item has stock movements (transactions)
    const hasMovements = await prisma.stockmovement.findFirst({
      where: { itemId: parseInt(id) }
    })

    if (hasMovements) {
      return NextResponse.json(
        { error: 'Cannot delete item with transaction history. Consider deactivating instead.' },
        { status: 400 }
      )
    }

    // Delete associated stock records first
    await prisma.stock.deleteMany({
      where: { itemId: parseInt(id) }
    })

    // Delete the item
    await prisma.item.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json(
      { message: 'Item deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, description, category, unit, minStock, maxStock, brand, supplierName } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!name || !unit || !brand) {
      return NextResponse.json(
        { error: 'Name, unit, and brand are required' },
        { status: 400 }
      )
    }

    // Check if item exists
    const existingItem = await prisma.item.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    // Find or create the UOM (Unit of Measure)
    let uom = await prisma.uom.findFirst({
      where: { name: unit }
    })

    if (!uom) {
      uom = await prisma.uom.create({
        data: {
          code: unit.toUpperCase().replace(/\s+/g, '_'),
          name: unit,
          defaultFactor: 1.0
        }
      })
    }

    // Find category if provided
    let categoryId = null
    if (category) {
      const categoryRecord = await prisma.category.findFirst({
        where: { name: category }
      })
      if (categoryRecord) {
        categoryId = categoryRecord.id
      }
    }

    // Resolve optional brand (create if doesn't exist)
    let brandId = null
    if (brand && brand.trim()) {
      let brandRecord = await prisma.brand.findFirst({ where: { name: brand.trim() } })
      if (!brandRecord) {
        brandRecord = await prisma.brand.create({
          data: {
            name: brand.trim(),
            isActive: true
          }
        })
      }
      brandId = brandRecord.id
    }

    // Resolve optional supplier by name -> company.id
    let defaultSupplierCompanyId = null
    if (supplierName) {
      const supplier = await prisma.company.findFirst({ where: { name: supplierName } })
      if (supplier) defaultSupplierCompanyId = supplier.id
    }

    // Update the item
    const updatedItem = await prisma.item.update({
      where: { id: parseInt(id) },
      data: {
        name,
        categoryId,
        brandId,
        defaultSupplierCompanyId,
        baseUomId: uom.id,
        minStock: minStock ? parseFloat(minStock) : null,
        // standardCost is not updated here - it's managed through stock receipts
      },
      include: {
        category: true,
        uom: true,
        brand: true
      }
    })

    return NextResponse.json(updatedItem, { status: 200 })
  } catch (error) {
    console.error('Error updating item:', error)
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    )
  }
}
