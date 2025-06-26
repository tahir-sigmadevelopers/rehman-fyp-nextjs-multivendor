import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import Order from '@/lib/db/models/order.model'
import mongoose from 'mongoose'

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()
    
    // Optional limit parameter
    const searchParams = req.nextUrl.searchParams
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100
    
    console.log(`[fix-vendor-orders] Starting to fix up to ${limit} orders`)
    
    // Find orders with string product IDs
    // We'll look for orders where at least one item has a product ID that's a string
    // but is a valid ObjectId (meaning it should be converted)
    const orders = await Order.find().limit(limit)
    
    let fixedCount = 0
    let ordersWithStringIds = 0
    
    for (const order of orders) {
      let orderNeedsUpdate = false
      
      // Check each item in the order
      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i]
        const productId = item.product
        
        // Check if product ID is a string and is a valid ObjectId
        if (typeof productId === 'string' && mongoose.Types.ObjectId.isValid(productId)) {
          console.log(`[fix-vendor-orders] Found string product ID in order ${order._id}: ${productId}`)
          ordersWithStringIds++
          
          // Convert to ObjectId
          order.items[i].product = new mongoose.Types.ObjectId(productId)
          orderNeedsUpdate = true
        }
      }
      
      // Save the order if it was updated
      if (orderNeedsUpdate) {
        await order.save()
        fixedCount++
        console.log(`[fix-vendor-orders] Fixed order ${order._id}`)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} orders with string product IDs`,
      stats: {
        ordersChecked: orders.length,
        ordersWithStringIds,
        ordersFixed: fixedCount
      }
    })
  } catch (error) {
    console.error('Fix vendor orders error:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred'
    }, { status: 500 })
  }
} 