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
    console.log('Creating vendor...')
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

    revalidatePath('/account/become-seller')
    return { success: true, data: user }
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

    return { success: true, data: user }
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

    revalidatePath('/account/become-seller')
    return { success: true, data: user }
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
    return { success: true, data: vendors }
  } catch (error) {
    console.error('Error getting all vendors:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Failed to get vendors' }
  }
} 