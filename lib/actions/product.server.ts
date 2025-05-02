'use server'

import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import { revalidatePath } from 'next/cache'

function serializeDocument(doc: any) {
  if (!doc) return null;
  
  // To ensure full serialization, convert to JSON and back
  try {
    // First convert mongoose document to plain object if needed
    const plainObject = doc.toJSON ? doc.toJSON() : { ...doc };
    
    // Then do a full serialization through JSON.stringify/parse to remove any non-serializable properties
    return JSON.parse(JSON.stringify(plainObject));
  } catch (error) {
    console.error('Error serializing document:', error);
    
    // Fallback to manual serialization if JSON approach fails
    const obj = doc.toJSON ? doc.toJSON() : { ...doc };
    
    // Convert _id to string if it exists
    if (obj._id) {
      obj._id = typeof obj._id === 'object' ? obj._id.toString() : obj._id;
    }
    
    // Convert vendorId to string if it exists
    if (obj.vendorId && typeof obj.vendorId === 'object') {
      obj.vendorId = obj.vendorId.toString();
    }
    
    // Handle dates
    if (obj.createdAt) {
      obj.createdAt = obj.createdAt instanceof Date ? obj.createdAt.toISOString() : obj.createdAt.toString();
    }
    if (obj.updatedAt) {
      obj.updatedAt = obj.updatedAt instanceof Date ? obj.updatedAt.toISOString() : obj.updatedAt.toString();
    }
    
    // Handle arrays
    Object.keys(obj).forEach(key => {
      if (Array.isArray(obj[key])) {
        obj[key] = obj[key].map((item: any) => {
          if (item && typeof item === 'object') {
            return serializeDocument(item);
          }
          return item;
        });
      } else if (obj[key] && typeof obj[key] === 'object') {
        obj[key] = serializeDocument(obj[key]);
      }
    });
    
    return obj;
  }
}

export async function createProduct(data: {
  name: string
  description: string
  price: number
  listPrice: number
  images: string[]
  category: string
  stock: number
  vendorId: string
  slug: string
  brand: string
  tags?: string[]
  colors?: string[]
  sizes?: string[]
  isPublished?: boolean
  avgRating?: number
  numReviews?: number
  numSales?: number
  ratingDistribution?: Array<{ rating: number; count: number }>
  status?: 'draft' | 'published' | 'archived'
}) {
  try {
    await connectToDatabase()

    // Clean up and validate the data
    const productData = {
      name: data.name,
      description: data.description,
      price: data.price,
      listPrice: data.listPrice,
      images: data.images || [],
      category: data.category,
      stock: data.stock,
      vendorId: data.vendorId,
      slug: data.slug,
      brand: data.brand,
      tags: data.tags || ['new arrival'],
      colors: data.colors || ['White', 'Black'],
      sizes: data.sizes || ['S', 'M', 'L'],
      isPublished: data.isPublished !== undefined ? data.isPublished : true,
      avgRating: data.avgRating || 0,
      numReviews: data.numReviews || 0,
      numSales: data.numSales || 0,
      status: data.status || 'draft',
      ratingDistribution: data.ratingDistribution || []
    };

    const product = await Product.create(productData)
    
    // Serialize the MongoDB document to a plain object
    const serializedProduct = serializeDocument(product);
    
    revalidatePath('/vendor/products')
    revalidatePath('/account/vendor-dashboard')
    return { success: true, data: serializedProduct }
  } catch (error) {
    console.error('Error creating product:', error)
    return { 
      success: false, 
      message: error instanceof Error 
        ? `Failed to create product: ${error.message}` 
        : 'Failed to create product' 
    }
  }
}

export async function getVendorProducts(vendorId: string) {
  try {
    await connectToDatabase()

    const products = await Product.find({ vendorId }).sort({ createdAt: -1 })

    // Serialize the MongoDB documents to plain objects
    const serializedProducts = products.map(product => serializeDocument(product));

    return { success: true, data: serializedProducts }
  } catch (error) {
    console.error('Error getting vendor products:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Failed to get products' }
  }
}

export async function updateProduct(productId: string, data: {
  name?: string
  description?: string
  price?: number
  listPrice?: number
  images?: string[]
  category?: string
  stock?: number
  brand?: string
  slug?: string
  tags?: string[]
  colors?: string[]
  sizes?: string[]
  isPublished?: boolean
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

    // Serialize the MongoDB document to a plain object
    const serializedProduct = serializeDocument(product);

    revalidatePath('/vendor/products')
    revalidatePath('/account/vendor-dashboard')
    return { success: true, data: serializedProduct }
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

export async function getProductById(productId: string) {
  try {
    await connectToDatabase()

    const product = await Product.findById(productId)

    if (!product) {
      return { success: false, message: 'Product not found' }
    }

    // Serialize the MongoDB document to a plain object
    const serializedProduct = serializeDocument(product);

    return { success: true, data: serializedProduct }
  } catch (error) {
    console.error('Error getting product by ID:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Failed to get product' }
  }
} 