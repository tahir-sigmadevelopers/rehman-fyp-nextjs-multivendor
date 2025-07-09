'use server'

import { Cart, IOrderList, OrderItem, ShippingAddress } from '@/types'
import { formatError, round2 } from '../utils'
import { connectToDatabase } from '../db'
import { auth } from '@/auth'
import { OrderInputSchema } from '../validator'
import Order, { IOrder } from '../db/models/order.model'
import { revalidatePath } from 'next/cache'
import { sendAskReviewOrderItems, sendPurchaseReceipt } from '@/emails'
import { DateRange } from 'react-day-picker'
import Product from '../db/models/product.model'
import User from '../db/models/user.model'
import mongoose from 'mongoose'
import { getSetting } from './setting.actions'

// Utility function to ensure product IDs are ObjectIds
const ensureProductObjectIds = (items: OrderItem[]) => {
  if (!items || !Array.isArray(items)) return items;
  
  return items.map((item: OrderItem) => {
    if (item.product && typeof item.product === 'string' && mongoose.Types.ObjectId.isValid(item.product)) {
      return {
        ...item,
        product: new mongoose.Types.ObjectId(item.product)
      };
    }
    return item;
  });
};

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
      items: ensureProductObjectIds(cart.items), // Ensure product IDs are ObjectIds
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
    items: ensureProductObjectIds(cart.items), // Ensure product IDs are ObjectIds
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
  'use server';
  
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
    
    // Update product stock
    if (!process.env.MONGODB_URI?.startsWith('mongodb://localhost'))
      await updateProductStock(order._id)
    
    // Send email notification
    if (order.user.email) await sendPurchaseReceipt({ order })
    
    // Revalidate all relevant paths
    revalidatePath(`/account/orders/${orderId}`)
    revalidatePath(`/admin/orders/${orderId}`)
    revalidatePath(`/account/vendor-dashboard/orders/${orderId}`)
    revalidatePath(`/admin/orders`)
    revalidatePath(`/account/vendor-dashboard/orders`)
    
    return { success: true, message: 'Order marked as paid successfully' }
  } catch (err) {
    console.error('Error updating order to paid:', err)
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
  'use server';
  
  try {
    await connectToDatabase()
    const order = await Order.findById(orderId).populate<{
      user: { email: string; name: string }
    }>('user', 'name email')
    
    if (!order) throw new Error('Order not found')
    if (!order.isPaid) throw new Error('Order must be paid before it can be delivered')
    if (order.isDelivered) throw new Error('Order is already marked as delivered')
    
    order.isDelivered = true
    order.deliveredAt = new Date()
    await order.save()
    
    // Send email notification
    if (order.user.email) await sendAskReviewOrderItems({ order })
    
    // Revalidate all relevant paths
    revalidatePath(`/account/orders/${orderId}`)
    revalidatePath(`/admin/orders/${orderId}`)
    revalidatePath(`/account/vendor-dashboard/orders/${orderId}`)
    revalidatePath(`/admin/orders`)
    revalidatePath(`/account/vendor-dashboard/orders`)
    
    return { success: true, message: 'Order marked as delivered successfully' }
  } catch (err) {
    console.error('Error marking order as delivered:', err)
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
    
    console.log(`[getVendorOrders] Fetching orders for vendor: ${vendorId}`)
    
    // First, get all products for this vendor
    const vendorProducts = await Product.find({ vendorId }).select('_id');
    console.log(`[getVendorOrders] Found ${vendorProducts.length} products for this vendor`)
    
    // Create both ObjectId and string versions of product IDs for the query
    const vendorProductObjectIds = vendorProducts.map(product => product._id);
    const vendorProductIdStrings = vendorProducts.map(product => product._id.toString());
    
    console.log(`[getVendorOrders] Product IDs: ${vendorProductIdStrings.slice(0, 3).join(', ')}${vendorProductIdStrings.length > 3 ? '...' : ''}`)
    
    if (vendorProductObjectIds.length === 0) {
      console.log(`[getVendorOrders] No products found for vendor ${vendorId}`)
      return {
        success: true,
        data: [],
        totalPages: 0,
        totalOrders: 0
      };
    }
    
    // DEBUGGING: Check if products with this vendorId actually exist
    console.log(`[getVendorOrders] Sample vendor product details:`, vendorProducts.slice(0, 1).map(p => ({
      _id: p._id.toString(),
      _idType: typeof p._id,
      isObjectId: mongoose.Types.ObjectId.isValid(p._id)
    })));
    
    // Get a sample order to check product ID format
    const sampleOrder = await Order.findOne().limit(1);
    if (sampleOrder) {
      console.log(`[getVendorOrders] Sample order ID: ${sampleOrder._id}`);
      console.log(`[getVendorOrders] Sample order item count: ${sampleOrder.items.length}`);
      if (sampleOrder.items.length > 0) {
        const sampleItem = sampleOrder.items[0];
        console.log(`[getVendorOrders] Sample order product ID format:`, {
          productId: sampleItem.product,
          productIdToString: String(sampleItem.product),
          productIdType: typeof sampleItem.product,
          isObjectId: mongoose.Types.ObjectId.isValid(sampleItem.product)
        });
      }
    }
    
    // Use $or to match either ObjectId or string versions of the product IDs
    const productIdQuery = {
      $or: [
        // Match against ObjectId
        { "items.product": { $in: vendorProductObjectIds } },
        // Match against string representation
        { "items.product": { $in: vendorProductIdStrings } }
      ]
    };
    
    // DEBUGGING: Log raw query
    console.log(`[getVendorOrders] MongoDB query:`, JSON.stringify(productIdQuery));
    
    // Count total orders for this vendor (for statistics)
    const ordersCount = await Order.countDocuments(productIdQuery);
    
    console.log(`[getVendorOrders] Total orders containing vendor products: ${ordersCount}`)
    
    const skipAmount = (Number(page) - 1) * limit;
    
    // DEBUGGING: Try direct query to find any matching order
    const rawMatch = await Order.aggregate([
      { $unwind: "$items" },
      { 
        $match: { 
          "items.product": { 
            $in: [...vendorProductIdStrings, ...vendorProductObjectIds]
          } 
        }
      },
      { $limit: 1 }
    ]);
    console.log(`[getVendorOrders] Direct aggregate match result count: ${rawMatch.length}`);
    if (rawMatch.length > 0) {
      console.log(`[getVendorOrders] Found direct match with product ID: ${rawMatch[0].items.product}`);
    }
    
    // Find orders that contain any products from this vendor
    const orders = await Order.find(productIdQuery)
      .populate('user', 'name email')
      .sort({ createdAt: 'desc' })
      .skip(skipAmount)
      .limit(limit);
    
    console.log(`[getVendorOrders] Found ${orders.length} orders for page ${page}`)
    
    // Sample an order's structure for debugging if available
    if (orders.length > 0) {
      const sampleOrder = orders[0];
      console.log(`[getVendorOrders] Sample order: ${sampleOrder._id}`)
      console.log(`[getVendorOrders] Sample order items count: ${sampleOrder.items.length}`)
      
      // Check the type of product ID in the order items
      const productTypes = sampleOrder.items.map(item => {
        const productId = item.product;
        return {
          id: String(productId),
          type: mongoose.Types.ObjectId.isValid(productId) ? 'ObjectId' : typeof productId
        };
      });
      console.log(`[getVendorOrders] Product ID types in order: ${JSON.stringify(productTypes)}`);
    }
    
    // Process orders to only include items from this vendor
    const vendorOrders = orders.map(order => {
      const orderObj = order.toObject();
      
      // Filter items to only include this vendor's products
      // Match both ObjectId and string versions
      const vendorItems = orderObj.items.filter(item => {
        const itemProductId = String(item.product);
        const isMatch = vendorProductIdStrings.includes(itemProductId);
        console.log(`[getVendorOrders] Checking item product ${itemProductId} - match: ${isMatch}`);
        return isMatch;
      });
      
      console.log(`[getVendorOrders] Order ${orderObj._id}: Found ${vendorItems.length} items from this vendor out of ${orderObj.items.length} total items`)
      
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
    console.log(`[getVendorTopProducts] Vendor product IDs: ${vendorProductIds}`)
    console.log(`[getVendorTopProducts] Vendor products: ${JSON.stringify(vendorProducts)}`)
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
    const orderCollection = db?.collection('orders');
    
    if (!orderCollection) {
      throw new Error('Failed to access orders collection');
    }
    
    // Process items to ensure all product IDs are ObjectIds
    const processedItems = ensureProductObjectIds(cart.items);
    
    // Create the order document
    const orderDoc = {
      user: {
        name: clientSideCart.userInfo.name,
        email: clientSideCart.userInfo.email,
        isGuest: true
      },
      items: processedItems,
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

// DEBUG FUNCTION - Add this at the end of the file
export async function debugVendorOrderIssue(vendorId: string) {
  try {
    await connectToDatabase()
    
    console.log(`[DEBUG] Checking products and orders for vendor: ${vendorId}`)
    
    // 1. Check if vendor exists
    const vendor = await User.findById(vendorId)
    console.log(`[DEBUG] Vendor found: ${!!vendor}`, vendor ? `Name: ${vendor.name}` : 'No vendor found')
    
    if (!vendor) {
      return {
        success: false,
        message: 'Vendor not found'
      }
    }
    
    // 2. Check vendor's products
    const products = await Product.find({ vendorId }).select('_id name')
    console.log(`[DEBUG] Products count: ${products.length}`)
    
    if (products.length === 0) {
      return {
        success: false,
        message: 'No products found for this vendor',
        suggestion: 'Ensure products have correct vendorId field set'
      }
    }
    
    // Log sample products
    console.log('[DEBUG] Sample products:', products.slice(0, 5).map(p => ({ id: p._id.toString(), name: p.name })))
    
    // 3. Get product IDs
    const productIds = products.map(p => p._id)
    
    // 4. Check if any orders contain these products
    const orderCount = await Order.countDocuments({
      "items.product": { $in: productIds }
    })
    
    console.log(`[DEBUG] Orders containing vendor products: ${orderCount}`)
    
    if (orderCount === 0) {
      // 5. Check if any orders exist at all
      const totalOrders = await Order.countDocuments()
      console.log(`[DEBUG] Total orders in system: ${totalOrders}`)
      
      // 6. Sample a few orders to check their structure
      if (totalOrders > 0) {
        const sampleOrders = await Order.find().limit(2)
        console.log('[DEBUG] Sample order structure:', JSON.stringify(sampleOrders[0], null, 2))
        
        // 7. Check if product IDs in orders match the format of vendor product IDs
        const orderItemProducts = sampleOrders.flatMap(order => 
          order.items.map(item => ({
            productId: item.product.toString(),
            orderId: order._id.toString()
          }))
        )
        
        console.log('[DEBUG] Sample product IDs in orders:', orderItemProducts)
        
        // 8. Check if any products from this vendor match the format in orders
        const productIdStrings = productIds.map(id => id.toString())
        console.log('[DEBUG] Vendor product ID strings:', productIdStrings)
      }
      
      return {
        success: false,
        message: 'No orders found containing vendor products',
        suggestion: 'Check if orders contain the correct product IDs'
      }
    }
    
    // 9. Get sample orders for this vendor
    const sampleVendorOrders = await Order.find({
      "items.product": { $in: productIds }
    }).limit(2)
    
    // Detailed logging of matches between order items and vendor products
    sampleVendorOrders.forEach(order => {
      console.log(`[DEBUG] Order ${order._id}:`)
      
      order.items.forEach(item => {
        const isVendorProduct = productIds.some(id => id.toString() === item.product.toString())
        console.log(`[DEBUG]   - Item: ${item.name}, Product ID: ${item.product}, Belongs to vendor: ${isVendorProduct}`)
      })
    })
    
    return {
      success: true,
      message: `Found ${orderCount} orders containing products from vendor ${vendorId}`,
      data: {
        productCount: products.length,
        orderCount: orderCount,
        sampleOrders: sampleVendorOrders.map(o => ({
          id: o._id.toString(),
          items: o.items.length,
          vendorItems: o.items.filter(item => 
            productIds.some(pid => pid.toString() === item.product.toString())
          ).length
        }))
      }
    }
  } catch (error) {
    console.error('[DEBUG] Error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error debugging vendor order issue'
    }
  }
}

// CREATE DIRECT ORDER - Ensures product IDs are properly converted to ObjectIds
export const createDirectOrder = async (orderData: any) => {
  try {
    await connectToDatabase();
    
    // Process items to ensure all product IDs are ObjectIds
    if (orderData.items && Array.isArray(orderData.items)) {
      orderData.items = ensureProductObjectIds(orderData.items);
    }
    
    // Create the order with Mongoose
    const createdOrder = await Order.create(orderData);
    
    return {
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: createdOrder._id.toString()
      }
    };
  } catch (error) {
    console.error('Direct order creation error:', error);
    return {
      success: false,
      message: formatError(error)
    };
  }
};
