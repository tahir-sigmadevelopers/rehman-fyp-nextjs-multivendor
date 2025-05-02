import { Metadata } from 'next'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/auth'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { VendorRegistrationForm } from './vendor-registration-form'

const PAGE_TITLE = 'Become a Seller'
export const metadata: Metadata = {
  title: PAGE_TITLE,
}

export default async function BecomeSellerPage() {
  const session = await auth()
  return (
    <div className='mb-24'>
      <SessionProvider session={session}>
        <div className='flex gap-2'>
          <Link href='/account'>Your Account</Link>
          <span>›</span>
          <span>{PAGE_TITLE}</span>
        </div>
        <h1 className='h1-bold py-4'>{PAGE_TITLE}</h1>
        <Card className='max-w-2xl'>
          <CardContent className='p-4'>
            <p className='text-sm py-2 mb-4'>
              Fill out the form below to start selling your products on our platform. 
              We'll review your application and get back to you within 2-3 business days.
            </p>
            <VendorRegistrationForm />
          </CardContent>
        </Card>
      </SessionProvider>
    </div>
  )
} 