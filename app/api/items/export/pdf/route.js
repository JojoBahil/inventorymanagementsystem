import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
      include: { category: true, uom: true, stock: true, brand: true },
    })

    const rows = items.map(i => {
      const onHand = i.stock.reduce((s, r) => s + Number(r.quantity), 0)
      const belowMin = i.minStock != null && onHand < Number(i.minStock)
      if (below && !belowMin) return null
      const value = onHand * Number(i.standardCost || 0)
      return {
        sku: i.sku,
        name: i.name,
        brand: i.brand?.name || '',
        category: i.category?.name || '',
        uom: i.uom?.name || '',
        onHand,
        min: i.minStock != null ? Number(i.minStock) : '',
        cost: Number(i.standardCost || 0),
        value,
      }
    }).filter(Boolean)

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Items</title>
      <style>
        body{font-family:system-ui,Segoe UI,Arial,sans-serif;color:#111;background:#fff;margin:24px}
        h1{font-size:18px;margin:0 0 12px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{border:1px solid #ddd;padding:6px;text-align:left}
        th{background:#f3f4f6}
        td.num{text-align:right}
      </style></head><body>
      <h1>SSII Inventory - Items</h1>
      <table><thead><tr>
        <th>SKU</th><th>Name</th><th>Brand</th><th>Category</th><th>UOM</th>
        <th>On Hand</th><th>Min</th><th>Std Cost</th><th>Value</th>
      </tr></thead><tbody>
      ${rows.map(r => `<tr>
        <td>${r.sku}</td><td>${r.name}</td><td>${r.brand}</td><td>${r.category}</td><td>${r.uom}</td>
        <td class="num">${r.onHand}</td><td class="num">${r.min}</td><td class="num">${r.cost.toFixed(2)}</td><td class="num">${r.value.toFixed(2)}</td>
      </tr>`).join('')}
      </tbody></table></body></html>`

    return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    console.error('Export items pdf error:', error)
    return NextResponse.json({ error: 'Failed to export items PDF' }, { status: 500 })
  }
}


