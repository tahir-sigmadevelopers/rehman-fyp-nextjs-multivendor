'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface EnhancedStatsCardProps {
  title: string
  value: string | number
  description: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  color: 'blue' | 'green' | 'amber' | 'purple' | 'red'
}

const colorStyles = {
  blue: {
    background: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    trendPositive: 'text-blue-700',
    trendNegative: 'text-red-700'
  },
  green: {
    background: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
    trendPositive: 'text-green-700',
    trendNegative: 'text-red-700'
  },
  amber: {
    background: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    trendPositive: 'text-amber-700',
    trendNegative: 'text-red-700'
  },
  purple: {
    background: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    trendPositive: 'text-purple-700',
    trendNegative: 'text-red-700'
  },
  red: {
    background: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
    trendPositive: 'text-green-700',
    trendNegative: 'text-red-700'
  }
}

export function EnhancedStatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  color = 'blue'
}: EnhancedStatsCardProps) {
  const styles = colorStyles[color]
  
  return (
    <Card className={cn("overflow-hidden border-none shadow-md", styles.background)}>
      <CardHeader className="flex flex-row items-center justify-between bg-white/80 dark:bg-gray-800/80 p-4 border-b">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", styles.iconBg)}>
          <Icon className={cn("h-4 w-4", styles.iconColor)} />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-2">
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
          
          {trend && (
            <div className="flex items-center mt-2">
              <span className={cn(
                "text-xs font-medium",
                trend.isPositive ? styles.trendPositive : styles.trendNegative
              )}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-muted-foreground ml-1">vs last month</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 