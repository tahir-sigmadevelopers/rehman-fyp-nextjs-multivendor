import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getVendorSalesAnalytics, getVendorTopProducts } from '@/lib/actions/order.actions'
import { Separator } from '@/components/ui/separator'
import { Metadata } from 'next'
import { formatPrice } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarIcon, TrendingUp, CircleDollarSign, BarChart3 } from 'lucide-react'
import { MonthlySalesChart, ProductShareChart } from '../components/sales-charts'

export const metadata: Metadata = {
  title: 'Sales Analytics',
  description: 'View your store performance analytics',
}

export default async function SalesAnalyticsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/sign-in')
  }

  // Get vendor sales analytics
  const analyticsResponse = await getVendorSalesAnalytics(session.user.id)
  const analytics = analyticsResponse.success ? analyticsResponse.data : null
  
  // Get top products
  const topProductsResponse = await getVendorTopProducts(session.user.id, 5)
  const topProducts = topProductsResponse.success ? topProductsResponse.data : []
  
  // Prepare data for charts
  const monthlySales = analytics?.monthlySales || []
  const monthlyData = monthlySales.map(item => ({
    name: item.month.split('-')[1], // Just show month number
    sales: item.amount
  }))
  
  // Create data for pie chart
  const productShareData = topProducts.map(product => ({
    name: product.name,
    value: product.totalRevenue
  }))

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Sales Analytics</h3>
        <p className="text-sm text-muted-foreground">
          View detailed statistics about your store performance
        </p>
      </div>
      <Separator />
      
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(analytics?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">Lifetime sales revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">All time orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.totalOrders 
                ? formatPrice((analytics.totalRevenue || 0) / analytics.totalOrders) 
                : formatPrice(0)}
            </div>
            <p className="text-xs text-muted-foreground">Revenue per order</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products Sold</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalProductsSold || 0}</div>
            <p className="text-xs text-muted-foreground">Units sold</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Sales</CardTitle>
              <CardDescription>Your revenue over the past months</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                <MonthlySalesChart data={monthlyData} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="products" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Your best selling products by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ProductShareChart data={productShareData} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
                <CardDescription>Products ranked by sales volume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProducts.length > 0 ? (
                    topProducts.map((product, i) => (
                      <div key={product.productId || i} className="flex items-center">
                        <div className="h-9 w-9 rounded overflow-hidden mr-3 bg-muted flex-shrink-0">
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.name} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-muted" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-muted-foreground">{product.totalSold} sold</span>
                            <span className="text-sm font-medium">{formatPrice(product.totalRevenue)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-sm text-muted-foreground">No products sold yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 