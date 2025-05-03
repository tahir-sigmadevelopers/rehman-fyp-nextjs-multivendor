'use server'

import { connectToDatabase } from '@/lib/db'
import User from '@/lib/db/models/user.model'
import Product from '@/lib/db/models/product.model'
import { revalidatePath } from 'next/cache'

// Helper function to serialize MongoDB documents to plain objects
function serializeDocument(doc: any) {
  if (!doc) return null;
  
  // Handle MongoDB documents or simple objects
  const obj = doc.toJSON ? doc.toJSON() : { ...doc };
  
  // Convert all potential ObjectIds to strings
  for (const key in obj) {
    // Convert ObjectIds (they usually have a toString method and might have a buffer property)
    if (obj[key] && typeof obj[key] === 'object') {
      // If field is an ObjectId or has a buffer property
      if (obj[key].toString && (obj[key]._bsontype === 'ObjectID' || obj[key].buffer)) {
        obj[key] = obj[key].toString();
      } 
      // Recursively serialize nested objects
      else if (!Array.isArray(obj[key]) && obj[key] !== null) {
        obj[key] = serializeDocument(obj[key]);
      }
    }
  }
  
  // Convert _id to string if it exists
  if (obj._id) {
    obj._id = typeof obj._id === 'object' ? obj._id.toString() : obj._id;
  }
  
  // Handle dates
  if (obj.createdAt) {
    obj.createdAt = obj.createdAt instanceof Date ? obj.createdAt.toISOString() : obj.createdAt.toString();
  }
  if (obj.updatedAt) {
    obj.updatedAt = obj.updatedAt instanceof Date ? obj.updatedAt.toISOString() : obj.updatedAt.toString();
  }
  
  // Handle any other arrays in the object
  for (const key in obj) {
    if (Array.isArray(obj[key])) {
      obj[key] = obj[key].map((item: any) => {
        if (item && typeof item === 'object') {
          return serializeDocument(item);
        }
        return item;
      });
    }
  }
  
  return obj;
}

export async function createVendor(data: {
  userId: string
  brandName: string
  description: string
  logo: string
  banner: string
}) {
  try {
    await connectToDatabase()

    const user = await User.findByIdAndUpdate(
      data.userId,
      {
        isVendor: true,
        vendorDetails: {
          brandName: data.brandName,
          description: data.description,
          logo: data.logo,
          banner: data.banner,
          status: 'pending',
        },
      },
      { new: true }
    )

    if (!user) {
      throw new Error('User not found')
    }

    // Convert Mongoose document to plain object
    const serializedUser = serializeDocument(user);

    revalidatePath('/account/become-seller')
    return { success: true, data: serializedUser }
  } catch (error) {
    console.error('Error creating vendor:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Failed to create vendor' }
  }
}

export async function getVendorByUserId(userId: string) {
  try {
    await connectToDatabase()

    const user = await User.findOne({ _id: userId, isVendor: true })
    if (!user) {
      return { success: false, message: 'Vendor not found' }
    }

    // Convert Mongoose document to plain object using our serializer
    const serializedUser = serializeDocument(user);

    return { success: true, data: serializedUser }
  } catch (error) {
    console.error('Error getting vendor:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Failed to get vendor' }
  }
}

export async function updateVendorStatus(userId: string, status: 'approved' | 'rejected') {
  try {
    await connectToDatabase()

    const user = await User.findByIdAndUpdate(
      userId,
      {
        'vendorDetails.status': status,
        isVendor: status === 'approved',
      },
      { new: true }
    )

    if (!user) {
      throw new Error('User not found')
    }

    // Convert Mongoose document to plain object
    const serializedUser = serializeDocument(user);

    revalidatePath('/account/become-seller')
    return { success: true, data: serializedUser }
  } catch (error) {
    console.error('Error updating vendor status:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update vendor status' }
  }
}

export async function getAllVendors() {
  try {
    await connectToDatabase()

    const vendors = await User.find({ isVendor: true })
      .select('name email vendorDetails')
      .sort({ 'vendorDetails.status': 1, createdAt: -1 })
    
    // Serialize each vendor document
    const serializedVendors = vendors.map(vendor => serializeDocument(vendor));

    return { success: true, data: serializedVendors }
  } catch (error) {
    console.error('Error getting all vendors:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Failed to get vendors' }
  }
}

export async function getVendorStatus(userId: string) {
  try {
    await connectToDatabase()

    const user = await User.findById(userId).select('isVendor vendorDetails')
    
    if (!user) {
      return { success: false, message: 'User not found' }
    }

    // For this function we're already returning a custom object so we don't need serialization
    return { 
      success: true, 
      data: {
        isVendor: user.isVendor || false,
        status: user.vendorDetails?.status || null,
        brandName: user.vendorDetails?.brandName || '',
      } 
    }
  } catch (error) {
    console.error('Error checking vendor status:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Failed to check vendor status' }
  }
}

export async function updateVendorInformation(data: {
  userId: string
  brandName: string
  description: string
  logo?: string
  banner?: string
}) {
  try {
    await connectToDatabase()

    // Create update object
    const updateData: any = {
      'vendorDetails.brandName': data.brandName,
      'vendorDetails.description': data.description,
    }
    
    // Only update logo and banner if they are provided
    if (data.logo) {
      updateData['vendorDetails.logo'] = data.logo
    }
    
    if (data.banner) {
      updateData['vendorDetails.banner'] = data.banner
    }

    const user = await User.findByIdAndUpdate(
      data.userId,
      updateData,
      { new: true }
    )

    if (!user) {
      throw new Error('User not found')
    }

    // Convert Mongoose document to plain object
    const serializedUser = serializeDocument(user);

    revalidatePath('/account/vendor-dashboard')
    return { success: true, data: serializedUser }
  } catch (error) {
    console.error('Error updating vendor information:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update vendor information' }
  }
}

export async function deleteVendor(userId: string) {
  try {
    await connectToDatabase()

    // First, delete all products associated with this vendor
    const deleteProductsResult = await Product.deleteMany({ vendorId: userId })
    console.log(`Deleted ${deleteProductsResult.deletedCount} products for vendor ${userId}`)

    // Then, update the user to remove vendor status
    const user = await User.findByIdAndUpdate(
      userId,
      {
        isVendor: false,
        vendorDetails: null,
      },
      { new: true }
    )

    if (!user) {
      throw new Error('User not found')
    }

    // Convert Mongoose document to plain object
    const serializedUser = serializeDocument(user);

    revalidatePath('/admin/vendors')
    return { 
      success: true, 
      data: serializedUser,
      deletedProducts: deleteProductsResult.deletedCount
    }
  } catch (error) {
    console.error('Error deleting vendor:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Failed to delete vendor' }
  }
} 