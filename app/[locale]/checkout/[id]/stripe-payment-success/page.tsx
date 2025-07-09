import { notFound, redirect } from 'next/navigation'
import Stripe from 'stripe'
import { getOrderById } from '@/lib/actions/order.actions'
import { formatDateTime } from '@/lib/utils'
import SuccessUI from './success-ui'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export default async function SuccessPage(props: {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{ payment_intent: string }>
}) {
  const params = await props.params
  const { id } = params

  const searchParams = await props.searchParams
  const order = await getOrderById(id)
  if (!order) notFound()

  const paymentIntent = await stripe.paymentIntents.retrieve(
    searchParams.payment_intent
  )
  if (
    paymentIntent.metadata.orderId == null ||
    paymentIntent.metadata.orderId !== order._id.toString()
  )
    return notFound()

  const isSuccess = paymentIntent.status === 'succeeded'
  if (!isSuccess) return redirect(`/checkout/${id}`)
  
  // Check if this is a guest order by checking if user is an object with name/email instead of a string ID
  const isGuestOrder = typeof order.user === 'object' && order.user !== null
  
  // Determine the order link based on whether it's a guest order or not
  const orderLink = isGuestOrder ? `/orders/guest/${id}` : `/account/orders/${id}`
  
  // Format delivery date
  const deliveryDate = formatDateTime(order.expectedDeliveryDate).dateOnly
  
  // Get a sample of items to display (first 3)
  const displayItems = order.items.slice(0, 3)
  const hasMoreItems = order.items.length > 3
  const additionalItemsCount = order.items.length - 3

  return (
    <SuccessUI 
      order={order}
      orderLink={orderLink}
      deliveryDate={deliveryDate}
      displayItems={displayItems}
      hasMoreItems={hasMoreItems}
      additionalItemsCount={additionalItemsCount}
    />
  )
}
