import { auth } from '@/auth'
import { getVendorProducts } from '@/lib/actions/product.server'
import { ProductForm } from './product-form'

export default async function ProductActionPage({
  params,
}: {
  params: { action: string }
}) {
  const session = await auth()
  const isEdit = params.action !== 'new'
  const { data: products } = await getVendorProducts(session?.user?.id || '')
  const product = isEdit ? products?.find((p) => p._id === params.action) : null

  return (
    <div className='space-y-4'>
      <h2 className='text-3xl font-bold tracking-tight'>
        {isEdit ? 'Edit Product' : 'Add New Product'}
      </h2>
      <ProductForm product={product} />
    </div>
  )
} 