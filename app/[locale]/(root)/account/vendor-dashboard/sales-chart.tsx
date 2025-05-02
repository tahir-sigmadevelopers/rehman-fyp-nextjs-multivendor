'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps
} from 'recharts'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'

interface SalesData {
  month: string
  amount: number
}

interface SalesChartProps {
  data: SalesData[]
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    let displayLabel = label;
    
    // If the label is showing "Invalid Date", try to create a better formatted version
    if (label && label.includes('Invalid Date')) {
      try {
        // Try to extract a valid date string from the actual data
        if (payload[0].payload && payload[0].payload.month) {
          displayLabel = formatMonthLabel(payload[0].payload.month);
        }
      } catch (error) {
        console.error('Error formatting tooltip label:', error);
        displayLabel = 'Unknown Date';
      }
    }
    
    return (
      <div className="bg-background border rounded-md p-2 shadow-sm">
        <p className="font-medium">{displayLabel}</p>
        <p className="text-primary">{formatPrice(payload[0].value || 0)}</p>
      </div>
    );
  }
  return null;
};

// Helper to format month labels
const formatMonthLabel = (monthStr: string) => {
  try {
    if (!monthStr || typeof monthStr !== 'string') {
      return 'Unknown Date';
    }
    
    const parts = monthStr.split('-');
    if (parts.length !== 2) {
      return monthStr; // Return original if not in expected format
    }
    
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
    
    if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
      return monthStr; // Return original if invalid numbers
    }
    
    const date = new Date(year, month);
    
    // Verify if date is valid
    if (isNaN(date.getTime())) {
      return monthStr; // Return original if invalid date
    }
    
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  } catch (error) {
    console.error('Error formatting month label:', error);
    return monthStr || 'Unknown Date';
  }
}

export default function SalesChart({ data }: SalesChartProps) {
  // Add console logging to debug data
  React.useEffect(() => {
    console.log('Sales chart data:', data);
  }, [data]);

  // Ensure data is valid
  const validData = Array.isArray(data) ? data.filter(item => 
    item && 
    typeof item === 'object' && 
    typeof item.month === 'string' && 
    typeof item.amount === 'number'
  ) : [];

  // Format data for display
  const chartData = validData.map(item => {
    // Log any items with potentially invalid month formats
    if (!item.month || typeof item.month !== 'string' || !item.month.includes('-')) {
      console.warn('Potentially invalid month format:', item);
    }
    
    return {
      ...item,
      formattedMonth: formatMonthLabel(item.month) // Add formatted month for display
    };
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Sales Analytics</CardTitle>
        <CardDescription>Your store performance over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {validData.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center border rounded-md bg-muted/40">
              <p className="text-sm text-muted-foreground">
                No sales data available yet. Check back after you make some sales.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="formattedMonth" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tickFormatter={(value) => `$${value}`}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="amount" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 