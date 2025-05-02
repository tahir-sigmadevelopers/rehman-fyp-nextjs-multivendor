'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Search, X, ExternalLink } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { getVendorOrders } from '@/lib/actions/order.actions'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDateTime, formatPrice } from '@/lib/utils'

// Define order status types for filtering
const ORDER_STATUS = {
  ALL: 'all',
  PENDING: 'pending',
  PAID: 'paid',
  DELIVERED: 'delivered'
} as const

type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS]

interface OrdersTableProps {
  initialOrders: any[]
  totalPages: number
  currentPage: number
  vendorId: string
}

export default function VendorOrdersTable({ 
  initialOrders, 
  totalPages, 
  currentPage,
  vendorId
}: OrdersTableProps) {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>(initialOrders)
  const [filteredOrders, setFilteredOrders] = useState<any[]>(initialOrders)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus>(ORDER_STATUS.ALL)
  
  // Fetch orders when the page changes
  const fetchOrders = async (page: number) => {
    setIsLoading(true)
    try {
      const response = await getVendorOrders({ vendorId, page })
      if (response.success) {
        setOrders(response.data || [])
        setFilteredOrders(response.data || [])
      } else {
        toast({
          variant: 'destructive',
          description: 'Failed to load orders. Please try again.',
        })
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast({
        variant: 'destructive',
        description: 'Failed to load orders. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Filter orders when search query or status filter changes
  useEffect(() => {
    let filtered = [...orders]
    
    // Apply status filter
    if (statusFilter !== ORDER_STATUS.ALL) {
      filtered = filtered.filter(order => {
        if (statusFilter === ORDER_STATUS.PENDING) return !order.isPaid
        if (statusFilter === ORDER_STATUS.PAID) return order.isPaid && !order.isDelivered
        if (statusFilter === ORDER_STATUS.DELIVERED) return order.isDelivered
        return true
      })
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const lowercaseQuery = searchQuery.toLowerCase()
      filtered = filtered.filter(order => 
        // Search by order ID
        order._id.toLowerCase().includes(lowercaseQuery) ||
        // Search by customer name
        (order.user?.name && order.user.name.toLowerCase().includes(lowercaseQuery)) ||
        // Search by product name
        order.items.some((item: any) => item.name.toLowerCase().includes(lowercaseQuery))
      )
    }
    
    setFilteredOrders(filtered)
  }, [searchQuery, statusFilter, orders])
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }
  
  const clearSearch = () => {
    setSearchQuery('')
  }
  
  const handleStatusChange = (value: string) => {
    setStatusFilter(value as OrderStatus)
  }
  
  const handlePageChange = (page: number) => {
    router.push(`/account/vendor-dashboard/orders?page=${page}`)
    fetchOrders(page)
  }
  
  const getOrderStatusBadge = (order: any) => {
    if (order.isDelivered) {
      return <Badge className="bg-green-500">Delivered</Badge>
    } else if (order.isPaid) {
      return <Badge className="bg-blue-500">Paid</Badge>
    } else {
      return <Badge variant="outline">Pending</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by order ID, customer name, or product..."
            className="pl-10 pr-10"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <button 
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </button>
          )}
        </div>
        
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ORDER_STATUS.ALL}>All Orders</SelectItem>
            <SelectItem value={ORDER_STATUS.PENDING}>Pending</SelectItem>
            <SelectItem value={ORDER_STATUS.PAID}>Paid</SelectItem>
            <SelectItem value={ORDER_STATUS.DELIVERED}>Delivered</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-10">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-10 border rounded-md">
          <p className="text-muted-foreground">No orders found.</p>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-2">
              Try a different search term or filter.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell className="font-medium">
                    <span className="font-mono text-xs">{order._id.substring(0, 10)}...</span>
                  </TableCell>
                  <TableCell>
                    {order.user?.name || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {formatDateTime(new Date(order.createdAt)).dateOnly}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate">
                      {order.items.map((item: any, index: number) => (
                        <span key={item.clientId}>
                          {item.name}
                          {index < order.items.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.items.reduce((total: number, item: any) => total + item.quantity, 0)} items
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatPrice(order.vendorItemsPrice || order.itemsPrice)}
                  </TableCell>
                  <TableCell>
                    {getOrderStatusBadge(order)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/account/orders/${order._id}`}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {currentPage > 1 && (
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    handlePageChange(currentPage - 1)
                  }} 
                />
              </PaginationItem>
            )}
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    handlePageChange(page)
                  }}
                  isActive={page === currentPage}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            {currentPage < totalPages && (
              <PaginationItem>
                <PaginationNext 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    handlePageChange(currentPage + 1)
                  }} 
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
} 