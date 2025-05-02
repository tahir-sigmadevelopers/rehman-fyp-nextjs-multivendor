import { connectToDatabase } from '@/lib/db'
import User from '@/lib/db/models/user.model'
import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    // Check if user is authenticated
    if (!session || !session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { brandName, description, logo, banner } = await req.json()

    // Validate required fields
    if (!brandName || !description) {
      return NextResponse.json(
        { success: false, message: 'Brand name and description are required' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Check if user already has a vendor profile
    const existingUser = await User.findById(userId)
    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    if (existingUser.isVendor && existingUser.vendorDetails?.status === 'approved') {
      return NextResponse.json(
        { success: false, message: 'User is already a vendor' },
        { status: 400 }
      )
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isVendor: true,
        vendorDetails: {
          brandName,
          description,
          logo: logo || '',
          banner: banner || '',
          status: 'pending',
        },
      },
      { new: true }
    )

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Failed to update user' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        vendorDetails: user.vendorDetails,
      },
      message: 'Vendor registration submitted successfully'
    })
  } catch (error) {
    console.error('Error registering vendor:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 