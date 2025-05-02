import { auth } from '@/auth'
import { getVendorByUserId } from '@/lib/actions/vendor.server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ShoppingCart, Store } from 'lucide-react'

export default async function VendorDashboardPage() {
  const session = await auth()
  const { data: vendor } = await getVendorByUserId(session?.user?.id || '')
  console.log(vendor)

  return (
    <div className='space-y-4'>
      <h2 className='text-3xl font-bold tracking-tight'>Dashboard</h2>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Products</CardTitle>
            <Package className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>0</div>
            <p className='text-xs text-muted-foreground'>
              Products in your store
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Orders</CardTitle>
            <ShoppingCart className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>0</div>
            <p className='text-xs text-muted-foreground'>
              Orders received
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Store Status</CardTitle>
            <Store className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold capitalize'>
              {vendor?.vendorDetails?.status || 'pending'}
            </div>
            <p className='text-xs text-muted-foreground'>
              Your store status
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 