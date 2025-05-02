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
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Pencil, Trash2, Eye, Search, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { getVendorProducts, deleteProduct } from '@/lib/actions/product.server'
import { Input } from '@/components/ui/input'

export default function ProductsTable({ vendorId }: { vendorId: string }) {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getVendorProducts(vendorId)
        if (response.success) {
          setProducts(response.data || [])
          setFilteredProducts(response.data || [])
        } else {
          toast({
            variant: 'destructive',
            description: 'Failed to load products. Please try again.',
          })
        }
      } catch (error) {
        console.error('Error fetching products:', error)
        toast({
          variant: 'destructive',
          description: 'Failed to load products. Please try again.',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [vendorId])
  
  // Filter products when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products)
      return
    }
    
    const lowercaseQuery = searchQuery.toLowerCase()
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(lowercaseQuery) ||
      product.description?.toLowerCase().includes(lowercaseQuery) ||
      product.category?.toLowerCase().includes(lowercaseQuery) ||
      product.brand?.toLowerCase().includes(lowercaseQuery)
    )
    
    setFilteredProducts(filtered)
  }, [searchQuery, products])

  const handleDeleteProduct = async () => {
    if (!productToDelete) return
    
    try {
      const response = await deleteProduct(productToDelete)
      if (response.success) {
        const updatedProducts = products.filter(product => product._id !== productToDelete)
        setProducts(updatedProducts)
        setFilteredProducts(updatedProducts)
        toast({
          description: 'Product deleted successfully',
        })
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        description: error instanceof Error ? error.message : 'Failed to delete product',
      })
    } finally {
      setProductToDelete(null)
    }
  }
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }
  
  const clearSearch = () => {
    setSearchQuery('')
  }

  if (isLoading) {
    return <div className="flex justify-center py-10">Loading products...</div>
  }
  
  return (
    <>
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products by name, description, category, or brand..."
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
        {filteredProducts.length === 0 && searchQuery && (
          <p className="text-sm text-muted-foreground mt-2">
            No products found matching "{searchQuery}". Try a different search term.
          </p>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-md bg-gray-100">
                        {product.images && product.images[0] ? (
                          <Image 
                            src={product.images[0]} 
                            alt={product.name}
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gray-200">
                            <span className="text-xs text-gray-400">No image</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="font-medium truncate block max-w-[200px]" title={product.name}>
                          {product.name}
                        </span>
                        <span className="text-xs text-muted-foreground">{product.slug}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {product.brand || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {product.category || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatPrice(product.price)}</TableCell>
                  <TableCell>
                    <span className={product.stock <= 5 ? "text-red-500 font-medium" : ""}>
                      {product.stock || 0}
                      {product.stock <= 5 && product.stock > 0 && " (Low)"}
                      {product.stock === 0 && " (Out of stock)"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        product.isPublished 
                          ? "success" 
                          : "secondary"
                      }
                    >
                      {product.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/product/${product.slug}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/account/vendor-dashboard/edit-product/${product._id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-500"
                          onClick={() => setProductToDelete(product._id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {searchQuery ? 'No products found matching your search.' : 'No products found. Create your first product!'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!productToDelete} onOpenChange={(isOpen) => !isOpen && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this product. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteProduct}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 