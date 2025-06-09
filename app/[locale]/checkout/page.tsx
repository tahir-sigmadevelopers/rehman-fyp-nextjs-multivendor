import { Metadata } from 'next'
import CheckoutForm from './checkout-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingBag } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Checkout',
}

export default async function CheckoutPage() {
  return (
    <>
      <div className="max-w-6xl mx-auto mb-6">
        <Card className="border-none shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <ShoppingBag className="w-6 h-6" />
              Secure Checkout
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You can checkout as a guest without creating an account. Simply provide your name and email to continue.
            </p>
          </CardContent>
        </Card>
      </div>
      <CheckoutForm />
    </>
  )
}
