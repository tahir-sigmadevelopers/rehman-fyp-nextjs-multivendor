import Link from 'next/link'
import { Metadata } from 'next'
import { auth } from '@/auth'
import { getVendorByUserId } from '@/lib/actions/vendor.server'
import { 
  InfoIcon, 
  ShoppingBag, 
  BarChart3, 
  Users, 
  CircleDollarSign, 
  TrendingUp,
  Package,
  ChevronRight,
  Calendar,
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const PAGE_TITLE = 'Vendor Dashboard'
export const metadata: Metadata = {
  title: PAGE_TITLE,
}

export default async function VendorDashboardPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return (
      <div className="relative w-full rounded-lg border p-4 bg-background">
        <InfoIcon className="h-4 w-4 absolute left-4 top-4" />
        <div className="pl-7">
          <h5 className="mb-1 font-medium leading-none tracking-tight">Authentication required</h5>
          <div className="text-sm">
            Please <Link href="/sign-in" className="underline">sign in</Link> to access your vendor dashboard.
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

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    approved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
  }

  // Mock data for the UI demonstration
  const recentOrders = [
    { id: 'ORD7891', date: 'Today, 2:30 PM', amount: '$129.95', status: 'Processing' },
    { id: 'ORD6543', date: 'Yesterday, 11:20 AM', amount: '$89.00', status: 'Shipped' },
    { id: 'ORD5432', date: '2 days ago', amount: '$54.50', status: 'Delivered' },
  ]

  const topProducts = [
    { name: 'Premium Headphones', sales: 28, revenue: '$2,800' },
    { name: 'Wireless Keyboard', sales: 24, revenue: '$1,920' },
    { name: 'HD Webcam', sales: 21, revenue: '$1,470' },
  ]

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border">
        <div>
          <h1 className="text-3xl font-bold">{PAGE_TITLE}</h1>
          <p className="text-muted-foreground mt-1">
            Manage your products, orders, and store settings
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div 
            className={cn(
              "px-3 py-1 rounded-full text-sm font-medium border",
              statusColors[vendor.vendorDetails?.status || 'pending']
            )}
          >
            Status: {vendor.vendorDetails?.status || 'Unknown'}
          </div>
          
          {vendor.vendorDetails?.status === 'approved' && (
            <div className="flex gap-2">
              <Button asChild variant="outline" className="gap-2">
                <Link href="/account/vendor-dashboard/manage-products">
                  <Package className="h-4 w-4" />
                  Manage Products
                </Link>
              </Button>
              <Button asChild className="gap-2">
                <Link href="/account/vendor-dashboard/new-product">
                  <ShoppingBag className="h-4 w-4" />
                  Add New Product
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Application Status Alerts */}
      {vendor.vendorDetails?.status === 'pending' && (
        <div className="relative w-full rounded-lg border p-4 bg-amber-50 border-amber-200 text-amber-800">
          <InfoIcon className="h-5 w-5 text-amber-500 absolute left-4 top-4" />
          <div className="pl-7">
            <h5 className="mb-1 font-medium leading-none tracking-tight text-amber-800 font-semibold text-base">Application Under Review</h5>
            <div className="text-sm text-amber-700">
              Your application is currently being reviewed by our team. This process typically takes 2-3 business days.
              While you wait, you can prepare product information and images for your store.
            </div>
          </div>
        </div>
      )}
      
      {vendor.vendorDetails?.status === 'rejected' && (
        <div className="relative w-full rounded-lg border p-4 bg-red-50 border-red-200 text-red-800">
          <InfoIcon className="h-5 w-5 text-red-500 absolute left-4 top-4" />
          <div className="pl-7">
            <h5 className="mb-1 font-medium leading-none tracking-tight text-red-800 font-semibold text-base">Application Rejected</h5>
            <div className="text-sm text-red-700">
              Unfortunately, your vendor application has been rejected. This may be due to incomplete information 
              or not meeting our vendor requirements. Please contact our support team for more details and information
              on how to reapply.
            </div>
          </div>
        </div>
      )}
      
      {vendor.vendorDetails?.status === 'approved' && (
        <>
          {/* Stats Overview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">$4,929.00</p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <CircleDollarSign className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-sm text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>+12.5% from last month</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold">34</p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-sm text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>+8.2% from last month</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                    <p className="text-2xl font-bold">12</p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <ShoppingBag className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                  <span>4 active listings</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Customers</p>
                    <p className="text-2xl font-bold">21</p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-sm text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>+14.3% from last month</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Store Info */}
            <Card className="md:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle>Store Information</CardTitle>
                <CardDescription>Your brand details and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Brand Name</span>
                  <span className="font-medium">{vendor.vendorDetails?.brandName}</span>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Brand Logo</span>
                  {vendor.vendorDetails?.logo ? (
                    <div className="h-24 w-24 rounded-md border overflow-hidden">
                      <img 
                        src={vendor.vendorDetails.logo}
                        alt="Brand Logo"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-24 w-24 rounded-md border flex items-center justify-center bg-muted">
                      <p className="text-sm text-muted-foreground">No logo</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Banner Image</span>
                  {vendor.vendorDetails?.banner ? (
                    <div className="h-32 w-full rounded-md border overflow-hidden">
                      <img 
                        src={vendor.vendorDetails.banner}
                        alt="Banner"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-32 w-full rounded-md border flex items-center justify-center bg-muted">
                      <p className="text-sm text-muted-foreground">No banner</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-3">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/account/vendor-dashboard/edit-store">
                    Edit Store Information
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Recent Orders */}
            <Card className="md:col-span-1 lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>Latest customer purchases</CardDescription>
                  </div>
                  <Button variant="ghost" className="gap-1" asChild>
                    <Link href="/account/orders">
                      View All <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left py-3 px-6">Order ID</th>
                        <th className="text-left py-3 px-6">Date</th>
                        <th className="text-left py-3 px-6">Amount</th>
                        <th className="text-left py-3 px-6">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order, i) => (
                        <tr key={order.id} className={cn("border-b", i === recentOrders.length - 1 && "border-b-0")}>
                          <td className="py-3 px-6 font-medium">{order.id}</td>
                          <td className="py-3 px-6 text-muted-foreground">{order.date}</td>
                          <td className="py-3 px-6">{order.amount}</td>
                          <td className="py-3 px-6">
                            <Badge variant={order.status === 'Processing' ? 'outline' : 'default'}>
                              {order.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            {/* Top Performing Products */}
            <Card className="md:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Your best selling items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {topProducts.map((product, i) => (
                    <div key={i} className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{product.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{product.sales} sold</Badge>
                          <span className="text-sm text-muted-foreground">{product.revenue}</span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className="h-4 w-4 fill-primary text-primary" />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="pt-3">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/account/vendor-dashboard/manage-products">Manage Products</Link>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Sales Analytics */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Sales Analytics</CardTitle>
                    <CardDescription>Your store performance over time</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">Weekly</Button>
                    <Button variant="outline" size="sm">Monthly</Button>
                    <Button size="sm">Yearly</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="h-[300px] w-full flex items-center justify-center border rounded-md bg-muted/40">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <BarChart3 className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground max-w-[250px]">
                      Sales analytics will be available once you have completed sales
                    </p>
                    <Button variant="outline" size="sm" className="mt-2">View Reports</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Calendar & Events */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Upcoming</CardTitle>
                <CardDescription>Store events and reminders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Product Launch</p>
                      <p className="text-sm text-muted-foreground">June 15, 2023 • 10:00 AM</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Inventory Check</p>
                      <p className="text-sm text-muted-foreground">June 20, 2023 • 2:00 PM</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" className="w-full gap-1">
                  Add Event <Calendar className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </>
      )}
    </div>
  )
} 