'use server'

import { connectToDatabase } from '../db'
import mongoose from 'mongoose'
import { formatError } from '../utils'
import { OrderItem, ShippingAddress } from '@/types'

interface DirectOrderInput {
  guestUser: {
    name: string
    email: string
  }
  items: OrderItem[]
  shippingAddress?: ShippingAddress
  paymentMethod?: string
  itemsPrice: number
  shippingPrice: number
  taxPrice: number
  totalPrice: number
  expectedDeliveryDate: Date
}

// Create order directly in MongoDB, bypassing Mongoose
export async function createDirectOrder(orderData: DirectOrderInput) {
  try {
    // Connect to database
    await connectToDatabase()
    
    // Get MongoDB collection directly
    const db = mongoose.connection.db
    const orderCollection = db.collection('orders')
    
    // Process items to convert product IDs to ObjectIds
    const processedItems = orderData.items.map(item => ({
      ...item,
      // Convert string product ID to ObjectId
      product: new mongoose.Types.ObjectId(item.product)
    }));
    
    console.log('Direct order - converting product IDs to ObjectIds:', {
      before: orderData.items[0]?.product,
      after: processedItems[0]?.product
    });
    
    // Create order document
    const orderDoc = {
      // Use a plain object for user to avoid ObjectId casting
      user: {
        name: orderData.guestUser.name,
        email: orderData.guestUser.email,
        isGuest: true
      },
      items: processedItems,
      shippingAddress: orderData.shippingAddress,
      paymentMethod: orderData.paymentMethod,
      itemsPrice: orderData.itemsPrice,
      shippingPrice: orderData.shippingPrice,
      taxPrice: orderData.taxPrice,
      totalPrice: orderData.totalPrice,
      expectedDeliveryDate: orderData.expectedDeliveryDate,
      isPaid: false,
      isDelivered: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // Insert directly using MongoDB driver
    const result = await orderCollection.insertOne(orderDoc)
    
    if (!result.acknowledged) {
      throw new Error('Failed to create order')
    }
    
    return {
      success: true,
      message: 'Order placed successfully',
      data: {
        orderId: result.insertedId.toString(),
        isGuest: true
      }
    }
  } catch (error) {
    console.error('Order creation error:', error)
    return {
      success: false,
      message: formatError(error)
    }
  }
} 