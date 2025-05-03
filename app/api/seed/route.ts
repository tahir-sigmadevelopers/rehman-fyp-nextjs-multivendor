import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import { mockupProducts } from '@/lib/mockup-data'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // Check for a secret key to prevent unauthorized access
    const { searchParams } = new URL(req.url)
    const secret = searchParams.get('secret')
    
    if (secret !== 'your-secret-key') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()
    
    // Check for the force parameter
    const force = searchParams.get('force') === 'true'
    
    // Check if products already exist
    const existingCount = await Product.countDocuments()
    
    if (existingCount > 0 && !force) {
      return NextResponse.json({
        success: false,
        message: `Found ${existingCount} existing products. Add ?force=true to overwrite.`,
        existingCount
      })
    }

    // Optionally delete existing products if force=true
    if (force) {
      await Product.deleteMany({})
    }
    
    // Convert mockup products to the format expected by the database
    const productsToInsert = mockupProducts.map(product => {
      // Remove _id field as MongoDB will generate its own
      const { _id, ...productData } = product
      return productData
    })

    // Insert the products into the database
    const result = await Product.insertMany(productsToInsert)
    
    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${result.length} products`,
      count: result.length
    })
  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to seed database', error: String(error) },
      { status: 500 }
    )
  }
} 