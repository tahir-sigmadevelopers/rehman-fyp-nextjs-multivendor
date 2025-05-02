import { auth } from '@/auth'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { getVendorProducts } from '@/lib/actions/product.server'
import { formatPrice } from '@/lib/utils'

export default async function VendorProductsPage() {
  const session = await auth()
  const { data: products } = await getVendorProducts(session?.user?.id || '')

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-3xl font-bold tracking-tight'>Products</h2>
        <Link href='/vendor/products/new'>
          <Button>
            <Plus className='mr-2 h-4 w-4' />
            Add Product
          </Button>
        </Link>
      </div>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products && products.length > 0 ? (
              products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell className='font-medium'>{product.name}</TableCell>
                  <TableCell>{formatPrice(product.price)}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <span className={`capitalize ${
                      product.status === 'published' ? 'text-green-600' :
                      product.status === 'draft' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {product.status}
                    </span>
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex justify-end gap-2'>
                      <Link href={`/vendor/products/${product._id}/edit`}>
                        <Button variant='ghost' size='icon'>
                          <Pencil className='h-4 w-4' />
                        </Button>
                      </Link>
                      <Button variant='ghost' size='icon' className='text-red-600'>
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className='text-center'>
                  No products found. Add your first product!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 