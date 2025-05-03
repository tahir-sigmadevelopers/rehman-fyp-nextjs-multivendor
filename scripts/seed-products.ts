import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import { mockupProducts } from '@/lib/mockup-data'

/**
 * Script to seed the database with product data
 * Run with: npx ts-node --project tsconfig.json scripts/seed-products.ts
 */
async function seedProducts() {
  try {
    console.log('Connecting to database...')
    await connectToDatabase()
    console.log('Connected to database')

    console.log('Checking for existing products...')
    const existingCount = await Product.countDocuments()
    console.log(`Found ${existingCount} existing products`)

    if (existingCount > 0) {
      const confirmed = process.argv.includes('--force')
      if (!confirmed) {
        console.log('Products already exist in the database.')
        console.log('If you want to add these products anyway, run the script with --force')
        process.exit(0)
      }
      console.log('Force flag detected, proceeding with seeding...')
    }

    console.log('Seeding products...')
    
    // Convert mockup products to the format expected by the database
    const productsToInsert = mockupProducts.map(product => {
      // Remove _id field as MongoDB will generate its own
      const { _id, ...productData } = product
      return productData
    })

    const result = await Product.insertMany(productsToInsert)
    console.log(`Successfully seeded ${result.length} products`)

    console.log('Seeding completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('Error seeding products:', error)
    process.exit(1)
  }
}

seedProducts() 