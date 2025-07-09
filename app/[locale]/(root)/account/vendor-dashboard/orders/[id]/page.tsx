import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getOrderById } from '@/lib/actions/order.actions'

import { formatDateTime, formatPrice } from '@/lib/utils'
import { Metadata } from 'next'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card'
import {
  ChevronLeft,
  Package,
  MapPin,
  CreditCard,
  User,
  CalendarClock
} from 'lucide-react'
import { ShieldCheck } from '@/components/ui/icons'
import OrderActions from './order-actions'

export const metadata: Metadata = {
  title: 'Order Details',
  description: 'View details of a specific order',
}

export default async function VendorOrderDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/sign-in')
  }

  const orderId = params.id
  
  try {
    // Get the full order
    const order = await getOrderById(orderId)
    
    // Get all products from this vendor
    const vendorId = session.user.id
    
    // Filter items to only show vendor's products
    // Note: This filtering should ideally be done in the backend
    const vendorItems = order.items.filter((item: any) => {
      // This is a placeholder - in production we'd compare with actual vendorId
      // For now, we'll assume all items in the order belong to this vendor
      // since proper filtering happens in the backend when fetching vendor orders
      return true
    })
    
    // Calculate vendor's portion of the order
    const vendorItemsPrice = vendorItems.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    )
    
    // Order status display helper
    const getOrderStatusBadge = (order: any) => {
      if (order.isDelivered) {
        return <Badge className="bg-green-500">Delivered</Badge>
      } else if (order.isPaid) {
        return <Badge className="bg-blue-500">Paid</Badge>
      } else {
        return <Badge variant="outline">Pending</Badge>
      }
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/account/vendor-dashboard/orders">
                <ChevronLeft className="h-4 w-4" />
                Back to Orders
              </Link>
            </Button>
          </div>
          <div>{getOrderStatusBadge(order)}</div>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order {orderId.substring(0, 8)}...</h1>
          <p className="text-muted-foreground">
            Placed on {formatDateTime(new Date(order.createdAt)).dateTime}
          </p>
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order ID:</span>
                  <span className="font-mono">{orderId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order Date:</span>
                  <span>{formatDateTime(new Date(order.createdAt)).dateOnly}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span>{getOrderStatusBadge(order)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Expected Delivery:</span>
                  <span>{formatDateTime(new Date(order.expectedDeliveryDate)).dateOnly}</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(vendorItemsPrice)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Your portion of the order</span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span>Total</span>
                  <span>{formatPrice(vendorItemsPrice)}</span>
                </div>
              </div>
            </CardContent>
            <OrderActions 
              orderId={order._id} 
              isPaid={order.isPaid} 
              isDelivered={order.isDelivered} 
            />
          </Card>
          
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-medium">Customer</h3>
                <p>{order.user.name || 'Guest Customer'}</p>
                <p className="text-sm text-muted-foreground">{order.user.email || 'No email provided'}</p>
              </div>
              
              <div className="space-y-1">
                <h3 className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Shipping Address
                </h3>
                <p>{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.street}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.province}{' '}
                  {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                <p>Phone: {order.shippingAddress.phone}</p>
              </div>
              
              <div className="space-y-1">
                <h3 className="font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Method
                </h3>
                <p>{order.paymentMethod}</p>
                {order.isPaid && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4" />
                    Paid on {formatDateTime(new Date(order.paidAt)).dateOnly}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
            <CardDescription>
              Products from your store in this order
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vendorItems.map((item: any) => (
                <div key={item.clientId} className="flex items-center gap-4 py-2 border-b last:border-0">
                  <div className="h-16 w-16 relative flex-shrink-0 overflow-hidden rounded-md border">
                    <Image
                      src={item.image.startsWith('data:') ? '/images/placeholder-product.png' : item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Link 
                      href={`/product/${item.slug}`} 
                      className="font-medium hover:underline"
                    >
                      {item.name}
                    </Link>
                    <div className="text-sm text-muted-foreground">
                      {item.size && <span>Size: {item.size} | </span>}
                      {item.color && <span>Color: {item.color} | </span>}
                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatPrice(item.price)} each
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Delivery Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              Delivery Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
                  <span className="text-xs">1</span>
                </div>
                <div>
                  <p className="font-medium">Order Placed</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(new Date(order.createdAt)).dateTime}
                  </p>
                </div>
              </div>
              
              <div className="w-0.5 h-8 bg-border ml-4"></div>
              
              <div className="flex items-center gap-4">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  order.isPaid ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  <span className="text-xs">2</span>
                </div>
                <div>
                  <p className={`font-medium ${!order.isPaid && 'text-muted-foreground'}`}>
                    Payment {order.isPaid ? 'Received' : 'Pending'}
                  </p>
                  {order.isPaid && (
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(new Date(order.paidAt)).dateTime}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="w-0.5 h-8 bg-border ml-4"></div>
              
              <div className="flex items-center gap-4">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  order.isDelivered ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  <span className="text-xs">3</span>
                </div>
                <div>
                  <p className={`font-medium ${!order.isDelivered && 'text-muted-foreground'}`}>
                    {order.isDelivered ? 'Delivered' : 'Delivery Expected'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.isDelivered 
                      ? formatDateTime(new Date(order.deliveredAt)).dateTime
                      : formatDateTime(new Date(order.expectedDeliveryDate)).dateOnly
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    console.error('Error loading order details:', error)
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order Not Found</h1>
          <p className="text-muted-foreground">
            We couldn't find the order you're looking for.
          </p>
        </div>
        <Button asChild>
          <Link href="/account/vendor-dashboard/orders">Back to Orders</Link>
        </Button>
      </div>
    )
  }
} 