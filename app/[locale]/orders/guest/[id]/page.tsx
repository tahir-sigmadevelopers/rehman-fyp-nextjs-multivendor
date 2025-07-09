import { notFound } from 'next/navigation'
import React from 'react'
import { getOrderById } from '@/lib/actions/order.actions'
import { formatId, formatDateTime } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import ProductPrice from '@/components/shared/product/product-price'
import Link from 'next/link'
import { ShoppingBag, Package, MapPin, CalendarIcon } from 'lucide-react'
import GuestOrderHeader from '../header'

export async function generateMetadata(props: {
  params: Promise<{ id: string }>
}) {
  const params = await props.params

  return {
    title: `Guest Order ${formatId(params.id)}`,
  }
}

export default async function GuestOrderDetailsPage(props: {
  params: Promise<{
    id: string
  }>
}) {
  const params = await props.params
  const { id } = params

  const order = await getOrderById(id)
  if (!order) notFound()

  // Verify this is a guest order
  const isGuestOrder = typeof order.user === 'object' && order.user !== null && (order.user as any).isGuest === true
  if (!isGuestOrder) {
    // This is not a guest order, redirect to login
    return (
      <div className="max-w-6xl mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-4">This order requires login to view</h2>
            <p className="mb-4">This order belongs to a registered user. Please login to view this order.</p>
            <Link 
              href={`/sign-in?callbackUrl=/account/orders/${id}`}
              className="inline-block px-6 py-2 bg-primary text-white rounded-full"
            >
              Sign In
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const {
    shippingAddress,
    items,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentMethod,
    expectedDeliveryDate,
    isPaid,
    isDelivered,
    createdAt,
  } = order

  const guestUser = order.user as { name: string; email: string; isGuest: boolean }

  return (
    <>
      <GuestOrderHeader />
      <div className="max-w-6xl mx-auto py-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2 flex items-center">
            <ShoppingBag className="mr-2 h-6 w-6" />
            Guest Order {formatId(order._id)}
          </h1>
          <p className="text-muted-foreground">
            Placed on {formatDateTime(createdAt).dateOnly}
          </p>
        </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Order Status */}
          <Card>
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-lg">Order Status</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                <div className="flex-1">
                  <h3 className="font-medium mb-2 flex items-center">
                    <Package className="mr-2 h-4 w-4" />
                    Payment Status
                  </h3>
                  <div className={`text-sm ${isPaid ? 'text-green-600' : 'text-amber-600'}`}>
                    {isPaid ? 'Paid' : 'Pending Payment'}
                  </div>
                  {paymentMethod && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Method: {paymentMethod}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-2 flex items-center">
                    <Package className="mr-2 h-4 w-4" />
                    Delivery Status
                  </h3>
                  <div className={`text-sm ${isDelivered ? 'text-green-600' : 'text-amber-600'}`}>
                    {isDelivered ? 'Delivered' : 'Pending Delivery'}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center">
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    Expected: {formatDateTime(expectedDeliveryDate).dateOnly}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-lg">Order Items</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={item.clientId} className="flex gap-4">
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="80px"
                        style={{ objectFit: 'contain' }}
                        className="rounded-md"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <div className="text-sm text-muted-foreground">
                        Quantity: {item.quantity}
                      </div>
                      {item.size && (
                        <div className="text-sm text-muted-foreground">
                          Size: {item.size}
                        </div>
                      )}
                      {item.color && (
                        <div className="text-sm text-muted-foreground">
                          Color: {item.color}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        <ProductPrice price={item.price * item.quantity} plain />
                      </div>
                      {item.quantity > 1 && (
                        <div className="text-sm text-muted-foreground">
                          {item.quantity} x <ProductPrice price={item.price} plain />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-lg">Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                <div>
                  <p className="font-medium">{shippingAddress.fullName}</p>
                  <p>{shippingAddress.street}</p>
                  <p>
                    {shippingAddress.city}, {shippingAddress.province},{' '}
                    {shippingAddress.postalCode}
                  </p>
                  <p>{shippingAddress.country}</p>
                  <p className="mt-1">Phone: {shippingAddress.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-4">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Customer Information</h3>
                  <div className="text-sm">
                    <p>Name: {guestUser.name}</p>
                    <p>Email: {guestUser.email}</p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Price Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Items:</span>
                      <span><ProductPrice price={itemsPrice} plain /></span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping:</span>
                      <span>
                        {shippingPrice === 0 ? (
                          <span className="text-green-600">FREE</span>
                        ) : (
                          <ProductPrice price={shippingPrice} plain />
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax:</span>
                      <span><ProductPrice price={taxPrice} plain /></span>
                    </div>
                    <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                      <span>Total:</span>
                      <span><ProductPrice price={totalPrice} plain /></span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Need Help?</h3>
                  <div className="text-sm">
                    <p>For any questions about your order, please contact our customer service.</p>
                    <Link href="/contact" className="text-primary hover:underline block mt-2">
                      Contact Us
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  )
} 