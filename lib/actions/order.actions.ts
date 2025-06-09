'use server'

import { Cart, IOrderList, OrderItem, ShippingAddress } from '@/types'
import { formatError, round2 } from '../utils'
import { connectToDatabase } from '../db'
import { auth } from '@/auth'
import { OrderInputSchema } from '../validator'
import Order, { IOrder } from '../db/models/order.model'
import { revalidatePath } from 'next/cache'
import { sendAskReviewOrderItems, sendPurchaseReceipt } from '@/emails'
import { paypal } from '../paypal'
import { DateRange } from 'react-day-picker'
import Product from '../db/models/product.model'
import User from '../db/models/user.model'
import mongoose from 'mongoose'
import { getSetting } from './setting.actions'

// CREATE
export const createOrder = async (clientSideCart: Cart) => {
  try {
    await connectToDatabase()
    const session = await auth()
    
    // If no authenticated user, use the guest order function
    if (!session?.user?.id) {
      return createGuestOrder(clientSideCart)
    }
    
    // For authenticated users, use the normal flow
    const cart = {
      ...clientSideCart,
      ...calcDeliveryDateAndPrice({
        items: clientSideCart.items,
        shippingAddress: clientSideCart.shippingAddress,
        deliveryDateIndex: clientSideCart.deliveryDateIndex,
      }),
    }
    
    // Create order with authenticated user
    const orderData = {
      user: session.user.id,
      items: cart.items,
      shippingAddress: cart.shippingAddress,
      paymentMethod: cart.paymentMethod,
      itemsPrice: cart.itemsPrice,
      shippingPrice: cart.shippingPrice,
      taxPrice: cart.taxPrice,
      totalPrice: cart.totalPrice,
      expectedDeliveryDate: cart.expectedDeliveryDate,
    }
    
    // Parse with zod schema
    const validatedOrder = OrderInputSchema.parse(orderData)
    
    // Create the order with Mongoose
    const createdOrder = await Order.create(validatedOrder)
    
    return {
      success: true,
      message: 'Order placed successfully',
      data: {
        orderId: createdOrder._id.toString(),
        isGuest: false
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

export const createOrderFromCart = async (
  clientSideCart: Cart,
  userId: string | { name: string; email: string; isGuest?: boolean }
) => {
  const cart = {
    ...clientSideCart,
    ...calcDeliveryDateAndPrice({
      items: clientSideCart.items,
      shippingAddress: clientSideCart.shippingAddress,
      deliveryDateIndex: clientSideCart.deliveryDateIndex,
    }),
  }
  
  // Create order data with proper validation
  const orderData = {
    user: userId,
    items: cart.items,
    shippingAddress: cart.shippingAddress,
    paymentMethod: cart.paymentMethod,
    itemsPrice: cart.itemsPrice,
    shippingPrice: cart.shippingPrice,
    taxPrice: cart.taxPrice,
    totalPrice: cart.totalPrice,
    expectedDeliveryDate: cart.expectedDeliveryDate,
  };

  // Parse with zod schema
  const validatedOrder = OrderInputSchema.parse(orderData);
  
  try {
    // Create the order with the validated data
    const order = await Order.create(validatedOrder);
    return order;
  } catch (error) {
    console.error("Order creation error:", error);
    throw error;
  }
}

export async function updateOrderToPaid(orderId: string) {
  try {
    await connectToDatabase()
    const order = await Order.findById(orderId).populate<{
      user: { email: string; name: string }
    }>('user', 'name email')
    if (!order) throw new Error('Order not found')
    if (order.isPaid) throw new Error('Order is already paid')
    order.isPaid = true
    order.paidAt = new Date()
    await order.save()
    if (!process.env.MONGODB_URI?.startsWith('mongodb://localhost'))
      await updateProductStock(order._id)
    if (order.user.email) await sendPurchaseReceipt({ order })
    revalidatePath(`/account/orders/${orderId}`)
    return { success: true, message: 'Order paid successfully' }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}
const updateProductStock = async (orderId: string) => {
  const session = await mongoose.connection.startSession()

  try {
    session.startTransaction()
    const opts = { session }

    const order = await Order.findOneAndUpdate(
      { _id: orderId },
      { isPaid: true, paidAt: new Date() },
      opts
    )
    if (!order) throw new Error('Order not found')

    for (const item of order.items) {
      const product = await Product.findById(item.product).session(session)
      if (!product) throw new Error('Product not found')

      product.countInStock -= item.quantity
      await Product.updateOne(
        { _id: product._id },
        { countInStock: product.countInStock },
        opts
      )
    }
    await session.commitTransaction()
    session.endSession()
    return true
  } catch (error) {
    await session.abortTransaction()
    session.endSession()
    throw error
  }
}
export async function deliverOrder(orderId: string) {
  try {
    await connectToDatabase()
    const order = await Order.findById(orderId).populate<{
      user: { email: string; name: string }
    }>('user', 'name email')
    if (!order) throw new Error('Order not found')
    if (!order.isPaid) throw new Error('Order is not paid')
    order.isDelivered = true
    order.deliveredAt = new Date()
    await order.save()
    if (order.user.email) await sendAskReviewOrderItems({ order })
    revalidatePath(`/account/orders/${orderId}`)
    return { success: true, message: 'Order delivered successfully' }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}

// DELETE
export async function deleteOrder(id: string) {
  try {
    await connectToDatabase()
    const res = await Order.findByIdAndDelete(id)
    if (!res) throw new Error('Order not found')
    revalidatePath('/admin/orders')
    return {
      success: true,
      message: 'Order deleted successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// GET ALL ORDERS

export async function getAllOrders({
  limit,
  page,
}: {
  limit?: number
  page: number
}) {
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()
  const skipAmount = (Number(page) - 1) * limit
  const orders = await Order.find()
    .populate('user', 'name')
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(limit)
  const ordersCount = await Order.countDocuments()
  return {
    data: JSON.parse(JSON.stringify(orders)) as IOrderList[],
    totalPages: Math.ceil(ordersCount / limit),
  }
}
export async function getMyOrders({
  limit,
  page,
}: {
  limit?: number
  page: number
}) {
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()
  const session = await auth()
  if (!session) {
    throw new Error('User is not authenticated')
  }
  const skipAmount = (Number(page) - 1) * limit
  const orders = await Order.find({
    user: session?.user?.id,
  })
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(limit)
  const ordersCount = await Order.countDocuments({ user: session?.user?.id })

  return {
    data: JSON.parse(JSON.stringify(orders)),
    totalPages: Math.ceil(ordersCount / limit),
  }
}
export async function getOrderById(orderId: string): Promise<IOrder> {
  await connectToDatabase()
  try {
    const order = await Order.findById(orderId)
    if (!order) {
      throw new Error('Order not found')
    }
    
    // If the user is a string (ObjectId), try to populate it
    if (typeof order.user === 'string') {
      try {
        await order.populate('user', 'name email')
      } catch (error) {
        console.log('Error populating user:', error)
        // Continue even if population fails
      }
    }
    
    return JSON.parse(JSON.stringify(order))
  } catch (error) {
    console.error('Error getting order by ID:', error)
    throw error
  }
}

export async function createPayPalOrder(orderId: string) {
  await connectToDatabase()
  try {
    const order = await Order.findById(orderId)
    if (order) {
      const paypalOrder = await paypal.createOrder(order.totalPrice)
      order.paymentResult = {
        id: paypalOrder.id,
        email_address: '',
        status: '',
        pricePaid: '0',
      }
      await order.save()
      return {
        success: true,
        message: 'PayPal order created successfully',
        data: paypalOrder.id,
      }
    } else {
      throw new Error('Order not found')
    }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}

export async function approvePayPalOrder(
  orderId: string,
  data: { orderID: string }
) {
  await connectToDatabase()
  try {
    const order = await Order.findById(orderId).populate('user', 'email')
    if (!order) throw new Error('Order not found')

    const captureData = await paypal.capturePayment(data.orderID)
    if (
      !captureData ||
      captureData.id !== order.paymentResult?.id ||
      captureData.status !== 'COMPLETED'
    )
      throw new Error('Error in paypal payment')
    order.isPaid = true
    order.paidAt = new Date()
    order.paymentResult = {
      id: captureData.id,
      status: captureData.status,
      email_address: captureData.payer.email_address,
      pricePaid:
        captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value,
    }
    await order.save()
    await sendPurchaseReceipt({ order })
    revalidatePath(`/account/orders/${orderId}`)
    return {
      success: true,
      message: 'Your order has been successfully paid by PayPal',
    }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}

export const calcDeliveryDateAndPrice = async ({
  items,
  shippingAddress,
  deliveryDateIndex,
}: {
  deliveryDateIndex?: number
  items: OrderItem[]
  shippingAddress?: ShippingAddress
}) => {
  const { availableDeliveryDates } = await getSetting()
  const itemsPrice = round2(
    items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  )

  const deliveryDate =
    availableDeliveryDates[
      deliveryDateIndex === undefined
        ? availableDeliveryDates.length - 1
        : deliveryDateIndex
    ]
  const shippingPrice =
    !shippingAddress || !deliveryDate
      ? undefined
      : deliveryDate.freeShippingMinPrice > 0 &&
          itemsPrice >= deliveryDate.freeShippingMinPrice
        ? 0
        : deliveryDate.shippingPrice

  const taxPrice = !shippingAddress ? undefined : round2(itemsPrice * 0.15)
  const totalPrice = round2(
    itemsPrice +
      (shippingPrice ? round2(shippingPrice) : 0) +
      (taxPrice ? round2(taxPrice) : 0)
  )
  return {
    availableDeliveryDates,
    deliveryDateIndex:
      deliveryDateIndex === undefined
        ? availableDeliveryDates.length - 1
        : deliveryDateIndex,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
  }
}

// GET ORDERS BY USER
export async function getOrderSummary(date: DateRange) {
  await connectToDatabase()

  const ordersCount = await Order.countDocuments({
    createdAt: {
      $gte: date.from,
      $lte: date.to,
    },
  })
  const productsCount = await Product.countDocuments({
    createdAt: {
      $gte: date.from,
      $lte: date.to,
    },
  })
  const usersCount = await User.countDocuments({
    createdAt: {
      $gte: date.from,
      $lte: date.to,
    },
  })

  const totalSalesResult = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: date.from,
          $lte: date.to,
        },
      },
    },
    {
      $group: {
        _id: null,
        sales: { $sum: '$totalPrice' },
      },
    },
    { $project: { totalSales: { $ifNull: ['$sales', 0] } } },
  ])
  const totalSales = totalSalesResult[0] ? totalSalesResult[0].totalSales : 0

  const today = new Date()
  const sixMonthEarlierDate = new Date(
    today.getFullYear(),
    today.getMonth() - 5,
    1
  )
  const monthlySales = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: sixMonthEarlierDate,
        },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        totalSales: { $sum: '$totalPrice' },
      },
    },
    {
      $project: {
        _id: 0,
        label: '$_id',
        value: '$totalSales',
      },
    },

    { $sort: { label: -1 } },
  ])
  const topSalesCategories = await getTopSalesCategories(date)
  const topSalesProducts = await getTopSalesProducts(date)

  const {
    common: { pageSize },
  } = await getSetting()
  const limit = pageSize
  const latestOrders = await Order.find()
    .populate('user', 'name')
    .sort({ createdAt: 'desc' })
    .limit(limit)
  return {
    ordersCount,
    productsCount,
    usersCount,
    totalSales,
    monthlySales: JSON.parse(JSON.stringify(monthlySales)),
    salesChartData: JSON.parse(JSON.stringify(await getSalesChartData(date))),
    topSalesCategories: JSON.parse(JSON.stringify(topSalesCategories)),
    topSalesProducts: JSON.parse(JSON.stringify(topSalesProducts)),
    latestOrders: JSON.parse(JSON.stringify(latestOrders)) as IOrderList[],
  }
}

async function getSalesChartData(date: DateRange) {
  const result = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: date.from,
          $lte: date.to,
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        },
        totalSales: { $sum: '$totalPrice' },
      },
    },
    {
      $project: {
        _id: 0,
        date: {
          $concat: [
            { $toString: '$_id.year' },
            '/',
            { $toString: '$_id.month' },
            '/',
            { $toString: '$_id.day' },
          ],
        },
        totalSales: 1,
      },
    },
    { $sort: { date: 1 } },
  ])

  return result
}

async function getTopSalesProducts(date: DateRange) {
  const result = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: date.from,
          $lte: date.to,
        },
      },
    },
    // Step 1: Unwind orderItems array
    { $unwind: '$items' },

    // Step 2: Group by productId to calculate total sales per product
    {
      $group: {
        _id: {
          name: '$items.name',
          image: '$items.image',
          _id: '$items.product',
        },
        totalSales: {
          $sum: { $multiply: ['$items.quantity', '$items.price'] },
        }, // Assume quantity field in orderItems represents units sold
      },
    },
    {
      $sort: {
        totalSales: -1,
      },
    },
    { $limit: 6 },

    // Step 3: Replace productInfo array with product name and format the output
    {
      $project: {
        _id: 0,
        id: '$_id._id',
        label: '$_id.name',
        image: '$_id.image',
        value: '$totalSales',
      },
    },

    // Step 4: Sort by totalSales in descending order
    { $sort: { _id: 1 } },
  ])

  return result
}

async function getTopSalesCategories(date: DateRange, limit = 5) {
  const result = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: date.from,
          $lte: date.to,
        },
      },
    },
    // Step 1: Unwind orderItems array
    { $unwind: '$items' },
    // Step 2: Group by productId to calculate total sales per product
    {
      $group: {
        _id: '$items.category',
        totalSales: { $sum: '$items.quantity' }, // Assume quantity field in orderItems represents units sold
      },
    },
    // Step 3: Sort by totalSales in descending order
    { $sort: { totalSales: -1 } },
    // Step 4: Limit to top N products
    { $limit: limit },
  ])

  return result
}

// GET VENDOR ORDERS
export async function getVendorOrders({
  vendorId,
  limit,
  page,
}: {
  vendorId: string
  limit?: number
  page: number
}) {
  try {
    const {
      common: { pageSize },
    } = await getSetting()
    limit = limit || pageSize
    await connectToDatabase()
    
    // First, get all products for this vendor
    const vendorProducts = await Product.find({ vendorId }).select('_id');
    const vendorProductIds = vendorProducts.map(product => product._id.toString());
    
    if (vendorProductIds.length === 0) {
      return {
        success: true,
        data: [],
        totalPages: 0,
        totalOrders: 0
      };
    }
    
    // Count total orders for this vendor (for statistics)
    const ordersCount = await Order.countDocuments({
      "items.product": { $in: vendorProductIds }
    });
    
    const skipAmount = (Number(page) - 1) * limit;
    
    // Find orders that contain any products from this vendor
    const orders = await Order.find({
      "items.product": { $in: vendorProductIds }
    })
      .populate('user', 'name email')
      .sort({ createdAt: 'desc' })
      .skip(skipAmount)
      .limit(limit);
    
    // Process orders to only include items from this vendor
    const vendorOrders = orders.map(order => {
      const orderObj = order.toObject();
      
      // Filter items to only include this vendor's products
      const vendorItems = orderObj.items.filter(item => 
        vendorProductIds.includes(item.product.toString())
      );
      
      // Calculate vendor's portion of the order
      const itemsPrice = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      return {
        ...orderObj,
        items: vendorItems,
        itemsPrice,
        // These values are specific to the vendor's portion
        vendorItemsPrice: itemsPrice,
        // Keep the original order total values for reference
        orderTotalPrice: orderObj.totalPrice,
      };
    });
    
    // Serialize orders to ensure they can be passed to the client
    const serializedOrders = JSON.parse(JSON.stringify(vendorOrders));
    
    return {
      success: true,
      data: serializedOrders,
      totalPages: Math.ceil(ordersCount / limit),
      totalOrders: ordersCount
    };
  } catch (error) {
    console.error('Error getting vendor orders:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to get vendor orders'
    };
  }
}

// GET VENDOR SALES ANALYTICS
export async function getVendorSalesAnalytics(vendorId: string) {
  try {
    await connectToDatabase()
    
    // Get all products for this vendor
    const vendorProducts = await Product.find({ vendorId }).select('_id')
    const vendorProductIds = vendorProducts.map(product => product._id.toString())
    
    if (vendorProductIds.length === 0) {
      return {
        success: true,
        data: {
          monthlySales: [],
          totalRevenue: 0,
          totalOrders: 0
        }
      }
    }
    
    // Get the date 6 months ago from now
    const today = new Date()
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1)
    
    // Aggregate monthly sales data for the last 6 months
    const monthlySales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          "items.product": { $in: vendorProductIds.map(id => new mongoose.Types.ObjectId(id)) }
        }
      },
      // Unwind items array so we can filter by product
      { $unwind: "$items" },
      // Match only items that belong to this vendor
      {
        $match: {
          "items.product": { $in: vendorProductIds.map(id => new mongoose.Types.ObjectId(id)) }
        }
      },
      // Calculate sales amount per order item
      {
        $project: {
          month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          amount: { $multiply: ["$items.price", "$items.quantity"] }
        }
      },
      // Group by month
      {
        $group: {
          _id: "$month",
          sales: { $sum: "$amount" }
        }
      },
      // Format the output
      {
        $project: {
          _id: 0,
          month: "$_id",
          amount: "$sales"
        }
      },
      // Sort by month
      { $sort: { month: 1 } }
    ])
    
    // Count total orders for this vendor
    const totalOrders = await Order.countDocuments({
      "items.product": { $in: vendorProductIds.map(id => new mongoose.Types.ObjectId(id)) }
    })
    
    // Calculate total revenue
    const totalRevenue = monthlySales.reduce((sum, item) => sum + item.amount, 0)
    
    // Generate complete month series for the last 6 months (filling in any gaps)
    const monthLabels = []
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const monthString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthLabels.unshift(monthString)
    }
    
    // Create final dataset with all months (including zeros for months with no sales)
    const completeMonthlyData = monthLabels.map(month => {
      const existingData = monthlySales.find(item => item.month === month)
      return {
        month,
        amount: existingData ? existingData.amount : 0
      }
    })
    
    // Log the generated data to help with debugging
    console.log('Generated monthly sales data:', completeMonthlyData)
    
    return {
      success: true,
      data: {
        monthlySales: completeMonthlyData,
        totalRevenue,
        totalOrders
      }
    }
    
  } catch (error) {
    console.error('Error getting vendor sales analytics:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to get sales analytics' 
    }
  }
}

// GET VENDOR TOP PRODUCTS
export async function getVendorTopProducts(vendorId: string, limit: number = 5) {
  try {
    await connectToDatabase()
    
    // Get all products for this vendor
    const vendorProducts = await Product.find({ vendorId }).select('_id')
    const vendorProductIds = vendorProducts.map(product => product._id.toString())
    
    if (vendorProductIds.length === 0) {
      return {
        success: true,
        data: []
      }
    }
    
    // Aggregate top selling products
    const topProducts = await Order.aggregate([
      // Match orders that contain vendor's products
      {
        $match: {
          "items.product": { $in: vendorProductIds.map(id => new mongoose.Types.ObjectId(id)) }
        }
      },
      // Unwind the items array
      { $unwind: "$items" },
      // Match only the items that belong to this vendor
      {
        $match: {
          "items.product": { $in: vendorProductIds.map(id => new mongoose.Types.ObjectId(id)) }
        }
      },
      // Group by product
      {
        $group: {
          _id: {
            productId: "$items.product",
            name: "$items.name",
            image: "$items.image"
          },
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      // Format the output
      {
        $project: {
          _id: 0,
          productId: "$_id.productId",
          name: "$_id.name",
          image: "$_id.image",
          totalSold: 1,
          totalRevenue: 1
        }
      },
      // Sort by total sold in descending order
      { $sort: { totalSold: -1 } },
      // Limit to top N products
      { $limit: limit }
    ])
    
    return {
      success: true,
      data: topProducts
    }
    
  } catch (error) {
    console.error('Error getting vendor top products:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to get top products' 
    }
  }
}

// Special function for guest checkout that bypasses Mongoose
export const createGuestOrder = async (clientSideCart: Cart) => {
  try {
    await connectToDatabase();
    
    // Prepare the cart data
    const cart = {
      ...clientSideCart,
      ...calcDeliveryDateAndPrice({
        items: clientSideCart.items,
        shippingAddress: clientSideCart.shippingAddress,
        deliveryDateIndex: clientSideCart.deliveryDateIndex,
      }),
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
