import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Format date as local
const formatDate = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short'
})

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit')) || 10
    
    const movements = await prisma.stockmovement.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        item: true,
        location_stockmovement_dstLocationIdTolocation: {
          select: {
            name: true
          }
        },
        location_stockmovement_srcLocationIdTolocation: {
          select: {
            name: true
          }
        },
        txnheader: {
          select: {
            type: true,
            customerCompanyId: true,
            company_txnheader_customerCompanyIdTocompany: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    // If no movements, get recent items instead
    if (movements.length === 0) {
      const recentItems = await prisma.item.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          category: true,
          uom: true
        }
      })

      return NextResponse.json(recentItems.map(item => ({
        timestamp: formatDate.format(new Date(item.createdAt)),
        itemName: item.name,
        locationName: 'New Item',
        qtyIn: '-',
        qtyOut: '-',
        type: 'ITEM_CREATED'
      })))
    }

    // Format the data for the table
    const formattedMovements = movements.map(movement => {
      const txnHeader = movement.txnheader
      const isIssue = txnHeader?.type === 'ISSUE'
      const hasCustomer = txnHeader?.customerCompanyId && txnHeader?.company_txnheader_customerCompanyIdTocompany
      
      // Determine destination and transaction type
      let destination = '-'
      let displayType = txnHeader?.type || '-'
      
      if (displayType === 'GRN') {
        displayType = 'Received'
        destination = movement.location_stockmovement_dstLocationIdTolocation?.name || '-'
      } else if (isIssue) {
        if (hasCustomer) {
          displayType = 'Transferred'
          destination = txnHeader.company_txnheader_customerCompanyIdTocompany.name
        } else {
          displayType = 'Issued'
          destination = 'In-house'
        }
      }
      
      return {
        timestamp: formatDate.format(new Date(movement.createdAt)),
        itemName: movement.item.name,
        destination: destination,
        qtyIn: movement.qtyIn?.toString() || '-',
        qtyOut: movement.qtyOut?.toString() || '-',
        type: displayType
      }
    })

    return NextResponse.json({ movements: formattedMovements })
  } catch (error) {
    console.error('Error fetching movements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch movements' },
      { status: 500 }
    )
  }
}
