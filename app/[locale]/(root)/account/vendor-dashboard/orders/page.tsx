import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getVendorOrders } from '@/lib/actions/order.actions'
import VendorOrdersTable from './orders-table'
import { Separator } from '@/components/ui/separator'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vendor Orders',
  description: 'Manage your store orders',
}

export default async function VendorOrdersPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/sign-in')
  }

  // Default to page 1 if not specified
  const page = searchParams.page ? parseInt(searchParams.page) : 1
  
  // Get vendor orders
  const vendorOrdersResponse = await getVendorOrders({
    vendorId: session.user.id,
    page,
  })

  // Default totalPages to 1 if not provided or not successful
  const totalPages = vendorOrdersResponse.success && vendorOrdersResponse.totalPages 
    ? vendorOrdersResponse.totalPages 
    : 1

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Your Store Orders</h3>
        <p className="text-sm text-muted-foreground">
          Manage orders from customers who purchased your products.
        </p>
      </div>
      <Separator />
      <VendorOrdersTable 
        initialOrders={vendorOrdersResponse.success ? vendorOrdersResponse.data : []}
        totalPages={totalPages}
        currentPage={page}
        vendorId={session.user.id}
      />
    </div>
  )
} 