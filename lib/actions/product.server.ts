'use server'

import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import { revalidatePath } from 'next/cache'

export async function createProduct(data: {
  name: string
  description: string
  price: number
  images: string[]
  category: string
  stock: number
  vendorId: string
}) {
  try {
    await connectToDatabase()

    const product = await Product.create(data)
    revalidatePath('/vendor/products')
    return { success: true, data: product }
  } catch (error) {
    console.error('Error creating product:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Failed to create product' }
  }
}

export async function getVendorProducts(vendorId: string) {
  try {
    await connectToDatabase()

    const products = await Product.find({ vendorId })
      .sort({ createdAt: -1 })
      .lean()

    return { success: true, data: products }
  } catch (error) {
    console.error('Error getting vendor products:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Failed to get products' }
  }
}

export async function updateProduct(productId: string, data: {
  name?: string
  description?: string
  price?: number
  images?: string[]
  category?: string
  stock?: number
  status?: 'draft' | 'published' | 'archived'
  isActive?: boolean
}) {
  try {
    await connectToDatabase()

    const product = await Product.findByIdAndUpdate(
      productId,
      { $set: data },
      { new: true }
    )

    if (!product) {
      throw new Error('Product not found')
    }

    revalidatePath('/vendor/products')
    return { success: true, data: product }
  } catch (error) {
    console.error('Error updating product:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update product' }
  }
}

export async function deleteProduct(productId: string) {
  try {
    await connectToDatabase()

    const product = await Product.findByIdAndDelete(productId)

    if (!product) {
      throw new Error('Product not found')
    }

    revalidatePath('/vendor/products')
    return { success: true }
  } catch (error) {
    console.error('Error deleting product:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Failed to delete product' }
  }
} 