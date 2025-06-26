import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import mongoose from 'mongoose'

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()
    
    // Optional vendorId parameter to fix only products from a specific vendor
    const searchParams = req.nextUrl.searchParams
    const vendorId = searchParams.get('vendorId')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100
    
    console.log(`[fix-vendor-products] Starting to fix up to ${limit} products${vendorId ? ` for vendor ${vendorId}` : ''}`)
    
    // Build the query
    const query: any = {}
    if (vendorId) {
      // If vendorId is provided, match either the string or ObjectId version
      query.$or = [
        { vendorId: vendorId }, // String match
        { vendorId: new mongoose.Types.ObjectId(vendorId) } // ObjectId match
      ]
    }
    
    // Find products that might have string vendorIds
    const products = await Product.find(query).limit(limit)
    
    let fixedCount = 0
    let productsWithStringIds = 0
    
    for (const product of products) {
      // Check if vendorId is a string and is a valid ObjectId
      if (typeof product.vendorId === 'string' && mongoose.Types.ObjectId.isValid(product.vendorId)) {
        console.log(`[fix-vendor-products] Found string vendorId in product ${product._id}: ${product.vendorId}`)
        productsWithStringIds++
        
        // Convert to ObjectId
        product.vendorId = new mongoose.Types.ObjectId(product.vendorId)
        await product.save()
        fixedCount++
        console.log(`[fix-vendor-products] Fixed product ${product._id}`)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} products with string vendorIds`,
      stats: {
        productsChecked: products.length,
        productsWithStringIds,
        productsFixed: fixedCount
      }
    })
  } catch (error) {
    console.error('Fix vendor products error:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred'
    }, { status: 500 })
  }
} 