'use client'

import { ShoppingBag, Package, BarChart3, Settings } from 'lucide-react'
import Link from 'next/link'

export function EnhancedQuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Link 
        href="/account/vendor-dashboard/new-product" 
        className="group flex items-center gap-3 rounded-xl border p-4 transition-all hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:shadow-md"
      >
        <div className="p-3 rounded-full bg-amber-100 text-amber-700 group-hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400">
          <ShoppingBag className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-medium">Add Product</h3>
          <p className="text-sm text-muted-foreground">Create a new product listing</p>
        </div>
      </Link>
      
      <Link 
        href="/account/vendor-dashboard/manage-products" 
        className="group flex items-center gap-3 rounded-xl border p-4 transition-all hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:shadow-md"
      >
        <div className="p-3 rounded-full bg-blue-100 text-blue-700 group-hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
          <Package className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-medium">Manage Products</h3>
          <p className="text-sm text-muted-foreground">Edit or update your listings</p>
        </div>
      </Link>
      
      <Link 
        href="/account/vendor-dashboard/orders" 
        className="group flex items-center gap-3 rounded-xl border p-4 transition-all hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-950/20 hover:shadow-md"
      >
        <div className="p-3 rounded-full bg-green-100 text-green-700 group-hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400">
          <ShoppingBag className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-medium">Orders</h3>
          <p className="text-sm text-muted-foreground">Manage customer orders</p>
        </div>
      </Link>
      
      <Link 
        href="/account/vendor-dashboard/sales" 
        className="group flex items-center gap-3 rounded-xl border p-4 transition-all hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:shadow-md"
      >
        <div className="p-3 rounded-full bg-purple-100 text-purple-700 group-hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-medium">Analytics</h3>
          <p className="text-sm text-muted-foreground">View sales performance</p>
        </div>
      </Link>
    </div>
  )
} 