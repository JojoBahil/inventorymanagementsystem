import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { createAuditLog } from '@/app/api/audit-logs/route'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeStock = searchParams.get('includeStock') === 'true'
    
    const items = await prisma.item.findMany({
      include: {
        category: true,
        uom: true,
        brand: true,
        company: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // If stock is requested, calculate it separately
    if (includeStock) {
      const itemsWithStock = []
      for (const item of items) {
        const stockRecords = await prisma.stock.findMany({
          where: { itemId: item.id },
          include: { location: true }
        })
        itemsWithStock.push({
          ...item,
          stock: stockRecords
        })
      }
      return NextResponse.json({ items: itemsWithStock })
    }

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching items:', error)
    // Return empty array instead of error
    return NextResponse.json({ items: [] })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, description, category, unit, minStock, maxStock, brand, supplierName } = body

    // Get current user for audit logging
    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate required fields
    if (!name || !unit || !brand) {
      return NextResponse.json(
        { error: 'Name, unit, and brand are required' },
        { status: 400 }
      )
    }

    // Generate a unique SKU
    const timestamp = Date.now()
    const sku = `ITEM-${timestamp}`

    // Find the UOM (Unit of Measure) by code
    let uom = await prisma.uom.findFirst({
      where: { code: unit }
    })

    if (!uom) {
      return NextResponse.json({ error: `UOM with code '${unit}' not found. Please create it in References first.` }, { status: 400 })
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
        // Create new brand if it doesn't exist
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

    // Create the item
    const item = await prisma.item.create({
      data: {
        sku,
        name,
        barcode: null,
        categoryId,
        brandId,
        defaultSupplierCompanyId,
        baseUomId: uom.id,
        minStock: minStock ? parseFloat(minStock) : null,
        standardCost: 0, // Will be updated when stock is received
        isLotTracked: false,
        isSerialized: false,
        isActive: true
      },
      include: {
        category: true,
        uom: true,
        brand: true
      }
    })

    // Create initial stock setup for the new item
    // First, get or create a default location
    let location = await prisma.location.findFirst({
      where: { isActive: true }
    })

    if (!location) {
      // Create a default warehouse and location if none exist
      const defaultCompany = await prisma.company.findFirst()
      if (defaultCompany) {
               const warehouse = await prisma.warehouse.create({
                 data: {
                   companyId: defaultCompany.id,
                   code: 'MAIN',
                   name: 'SSI HQ Warehouse',
                   address: 'Default Location',
                   isActive: true
                 }
               })

               location = await prisma.location.create({
                 data: {
                   warehouseId: warehouse.id,
                   code: 'MAIN',
                   name: 'SSI HQ',
                   isActive: true
                 }
               })
      }
    }

    if (location) {
      // Create initial stock record
      await prisma.stock.create({
        data: {
          itemId: item.id,
          locationId: location.id,
          quantity: 0 // Start with 0 stock
        }
      })
    }

    // Log the item creation
    await createAuditLog(
      sessionUser.id,
      'CREATE',
      'ITEM',
      item.id,
      {
        name: item.name,
        sku: item.sku,
        categoryId: item.categoryId,
        brandId: item.brandId,
        uomId: item.baseUomId
      },
      request
    )

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error creating item:', error)
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    )
  }
}
