import { connectToDatabase } from '@/lib/db'
import User from '@/lib/db/models/user.model'
import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    // Check if user is authenticated and has admin role
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    const vendors = await User.find({ isVendor: true })
      .select('name email vendorDetails createdAt')
      .sort({ 'vendorDetails.status': 1, createdAt: -1 })

    return NextResponse.json({ success: true, data: vendors })
  } catch (error) {
    console.error('Error fetching vendors:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 