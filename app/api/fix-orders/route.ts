import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import Order from '@/lib/db/models/order.model'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100
    
    console.log(`[fix-orders] Starting to fix up to ${limit} orders`)
    
    // Find all orders
    const orders = await Order.find().limit(limit)
    
    let fixedCount = 0
    let ordersWithStringIds = 0
    let totalItemsFixed = 0
    
    for (const order of orders) {
      let orderNeedsUpdate = false
      
      // Check each item in the order
      if (order.items && Array.isArray(order.items)) {
        for (let i = 0; i < order.items.length; i++) {
          const item = order.items[i]
          
          // Check if product ID is a string and is a valid ObjectId
          if (item.product && typeof item.product === 'string' && mongoose.Types.ObjectId.isValid(item.product)) {
            console.log(`[fix-orders] Found string product ID in order ${order._id}: ${item.product}`)
            
            // Convert to ObjectId
            order.items[i].product = new mongoose.Types.ObjectId(item.product)
            orderNeedsUpdate = true
            totalItemsFixed++
          }
        }
      }
      
      // Save the order if it was updated
      if (orderNeedsUpdate) {
        await order.save()
        fixedCount++
        ordersWithStringIds++
        console.log(`[fix-orders] Fixed order ${order._id} - converted ${totalItemsFixed} product IDs to ObjectIds`)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} orders with string product IDs`,
      stats: {
        ordersChecked: orders.length,
        ordersWithStringIds,
        ordersFixed: fixedCount,
        totalItemsFixed
      }
    })
  } catch (error) {
    console.error('Error fixing orders:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred'
    }, { status: 500 })
  }
} 