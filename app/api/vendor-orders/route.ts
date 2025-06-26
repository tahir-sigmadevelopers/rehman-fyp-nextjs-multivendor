import { NextRequest, NextResponse } from 'next/server';
import { getVendorOrders } from '@/lib/actions/order.actions';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const vendorId = searchParams.get('vendorId');
    
    if (!vendorId) {
      return NextResponse.json({
        success: false,
        message: 'Missing vendorId parameter'
      }, { status: 400 });
    }
    
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
    
    const result = await getVendorOrders({
      vendorId,
      page,
      limit
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting vendor orders:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred'
    }, { status: 500 });
  }
} 