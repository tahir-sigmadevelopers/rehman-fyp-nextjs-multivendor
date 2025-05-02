import { Metadata } from 'next'
import { auth } from '@/auth'
import { getVendorByUserId } from '@/lib/actions/vendor.server'
import { InfoIcon, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import StoreInformationForm from './store-information-form'

const PAGE_TITLE = 'Edit Store Information'
export const metadata: Metadata = {
  title: PAGE_TITLE,
}

export default async function EditStoreInformationPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return (
      <div className="relative w-full rounded-lg border p-4 bg-background">
        <InfoIcon className="h-4 w-4 absolute left-4 top-4" />
        <div className="pl-7">
          <h5 className="mb-1 font-medium leading-none tracking-tight">Authentication required</h5>
          <div className="text-sm">
            Please <Link href="/sign-in" className="underline">sign in</Link> to access this page.
          </div>
        </div>
      </div>
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
        
        <div className="relative w-full rounded-lg border p-4 bg-background">
          <InfoIcon className="h-4 w-4 absolute left-4 top-4" />
          <div className="pl-7">
            <h5 className="mb-1 font-medium leading-none tracking-tight">Not a vendor</h5>
            <div className="text-sm">
              You are not registered as a vendor. 
              <Link href="/account/become-seller" className="underline ml-1">
                Apply to become a seller
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (vendor.vendorDetails?.status !== 'approved') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="h1-bold">{PAGE_TITLE}</h1>
        </div>
        
        <div className="relative w-full rounded-lg border p-4 bg-background">
          <InfoIcon className="h-4 w-4 absolute left-4 top-4" />
          <div className="pl-7">
            <h5 className="mb-1 font-medium leading-none tracking-tight">Vendor status not approved</h5>
            <div className="text-sm">
              Your vendor application is {vendor.vendorDetails?.status}. You need to be approved before you can edit store information.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link 
            href="/account/vendor-dashboard" 
            className="text-sm text-muted-foreground hover:text-primary inline-flex items-center"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="h1-bold mt-2">{PAGE_TITLE}</h1>
        </div>
      </div>
      
      <StoreInformationForm 
        vendor={vendor} 
        vendorId={session.user.id} 
      />
    </div>
  )
} 