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

    return Response.json({ brands })
  } catch (error) {
    console.error('Error fetching brands:', error)
    return Response.json({ error: 'Failed to fetch brands' }, { status: 500 })
  }
}