'use server'

import { Cart } from '@/types'
import { formatError } from '../utils'
import { connectToDatabase } from '../db'
import mongoose from 'mongoose'

// Calculate delivery date and price for guest orders
const calcGuestDeliveryDateAndPrice = (
  items: Cart['items'],
  shippingAddress?: Cart['shippingAddress'],
  deliveryDateIndex?: number
) => {
  // Simple calculation for demo purposes
  const itemsPrice = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  
  // Free shipping for orders over $100
  const shippingPrice = itemsPrice > 100 ? 0 : 10;
  
  // Tax calculation (15%)
  const taxPrice = itemsPrice * 0.15;
  
  // Total price
  const totalPrice = itemsPrice + shippingPrice + taxPrice;
  
  // Expected delivery date (7 days from now)
  const expectedDeliveryDate = new Date();
  expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 7);
  
  return {
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    expectedDeliveryDate
  };
};

// Special function for guest checkout that bypasses Mongoose
export const createGuestOrder = async (clientSideCart: Cart) => {
  try {
    await connectToDatabase();
    
    // Prepare the cart data
    const cart = {
      ...clientSideCart,
      ...calcGuestDeliveryDateAndPrice(
        clientSideCart.items,
        clientSideCart.shippingAddress,
        clientSideCart.deliveryDateIndex
      ),
    };
    
    // Ensure we have user info
    if (!clientSideCart.userInfo?.name || !clientSideCart.userInfo?.email) {
      return { 
        success: false, 
        message: 'User name and email are required for guest checkout'
      };
    }
    
    // Use direct MongoDB driver to insert the document
    const db = mongoose.connection.db;
    const orderCollection = db.collection('orders');
    
    // Create the order document
    const orderDoc = {
      user: {
        name: clientSideCart.userInfo.name,
        email: clientSideCart.userInfo.email,
        isGuest: true
      },
      items: cart.items,
      shippingAddress: cart.shippingAddress,
      paymentMethod: cart.paymentMethod,
      itemsPrice: cart.itemsPrice,
      shippingPrice: cart.shippingPrice,
      taxPrice: cart.taxPrice,
      totalPrice: cart.totalPrice,
      expectedDeliveryDate: cart.expectedDeliveryDate,
      isPaid: false,
      isDelivered: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert directly using MongoDB driver
    const result = await orderCollection.insertOne(orderDoc);
    
    if (!result.acknowledged) {
      throw new Error('Failed to create guest order');
    }
    
    return {
      success: true,
      message: 'Guest order placed successfully',
      data: {
        orderId: result.insertedId.toString(),
        isGuest: true
      }
    };
  } catch (error) {
    console.error('Guest order creation error:', error);
    return {
      success: false,
      message: formatError(error)
    };
  }
}; 