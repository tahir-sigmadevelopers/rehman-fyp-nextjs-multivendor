'use server'

import { connectToDatabase } from '@/lib/db'
import User from '@/lib/db/models/user.model'
import { revalidatePath } from 'next/cache'

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
    const userObject = user.toObject()

    revalidatePath('/account/become-seller')
    return { success: true, data: userObject }
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

    // Convert Mongoose document to plain object
    const userObject = user.toObject()

    return { success: true, data: userObject }
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
    const userObject = user.toObject()

    revalidatePath('/account/become-seller')
    return { success: true, data: userObject }
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
      .lean() // Use lean() to get plain objects directly

    return { success: true, data: vendors }
  } catch (error) {
    console.error('Error getting all vendors:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Failed to get vendors' }
  }
}

export async function getVendorStatus(userId: string) {
  try {
    await connectToDatabase()

    const user = await User.findById(userId).select('isVendor vendorDetails').lean()
    
    if (!user) {
      return { success: false, message: 'User not found' }
    }

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
    const userObject = user.toObject()

    revalidatePath('/account/vendor-dashboard')
    return { success: true, data: userObject }
  } catch (error) {
    console.error('Error updating vendor information:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update vendor information' }
  }
} 