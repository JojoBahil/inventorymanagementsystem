import { prisma } from '@/lib/prisma'
import { ItemsPageClient } from '@/components/items/ItemsPageClient'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0))
}

export default async function ItemsPage({ searchParams }) {
  const q = (searchParams?.q || '').trim()
  const brand = (searchParams?.brand || '').trim()
  const category = (searchParams?.category || '').trim()
  const below = String(searchParams?.below || '') === '1'
  const page = Math.max(1, Number(searchParams?.page || 1))
  const pageSize = 30

  const where = {
    AND: [
      q ? { OR: [{ name: { contains: q } }, { sku: { contains: q } }] } : {},
      brand ? { brand: { name: { equals: brand } } } : {},
      category ? { category: { name: { equals: category } } } : {},
    ]
  }

  const [allBrands, allCategories] = await Promise.all([
    prisma.brand.findMany({ where: { isActive: true }, select: { name: true }, orderBy: { name: 'asc' } }),
    prisma.category.findMany({ select: { name: true }, orderBy: { name: 'asc' } })
  ])

  const total = await prisma.item.count({ where })
  const items = await prisma.item.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { category: true, uom: true, brand: true, company: true },
    skip: (page - 1) * pageSize,
    take: pageSize,
  })

  let rows = []
  for (const i of items) {
    // Calculate stock separately since we can't include it directly
    const stockRecords = await prisma.stock.findMany({
      where: { itemId: i.id }
    })
    const onHand = stockRecords.reduce((s, r) => s + Number(r.quantity), 0)
    const belowMin = i.minStock != null && onHand < Number(i.minStock)
    rows.push({
      id: i.id,
      sku: i.sku,
      name: i.name,
      brand: i.brand?.name || '-',
      category: i.category?.name || '-',
      uom: i.uom?.name || '-',
      onHand,
      min: i.minStock != null ? Number(i.minStock) : null,
      cost: Number(i.standardCost || 0), // Convert Decimal to Number
      value: onHand * Number(i.standardCost || 0),
      belowMin,
    })
  }

  if (below) rows = rows.filter(r => r.belowMin)

  const kpis = (() => {
    const totalItems = total
    const belowMinCount = rows.filter(r => r.belowMin).length
    const totalValue = rows.reduce((s, r) => s + r.value, 0)
    return { totalItems, belowMinCount, totalValue }
  })()

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <ItemsPageClient
      initialRows={rows}
      allBrands={allBrands}
      allCategories={allCategories}
      searchParams={{ q, brand, category, below: below ? '1' : '' }}
      kpis={kpis}
      page={page}
      totalPages={totalPages}
      total={total}
    />
  )
}


