import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    
    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      )
    }
    
    // Get all products for this vendor
    const products = await Product.find({ vendorId }).select('_id name slug vendorId createdAt')
    
    // Check if vendorId matches in all products
    const vendorIdMatches = products.map(p => ({
      id: p._id.toString(),
      name: p.name,
      vendorId: p.vendorId ? p.vendorId.toString() : null,
      matches: p.vendorId && p.vendorId.toString() === vendorId
    }))
    
    // Count products with matching vendorId
    const matchingProducts = vendorIdMatches.filter(p => p.matches).length
    
    return NextResponse.json({
      success: true,
      data: {
        vendorId,
        totalProducts: products.length,
        matchingVendorId: matchingProducts,
        sampleProducts: products.slice(0, 5).map(p => ({
          id: p._id.toString(),
          name: p.name,
          slug: p.slug,
          vendorId: p.vendorId ? p.vendorId.toString() : null,
          createdAt: p.createdAt
        })),
        vendorIdMatches: vendorIdMatches.slice(0, 10)
      }
    })
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
} 