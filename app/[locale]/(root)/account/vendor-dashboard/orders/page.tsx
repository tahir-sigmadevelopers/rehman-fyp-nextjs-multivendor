import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getVendorOrders } from '@/lib/actions/order.actions'
import VendorOrdersTable from './orders-table'
import { Separator } from '@/components/ui/separator'
import { Metadata } from 'next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { InfoIcon } from 'lucide-react'

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
  const ordersResponse = await getVendorOrders({
    vendorId: session.user.id,
    page,
  })

  // Default totalPages to 1 if not provided
  const totalPages = ordersResponse.totalPages || 1
  
  // Check if there are no orders
  const hasNoOrders = !ordersResponse.data || ordersResponse.data.length === 0

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Your Store Orders</h3>
        <p className="text-sm text-muted-foreground">
          Manage orders containing your products.
        </p>
      </div>
      <Separator />
      
      {hasNoOrders && (
        <Alert variant="default" className="bg-amber-50 border-amber-200">
          <InfoIcon className="h-4 w-4 text-amber-500" />
          <AlertTitle>No orders found</AlertTitle>
          <AlertDescription>
            No customers have purchased your products yet.
          </AlertDescription>
        </Alert>
      )}
      
      <VendorOrdersTable 
        initialOrders={ordersResponse.data || []}
        totalPages={totalPages}
        currentPage={page}
        vendorId={session.user.id}
      />
    </div>
  )
}