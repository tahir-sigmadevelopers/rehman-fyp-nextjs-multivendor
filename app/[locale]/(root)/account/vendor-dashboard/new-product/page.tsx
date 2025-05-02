import { Metadata } from 'next'
import { auth } from '@/auth'
import { getVendorByUserId } from '@/lib/actions/vendor.server'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { InfoIcon } from 'lucide-react'
import Link from 'next/link'
import VendorProductForm from './vendor-product-form'

const PAGE_TITLE = 'Add New Product'
export const metadata: Metadata = {
  title: PAGE_TITLE,
}

export default async function AddNewProductPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return (
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Authentication required</AlertTitle>
        <AlertDescription>
          Please <Link href="/sign-in" className="underline">sign in</Link> to access this page.
        </AlertDescription>
      </Alert>
    )
  }

  const vendorResponse = await getVendorByUserId(session.user.id)
  const vendor = vendorResponse.success ? vendorResponse.data : null
  
  if (!vendor || !vendor.isVendor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="h1-bold">{PAGE_TITLE}</h1>
        </div>
        
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Not a vendor</AlertTitle>
          <AlertDescription>
            You are not registered as a vendor. 
            <Link href="/account/become-seller" className="underline ml-1">
              Apply to become a seller
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (vendor.vendorDetails?.status !== 'approved') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="h1-bold">{PAGE_TITLE}</h1>
        </div>
        
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Vendor status not approved</AlertTitle>
          <AlertDescription>
            Your vendor application is {vendor.vendorDetails?.status}. You need to be approved before you can add products.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link 
            href="/account/vendor-dashboard" 
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="h1-bold mt-2">{PAGE_TITLE}</h1>
        </div>
      </div>
      
      <VendorProductForm vendorId={session.user.id} />
    </div>
  )
} 