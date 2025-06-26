'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Store } from '@/components/ui/icons'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface OrderStatsProps {
  pendingOrders: number
  totalOrders: number
  totalSales: number
  title?: string
}

export function VendorOrdersCard({
  initialStats = { pendingOrders: 0, totalOrders: 0, totalSales: 0 },
}: {
  initialStats?: OrderStatsProps
}) {
  const [stats, setStats] = useState(initialStats)
  const [loading, setLoading] = useState(true)

  // Fetch the latest stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        // This would be a call to your API endpoint
        // For now, we'll use the initial stats with a delay to simulate loading
        setTimeout(() => {
          setStats(initialStats)
          setLoading(false)
        }, 1000)
      } catch (error) {
        console.error('Error fetching order stats:', error)
        setLoading(false)
      }
    }

    fetchStats()
  }, [initialStats])

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between bg-muted/50 p-4">
        <CardTitle className="text-base font-medium">Orders Overview</CardTitle>
        <Store className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-10 w-[40%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        ) : (
          <div className="grid gap-6">
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {stats.totalOrders}
              </div>
              <div className="text-xs text-muted-foreground uppercase">
                Total Orders
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-xl font-bold">
                  {stats.pendingOrders}
                </div>
                <div className="text-xs text-muted-foreground uppercase">
                  Pending
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xl font-bold">
                  {formatPrice(stats.totalSales)}
                </div>
                <div className="text-xs text-muted-foreground uppercase">
                  Total Sales
                </div>
              </div>
            </div>
            <Link
              href="/account/vendor-dashboard/orders"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all orders
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 