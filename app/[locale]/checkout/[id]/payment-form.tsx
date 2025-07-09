'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { IOrder } from '@/lib/db/models/order.model'
import { formatDateTime } from '@/lib/utils'

import CheckoutFooter from '../checkout-footer'
import { redirect, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import ProductPrice from '@/components/shared/product/product-price'
import StripeForm from './stripe-form'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Alert, AlertDescription } from '@/components/ui/alert'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
)
export default function OrderDetailsForm({
  order,
  clientSecret,
  isAdmin,
  isGuestOrder = false,
}: {
  order: IOrder
  isAdmin: boolean
  clientSecret: string | null
  isGuestOrder?: boolean
}) {
  const router = useRouter()
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
  } = order
  const { toast } = useToast()

  if (isPaid) {
    if (isGuestOrder) {
      redirect(`/orders/guest/${order._id}`)
    } else {
      redirect(`/account/orders/${order._id}`)
    }
  }

  const CheckoutSummary = () => (
    <Card>
      <CardContent className='p-4'>
        {isGuestOrder && (
          <Alert className="mb-4 bg-blue-50 border-blue-100">
            <div className="flex items-start">
              <div className="bg-blue-100 p-1 rounded-full mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <AlertDescription className="text-blue-700">
                <span className="font-medium">Guest Checkout:</span> Please save your order number: <span className="font-bold">{order._id}</span> for future reference.
              </AlertDescription>
            </div>
          </Alert>
        )}
        <div>
          <div className='text-lg font-bold'>Order Summary</div>
          <div className='space-y-2'>
            <div className='flex justify-between'>
              <span>Items:</span>
              <span>
                {' '}
                <ProductPrice price={itemsPrice} plain />
              </span>
            </div>
            <div className='flex justify-between'>
              <span>Shipping & Handling:</span>
              <span>
                {shippingPrice === undefined ? (
                  '--'
                ) : shippingPrice === 0 ? (
                  <span className="text-green-600">FREE</span>
                ) : (
                  <ProductPrice price={shippingPrice} plain />
                )}
              </span>
            </div>
            <div className='flex justify-between'>
              <span> Tax:</span>
              <span>
                {taxPrice === undefined ? (
                  '--'
                ) : (
                  <ProductPrice price={taxPrice} plain />
                )}
              </span>
            </div>
            <div className='flex justify-between pt-3 border-t mt-2'>
              <span className="font-bold">Order Total:</span>
              <span className="font-bold text-lg">
                {' '}
                <ProductPrice price={totalPrice} plain />
              </span>
            </div>

            {!isPaid && paymentMethod === 'Stripe' && clientSecret && (
              <div className="mt-4">
                <div className="bg-gray-50 p-3 rounded-md mb-3">
                  <p className="text-sm text-center">Complete your payment with Stripe</p>
                </div>
                <Elements
                  options={{
                    clientSecret,
                  }}
                  stripe={stripePromise}
                >
                  <StripeForm
                    priceInCents={Math.round(order.totalPrice * 100)}
                    orderId={order._id}
                  />
                </Elements>
              </div>
            )}

            {!isPaid && paymentMethod === 'Cash On Delivery' && (
              <div className="mt-4">
                <div className="bg-green-50 p-3 rounded-md mb-3 border border-green-100">
                  <p className="text-sm text-green-700 text-center">Your order has been placed successfully with Cash On Delivery</p>
                </div>
                <Button
                  className='w-full rounded-full bg-primary hover:bg-primary/90'
                  onClick={() => router.push(isGuestOrder ? `/orders/guest/${order._id}` : `/account/orders/${order._id}`)}
                >
                  View Order
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <main className='max-w-6xl mx-auto'>
      <div className='grid md:grid-cols-4 gap-6'>
        <div className='md:col-span-3'>
          {/* Shipping Address */}
          <div>
            <div className='grid md:grid-cols-3 my-3 pb-3'>
              <div className='text-lg font-bold'>
                <span>Shipping Address</span>
              </div>
              <div className='col-span-2'>
                <p>
                  {shippingAddress.fullName} <br />
                  {shippingAddress.street} <br />
                  {`${shippingAddress.city}, ${shippingAddress.province}, ${shippingAddress.postalCode}, ${shippingAddress.country}`}
                </p>
              </div>
            </div>
          </div>

          {/* payment method */}
          <div className='border-y'>
            <div className='grid md:grid-cols-3 my-3 pb-3'>
              <div className='text-lg font-bold'>
                <span>Payment Method</span>
              </div>
              <div className='col-span-2'>
                <p>{paymentMethod}</p>
              </div>
            </div>
          </div>

          <div className='grid md:grid-cols-3 my-3 pb-3'>
            <div className='flex text-lg font-bold'>
              <span>Items and shipping</span>
            </div>
            <div className='col-span-2'>
              <p>
                Delivery date:
                {formatDateTime(expectedDeliveryDate).dateOnly}
              </p>
              <ul>
                {items.map((item) => (
                  <li key={item.slug}>
                    {item.name} x {item.quantity} = {item.price}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className='block md:hidden'>
            <CheckoutSummary />
          </div>
        </div>
        <div className='hidden md:block'>
          <CheckoutSummary />
        </div>
      </div>
      <CheckoutFooter />
    </main>
  )
}
