'use client'

import { formatPrice } from '@/lib/utils'
import { ShoppingBag, Package, CircleDollarSign, TrendingUp, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface DashboardStatsProps {
  totalOrders: number
  pendingOrders: number
  totalRevenue: number
  totalProducts: number
  activeProducts: number
  avgOrderValue: number
  bestSellingProduct?: string
}

export function DashboardStats({
  totalOrders,
  pendingOrders,
  totalRevenue,
  totalProducts,
  activeProducts,
  avgOrderValue,
  bestSellingProduct = 'None'
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Orders Card */}
      <div className="rounded-xl overflow-hidden border shadow-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
        <div className="flex flex-row items-center justify-between bg-white/80 dark:bg-gray-800/80 p-4 border-b">
          <h3 className="text-base font-medium">Orders Overview</h3>
          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <ShoppingBag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div className="p-6">
          <div className="grid gap-6">
            <div className="space-y-2">
              <div className="text-2xl font-bold">{totalOrders}</div>
              <div className="text-xs text-muted-foreground uppercase">Total Orders</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-xl font-bold">{pendingOrders}</div>
                <div className="text-xs text-muted-foreground uppercase">Pending</div>
              </div>
              <div className="space-y-2">
                <div className="text-xl font-bold">{formatPrice(totalRevenue)}</div>
                <div className="text-xs text-muted-foreground uppercase">Total Sales</div>
              </div>
            </div>
            <Link
              href="/account/vendor-dashboard/orders"
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center"
            >
              View all orders
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>
      
      {/* Products Card */}
      <div className="rounded-xl overflow-hidden border shadow-md bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
        <div className="flex flex-row items-center justify-between bg-white/80 dark:bg-gray-800/80 p-4 border-b">
          <h3 className="text-base font-medium">Products</h3>
          <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div className="p-6">
          <div className="grid gap-6">
            <div className="space-y-2">
              <div className="text-2xl font-bold">{totalProducts}</div>
              <div className="text-xs text-muted-foreground uppercase">Total Products</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-xl font-bold">{activeProducts}</div>
                <div className="text-xs text-muted-foreground uppercase">
                  Active
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xl font-bold">{totalProducts - activeProducts}</div>
                <div className="text-xs text-muted-foreground uppercase">
                  Drafts
                </div>
              </div>
            </div>
            <Link
              href="/account/vendor-dashboard/manage-products"
              className="text-sm font-medium text-green-600 dark:text-green-400 hover:underline flex items-center"
            >
              Manage products
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Revenue Card */}
      <div className="rounded-xl overflow-hidden border shadow-md bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
        <div className="flex flex-row items-center justify-between bg-white/80 dark:bg-gray-800/80 p-4 border-b">
          <h3 className="text-base font-medium">Revenue</h3>
          <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <CircleDollarSign className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        <div className="p-6">
          <div className="grid gap-6">
            <div className="space-y-2">
              <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
              <div className="text-xs text-muted-foreground uppercase">Total Revenue</div>
            </div>
            <div className="space-y-2">
              <div className="text-xl font-bold">{formatPrice(avgOrderValue)}</div>
              <div className="text-xs text-muted-foreground uppercase">
                Avg. Order Value
              </div>
            </div>
            <Link
              href="/account/vendor-dashboard/sales"
              className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline flex items-center"
            >
              View analytics
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>
      
      {/* Performance Card */}
      <div className="rounded-xl overflow-hidden border shadow-md bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
        <div className="flex flex-row items-center justify-between bg-white/80 dark:bg-gray-800/80 p-4 border-b">
          <h3 className="text-base font-medium">Performance</h3>
          <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        <div className="p-6">
          <div className="grid gap-6">
            <div className="space-y-2">
              <div className="text-2xl font-bold truncate">{bestSellingProduct}</div>
              <div className="text-xs text-muted-foreground uppercase">Best Seller</div>
            </div>
            <div className="space-y-2">
              <div className="h-10 flex items-center">
                <div className="text-sm">View detailed insights in analytics</div>
              </div>
            </div>
            <Link
              href="/account/vendor-dashboard/sales"
              className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline flex items-center"
            >
              Full analytics
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 