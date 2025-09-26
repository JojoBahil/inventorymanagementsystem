import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function formatCsvValue(v) {
  const s = String(v ?? '')
  if (s.includes(',') || s.includes('\n') || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    const brand = (searchParams.get('brand') || '').trim()
    const category = (searchParams.get('category') || '').trim()
    const below = searchParams.get('below') === '1'

    const where = {
      AND: [
        q ? { OR: [{ name: { contains: q } }, { sku: { contains: q } }] } : {},
        brand ? { brand: { name: { equals: brand } } } : {},
        category ? { category: { name: { equals: category } } } : {},
      ]
    }

    const items = await prisma.item.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { category: true, uom: true, brand: true, company: true },
    })

    const rows = []
    rows.push(['SKU','Name','Brand','Category','UOM','On Hand','Min','Std Cost','Value'])
    for (const i of items) {
      // Calculate stock separately since we can't include it directly
      const stockRecords = await prisma.stock.findMany({
        where: { itemId: i.id }
      })
      const onHand = stockRecords.reduce((s, r) => s + Number(r.quantity), 0)
      const belowMin = i.minStock != null && onHand < Number(i.minStock)
      if (below && !belowMin) continue
      const value = onHand * Number(i.standardCost || 0)
      rows.push([
        i.sku,
        i.name,
        i.brand?.name || '',
        i.category?.name || '',
        i.uom?.name || '',
        onHand,
        i.minStock != null ? Number(i.minStock) : '',
        Number(i.standardCost || 0),
        value
      ])
    }

    const csv = rows.map(r => r.map(formatCsvValue).join(',')).join('\n')
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="items.csv"'
      }
    })
  } catch (error) {
    console.error('Export items error:', error)
    return NextResponse.json({ error: 'Failed to export items' }, { status: 500 })
  }
}


