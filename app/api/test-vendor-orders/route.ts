import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Product from '@/lib/db/models/product.model';
import Order from '@/lib/db/models/order.model';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const searchParams = req.nextUrl.searchParams;
    const vendorId = searchParams.get('vendorId');
    
    if (!vendorId) {
      return NextResponse.json({
        success: false,
        message: 'Missing vendorId parameter'
      }, { status: 400 });
    }
    
    // 1. Find all products for this vendor
    const vendorProducts = await Product.find({ vendorId }).select('_id name');
    const productIds = vendorProducts.map(p => p._id);
    const productIdStrings = productIds.map(id => id.toString());
    
    // 2. Find orders containing these products
    const orders = await Order.find({
      "items.product": { $in: productIds }
    }).limit(10);
    
    // 3. Process orders to only include items from this vendor
    const vendorOrders = orders.map(order => {
      const orderObj = order.toObject();
      
      // Filter items to only include this vendor's products
      const vendorItems = orderObj.items.filter(item => {
        const itemProductId = String(item.product);
        return productIdStrings.includes(itemProductId);
      });
      
      // Calculate vendor's portion of the order
      const itemsPrice = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      return {
        _id: orderObj._id,
        customer: orderObj.user?.name || 'Unknown',
        items: vendorItems,
        itemsCount: vendorItems.length,
        totalAmount: itemsPrice,
        isPaid: orderObj.isPaid,
        isDelivered: orderObj.isDelivered,
        createdAt: orderObj.createdAt
      };
    });
    
    return NextResponse.json({
      success: true,
      data: {
        vendorId,
        productCount: vendorProducts.length,
        orderCount: orders.length,
        vendorOrders
      }
    });
  } catch (error) {
    console.error('Test vendor orders error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred'
    }, { status: 500 });
  }
} 