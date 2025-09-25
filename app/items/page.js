import { prisma } from '@/lib/prisma'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0))
}

export default async function ItemsPage({ searchParams }) {
  const q = (searchParams?.q || '').trim()
  const brand = (searchParams?.brand || '').trim()
  const category = (searchParams?.category || '').trim()
  const below = String(searchParams?.below || '') === '1'
  const page = Math.max(1, Number(searchParams?.page || 1))
  const pageSize = Math.min(50, Math.max(5, Number(searchParams?.pageSize || 10)))

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
    include: { category: true, uom: true, stock: true, brand: true },
    skip: (page - 1) * pageSize,
    take: pageSize,
  })

  let rows = items.map(i => {
    const onHand = i.stock.reduce((s, r) => s + Number(r.quantity), 0)
    const belowMin = i.minStock != null && onHand < Number(i.minStock)
    return {
      id: i.id,
      sku: i.sku,
      name: i.name,
      brand: i.brand?.name || '-',
      category: i.category?.name || '-',
      uom: i.uom?.name || '-',
      onHand,
      min: i.minStock != null ? Number(i.minStock) : null,
      cost: i.standardCost,
      value: onHand * Number(i.standardCost || 0),
      belowMin,
    }
  })

  if (below) rows = rows.filter(r => r.belowMin)

  const kpis = (() => {
    const totalItems = rows.length
    const belowMinCount = rows.filter(r => r.belowMin).length
    const totalValue = rows.reduce((s, r) => s + r.value, 0)
    return { totalItems, belowMinCount, totalValue }
  })()

  const query = (next) => {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (brand) sp.set('brand', brand)
    if (category) sp.set('category', category)
    if (below) sp.set('below', '1')
    sp.set('page', String(next))
    sp.set('pageSize', String(pageSize))
    return `?${sp.toString()}`
  }

  const exportHref = () => {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (brand) sp.set('brand', brand)
    if (category) sp.set('category', category)
    if (below) sp.set('below', '1')
    return `/api/items/export?${sp.toString()}`
  }

  return (
    <div className="w-[93%] mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Items</h1>
          <p className="text-secondary">Inventory master list</p>
        </div>
        <div className="flex items-center gap-3 whitespace-nowrap">
          <a href={exportHref()} className="btn btn-secondary">Export CSV</a>
          <a href={`/api/items/export/pdf${(() => { const sp=new URLSearchParams(); if(q)sp.set('q',q); if(brand)sp.set('brand',brand); if(category)sp.set('category',category); if(below)sp.set('below','1'); return `?${sp.toString()}` })()}`} className="btn btn-secondary">Export PDF</a>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card py-3 px-4">
          <div className="text-xs text-muted mb-1">Total Items</div>
          <div className="text-primary font-semibold">{kpis.totalItems}</div>
        </div>
        <div className="stat-card py-3 px-4">
          <div className="text-xs text-muted mb-1">Below Min</div>
          <div className="text-error font-semibold">{kpis.belowMinCount}</div>
        </div>
        <div className="stat-card py-3 px-4">
          <div className="text-xs text-muted mb-1">Total Value</div>
          <div className="text-primary font-semibold">{formatCurrency(kpis.totalValue)}</div>
        </div>
      </div>

      <form className="card card-compact">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input name="q" defaultValue={q} className="input" placeholder="Search by name or SKU" />
          <select name="brand" defaultValue={brand} className="input">
            <option value="">All brands</option>
            {allBrands.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
          </select>
          <select name="category" defaultValue={category} className="input">
            <option value="">All categories</option>
            {allCategories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-secondary">
            <input type="checkbox" name="below" value="1" defaultChecked={below} /> Below min only
          </label>
        </div>
        <div className="flex justify-end mt-4">
          <button className="btn btn-primary">Apply</button>
        </div>
      </form>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Brand</th>
              <th>Category</th>
              <th>UOM</th>
              <th className="text-right">On Hand</th>
              <th className="text-right">Min</th>
              <th className="text-right">Std Cost</th>
              <th className="text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-surface-elevated">
                <td>{r.sku}</td>
                <td className="text-primary font-medium">
                  {r.name}
                  {r.belowMin && <span className="ml-2 text-xs text-error bg-error/10 px-2 py-0.5 rounded">Below min</span>}
                </td>
                <td>{r.brand}</td>
                <td>{r.category}</td>
                <td>{r.uom}</td>
                <td className="text-right">{r.onHand}</td>
                <td className="text-right">{r.min ?? '-'}</td>
                <td className="text-right">{formatCurrency(r.cost)}</td>
                <td className="text-right">{formatCurrency(r.value)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center text-muted py-8">No items match your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted">Page {page} · Showing {rows.length} of {total} items</div>
        <div className="flex gap-2">
          <a className="btn btn-secondary" href={query(Math.max(1, page - 1))}>Prev</a>
          <a className="btn btn-secondary" href={query(page + 1)}>Next</a>
        </div>
      </div>
    </div>
  )
}


