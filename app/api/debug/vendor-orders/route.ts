import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { debugVendorOrderIssue } from '@/lib/actions/order.actions'
import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import Order from '@/lib/db/models/order.model'
import mongoose from 'mongoose'

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()
    
    // Get vendor ID from query parameter
    const searchParams = req.nextUrl.searchParams
    const vendorId = searchParams.get('vendorId')
    
    if (!vendorId) {
      return NextResponse.json({
        success: false,
        message: 'Missing vendorId parameter'
      }, { status: 400 })
    }
    
    // 1. Get vendor products
    const vendorProducts = await Product.find({ vendorId }).select('_id name')
    const productIds = vendorProducts.map(p => p._id)
    const productIdStrings = productIds.map(id => id.toString())
    
    // 2. Get a sample order to check structure
    const sampleOrder = await Order.findOne().limit(1)
    let sampleOrderItem = null
    
    if (sampleOrder && sampleOrder.items && sampleOrder.items.length > 0) {
      sampleOrderItem = sampleOrder.items[0]
    }
    
    // 3. Try different query approaches to find orders
    
    // Approach 1: Using ObjectIds
    const ordersWithObjectIds = await Order.find({
      "items.product": { $in: productIds }
    }).countDocuments()
    
    // Approach 2: Using string IDs
    const ordersWithStringIds = await Order.find({
      "items.product": { $in: productIdStrings }
    }).countDocuments()
    
    // Approach 3: Using $or with both formats
    const ordersWithEither = await Order.find({
      $or: [
        { "items.product": { $in: productIds } },
        { "items.product": { $in: productIdStrings } }
      ]
    }).countDocuments()
    
    // Approach 4: Using aggregation
    const aggregateResults = await Order.aggregate([
      { $unwind: "$items" },
      { $match: { "items.product": { $in: [...productIds, ...productIdStrings] } } },
      { $group: { _id: "$_id", count: { $sum: 1 } } },
      { $count: "total" }
    ])
    
    const aggregateCount = aggregateResults.length > 0 ? aggregateResults[0].total : 0
    
    // 5. Check direct product ID matches
    const directMatches = []
    
    if (sampleOrder && sampleOrder.items) {
      for (const item of sampleOrder.items) {
        const itemProductId = String(item.product)
        const matchesAny = productIdStrings.includes(itemProductId)
        
        directMatches.push({
          orderItemProductId: itemProductId,
          matchesVendorProduct: matchesAny,
          productName: item.name
        })
      }
    }
    
    // 6. Get total orders in the system
    const totalOrders = await Order.countDocuments()
    
    return NextResponse.json({
      success: true,
      debug: {
        vendorId,
        vendorProducts: {
          count: vendorProducts.length,
          sample: vendorProducts.slice(0, 3).map(p => ({
            id: p._id.toString(),
            name: p.name
          }))
        },
        orderStructure: {
          sampleOrderId: sampleOrder ? sampleOrder._id.toString() : null,
          sampleItemProductId: sampleOrderItem ? String(sampleOrderItem.product) : null,
          sampleItemProductIdType: sampleOrderItem ? typeof sampleOrderItem.product : null,
          isObjectId: sampleOrderItem ? mongoose.Types.ObjectId.isValid(sampleOrderItem.product) : null
        },
        queryResults: {
          usingObjectIds: ordersWithObjectIds,
          usingStringIds: ordersWithStringIds,
          usingEitherFormat: ordersWithEither,
          usingAggregation: aggregateCount
        },
        directMatches,
        systemStats: {
          totalOrders
        }
      }
    })
  } catch (error) {
    console.error('Debug vendor orders error:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred'
    }, { status: 500 })
  }
} 