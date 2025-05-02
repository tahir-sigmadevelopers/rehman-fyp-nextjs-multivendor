import { connectToDatabase } from '@/lib/db'
import User from '@/lib/db/models/user.model'
import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    // Check if user is authenticated and has admin role
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const { status } = await req.json()

    // Validate status
    if (status !== 'approved' && status !== 'rejected') {
      return NextResponse.json(
        { success: false, message: 'Invalid status value' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    const user = await User.findByIdAndUpdate(
      id,
      {
        'vendorDetails.status': status,
        isVendor: status === 'approved',
      },
      { new: true }
    )

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Vendor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        vendorDetails: user.vendorDetails,
      }
    })
  } catch (error) {
    console.error('Error updating vendor status:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 