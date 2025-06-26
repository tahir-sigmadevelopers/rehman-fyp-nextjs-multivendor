import Link from 'next/link'
import { Metadata } from 'next'
import { auth } from '@/auth'
import { getVendorByUserId } from '@/lib/actions/vendor.server'
import { getVendorOrders, getVendorSalesAnalytics, getVendorTopProducts } from '@/lib/actions/order.actions'
import { getVendorProducts } from '@/lib/actions/product.server'
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
import { cn, formatDateTime, formatPrice } from '@/lib/utils'
import SalesChart from './sales-chart'
import { VendorOrdersCard } from './components/orders-card'
import { DashboardStats } from './components/dashboard-stats'
import { EnhancedQuickActions } from './components/enhanced-quick-actions'

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
  
  // Fetch recent orders for this vendor
  let recentOrders = []
  let totalOrders = 0
  let pendingOrders = 0
  let totalRevenue = 0
  let totalProducts = 0
  let activeProducts = 0
  let salesAnalytics: { month: string; amount: number }[] = []
  let topProducts: { productId: string; name: string; image: string; totalSold: number; totalRevenue: number }[] = []
  
  if (vendor && vendor.isVendor && vendor.vendorDetails?.status === 'approved') {
    // Get vendor products
    const productsResponse = await getVendorProducts(session.user.id)
    if (productsResponse.success && productsResponse.data) {
      totalProducts = productsResponse.data.length
      activeProducts = productsResponse.data.filter(product => product.isPublished).length
    }
    
    // Get vendor sales analytics
    const analyticsResponse = await getVendorSalesAnalytics(session.user.id)
    if (analyticsResponse.success && analyticsResponse.data) {
      // Add validation to ensure proper format
      const monthlySales = analyticsResponse.data.monthlySales || [];
      salesAnalytics = monthlySales.map(item => ({
        month: typeof item.month === 'string' && item.month.includes('-') 
          ? item.month 
          : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`, // Default to current month if invalid
        amount: typeof item.amount === 'number' ? item.amount : 0 // Default to 0 if amount is invalid
      }));
      
      // If we already have total revenue from analytics, use it instead of recalculating
      if (analyticsResponse.data.totalRevenue) {
        totalRevenue = analyticsResponse.data.totalRevenue
      }
      if (analyticsResponse.data.totalOrders) {
        totalOrders = analyticsResponse.data.totalOrders
      }
    } else {
      // Fallback to getting vendor orders for revenue calculation
      const allOrdersResponse = await getVendorOrders({
        vendorId: session.user.id,
        page: 1,
        limit: 1000 // Get a large number to calculate total revenue
      })
      
      if (allOrdersResponse.data) {
        totalOrders = allOrdersResponse.data.length
        
        // Calculate total revenue from all orders
        if (allOrdersResponse.data && allOrdersResponse.data.length > 0) {
          totalRevenue = allOrdersResponse.data.reduce((sum: number, order: any) => 
            sum + (order.totalPrice || 0), 0
          )
          
          // Calculate pending orders count
          pendingOrders = allOrdersResponse.data.filter((order: any) => !order.isPaid).length
        }
      }
    }
    
    // Always get recent orders for display, regardless of analytics success
    const recentOrdersResponse = await getVendorOrders({
      vendorId: session.user.id,
      page: 1,
      limit: 3 // Just get the 3 most recent orders
    })
    
    if (recentOrdersResponse.data) {
      recentOrders = recentOrdersResponse.data || []
      console.log('Recent orders:', recentOrders.length)
    }
    
    // Get top selling products
    const topProductsResponse = await getVendorTopProducts(session.user.id, 3)
    if (topProductsResponse.success) {
      topProducts = topProductsResponse.data || []
      console.log('Top products:', topProducts.length)
    }
  }
  
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

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    approved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 p-6 rounded-xl shadow-sm border">
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
              <Button asChild className="gap-2 bg-amber-500 hover:bg-amber-600">
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
          {/* Stats Grid */}
          <DashboardStats
            totalOrders={totalOrders}
            pendingOrders={pendingOrders}
            totalRevenue={totalRevenue}
            totalProducts={totalProducts}
            activeProducts={activeProducts}
            avgOrderValue={totalOrders > 0 ? totalRevenue / totalOrders : 0}
            bestSellingProduct={topProducts.length > 0 ? topProducts[0]?.name : 'None'}
          />

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/account/vendor-dashboard/new-product" className="group flex items-center gap-3 rounded-lg border p-4 transition-all hover:border-primary hover:bg-primary/5 hover:shadow-md">
              <div className="p-2 rounded-full bg-amber-100 text-amber-700 group-hover:bg-amber-200">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Add Product</h3>
                <p className="text-sm text-muted-foreground">Create a new product listing</p>
              </div>
            </Link>
            
            <Link href="/account/vendor-dashboard/manage-products" className="group flex items-center gap-3 rounded-lg border p-4 transition-all hover:border-primary hover:bg-primary/5 hover:shadow-md">
              <div className="p-2 rounded-full bg-blue-100 text-blue-700 group-hover:bg-blue-200">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Manage Products</h3>
                <p className="text-sm text-muted-foreground">Edit or update your listings</p>
              </div>
            </Link>
            
            <Link href="/account/vendor-dashboard/orders" className="group flex items-center gap-3 rounded-lg border p-4 transition-all hover:border-primary hover:bg-primary/5 hover:shadow-md">
              <div className="p-2 rounded-full bg-green-100 text-green-700 group-hover:bg-green-200">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Orders</h3>
                <p className="text-sm text-muted-foreground">Manage customer orders</p>
              </div>
            </Link>
            
            <Link href="/account/vendor-dashboard/sales" className="group flex items-center gap-3 rounded-lg border p-4 transition-all hover:border-primary hover:bg-primary/5 hover:shadow-md">
              <div className="p-2 rounded-full bg-purple-100 text-purple-700 group-hover:bg-purple-200">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Analytics</h3>
                <p className="text-sm text-muted-foreground">View sales performance</p>
              </div>
            </Link>
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
                    <Link href="/account/vendor-dashboard/orders">
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
                      {recentOrders.length > 0 ? (
                        recentOrders.map((order: any, i: number) => (
                          <tr key={order._id} className={cn("border-b", i === recentOrders.length - 1 && "border-b-0")}>
                            <td className="py-3 px-6 font-medium">
                              <span className="font-mono text-xs">{order._id?.substring(0, 10) || 'N/A'}...</span>
                            </td>
                            <td className="py-3 px-6 text-muted-foreground">
                              {order.createdAt ? formatDateTime(new Date(order.createdAt)).dateOnly : 'N/A'}
                            </td>
                            <td className="py-3 px-6">
                              {formatPrice(order.vendorItemsPrice || order.itemsPrice || 0)}
                            </td>
                            <td className="py-3 px-6">
                              <Badge variant={!order.isPaid ? 'outline' : order.isDelivered ? 'default' : 'secondary'}>
                                {!order.isPaid 
                                  ? 'Pending' 
                                  : order.isDelivered 
                                    ? 'Delivered' 
                                    : 'Paid'}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-muted-foreground">
                            No orders yet
                          </td>
                        </tr>
                      )}
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
                {topProducts.length > 0 ? (
                  <div className="space-y-4">
                    {topProducts.map((product, i) => (
                      <div key={product.productId || i} className="flex items-start gap-3">
                        {/* Product Image */}
                        <div className="h-12 w-12 rounded-md border overflow-hidden flex-shrink-0">
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.name} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-muted flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        
                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="font-medium text-sm truncate mb-1">{product.name}</p>
                            <div className="flex">
                              {/* Show 5, 4, or 3 stars based on position */}
                              {Array.from({ length: 5 - i }).map((_, index) => (
                                <Star key={index} className="h-3 w-3 fill-primary text-primary" />
                              ))}
                              {Array.from({ length: i }).map((_, index) => (
                                <Star key={index} className="h-3 w-3 text-muted" />
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{product.totalSold} sold</Badge>
                            <span className="text-sm text-muted-foreground">{formatPrice(product.totalRevenue)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm mb-1">No sales data yet</p>
                    <p className="text-xs">Start selling to see your top products</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-3">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/account/vendor-dashboard/manage-products">Manage Products</Link>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Sales Analytics */}
            <Card className="md:col-span-2">
              <CardContent>
                <SalesChart data={salesAnalytics} />
              </CardContent>
            </Card>
            
           
          </div>
        </>
      )}
    </div>
  )
} 