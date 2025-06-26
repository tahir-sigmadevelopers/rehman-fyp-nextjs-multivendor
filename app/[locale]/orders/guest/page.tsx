import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ShoppingBag } from 'lucide-react'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Find Your Guest Order',
}

export default function GuestOrderSearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const orderId = searchParams.orderId as string | undefined

  // If orderId is provided, redirect to the order page
  if (orderId) {
    redirect(`/orders/guest/${orderId}`)
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4 flex items-center justify-center">
          <ShoppingBag className="mr-2 h-8 w-8" />
          Find Your Guest Order
        </h1>
        <p className="text-muted-foreground">
          Enter your order ID to track your guest order status
        </p>
      </div>

      <Card>
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle>Order Lookup</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form action="/orders/guest" className="space-y-4">
            <div>
              <label htmlFor="orderId" className="block text-sm font-medium mb-1">
                Order ID
              </label>
              <div className="flex gap-2">
                <Input 
                  id="orderId"
                  name="orderId"
                  placeholder="Enter your order ID"
                  className="flex-1"
                  required
                />
                <Button type="submit" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Find Order
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Your order ID was provided in your order confirmation email
              </p>
            </div>
          </form>

          <div className="mt-8 border-t pt-6">
            <h3 className="font-medium mb-4">Don't have your order ID?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              If you've lost your order ID, please contact our customer service with your email address and order details.
            </p>
            <Button variant="outline" asChild>
              <a href="/contact">Contact Customer Service</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 